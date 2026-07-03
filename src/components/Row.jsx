import StatusCell from "./StatusCell";

export default function Row({ item, statuses, groupColor, onUpdate, onDelete }) {
  const inputStyle = {
    border: "none",
    background: "transparent",
    fontSize: 13,
    padding: "4px 2px",
    width: "100%",
    color: "var(--text-primary)",
    outline: "none",
    fontFamily: "Arial, sans-serif",
  };

  return (
    <tr
      style={{
        borderBottom: "2px solid var(--border-color)",
        fontSize: 13,
        background: "var(--bg-secondary)",
        borderLeft: `4px solid ${groupColor}`, // BORDER KIRI PER BARIS
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-secondary)")}
    >
      <td style={{ padding: "6px 8px", borderRight: "2px solid var(--border-color)" }}>
        <input
          value={item.item}
          onChange={(e) => onUpdate("item", e.target.value)}
          style={inputStyle}
        />
      </td>
      <td style={{ padding: "6px 8px", borderRight: "2px solid var(--border-color)" }}>
        <input
          value={item.document}
          onChange={(e) => onUpdate("document", e.target.value)}
          style={inputStyle}
        />
      </td>
      <td style={{ padding: "6px 8px", borderRight: "2px solid var(--border-color)" }}>
        <input
          value={item.people}
          onChange={(e) => onUpdate("people", e.target.value)}
          style={inputStyle}
        />
      </td>
      <td style={{ padding: "6px 8px", borderRight: "2px solid var(--border-color)" }}>
        <StatusCell
          status={item.status}
          statuses={statuses}
          onChange={(val) => onUpdate("status", val)}
        />
      </td>
      <td style={{ padding: "6px 8px", borderRight: "2px solid var(--border-color)" }}>
        <input
          value={item.dueDate}
          onChange={(e) => onUpdate("dueDate", e.target.value)}
          style={inputStyle}
        />
      </td>
      <td style={{ padding: "6px 8px", borderRight: "2px solid var(--border-color)" }}>
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
            color: "var(--text-light)",
          }}
        >
          ✕
        </button>
      </td>
    </tr>
  );
}
