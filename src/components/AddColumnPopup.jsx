import { useState } from "react";

export default function AddColumnPopup({ onAdd, onClose }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("text");

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
    if (!name.trim()) return;
    onAdd(name.trim(), type);
    setName("");
    setType("text");
    onClose();
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
          borderRadius: 12,
          padding: 24,
          maxWidth: 380,
          width: "100%",
          color: "var(--text-primary)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          border: "1px solid var(--border-color)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginBottom: 16, fontSize: 18, fontWeight: 600 }}>
          Add Column
        </h3>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
            Column Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter column name..."
            style={{
              width: "100%",
              padding: "8px 10px",
              border: "1px solid var(--border-dark)",
              borderRadius: 6,
              fontSize: 14,
              background: "var(--bg-input)",
              color: "var(--text-primary)",
              outline: "none",
            }}
            autoFocus
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
            Column Type
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 10px",
              border: "1px solid var(--border-dark)",
              borderRadius: 6,
              fontSize: 14,
              background: "var(--bg-input)",
              color: "var(--text-primary)",
              outline: "none",
            }}
          >
            {columnTypes.map(ct => (
              <option key={ct.value} value={ct.value}>{ct.label}</option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleAdd}
            style={{
              flex: 1,
              padding: "8px",
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
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
              background: "var(--bg-hover)",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              color: "var(--text-secondary)",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
