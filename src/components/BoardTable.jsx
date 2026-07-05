// Hanya bagian <table> yang diubah:
<table
  cellPadding="0"
  style={{
    borderCollapse: "collapse",
    border: "2px solid var(--border-color)",
    borderRadius: 4,
    borderLeft: `4px solid ${groupColor}`,
    tableLayout: "fixed",
    // HAPUS width: "100%" dan minWidth
    // Biarkan tabel mengikuti lebar kolom
    width: "auto",
  }}
>
