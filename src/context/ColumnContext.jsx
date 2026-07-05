import { createContext, useState, useContext, useEffect } from "react";

const ColumnContext = createContext();

const defaultColumns = [
  { id: "item", label: "ITEM", width: 150, visible: true },
  { id: "document", label: "NO. DOCUMENT", width: 200, visible: true },
  { id: "people", label: "PEOPLE", width: 120, visible: true },
  { id: "status", label: "STATUS", width: 120, visible: true },
  { id: "dueDate", label: "DUE DATE", width: 120, visible: true },
  { id: "rev", label: "REV", width: 80, visible: true },
];

export function ColumnProvider({ children }) {
  const [columns, setColumns] = useState(() => {
    const saved = localStorage.getItem("forelColumns");
    if (saved) {
      const parsed = JSON.parse(saved);
      const hasItem = parsed.some((c) => c.id === "item");
      let result = [...parsed];
      if (!hasItem) {
        result.unshift({ id: "item", label: "ITEM", width: 150, visible: true });
      }
      return result;
    }
    return defaultColumns;
  });

  useEffect(() => {
    localStorage.setItem("forelColumns", JSON.stringify(columns));
  }, [columns]);

  const updateColumnWidth = (id, width) => {
    setColumns((prev) =>
      prev.map((col) => (col.id === id ? { ...col, width: Math.max(40, width) } : col))
    );
  };

  const addColumn = (label) => {
    if (!label || !label.trim()) return;
    const newId = `col_${Date.now()}`;
    setColumns((prev) => [
      ...prev,
      {
        id: newId,
        label: label.trim(),
        width: 150,
        visible: true,
      },
    ]);
  };

  const deleteColumn = (id) => {
    if (id === "item") {
      console.warn(`Cannot delete protected column: ${id}`);
      return;
    }
    setColumns((prev) => prev.filter((col) => col.id !== id));
  };

  const toggleColumn = (id) => {
    if (id === "item") {
      console.warn(`Cannot toggle protected column: ${id}`);
      return;
    }
    setColumns((prev) =>
      prev.map((col) =>
        col.id === id ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const renameColumn = (id, newLabel) => {
    if (!newLabel || !newLabel.trim()) return;
    setColumns((prev) =>
      prev.map((col) =>
        col.id === id ? { ...col, label: newLabel.trim() } : col
      )
    );
  };

  const reorderColumns = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    setColumns((prev) => {
      const newCols = [...prev];
      const [moved] = newCols.splice(fromIndex, 1);
      newCols.splice(toIndex, 0, moved);
      return newCols;
    });
  };

  const resetColumns = () => setColumns(defaultColumns);

  const visibleColumns = columns.filter((col) => col.visible);

  return (
    <ColumnContext.Provider
      value={{
        columns,
        visibleColumns,
        updateColumnWidth,
        addColumn,
        deleteColumn,
        toggleColumn,
        renameColumn,
        reorderColumns,
        resetColumns,
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
