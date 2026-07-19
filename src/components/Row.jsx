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
  const indentSize = 14;

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

  const handleAddSubItemClick = (e) => {
    e.stopPropagation();
    if (onAddSubItem) {
      onAddSubItem(item.id);
    }
  };

  // ============================================================
  // PERBAIKAN: Menggunakan table-cell + flex wrapper
  // ============================================================
  const paddingLeft = depth * indentSize + 8;

  // Style untuk td item cell - table-cell agar tinggi sinkron
  const itemCellStyle = {
    display: 'table-cell',
    verticalAlign: 'middle',
    padding: '0 8px',
    paddingLeft: `${paddingLeft}px`,
    borderBottom: '2px solid var(--border-color)',
    position: 'sticky',
    left: '36px',
    zIndex: 100,
    backgroundColor: isSelected ? 'var(--bg-hover)' : 'var(--bg-secondary)',
    boxShadow: 'inset -2px 0 0 0 var(--border-color)',
    height: 'auto',
    minWidth: '200px',
    width: '100%',
  };

  // Wrapper flex untuk isi di dalam td
  const contentWrapperStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    minHeight: '38px',
    width: '100%',
  };

  return (
    <>
      <tr className={isSelected ? "row-selected" : ""}>
        {/* CHECKBOX - tetap table-cell */}
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
            borderBottom: '2px solid var(--border-color)',
            borderRight: '2px solid var(--border-color)',
            boxShadow: 'none',
          }}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleToggleSelect}
            style={{ cursor: "pointer", width: 16, height: 16, margin: 0 }}
          />
        </td>

        {/* ITEM CELL - table-cell + flex wrapper */}
        {visibleColumns.map((col, idx) => {
          const isLast = idx === visibleColumns.length - 1;
          const isItem = col.id === "item";

          if (isItem) {
            return (
              <td
                key={col.id}
                className="row-cell row-item-cell"
                style={{
                  ...itemCellStyle,
                  borderRight: isLast ? "none" : "2px solid var(--border-color)",
                }}
              >
                {/* WRAPPER FLEX untuk isi dalam td */}
                <div style={contentWrapperStyle}>
                  {/* TOMBOL EXPAND / COLLAPSE */}
                  {hasChildren ? (
                    <button
                      onClick={() => setExpanded(!expanded)}
                      className="btn-arrow-hover"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0',
                        fontSize: '18px',
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
                    >
                      {expanded ? '∨' : '>'}
                    </button>
                  ) : (
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
                      &gt;
                    </span>
                  )}

                  {/* NAMA ITEM - BISA DI-EDIT */}
                  {isEditing ? (
                    <input
                      type="text"
                      value={tempName}
                      onChange={handleEditChange}
                      onBlur={handleEditSave}
                      onKeyDown={handleKeyDown}
                      autoFocus
                      placeholder={placeholder}
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

                  {/* TOMBOL ADD SUB ITEM (+) - MUNCUL SAAT HOVER */}
                  {canHaveChildren && onAddSubItem && (
                    <button
                      onClick={handleAddSubItemClick}
                      className="btn-plus-reveal"
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
                </div>
              </td>
            );
          }

          return (
            <td
              key={col.id}
              className="row-cell"
              style={{
                display: 'table-cell',
                verticalAlign: 'middle',
                width: `${col.width}px`,
                minWidth: `${col.width}px`,
                maxWidth: `${col.width}px`,
                borderRight: isLast ? "none" : "2px solid var(--border-color)",
                borderBottom: '2px solid var(--border-color)',
                background: isSelected ? 'var(--bg-hover)' : 'var(--bg-secondary)',
                padding: '6px 8px',
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
            display: 'table-cell',
            verticalAlign: 'middle',
            background: isSelected ? 'var(--bg-hover)' : 'var(--bg-secondary)',
            width: '50px',
            minWidth: '50px',
            maxWidth: '50px',
            padding: '6px 8px',
            borderBottom: '2px solid var(--border-color)',
            borderRight: 'none',
            borderLeft: '2px solid var(--border-color)',
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
