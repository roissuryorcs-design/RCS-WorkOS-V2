// Cari bagian <table> dan ubah menjadi:
<table
  cellPadding="0"
  style={{
    borderCollapse: "separate", // ← ubah
    borderSpacing: 0, // ← tambahkan
    border: "2px solid var(--border-color)",
    borderRadius: 4,
    borderLeft: `4px solid ${groupColor}`,
    tableLayout: "fixed",
    width: "auto",
  }}
>
