import { useState, useRef, useEffect, useCallback } from "react";
import Row from "./Row";
import ResizableHeader from "./ResizableHeader";
import { useColumns } from "../context/ColumnContext";
import { 
  DEFAULT_GROUP,
  loadGroups, 
  saveGroups, 
  deleteGroupSafe, 
  addGroupSafe,
  ensureGroupExists,
  getDefaultItems
} from "../data/treeData";
import "../css/board.css"; // ✅ PASTIKAN CSS TERIMPORT

export default function BoardTable({
  items,
  groups: externalGroups,
  groupColors: externalGroupColors,
  onUpdateGroupColor: externalOnUpdateGroupColor,
  onUpdateItem,
  onDeleteItem,
  onAddGroup: externalOnAddGroup,
  onDeleteGroup: externalOnDeleteGroup,
  onAddItem,
  onAddSubItem,
  onOpenStatusManager,
  onRenameGroup: externalOnRenameGroup,
  onOpenAddColumn,
  defaultGroupName = DEFAULT_GROUP.title,
}) {
  const {
    updateColumnWidth,
    renameColumn,
    toggleColumn,
    deleteColumn,
    reorderColumns,
    visibleColumns,
  } = useColumns();

  // ============ STATE ============
  const [groups, setGroups] = useState(() => {
    if (externalGroups && externalGroups.length > 0) {
      return externalGroups;
    }
    return loadGroups();
  });

  const [groupColors, setGroupColors] = useState(() => {
    if (externalGroupColors && Object.keys(externalGroupColors).length > 0) {
      return externalGroupColors;
    }
    const defaultColors = {};
    const loaded = loadGroups();
    loaded.forEach(g => {
      if (g === DEFAULT_GROUP.title) {
        defaultColors[g] = DEFAULT_GROUP.color || '#4CAF50';
      } else {
        defaultColors[g] = '#3b82f6';
      }
    });
    return defaultColors;
  });

  // ============ EFFECTS ============
  useEffect(() => {
    saveGroups(groups);
  }, [groups]);

  useEffect(() => {
    if (externalGroups && externalGroups.length > 0) {
      setGroups(externalGroups);
    }
  }, [externalGroups]);

  useEffect(() => {
    if (externalGroupColors && Object.keys(externalGroupColors).length > 0) {
      setGroupColors(externalGroupColors);
    }
  }, [externalGroupColors]);

  // ============================================================
  // 🔥 DRAG & DROP - DENGAN USE CALLBACK (STABIL)
  // ============================================================
  const boardRef = useRef(null);

  // Fungsi untuk menyimpan urutan baru
  const saveNewOrder = useCallback(() => {
    const container = boardRef.current;
    if (!container) return;

    // Ambil semua ID dari DOM
    const currentOrderIds = [...container.querySelectorAll('.group-wrapper')]
      .map(group => group.dataset.groupId)
      .filter(id => id !== '');

    console.log('📦 Urutan baru (ID):', currentOrderIds);

    if (currentOrderIds.length === 0) return;

    setGroups(prevGroups => {
      // Buat Map untuk akses cepat: ID -> Nama Group
      const groupMap = new Map(prevGroups.map((g, idx) => [String(idx + 1), g]));

      // Buat urutan baru berdasarkan ID
      const newOrder = currentOrderIds
        .map(id => groupMap.get(id) || null)
        .filter(Boolean);

      console.log('📦 Urutan baru (nama):', newOrder);

      // Validasi: pastikan jumlah sama
      if (newOrder.length === prevGroups.length && newOrder.length > 0) {
        localStorage.setItem('board-groups', JSON.stringify(newOrder));
        return newOrder;
      }

      return prevGroups;
    });
  }, []);

  // Effect untuk event listener drag & drop
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
      
      // Simpan urutan baru setelah drag selesai
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
    if (externalOnRenameGroup) {
      externalOnRenameGroup(oldName, newName);
    }
    
    setGroups(prev => prev.map(g => g === oldName ? newName : g));
    setGroupColors(prev => {
      const newColors = { ...prev };
      newColors[newName] = prev[oldName];
      delete newColors[oldName];
      return newColors;
    });
  };

  const handleDeleteGroup = (groupName) => {
    if (externalOnDeleteGroup) {
      externalOnDeleteGroup(groupName);
    }
    
    setGroups(prev => prev.filter(g => g !== groupName));
    setGroupColors(prev => {
      const newColors = { ...prev };
      delete newColors[groupName];
      return newColors;
    });
  };

  // ============================================================
  // ADD GROUP
  // ============================================================
  const handleAddGroup = () => {
    const newTitle = prompt("Masukkan nama group baru:");
    if (!newTitle || !newTitle.trim()) return;
    
    if (newTitle.trim() === defaultGroupName) {
      alert(`"${defaultGroupName}" adalah nama group default!`);
      return;
    }
    
    if (groups.includes(newTitle.trim())) {
      alert(`Group "${newTitle.trim()}" sudah ada!`);
      return;
    }

    if (externalOnAddGroup) {
      externalOnAddGroup(newTitle.trim());
    }

    setGroups(prev => [...prev, newTitle.trim()]);
    setGroupColors(prev => ({ ...prev, [newTitle.trim()]: '#757575' }));

    if (onAddItem) {
      onAddItem(newTitle.trim());
    }
  };

  const handleUpdateGroupColor = (groupName, color) => {
    if (externalOnUpdateGroupColor) {
      externalOnUpdateGroupColor(groupName, color);
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

  const handleAddSubItem = (parentId) => {
    if (!onAddSubItem) return;
    
    const findParent = (items, id) => {
      for (const item of items) {
        if (item.id === id) return item;
        if (item.children) {
          const found = findParent(item.children, id);
          if (found) return found;
        }
      }
      return null;
    };

    const parent = findParent(items, parentId);
    if (!parent) return;

    const getDepth = (items, id, currentDepth = 0) => {
      for (const item of items) {
        if (item.id === id) return currentDepth;
        if (item.children) {
          const found = getDepth(item.children, id, currentDepth + 1);
          if (found !== -1) return found;
        }
      }
      return -1;
    };

    const currentDepth = getDepth(items, parentId, 0);
    if (currentDepth >= 3) {
      alert('Maximum 4 levels reached!');
      return;
    }

    const getLevelName = (depth) => {
      if (depth <= 0) return "New Task";
      if (depth === 1) return "Sub Item";
      if (depth === 2) return "Sub Sub Item";
      if (depth === 3) return "Sub Sub Sub Item";
      return "New Task";
    };

    const newTitle = getLevelName(currentDepth + 1);
    onAddSubItem(parentId, newTitle);
  };

  const CHECKBOX_WIDTH = 36;
  const ADD_COLUMN_WIDTH = 50;
  
  const totalWidth = safeColumns.reduce((sum, col) => sum + col.width, 0) + CHECKBOX_WIDTH + ADD_COLUMN_WIDTH;

  // ============================================================
  // RENDER
  // ============================================================
  if (groups.length === 0) {
    setGroups([defaultGroupName]);
    return null;
  }

  const getDisplayTitle = (groupName) => {
    if (groupName === defaultGroupName) {
      return "Group Title";
    }
    return groupName;
  };

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
            const isDefault = groupName === defaultGroupName;
            const groupColor = groupColors[groupName] || (isDefault ? DEFAULT_GROUP.color || '#4CAF50' : "#3b82f6");
            const displayTitle = getDisplayTitle(groupName);
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
                {/* STRIP WARNA (STICKY) */}
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

                {/* HEADER GROUP */}
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
                      {displayTitle}
                    </span>
                    {isDefault && (
                      <span className="badge-default">DEFAULT</span>
                    )}
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

                {/* POPUP MENU */}
                {popupGroup === groupName && (
                  <>
                    <div className="group-popup-overlay" onClick={closePopup} />
                    <div className="group-popup" style={{ position: 'absolute', top: '48px', left: '0', zIndex: 2000 }}>
                      <button onClick={() => { handleRenameGroup(groupName, prompt('Nama baru:', groupName) || groupName); closePopup(); }}>
                        ✏️ Rename
                      </button>
                      <button onClick={() => { handleUpdateGroupColor(groupName, prompt('Warna (hex):', groupColor) || groupColor); closePopup(); }}>
                        🎨 Change Color
                      </button>
                      <button onClick={() => { handleAddItem(groupName); closePopup(); }}>
                        ➕ Add Item
                      </button>
                      <button 
                        onClick={() => { handleDeleteGroup(groupName); closePopup(); }}
                        disabled={isDefault}
                        style={{ color: isDefault ? '#999' : '#f44336' }}
                      >
                        🗑️ Delete Group
                      </button>
                    </div>
                  </>
                )}

                {/* KONTEN GROUP */}
                {!isCollapsed && (
                  <div className="group-content">
                    {tasks.length === 0 ? (
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
                                checked={tasks.every(t => selectedItems.includes(t.id))}
                                onChange={() => selectAllInGroup(groupName, tasks)}
                              />
                            </th>
                            <th style={{ padding: '4px 8px', textAlign: 'left', fontSize: '11px', color: 'var(--text-muted, #999)', fontWeight: 600 }}>
                              ITEM
                            </th>
                            {safeColumns.filter(c => c.id !== 'item').map(col => (
                              <th key={col.id} style={{ padding: '4px 8px', textAlign: 'left', fontSize: '11px', color: 'var(--text-muted, #999)', fontWeight: 600 }}>
                                {col.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {tasks.map((item) => (
                            <Row
                              key={item.id}
                              item={item}
                              columns={safeColumns}
                              groupColor={groupColor}
                              isSelected={selectedItems.includes(item.id)}
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

      {/* ADD GROUP BUTTON */}
      <div className="add-group-container">
        <button onClick={handleAddGroup}>+ Add new group</button>
      </div>
    </div>
  );
}
