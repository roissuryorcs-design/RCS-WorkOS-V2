import Row from "./Row";

export default function BoardTable({ items, onUpdateItem, onDeleteItem }) {
  if (items.length === 0) {
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
          color: "#9ca3af",
          background: "#f9fafb",
          borderRadius: 8,
        }}
      >
        <p>No items yet. Click "+ Add Item" to get started.</p>
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

  return (
    <div>
      {statusOrder.map(
        (statusKey) =>
          grouped[statusKey] && (
            <div key={statusKey} style={{ marginBottom: 24 }}>
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#1a1a2e",
                  marginBottom: 8,
                  paddingBottom: 4,
                  borderBottom: "2px solid #e5e7eb",
                }}
              >
                {statusKey}
              </h3>

              <table width="100%" cellPadding="0" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr
                    style={{
                      textAlign: "left",
                      fontSize: 12,
                      color: "#6b7280",
                      fontWeight: 600,
                      borderBottom: "1px solid #e5e7eb",
                      textTransform: "uppercase",
                      letterSpacing: "0.3px",
                    }}
                  >
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
                  {grouped[statusKey].map((item) => (
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
          )
      )}
    </div>
  );
}
