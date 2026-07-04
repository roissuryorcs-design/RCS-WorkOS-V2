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
  const { addColumn } = useColumns();

  const handleAddColumn = () => {
    const name = prompt("Enter column name:");
    if (name && name.trim()) {
      addColumn(name.trim());
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

      {/* Tombol Add Column */}
      <button className="toolbar-column-btn" onClick={handleAddColumn}>
        + Add Column
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
