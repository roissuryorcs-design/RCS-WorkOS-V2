import { useState, useRef } from "react";
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
  onAddSubItem,
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
      { id: "item", label: "ITEM", type: "text", width: 250, visible: true },
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

  // ============================================================
  // FUNGSI TAMBAH SUB ITEM - CEK KEDALAMAN PER PARENT
  // ============================================================
  const handleAddSubItem = (parentId) => {
    if (!onAddSubItem) {
      console.warn('onAddSubItem is not defined');
      return;
    }

    console.log('🔵 handleAddSubItem called with parentId:', parentId);

    // Cari parent item di semua level
    const findParent = (items, id) => {
      for (const item of items) {
        if (item.id === id) {
          return item;
        }
        if (item.children && item.children.length > 0) {
          const found = findParent(item.children, id);
          if (found) return found;
        }
      }
      return null;
    };

    const parent = findParent(items, parentId);
    if (!parent) {
      console.warn('Parent not found for id:', parentId);
      return;
    }

    // Hitung kedalaman untuk PARENT ini (bukan seluruh board)
    const findDepthInTree = (items, id, currentDepth = 0) => {
      for (const item of items) {
        if (item.id === id) {
          return currentDepth;
        }
        if (item.children && item.children.length > 0) {
          const found = findDepthInTree(item.children, id, currentDepth + 1);
          if (found !== -1) return found;
        }
      }
      return -1;
    };

    const currentDepth = findDepthInTree(items, parentId, 0);
    console.log('🔵 Current depth for parent:', currentDepth);

    // Maksimal 4 level (0,1,2,3)
    if (currentDepth >= 3) {
      alert('Maximum 4 levels reached for this item!');
      return;
    }

    const newDepth = currentDepth + 1;

    // Fungsi menentukan nama berdasarkan level
    const getLevelName = (depth) => {
      if (depth <= 0) return "New Task";
      if (depth === 1) return "Sub Item";
      if (depth === 2) return "Sub Sub Item";
      if (depth === 3) return "Sub Sub Sub Item";
      return "New Task";
    };

    const newTitle = getLevelName(newDepth);
    console.log('🔵 New title:', newTitle);

    // Panggil onAddSubItem dari App.jsx
    onAddSubItem(parentId, newTitle);
  };

  const CHECKBOX_WIDTH = 36;
  const ADD_COLUMN_WIDTH = 50;
  
  const totalWidth = safeColumns.reduce((sum, col) => sum + col.width, 0) + CHECKBOX_WIDTH + ADD_COLUMN_WIDTH;

  if (groups.length === 0) {
    return <div style={{ padding: 20, color: "var(--text-muted)" }}>No groups found. Add a new group.</div>;
  }

  return (
    <div className="board-table-wrapper">
      {selectedItems.length > 0 && (
        <div className="selected-items-bar">
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            {selectedItems.length} item(s) selected
          </span>
          <button onClick={handleDeleteSelected} className="delete-selected-btn">
            🗑️ Delete
          </button>
          <button onClick={() => setSelectedItems([])} className="cancel-selected-btn">
            Cancel
          </button>
        </div>
      )}

      <div className="board-scroll-container">
        <div className="board-scroll-content">
          {groups.map((groupName) => {
            const tasks = grouped[groupName] || [];
            const isCollapsed = collapsed[groupName] || false;
            const groupColor = groupColors[groupName] || "#3b82f6";

            return (
              <div 
                key={groupName} 
                className="group-wrapper"
                style={{ 
                  '--group-color': groupColor,
                  marginBottom: '24px',
                  position: 'relative',
                  width: 'max-content',
                  minWidth: '100%',
                  overflow: 'visible',
                }}
              >
                <div 
                  className="ai-sticky-line"
                  style={{ 
                    backgroundColor: groupColor,
                    position: 'sticky',
                    left: 0,
                    top: 0,
                    width: '3.33px',
                    height: '100%',
                    zIndex: 10000,
                    float: 'left',
                    marginRight: '-3.33px',
                    flexShrink: 0,
                    pointerEvents: 'none',
                    minHeight: '48px',
                  }}
                />

                <div 
                  className="group-header"
                  style={{
                    position: 'sticky',
                    top: 0,
                    left: 0,
                    zIndex: 999,
                    background: 'var(--bg-secondary)',
                    width: 'fit-content',
                    minWidth: '100%',
                    borderBottom: `2px solid ${groupColor}`,
                    padding: 0,
                    marginBottom: 0,
                    minHeight: 48,
                    overflow: 'visible',
                  }}
                >
                  <div 
                    className="group-header-inner"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      maxWidth: '1244px',
                      width: '100%',
                      height: '48px',
                      position: 'sticky',
                      left: 0,
                      zIndex: 1000,
                      backgroundColor: 'var(--bg-secondary)',
                      padding: 0,
                      margin: 0,
                      boxSizing: 'border-box',
                      overflow: 'hidden',
                      borderLeft: `4px solid ${groupColor}`,
                    }}
                  >
                    <button 
                      className="group-toggle-btn"
                      onClick={() => toggleCollapse(groupName)}
                      style={{
                        flex: '0 0 35px',
                        width: '35px',
                        minWidth: '35px',
                        height: '100%',
                        margin: 0,
                        padding: 0,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderRight: '2px solid var(--border-color)',
                        borderLeft: 'none',
                        background: 'transparent',
                        borderTop: 'none',
                        borderBottom: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)',
                        zIndex: 1002,
                        fontSize: '16px',
                        flexShrink: 0,
                      }}
                    >
                      {isCollapsed ? '▶' : '▼'}
                    </button>

                    <div
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 8px',
                        minWidth: 0,
                        overflow: 'hidden',
                      }}
                    >
                      <button 
                        className="group-menu-btn"
                        onClick={() => setPopupGroup(groupName)}
                        style={{
                          flexShrink: 0,
                          padding: '4px',
                          marginRight: '4px',
                          color: 'var(--text-secondary)',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '18px',
                        }}
                      >
                        ⋮
                      </button>

                      <input
                        type="color"
                        value={groupColor}
                        onChange={(e) => onUpdateGroupColor(groupName, e.target.value)}
                        className="group-color-picker"
                        style={{
                          flexShrink: 0,
                          width: '24px',
                          height: '24px',
                          marginRight: '6px',
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      />

                      <h3 
                        className="group-title"
                        style={{
                          flex: '1 1 auto',
                          minWidth: 0,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          padding: '0 10px',
                          margin: 0,
                          fontSize: '14px',
                          fontWeight: 600,
                          color: groupColor,
                          position: 'sticky',
                          left: '35px',
                          zIndex: 1002,
                        }}
                      >
                        {groupName}
                      </h3>
                    </div>
                  </div>
                </div>

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

                {!isCollapsed && (
                  <div className="group-content">
                    {tasks.length > 0 ? (
                      <>
                        <div className="table-wrapper">
                          <table className="board-table" style={{ width: totalWidth }}>
                            <thead>
                              <tr className="table-header-row">
                                <th 
                                  className="checkbox-header" 
                                  style={{ 
                                    position: 'sticky',
                                    left: 0,
                                    zIndex: 101,
                                    background: 'var(--bg-secondary)',
                                    width: '36px',
                                    minWidth: '36px',
                                    maxWidth: '36px',
                                    padding: '8px 8px',
                                    textAlign: 'center',
                                    verticalAlign: 'middle',
                                    borderRight: '2px solid var(--border-color)',
                                    borderLeft: `4px solid ${groupColor}`,
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={
                                      tasks.length > 0 &&
                                      tasks.every((t) => selectedItems.includes(t.id))
                                    }
                                    onChange={() => selectAllInGroup(groupName, tasks)}
                                    style={{
                                      cursor: 'pointer',
                                      width: '16px',
                                      height: '16px',
                                      margin: '0 auto',
                                      padding: 0,
                                      display: 'block',
                                      accentColor: groupColor,
                                    }}
                                  />
                                </th>

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
                              {tasks.map((item) => {
                                const handleUpdateItem = (field, value) => {
                                  onUpdateItem(item.id, field, value);
                                };

                                const handleDeleteItem = () => {
                                  onDeleteItem(item.id);
                                };

                                return (
                                  <Row
                                    key={item.id}
                                    item={item}
                                    groupColor={groupColor}
                                    visibleColumns={safeColumns}
                                    isSelected={selectedItems.includes(item.id)}
                                    onToggleSelect={toggleSelectItem}
                                    onUpdate={handleUpdateItem}
                                    onDelete={handleDeleteItem}
                                    onOpenStatusManager={onOpenStatusManager}
                                    onAddSubItem={handleAddSubItem}
                                    selectedItems={selectedItems}
                                  />
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        <div 
                          className="add-item-container"
                          style={{ 
                            width: totalWidth,
                            display: 'flex',
                            alignItems: 'center',
                            background: 'var(--bg-secondary)',
                            border: '2px solid var(--border-color)',
                            borderTop: 'none',
                            borderBottomLeftRadius: 4,
                            borderBottomRightRadius: 4,
                            minHeight: 40,
                            borderLeft: 'none',
                            borderRight: '2px solid var(--border-color)',
                            marginTop: '-2px',
                          }}
                        >
                          <div
                            className="add-item-checkbox"
                            style={{
                              width: '36px',
                              minWidth: '36px',
                              maxWidth: '36px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '6px 8px',
                              borderRight: '2px solid var(--border-color)',
                              background: 'var(--bg-secondary)',
                              position: 'sticky',
                              left: 0,
                              zIndex: 15,
                              boxSizing: 'border-box',
                              borderLeft: `4px solid ${groupColor}`,
                              borderTop: 'none',
                              borderBottom: 'none',
                              height: '100%',
                              minHeight: '40px',
                            }}
                          >
                            <input
                              type="checkbox"
                              disabled
                              style={{
                                width: '16px',
                                height: '16px',
                                margin: 0,
                                padding: 0,
                                display: 'block',
                                opacity: 0.5,
                                cursor: 'default',
                                pointerEvents: 'none',
                                flexShrink: 0,
                              }}
                            />
                          </div>

                          <div
                            className="add-item-sticky"
                            style={{
                              position: 'sticky',
                              left: '36px',
                              zIndex: 15,
                              background: 'var(--bg-secondary)',
                              padding: '6px 8px',
                              flex: 1,
                              borderLeft: 'none',
                              borderRight: 'none',
                              minHeight: '40px',
                            }}
                          >
                            <button
                              onClick={() => onAddItem(groupName)}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                color: '#3b82f6',
                                cursor: 'pointer',
                                fontSize: 13,
                                padding: '4px 0',
                                textAlign: 'left',
                                width: '100%',
                                transition: 'background 0.15s',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'var(--bg-hover)';
                                e.currentTarget.style.paddingLeft = '8px';
                                e.currentTarget.style.borderRadius = '4px';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.paddingLeft = '0';
                              }}
                            >
                              + Add item
                            </button>
                          </div>

                          <div style={{ flex: 1, minWidth: '50px' }} />
                        </div>
                      </>
                    ) : (
                      <div 
                        className="empty-group-message" 
                        style={{ borderLeft: `4px solid ${groupColor}` }}
                      >
                        No items in this group.
                        <button onClick={() => onAddItem(groupName)}>Add item</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="add-group-container">
        <button onClick={onAddGroup}>+ Add new group</button>
      </div>
    </div>
  );
}
