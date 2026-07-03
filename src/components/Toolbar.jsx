import "../css/toolbar.css";

export default function Toolbar({ 
  search, 
  onSearchChange, 
  onAddGroup,
  onUndo,
  onExport,
  canUndo 
}) {
  return (
    <div className="toolbar">
      <input
        className="toolbar-search"
        placeholder="🔍 Search items..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      
      <button 
        className="toolbar-add-btn" 
        onClick={onAddGroup}
        style={{
          padding: "6px 14px",
          background: "#3b82f6",
          color: "white",
          border: "none",
          borderRadius: 4,
          cursor: "pointer",
          fontSize: 13,
        }}
      >
        + Add new group
      </button>

      <button
        onClick={onUndo}
        disabled={!canUndo}
        style={{
          padding: "6px 14px",
          background: canUndo ? "transparent" : "#e5e7eb",
          color: canUndo ? "#4b5563" : "#9ca3af",
          border: "1px solid #d1d5db",
          borderRadius: 4,
          cursor: canUndo ? "pointer" : "not-allowed",
          fontSize: 13,
        }}
      >
        ↩ Undo
      </button>

      <button
        onClick={onExport}
        style={{
          padding: "6px 14px",
          background: "transparent",
          color: "#4b5563",
          border: "1px solid #d1d5db",
          borderRadius: 4,
          cursor: "pointer",
          fontSize: 13,
        }}
      >
        📤 Export
      </button>
    </div>
  );
}
