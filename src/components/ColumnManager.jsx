import { useState } from "react";

export default function ColumnManager({
  columns,
  onToggleColumn,
  onRenameColumn,
  onClose,
}) {
  const [editingId, setEditingId] = useState(null);
  const [editLabel, setEditLabel] = useState("");

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

  // Fungsi toggle collapse/expand
  const handleToggle = (col) => {
    if (col.id === "item") return;
    // Toggle visible status
    onToggleColumn(col.id);
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
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--bg-modal)",
          borderRadius: 12,
          padding: 24,
          maxWidth: 420,
          width: "100%",
          maxHeight: "80vh",
          overflowY: "auto",
          color: "var(--text-primary)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          border: "1px solid var(--border-color)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginBottom: 4, fontSize: 18, fontWeight: 600 }}>
          Manage Columns
        </h3>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
          Click ▾ to collapse, ▸ to expand. Click name to rename.
        </p>

        <div style={{ marginBottom: 16 }}>
          {columns.map((col) => {
            const isItem = col.id === "item";
            const isVisible = col.visible !== false;

            return (
              <div
                key={col.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 0",
                  borderBottom: "1px solid var(--border-light)",
                }}
              >
                {/* Tombol Collapse/Expand */}
                <button
                  onClick={() => handleToggle(col)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: isItem ? "default" : "pointer",
                    fontSize: 16,
                    color: isVisible ? "var(--btn-primary-bg)" : "var(--text-muted)",
                    opacity: isItem ? 0.4 : 1,
                    padding: "0 4px",
                    width: 24,
                    textAlign: "center",
                  }}
                  title={isItem ? "Fixed column" : isVisible ? "Click to collapse" : "Click to expand"}
                >
                  {isVisible ? "▾" : "▸"}
                </button>

                {/* Nama kolom */}
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
                      border: "2px solid var(--btn-primary-bg)",
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
                      cursor: isItem ? "default" : "pointer",
                      color: isItem ? "var(--text-muted)" : "var(--text-primary)",
                    }}
                    onClick={() => startRename(col)}
                    title={isItem ? "Cannot rename fixed column" : "Click to rename"}
                  >
                    {col.label || col.id}
                    {isItem && " (fixed)"}
                    {!isVisible && " (collapsed)"}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          style={{
            width: "100%",
            padding: "8px",
            background: "var(--bg-hover)",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 14,
            color: "var(--text-secondary)",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--border-color)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
        >
          Close
        </button>
      </div>
    </div>
  );
}
