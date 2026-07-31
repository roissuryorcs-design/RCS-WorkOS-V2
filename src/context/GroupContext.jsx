import { createContext, useState, useContext, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useLanguage } from "./LanguageContext";
import { getDefaultGroupName } from "../i18n/defaults";

const GroupContext = createContext();

// Consolidates what used to be 3 separate localStorage blobs (board-groups
// order array + forelGroupColors map + forelGroupHeaderColors map) into one
// `groups` table row per group. The rest of the app (BoardTable.jsx,
// Row.jsx via item.group, Dashboard.jsx, Header.jsx) still works with group
// *names* as plain strings — that hasn't changed, so `groups`/`groupColors`/
// `groupHeaderColors` are derived back into those exact shapes below.
function mapGroup(row) {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    headerColor: row.header_color,
    position: row.position,
  };
}

export function GroupProvider({ children, boardId }) {
  const { t } = useLanguage();
  const [groupRows, setGroupRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // ------------------------------------------------------------
  // Initial load + one-time seed of a default group for a brand-new board.
  // ------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("groups")
        .select("*")
        .eq("board_id", boardId)
        .order("position");

      if (cancelled) return;
      if (error) {
        console.error("Error loading groups:", error);
        setLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        const defaultName = getDefaultGroupName(t);
        const { data: inserted, error: insertError } = await supabase
          .from("groups")
          .insert({ board_id: boardId, name: defaultName, color: "#3b82f6", position: 0 })
          .select()
          .single();
        if (cancelled) return;
        if (insertError) {
          console.error("Error seeding default group:", insertError);
          setGroupRows([{ id: null, name: defaultName, color: "#3b82f6", headerColor: null, position: 0 }]);
        } else {
          setGroupRows([mapGroup(inserted)]);
        }
        setLoading(false);
        return;
      }

      setGroupRows(data.map(mapGroup));
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);

  // ------------------------------------------------------------
  // Realtime: keep this board's groups in sync live across everyone
  // viewing it.
  // ------------------------------------------------------------
  useEffect(() => {
    if (!boardId) return;
    const channel = supabase
      .channel(`groups:${boardId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "groups", filter: `board_id=eq.${boardId}` },
        (payload) => {
          setGroupRows((prev) => {
            if (payload.eventType === "DELETE") {
              return prev.filter((g) => g.id !== payload.old.id);
            }
            const mapped = mapGroup(payload.new);
            const exists = prev.some((g) => g.id === mapped.id);
            const next = exists ? prev.map((g) => (g.id === mapped.id ? mapped : g)) : [...prev, mapped];
            return next.sort((a, b) => a.position - b.position);
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [boardId]);

  const groups = groupRows.map((g) => g.name);
  const groupColors = Object.fromEntries(groupRows.map((g) => [g.name, g.color]));
  const groupHeaderColors = Object.fromEntries(
    groupRows.filter((g) => g.headerColor).map((g) => [g.name, g.headerColor])
  );

  const createGroup = async (name) => {
    const position = groupRows.length;
    const { data, error } = await supabase
      .from("groups")
      .insert({ board_id: boardId, name, color: "#3b82f6", position })
      .select()
      .single();
    if (error) {
      console.error("Error creating group:", error);
      return;
    }
    setGroupRows((prev) => [...prev, mapGroup(data)]);
  };

  const renameGroupEntry = async (oldName, newName) => {
    const row = groupRows.find((g) => g.name === oldName);
    if (!row) return;
    setGroupRows((prev) => prev.map((g) => (g.name === oldName ? { ...g, name: newName } : g)));
    const { error } = await supabase.from("groups").update({ name: newName }).eq("id", row.id);
    if (error) console.error("Error renaming group:", error);
  };

  const removeGroup = async (name) => {
    const row = groupRows.find((g) => g.name === name);
    if (!row) return;
    setGroupRows((prev) => prev.filter((g) => g.name !== name));
    const { error } = await supabase.from("groups").delete().eq("id", row.id);
    if (error) console.error("Error deleting group:", error);
  };

  // Drag-reorder: persists by renumbering every group's `position` to match
  // the new order (small counts per board, cheap to renumber in full).
  const reorderGroups = async (newOrderNames) => {
    if (!Array.isArray(newOrderNames) || newOrderNames.length === 0) return;
    const reordered = newOrderNames.map((name) => groupRows.find((g) => g.name === name)).filter(Boolean);
    if (reordered.length !== groupRows.length) return;
    setGroupRows(reordered);
    await Promise.all(
      reordered.map((g, i) => supabase.from("groups").update({ position: i }).eq("id", g.id))
    ).catch((e) => console.error("Error persisting group order:", e));
  };

  const updateGroupColor = (name, color) => {
    const row = groupRows.find((g) => g.name === name);
    setGroupRows((prev) => prev.map((g) => (g.name === name ? { ...g, color } : g)));
    if (row) {
      supabase.from("groups").update({ color }).eq("id", row.id).then(({ error }) => {
        if (error) console.error("Error updating group color:", error);
      });
    }
  };

  const updateGroupHeaderColor = (name, color) => {
    const row = groupRows.find((g) => g.name === name);
    setGroupRows((prev) => prev.map((g) => (g.name === name ? { ...g, headerColor: color } : g)));
    if (row) {
      supabase.from("groups").update({ header_color: color }).eq("id", row.id).then(({ error }) => {
        if (error) console.error("Error updating group header color:", error);
      });
    }
  };

  return (
    <GroupContext.Provider
      value={{
        loading,
        groups,
        groupColors,
        groupHeaderColors,
        createGroup,
        renameGroupEntry,
        removeGroup,
        reorderGroups,
        updateGroupColor,
        updateGroupHeaderColor,
      }}
    >
      {children}
    </GroupContext.Provider>
  );
}

export function useGroups() {
  const context = useContext(GroupContext);
  if (!context) {
    throw new Error("useGroups must be used within a GroupProvider");
  }
  return context;
}
