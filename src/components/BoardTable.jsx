import { useState } from "react";
import Row from "./Row";

export default function BoardTable({
  items,
  groups,
  statuses,
  onUpdateItem,
  onDeleteItem,
  onAddGroup,
  onDeleteGroup,
  onAddItem,
  onOpenStatusManager,
}) {
  const [popupGroup, setPopupGroup] = useState(null);

  const closePopup = () => setPopupGroup(null);

  const grouped = groups.reduce((acc, group) => {
    acc[group] = items.filter((item) => item.group === group);
    return acc;
  }, {});

  return (
    <div>
      {groups.map((groupName) => {
        const tasks = grouped[groupName] || [];

        return (
          <div key={groupName} style={{ marginBottom: 24, position: "relative" }}>
            {/* HEADER GROUP */}
            <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
              <button
                onClick={() => setPopupGroup(groupName)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 18,
                  color: "#6b7280",
                  padding: "0 8px 0 0",
                  marginRight: 8,
                }}
              >
                ⋮
              </button>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: "#1a1a2e", paddingBottom: 4, borderBottom: "2px solid #e5e7eb", flex: 1 }}>
                {groupName}
              </h3>
            </div>

            {/* POPUP DELETE GROUP */}
            {popupGroup === groupName && (
              <>
                <div
                  style={{
                    position: "absolute",
                    top: 24,
                    left: 0,
                    background: "white",
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    padding: "4px 0",
                    zIndex: 100,
                    minWidth: "160px",
                  }}
                >
                  <button
                    onClick={() => {
                      closePopup();
                      onDeleteGroup(groupName);
                    }}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "6px 16px",
                      background: "none",
                      border: "none",
                      textAlign: "left",
                      cursor: "pointer",
                      color: "#ef4444",
                      fontSize: 13,
                    }}
                  >
                    🗑️ Delete Group
                  </button>
                </div>
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
              </>
            )}

            {/* TABEL */}
            {tasks.length > 0 ? (
              <table width="100%" cellPadding="0" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", fontSize: 12, color: "#6b7280", fontWeight: 600, borderBottom: "1px solid #e5e7eb", textTransform: "uppercase", letterSpacing: "0.3px" }}>
                    <th style={{ padding: "8px 8px", width: "22%" }}>ITEM</th>
                    <th style={{ padding: "8px 8px", width: "20%" }}>NO. DOCUMENT</th>
                    <th style={{ padding: "8px 8px", width: "13%" }}>PEOPLE</th>
                    <th style={{ padding: "8px 8px", width: "13%", position: "relative" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span>STATUS</span>
                        <button
                          onClick={onOpenStatusManager}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: 14,
                            color: "#6b7280",
                            padding: 0,
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          ⋮
                        </button>
                      </div>
                    </th>
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
                      statuses={statuses}
                      onUpdate={(field, value) => onUpdateItem(item.id, field, value)}
                      onDelete={() => onDeleteItem(item.id)}
                    />
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: "12px", color: "#9ca3af", textAlign: "center", border: "1px dashed #e5e7eb", borderRadius: 4 }}>
                No items in this group. <button onClick={() => onAddItem(groupName)} style={{ color: "#3b82f6", background: "none", border: "none", cursor: "pointer" }}>Add task</button>
              </div>
            )}

            <button
              onClick={() => onAddItem(groupName)}
              style={{
                display: "block",
                width: "100%",
                padding: "6px",
                border: "none",
                background: "transparent",
                color: "#3b82f6",
                cursor: "pointer",
                fontSize: 13,
                textAlign: "left",
                marginTop: 4,
              }}
            >
              + Add task
            </button>
          </div>
        );
      })}

      {/* TOMBOL ADD NEW GROUP */}
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
    </div>
  );
}
