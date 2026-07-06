import { useRef } from "react";

export default function StatusCell({ status, statuses, statusOrder, onChange, onOpenStatusManager }) {
  const selectRef = useRef(null);

  // Urutan status berdasarkan statusOrder, fallback ke Object.keys
  const orderedStatuses = statusOrder && statusOrder.length > 0
    ? statusOrder.filter(s => statuses[s])
    : Object.keys(statuses);

  const getColor = (s) => statuses[s] || "#9ca3af";
  const currentStatus = status || orderedStatuses[0] || "Default";
  const currentColor = getColor(currentStatus);

  const handleChange = (e) => {
    const value = e.target.value;
    if (value === "__manage__") {
      onOpenStatusManager();
      // Reset ke nilai sebelumnya
      e.target.value = currentStatus;
      return;
    }
    onChange(value);
  };

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <select
        ref={selectRef}
        value={currentStatus}
        onChange={handleChange}
        style={{
          padding: "4px 28px 4px 10px",
          borderRadius: 4,
          border: "1px solid var(--border-color)",
          background: currentColor,
          color: "white",
          cursor: "pointer",
          width: "100%",
          fontWeight: 500,
          fontSize: 12,
          minHeight: 28,
          outline: "none",
          transition: "background 0.2s, border-color 0.2s, box-shadow 0.2s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          appearance: "auto",
          WebkitAppearance: "auto",
        }}
      >
        {orderedStatuses.map((s) => (
          <option
            key={s}
            value={s}
            style={{
              background: getColor(s),
              color: "white",
              padding: "4px 8px",
            }}
          >
            {s}
          </option>
        ))}
        <option
          value="__manage__"
          style={{
            borderTop: "1px solid var(--border-color)",
            background: "var(--bg-secondary)",
            color: "var(--text-primary)",
            fontWeight: 400,
          }}
        >
          ─── 📝 Manage Statuses ───
        </option>
      </select>

      {/* Panah custom */}
      <span
        style={{
          position: "absolute",
          right: 8,
          top: "50%",
          transform: "translateY(-50%)",
          color: "rgba(255,255,255,0.8)",
          fontSize: 10,
          pointerEvents: "none",
          textShadow: "0 1px 2px rgba(0,0,0,0.2)",
        }}
      >
        ▾
      </span>
    </div>
  );
}
