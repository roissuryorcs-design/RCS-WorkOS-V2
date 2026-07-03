export default function StatusCell({ value, onChange }) {
  const statusColor = (status) => {
    switch (status) {
      case "Done":
        return "#22c55e";
      case "Working":
        return "#3b82f6";
      case "Review":
        return "#f59e0b";
      case "To Do":
        return "#9ca3af";
      default:
        return "#9ca3af";
    }
  };

  return (
    <select
      value={value || "To Do"}
      onChange={(e) => onChange(e.target.value)}
      style={{
        padding: "4px 8px",
        borderRadius: 4,
        border: "1px solid #d1d5db",
        fontSize: 12,
        background: statusColor(value),
        color: "white",
        cursor: "pointer",
        width: "100%",
        fontWeight: 500,
      }}
    >
      <option value="To Do" style={{ background: "#9ca3af" }}>
        To Do
      </option>
      <option value="Working" style={{ background: "#3b82f6" }}>
        Working
      </option>
      <option value="Review" style={{ background: "#f59e0b" }}>
        Review
      </option>
      <option value="Done" style={{ background: "#22c55e" }}>
        Done
      </option>
    </select>
  );
}
