import { useTheme } from "../context/ThemeContext";
import { useColumns } from "../context/ColumnContext";
import "../css/toolbar.css";

export default function Toolbar({
  search,
  onSearchChange,
  onAddGroup,
  onUndo,
  onExport,
  canUndo,
}) {
  const { theme, toggleTheme } = useTheme();
  const { addColumn, columns, toggleColumn } = useColumns();

  const handleAddColumn = () => {
    const name = prompt("Enter column name:");
    if (name && name.trim()) {
      addColumn(name.trim());
    }
  };

  const handleManageColumns = () => {
    const hiddenCols = columns.filter(c => !c.visible && c.id !== 'action');
    const visibleCols = columns.filter(c => c.visible && c.id !== 'action');
    
    let message = "=== MANAGE COLUMNS ===\n\n";
    message += "Visible columns:\n";
    visibleCols.forEach((c, i) => {
      message += `  ${i+1}. ${c.label}\n`;
    });
    message += "\nHidden columns:\n";
    if (hiddenCols.length === 0) {
      message += "  (none)\n";
    } else {
      hiddenCols.forEach((c, i) => {
        message += `  ${i+1}. ${c.label}\n`;
      });
    }
    message += "\nEnter number to toggle visibility (or 'cancel' to close):";
    
    const input = prompt(message);
    if (input === null) return;
    const idx = parseInt(input) - 1;
    if (!isNaN(idx) && idx >= 0 && idx < hiddenCols.length) {
      toggleColumn(hiddenCols[idx].id);
    } else if (!isNaN(idx) && idx >= 0 && idx < visibleCols.length) {
      toggleColumn(visibleCols[idx].id);
    } else {
      alert("Invalid selection.");
    }
  };

  return (
    <div className="toolbar-sticky">
      <input
        className="toolbar-search"
        placeholder="🔍 Search items..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />

      <button className="toolbar-add-btn" onClick={onAddGroup}>
        + Add new group
      </button>

      <button className="toolbar-column-btn" onClick={handleAddColumn}>
        + Add Column
      </button>

      <button className="toolbar-column-btn" onClick={handleManageColumns}>
        📋 Manage Columns
      </button>

      <button
        onClick={onUndo}
        disabled={!canUndo}
        className="toolbar-undo-btn"
        style={{
          opacity: canUndo ? 1 : 0.5,
          cursor: canUndo ? "pointer" : "not-allowed",
        }}
      >
        ↩ Undo
      </button>

      <button className="toolbar-export-btn" onClick={onExport}>
        📤 Export
      </button>

      <button onClick={toggleTheme} className="toolbar-theme-btn">
        {theme === "light" ? "🌙 Dark" : "☀️ Light"}
      </button>
    </div>
  );
}
