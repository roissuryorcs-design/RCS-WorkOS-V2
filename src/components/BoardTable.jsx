// src/components/BoardTable.jsx
import { useState } from "react";
import Row from "./Row";
import ResizableHeader from "./ResizableHeader";
import { useColumns } from "../context/ColumnContext";

export default function BoardTable({
  items,
  groups,
  groupColors,
  onUpdateGroupColor,
  onUpdateItem,
  onDeleteItem,
  onAddGroup,
  onDeleteGroup,
  onAddItem,
  onOpenStatusManager,
  onRenameGroup,
  onOpenAddColumn,
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
  const [selectedItems, setSelectedItems] = useState([]);

  const toggleCollapse = (groupName) => {
    setCollapsed((prev) => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const closePopup = () => setPopupGroup(null);

  const handleRenameGroup = (groupName) => {
    const newName = prompt("Enter new group name:", groupName);
    if (newName && newName.trim() && newName.trim() !== groupName) {
      onRenameGroup(groupName, newName.trim());
    }
  };

  const grouped = groups.reduce((acc, group) => {
    acc[group] = items.filter((item) => item.group === group);
    return acc;
  }, {});

  const safeColumns = (() => {
    const hasItem = visibleColumns.some((col) => col.id === "item");
    if (hasItem) return visibleColumns;
    return [
      { id: "item", label: "ITEM", type: "text", width: 200, visible: true },
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

  if (groups.length === 0) {
    return <div style={{ padding: 20, color: "var(--text-muted)" }}>No groups found. Add a new group.</div>;
  }

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

      {/* ===== SATU CONTAINER UNTUK SCROLL HORIZONTAL ===== */}
      <div className="board-scroll-container">
        {groups.map((groupName) => {
          const tasks = grouped[groupName] || [];
          const isCollapsed = collapsed[groupName] || false;
          const groupColor = groupColors[groupName] || "#3b82f6";

          return (
            <div key={groupName} className="group-block" style={{ marginBottom: 24 }}>

              {/* =============================================
                  GROUP HEADER - TANPA STICKY (hanya sebagai label)
                  ============================================= */}
              <div 
                className="group-header-label" 
                style={{ 
                  borderBottomColor: groupColor, 
                  borderLeftColor: groupColor 
                }}
              >
                <button 
                  onClick={() => toggleCollapse(groupName)} 
                  className="group-toggle-btn"
                >
                  {isCollapsed ? "▶" : "▼"}
                </button>
                <button 
                  onClick={() => setPopupGroup(groupName)} 
                  className="group-menu-btn"
                >
                  ⋮
                </button>
                <h3 className="group-title" style={{ color: groupColor }}>
                  {groupName}
                </h3>
                <input 
                  type="color" 
                  value={groupColor} 
                  onChange={(e) => onUpdateGroupColor(groupName, e.target.value)} 
                  className="group-color-picker" 
                />
              </div>

              {/* POPUP GROUP */}
              {popupGroup === groupName && (
                <>
                  <div className="group-popup">
                    <button onClick={() => { closePopup(); handleRenameGroup(groupName); }}>
                      ✏️ Rename Group
                    </button>
                    <button onClick={() => { closePopup(); onDeleteGroup(groupName); }}>
                      🗑️ Delete Group
                    </button>
                  </div>
                  <div className="group-popup-overlay" onClick={closePopup} />
                </>
              )}

              {/* TABEL */}
              {!isCollapsed && (
                <>
                  {tasks.length > 0 ? (
                    <table className="board-table">
                      <thead>
                        <tr className="table-header-row">
                          {/* CHECKBOX - STICKY HORIZONTAL */}
                          <th 
                            className="checkbox-header" 
                            style={{ borderLeftColor: groupColor }}
                          >
                            <input
                              type="checkbox"
                              checked={
                                tasks.length > 0 &&
                                tasks.every((t) => selectedItems.includes(t.id))
                              }
                              onChange={() => selectAllInGroup(groupName, tasks)}
                            />
                          </th>

                          {/* KOLOM */}
                          {safeColumns.map((col, idx) => {
                            const isItem = col.id === "item";
                            const isLast = idx === safeColumns.length - 1;
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
                                isLast={isLast}
                              >
                                {col.label}
                              </ResizableHeader>
                            );
                          })}

                          <th className="add-column-header" onClick={onOpenAddColumn}>
                            <span>+</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {tasks.map((item) => (
                          <Row
                            key={item.id}
                            item={item}
                            groupColor={groupColor}
                            visibleColumns={safeColumns}
                            isSelected={selectedItems.includes(item.id)}
                            onToggleSelect={() => toggleSelectItem(item.id)}
                            onUpdate={(field, value) => onUpdateItem(item.id, field, value)}
                            onDelete={() => onDeleteItem(item.id)}
                            onOpenStatusManager={onOpenStatusManager}
                          />
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div 
                      className="empty-group-message" 
                      style={{ borderLeftColor: groupColor }}
                    >
                      No items in this group.
                      <button onClick={() => onAddItem(groupName)}>Add item</button>
                    </div>
                  )}

                  {/* =============================================
                      ADD ITEM - STICKY HORIZONTAL
                      ============================================= */}
                  <div 
                    className="add-item-sticky" 
                    style={{ borderLeftColor: groupColor }}
                  >
                    <button onClick={() => onAddItem(groupName)}>
                      + Add item
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* TOMBOL ADD NEW GROUP */}
      <div className="add-group-container">
        <button onClick={onAddGroup}>+ Add new group</button>
      </div>
    </div>
  );
}
