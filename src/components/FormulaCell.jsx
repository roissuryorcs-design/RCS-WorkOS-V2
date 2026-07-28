export default function FormulaCell({ result, hasFormula }) {
  const isError = result === "#ERROR";

  if (!hasFormula) {
    return (
      <span style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>
        fx — klik ⋮ untuk atur formula
      </span>
    );
  }

  return (
    <span
      title={isError ? "Formula error — periksa referensi kolom / sintaks" : undefined}
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
