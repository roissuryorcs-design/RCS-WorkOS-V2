export default function StatusCell({ status, allStatuses, onChange }) {
  const statusColor = (s) => {
    switch (s) {
      case "Done": return "#22c55e";
      case "Working": return "#3b82f6";
      case "Review": return "#f59e0b";
      case "To Do": return "#9ca3af";
      default: return "#8b5cf6";
    }
  };

  return (
    <select
      value={status || "To Do"}
      onChange={(e) => onChange(e.target.value)}
      style={{
        padding: "4px 8px",
        borderRadius: 4,
        border: "1px solid #d1d5db",
        fontSize: 12,
        background: statusColor(status),
        color: "white",
        cursor: "pointer",
        width: "100%",
        fontWeight: 500,
      }}
    >
      {allStatuses.map((s) => (
        <option key={s} value={s} style={{ background: statusColor(s) }}>
          {s}
        </option>
      ))}
    </select>
  );
}
