import { useState } from "react";
import Row from "./Row";

export default function BoardTable({
  items,
  onUpdateItem,
  onDeleteItem,
  onAddGroup,
  onDeleteGroup,
}) {
  // State untuk popup
  const [popupGroup, setPopupGroup] = useState(null);

  // Ambil semua status unik dari items
  const allStatuses = [...new Set(items.map((item) => item.status || "To Do"))];
  const defaultStatuses = ["To Do", "Working", "Review", "Done"];
  const finalStatuses = [...new Set([...defaultStatuses, ...allStatuses])];

  // Group items by status
  const grouped = items.reduce((acc, item) => {
    const key = item.status || "To Do";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  // Tutup popup
  const closePopup = () => setPopupGroup(null);

  // Handle delete group dari popup
  const handleDeleteGroup = (status) => {
    closePopup();
    onDeleteGroup(status);
  };

  return (
    <div>
      {/* Tabel untuk setiap group */}
      {finalStatuses.map((statusKey) => {
        const tasks = grouped[statusKey] || [];
        if (tasks.length === 0) return null;

        const isDefault = defaultStatuses.includes(statusKey);

        return (
          <div key={statusKey} style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: "#1a1a2e", paddingBottom: 4, borderBottom: "2px solid #e5e7eb", flex: 1 }}>
                {statusKey}
              </h3>

              {/* Tombol titik tiga */}
              <button
                onClick={() => setPopupGroup(statusKey)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 18,
                  color: "#6b7280",
                  padding: "0 8px",
                }}
              >
                ⋮
              </button>
            </div>

            <table width="100%" cellPadding="0" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", fontSize: 12, color: "#6b7280", fontWeight: 600, borderBottom: "1px solid #e5e7eb", textTransform: "uppercase", letterSpacing: "0.3px" }}>
                  <th style={{ padding: "8px 8px", width: "22%" }}>ITEM</th>
                  <th style={{ padding: "8px 8px", width: "20%" }}>NO. DOCUMENT</th>
                  <th style={{ padding: "8px 8px", width: "13%" }}>PEOPLE</th>
                  <th style={{ padding: "8px 8px", width: "13%" }}>STATUS</th>
                  <th style={{ padding: "8px 8px", width: "13%" }}>DUE DATE</th>
                  <th style={{ padding: "8px 8px", width: "8%" }}>REV</th>
                  <th style={{ padding: "8px 8px", width: "6%", textAlign: "center" }}></th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((item) => (
                  <Row
                    key={item.id}
                    item={item}
                    allStatuses={finalStatuses}
                    onUpdate={(field, value) => onUpdateItem(item.id, field, value)}
                    onDelete={() => onDeleteItem(item.id)}
                  />
                ))}
              </tbody>
            </table>

            {/* Popup untuk group ini */}
            {popupGroup === statusKey && (
              <div
                style={{
                  position: "absolute",
                  background: "white",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  padding: "4px 0",
                  zIndex: 100,
                  marginTop: 4,
                  right: 16,
                }}
              >
                <button
                  onClick={() => handleDeleteGroup(statusKey)}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "6px 16px",
                    background: "none",
                    border: "none",
                    textAlign: "left",
                    cursor: isDefault ? "not-allowed" : "pointer",
                    color: isDefault ? "#9ca3af" : "#ef4444",
                    fontSize: 13,
                    opacity: isDefault ? 0.6 : 1,
                  }}
                  disabled={isDefault}
                >
                  {isDefault ? "Cannot delete default group" : "🗑️ Delete Group"}
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* TOMBOL ADD GROUP DI PALING BAWAH */}
      <div style={{ marginTop: 16 }}>
        <button
          onClick={onAddGroup}
          style={{
            display: "block",
            width: "100%",
            padding: "10px",
            border: "1px dashed #d1d5db",
            borderRadius: 6,
            background: "transparent",
            color: "#3b82f6",
            cursor: "pointer",
            fontSize: 14,
            textAlign: "center",
          }}
        >
          + Add new group
        </button>
      </div>

      {/* Overlay untuk menutup popup saat klik di luar */}
      {popupGroup && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99,
          }}
          onClick={closePopup}
        />
      )}
    </div>
  );
}
