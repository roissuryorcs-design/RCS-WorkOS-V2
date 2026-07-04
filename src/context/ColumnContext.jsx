import { createContext, useState, useContext, useEffect } from "react";

const ColumnContext = createContext();

const defaultColumns = [
  { id: "item", label: "ITEM", width: 22, visible: true },
  { id: "document", label: "NO. DOCUMENT", width: 20, visible: true },
  { id: "people", label: "PEOPLE", width: 13, visible: true },
  { id: "status", label: "STATUS", width: 13, visible: true },
  { id: "dueDate", label: "DUE DATE", width: 13, visible: true },
  { id: "rev", label: "REV", width: 8, visible: true },
  { id: "action", label: "", width: 6, visible: true },
];

export function ColumnProvider({ children }) {
  const [columns, setColumns] = useState(() => {
    const saved = localStorage.getItem("forelColumns");
    return saved ? JSON.parse(saved) : defaultColumns;
  });

  useEffect(() => {
    localStorage.setItem("forelColumns", JSON.stringify(columns));
  }, [columns]);

  // Update lebar kolom
  const updateColumnWidth = (id, width) => {
    console.log("updateColumnWidth:", id, width); // ← DEBUG
    setColumns((prev) =>
      prev.map((col) => (col.id === id ? { ...col, width: Math.max(3, width) } : col))
    );
  };

  // Tambah kolom baru
  const addColumn = (label) => {
    console.log("addColumn called with:", label); // ← DEBUG
    if (!label || !label.trim()) return;
    const newId = `col_${Date.now()}`;
    setColumns((prev) => [
      ...prev.slice(0, -1),
      { id: newId, label: label.trim(), width: 15, visible: true },
      prev[prev.length - 1],
    ]);
  };

  // Hapus kolom
  const deleteColumn = (id) => {
    console.log("deleteColumn called with:", id); // ← DEBUG
    if (id === "action") return;
    setColumns((prev) => prev.filter((col) => col.id !== id));
  };

  // Toggle visibility
  const toggleColumn = (id) => {
    console.log("toggleColumn called with:", id); // ← DEBUG
    setColumns((prev) =>
      prev.map((col) =>
        col.id === id ? { ...col, visible: !col.visible } : col
      )
    );
  };

  // Rename
  const renameColumn = (id, newLabel) => {
    console.log("renameColumn:", id, "->", newLabel); // ← DEBUG
    if (!newLabel || !newLabel.trim()) return;
    setColumns((prev) =>
      prev.map((col) =>
        col.id === id ? { ...col, label: newLabel.trim() } : col
      )
    );
  };

  // Reorder
  const reorderColumns = (fromIndex, toIndex) => {
    console.log("reorderColumns: from", fromIndex, "to", toIndex); // ← DEBUG
    if (fromIndex === toIndex) return;
    const newColumns = [...columns];
    const [moved] = newColumns.splice(fromIndex, 1);
    newColumns.splice(toIndex, 0, moved);
    setColumns(newColumns);
  };

  // Reset
  const resetColumns = () => {
    console.log("resetColumns called"); // ← DEBUG
    setColumns(defaultColumns);
  };

  return (
    <ColumnContext.Provider
      value={{
        columns,
        updateColumnWidth,
        addColumn,
        deleteColumn,
        toggleColumn,
        renameColumn,
        reorderColumns,
        resetColumns,
        visibleColumns: columns.filter((col) => col.visible),
      }}
    >
      {children}
    </ColumnContext.Provider>
  );
}

export function useColumns() {
  const context = useContext(ColumnContext);
  if (!context) {
    throw new Error("useColumns must be used within a ColumnProvider");
  }
  return context;
}
