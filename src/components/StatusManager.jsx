import { useState } from "react";

export default function StatusManager({
  statuses,
  onAddStatus,
  onUpdateStatusColor,
  onDeleteStatus,
  onClose,
}) {
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#8b5cf6");

  const defaultStatuses = ["To Do", "Working", "Review", "Done"];

  const handleAdd = () => {
    if (!newName.trim()) return;
    onAddStatus(newName.trim(), newColor);
    setNewName("");
    setNewColor("#8b5cf6");
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
          background: "white",
          borderRadius: 8,
          padding: 24,
          maxWidth: 400,
          width: "100%",
          maxHeight: "80vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginBottom: 16, fontSize: 18 }}>Manage Statuses</h3>

        {/* Daftar status */}
        <div style={{ marginBottom: 16 }}>
          {Object.entries(statuses).map(([name, color]) => (
            <div
              key={name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 0",
                borderBottom: "1px solid #f3f4f6",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 12,
                  height: 12,
                  borderRadius: 4,
                  background: color,
                }}
              />
              <span style={{ flex: 1, fontSize: 14 }}>{name}</span>
              <input
                type="color"
                value={color}
                onChange={(e) => onUpdateStatusColor(name, e.target.value)}
                style={{ width: 30, height: 30, border: "none", cursor: "pointer" }}
              />
              {!defaultStatuses.includes(name) && (
                <button
                  onClick={() => onDeleteStatus(name)}
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

        {/* Tambah status baru */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input
            placeholder="New status name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            style={{
              flex: 1,
              padding: "6px 10px",
              border: "1px solid #d1d5db",
              borderRadius: 4,
              fontSize: 13,
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
              background: "#3b82f6",
              color: "white",
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
            background: "#e5e7eb",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
