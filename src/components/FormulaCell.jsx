import { useLanguage } from "../context/LanguageContext";

export default function FormulaCell({ result, hasFormula }) {
  const { t } = useLanguage();
  const isError = result === "#ERROR";

  if (!hasFormula) {
    return (
      <span style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>
        {t("formulaCell.hint")}
      </span>
    );
  }

  return (
    <span
      title={isError ? t("formulaCell.error") : undefined}
      style={{
        fontSize: 13,
        color: isError ? "#ef4444" : "var(--text-primary)",
        fontWeight: isError ? 600 : 500,
        fontFamily: isError ? "inherit" : "inherit",
      }}
    >
      {result === "" || result === undefined || result === null ? "—" : String(result)}
    </span>
  );
}
