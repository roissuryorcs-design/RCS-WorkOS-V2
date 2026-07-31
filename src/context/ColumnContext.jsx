import { createContext, useState, useContext, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { generateId } from "../utils/boardStorage";
import { useLanguage } from "./LanguageContext";

const ColumnContext = createContext();

// Factory functions, not module constants — each must be called with the
// *currently active* `t`, at the moment a board/column is actually being
// created or repaired, not once at module load. A `const X = { label:
// t(...) }` at module scope would freeze at whichever language happened to
// be active when this file first imported, ignoring every later switch.
function getDefaultStatuses(t) {
  return {
    [t("defaults.statusNone")]: "#9ca3af",
    [t("defaults.statusOpen")]: "#3b82f6",
    [t("defaults.statusOnHold")]: "#f59e0b",
    [t("defaults.statusStuck")]: "#ef4444",
    [t("defaults.statusCancelled")]: "#8b5cf6",
    [t("defaults.statusClosed")]: "#22c55e",
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

// DB rows are snake_case; the rest of the app expects the same camelCase
// shape the old localStorage array used (statusOrder, progressStages) —
// bridging it here means every consumer (BoardTable, ColumnManager,
// StatusManager, ProgressStageManager, FormulaEditor...) needs zero changes.
function mapColumn(row) {
  const col = {
    id: row.id,
    label: row.label,
    type: row.type,
    width: row.width,
    visible: row.visible,
    position: row.position,
  };
  if (row.statuses != null) col.statuses = row.statuses;
  if (row.status_order != null) col.statusOrder = row.status_order;
  if (row.progress_stages != null) col.progressStages = row.progress_stages;
  if (row.formula != null) col.formula = row.formula;
  return col;
}

function toDbColumn(col, boardId, position) {
  return {
    id: col.id,
    board_id: boardId,
    label: col.label,
    type: col.type,
    width: col.width,
    visible: col.visible,
    position,
    statuses: col.statuses ?? null,
    status_order: col.statusOrder ?? null,
    progress_stages: col.progressStages ?? null,
    formula: col.formula ?? null,
  };
}

export function ColumnProvider({ children, boardId }) {
  const { t } = useLanguage();
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);

  // ------------------------------------------------------------
  // Initial load + one-time seed for a brand-new board + repair pass for
  // any column missing its type-specific config (mirrors the old
  // localStorage version's defensive repair, still relevant once Phase 7
  // imports legacy data that might have gaps).
  // ------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("columns")
        .select("*")
        .eq("board_id", boardId)
        .order("position");

      if (cancelled) return;
      if (error) {
        console.error("Error loading columns:", error);
        setLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        const defaults = getDefaultColumns(t);
        const rows = defaults.map((col, i) => toDbColumn(col, boardId, i));
        const { data: inserted, error: insertError } = await supabase.from("columns").insert(rows).select();
        if (cancelled) return;
        if (insertError) {
          console.error("Error seeding default columns:", insertError);
          setColumns(defaults);
        } else {
          setColumns((inserted || []).map(mapColumn).sort((a, b) => a.position - b.position));
        }
        setLoading(false);
        return;
      }

      let mapped = data.map(mapColumn);
      const repairs = [];

      if (!mapped.some((c) => c.id === "item")) {
        const itemCol = { id: "item", label: t("defaults.colItem"), type: "text", width: 150, visible: true };
        mapped = [itemCol, ...mapped];
        repairs.push(supabase.from("columns").insert(toDbColumn(itemCol, boardId, -1)));
      }
      mapped = mapped.map((col) => {
        if (col.type === "status" && !col.statuses) {
          const patch = { statuses: getDefaultStatuses(t), statusOrder: getDefaultStatusOrder(t) };
          repairs.push(
            supabase.from("columns").update({ statuses: patch.statuses, status_order: patch.statusOrder }).eq("board_id", boardId).eq("id", col.id)
          );
          return { ...col, ...patch };
        }
        if (col.type === "progress" && !col.progressStages) {
          const patch = { progressStages: getDefaultProgressStages(t) };
          repairs.push(
            supabase.from("columns").update({ progress_stages: patch.progressStages }).eq("board_id", boardId).eq("id", col.id)
          );
          return { ...col, ...patch };
        }
        return col;
      });

      if (repairs.length > 0) {
        Promise.all(repairs).catch((e) => console.error("Error repairing columns:", e));
      }

      setColumns(mapped);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);

  // ------------------------------------------------------------
  // Realtime: keep this board's columns in sync live across everyone
  // viewing it.
  // ------------------------------------------------------------
  useEffect(() => {
    if (!boardId) return;
    const channel = supabase
      .channel(`columns:${boardId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "columns", filter: `board_id=eq.${boardId}` },
        (payload) => {
          setColumns((prev) => {
            if (payload.eventType === "DELETE") {
              return prev.filter((c) => c.id !== payload.old.id);
            }
            const mapped = mapColumn(payload.new);
            const exists = prev.some((c) => c.id === mapped.id);
            const next = exists ? prev.map((c) => (c.id === mapped.id ? mapped : c)) : [...prev, mapped];
            return next.sort((a, b) => a.position - b.position);
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [boardId]);

  const updateColumnWidth = (id, width) => {
    if (!id) return;
    const clamped = Math.max(40, width);
    setColumns((prev) => prev.map((col) => (col && col.id === id ? { ...col, width: clamped } : col)));
    supabase.from("columns").update({ width: clamped }).eq("board_id", boardId).eq("id", id).then(({ error }) => {
      if (error) console.error("Error updating column width:", error);
    });
  };

  const addColumn = async (label, type = "text") => {
    if (!label || !label.trim()) return;
    const newId = generateId("col");
    const newCol = {
      id: newId,
      label: label.trim(),
      type,
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
    const position = columns.length;
    const { data, error } = await supabase
      .from("columns")
      .insert(toDbColumn(newCol, boardId, position))
      .select()
      .single();
    if (error) {
      console.error("Error adding column:", error);
      return;
    }
    setColumns((prev) => [...prev, mapColumn(data)]);
  };

  const updateColumnProgressStages = (columnId, newStages) => {
    if (!columnId || !Array.isArray(newStages)) return;
    setColumns((prev) => prev.map((col) => (col && col.id === columnId ? { ...col, progressStages: newStages } : col)));
    supabase.from("columns").update({ progress_stages: newStages }).eq("board_id", boardId).eq("id", columnId).then(({ error }) => {
      if (error) console.error("Error updating progress stages:", error);
    });
  };

  const updateColumnFormula = (id, formula) => {
    if (!id) return;
    setColumns((prev) => prev.map((col) => (col && col.id === id ? { ...col, formula } : col)));
    supabase.from("columns").update({ formula }).eq("board_id", boardId).eq("id", id).then(({ error }) => {
      if (error) console.error("Error updating formula:", error);
    });
  };

  const deleteColumn = (id) => {
    if (!id) return;
    if (id === "item") {
      console.warn("Cannot delete ITEM column");
      return;
    }
    setColumns((prev) => prev.filter((col) => col && col.id !== id));
    supabase.from("columns").delete().eq("board_id", boardId).eq("id", id).then(({ error }) => {
      if (error) console.error("Error deleting column:", error);
    });
  };

  const toggleColumn = (id) => {
    if (!id) return;
    if (id === "item") {
      console.warn("Cannot toggle ITEM column");
      return;
    }
    const col = columns.find((c) => c && c.id === id);
    if (!col) return;
    const visible = !col.visible;
    setColumns((prev) => prev.map((c) => (c && c.id === id ? { ...c, visible } : c)));
    supabase.from("columns").update({ visible }).eq("board_id", boardId).eq("id", id).then(({ error }) => {
      if (error) console.error("Error toggling column:", error);
    });
  };

  const renameColumn = (id, newLabel) => {
    if (!id || !newLabel || !newLabel.trim()) return;
    const label = newLabel.trim();
    setColumns((prev) => prev.map((col) => (col && col.id === id ? { ...col, label } : col)));
    supabase.from("columns").update({ label }).eq("board_id", boardId).eq("id", id).then(({ error }) => {
      if (error) console.error("Error renaming column:", error);
    });
  };

  // Drag-reorder: persists by renumbering every column's `position` to
  // match the new local order (column counts are small per board, cheap
  // to renumber in full).
  const reorderColumns = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    setColumns((prev) => {
      if (!Array.isArray(prev) || prev.length === 0) return prev;
      const newCols = [...prev];
      const [moved] = newCols.splice(fromIndex, 1);
      if (!moved) return prev;
      newCols.splice(toIndex, 0, moved);

      Promise.all(
        newCols.map((c, i) => supabase.from("columns").update({ position: i }).eq("board_id", boardId).eq("id", c.id))
      ).catch((e) => console.error("Error persisting column order:", e));

      return newCols;
    });
  };

  const resetColumns = async () => {
    const defaults = getDefaultColumns(t);
    await supabase.from("columns").delete().eq("board_id", boardId);
    const rows = defaults.map((col, i) => toDbColumn(col, boardId, i));
    const { data, error } = await supabase.from("columns").insert(rows).select();
    if (error) {
      console.error("Error resetting columns:", error);
      setColumns(defaults);
      return;
    }
    setColumns((data || []).map(mapColumn).sort((a, b) => a.position - b.position));
  };

  const updateColumnStatuses = (columnId, newStatuses) => {
    if (!columnId || !newStatuses) return;
    setColumns((prev) => prev.map((col) => (col && col.id === columnId ? { ...col, statuses: newStatuses } : col)));
    supabase.from("columns").update({ statuses: newStatuses }).eq("board_id", boardId).eq("id", columnId).then(({ error }) => {
      if (error) console.error("Error updating statuses:", error);
    });
  };

  const updateColumnStatusOrder = (columnId, newOrder) => {
    if (!columnId || !newOrder || !Array.isArray(newOrder)) return;
    setColumns((prev) => prev.map((col) => (col && col.id === columnId ? { ...col, statusOrder: newOrder } : col)));
    supabase.from("columns").update({ status_order: newOrder }).eq("board_id", boardId).eq("id", columnId).then(({ error }) => {
      if (error) console.error("Error updating status order:", error);
    });
  };

  const visibleColumns = Array.isArray(columns) ? columns.filter((col) => col && col.visible) : [];

  return (
    <ColumnContext.Provider
      value={{
        loading,
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
