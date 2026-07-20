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

  const [collapsed, setCollapsed] = useState({});
  const [popupGroup, setPopupGroup] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);

  const toggleCollapse = (groupName) => {
    setCollapsed((prev) => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const closePopup = () => setPopupGroup(null);

  // ============================================================
  // RENAME GROUP - TANPA PROTEKSI
  // ============================================================
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

  // ============================================================
  // DELETE GROUP - TANPA PROTEKSI
  // ============================================================
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
  };

  // ============================================================
  // UPDATE GROUP COLOR
  // ============================================================
  const handleUpdateGroupColor = (groupName, color) => {
    if (externalOnUpdateGroupColor) {
      externalOnUpdateGroupColor(groupName, color);
    }
    setGroupColors(prev => ({ ...prev, [groupName]: color }));
  };

  // ============================================================
  // ADD ITEM - TANPA PROTEKSI
  // ============================================================
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

  // ============================================================
  // TAMPILAN GROUP TITLE: "Group Title" (bukan "Default")
  // ============================================================
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

      {/* ============================================================
          INFO DEFAULT GROUP - DIHAPUS!
          ============================================================ */}

      <div className="board-scroll-container">
        <div className="board-scroll-content">
          {groups.map((groupName) => {
            const tasks = grouped[groupName] || [];
            const isCollapsed = collapsed[groupName] || false;
            const isDefault = groupName === defaultGroupName;
            const groupColor = groupColors[groupName] || (isDefault ? DEFAULT_GROUP.color || '#4CAF50' : "#3b82f6");
            const displayTitle = getDisplayTitle(groupName);

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
                    {/* ============================================================
                        TOMBOL TOGGLE (▼/▶) - DI KIRI
                        ============================================================ */}
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

                    {/* ============================================================
                        TOMBOL ⋮ (GROUP MENU) + JUDUL GROUP + COLOR PICKER
                        ============================================================ */}
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

                {popupGroup === groupName && (
                  <>
                    <div className="group-popup">
                      <button 
                        onClick={() => { 
                          closePopup(); 
                          const newName = prompt("Masukkan nama baru:", groupName);
                          if (newName && newName.trim()) {
                            handleRenameGroup(groupName, newName.trim());
                          }
                        }}
                      >
                        ✏️ Rename Group
                      </button>
                      <button 
                        onClick={() => { 
                          closePopup(); 
                          if (confirm(`Hapus group "${groupName}"?`)) {
                            handleDeleteGroup(groupName);
                          }
                        }}
                      >
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
                                {/* CHECKBOX HEADER */}
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

                                {/* TABEL HEADER - DENGAN ⋮ DI SEBELAH KIRI (CENTER) */}
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
                                      align="center"
                                      showMenuButton={!isItem}
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
        <button 
          onClick={() => {
            if (confirm('Reset semua group ke default?')) {
              setGroups([defaultGroupName]);
              setGroupColors({
                [defaultGroupName]: DEFAULT_GROUP.color || '#4CAF50'
              });
            }
          }}
          style={{ marginLeft: '12px' }}
        >
          🔄 Reset Default
        </button>
      </div>
    </div>
  );
}
