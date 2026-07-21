export default function StatusCell({
  columnId,
  status,
  statuses,
  statusOrder,
  onChange,
  onOpenStatusManager,
}) {
  // Pastikan statuses dan statusOrder valid
  const safeStatuses = statuses || {};
  const safeStatusOrder = statusOrder && statusOrder.length > 0
    ? statusOrder.filter(s => safeStatuses[s])
    : Object.keys(safeStatuses);

  // Jika masih kosong, beri default
  const finalStatuses = safeStatusOrder.length > 0 ? safeStatusOrder : ["Default"];
  const usedStatuses = Object.keys(safeStatuses).length > 0 ? safeStatuses : { Default: "#9ca3af" };

  const getColor = (s) => usedStatuses[s] || "#9ca3af";
  const currentStatus = status || finalStatuses[0] || "Default";
  const currentColor = getColor(currentStatus);

  const handleChange = (e) => {
    const value = e.target.value;
    if (value === "__manage__") {
      onOpenStatusManager(columnId);
      // Reset ke nilai sebelumnya
      e.target.value = currentStatus;
      return;
    }
    onChange(value);
  };

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <select
        value={currentStatus}
        onChange={handleChange}
        style={{
          padding: "4px 28px 4px 10px",
          borderRadius: 4,
          border: "1px solid var(--border-color)",
          background: currentColor,
          color: "white",
          cursor: "pointer",
          width: "100%",
          fontWeight: 500,
          fontSize: 12,
          minHeight: 28,
          outline: "none",
          appearance: "auto",
          WebkitAppearance: "auto",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        }}
      >
        {finalStatuses.map((s) => (
          <option key={s} value={s} style={{ background: getColor(s), color: "white" }}>
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
    </div>
  );
}
