import { useState } from "react";

export default function ProgressCell({ value, onChange }) {
  const [editing, setEditing] = useState(false);
  const [temp, setTemp] = useState("");
  const progress = Math.min(100, Math.max(0, parseInt(value) || 0));

  const startEdit = () => {
    setTemp(String(progress));
    setEditing(true);
  };

  const commit = () => {
    let n = parseInt(temp, 10);
    if (isNaN(n)) n = 0;
    n = Math.min(100, Math.max(0, n));
    onChange(n);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        type="number"
        min={0}
        max={100}
        autoFocus
        value={temp}
        onChange={(e) => setTemp(e.target.value)}
        onFocus={(e) => e.target.select()}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setEditing(false);
        }}
        style={{
          width: "100%",
          padding: "4px 6px",
          fontSize: 12,
          border: "1px solid var(--btn-primary-bg)",
          borderRadius: 4,
          outline: "none",
          background: "var(--bg-input)",
          color: "var(--text-primary)",
        }}
      />
    );
  }

  return (
    <div
      onClick={startEdit}
      title="Klik untuk mengubah persentase"
      style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", width: "100%" }}
    >
      <div
        style={{
          flex: 1,
          height: 6,
          background: "var(--border-color)",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            background: progress >= 100 ? "#22c55e" : "#3b82f6",
            borderRadius: 3,
            transition: "width 0.2s",
          }}
        />
      </div>
      <span style={{ fontSize: 11, color: "var(--text-muted)", minWidth: 30 }}>
        {progress}%
      </span>
    </div>
  );
}
