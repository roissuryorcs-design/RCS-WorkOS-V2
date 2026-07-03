export default function StatusCell({ status, statuses, onChange }) {
  const getColor = (s) => statuses[s] || "#9ca3af";

  return (
    <select
      value={status || Object.keys(statuses)[0] || "To Do"}
      onChange={(e) => onChange(e.target.value)}
      style={{
        padding: "4px 8px",
        borderRadius: 4,
        border: "1px solid #d1d5db",
        fontSize: 12,
        background: getColor(status),
        color: "white",
        cursor: "pointer",
        width: "100%",
        fontWeight: 500,
      }}
    >
      {Object.keys(statuses).map((s) => (
        <option key={s} value={s} style={{ background: statuses[s] }}>
          {s}
        </option>
      ))}
    </select>
  );
}
