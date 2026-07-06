import { useState } from "react";

export default function ColumnManager({
  columns,
  onAddColumn,
  onDeleteColumn,
  onToggleColumn,
  onRenameColumn,
  onResetColumns,
  onClose,
}) {
  const [newColumnName, setNewColumnName] = useState("");
  const [newColumnType, setNewColumnType] = useState("text");
  const [editingId, setEditingId] = useState(null);
  const [editLabel, setEditLabel] = useState("");

  const columnTypes = [
    { value: "text", label: "📝 Text" },
    { value: "status", label: "🏷️ Status" },
    { value: "date", label: "📅 Date" },
    { value: "people", label: "👤 People" },
    { value: "number", label: "🔢 Number" },
    { value: "files", label: "📎 Files" },
    { value: "checkbox", label: "☑️ Checkbox" },
    { value: "progress", label: "📊 Progress" },
  ];

  const handleAdd = () => {
    if (!newColumnName.trim()) return;
    onAddColumn(newColumnName.trim(), newColumnType);
    setNewColumnName("");
    setNewColumnType("text");
  };

  const startRename = (col) => {
    if (col.id === "item") return;
    setEditingId(col.id);
    setEditLabel(col.label);
  };

  const saveRename = () => {
    if (editLabel.trim()) {
      onRenameColumn(editingId, editLabel.trim());
    }
    setEditingId(null);
    setEditLabel("");
  };

  const cancelRename = () => {
    setEditingId(null);
    setEditLabel("");
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--bg-modal)",
          borderRadius: 8,
          padding: 24,
          maxWidth: 450,
          width: "100%",
          maxHeight: "80vh",
          overflowY: "auto",
          color: "var(--text-primary)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginBottom: 16, fontSize: 18 }}>Manage Columns</h3>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>
          Click on a column label to rename it.
        </p>

        <div style={{ marginBottom: 16 }}>
          {columns.map((col) => (
            <div
              key={col.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "4px 0",
                borderBottom: "1px solid var(--border-light)",
              }}
            >
              <input
                type="checkbox"
                checked={col.visible}
                onChange={() => onToggleColumn(col.id)}
                disabled={col.id === "item"}
                style={{ cursor: "pointer" }}
              />
              {editingId === col.id ? (
                <input
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  onBlur={saveRename}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveRename();
                    if (e.key === "Escape") cancelRename();
                  }}
                  autoFocus
                  style={{
                    flex: 1,
                    padding: "2px 6px",
                    border: "1px solid var(--btn-primary-bg)",
                    borderRadius: 4,
                    fontSize: 14,
                    background: "var(--bg-input)",
                    color: "var(--text-primary)",
                    outline: "none",
                  }}
                />
              ) : (
                <span
                  style={{
                    flex: 1,
                    fontSize: 14,
                    cursor: col.id === "item" ? "default" : "pointer",
                    color: col.id === "item" ? "var(--text-muted)" : "var(--text-primary)",
                  }}
                  onClick={() => startRename(col)}
                  title={col.id === "item" ? "Cannot rename fixed column" : "Click to rename"}
                >
                  {col.label || col.id}
                  {col.id === "item" && " (fixed)"}
                </span>
              )}
              {col.id !== "item" && (
                <button
                  onClick={() => onDeleteColumn(col.id)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#ef4444",
                    cursor: "pointer",
                    fontSize: 16,
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <input
            placeholder="New column name"
            value={newColumnName}
            onChange={(e) => setNewColumnName(e.target.value)}
            style={{
              flex: 1,
              padding: "6px 10px",
              border: "1px solid var(--border-dark)",
              borderRadius: 4,
              fontSize: 13,
              background: "var(--bg-input)",
              color: "var(--text-primary)",
              minWidth: 120,
            }}
          />
          <select
            value={newColumnType}
            onChange={(e) => setNewColumnType(e.target.value)}
            style={{
              padding: "6px 10px",
              border: "1px solid var(--border-dark)",
              borderRadius: 4,
              fontSize: 13,
              background: "var(--bg-input)",
              color: "var(--text-primary)",
              cursor: "pointer",
            }}
          >
            {columnTypes.map(ct => (
              <option key={ct.value} value={ct.value}>{ct.label}</option>
            ))}
          </select>
          <button
            onClick={handleAdd}
            style={{
              padding: "6px 14px",
              background: "var(--btn-primary-bg)",
              color: "var(--btn-primary-text)",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            Add
          </button>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onResetColumns}
            style={{
              flex: 1,
              padding: "8px",
              background: "var(--bg-hover)",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 13,
              color: "var(--text-secondary)",
            }}
          >
            Reset to Default
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "8px",
              background: "var(--btn-primary-bg)",
              color: "var(--btn-primary-text)",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
