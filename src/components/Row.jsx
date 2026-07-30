import { useState } from "react";
import StatusCell from "./StatusCell";
import FileAttachment from "./FileAttachment";
import DateCell from "./DateCell";
import PriorityCell from "./PriorityCell";
import TimelineCell from "./TimelineCell";
import PhoneCell from "./PhoneCell";
import FormulaCell from "./FormulaCell";
import ProgressCell from "./ProgressCell";
import UpdateBubble from './UpdateBubble';
import { evaluateFormula } from "../utils/formulaEngine";
import { resolveSelfWeight, resolveIndependentWeight, weightKeyFor, computeOwnProgress, computeCascadedDisplayPercent, computeAbsoluteWeight } from "../utils/progressWeights";

export default function Row({
  item,
  groupColor,
  groupName,
  isDefaultGroup = false,
  visibleColumns = [],
  isSelected,
  onToggleSelect,
  onUpdate,
  onDelete,
  onOpenStatusManager,
  onOpenProgressManager,
  onAddSubItem,
  depth = 0,
  maxDepth = 4,
  selectedItems = [],
  numberPath = "",
  isLastChild = false,
  ancestorLines = [],
  siblings = [],
  parentAbsoluteWeights = {},
}) {
  // ✅ GUARD: Jika item undefined
  if (!item) {
    return null;
  }

  const [expanded, setExpanded] = useState(item.isExpanded !== false);
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(item.item || '');
  
  // ✅ GUARD: Pastikan children adalah array
  const children = item.children && Array.isArray(item.children) ? item.children : [];
  const hasChildren = children.length > 0;
  const canHaveChildren = depth < maxDepth;

  const placeholders = ["", "New Task", "Sub Item", "Sub Sub Item", "Sub Sub Sub Item"];
  const placeholder = placeholders[depth] || "New Task";

  if (item.isExpanded !== expanded) {
    setExpanded(item.isExpanded !== false);
  }

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
    if (!col) return null;
    
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
            itemChildren={children}
            onChange={(val) => onUpdate(item.id, col.id, val)}
            onOpenStatusManager={onOpenStatusManager}
          />
        );

      case "date":
        return (
          <DateCell
            date={value}
            onChange={(val) => onUpdate(item.id, col.id, val)}
            placeholder="dd/mm/ttt"
          />
        );

      case "timeline":
        return (
          <TimelineCell
            value={value}
            onChange={(val) => onUpdate(item.id, col.id, val)}
          />
        );

      case "priority":
        return (
          <PriorityCell
            priority={value}
            onChange={(val) => onUpdate(item.id, col.id, val)}
          />
        );

      case "phone":
        return (
          <PhoneCell
            value={value}
            onChange={(val) => onUpdate(item.id, col.id, val)}
          />
        );

      case "numbering":
        return (
          <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>
            {numberPath}
          </span>
        );

      case "formula":
        return (
          <FormulaCell
            result={evaluateFormula(col.formula, item, visibleColumns)}
            hasFormula={!!(col.formula && col.formula.trim())}
          />
        );

      case "number":
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => onUpdate(item.id, col.id, e.target.value)}
            style={inputStyle}
          />
        );

      case "checkbox":
        return (
          <input
            type="checkbox"
            checked={value || false}
            onChange={(e) => onUpdate(item.id, col.id, e.target.checked)}
            style={{ cursor: "pointer", width: 16, height: 16 }}
          />
        );

      case "people":
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => onUpdate(item.id, col.id, e.target.value)}
            style={inputStyle}
            placeholder="Assign to..."
          />
        );

      case "progress": {
        const weightInfo = depth === 0
          ? resolveIndependentWeight(item, col.id)
          : resolveSelfWeight(siblings, item.id, col.id);
        return (
          <ProgressCell
            value={value}
            columnId={col.id}
            stages={col.progressStages}
            itemChildren={children}
            depth={depth}
            isLastChild={isLastChild}
            ancestorLines={ancestorLines}
            explicitWeight={weightInfo?.explicitWeight}
            resolvedWeight={weightInfo?.resolvedWeight}
            explicitSiblingSum={weightInfo?.explicitSiblingSum}
            displayPercent={myProgressDisplayPercents[col.id]}
            onChange={(val) => onUpdate(item.id, col.id, val)}
            onChangeWeight={weightInfo ? (val) => onUpdate(item.id, weightKeyFor(col.id), val) : undefined}
            onOpenProgressManager={onOpenProgressManager}
          />
        );
      }

      case "files":
        return (
          <FileAttachment
            value={value}
            onUpdate={onUpdate}
            columnId={col.id}
          />
        );

      default:
        return (
          <input
            value={value}
            onChange={(e) => onUpdate(item.id, col.id, e.target.value)}
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
    setTempName(item.item || '');
  };

  const handleEditChange = (e) => {
    setTempName(e.target.value);
  };

  const handleEditSave = () => {
    setIsEditing(false);
    const newName = tempName.trim();
    if (newName !== "" && newName !== item.item) {
      onUpdate(item.id, 'item', newName);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleEditSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setTempName(item.item || '');
    }
  };

  const handleAddSubItemClick = (e) => {
    e.stopPropagation();
    if (onAddSubItem) {
      if (depth >= 3) {
        alert('⚠️ Maximum 4 levels reached! Tidak bisa menambah sub item lagi.');
        return;
      }
      onAddSubItem(item.id);
    }
  };

  const handleDelete = () => {
    if (confirm(`Hapus item "${item.item || 'untitled'}"?`)) {
      onDelete(item.id);
    }
  };

  const defaultGroupBorderColor = groupColor;
  const paddingLeft = depth * 14 + 8;

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
  };

  const contentWrapperStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    minHeight: '38px',
    width: '100%',
  };

  // ✅ GUARD: Pastikan visibleColumns adalah array
  const safeColumns = visibleColumns && Array.isArray(visibleColumns) ? visibleColumns : [];

  // Cascading "progress terhadap total" for every Progress column on this
  // row — own progress × own absolute weight (the chained product of every
  // ancestor's relative weight, never diluted by ancestor progress). Kept
  // here (not inside ProgressCell) since a child needs its parent's
  // already-computed absolute weight, which only this top-down render pass
  // has.
  const myProgressDisplayPercents = {};
  const myAbsoluteWeights = {};
  safeColumns.forEach((col) => {
    if (!col || col.type !== "progress") return;
    const ownProgress = computeOwnProgress(item, col.id);
    const weightInfo = depth === 0
      ? resolveIndependentWeight(item, col.id)
      : resolveSelfWeight(siblings, item.id, col.id);
    const parentAbsoluteWeight = parentAbsoluteWeights[col.id] ?? 100;
    myAbsoluteWeights[col.id] = computeAbsoluteWeight(weightInfo.resolvedWeight, parentAbsoluteWeight);
    myProgressDisplayPercents[col.id] = computeCascadedDisplayPercent(
      ownProgress,
      weightInfo.resolvedWeight,
      parentAbsoluteWeight
    );
  });

  return (
    <>
      <tr className={isSelected ? "row-selected" : ""}>
        <td 
          className="row-checkbox-cell" 
          style={{ 
            borderLeft: `4px solid ${defaultGroupBorderColor}`,
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

        {safeColumns.map((col, idx) => {
          if (!col) return null;
          
          const isLast = idx === safeColumns.length - 1;
          const isItem = col.id === "item";

          if (isItem) {
            return (
              <td
                key={col.id}
                className="row-cell row-item-cell"
                style={{
                  ...itemCellStyle,
                  width: `${col.width}px`,
                  minWidth: `${col.width}px`,
                  maxWidth: `${col.width}px`,
                  borderRight: isLast ? "none" : "2px solid var(--border-color)",
                }}
              >
                <div style={contentWrapperStyle}>
                  {hasChildren ? (
                    <button
                      onClick={() => {
                        onUpdate(item.id, 'isExpanded', !expanded);
                      }}
                      className="btn-arrow-hover"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0',
                        fontSize: '20px',
                        color: 'var(--text-secondary)',
                        flexShrink: 0,
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 1,
                        transition: 'opacity 0.2s',
                        fontWeight: 'bold',
                      }}
                    >
                      {expanded ? '▾' : '▸'}
                    </button>
                  ) : (
                    <span 
                      style={{ 
                        width: '28px',
                        flexShrink: 0,
                        fontSize: '20px',
                        color: 'var(--text-secondary)',
                        opacity: 0.15,
                        textAlign: 'center',
                      }}
                    >
                      &gt;
                    </span>
                  )}

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
                      title={depth >= 3 ? 'Maximum level reached' : 'Add sub item'}
                    >
                      +
                    </button>
                  )}

                  <UpdateBubble itemId={item.id} />
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
                // Progress columns get no vertical padding so their tree
                // guide lines (rendered full-height inside ProgressCell)
                // touch the row border above/below instead of leaving a
                // gap — otherwise the connector looks broken between rows.
                padding: col.type === 'progress' ? '0 8px' : '6px 8px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {renderCell(col)}
            </td>
          );
        })}

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

      {/* ✅ PERBAIKAN UTAMA: Guard untuk children.map */}
      {hasChildren && expanded && children.length > 0 && (
        children.map((child, childIndex) => {
          const childIsLastChild = childIndex === children.length - 1;
          // Depth-0 rows aren't part of the connector system (flat list,
          // no lines) — their children start a fresh ancestor chain rather
          // than inheriting one.
          const childAncestorLines = depth === 0 ? [] : [...ancestorLines, !isLastChild];
          return (
            <Row
              key={child.id || Math.random()}
              item={child}
              depth={depth + 1}
              groupColor={groupColor}
              groupName={groupName}
              isDefaultGroup={isDefaultGroup}
              visibleColumns={safeColumns}
              isSelected={selectedItems.includes(child.id)}
              onToggleSelect={onToggleSelect}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onOpenStatusManager={onOpenStatusManager}
              onOpenProgressManager={onOpenProgressManager}
              onAddSubItem={onAddSubItem}
              maxDepth={maxDepth}
              selectedItems={selectedItems}
              numberPath={`${numberPath}.${childIndex + 1}`}
              isLastChild={childIsLastChild}
              ancestorLines={childAncestorLines}
              siblings={children}
              parentAbsoluteWeights={myAbsoluteWeights}
            />
          );
        })
      )}
    </>
  );
}