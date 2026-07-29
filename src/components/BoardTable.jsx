import { useState, useRef, useEffect, useCallback } from "react";
import Row from "./Row";
import ResizableHeader from "./ResizableHeader";
import Popover from "./Popover";
import { useColumns } from "../context/ColumnContext";
import { DEFAULT_GROUP } from "../data/treeData";

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
  onOpenFormula,
  onRenameGroup,
  onReorderGroups,
  onOpenAddColumn,
  defaultGroupName = DEFAULT_GROUP.title,
}) {
  const {
    columns,
    updateColumnWidth,
    renameColumn,
    toggleColumn,
    deleteColumn,
    reorderColumns,
    visibleColumns,
  } = useColumns();

  // ============================================================
  // 🔥 DRAG & DROP GROUP - SIMPAN LANGSUNG NAMA GROUP
  // ============================================================
  const boardRef = useRef(null);

  const saveNewOrder = useCallback(() => {
    const container = boardRef.current;
    if (!container) return;

    const currentOrder = [...container.querySelectorAll('.group-wrapper')]
      .map(group => group.dataset.groupName)
      .filter(name => name !== '');

    console.log('📦 Urutan baru (nama):', currentOrder);

    if (currentOrder.length === 0) return;

    if (onReorderGroups) {
      onReorderGroups(currentOrder);
    }
  }, [onReorderGroups]);

  // ============================================================
  // 🔥 DRAG & DROP HANDLER GROUP
  // ✅ FIX: JANGAN preventDefault drag yang bukan milik group,
  //    karena itu membatalkan drag kolom secara total.
  // ============================================================
  const handleDragStart = useCallback((e) => {
    // Jika yang di-drag BUKAN group-header, biarkan event lanjut
    // (misalnya drag header kolom di ResizableHeader).
    if (!e.target.closest('.group-header')) return;

    const item = e.target.closest('.group-wrapper');
    if (!item) return;

    item.classList.add('dragging');
    e.dataTransfer.setData('text/plain', '');
    e.dataTransfer.effectAllowed = 'move';
    item.style.opacity = '0.5';
  }, []);

  const handleDragEnd = useCallback((e) => {
    if (!e.target.closest('.group-header')) return;
    const item = e.target.closest('.group-wrapper');
    if (!item) return;
    item.classList.remove('dragging');
    item.style.opacity = '1';
    saveNewOrder();
  }, [saveNewOrder]);

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
  }, [handleDragStart, handleDragEnd, saveNewOrder]);

  // ============================================================
  // 🔥 REORDER KOLOM - MAPPING INDEX VISIBLE → INDEX FULL
  // ✅ FIX: index dari header berbasis visibleColumns,
  //    sedangkan reorderColumns bekerja di array columns penuh.
  // ============================================================
  const handleReorderColumns = useCallback((fromIdx, toIdx) => {
    const fromCol = visibleColumns[fromIdx];
    const toCol = visibleColumns[toIdx];
    if (!fromCol || !toCol) return;

    const realFrom = columns.findIndex((c) => c.id === fromCol.id);
    const realTo = columns.findIndex((c) => c.id === toCol.id);
    if (realFrom === -1 || realTo === -1) return;

    reorderColumns(realFrom, realTo);
  }, [columns, visibleColumns, reorderColumns]);

  // ============================================================
  // STATE LAINNYA
  // ============================================================
  const [collapsed, setCollapsed] = useState({});
  const [popupGroup, setPopupGroup] = useState(null);
  const [groupPopupAnchorEl, setGroupPopupAnchorEl] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);

  const toggleCollapse = (groupName) => {
    setCollapsed((prev) => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const closePopup = () => {
    setPopupGroup(null);
    setGroupPopupAnchorEl(null);
  };

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

  // ============================================================
  // ADD GROUP - LANGSUNG DENGAN 1 ITEM
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

    if (onAddGroup) {
      onAddGroup(newTitle.trim());
    }

    if (onAddItem) {
      onAddItem(newTitle.trim());
    }
  };

  const handleUpdateGroupColor = (groupName, color) => {
    if (onUpdateGroupColor) {
      onUpdateGroupColor(groupName, color);
    }
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

  // ============================================================
  // 🔥 KOLOM YANG DITAMPILKAN (TANPA kolom "+")
  // ============================================================
  const safeColumns = (() => {
    const hasItem = visibleColumns.some((col) => col.id === "item");
    let cols = hasItem ? [...visibleColumns] : [
      { id: "item", label: "ITEM", type: "text", width: 250, visible: true },
      ...visibleColumns,
    ];
    
    // ✅ HAPUS KOLOM "+" JIKA SUDAH ADA
    cols = cols.filter(c => c.id !== 'add-column');
    
    return cols;
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
  
  const totalWidth = '100%';

  if (groups.length === 0) {
    return (
      <div
        className="board-empty-state"
        style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary, #8a94a6)' }}
      >
        <p style={{ marginBottom: '12px' }}>No groups yet.</p>
        <button className="add-group-btn" onClick={handleAddGroup}>
          + Add group
        </button>
      </div>
    );
  }

  const getDisplayTitle = (groupName) => {
    if (groupName === defaultGroupName) {
      return "Group Title";
    }
    return groupName;
  };

  // ============================================================
  // RENDER
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
            const isDefault = groupName === defaultGroupName;
            const groupColor = groupColors[groupName] || '#3b82f6';
            const displayTitle = getDisplayTitle(groupName);
            const groupId = index + 1;

            return (
              <div 
                key={groupName} 
                className="group-wrapper"
                data-group-id={String(groupId)}
                data-group-name={groupName}
                style={{ 
                  '--group-color': groupColor,
                  marginBottom: '24px',
                  position: 'relative',
                  width: 'max-content',
                  minWidth: '100%',
                  overflow: 'visible',
                  cursor: 'default',
                  userSelect: 'none',
                  touchAction: 'none',
                }}
              >
                {/* HEADER GROUP - BISA DRAG */}
                <div 
                  className="group-header"
                  draggable="true"
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
                    cursor: 'grab',
                    userSelect: 'none',
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
                        onClick={(e) => {
                          if (popupGroup === groupName) {
                            closePopup();
                          } else {
                            setPopupGroup(groupName);
                            setGroupPopupAnchorEl(e.currentTarget);
                          }
                        }}
                        style={{
                          flexShrink: 0,
                          padding: '4px',
                          marginRight: '4px',
                          color: groupColor,
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
                        onChange={(e) => handleUpdateGroupColor(groupName, e.target.value)}
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
                          cursor: 'default',
                        }}
                      >
                        {displayTitle}
                        {isDefault && (
                          <span className="badge-default" style={{ marginLeft: '8px', fontSize: '11px' }}>
                            ⭐ Default
                          </span>
                        )}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* POPUP MENU */}
                <Popover
                  anchorRef={{ current: groupPopupAnchorEl }}
                  isOpen={popupGroup === groupName}
                  onClose={closePopup}
                  placement="bottom-start"
                  className="group-popup"
                >
                  <button
                    onClick={() => {
                      const newName = prompt("Masukkan nama baru:", groupName);
                      if (newName && newName.trim()) {
                        handleRenameGroup(groupName, newName.trim());
                      }
                      closePopup();
                    }}
                  >
                    ✏️ Rename Group
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Hapus group "${groupName}" dan semua item di dalamnya?`)) {
                        handleDeleteGroup(groupName);
                      }
                      closePopup();
                    }}
                    style={{ color: '#f44336' }}
                  >
                    🗑️ Delete Group
                  </button>
                </Popover>

                {/* KONTEN GROUP */}
                {!isCollapsed && (
                  <div className="group-content">
                    {tasks.length > 0 ? (
                      <div className="table-wrapper">
                        <table className="board-table" style={{ width: '100%', tableLayout: 'fixed' }}>
                          <thead>
                            <tr className="table-header-row">
                              {/* CHECKBOX - CENTER */}
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
                                  borderBottom: '2px solid var(--border-color)',
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={tasks.length > 0 && tasks.every((t) => selectedItems.includes(t.id))}
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
                                    onReorder={handleReorderColumns}
                                    onOpenFormula={onOpenFormula}
                                    isSticky={isItem}
                                    isLast={isLast}
                                    align="center"
                                    showMenuButton={!isItem}
                                    headerColor={groupColor}
                                  >
                                    {col.label}
                                  </ResizableHeader>
                                );
                              })}

                              {/* ✅ KOLOM "+" DI HEADER - MANUAL (HANYA UNTUK ADD COLUMN) */}
                              <th
                                key="add-column"
                                onClick={onOpenAddColumn}
                                style={{
                                  width: 'auto',
                                  minWidth: '50px',
                                  maxWidth: 'none',
                                  padding: '8px 4px',
                                  textAlign: 'left',
                                  background: 'var(--bg-secondary)',
                                  borderLeft: '2px solid var(--border-color)',
                                  borderBottom: '2px solid var(--border-color)',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                <span style={{ fontSize: '18px', fontWeight: 300 }}>+</span>
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {tasks.map((item, taskIndex) => {
                              const handleUpdate = (id, field, value) => {
                                console.log('🟢 BoardTable handleUpdate - id:', id, 'field:', field, 'value:', value);
                                onUpdateItem(id, field, value);
                              };

                              return (
                                <Row
                                  key={item.id}
                                  item={item}
                                  groupColor={groupColor}
                                  visibleColumns={safeColumns}
                                  isSelected={selectedItems.includes(item.id)}
                                  onToggleSelect={toggleSelectItem}
                                  onUpdate={handleUpdate}
                                  onDelete={() => {
                                    console.log('🟢 BoardTable onDelete - item.id:', item.id);
                                    onDeleteItem(item.id);
                                  }}
                                  onOpenStatusManager={onOpenStatusManager}
                                  onAddSubItem={handleAddSubItem}
                                  selectedItems={selectedItems}
                                  groupName={groupName}
                                  isDefaultGroup={isDefault}
                                  numberPath={String(taskIndex + 1)}
                                />
                              );
                            })}

                            {/* BARIS ADD ITEM */}
                            <tr className="add-item-row">
                              <td style={{
                                width: '36px',
                                minWidth: '36px',
                                maxWidth: '36px',
                                padding: '6px 8px',
                                textAlign: 'center',
                                verticalAlign: 'middle',
                                borderBottom: '2px solid var(--border-color)',
                                background: 'var(--bg-secondary)',
                                position: 'sticky',
                                left: 0,
                                zIndex: 10,
                                borderRight: '2px solid var(--border-color)',
                                borderLeft: `4px solid ${groupColor}`,
                              }} />

                              <td style={{
                                position: 'sticky',
                                left: '36px',
                                zIndex: 9,
                                background: 'var(--bg-secondary)',
                                boxShadow: 'inset -2px 0 0 0 var(--border-color)',
                                padding: '6px 8px',
                                minWidth: '200px',
                                borderBottom: '2px solid var(--border-color)',
                              }}>
                                <button
                                  onClick={() => handleAddItem(groupName)}
                                  style={{
                                    border: 'none',
                                    background: 'transparent',
                                    color: '#3b82f6',
                                    cursor: 'pointer',
                                    fontSize: 13,
                                    padding: '4px 0',
                                    textAlign: 'left',
                                    width: '100%',
                                    transition: 'background 0.15s, padding-left 0.15s',
                                    borderRadius: '4px',
                                    fontFamily: 'inherit',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'var(--bg-hover)';
                                    e.currentTarget.style.paddingLeft = '8px';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.paddingLeft = '0';
                                  }}
                                >
                                  + Add item
                                </button>
                              </td>

                              {safeColumns.filter(c => c.id !== 'item').map((col, idx) => {
                                const filteredCols = safeColumns.filter(c => c.id !== 'item');
                                const isLast = idx === filteredCols.length - 1;
                                return (
                                  <td key={col.id} style={{
                                    padding: '6px 8px',
                                    borderBottom: '2px solid var(--border-color)',
                                    background: 'var(--bg-secondary)',
                                    width: col.width || 120,
                                    minWidth: col.width || 120,
                                    maxWidth: col.width || 120,
                                    borderRight: isLast ? 'none' : '2px solid var(--border-color)',
                                  }} />
                                );
                              })}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div 
                        className="empty-group-message" 
                        style={{ borderLeft: `4px solid ${groupColor}` }}
                      >
                        No items in this group.
                        <button onClick={() => handleAddItem(groupName)}>
                          Add item
                        </button>
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
        <button onClick={handleAddGroup}>+ Add new group</button>
      </div>
    </div>
  );
}