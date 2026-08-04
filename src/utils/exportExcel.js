import {
  computeOwnProgress,
  computeCascadedDisplayPercent,
  computeAbsoluteWeight,
  resolveIndependentWeight,
  resolveSelfWeight,
} from "./progressWeights";

const HEADER_FILL = "FF1F2937"; // slate-800
const HEADER_FONT = "FFFFFFFF";
const GROUP_FONT = "FFFFFFFF";

// Flattens the item tree into render-order rows with a depth, a
// numberPath ("1", "1.1", "1.1.1", …), a `continues` array (one bool per
// ancestor level: does that ancestor have a following sibling below, i.e.
// does its vertical connector line keep going past this row — the same
// bookkeeping LandingPage.jsx's flattenTree() uses for its mockup's SVG
// lines, reused here to draw real ones with Unicode box-drawing
// characters), and — per progress-type column id — this row's own
// "absolute weight" chained down from the root. That last part mirrors
// Row.jsx's own top-down pass exactly (parentAbsoluteWeights threaded
// into each recursive call) since a child's cascaded/cumulative % needs
// its parent's already-resolved absolute weight, not just its own.
function flattenItems(items, progressColumnIds) {
  const rows = [];
  const walk = (list, depth, prefix, continues, parentAbsoluteWeights) => {
    list.forEach((item, i) => {
      const isLast = i === list.length - 1;
      const numberPath = prefix ? `${prefix}.${i + 1}` : String(i + 1);

      const myAbsoluteWeights = {};
      progressColumnIds.forEach((colId) => {
        const weightInfo = depth === 0
          ? resolveIndependentWeight(item, colId)
          : resolveSelfWeight(list, item.id, colId);
        const parentAbsoluteWeight = parentAbsoluteWeights[colId] ?? 100;
        myAbsoluteWeights[colId] = computeAbsoluteWeight(weightInfo.resolvedWeight, parentAbsoluteWeight);
      });

      rows.push({ item, depth, numberPath, continues, isLast, siblings: list, parentAbsoluteWeights });
      if (item.children && item.children.length > 0) {
        walk(item.children, depth + 1, numberPath, [...continues, !isLast], myAbsoluteWeights);
      }
    });
  };
  walk(items, 0, "", [], {});
  return rows;
}

