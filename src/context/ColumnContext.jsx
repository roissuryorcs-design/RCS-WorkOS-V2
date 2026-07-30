import { createContext, useState, useContext, useEffect } from "react";
import { boardKey } from "../utils/boardStorage";
import { useLanguage } from "./LanguageContext";

const ColumnContext = createContext();

// Factory functions, not module constants — each must be called with the
// *currently active* `t`, at the moment a board/column is actually being
// created or repaired, not once at module load. A `const X = { label:
// t(...) }` at module scope would freeze at whichever language happened to
// be active when this file first imported, ignoring every later switch.
function getDefaultStatuses(t) {
  return {
    [t("defaults.statusDefault")]: "#9ca3af",
    [t("defaults.statusWorkingOnIt")]: "#f59e0b",
    [t("defaults.statusStuck")]: "#ef4444",
    [t("defaults.statusDone")]: "#22c55e",
  };
}

function getDefaultStatusOrder(t) {
  return Object.keys(getDefaultStatuses(t));
}

function getDefaultProgressStages(t) {
  return [
    { value: 0, label: t("defaults.stageNotStarted"), icon: "🔘", color: "#9E9E9E" },
    { value: 25, label: t("defaults.stagePreparation"), icon: "🟡", color: "#FFEB3B" },
    { value: 50, label: t("defaults.stageExecution"), icon: "🟠", color: "#FF9800" },
    { value: 80, label: t("defaults.stageReview"), icon: "🔵", color: "#2196F3" },
    { value: 100, label: t("defaults.stageCompleted"), icon: "🟢", color: "#4CAF50" },
  ];
}

function getDefaultColumns(t) {
  return [
    { id: "item", label: t("defaults.colItem"), type: "text", width: 150, visible: true },
    { id: "document", label: t("defaults.colDocument"), type: "text", width: 200, visible: true },
    { id: "people", label: t("defaults.colPeople"), type: "people", width: 120, visible: true },
    {
      id: "status",
      label: t("defaults.colStatus"),
      type: "status",
      width: 120,
      visible: true,
      statuses: getDefaultStatuses(t),
      statusOrder: getDefaultStatusOrder(t),
    },
    { id: "dueDate", label: t("defaults.colDueDate"), type: "date", width: 120, visible: true },
    { id: "rev", label: t("defaults.colRev"), type: "text", width: 80, visible: true },
  ];
}

export function ColumnProvider({ children, boardId }) {
  const { t } = useLanguage();
  const [columns, setColumns] = useState(() => {
    try {
      const saved = localStorage.getItem(boardKey("forelColumns", boardId));
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Pastikan setiap kolom status memiliki statuses & statusOrder
          const result = parsed.map(col => {
            if (!col) return null;
            if (col.type === "status" && !col.statuses) {
              return {
                ...col,
                statuses: getDefaultStatuses(t),
                statusOrder: getDefaultStatusOrder(t),
              };
            }
            if (col.type === "progress" && !col.progressStages) {
              return {
                ...col,
                progressStages: getDefaultProgressStages(t),
              };
            }
            return col;
          }).filter(Boolean);

          // Pastikan ada kolom item
          const hasItem = result.some(c => c && c.id === "item");
          if (!hasItem) {
            result.unshift({ id: "item", label: t("defaults.colItem"), type: "text", width: 150, visible: true });
          }
          return result;
        }
      }
    } catch (e) {
      console.error('Error loading columns from localStorage:', e);
    }
    return getDefaultColumns(t);
  });

  useEffect(() => {
    try {
      localStorage.setItem(boardKey("forelColumns", boardId), JSON.stringify(columns));
    } catch (e) {
      console.error('Error saving columns to localStorage:', e);
    }
  }, [columns, boardId]);

  const updateColumnWidth = (id, width) => {
    if (!id) return;
    setColumns((prev) =>
      prev.map((col) => (col && col.id === id ? { ...col, width: Math.max(40, width) } : col))
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
      newCol.statuses = getDefaultStatuses(t);
      newCol.statusOrder = getDefaultStatusOrder(t);
    }
    if (type === "formula") {
      newCol.formula = "";
    }
    if (type === "timeline") {
      newCol.width = 200;
    }
    if (type === "progress") {
      newCol.progressStages = getDefaultProgressStages(t);
      newCol.width = 260; // room for the bar, weight box, % label and settings icon
    }
    setColumns((prev) => [...prev, newCol]);
  };

  const updateColumnProgressStages = (columnId, newStages) => {
    if (!columnId || !Array.isArray(newStages)) return;
    setColumns((prev) =>
      prev.map((col) => (col && col.id === columnId ? { ...col, progressStages: newStages } : col))
    );
  };

  const updateColumnFormula = (id, formula) => {
    if (!id) return;
    setColumns((prev) =>
      prev.map((col) => (col && col.id === id ? { ...col, formula } : col))
    );
  };

  const deleteColumn = (id) => {
    if (!id) return;
    if (id === "item") {
      console.warn("Cannot delete ITEM column");
      return;
    }
    setColumns((prev) => prev.filter((col) => col && col.id !== id));
  };

  const toggleColumn = (id) => {
    if (!id) return;
    if (id === "item") {
      console.warn("Cannot toggle ITEM column");
      return;
    }
    setColumns((prev) =>
      prev.map((col) =>
        col && col.id === id ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const renameColumn = (id, newLabel) => {
    if (!id || !newLabel || !newLabel.trim()) return;
    setColumns((prev) =>
      prev.map((col) =>
        col && col.id === id ? { ...col, label: newLabel.trim() } : col
      )
    );
  };

  const reorderColumns = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    setColumns((prev) => {
      if (!Array.isArray(prev) || prev.length === 0) return prev;
      const newCols = [...prev];
      const [moved] = newCols.splice(fromIndex, 1);
      if (!moved) return prev;
      newCols.splice(toIndex, 0, moved);
      return newCols;
    });
  };

  const resetColumns = () => setColumns(getDefaultColumns(t));

  // ============================================================
  // FUNGSI UPDATE STATUS PER KOLOM
  // ============================================================
  const updateColumnStatuses = (columnId, newStatuses) => {
    if (!columnId || !newStatuses) return;
    setColumns((prev) =>
      prev.map((col) =>
        col && col.id === columnId ? { ...col, statuses: newStatuses } : col
      )
    );
  };

  const updateColumnStatusOrder = (columnId, newOrder) => {
    if (!columnId || !newOrder || !Array.isArray(newOrder)) return;
    setColumns((prev) =>
      prev.map((col) =>
        col && col.id === columnId ? { ...col, statusOrder: newOrder } : col
      )
    );
  };

  const visibleColumns = Array.isArray(columns) ? columns.filter((col) => col && col.visible) : [];

  return (
    <ColumnContext.Provider
      value={{
        columns: Array.isArray(columns) ? columns : [],
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
        updateColumnFormula,
        updateColumnProgressStages,
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