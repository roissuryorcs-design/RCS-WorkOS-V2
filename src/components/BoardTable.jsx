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
  onOpenColumnManager,
}) {
  const {
    updateColumnWidth,
    renameColumn,
    toggleColumn,
    deleteColumn,
    reorderColumns,
    visibleColumns,
    addColumn,
  } = useColumns();

  const [collapsed, setCollapsed] = useState({});
  const [popupGroup, setPopupGroup] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);

  const toggleCollapse = (groupName) => {
    setCollapsed((prev) => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const closePopup = () => setPopupGroup(null);

  const grouped = groups.reduce((acc, group) => {
    acc[group] = items.filter((item) => item.group === group);
    return acc;
  }, {});

  const safeColumns = (() => {
    const hasItem = visibleColumns.some((col) => col.id === "item");
    if (hasItem) return visibleColumns;
    return [
      { id: "item", label: "ITEM", width: 150, visible: true },
      ...visibleColumns,
    ];
  })();

  const toggleSelectItem = (itemId) => {
    setSelectedItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const handleDeleteSelected = () => {
    if (selectedItems.length === 0) return;
    if (confirm(`Delete ${selectedItems.length} selected item(s)?`)) {
      selectedItems.forEach((id) => onDeleteItem(id));
      setSelectedItems([]);
    }
  };

  const selectAllInGroup = (groupId, tasks) => {
    const allIds = tasks.map((item) => item.id);
    const allSelected = allIds.every((id) => selectedItems.includes(id));
    if (allSelected) {
      setSelectedItems((prev) => prev.filter((id) => !allIds.includes(id)));
    } else {
      const newIds = allIds.filter((id) => !selectedItems.includes(id));
      setSelectedItems((prev) => [...prev, ...newIds]);
    }
  };

  const handleAddColumn = () => {
    const name = prompt("Enter column name:");
    if (name && name.trim()) {
      addColumn(name.trim());
    }
  };

  const totalCols = 1 + safeColumns.length + 1;

  return (
    <div className="board-table-wrapper">
      {selectedItems.length > 0 && (
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 30,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "8px 12px",
            background: "var(--bg-hover)",
            borderRadius: 6,
            marginBottom: 12,
            border: "1px solid var(--border-color)",
            backdropFilter: "blur(8px)",
          }}
        >
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            {selectedItems.length} item(s) selected
          </span>
          <button
            onClick={handleDeleteSelected}
            style={{
              padding: "4px 12px",
              background: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            🗑️ Delete
          </button>
          <button
            onClick={() => setSelectedItems([])}
            style={{
              padding: "4px 12px",
              background: "transparent",
              border: "1px solid var(--border-color)",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 13,
              color: "var(--text-secondary)",
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {groups.map((groupName) => {
        const tasks = grouped[groupName] || [];
        const isCollapsed = collapsed[groupName] || false;
        const groupColor = groupColors[groupName] || "#3b82f6";

        return (
          <div key={groupName} style={{ marginBottom: 24, position: "relative" }}>
            {/* ============================================================
                HEADER GROUP – STICKY KIRI
                ============================================================ */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 8,
                position: "sticky",
                left: 0,
                zIndex: 15,
                background: "var(--bg-secondary)",
                padding: "4px 0",
                borderBottom: `2px solid ${groupColor}`,
              }}
            >
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

              {/* Tombol Manage Columns (⚙️) */}
              <button
                onClick={onOpenColumnManager}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 16,
                  color: "var(--text-secondary)",
                  padding: "0 4px 0 0",
                  marginRight: 4,
                  opacity: 0.6,
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = 0.6)}
                title="Manage Columns"
              >
                ⚙️
              </button>

              {/* Tombol ⋮ untuk Delete Group */}
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

            {/* TABEL */}
            {!isCollapsed && (
              <>
                {tasks.length > 0 ? (
                  <table
                    cellPadding="0"
                    style={{
                      borderCollapse: "collapse",
                      border: "2px solid var(--border-color)",
                      borderRadius: 4,
                      borderLeft: `4px solid ${groupColor}`,
                      tableLayout: "fixed",
                      width: "auto",
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
                            width: "36px",
                            minWidth: "36px",
                            maxWidth: "36px",
                            borderRight: "2px solid var(--border-color)",
                            textAlign: "center",
                            position: "sticky",
                            left: 0,
                            zIndex: 10,
                            background: "var(--bg-secondary)",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={
                              tasks.length > 0 &&
                              tasks.every((t) => selectedItems.includes(t.id))
                            }
                            onChange={() => selectAllInGroup(groupName, tasks)}
                            style={{ cursor: "pointer", width: 16, height: 16 }}
                          />
                        </th>

                        {safeColumns.map((col, idx) => {
                          const isStatus = col.id === "status";
                          const isItem = col.id === "item";
                          return (
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
                              isSticky={isItem}
                              stickyLeft={isItem ? 36 : 0}
                            >
                              {isStatus ? (
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4,
                                  }}
                                >
                                  <span>STATUS</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onOpenStatusManager();
                                    }}
                                    style={{
                                      background: "none",
                                      border: "none",
                                      cursor: "pointer",
                                      fontSize: 16,
                                      color: "var(--text-secondary)",
                                      padding: 0,
                                      display: "flex",
                                      alignItems: "center",
                                      opacity: 0.6,
                                      transition: "opacity 0.2s",
                                    }}
                                    onMouseEnter={(e) =>
                                      (e.currentTarget.style.opacity = 1)
                                    }
                                    onMouseLeave={(e) =>
                                      (e.currentTarget.style.opacity = 0.6)
                                    }
                                    title="Kelola status"
                                  >
                                    🔽
                                  </button>
                                </div>
                              ) : (
                                col.label
                              )}
                            </ResizableHeader>
                          );
                        })}

                        <th
                          style={{
                            padding: "8px 8px",
                            width: "50px",
                            minWidth: "50px",
                            maxWidth: "50px",
                            borderRight: "none",
                            borderLeft: "2px solid var(--border-color)",
                            textAlign: "center",
                            cursor: "pointer",
                            color: "var(--text-muted)",
                          }}
                          onClick={handleAddColumn}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = "var(--bg-hover)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "transparent")
                          }
                        >
                          <span style={{ fontSize: 18, fontWeight: 300 }}>+</span>
                        </th>
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
                          isSelected={selectedItems.includes(item.id)}
                          onToggleSelect={() => toggleSelectItem(item.id)}
                          onUpdate={(field, value) => onUpdateItem(item.id, field, value)}
                          onDelete={() => onDeleteItem(item.id)}
                        />
                      ))}

                      {/* ============================================================
                          BARIS "+ Add item" – STICKY KIRI
                          ============================================================ */}
                      <tr>
                        <td
                          colSpan={totalCols}
                          style={{
                            padding: 0,
                            border: "none",
                            position: "sticky",
                            left: 0,
                            zIndex: 5,
                            background: "var(--bg-secondary)",
                          }}
                        >
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
                              borderBottom: "2px solid var(--border-color)",
                              borderLeft: `4px solid ${groupColor}`,
                              borderRight: "2px solid var(--border-color)",
                              borderBottomLeftRadius: 4,
                              borderBottomRightRadius: 4,
                              transition: "background 0.15s",
                              boxSizing: "border-box",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background = "var(--bg-hover)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background = "transparent")
                            }
                          >
                            + Add item
                          </button>
                        </td>
                      </tr>
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
                      Add item
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
