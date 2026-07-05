export default function StatusCell({ status, statuses, onChange }) {
  const statusKeys = Object.keys(statuses);
  const safeStatuses = statusKeys.length > 0 ? statusKeys : ["Default"];

  const getColor = (s) => {
    return statuses[s] || "#9ca3af";
  };

  return (
    <select
      value={status || safeStatuses[0]}
      onChange={(e) => onChange(e.target.value)}
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
    </select>
  );
}
