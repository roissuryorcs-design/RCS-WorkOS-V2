export default function StatusCell({ status }) {
  const statusColor = (s) => {
    switch (s) {
      case "Done": return "#22c55e";
      case "Working": return "#3b82f6";
      case "Review": return "#f59e0b";
      case "To Do": return "#9ca3af";
      default: return "#9ca3af";
    }
  };

  return (
    <span
      style={{
        padding: "4px 10px",
        borderRadius: 12,
        fontSize: 12,
        color: "white",
        fontWeight: 500,
        background: statusColor(status),
        display: "inline-block",
      }}
    >
      {status || "To Do"}
    </span>
  );
}
