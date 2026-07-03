import { useState } from "react";
import Row from "./Row";

export default function BoardTable({
  items,
  groups,
  statuses,
  groupColors,
  onUpdateGroupColor,
  onUpdateItem,
  onDeleteItem,
  onAddGroup,
  onDeleteGroup,
  onAddItem,
  onOpenStatusManager,
}) {
  // State untuk collapse per group
  const [collapsed, setCollapsed] = useState({});

  const toggleCollapse = (groupName) => {
    setCollapsed(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };

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
        const isCollapsed = collapsed[groupName] || false;
        const groupColor = groupColors[groupName] || "#3b82f6"; // default biru

        return (
          <div key={groupName} style={{ marginBottom: 24, position: "relative" }}>
            {/* HEADER GROUP */}
            <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
              {/* Tombol Collapse */}
              <button
                onClick={() => toggleCollapse(groupName)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 16,
                  color: "var(--text-secondary)",
                  padding: "0 4px 0 0",
                  marginRight: 4,
                }}
              >
                {isCollapsed ? "▶" : "▼"}
              </button>

              <button
                onClick={() => setPopupGroup(groupName)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 18,
                  color: "var(--text-secondary)",
                  padding: "0 8px 0 0",
                  marginRight: 4,
                }}
              >
                ⋮
              </button>

              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: groupColor, // Warna teks sesuai group
                  paddingBottom: 4,
                  borderBottom: `2px solid ${groupColor}`,
                  flex: 1,
                  transition: "color 0.2s",
                }}
              >
                {groupName}
              </h3>

              {/* Color Picker untuk custom warna */}
              <input
                type="color"
                value={groupColor}
                onChange={(e) => onUpdateGroupColor(groupName, e.target.value)}
                style={{
                  width: 24,
                  height: 24,
                  border: "none",
                  cursor: "pointer",
                  background: "transparent",
                  marginLeft: 8,
                }}
                title="Pilih warna group"
              />
            </div>

            {/* POPUP DELETE GROUP */}
            {popupGroup === groupName && (
              <>
                <div
                  style={{
                    position: "absolute",
                    top: 30,
                    left: 0,
                    background: "var(--bg-modal)",
                    border: "1px solid var(--border-color)",
                    borderRadius: 6,
                    boxShadow: "var(--shadow-md)",
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

            {/* TABEL - hanya tampil jika tidak collapsed */}
            {!isCollapsed && (
              <>
                {tasks.length > 0 ? (
                  <table
                    width="100%"
                    cellPadding="0"
                    style={{
                      borderCollapse: "collapse",
                      border: "2px solid var(--border-color)",
                      borderRadius: 4,
                      borderLeft: `4px solid ${groupColor}`, // BORDER KIRI 2x lipat + berwarna
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          textAlign: "left",
                          fontSize: 12,
                          color: "var(--text-muted)",
                          fontWeight: 600,
                          borderBottom: "2px solid var(--border-color)",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                        }}
                      >
                        <th
                          style={{
                            padding: "8px 8px",
                            width: "22%",
                            borderRight: "2px solid var(--border-color)",
                          }}
                        >
                          ITEM
                        </th>
                        <th
                          style={{
                            padding: "8px 8px",
                            width: "20%",
                            borderRight: "2px solid var(--border-color)",
                          }}
                        >
                          NO. DOCUMENT
                        </th>
                        <th
                          style={{
                            padding: "8px 8px",
                            width: "13%",
                            borderRight: "2px solid var(--border-color)",
                          }}
                        >
                          PEOPLE
                        </th>
                        <th
                          style={{
                            padding: "8px 8px",
                            width: "13%",
                            borderRight: "2px solid var(--border-color)",
                            position: "relative",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span>STATUS</span>
                            <button
                              onClick={onOpenStatusManager}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontSize: 14,
                                color: "var(--text-secondary)",
                                padding: 0,
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              ⋮
                            </button>
                          </div>
                        </th>
                        <th
                          style={{
                            padding: "8px 8px",
                            width: "13%",
                            borderRight: "2px solid var(--border-color)",
                          }}
                        >
                          DUE DATE
                        </th>
                        <th
                          style={{
                            padding: "8px 8px",
                            width: "8%",
                            borderRight: "2px solid var(--border-color)",
                          }}
                        >
                          REV
                        </th>
                        <th style={{ padding: "8px 8px", width: "6%", textAlign: "center" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.map((item) => (
                        <Row
                          key={item.id}
                          item={item}
                          statuses={statuses}
                          groupColor={groupColor} // Kirim warna untuk border kiri baris
                          onUpdate={(field, value) => onUpdateItem(item.id, field, value)}
                          onDelete={() => onDeleteItem(item.id)}
                        />
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div
                    style={{
                      padding: "12px",
                      color: "var(--text-light)",
                      textAlign: "center",
                      border: "2px solid var(--border-color)",
                      borderRadius: 4,
                      borderLeft: `4px solid ${groupColor}`,
                    }}
                  >
                    No items in this group.
                    <button
                      onClick={() => onAddItem(groupName)}
                      style={{
                        color: "#3b82f6",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        marginLeft: 4,
                        textDecoration: "underline",
                      }}
                    >
                      Add task
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}

      <div style={{ marginTop: 16 }}>
        <button
          onClick={onAddGroup}
          style={{
            display: "block",
            width: "100%",
            padding: "10px",
            border: "2px dashed var(--border-color)",
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
