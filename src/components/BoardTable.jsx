import { useState } from "react";
import Row from "./Row";
import ResizableHeader from "./ResizableHeader";
import { useColumns } from "../context/ColumnContext";

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
  const {
    updateColumnWidth,
    renameColumn,
    toggleColumn,
    deleteColumn,
    reorderColumns,
    visibleColumns,
  } = useColumns();

  const [collapsed, setCollapsed] = useState({});
  const [popupGroup, setPopupGroup] = useState(null);

  const toggleCollapse = (groupName) => {
    setCollapsed((prev) => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const closePopup = () => setPopupGroup(null);

  const grouped = groups.reduce((acc, group) => {
    acc[group] = items.filter((item) => item.group === group);
    return acc;
  }, {});

  // --- PASTIKAN KOLOM ITEM SELALU ADA ---
  const safeColumns = (() => {
    const hasItem = visibleColumns.some((col) => col.id === "item");
    if (hasItem) return visibleColumns;
    // Jika ITEM hilang, tambahkan kembali
    return [
      { id: "item", label: "ITEM", width: 22, visible: true },
      ...visibleColumns,
    ];
  })();

  return (
    <div className="board-table-wrapper">
      {groups.map((groupName) => {
        const tasks = grouped[groupName] || [];
        const isCollapsed = collapsed[groupName] || false;
        const groupColor = groupColors[groupName] || "#3b82f6";

        return (
          <div key={groupName} style={{ marginBottom: 24, position: "relative" }}>
            {/* HEADER GROUP */}
            <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
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
                  color: groupColor,
                  paddingBottom: 4,
                  borderBottom: `2px solid ${groupColor}`,
                  flex: 1,
                }}
              >
                {groupName}
              </h3>

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
              />
            </div>

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
                      borderLeft: `4px solid ${groupColor}`,
                      tableLayout: "fixed",
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
                        {safeColumns.map((col, idx) => (
                          <ResizableHeader
                            key={col.id}
                            column={col}
                            index={idx}
                            totalColumns={safeColumns.length}
                            onResize={updateColumnWidth}
                            onRename={renameColumn}
                            onToggle={toggleColumn}
                            onDelete={deleteColumn}
                            onReorder={reorderColumns}
                          >
                            {col.label}
                          </ResizableHeader>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.map((item) => (
                        <Row
                          key={item.id}
                          item={item}
                          statuses={statuses}
                          groupColor={groupColor}
                          visibleColumns={safeColumns}
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
                  </div>
                )}

                <button
                  onClick={() => onAddItem(groupName)}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "6px 8px",
                    border: "none",
                    background: "transparent",
                    color: "#3b82f6",
                    cursor: "pointer",
                    fontSize: 13,
                    textAlign: "left",
                    marginTop: 4,
                    borderBottom: "2px solid var(--border-color)",
                    borderLeft: `4px solid ${groupColor}`,
                    borderRight: "2px solid var(--border-color)",
                    borderBottomLeftRadius: 4,
                    borderBottomRightRadius: 4,
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--bg-hover)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  + Add task
                </button>
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
