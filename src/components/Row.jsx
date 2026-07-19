import { useState } from "react";
import StatusCell from "./StatusCell";
import FileAttachment from "./FileAttachment";

export default function Row({
  item,
  groupColor,
  visibleColumns,
  isSelected,
  onToggleSelect,
  onUpdate,
  onDelete,
  onOpenStatusManager,
  onAddSubItem,
  depth = 0,
  maxDepth = 4,
  selectedItems = [],
}) {
  const [expanded, setExpanded] = useState(item.isExpanded !== false);
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(item.item);
  const hasChildren = item.children && item.children.length > 0;
  const canHaveChildren = depth < maxDepth;
  const indentSize = 14; // 14px per level sesuai permintaan

  // Placeholder berdasarkan level
  const placeholders = ["", "New Task", "Sub Item", "Sub Sub Item", "Sub Sub Sub Item"];
  const placeholder = placeholders[depth] || "New Task";

  const inputStyle = {
    border: "none",
    background: "transparent",
    fontSize: 13,
    padding: "4px 2px",
    width: "100%",
    color: "var(--text-primary)",
    outline: "none",
    fontFamily: "Arial, sans-serif",
    boxSizing: "border-box",
  };

  const renderCell = (col) => {
    const value = item[col.id] !== undefined ? item[col.id] : "";
    const type = col.type || "text";

    switch (type) {
      case "status":
        return (
          <StatusCell
            columnId={col.id}
            status={item[col.id]}
            statuses={col.statuses || {}}
            statusOrder={col.statusOrder || []}
            onChange={(val) => onUpdate(col.id, val)}
            onOpenStatusManager={onOpenStatusManager}
          />
        );

      case "date":
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => onUpdate(col.id, e.target.value)}
            style={inputStyle}
          />
        );

      case "number":
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => onUpdate(col.id, e.target.value)}
            style={inputStyle}
          />
        );

      case "checkbox":
        return (
          <input
            type="checkbox"
            checked={value || false}
            onChange={(e) => onUpdate(col.id, e.target.checked)}
            style={{ cursor: "pointer", width: 16, height: 16 }}
          />
        );

      case "people":
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => onUpdate(col.id, e.target.value)}
            style={inputStyle}
            placeholder="Assign to..."
          />
        );

      case "progress":
        const progress = parseInt(value) || 0;
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{
              flex: 1,
              height: 6,
              background: "var(--border-color)",
              borderRadius: 3,
              overflow: "hidden",
            }}>
              <div style={{
                width: `${Math.min(100, Math.max(0, progress))}%`,
                height: "100%",
                background: progress >= 100 ? "#22c55e" : "#3b82f6",
                borderRadius: 3,
              }} />
            </div>
            <span style={{ fontSize: 11, color: "var(--text-muted)", minWidth: 30 }}>
              {progress}%
            </span>
          </div>
        );

      case "files":
        return (
          <FileAttachment
            value={value}
            onUpdate={onUpdate}
            columnId={col.id}
          />
        );

      default: // text
        return (
          <input
            value={value}
            onChange={(e) => onUpdate(col.id, e.target.value)}
            style={inputStyle}
            placeholder={col.label}
          />
        );
    }
  };

  const handleToggleSelect = (e) => {
    e.stopPropagation();
    onToggleSelect(item.id);
  };

  // ============================================================
  // RENAME - SINGLE KLIK
  // ============================================================
  const handleStartEdit = (e) => {
    e.stopPropagation();
    setIsEditing(true);
    setTempName(item.item);
  };

  const handleEditChange = (e) => {
    setTempName(e.target.value);
  };

  const handleEditSave = () => {
    setIsEditing(false);
    if (tempName.trim() !== "" && tempName.trim() !== item.item) {
      onUpdate('item', tempName.trim());
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleEditSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setTempName(item.item);
    }
  };

  // ============================================================
  // HANDLE ADD SUB ITEM
  // ============================================================
  const handleAddSubItem = (e) => {
    e.stopPropagation();
    if (onAddSubItem) {
      onAddSubItem(item.id);
    }
  };

  const paddingLeft = depth * indentSize + 8;

  return (
    <>
      <tr className={isSelected ? "row-selected" : ""}>
        {/* CHECKBOX */}
        <td 
          className="row-checkbox-cell" 
          style={{ 
            borderLeft: `4px solid ${groupColor}`,
            position: 'sticky',
            left: 0,
            zIndex: 100,
            background: isSelected ? 'var(--bg-hover)' : 'var(--bg-secondary)',
            width: '36px',
            minWidth: '36px',
            maxWidth: '36px',
            padding: '6px 8px',
            textAlign: 'center',
            verticalAlign: 'middle',
          }}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleToggleSelect}
            style={{ cursor: "pointer", width: 16, height: 16, margin: 0 }}
          />
        </td>

        {/* ITEM CELL */}
        {visibleColumns.map((col, idx) => {
          const isLast = idx === visibleColumns.length - 1;
          const isItem = col.id === "item";

          if (isItem) {
            return (
              <td
                key={col.id}
                className="row-cell row-item-cell"
                style={{
                  paddingLeft: `${paddingLeft}px`,
                  paddingRight: '8px',
                  paddingTop: '4px',
                  paddingBottom: '4px',
                  position: 'sticky',
                  left: '36px',
                  zIndex: 100,
                  background: isSelected ? 'var(--bg-hover)' : 'var(--bg-secondary)',
                  boxShadow: 'inset -2px 0 0 0 var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px', // Gap 4px sesuai permintaan
                  minHeight: '38px',
                  width: `${col.width}px`,
                  minWidth: `${Math.max(col.width, 200)}px`,
                  maxWidth: `${col.width}px`,
                  borderRight: isLast ? "none" : "2px solid var(--border-color)",
                  boxSizing: 'border-box',
                  overflow: 'hidden',
                }}
              >
                {/* ============================================================
                    TOMBOL EXPAND / COLLAPSE
                    - Opacity 15% jika tidak ada anak
                    - Opacity 100% jika ada anak atau hover
                    ============================================================ */}
                {hasChildren ? (
                  <button
                    onClick={() => setExpanded(!expanded)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0',
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      flexShrink: 0,
                      width: '18px',
                      height: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 1,
                      transition: 'opacity 0.2s',
                    }}
                    className="btn-arrow-hover"
                  >
                    {expanded ? '▾' : '>'}
                  </button>
                ) : (
                  /* SPACER jika tidak ada children - opacity 15% */
                  <span 
                    style={{ 
                      width: '18px', 
                      flexShrink: 0,
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      opacity: 0.15,
                      textAlign: 'center',
                    }}
                  >
                    >
                  </span>
                )}

                {/* ============================================================
                    NAMA ITEM - BISA DI-EDIT
                    ============================================================ */}
                {isEditing ? (
                  <input
                    type="text"
                    value={tempName}
                    onChange={handleEditChange}
                    onBlur={handleEditSave}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    style={{
                      flex: 1,
                      background: 'rgba(255,255,255,0.05)',
                      border: 'none',
                      borderBottom: '2px solid #2196F3',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      fontFamily: 'inherit',
                      fontSize: '13px',
                      padding: '2px 4px',
                      borderRadius: '2px',
                      minWidth: '50px',
                      height: '26px',
                      placeholder: placeholder,
                    }}
                  />
                ) : (
                  <span 
                    style={{ 
                      flex: 1,
                      cursor: 'text',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      padding: '0 4px',
                      fontWeight: depth === 0 ? 600 : 400,
                      color: depth === 0 ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontSize: '13px',
                    }}
                    onClick={handleStartEdit}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--bg-hover)';
                      e.currentTarget.style.borderRadius = '2px';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                    title="Click to edit"
                  >
                    {item.item || placeholder}
                  </span>
                )}

                {/* ============================================================
                    TOMBOL ADD SUB ITEM (+) - MUNCUL SAAT HOVER
                    HANYA SAMPAI LEVEL 3 (TIDAK DI LEVEL 4)
                    ============================================================ */}
                {canHaveChildren && onAddSubItem && (
                  <button
                    onClick={handleAddSubItem}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      padding: '0 2px',
                      opacity: 0,
                      transition: 'opacity 0.2s',
                      flexShrink: 0,
                      width: '22px',
                      height: '22px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                    }}
                    className="btn-plus-reveal"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = 1;
                      e.currentTarget.style.background = 'var(--bg-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = 0;
                      e.currentTarget.style.background = 'transparent';
                    }}
                    title="Add sub item"
                  >
                    +
                  </button>
                )}
              </td>
            );
          }

          return (
            <td
              key={col.id}
              className="row-cell"
              style={{
                width: `${col.width}px`,
                minWidth: `${col.width}px`,
                maxWidth: `${col.width}px`,
                borderRight: isLast ? "none" : "2px solid var(--border-color)",
                background: isSelected ? 'var(--bg-hover)' : 'var(--bg-secondary)',
                padding: '6px 8px',
                verticalAlign: 'middle',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {renderCell(col)}
            </td>
          );
        })}

        {/* ADD COLUMN SPACER */}
        <td
          className="row-add-cell"
          style={{
            background: isSelected ? 'var(--bg-hover)' : 'var(--bg-secondary)',
            width: '50px',
            minWidth: '50px',
            maxWidth: '50px',
            padding: '6px 8px',
          }}
        />
      </tr>

      {/* SUB ITEM - RECURSIVE */}
      {hasChildren && expanded && item.children.map((child) => (
        <Row
          key={child.id}
          item={child}
          depth={depth + 1}
          groupColor={groupColor}
          visibleColumns={visibleColumns}
          isSelected={selectedItems.includes(child.id)}
          onToggleSelect={onToggleSelect}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onOpenStatusManager={onOpenStatusManager}
          onAddSubItem={onAddSubItem}
          maxDepth={maxDepth}
          selectedItems={selectedItems}
        />
      ))}
    </>
  );
}