// "│   " if that ancestor level still has more siblings coming (line
// keeps going down past this row), "    " (blank) once it's the last
// child at that level (nothing left below to connect to). The row's own
// branch uses "├─ " (more siblings follow) or "└─ " (last child).
function treePrefix(depth, continues, isLast) {
  if (depth === 0) return "";
  const lanes = continues.map((c) => (c ? "│   " : "    ")).join("");
  return lanes + (isLast ? "└─ " : "├─ ");
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
// Excel values instead of React inputs. `tree` ({depth, continues, isLast})
// is only used by the "progress" case, matching the Item column's own
// tree-line treatment for non-top-level rows.
function writeCell(cell, col, item, numberPath, tree) {
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
      if (!tree || tree.depth === 0) {
        // Top-level rows: own weighted rollup (BoardTable's own "Σ XX%"
        // for a parent, or the stage's own value if it's a childless
        // top-level item) — NOT item[col.id] directly, which a parent
        // generally has no raw value of its own for at all (its % is
        // entirely a rollup computed from children). Data Bar conditional
        // formatting (added afterwards) targets exactly these cells.
        const num = computeOwnProgress(item, col.id);
        cell.value = num / 100;
        cell.numFmt = "0%";
        cell.alignment = { horizontal: "center" };
      } else {
        // Sub-items: the *cumulative* contribution to the whole board —
        // own progress × this row's absolute weight (its true share of
        // the whole tree, chaining every ancestor's relative weight) —
        // same number Row.jsx computes as displayPercent, not the raw
        // value sitting inside a leaf's own little stage/progress pill
        // (which is what computeOwnProgress alone would give here, and
        // reads as misleading out of context). No data bar (a bar that
        // can't shrink with depth like the board's own would look
        // identical at every level) — same tree-line prefix as the Item
        // column instead, plus this cumulative percentage as plain text.
        const ownProgress = computeOwnProgress(item, col.id);
        const weightInfo = resolveSelfWeight(tree.siblings, item.id, col.id);
        const parentAbsoluteWeight = tree.parentAbsoluteWeights[col.id] ?? 100;
        const cumulative = computeCascadedDisplayPercent(ownProgress, weightInfo.resolvedWeight, parentAbsoluteWeight);
        cell.value = `${treePrefix(tree.depth, tree.continues, tree.isLast)}${cumulative}%`;
        cell.font = { name: "Courier New" };
        cell.alignment = { horizontal: "left" };
      }
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

  // Row numbers of depth-0 items, per progress column index — the Data
  // Bar rule only targets these specific cells (see below), since
  // top-level-only rows are scattered between group headers and indented
  // sub-item rows, not one contiguous block.
  const topLevelRowsByProgressCol = {};
  const progressColumnIds = columns.filter((c) => c.type === "progress").map((c) => c.id);

  for (const groupName of groups) {
    const groupItems = itemsByGroup[groupName] || [];
    if (groupItems.length === 0) continue;

    const groupRow = sheet.addRow([groupName]);
    sheet.mergeCells(groupRow.number, 1, groupRow.number, columns.length);
    const groupColor = groupColors?.[groupName] || "#3b82f6";
    groupRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + groupColor.replace("#", "").toUpperCase() } };
    groupRow.getCell(1).font = { color: { argb: GROUP_FONT }, bold: true, size: 12 };
    groupRow.getCell(1).alignment = { vertical: "middle" };

    for (const { item, depth, numberPath, continues, isLast, siblings, parentAbsoluteWeights } of flattenItems(groupItems, progressColumnIds)) {
      const row = sheet.addRow({});
      // Native Excel outline grouping — gives sub-items real collapsible
      // +/- tree controls in the row gutter (Data > Group's own feature),
      // on top of the drawn tree-line prefix below. Depth 0 rows aren't
      // grouped (nothing to collapse them under).
      if (depth > 0) row.outlineLevel = depth;
      columns.forEach((col, i) => {
        const cell = row.getCell(i + 1);
        if (col.id === "item") {
          cell.value = treePrefix(depth, continues, isLast) + (item[col.id] || "");
          // Box-drawing characters only line up into clean vertical lines
          // in a monospace font — a proportional font (Calibri/Arial, the
          // usual defaults) renders "│" at a different width than letters,
          // breaking the illusion after a couple of rows. Courier New is
          // the one monospace font reliably bundled with every Office-
          // compatible suite (Excel, WPS, LibreOffice, Google Sheets).
          cell.font = { name: "Courier New" };
        } else {
          writeCell(cell, col, item, numberPath, { depth, continues, isLast, siblings, parentAbsoluteWeights });
          if (col.type === "progress" && depth === 0) {
            if (!topLevelRowsByProgressCol[i]) topLevelRowsByProgressCol[i] = [];
            topLevelRowsByProgressCol[i].push(row.number);
          }
        }
      });
    }
  }

  // Native Excel Data Bar — an actual in-cell bar whose fill width is
  // proportional to the value, only on top-level item rows (by request —
  // sub-item rows show the tree-line + plain % from writeCell above
  // instead; a bar that can't shrink with depth like the board's own
  // would look identical regardless of level, which reads as misleading
  // rather than helpful). The ref is a space-separated union of each
  // individual depth-0 row's cell, not a single contiguous range, since
  // those rows are scattered between group headers and sub-items.
  columns.forEach((col, i) => {
    if (col.type !== "progress") return;
    const rowNumbers = topLevelRowsByProgressCol[i];
    if (!rowNumbers || rowNumbers.length === 0) return;
    const letter = columnLetter(i + 1);
    const ref = rowNumbers.map((r) => `${letter}${r}`).join(" ");
    sheet.addConditionalFormatting({
      ref,
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

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(boardTitle || "board").replace(/[^\w\- ]/g, "").trim() || "board"}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
