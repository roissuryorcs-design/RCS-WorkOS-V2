import StatusCell from "./StatusCell";

export default function Row({ item, allStatuses, onUpdate, onDelete }) {
  const inputStyle = {
    border: "none",
    background: "transparent",
    fontSize: 13,
    padding: "4px 2px",
    width: "100%",
    color: "#1a1a2e",
    outline: "none",
    fontFamily: "Arial, sans-serif",
  };

  return (
    <tr
      style={{ borderBottom: "1px solid #f3f4f6", fontSize: 13 }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
    >
      <td style={{ padding: "6px 8px" }}>
        <input
          value={item.item}
          onChange={(e) => onUpdate("item", e.target.value)}
          style={inputStyle}
        />
      </td>
      <td style={{ padding: "6px 8px" }}>
        <input
          value={item.document}
          onChange={(e) => onUpdate("document", e.target.value)}
          style={inputStyle}
        />
      </td>
      <td style={{ padding: "6px 8px" }}>
        <input
          value={item.people}
          onChange={(e) => onUpdate("people", e.target.value)}
          style={inputStyle}
        />
      </td>
      <td style={{ padding: "6px 8px" }}>
        <StatusCell
          status={item.status}
          allStatuses={allStatuses}
          onChange={(val) => onUpdate("status", val)}
        />
      </td>
      <td style={{ padding: "6px 8px" }}>
        <input
          value={item.dueDate}
          onChange={(e) => onUpdate("dueDate", e.target.value)}
          style={inputStyle}
        />
      </td>
      <td style={{ padding: "6px 8px" }}>
        <input
          value={item.rev}
          onChange={(e) => onUpdate("rev", e.target.value)}
          style={inputStyle}
        />
      </td>
      <td style={{ padding: "6px 8px", textAlign: "center" }}>
        <button
          onClick={onDelete}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 14,
            color: "#9ca3af",
          }}
        >
          ✕
        </button>
      </td>
    </tr>
  );
}
