// Di bagian <table>, ubah:
<table
  cellPadding="0"
  style={{
    borderCollapse: "separate", // ← ubah dari collapse
    borderSpacing: 0, // ← tambahkan
    border: "2px solid var(--border-color)",
    borderRadius: 4,
    borderLeft: `4px solid ${groupColor}`,
    tableLayout: "fixed",
    width: "auto",
  }}
>
