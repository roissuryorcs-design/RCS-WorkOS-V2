const HEADER_FILL = "FF1F2937"; // slate-800
const HEADER_FONT = "FFFFFFFF";
const GROUP_FONT = "FFFFFFFF";

// Flattens the item tree into render-order rows with a depth, same
// traversal shape as the table itself (BoardTable groups by item.group at
// the top level, children nest under their parent regardless of group).
function flattenItems(items) {
  const rows = [];
  const walk = (list, depth) => {
    for (const item of list) {
      rows.push({ item, depth });
      if (item.children && item.children.length > 0) walk(item.children, depth + 1);
    }
  };
  walk(items, 0);
  return rows;
}

function parseFiles(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [{ url: raw, name: String(raw).split("/").pop() || "file" }];
  }
}

// Renders one cell's value into `cell` according to the column's type —
// mirrors Row.jsx's renderCell switch, but producing plain/hyperlink
// Excel values instead of React inputs.
function writeCell(cell, col, item) {
  const value = item[col.id];
  const type = col.type || "text";

  switch (type) {
    case "status": {
      const label = value || "";
      cell.value = label;
      const color = col.statuses?.[label];
      if (color) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + color.replace("#", "").toUpperCase() } };
        cell.font = { color: { argb: "FFFFFFFF" }, bold: true };
      }
      cell.alignment = { horizontal: "center", vertical: "middle" };
      return;
    }
    case "timeline": {
      const t = value && typeof value === "object" ? value : {};
      cell.value = t.start && t.end ? `${t.start} → ${t.end}` : "";
      return;
    }
    case "progress": {
      const num = typeof value === "number" ? value : parseFloat(value) || 0;
      cell.value = num / 100;
      cell.numFmt = "0%";
      // Same stage-color lookup the app itself uses for this column (via
      // col.progressStages) — picks the highest stage whose threshold the
      // value has reached, so the export's coloring matches whatever the
      // user actually configured, not a hardcoded palette.
      const stages = col.progressStages;
      if (Array.isArray(stages) && stages.length > 0) {
        const sorted = [...stages].sort((a, b) => a.value - b.value);
        let matched = sorted[0];
        for (const s of sorted) {
          if (num >= s.value) matched = s;
        }
        if (matched?.color) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + matched.color.replace("#", "").toUpperCase() } };
          cell.font = { color: { argb: "FFFFFFFF" }, bold: true };
        }
      }
      cell.alignment = { horizontal: "center" };
      return;
    }
    case "checkbox": {
      cell.value = value ? "✓" : "";
      cell.alignment = { horizontal: "center" };
      return;
    }
    case "number": {
      cell.value = value === "" || value == null ? null : Number(value);
      return;
    }
    case "files": {
      const files = parseFiles(value);
      if (files.length === 0) {
        cell.value = "";
      } else if (files.length === 1) {
        cell.value = { text: files[0].name || files[0].url, hyperlink: files[0].url };
        cell.font = { color: { argb: "FF2563EB" }, underline: true };
      } else {
        // ExcelJS cells only support a single hyperlink each — multiple
        // attachments get a rich-text list of names (still readable/
        // copyable) with the first file as the cell's actual clickable
        // link, rather than silently dropping the rest.
        cell.value = { text: files.map((f) => f.name || f.url).join(", "), hyperlink: files[0].url };
        cell.font = { color: { argb: "FF2563EB" }, underline: true };
        cell.alignment = { wrapText: true };
      }
      return;
    }
    case "formula":
    case "numbering":
    case "priority":
    case "phone":
    case "people":
    case "date":
    default:
      cell.value = value == null ? "" : String(value);
      return;
  }
}

// Builds a formatted .xlsx (real hyperlinks for file/document columns,
// colored status cells, colored group header rows, tree-indented item
// names) and triggers a browser download. `columns` should already be
// filtered/ordered to what's visible (ColumnContext's `visibleColumns`).
export async function exportBoardToExcel({ boardTitle, items, columns, groups, groupColors }) {
  // Lazy-loaded — exceljs is a large library and this feature is only
  // used when the user clicks Export, not something every page load
  // should pay for (it nearly doubled the app's initial JS bundle when
  // statically imported).
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "RCS-WorkOS";
  workbook.created = new Date();
  const sheet = workbook.addWorksheet(boardTitle?.slice(0, 31) || "Board");

  sheet.columns = columns.map((col) => ({
    header: col.label,
    key: col.id,
    width: Math.max(12, Math.round((col.width || 120) / 7)),
  }));

  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } };
    cell.font = { color: { argb: HEADER_FONT }, bold: true };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  const itemsByGroup = {};
  for (const item of items) {
    const g = item.group || "";
    if (!itemsByGroup[g]) itemsByGroup[g] = [];
    itemsByGroup[g].push(item);
  }

  for (const groupName of groups) {
    const groupItems = itemsByGroup[groupName] || [];
    if (groupItems.length === 0) continue;

    const groupRow = sheet.addRow([groupName]);
    sheet.mergeCells(groupRow.number, 1, groupRow.number, columns.length);
    const groupColor = groupColors?.[groupName] || "#3b82f6";
    groupRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + groupColor.replace("#", "").toUpperCase() } };
    groupRow.getCell(1).font = { color: { argb: GROUP_FONT }, bold: true, size: 12 };
    groupRow.getCell(1).alignment = { vertical: "middle" };

    for (const { item, depth } of flattenItems(groupItems)) {
      const row = sheet.addRow({});
      columns.forEach((col, i) => {
        const cell = row.getCell(i + 1);
        if (col.id === "item") {
          cell.value = `${"    ".repeat(depth)}${depth > 0 ? "↳ " : ""}${item[col.id] || ""}`;
        } else {
          writeCell(cell, col, item);
        }
      });
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(boardTitle || "board").replace(/[^\w\- ]/g, "").trim() || "board"}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
