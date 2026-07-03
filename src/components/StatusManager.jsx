import { useState } from "react";

export default function StatusManager({
  statuses,
  onAddStatus,
  onUpdateStatusColor,
  onDeleteStatus,
  onClose,
}) {
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#9ca3af");

  const statusKeys = Object.keys(statuses);

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
    if (statusKeys.length <= 1) {
      alert("Cannot delete the last status. At least one status must remain.");
      return;
    }
    if (!confirm(`Delete status "${name}"?`)) return;
    onDeleteStatus(name);
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
          maxWidth: 400,
          width: "100%",
          maxHeight: "80vh",
          overflowY: "auto",
          color: "var(--text-primary)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginBottom: 16, fontSize: 18, color: "var(--text-primary)" }}>
          Manage Statuses
        </h3>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>
          At least one status must remain.
        </p>

        <div style={{ marginBottom: 16 }}>
          {statusKeys.map((name) => (
            <div
              key={name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 0",
                borderBottom: "1px solid var(--border-light)",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 12,
                  height: 12,
                  borderRadius: 4,
                  background: statuses[name],
                }}
              />
              <span style={{ flex: 1, fontSize: 14, color: "var(--text-primary)" }}>
                {name || "(unnamed)"}
              </span>
              <input
                type="color"
                value={statuses[name]}
                onChange={(e) => onUpdateStatusColor(name, e.target.value)}
                style={{ width: 30, height: 30, border: "none", cursor: "pointer" }}
              />
              <button
                onClick={() => handleDelete(name)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#ef4444",
                  cursor: statusKeys.length <= 1 ? "not-allowed" : "pointer",
                  fontSize: 16,
                  opacity: statusKeys.length <= 1 ? 0.4 : 1,
                }}
                disabled={statusKeys.length <= 1}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input
            placeholder="Status name (optional)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            style={{
              flex: 1,
              padding: "6px 10px",
              border: "1px solid var(--border-dark)",
              borderRadius: 4,
              fontSize: 13,
              background: "var(--bg-input)",
              color: "var(--text-primary)",
            }}
          />
          <input
            type="color"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            style={{ width: 36, height: 36, border: "none", cursor: "pointer" }}
          />
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

        <button
          onClick={onClose}
          style={{
            width: "100%",
            padding: "8px",
            background: "var(--bg-hover)",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            fontSize: 14,
            color: "var(--text-secondary)",
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
