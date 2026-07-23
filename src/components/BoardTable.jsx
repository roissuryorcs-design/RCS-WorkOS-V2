import { useState, useRef, useEffect, useCallback } from "react";
import Row from "./Row";
import ResizableHeader from "./ResizableHeader";
import { useColumns } from "../context/ColumnContext";
import "../css/board.css";

export default function BoardTable({
  items = [],
  groups: externalGroups = [],
  statuses = {},
  groupColors: externalGroupColors = {},
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
    visibleColumns = [],
  } = useColumns() || {};

  // ============ STATE ============
  const [groups, setGroups] = useState(() => {
    if (externalGroups && Array.isArray(externalGroups) && externalGroups.length > 0) {
      return externalGroups;
    }
    return ['Default Group'];
  });

  const [groupColors, setGroupColors] = useState(() => {
    if (externalGroupColors && typeof externalGroupColors === 'object' && Object.keys(externalGroupColors).length > 0) {
      return externalGroupColors;
    }
    return {};
  });

  // ============ SYNC DENGAN PROPS ============
  useEffect(() => {
    if (externalGroups && Array.isArray(externalGroups) && externalGroups.length > 0) {
      setGroups(externalGroups);
    }
  }, [externalGroups]);

  useEffect(() => {
    if (externalGroupColors && typeof externalGroupColors === 'object' && Object.keys(externalGroupColors).length > 0) {
      setGroupColors(externalGroupColors);
    }
  }, [externalGroupColors]);

  // ============================================================
  // 🔥 DRAG & DROP
  // ============================================================
  const boardRef = useRef(null);

  const saveNewOrder = useCallback(() => {
    const container = boardRef.current;
    if (!container) return;

    const currentOrderIds = [...container.querySelectorAll('.group-wrapper')]
      .map(group => group.dataset.groupId)
      .filter(id => id !== '');

    if (currentOrderIds.length === 0) return;

    // Update groups berdasarkan urutan baru
    setGroups(prevGroups => {
      if (!prevGroups || !Array.isArray(prevGroups)) return ['Default Group'];
      
      const groupMap = new Map(prevGroups.map((g, idx) => [String(idx + 1), g]));
      const newOrder = currentOrderIds
        .map(id => groupMap.get(id) || null)
        .filter(Boolean);

      if (newOrder.length === prevGroups.length && newOrder.length > 0) {
        return newOrder;
      }
      return prevGroups;
    });
  }, []);

  useEffect(() => {
    const container = boardRef.current;
    if (!container) return;

    const getDragAfterElement = (container, y) => {
      const draggables = [...container.querySelectorAll('.group-wrapper:not(.dragging)')];
      return draggables.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
          return { offset, element: child };
        }
        return closest;
      }, { offset: Number.NEGATIVE_INFINITY }).element;
    };

    const handleDragStart = (e) => {
      const item = e.target.closest('.group-wrapper');
      if (!item) {
        e.preventDefault();
        return;
      }
      item.classList.add('dragging');
      e.dataTransfer.setData('text/plain', '');
      e.dataTransfer.effectAllowed = 'move';
      item.style.opacity = '0.5';
    };

    const handleDragEnd = (e) => {
      const item = e.target.closest('.group-wrapper');
      if (!item) return;
      item.classList.remove('dragging');
      item.style.opacity = '1';
      saveNewOrder();
    };

    const handleDragOver = (e) => {
      e.preventDefault();
      const draggingItem = container.querySelector('.group-wrapper.dragging');
      if (!draggingItem) return;
      const afterElement = getDragAfterElement(container, e.clientY);
      if (afterElement == null) {
        container.appendChild(draggingItem);
      } else {
        container.insertBefore(draggingItem, afterElement);
      }
    };

    container.addEventListener('dragstart', handleDragStart);
    container.addEventListener('dragend', handleDragEnd);
    container.addEventListener('dragover', handleDragOver);

    return () => {
      container.removeEventListener('dragstart', handleDragStart);
      container.removeEventListener('dragend', handleDragEnd);
      container.removeEventListener('dragover', handleDragOver);
    };
  }, [saveNewOrder]);

  // ============================================================
  // STATE LAINNYA
  // ============================================================
  const [collapsed, setCollapsed] = useState({});
  const [popupGroup, setPopupGroup] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);

  const toggleCollapse = (groupName) => {
    setCollapsed((prev) => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const closePopup = () => setPopupGroup(null);

  const handleRenameGroup = (oldName, newName) => {
    if (onRenameGroup) {
      onRenameGroup(oldName, newName);
    }
  };

  const handleDeleteGroup = (groupName) => {
    if (onDeleteGroup) {
      onDeleteGroup(groupName);
    }
  };

  const handleAddGroup = () => {
    if (onAddGroup) {
      onAddGroup();
    }
  };

  const handleUpdateGroupColor = (groupName, color) => {
    if (onUpdateGroupColor) {
      onUpdateGroupColor(groupName, color);
    }
    setGroupColors(prev => ({ ...prev, [groupName]: color }));
  };

  const handleAddItem = (groupName) => {
    if (onAddItem) {
      onAddItem(groupName);
    }
  };

  // ============================================================
  // HELPER FUNCTIONS
  // ============================================================
  const grouped = groups.reduce((acc, group) => {
    acc[group] = items.filter((item) => item?.group === group);
    return acc;
  }, {});

  const safeColumns = (() => {
    if (!visibleColumns || !Array.isArray(visibleColumns) || visibleColumns.length === 0) {
      return [{ id: "item", label: "ITEM", type: "text", width: 250, visible: true }];
    }
    const hasItem = visibleColumns.some((col) => col?.id === "item");
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
    if (!tasks || !Array.isArray(tasks)) return;
    const allIds = tasks.map((item) => item?.id).filter(Boolean);
    const allSelected = allIds.every((id) => selectedItems.includes(id));
    if (allSelected) {
      setSelectedItems((prev) => prev.filter((id) => !allIds.includes(id)));
    } else {
      const newIds = allIds.filter((id) => !selectedItems.includes(id));
      setSelectedItems((prev) => [...prev, ...newIds]);
    }
  };

  const handleAddSubItem = (parentId) => {
    if (onAddSubItem) {
      onAddSubItem(parentId);
    }
  };

  const CHECKBOX_WIDTH = 36;
  const ADD_COLUMN_WIDTH = 50;
  
  const totalWidth = safeColumns.reduce((sum, col) => sum + (col?.width || 100), 0) + CHECKBOX_WIDTH + ADD_COLUMN_WIDTH;

  // ============================================================
  // 🛡️ GUARD: CEK GROUPS SEBELUM RENDER
  // ============================================================
  if (!groups || !Array.isArray(groups) || groups.length === 0) {
    return (
      <div className="board-table-wrapper">
        <div className="board-scroll-content" style={{ 
          padding: '60px 20px', 
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary, #666)' }}>
            No groups available. Add a new group to get started.
          </p>
          <button onClick={handleAddGroup} className="add-group-btn" style={{
            padding: '10px 24px',
            border: '2px dashed #3b82f6',
            background: 'transparent',
            borderRadius: '8px',
            cursor: 'pointer',
            color: '#3b82f6',
            fontSize: '14px',
            fontWeight: 500,
          }}>
            + Add new group
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER UTAMA
  // ============================================================
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
        <div 
          className="board-scroll-content"
          ref={boardRef}
        >
          {groups.map((groupName, index) => {
            const tasks = grouped[groupName] || [];
            const isCollapsed = collapsed[groupName] || false;
            const groupColor = groupColors[groupName] || "#3b82f6";
            const groupId = index + 1;

            return (
              <div 
                key={groupName} 
                className="group-wrapper"
                draggable="true"
                data-group-id={String(groupId)}
                data-group-name={groupName}
                style={{ 
                  '--group-color': groupColor,
                }}
              >
                {/* STRIP WARNA */}
                <div 
                  className="ai-sticky-line"
                  style={{ 
                    backgroundColor: groupColor,
                    position: 'sticky',
                    left: 0,
                    top: 0,
                    width: '4px',
                    height: '100%',
                    zIndex: 10000,
                    float: 'left',
                    marginRight: '-4px',
                    flexShrink: 0,
                    pointerEvents: 'none',
                    minHeight: '48px',
                    borderRadius: '4px 0 0 4px',
                  }}
                />

                {/* HEADER */}
                <div 
                  className="group-header"
                  style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    background: 'var(--bg-secondary, #fafafa)',
                    borderRadius: '6px 6px 0 0',
                    padding: '8px 12px',
                    margin: '-12px -12px 12px -12px',
                    borderBottom: `2px solid ${groupColor}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'grab',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span 
                      className="collapse-btn"
                      onClick={() => toggleCollapse(groupName)}
                      style={{
                        cursor: 'pointer',
                        transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0)',
                        transition: 'transform 0.2s',
                        display: 'inline-block',
                        fontSize: '12px',
                      }}
                    >
                      ▼
                    </span>
                    <span className="group-title" style={{ fontWeight: 600, fontSize: '14px' }}>
                      {groupName}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted, #999)' }}>
                      ({tasks.length})
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                      className="group-menu-btn"
                      onClick={() => setPopupGroup(popupGroup === groupName ? null : groupName)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '16px',
                        color: 'var(--text-secondary, #666)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                      }}
                    >
                      ⋮
                    </button>
                  </div>
                </div>

                {/* POPUP */}
                {popupGroup === groupName && (
                  <>
                    <div className="group-popup-overlay" onClick={closePopup} />
                    <div className="group-popup" style={{ position: 'absolute', top: '48px', left: '0', zIndex: 2000 }}>
                      <button onClick={() => { 
                        const newName = prompt('Nama baru:', groupName);
                        if (newName && newName.trim()) {
                          handleRenameGroup(groupName, newName.trim());
                        }
                        closePopup(); 
                      }}>
                        ✏️ Rename
                      </button>
                      <button onClick={() => { 
                        const color = prompt('Warna (hex):', groupColor);
                        if (color && color.trim()) {
                          handleUpdateGroupColor(groupName, color.trim());
                        }
                        closePopup(); 
                      }}>
                        🎨 Change Color
                      </button>
                      <button onClick={() => { handleAddItem(groupName); closePopup(); }}>
                        ➕ Add Item
                      </button>
                      <button 
                        onClick={() => { 
                          if (confirm(`Delete group "${groupName}" and all its items?`)) {
                            handleDeleteGroup(groupName);
                          }
                          closePopup(); 
                        }}
                        style={{ color: '#f44336' }}
                      >
                        🗑️ Delete Group
                      </button>
                    </div>
                  </>
                )}

                {/* KONTEN */}
                {!isCollapsed && (
                  <div className="group-content">
                    {!tasks || tasks.length === 0 ? (
                      <div className="empty-group-message">
                        <span>No items in this group</span>
                        <button onClick={() => handleAddItem(groupName)}>+ Add Item</button>
                      </div>
                    ) : (
                      <table className="board-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th style={{ width: CHECKBOX_WIDTH, padding: '4px 0' }}>
                              <input
                                type="checkbox"
                                checked={tasks.every(t => selectedItems.includes(t?.id))}
                                onChange={() => selectAllInGroup(groupName, tasks)}
                              />
                            </th>
                            <th style={{ padding: '4px 8px', textAlign: 'left', fontSize: '11px', color: 'var(--text-muted, #999)', fontWeight: 600 }}>
                              ITEM
                            </th>
                            {safeColumns.filter(c => c?.id !== 'item').map(col => (
                              <th key={col?.id || Math.random()} style={{ padding: '4px 8px', textAlign: 'left', fontSize: '11px', color: 'var(--text-muted, #999)', fontWeight: 600 }}>
                                {col?.label || col?.id || 'Column'}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {tasks.map((item) => (
                            <Row
                              key={item?.id || Math.random()}
                              item={item}
                              columns={safeColumns}
                              groupColor={groupColor}
                              statuses={statuses}
                              isSelected={selectedItems.includes(item?.id)}
                              onToggleSelect={toggleSelectItem}
                              onUpdateItem={onUpdateItem}
                              onDeleteItem={onDeleteItem}
                              onAddSubItem={handleAddSubItem}
                              onOpenStatusManager={onOpenStatusManager}
                              level={0}
                            />
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="add-group-container">
        <button onClick={handleAddGroup}>+ Add new group</button>
      </div>
    </div>
  );
}
