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
}) {
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

  return (
    <tr className={isSelected ? "row-selected" : ""}>
      <td 
        className="row-checkbox-cell" 
        style={{ borderLeft: `4px solid ${groupColor}` }}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
        />
      </td>

      {visibleColumns.map((col, idx) => {
        const isLast = idx === visibleColumns.length - 1;
        const isItem = col.id === "item";

        return (
          <td
            key={col.id}
            className={`row-cell ${isItem ? "row-item-cell" : ""}`}
            style={{
              width: `${col.width}px`,
              minWidth: `${col.width}px`,
              maxWidth: `${col.width}px`,
              borderRight: isLast ? "none" : "2px solid var(--border-color)",
            }}
          >
            {renderCell(col)}
          </td>
        );
      })}

      <td className="row-add-cell" />
    </tr>
  );
}
