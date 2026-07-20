// src/components/ColumnManager.jsx

import { useState } from "react";
import { DEFAULT_COLUMNS } from "../data/treeData";

export default function ColumnManager({
  columns,
  onToggleColumn,
  onRenameColumn,
  onDeleteColumn,
  onResetColumns,
  onClose,
}) {
  const [editingId, setEditingId] = useState(null);
  const [editLabel, setEditLabel] = useState("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const startRename = (col) => {
    if (col.id === "item") return;
    setEditingId(col.id);
    setEditLabel(col.label);
  };

  const saveRename = () => {
    if (editLabel.trim()) {
      onRenameColumn(editingId, editLabel.trim());
    }
    setEditingId(null);
    setEditLabel("");
  };

  const cancelRename = () => {
    setEditingId(null);
    setEditLabel("");
  };

  const handleToggle = (col) => {
    if (col.id === "item") return;
    onToggleColumn(col.id);
  };

  const handleReset = () => {
    if (onResetColumns) {
      onResetColumns();
      setShowResetConfirm(false);
    }
  };

  // Cek apakah ada kolom default yang hilang
  const defaultColumnIds = DEFAULT_COLUMNS.map(c => c.id);
  const missingDefaultColumns = defaultColumnIds.filter(
    id => !columns.some(c => c.id === id)
  );

  const hasMissingDefaults = missingDefaultColumns.length > 0;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--bg-modal)",
          borderRadius: 12,
          padding: 24,
          maxWidth: 440,
          width: "100%",
          maxHeight: "80vh",
          overflowY: "auto",
          color: "var(--text-primary)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          border: "1px solid var(--border-color)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
            Manage Columns
          </h3>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
            {columns.filter(c => c.visible !== false).length} / {columns.length} visible
          </span>
        </div>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
          Click ▾ to collapse, ▸ to expand. Click name to rename.
        </p>

        {/* Indikator default columns */}
        {hasMissingDefaults && (
          <div
            style={{
              background: "rgba(255, 152, 0, 0.1)",
              borderLeft: "3px solid #FF9800",
              padding: "8px 12px",
              borderRadius: 4,
              marginBottom: 12,
              fontSize: 12,
              color: "var(--text-secondary)",
            }}
          >
            ⚠️ Beberapa kolom default hilang. Klik "Reset Default" untuk mengembalikan.
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          {columns.map((col) => {
            const isItem = col.id === "item";
            const isDefault = DEFAULT_COLUMNS.some(c => c.id === col.id);
            const isVisible = col.visible !== false;

            return (
              <div
                key={col.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 0",
                  borderBottom: "1px solid var(--border-light)",
                  background: isDefault && !isItem ? "rgba(76, 175, 80, 0.05)" : "transparent",
                  borderRadius: 4,
                  paddingLeft: isDefault && !isItem ? 4 : 0,
                }}
              >
                {/* Tombol Collapse/Expand */}
                <button
                  onClick={() => handleToggle(col)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: isItem ? "default" : "pointer",
                    fontSize: 16,
                    color: isVisible ? "var(--btn-primary-bg)" : "var(--text-muted)",
                    opacity: isItem ? 0.4 : 1,
                    padding: "0 4px",
                    width: 24,
                    textAlign: "center",
                    transition: "color 0.2s",
                  }}
                  title={isItem ? "Fixed column" : isVisible ? "Click to collapse" : "Click to expand"}
                >
                  {isVisible ? "▾" : "▸"}
                </button>

                {/* Nama kolom */}
                {editingId === col.id ? (
                  <input
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    onBlur={saveRename}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveRename();
                      if (e.key === "Escape") cancelRename();
                    }}
                    autoFocus
                    style={{
                      flex: 1,
                      padding: "2px 6px",
                      border: "2px solid var(--btn-primary-bg)",
                      borderRadius: 4,
                      fontSize: 14,
                      background: "var(--bg-input)",
                      color: "var(--text-primary)",
                      outline: "none",
                    }}
                  />
                ) : (
                  <span
                    style={{
                      flex: 1,
                      fontSize: 14,
                      cursor: isItem ? "default" : "pointer",
                      color: isItem ? "var(--text-muted)" : "var(--text-primary)",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                    onClick={() => startRename(col)}
                    title={isItem ? "Cannot rename fixed column" : "Click to rename"}
                  >
                    {col.label || col.id}
                    {isItem && <span style={{ fontSize: 10, color: "var(--text-muted)" }}>(fixed)</span>}
                    {isDefault && !isItem && (
                      <span
                        style={{
                          fontSize: 9,
                          background: "#4CAF50",
                          color: "white",
                          padding: "1px 8px",
                          borderRadius: 10,
                          fontWeight: 600,
                          letterSpacing: 0.3,
                        }}
                      >
                        DEFAULT
                      </span>
                    )}
                    {!isVisible && (
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>(hidden)</span>
                    )}
                  </span>
                )}

                {/* Tombol delete (hanya untuk non-default & non-item) */}
                {!isItem && !isDefault && onDeleteColumn && (
                  <button
                    onClick={() => {
                      if (confirm(`Delete column "${col.label || col.id}"?`)) {
                        onDeleteColumn(col.id);
                      }
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#f44336",
                      fontSize: 14,
                      padding: "0 4px",
                      opacity: 0.4,
                      transition: "opacity 0.2s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = 1; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = 0.4; }}
                    title="Delete column"
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Tombol Reset Default */}
        {onResetColumns && (
          <div style={{ marginBottom: 12 }}>
            {showResetConfirm ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  background: "rgba(255, 152, 0, 0.1)",
                  borderRadius: 6,
                  border: "1px solid #FF9800",
                }}
              >
                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  Reset semua kolom ke default?
                </span>
                <button
                  onClick={handleReset}
                  style={{
                    background: "#FF9800",
                    color: "white",
                    border: "none",
                    padding: "4px 14px",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  Yes
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  style={{
                    background: "transparent",
                    border: "1px solid var(--border-color)",
                    padding: "4px 14px",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontSize: 12,
                    color: "var(--text-secondary)",
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowResetConfirm(true)}
                style={{
                  width: "100%",
                  padding: "8px",
                  background: "rgba(255, 152, 0, 0.08)",
                  border: "2px dashed #FF9800",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 13,
                  color: "#FF9800",
                  transition: "all 0.2s",
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255, 152, 0, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255, 152, 0, 0.08)";
                }}
              >
                🔄 Reset Columns to Default
              </button>
            )}
          </div>
        )}

        {/* Tombol Close */}
        <button
          onClick={onClose}
          style={{
            width: "100%",
            padding: "8px",
            background: "var(--bg-hover)",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 14,
            color: "var(--text-secondary)",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--border-color)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
        >
          Close
        </button>

        {/* Info default columns */}
        <div
          style={{
            marginTop: 12,
            padding: "8px 12px",
            background: "rgba(76, 175, 80, 0.06)",
            borderRadius: 4,
            borderLeft: "3px solid #4CAF50",
            fontSize: 11,
            color: "var(--text-muted)",
          }}
        >
          💡 Kolom dengan label <span style={{ color: "#4CAF50", fontWeight: 600 }}>DEFAULT</span> adalah 
          kolom bawaan dan tidak bisa dihapus.
        </div>
      </div>
    </div>
  );
}
