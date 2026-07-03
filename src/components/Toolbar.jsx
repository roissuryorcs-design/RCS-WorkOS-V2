import { useTheme } from "../context/ThemeContext";
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

  return (
    <div 
      className="toolbar"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "var(--bg-secondary)",
        padding: "8px 0",
        borderBottom: "1px solid var(--border-color)",
        marginBottom: 16,
      }}
    >
      <input
        className="toolbar-search"
        placeholder="🔍 Search items..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />

      <button className="toolbar-add-btn" onClick={onAddGroup}>
        + Add new group
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

      {/* TOMBOL DARK MODE */}
      <button
        onClick={toggleTheme}
        className="toolbar-theme-btn"
        style={{
          padding: "6px 14px",
          background: "var(--bg-hover)",
          color: "var(--text-secondary)",
          border: "1px solid var(--border-color)",
          borderRadius: 4,
          cursor: "pointer",
          fontSize: 13,
          transition: "0.2s",
        }}
      >
        {theme === "light" ? "🌙 Dark" : "☀️ Light"}
      </button>
    </div>
  );
}
