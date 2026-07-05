import { useTheme } from "../context/ThemeContext";
import "../css/toolbar.css";

export default function Toolbar({
  search,
  onSearchChange,
  onUndo,
  onExport,
  canUndo,
  onOpenColumnManager, // ← Manage Columns tetap
}) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="toolbar-sticky">
      <input
        className="toolbar-search"
        placeholder="🔍 Search items..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />

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

      {/* Manage Columns - TETAP */}
      <button className="toolbar-column-btn" onClick={onOpenColumnManager}>
        📋 Manage Columns
      </button>

      <button onClick={toggleTheme} className="toolbar-theme-btn">
        {theme === "light" ? "🌙 Dark" : "☀️ Light"}
      </button>
    </div>
  );
}
