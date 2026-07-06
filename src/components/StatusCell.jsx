export default function StatusCell({ status, statuses, statusOrder, onChange, onOpenStatusManager }) {
  // Urutan status berdasarkan statusOrder, fallback ke Object.keys
  const orderedStatuses = statusOrder && statusOrder.length > 0
    ? statusOrder.filter(s => statuses[s])
    : Object.keys(statuses);

  const getColor = (s) => statuses[s] || "#9ca3af";

  const handleChange = (e) => {
    const value = e.target.value;
    if (value === "__manage__") {
      onOpenStatusManager();
      // Reset ke nilai sebelumnya
      e.target.value = status || orderedStatuses[0] || "Default";
      return;
    }
    onChange(value);
  };

  return (
    <select
      value={status || orderedStatuses[0] || "Default"}
      onChange={handleChange}
      style={{
        padding: "4px 8px",
        borderRadius: 4,
        border: "1px solid #d1d5db",
        fontSize: 12,
        background: getColor(status || orderedStatuses[0] || "Default"),
        color: "white",
        cursor: "pointer",
        width: "100%",
        fontWeight: 500,
        outline: "none",
        transition: "background 0.2s",
        appearance: "auto",
      }}
    >
      {orderedStatuses.map((s) => (
        <option key={s} value={s} style={{ background: getColor(s) }}>
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
        📝 Manage Statuses...
      </option>
    </select>
  );
}
