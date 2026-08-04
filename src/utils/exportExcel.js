import { computeOwnProgress } from "./progressWeights";

const HEADER_FILL = "FF1F2937"; // slate-800
const HEADER_FONT = "FFFFFFFF";
const GROUP_FONT = "FFFFFFFF";

// Flattens the item tree into render-order rows with a depth and a
// numberPath ("1", "1.1", "1.1.1", …) — same traversal shape and
// numbering scheme as the table itself (BoardTable seeds numberPath as
// String(taskIndex + 1) per top-level item, Row.jsx extends it per child
// as `${numberPath}.${childIndex + 1}`). The Nomer column has no stored
// value of its own — it's purely each item's position among its siblings,
// computed the same way here.
function flattenItems(items) {
  const rows = [];
  const walk = (list, depth, prefix) => {
    list.forEach((item, i) => {
      const numberPath = prefix ? `${prefix}.${i + 1}` : String(i + 1);
      rows.push({ item, depth, numberPath });
      if (item.children && item.children.length > 0) walk(item.children, depth + 1, numberPath);
    });
  };
  walk(items, 0, "");
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

// Standard base-26 column-index -> letter conversion (1 -> A, 27 -> AA, …) —
// needed to build conditional-formatting range refs like "C2:C40" since
// ExcelJS doesn't expose a ready helper for this on a bare column index.
function columnLetter(n) {
  let s = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

// Renders one cell's value into `cell` according to the column's type —
// mirrors Row.jsx's renderCell switch, but producing plain/hyperlink
// Excel values instead of React inputs.
function writeCell(cell, col, item, numberPath) {
  const value = item[col.id];
  const type = col.type || "text";

  switch (type) {
    case "numbering":
      cell.value = numberPath;
      cell.alignment = { horizontal: "center" };
      return;
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
      // Mirrors what the board itself shows (BoardTable's "Σ XX%" for a
      // parent, or the stage's own value for a leaf) — NOT item[col.id]
      // directly. A parent item generally has no raw value of its own at
      // all; its displayed % is entirely a weighted rollup computed from
      // its children (computeWeightedProgress), so reading item[col.id]
      // straight read as 0% for every non-leaf row.
      const num = computeOwnProgress(item, col.id);
      cell.value = num / 100;
      cell.numFmt = "0%";
      // Visual fill (an actual in-cell bar whose width is proportional to
      // the value, not just a flat color) is applied afterwards via a
      // native Excel Data Bar conditional-formatting rule over the whole
      // column — see addProgressDataBars below. A flat per-cell fill color
      // can't represent "how much" the way a bar can from a single column.
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

    for (const { item, depth, numberPath } of flattenItems(groupItems)) {
      const row = sheet.addRow({});
      // Native Excel outline grouping — gives sub-items real collapsible
      // +/- tree controls in the row gutter (Data > Group's own feature),
      // the closest thing Excel has to the board's own tree hierarchy.
      // Depth 0 rows aren't grouped (nothing to collapse them under).
      if (depth > 0) row.outlineLevel = depth;
      columns.forEach((col, i) => {
        const cell = row.getCell(i + 1);
        if (col.id === "item") {
          cell.value = item[col.id] || "";
          // Native cell indent (Excel's own stepped-indent rendering,
          // shows as an actual "├─"-style tree look with outline grouping
          // enabled above) instead of hand-rolled leading spaces.
          cell.alignment = { indent: depth * 2 };
        } else {
          writeCell(cell, col, item, numberPath);
        }
      });
    }
  }

  // Native Excel Data Bar — an actual in-cell bar whose fill width is
  // proportional to each row's own percentage, layered under the "0%"
  // text already set on the cell. Reads much closer to the app's real
  // progress bar than a flat per-cell color ever could from one column,
  // and needs the final row count so it runs after all rows exist.
  // A single solid color, by request — an earlier red/yellow/green
  // version was tried and the user preferred plain blue.
  const lastRow = sheet.lastRow?.number;
  if (lastRow && lastRow > 1) {
    columns.forEach((col, i) => {
      if (col.type !== "progress") return;
      const letter = columnLetter(i + 1);
      sheet.addConditionalFormatting({
        ref: `${letter}2:${letter}${lastRow}`,
        rules: [
          {
            type: "dataBar",
            cfvo: [{ type: "num", value: 0 }, { type: "num", value: 1 }],
            color: { argb: "FF3B82F6" },
            showValue: true,
            gradient: false,
          },
        ],
      });
    });
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
