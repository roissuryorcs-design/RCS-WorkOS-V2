import { useState, useRef } from "react";
import { evaluateFormula, FORMULA_FUNCTION_HELP } from "../utils/formulaEngine";
import { useLanguage } from "../context/LanguageContext";

export default function FormulaEditor({ column, columns, sampleItem, onSave, onClose }) {
  const { t } = useLanguage();
  const [formula, setFormula] = useState(column?.formula || "");
  const textareaRef = useRef(null);

  const insertAtCursor = (text) => {
    const el = textareaRef.current;
    if (!el) {
      setFormula((f) => f + text);
      return;
    }
    const start = el.selectionStart ?? formula.length;
    const end = el.selectionEnd ?? formula.length;
    const next = formula.slice(0, start) + text + formula.slice(end);
    setFormula(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + text.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const referenceableColumns = (columns || []).filter(
    (c) => c && c.id !== column?.id && c.type !== "files" && c.type !== "timeline"
  );

  const preview = sampleItem ? evaluateFormula(formula, sampleItem, columns) : "";

  const handleSave = () => {
    onSave(formula);
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
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--bg-modal)",
          borderRadius: 12,
          padding: 24,
          maxWidth: 480,
          width: "100%",
          maxHeight: "85vh",
          overflowY: "auto",
          color: "var(--text-primary)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          border: "1px solid var(--border-color)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginBottom: 4, fontSize: 18, fontWeight: 600 }}>
          {t("formulaEditor.titlePrefix")} {column?.label}
        </h3>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 14 }}>
          {t("formulaEditor.refHint")} <code>{"{Nama Kolom}"}</code>. {t("formulaEditor.refExample")}{" "}
          <code>{"{Progress} * 2"}</code> {t("formulaEditor.or")} <code>{'IF({Status} = "Done", "✅", "⏳")'}</code>
        </p>

        <textarea
          ref={textareaRef}
          value={formula}
          onChange={(e) => setFormula(e.target.value)}
          placeholder={t("formulaEditor.formulaPlaceholder")}
          rows={3}
          style={{
            width: "100%",
            padding: "10px 12px",
            border: "2px solid var(--border-dark)",
            borderRadius: 6,
            fontSize: 13,
            fontFamily: "monospace",
            background: "var(--bg-input)",
            color: "var(--text-primary)",
            outline: "none",
            resize: "vertical",
            marginBottom: 10,
          }}
        />

        <div
          style={{
            fontSize: 12,
            padding: "8px 10px",
            borderRadius: 6,
            background: preview === "#ERROR" ? "rgba(239,68,68,0.12)" : "var(--bg-hover)",
            color: preview === "#ERROR" ? "#ef4444" : "var(--text-secondary)",
            marginBottom: 14,
          }}
        >
          {sampleItem ? (
            <>{t("formulaEditor.previewRow", { item: sampleItem.item || t("formulaEditor.itemFallback") })} <strong>{preview === "" ? "—" : String(preview)}</strong></>
          ) : (
            t("formulaEditor.previewEmpty")
          )}
        </div>

        {referenceableColumns.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: "var(--text-secondary)" }}>
              {t("formulaEditor.columns")}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {referenceableColumns.map((c) => (
                <button
                  key={c.id}
                  onClick={() => insertAtCursor(`{${c.label}}`)}
                  style={{
                    padding: "3px 10px",
                    fontSize: 12,
                    borderRadius: 12,
                    border: "1px solid var(--border-color)",
                    background: "var(--bg-hover)",
                    color: "var(--text-primary)",
                    cursor: "pointer",
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: "var(--text-secondary)" }}>
            {t("formulaEditor.functions")}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 150, overflowY: "auto" }}>
            {FORMULA_FUNCTION_HELP.map((f) => (
              <div
                key={f.name}
                onClick={() => insertAtCursor(f.name.replace(/\(.*\)/, "()"))}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 8,
                  padding: "4px 8px",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: 12,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <code style={{ color: "var(--btn-primary-bg)", flexShrink: 0 }}>{f.name}</code>
                <span style={{ color: "var(--text-muted)", textAlign: "right" }}>{t(f.descKey)}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleSave}
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
            {t("formulaEditor.save")}
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
            {t("formulaEditor.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
