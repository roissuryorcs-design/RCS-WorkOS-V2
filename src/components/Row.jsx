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
    <tr
      style={{
        fontSize: 13,
        background: isSelected ? "var(--bg-hover)" : "var(--bg-secondary)",
        borderLeft: `4px solid ${groupColor}`,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.background = "var(--bg-secondary)";
        }
      }}
    >
      {/* Checkbox – STICKY */}
      <td
        style={{
          padding: "6px 8px",
          width: "36px",
          minWidth: "36px",
          maxWidth: "36px",
          borderRight: "2px solid var(--border-color)",
          borderBottom: "2px solid var(--border-color)",
          textAlign: "center",
          boxSizing: "border-box",
          position: "sticky",
          left: 0,
          zIndex: 20,
          background: isSelected ? "var(--bg-hover)" : "var(--bg-secondary)",
        }}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          style={{ cursor: "pointer", width: 16, height: 16 }}
        />
      </td>

      {visibleColumns.map((col, idx) => {
        const isLast = idx === visibleColumns.length - 1;
        const isItem = col.id === "item";

        const stickyStyle = isItem
          ? {
              position: "sticky",
              left: "36px",
              zIndex: 20,
              background: isSelected ? "var(--bg-hover)" : "var(--bg-secondary)",
              boxShadow: "inset -2px 0 0 0 var(--border-color)",
            }
          : {};

        return (
          <td
            key={col.id}
            style={{
              padding: "6px 8px",
              borderRight: isLast ? "none" : "2px solid var(--border-color)",
              borderBottom: "2px solid var(--border-color)",
              width: `${col.width}px`,
              minWidth: `${col.width}px`,
              maxWidth: `${col.width}px`,
              boxSizing: "border-box",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              ...stickyStyle,
            }}
          >
            {renderCell(col)}
          </td>
        );
      })}

      {/* Kolom "+" (padding) */}
      <td
        style={{
          padding: "6px 8px",
          width: "50px",
          minWidth: "50px",
          maxWidth: "50px",
          borderRight: "none",
          borderLeft: "2px solid var(--border-color)",
          borderBottom: "2px solid var(--border-color)",
          boxSizing: "border-box",
        }}
      />
    </tr>
  );
}
