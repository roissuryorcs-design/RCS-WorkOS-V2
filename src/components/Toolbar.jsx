import "../css/toolbar.css";

export default function Toolbar({ search, onSearchChange, onAddItem }) {
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
    </div>
  );
}
