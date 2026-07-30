import { useState } from "react";
import { useLanguage } from "../context/LanguageContext";

export default function AddColumnPopup({ onAdd, onClose }) {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [type, setType] = useState("text");

  const columnTypes = [
    { value: "text", label: t("addColumnPopup.typeText") },
    { value: "status", label: t("addColumnPopup.typeStatus") },
    { value: "priority", label: t("addColumnPopup.typePriority") },
    { value: "date", label: t("addColumnPopup.typeDate") },
    { value: "timeline", label: t("addColumnPopup.typeTimeline") },
    { value: "people", label: t("addColumnPopup.typePeople") },
    { value: "phone", label: t("addColumnPopup.typePhone") },
    { value: "number", label: t("addColumnPopup.typeNumber") },
    { value: "numbering", label: t("addColumnPopup.typeNumbering") },
    { value: "files", label: t("addColumnPopup.typeFiles") },
    { value: "checkbox", label: t("addColumnPopup.typeCheckbox") },
    { value: "progress", label: t("addColumnPopup.typeProgress") },
    { value: "formula", label: t("addColumnPopup.typeFormula") },
  ];

  const handleAdd = () => {
    if (!name.trim()) return;
    console.log("✅ Adding column:", name.trim(), "type:", type); // debug
    onAdd(name.trim(), type);
    setName("");
    setType("text");
    onClose();
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
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--bg-modal)",
          borderRadius: 12,
          padding: 24,
          maxWidth: 380,
          width: "100%",
          color: "var(--text-primary)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          border: "1px solid var(--border-color)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginBottom: 16, fontSize: 18, fontWeight: 600 }}>
          {t("addColumnPopup.title")}
        </h3>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
            {t("addColumnPopup.columnName")}
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("addColumnPopup.namePlaceholder")}
            style={{
              width: "100%",
              padding: "8px 10px",
              border: "1px solid var(--border-dark)",
              borderRadius: 6,
              fontSize: 14,
              background: "var(--bg-input)",
              color: "var(--text-primary)",
              outline: "none",
            }}
            autoFocus
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
            {t("addColumnPopup.columnType")}
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 10px",
              border: "1px solid var(--border-dark)",
              borderRadius: 6,
              fontSize: 14,
              background: "var(--bg-input)",
              color: "var(--text-primary)",
              outline: "none",
            }}
          >
            {columnTypes.map(ct => (
              <option key={ct.value} value={ct.value}>{ct.label}</option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleAdd}
            style={{
              flex: 1,
              padding: "8px",
              background: "var(--btn-primary-bg)",
              color: "var(--btn-primary-text)",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            {t("addColumnPopup.add")}
          </button>
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
              background: "var(--bg-hover)",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              color: "var(--text-secondary)",
            }}
          >
            {t("addColumnPopup.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
