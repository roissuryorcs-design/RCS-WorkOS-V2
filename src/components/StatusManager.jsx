import { useState } from "react";

export default function StatusManager({
  statuses,
  statusOrder,
  onAddStatus,
  onUpdateStatusColor,
  onDeleteStatus,
  onRenameStatus,
  onReorderStatus,
  onClose,
}) {
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#9ca3af");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const orderedKeys = statusOrder && statusOrder.length > 0
    ? statusOrder.filter(s => statuses[s])
    : Object.keys(statuses);

  const handleAdd = () => {
    const name = newName.trim() || "Default";
    if (statuses[name]) {
      alert(`Status "${name}" already exists!`);
      return;
    }
    onAddStatus(name, newColor);
    setNewName("");
    setNewColor("#9ca3af");
  };

  const handleDelete = (name) => {
    if (orderedKeys.length <= 1) {
      alert("Cannot delete the last status. At least one status must remain.");
      return;
    }
    if (!confirm(`Delete status "${name}"?`)) return;
    onDeleteStatus(name);
  };

  const startRename = (name) => {
    setEditingId(name);
    setEditName(name);
  };

  const saveRename = () => {
    if (editName.trim() && editName.trim() !== editingId) {
      if (statuses[editName.trim()]) {
        alert(`Status "${editName.trim()}" already exists!`);
        setEditingId(null);
        setEditName("");
        return;
      }
      onRenameStatus(editingId, editName.trim());
    }
    setEditingId(null);
    setEditName("");
  };

  const cancelRename = () => {
    setEditingId(null);
    setEditName("");
  };

  // ============================================================
  // DRAG & DROP
  // ============================================================
  const handleDragStart = (e, index) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
    e.currentTarget.style.opacity = "0.5";
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = "1";
    setDragOverIndex(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData("text/plain"));
    if (fromIndex === dropIndex) return;
    onReorderStatus(fromIndex, dropIndex);
    setDragOverIndex(null);
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
        <h3 style={{ marginBottom: 4, fontSize: 18, fontWeight: 600 }}>Manage Statuses</h3>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
          Drag ⠿ to reorder. Click name to rename. At least one status must remain.
        </p>

        <div style={{ marginBottom: 16 }}>
          {orderedKeys.map((name, index) => (
            <div
              key={name}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 10px",
                marginBottom: 4,
                borderRadius: 6,
                borderBottom: "1px solid var(--border-light)",
                background: dragOverIndex === index ? "var(--bg-hover)" : "transparent",
                transition: "background 0.2s, opacity 0.2s",
                cursor: "grab",
              }}
            >
              <span style={{ color: "var(--text-muted)", fontSize: 18, cursor: "grab", userSelect: "none" }}>
                ⠿
              </span>

              <span
                style={{
                  display: "inline-block",
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  background: statuses[name],
                  flexShrink: 0,
                  border: "1px solid var(--border-color)",
                }}
              />

              {editingId === name ? (
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
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
                    color: "var(--text-primary)",
                    cursor: "pointer",
                    padding: "2px 4px",
                    borderRadius: 3,
                    transition: "background 0.15s",
                  }}
                  onClick={() => startRename(name)}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  title="Klik untuk rename"
                >
                  {name}
                </span>
              )}

              <input
                type="color"
                value={statuses[name]}
                onChange={(e) => onUpdateStatusColor(name, e.target.value)}
                style={{ width: 30, height: 30, border: "none", cursor: "pointer", background: "transparent", padding: 0 }}
              />

              <button
                onClick={() => handleDelete(name)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#ef4444",
                  cursor: orderedKeys.length <= 1 ? "not-allowed" : "pointer",
                  fontSize: 16,
                  opacity: orderedKeys.length <= 1 ? 0.4 : 1,
                  padding: "0 4px",
                }}
                disabled={orderedKeys.length <= 1}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input
            placeholder="New status name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            style={{
              flex: 1,
              padding: "6px 10px",
              border: "1px solid var(--border-dark)",
              borderRadius: 6,
              fontSize: 13,
              background: "var(--bg-input)",
              color: "var(--text-primary)",
            }}
          />
          <input
            type="color"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            style={{ width: 36, height: 36, border: "none", cursor: "pointer", background: "transparent", padding: 0 }}
          />
          <button
            onClick={handleAdd}
            style={{
              padding: "6px 16px",
              background: "var(--btn-primary-bg)",
              color: "var(--btn-primary-text)",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            Add
          </button>
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
