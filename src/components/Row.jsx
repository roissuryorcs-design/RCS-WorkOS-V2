import StatusCell from "./StatusCell";

export default function Row({
  item,
  statuses,
  groupColor,
  visibleColumns,
  onUpdate,
  onDelete,
}) {
  const inputStyle = {
    border: "none",
    background: "transparent",
    fontSize: 13,
    padding: "4px 2px",
    width: "100%",
    color: "var(--text-primary)",
    outline: "none",
    fontFamily: "Arial, sans-serif",
    boxSizing: "border-box", // ← Tambahkan ini
  };

  const renderCell = (col) => {
    if (col.id === "action") {
      return (
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
      );
    }

    if (col.id === "status") {
      return (
        <StatusCell
          status={item.status}
          statuses={statuses}
          onChange={(val) => onUpdate("status", val)}
        />
      );
    }

    const value = item[col.id] !== undefined ? item[col.id] : "";
    return (
      <input
        value={value}
        onChange={(e) => onUpdate(col.id, e.target.value)}
        style={inputStyle}
        placeholder={col.label}
      />
    );
  };

  return (
    <tr
      style={{
        borderBottom: "2px solid var(--border-color)",
        fontSize: 13,
        background: "var(--bg-secondary)",
        borderLeft: `4px solid ${groupColor}`,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-secondary)")}
    >
      {visibleColumns.map((col, idx) => {
        const isLast = idx === visibleColumns.length - 1;
        return (
        <td
  key={col.id}
  style={{
    padding: "6px 8px",
    borderRight: isLast ? "none" : "2px solid var(--border-color)",
    width: `${col.width}px`,
    minWidth: `${col.width}px`,
    maxWidth: `${col.width}px`,
    boxSizing: "border-box",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  }}
>
  {renderCell(col)}
</td>
        );
      })}
    </tr>
  );
}
