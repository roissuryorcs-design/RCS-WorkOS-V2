import Row from "./Row";

export default function BoardTable({ 
  items, 
  onUpdateItem, 
  onDeleteItem, 
  onAddGroup, 
  onDeleteGroup 
}) {
  if (items.length === 0) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#9ca3af", background: "#f9fafb", borderRadius: 8 }}>
        <p>No items yet. Click "+ Add Item" to get started.</p>
        <button 
          onClick={onAddGroup} 
          style={{ marginTop: 12, padding: "6px 14px", background: "#3b82f6", color: "white", border: "none", borderRadius: 4, cursor: "pointer" }}
        >
          + Add Group
        </button>
      </div>
    );
  }

  const statusOrder = ["To Do", "Working", "Review", "Done"];
  const grouped = items.reduce((acc, item) => {
    const key = item.status || "To Do";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  // Tambahkan status yang tidak ada di statusOrder (custom status)
  const existingStatuses = Object.keys(grouped);
  const allStatuses = [...new Set([...statusOrder, ...existingStatuses])];

  return (
    <div>
      <div style={{ marginBottom: 16, display: "flex", gap: 8 }}>
        <button 
          onClick={onAddGroup} 
          style={{ padding: "6px 14px", background: "#3b82f6", color: "white", border: "none", borderRadius: 4, cursor: "pointer" }}
        >
          + Add Group
        </button>
      </div>

      {allStatuses.map((statusKey) => {
        const tasks = grouped[statusKey] || [];
        if (tasks.length === 0) return null;

        return (
          <div key={statusKey} style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: "#1a1a2e", paddingBottom: 4, borderBottom: "2px solid #e5e7eb", flex: 1 }}>
                {statusKey}
              </h3>
              <button
                onClick={() => onDeleteGroup(statusKey)}
                style={{
                  padding: "2px 10px",
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                ✕ Delete Group
              </button>
            </div>

            <table width="100%" cellPadding="0" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", fontSize: 12, color: "#6b7280", fontWeight: 600, borderBottom: "1px solid #e5e7eb", textTransform: "uppercase", letterSpacing: "0.3px" }}>
                  <th style={{ padding: "8px 8px", width: "22%" }}>ITEM</th>
                  <th style={{ padding: "8px 8px", width: "25%" }}>NO. DOCUMENT</th>
                  <th style={{ padding: "8px 8px", width: "15%" }}>PEOPLE</th>
                  <th style={{ padding: "8px 8px", width: "15%" }}>STATUS</th>
                  <th style={{ padding: "8px 8px", width: "15%" }}>DUE DATE</th>
                  <th style={{ padding: "8px 8px", width: "8%" }}>REV</th>
                  <th style={{ padding: "8px 8px", width: "5%", textAlign: "center" }}></th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((item) => (
                  <Row
                    key={item.id}
                    item={item}
                    onUpdate={(field, value) => onUpdateItem(item.id, field, value)}
                    onDelete={() => onDeleteItem(item.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
