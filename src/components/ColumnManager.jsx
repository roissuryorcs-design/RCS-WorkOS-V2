// src/components/ColumnManager.jsx

import { useState } from "react";
import { useLanguage } from "../context/LanguageContext";

export default function ColumnManager({
  columns,
  onToggleColumn,
  onRenameColumn,
  onDeleteColumn,
  onClose,
}) {
  const { t } = useLanguage();
  const [editingId, setEditingId] = useState(null);
  const [editLabel, setEditLabel] = useState("");

  const startRename = (col) => {
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
            {t("columnManager.title")}
          </h3>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
            {t("columnManager.visibleCount", { visible: columns.filter(c => c.visible !== false).length, total: columns.length })}
          </span>
        </div>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
          {t("columnManager.hint")}
        </p>

        <div style={{ marginBottom: 16 }}>
          {columns.map((col) => {
            const isItem = col.id === "item";
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
                  title={isItem ? t("columnManager.fixedColumn") : isVisible ? t("columnManager.clickToCollapse") : t("columnManager.clickToExpand")}
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
                      cursor: "pointer",
                      color: "var(--text-primary)",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                    onClick={() => startRename(col)}
                    title={t("columnManager.clickToRename")}
                  >
                    {col.label || col.id}
                    {isItem && <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{t("columnManager.fixedTag")}</span>}
                    {!isVisible && (
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
                        {t("columnManager.hiddenTag")}
                      </span>
                    )}
                  </span>
                )}

                {/* Tombol delete — semua kolom boleh dihapus kecuali ITEM */}
                {!isItem && onDeleteColumn && (
                  <button
                    onClick={() => {
                      if (confirm(t("columnManager.deleteColumnConfirm", { name: col.label || col.id }))) {
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
                    title={t("columnManager.deleteColumnTitle")}
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}
        </div>

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
          {t("columnManager.close")}
        </button>
      </div>
    </div>
  );
}
