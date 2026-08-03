import { useState, useRef, useEffect, useCallback } from "react";
import Row from "./Row";
import ResizableHeader from "./ResizableHeader";
import Popover from "./Popover";
import { useColumns } from "../context/ColumnContext";
import { useLanguage } from "../context/LanguageContext";
import { getSubItemLabel } from "../i18n/defaults";
import { parseDateValue } from "../utils/formulaEngine";

const TIMELINE_MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// Matches TimelineCell's own stored string shape ("DD - Mon - YYYY") —
// duplicated rather than imported since TimelineCell derives it from a
// raw <input type="date"> string, not a Date object.
function formatTimelineDate(d) {
  const day = String(d.getDate()).padStart(2, "0");
  return `${day} - ${TIMELINE_MONTHS_SHORT[d.getMonth()]} - ${d.getFullYear()}`;
}

// Picks black or white text for a given background hex, whichever reads
// better — used for the column-header row's text since its background is
// now user-pickable per group (unlike the fixed group accent color, an
// arbitrary background can't be assumed to contrast with any one fixed
// text color).
function getHeaderTextColor(hex) {
  const clean = (hex || "").replace("#", "");
  if (clean.length !== 3 && clean.length !== 6) return "#ffffff";
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const r = parseInt(full.substring(0, 2), 16);
  const g = parseInt(full.substring(2, 4), 16);
  const b = parseInt(full.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 150 ? "#1a1a2e" : "#ffffff";
}

export default function BoardTable({
  items,
  groups,
  groupColors,
  onUpdateGroupColor,
  groupHeaderColors,
  onUpdateGroupHeaderColor,
  onUpdateItem,
  onDeleteItem,
  onAddGroup,
  onDeleteGroup,
  onAddItem,
  onAddSubItem,
  onOpenStatusManager,
  onOpenProgressManager,
  onOpenFormula,
  onRenameGroup,
  onReorderGroups,
  onOpenAddColumn,
  // Always passed explicitly by App.jsx now (the current language's
  // default group name); this literal is only a last-resort fallback for
  // any future caller that forgets to.
  defaultGroupName = "Default Group",
}) {
  const { t } = useLanguage();
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
  // Self-heals Timeline data saved before the parent-range constraint
  // existed: walks the tree once per items/columns change and clamps any
  // child whose timeline sits outside its parent's into range. Only
  // fires an update when a fix is actually needed, so once a board's
  // data converges this becomes a no-op on every subsequent render (no
  // update loop) — same reactive-repair pattern as the items auto-seed
  // effect in ItemsContext.
  // ============================================================
  useEffect(() => {
    const timelineColIds = columns.filter((c) => c.type === "timeline").map((c) => c.id);
    if (timelineColIds.length === 0) return;

    const walk = (list, parent) => {
      for (const item of list) {
        if (parent) {
          for (const colId of timelineColIds) {
            const child = item[colId];
            const parentVal = parent[colId];
            const cs = child && typeof child === "object" ? parseDateValue(child.start) : null;
            const ce = child && typeof child === "object" ? parseDateValue(child.end) : null;
            const ps = parentVal && typeof parentVal === "object" ? parseDateValue(parentVal.start) : null;
            const pe = parentVal && typeof parentVal === "object" ? parseDateValue(parentVal.end) : null;
            if (cs && ce && ps && pe) {
              const ns = cs < ps ? ps : cs;
              const ne = (ce > pe ? pe : ce) < ns ? ns : (ce > pe ? pe : ce);
              if (ns.getTime() !== cs.getTime() || ne.getTime() !== ce.getTime()) {
                onUpdateItem(item.id, colId, { start: formatTimelineDate(ns), end: formatTimelineDate(ne) });
              }
            }
          }
        }
        if (item.children && item.children.length > 0) walk(item.children, item);
      }
    };
    walk(items, null);
  }, [items, columns, onUpdateItem]);

  // ============================================================
  // 🔥 DRAG & DROP GROUP - SIMPAN LANGSUNG NAMA GROUP
  // ============================================================
  const boardRef = useRef(null);

  // Horizontal group-header pinning, done manually instead of via CSS
  // position:sticky — the nested-sticky CSS approach didn't reliably
  // stick horizontally on mobile browsers even after simplifying it, so
  // this replaces that axis with a direct scroll-linked transform
  // instead. (Vertical stays on CSS position:sticky, which does work.)
  //
  // Listens on `document` in the *capture* phase rather than adding the
  // listener directly to the scroll container via a ref: the plain
  // "scroll" event doesn't bubble, but capture-phase listeners on an
  // ancestor still see it regardless of exactly when/how many times
  // .board-scroll-container itself mounts — removes any dependency on
  // ref-attachment timing, which a directly-attached listener is
  // sensitive to.
  useEffect(() => {
    const handleScroll = (e) => {
      const target = e.target;
      if (!target || !target.classList || !target.classList.contains('board-scroll-container')) return;
      // Clamp against rubber-band overscroll — some mobile browsers
      // briefly report scrollLeft past the real [0, max] range during
      // the bounce, which made the header jitter/overshoot in sync.
      const max = target.scrollWidth - target.clientWidth;
      const x = Math.min(Math.max(target.scrollLeft, 0), Math.max(max, 0));
      target.querySelectorAll('.group-header-inner').forEach((el) => {
        el.style.transform = `translateX(${x}px)`;
      });
    };
    document.addEventListener('scroll', handleScroll, true);
    return () => document.removeEventListener('scroll', handleScroll, true);
  }, []);

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
  // ADD GROUP
  // ============================================================
  // Prompts once, here, and passes the name straight to onAddGroup — which
  // seeds its own starter items. It used to also call onAddItem
  // afterward, adding a 4th item on top of the 3 onAddGroup already
  // creates; removed since onAddGroup already owns item creation.
  const handleAddGroup = () => {
    const newTitle = prompt(t("boardTable.addGroupPrompt"));
    if (!newTitle || !newTitle.trim()) return;

    if (newTitle.trim() === defaultGroupName) {
      alert(t("boardTable.reservedGroupName", { name: defaultGroupName }));
      return;
    }

    if (groups.includes(newTitle.trim())) {
      alert(t("boardTable.groupAlreadyExists", { name: newTitle.trim() }));
      return;
    }

    if (onAddGroup) {
      onAddGroup(newTitle.trim());
    }
  };

  const handleUpdateGroupColor = (groupName, color) => {
    if (onUpdateGroupColor) {
      onUpdateGroupColor(groupName, color);
    }
  };

  const handleUpdateGroupHeaderColor = (groupName, color) => {
    if (onUpdateGroupHeaderColor) {
      onUpdateGroupHeaderColor(groupName, color);
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
      { id: "item", label: t("defaults.colItem"), type: "text", width: 250, visible: true },
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
    if (confirm(t("boardTable.deleteSelectedConfirm", { count: selectedItems.length }))) {
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
      alert(t("boardTable.maxLevelsReached"));
      return;
    }

    const newTitle = getSubItemLabel(t, currentDepth + 1);
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
        <p style={{ marginBottom: '12px' }}>{t("boardTable.noGroupsYet")}</p>
        <button className="add-group-btn" onClick={handleAddGroup}>
          {t("boardTable.addGroup")}
        </button>
      </div>
    );
  }

  const getDisplayTitle = (groupName) => {
    if (groupName === defaultGroupName) {
      return t("boardTable.groupTitleFallback");
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
            {t("boardTable.itemsSelected", { count: selectedItems.length })}
          </span>
          <button onClick={handleDeleteSelected} className="delete-selected-btn">
            {t("boardTable.deleteSelected")}
          </button>
          <button onClick={() => setSelectedItems([])} className="cancel-selected-btn">
            {t("common.cancel")}
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
            const headerBgColor = (groupHeaderColors && groupHeaderColors[groupName]) || null;
            const headerTextColor = getHeaderTextColor(headerBgColor || '#6b7280');
            const displayTitle = getDisplayTitle(groupName);
            const groupId = index + 1;

            return (
              <div
                key={`${groupName}__${index}`}
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
                    touchAction: 'none',
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
                        title={t("boardTable.groupColorPickerTitle")}
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

                      <input
                        type="color"
                        value={headerBgColor || '#6b7280'}
                        onChange={(e) => handleUpdateGroupHeaderColor(groupName, e.target.value)}
                        className="group-header-color-picker"
                        title={t("boardTable.headerColorPickerTitle")}
                        style={{
                          flexShrink: 0,
                          width: '24px',
                          height: '24px',
                          marginRight: '6px',
                          border: '1px solid var(--border-dark)',
                          borderRadius: '4px',
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
                            {t("boardTable.defaultBadge")}
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
                      const newName = prompt(t("boardTable.renamePrompt"), groupName);
                      if (newName && newName.trim()) {
                        handleRenameGroup(groupName, newName.trim());
                      }
                      closePopup();
                    }}
                  >
                    {t("boardTable.renameGroup")}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(t("boardTable.deleteGroupConfirm", { name: groupName }))) {
                        handleDeleteGroup(groupName);
                      }
                      closePopup();
                    }}
                    style={{ color: '#f44336' }}
                  >
                    {t("boardTable.deleteGroupBtn")}
                  </button>
                </Popover>

                {/* KONTEN GROUP */}
                {!isCollapsed && (
                  <div className="group-content">
                    {tasks.length > 0 ? (
                      <div className="table-wrapper">
                        <table
                          className="board-table"
                          style={{
                            width: '100%',
                            tableLayout: 'fixed',
                            // Override lokal — hanya berlaku untuk <thead> milik
                            // grup ini, bukan grup lain (CSS var di-scope ke
                            // subtree elemen ini). Kalau grup belum punya warna
                            // header sendiri, biarkan undefined supaya tetap
                            // ikut nilai default global di :root.
                            ...(headerBgColor ? { '--bg-table-header': headerBgColor } : {}),
                          }}
                        >
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
                                    headerColor={headerTextColor}
                                    tooltip={
                                      col.type === "progress"
                                        ? t("boardTable.progressTooltip")
                                        : undefined
                                    }
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
                                  onOpenProgressManager={onOpenProgressManager}
                                  onAddSubItem={handleAddSubItem}
                                  selectedItems={selectedItems}
                                  groupName={groupName}
                                  isDefaultGroup={isDefault}
                                  numberPath={String(taskIndex + 1)}
                                  siblings={tasks}
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
                                  {t("boardTable.addItem")}
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
                        {t("boardTable.noItemsInGroup")}
                        <button onClick={() => handleAddItem(groupName)}>
                          {t("boardTable.addItemSimple")}
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
        <button onClick={handleAddGroup}>{t("boardTable.addNewGroup")}</button>
      </div>
    </div>
  );
}