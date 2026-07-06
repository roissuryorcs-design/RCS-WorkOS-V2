import { createContext, useState, useContext, useEffect } from "react";

const ColumnContext = createContext();

const defaultStatuses = {
  "Default": "#9ca3af",
  "Working on it": "#f59e0b",
  "Stuck": "#ef4444",
  "Done": "#22c55e",
};

const defaultStatusOrder = ["Default", "Working on it", "Stuck", "Done"];

const defaultColumns = [
  { id: "item", label: "ITEM", type: "text", width: 150, visible: true },
  { id: "document", label: "NO. DOCUMENT", type: "text", width: 200, visible: true },
  { id: "people", label: "PEOPLE", type: "people", width: 120, visible: true },
  { 
    id: "status", 
    label: "STATUS", 
    type: "status", 
    width: 120, 
    visible: true,
    statuses: { ...defaultStatuses },
    statusOrder: [...defaultStatusOrder],
  },
  { id: "dueDate", label: "DUE DATE", type: "date", width: 120, visible: true },
  { id: "rev", label: "REV", type: "text", width: 80, visible: true },
];

export function ColumnProvider({ children }) {
  const [columns, setColumns] = useState(() => {
    const saved = localStorage.getItem("forelColumns");
    if (saved) {
      const parsed = JSON.parse(saved);
      // Pastikan setiap kolom status memiliki statuses & statusOrder
      const result = parsed.map(col => {
        if (col.type === "status" && !col.statuses) {
          return {
            ...col,
            statuses: { ...defaultStatuses },
            statusOrder: [...defaultStatusOrder],
          };
        }
        return col;
      });
      // Pastikan ada kolom item
      const hasItem = result.some(c => c.id === "item");
      if (!hasItem) {
        result.unshift({ id: "item", label: "ITEM", type: "text", width: 150, visible: true });
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

  const addColumn = (label, type = "text") => {
    if (!label || !label.trim()) return;
    const newId = `col_${Date.now()}`;
    const newCol = {
      id: newId,
      label: label.trim(),
      type: type,
      width: 150,
      visible: true,
    };
    if (type === "status") {
      newCol.statuses = { ...defaultStatuses };
      newCol.statusOrder = [...defaultStatusOrder];
    }
    setColumns((prev) => [...prev, newCol]);
  };

  const deleteColumn = (id) => {
    if (id === "item") {
      console.warn("Cannot delete ITEM column");
      return;
    }
    setColumns((prev) => prev.filter((col) => col.id !== id));
  };

  const toggleColumn = (id) => {
    if (id === "item") {
      console.warn("Cannot hide ITEM column");
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

  // ============================================================
  // FUNGSI UPDATE STATUS PER KOLOM
  // ============================================================
  const updateColumnStatuses = (columnId, newStatuses) => {
    setColumns((prev) =>
      prev.map((col) =>
        col.id === columnId ? { ...col, statuses: newStatuses } : col
      )
    );
  };

  const updateColumnStatusOrder = (columnId, newOrder) => {
    setColumns((prev) =>
      prev.map((col) =>
        col.id === columnId ? { ...col, statusOrder: newOrder } : col
      )
    );
  };

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
        updateColumnStatuses,
        updateColumnStatusOrder,
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
