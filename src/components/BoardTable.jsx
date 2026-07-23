import { useState, useRef, useEffect } from "react";
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
  // 🔥 DRAG & DROP - EVENT DELEGATION (LEBIH STABIL)
  // ============================================================
  const boardRef = useRef(null);

  useEffect(() => {
    const container = boardRef.current;
    if (!container) return;

    // 🔥 Event Delegation - listener pada container
    const handleDragStart = (e) => {
      const item = e.target.closest('.group-wrapper');
      if (item) {
        item.classList.add('dragging');
        // Fix untuk Firefox
        e.dataTransfer.setData('text/plain', '');
        e.dataTransfer.effectAllowed = 'move';
      }
    };

    const handleDragEnd = (e) => {
      const item = e.target.closest('.group-wrapper');
      if (item) {
        item.classList.remove('dragging');
        saveNewOrder();
      }
    };

    const handleDragOver = (e) => {
      e.preventDefault(); // Wajib agar bisa drop
      const draggingItem = document.querySelector('.group-wrapper.dragging');
      if (!draggingItem) return;

      const afterElement = getDragAfterElement(container, e.clientY);
      if (afterElement == null) {
        container.appendChild(draggingItem);
      } else {
        container.insertBefore(draggingItem, afterElement);
      }
    };

    const getDragAfterElement = (container, y) => {
      const draggables = [...container.querySelectorAll('.group-wrapper:not(.dragging)')];
      return draggables.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
          return { offset: offset, element: child };
        } else {
          return closest;
        }
      }, { offset: Number.NEGATIVE_INFINITY }).element;
    };

    const saveNewOrder = () => {
      const currentOrder = [...container.querySelectorAll('.group-wrapper')]
        .map(group => group.dataset.groupId || '')
        .filter(id => id !== '');
      
      console.log('📦 Urutan baru:', currentOrder);
      
      if (currentOrder.length > 0) {
        const newGroups = currentOrder.map(id => {
          const index = parseInt(id) - 1;
          return groups[index] || id;
        }).filter(Boolean);
        
        if (newGroups.length > 0 && newGroups.length === groups.length) {
          setGroups(newGroups);
          localStorage.setItem('board-groups', JSON.stringify(newGroups));
        }
      }
    };

    // Event listener dengan delegasi
    container.addEventListener('dragstart', handleDragStart);
    container.addEventListener('dragend', handleDragEnd);
    container.addEventListener('dragover', handleDragOver);

    return () => {
      container.removeEventListener('dragstart', handleDragStart);
      container.removeEventListener('dragend', handleDragEnd);
      container.removeEventListener('dragover', handleDragOver);
    };
  }, [groups]);

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
                data-group-id={groupId}
                data-group-name={groupName}
                style={{ 
                  '--group-color': groupColor,
                  marginBottom: '24px',
                  position: 'relative',
                  width: 'max-content',
                  minWidth: '100%',
                  overflow: 'visible',
                }}
              >
                {/* ... semua konten group tetap sama ... */}
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
                    {/* ... semua konten header tetap sama ... */}
                  </div>
                </div>

                {/* ... semua konten lainnya tetap sama ... */}
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
