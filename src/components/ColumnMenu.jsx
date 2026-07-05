import { useState, useRef, useEffect } from "react";

export default function ColumnMenu({
  column,
  onRename,
  onToggle,
  onDelete,
  onClose,
}) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newLabel, setNewLabel] = useState(column.label || "");
  const inputRef = useRef(null);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  const handleRename = () => {
    if (newLabel.trim()) {
      onRename(column.id, newLabel.trim());
    }
    setIsRenaming(false);
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleRename();
    if (e.key === "Escape") {
      setIsRenaming(false);
      setNewLabel(column.label || "");
    }
  };

  const isAction = column.id === "action";
  const isItem = column.id === "item";

  return (
    <>
      {/* Overlay */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 999,
        }}
        onClick={onClose}
      />

      <div
        style={{
          position: "absolute",
          top: "100%",
          right: 0,
          marginTop: 4,
          background: "var(--bg-modal)",
          border: "1px solid var(--border-color)",
          borderRadius: 6,
          boxShadow: "var(--shadow-md)",
          padding: "4px 0",
          zIndex: 1000,
          minWidth: 160,
          color: "var(--text-primary)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {isRenaming ? (
          <div style={{ padding: "6px 12px" }}>
            <input
              ref={inputRef}
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onBlur={handleRename}
              onKeyDown={handleKeyDown}
              style={{
                width: "100%",
                padding: "4px 8px",
                border: "1px solid var(--btn-primary-bg)",
                borderRadius: 4,
                fontSize: 13,
                background: "var(--bg-input)",
                color: "var(--text-primary)",
                outline: "none",
              }}
            />
            <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
              <button
                onClick={handleRename}
                style={{
                  padding: "2px 12px",
                  background: "var(--btn-primary-bg)",
                  color: "white",
                  border: "none",
                  borderRadius: 3,
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsRenaming(false);
                  setNewLabel(column.label || "");
                }}
                style={{
                  padding: "2px 12px",
                  background: "transparent",
                  border: "1px solid var(--border-color)",
                  borderRadius: 3,
                  cursor: "pointer",
                  fontSize: 12,
                  color: "var(--text-secondary)",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Rename – semua kolom */}
            <button
              onClick={() => setIsRenaming(true)}
              style={menuButtonStyle}
            >
              ✏️ Rename
            </button>

            {/* Hide – hanya untuk non-action dan non-item */}
            {!isAction && !isItem && (
              <button
                onClick={() => {
                  onToggle(column.id);
                  onClose();
                }}
                style={menuButtonStyle}
              >
                {column.visible ? "👁️ Hide" : "👁️ Show"}
              </button>
            )}

            {/* Delete – hanya untuk non-action dan non-item */}
            {!isAction && !isItem && (
              <button
                onClick={() => {
                  if (confirm(`Delete column "${column.label}"?`)) {
                    onDelete(column.id);
                  }
                  onClose();
                }}
                style={{
                  ...menuButtonStyle,
                  color: "#ef4444",
                  borderTop: "1px solid var(--border-color)",
                }}
              >
                🗑️ Delete
              </button>
            )}

            {/* Pesan untuk ITEM & ACTION */}
            {(isAction || isItem) && (
              <div
                style={{
                  padding: "6px 12px",
                  fontSize: 13,
                  color: "var(--text-muted)",
                  borderTop: "1px solid var(--border-color)",
                }}
              >
                {isAction
                  ? "🔒 Fixed column"
                  : "🔒 ITEM column (cannot delete, hide, or drag)"}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

const menuButtonStyle = {
  display: "block",
  width: "100%",
  padding: "6px 14px",
  background: "none",
  border: "none",
  textAlign: "left",
  cursor: "pointer",
  fontSize: 13,
  color: "var(--text-primary)",
};
