import "../css/toolbar.css";

export default function Toolbar({
  search,
  onSearchChange,
  onAddGroup,
  onUndo,
  onExport,
  canUndo,
}) {
  return (
    <div className="toolbar">
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
    </div>
  );
}
