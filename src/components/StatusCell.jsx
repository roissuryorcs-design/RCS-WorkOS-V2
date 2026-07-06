export default function StatusCell({ status, statuses, onChange, onOpenStatusManager }) {
  const statusKeys = Object.keys(statuses);
  const safeStatuses = statusKeys.length > 0 ? statusKeys : ["Default"];

  const getColor = (s) => {
    return statuses[s] || "#9ca3af";
  };

  const handleChange = (e) => {
    const value = e.target.value;
    if (value === "__manage__") {
      onOpenStatusManager();
      // Reset dropdown ke status sebelumnya
      e.target.value = status || safeStatuses[0];
      return;
    }
    onChange(value);
  };

  return (
    <select
      value={status || safeStatuses[0]}
      onChange={handleChange}
      style={{
        padding: "4px 8px",
        borderRadius: 4,
        border: "1px solid #d1d5db",
        fontSize: 12,
        background: getColor(status || safeStatuses[0]),
        color: "white",
        cursor: "pointer",
        width: "100%",
        fontWeight: 500,
        outline: "none",
        transition: "background 0.2s",
      }}
    >
      {safeStatuses.map((s) => (
        <option key={s} value={s} style={{ background: getColor(s) }}>
          {s}
        </option>
      ))}
      {/* Garis pemisah */}
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
