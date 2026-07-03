import "../css/toolbar.css";

export default function Toolbar({ search, onSearchChange, onAddItem, onOpenStatusManager }) {
  return (
    <div className="toolbar">
      <input
        className="toolbar-search"
        placeholder="🔍 Search items..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      <button className="toolbar-add-btn" onClick={onAddItem}>
        + Add Item
      </button>
      <button
        onClick={onOpenStatusManager}
        style={{
          padding: "6px 14px",
          background: "#8b5cf6",
          color: "white",
          border: "none",
          borderRadius: 4,
          cursor: "pointer",
          fontSize: 13,
        }}
      >
        🎨 Manage Status
      </button>
    </div>
  );
}
