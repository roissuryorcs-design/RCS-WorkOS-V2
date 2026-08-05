import { createContext, useState, useContext, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";
import { useLanguage } from "./LanguageContext";
import { useAuth } from "./AuthContext";
import { useGroups } from "./GroupContext";
import {
  getDefaultGroupName,
  getDefaultStatusKey,
  getTaskName,
  getDocNumber,
  getRevDefault,
  getSubItemLabel,
} from "../i18n/defaults";

const ItemsContext = createContext();

// Reserved keys that map to dedicated DB columns rather than the generic
// `fields` jsonb blob — everything else on an item (document, people,
// status, dueDate, rev, and any custom/progress/formula column value) is
// just a key in `fields`, same as the DB schema comment describes.
const RESERVED_KEYS = new Set(["id", "group", "item", "isExpanded", "children"]);

// Flat DB row -> the nested-tree item shape every existing component
// already expects (Row.jsx/BoardTable.jsx/Dashboard.jsx/formulaEngine.js
// all read `item[col.id]`, `item.item`, `item.group`, `item.children`).
// `children` is filled in by buildTree() below, not here.
function mapItemRow(row, groupNameById) {
  return {
    id: row.id,
    group: groupNameById[row.group_id] ?? "",
    item: row.name,
    isExpanded: row.is_expanded,
    ...row.fields,
    children: [],
  };
}

// Selector run at render time: turns the flat `parent_id` adjacency list
// into the nested `children[]` shape the rest of the app has always used,
// so Row.jsx/BoardTable.jsx/Dashboard.jsx need zero shape changes.
function buildTree(rows, groupNameById) {
  const byParent = new Map();
  for (const row of rows) {
    const key = row.parent_id || "__root__";
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(row);
  }
  for (const list of byParent.values()) list.sort((a, b) => a.position - b.position);

  function build(parentKey) {
    return (byParent.get(parentKey) || []).map((row) => ({
      ...mapItemRow(row, groupNameById),
      children: build(row.id),
    }));
  }

  return build("__root__");
}

function mergeInserted(prev, inserted) {
  let next = prev;
  for (const row of inserted) {
    if (next.some((r) => r.id === row.id)) continue;
    next = [...next, row];
  }
  return next;
}

export function ItemsProvider({ children, boardId }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { groupIdByName, groupNameById, groups, loading: groupsLoading } = useGroups();
  const [itemRows, setItemRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // ------------------------------------------------------------
  // Initial load.
  // ------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("board_id", boardId);

      if (cancelled) return;
      if (error) {
        console.error("Error loading items:", error);
        setLoading(false);
        return;
      }

      setItemRows(data || []);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [boardId]);

  // ------------------------------------------------------------
  // Realtime: keep this board's items in sync live across everyone
  // viewing it.
  // ------------------------------------------------------------
  useEffect(() => {
    if (!boardId) return;
    const channel = supabase
      .channel(`items:${boardId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "items", filter: `board_id=eq.${boardId}` },
        (payload) => {
          setItemRows((prev) => {
            if (payload.eventType === "DELETE") {
              return prev.filter((r) => r.id !== payload.old.id);
            }
            const incoming = payload.new;
            const exists = prev.some((r) => r.id === incoming.id);
            return exists ? prev.map((r) => (r.id === incoming.id ? incoming : r)) : [...prev, incoming];
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [boardId]);

  const items = useMemo(() => buildTree(itemRows, groupNameById), [itemRows, groupNameById]);

  // ------------------------------------------------------------
  // Insert helpers
  // ------------------------------------------------------------
  const insertItems = async (rows) => {
    const { data, error } = await supabase.from("items").insert(rows).select();
    if (error) {
      console.error("Error inserting items:", error);
      return [];
    }
    setItemRows((prev) => mergeInserted(prev, data));
    return data;
  };

  const addItem = (groupName) => {
    const groupId = groupIdByName[groupName];
    if (!groupId) return;
    const firstStatus = getDefaultStatusKey(t);
    const groupItems = itemRows.filter((r) => !r.parent_id && r.group_id === groupId);
    insertItems([
      {
        board_id: boardId,
        group_id: groupId,
        parent_id: null,
        position: groupItems.length,
        depth: 0,
        name: getTaskName(t, groupItems.length + 1),
        is_expanded: false,
        fields: {
          document: getDocNumber(t, groupItems.length + 1),
          people: "",
          status: firstStatus,
          dueDate: "",
          rev: getRevDefault(t),
        },
        created_by: user?.id ?? null,
      },
    ]);
  };

  const addSubItem = (parentId, newTitle = null) => {
    const parent = itemRows.find((r) => r.id === parentId);
    if (!parent) {
      console.warn("Parent not found for id:", parentId);
      return;
    }
    if (parent.depth >= 3) {
      alert(t("app.maxLevelsReached"));
      return;
    }
    const finalTitle = newTitle || getSubItemLabel(t, parent.depth + 1);
    const siblingCount = itemRows.filter((r) => r.parent_id === parentId).length;

    insertItems([
      {
        board_id: boardId,
        group_id: parent.group_id,
        parent_id: parentId,
        position: siblingCount,
        depth: parent.depth + 1,
        name: finalTitle,
        is_expanded: false,
        fields: {
          document: "NO. DO",
          people: "",
          status: getDefaultStatusKey(t),
          dueDate: "",
          rev: getRevDefault(t),
        },
        created_by: user?.id ?? null,
      },
    ]);

    if (!parent.is_expanded) {
      setItemRows((prev) => prev.map((r) => (r.id === parentId ? { ...r, is_expanded: true } : r)));
      supabase.from("items").update({ is_expanded: true }).eq("id", parentId).then(({ error }) => {
        if (error) console.error("Error expanding parent item:", error);
      });
    }
  };

  // Seeds `count` starter items into a group — used both when a brand-new
  // group is created and by the reactive auto-add-if-empty effect below.
  // Plain "Task N" naming, not "Task N in <group>": baking the group's
  // name into the item title made renaming a group look broken (already-
  // seeded items kept the old name in their title forever, since it was
  // copied once at creation, not a live reference).
  const seedItems = (groupId, count) => {
    const startIndex = itemRows.filter((r) => !r.parent_id && r.group_id === groupId).length;
    const rows = Array.from({ length: count }, (_, i) => ({
      board_id: boardId,
      group_id: groupId,
      parent_id: null,
      position: startIndex + i,
      depth: 0,
      name: getTaskName(t, startIndex + i + 1),
      is_expanded: false,
      fields: {
        document: getDocNumber(t, startIndex + i + 1),
        people: "",
        status: getDefaultStatusKey(t),
        dueDate: "",
        rev: getRevDefault(t),
      },
      created_by: user?.id ?? null,
    }));
    return insertItems(rows);
  };

  const updateItem = (id, field, value) => {
    const row = itemRows.find((r) => r.id === id);
    if (!row) return;
    let patch;
    if (field === "item") patch = { name: value };
    else if (field === "isExpanded") patch = { is_expanded: value };
    else if (field === "group") patch = { group_id: groupIdByName[value] ?? null };
    else patch = { fields: { ...row.fields, [field]: value } };

    setItemRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    supabase.from("items").update(patch).eq("id", id).then(({ error }) => {
      if (error) console.error("Error updating item:", error);
    });
  };

  const collectDescendantIds = (id) => {
    const ids = [];
    const walk = (parentId) => {
      for (const r of itemRows) {
        if (r.parent_id === parentId) {
          ids.push(r.id);
          walk(r.id);
        }
      }
    };
    walk(id);
    return ids;
  };

  const deleteItem = (id) => {
    if (!confirm(t("app.deleteItemConfirm"))) return;
    const row = itemRows.find((r) => r.id === id);
    if (!row) return;
    const directChildren = itemRows.filter((r) => r.parent_id === id);
    if (directChildren.length > 0) {
      if (!confirm(t("app.deleteItemWithChildrenConfirm", { name: row.name, count: directChildren.length }))) return;
    }

    const toRemove = new Set([id, ...collectDescendantIds(id)]);
    setItemRows((prev) => prev.filter((r) => !toRemove.has(r.id)));
    supabase.from("items").delete().eq("id", id).then(({ error }) => {
      if (error) console.error("Error deleting item:", error);
    });
  };

  // Atomically claims the right to seed a group's starter items: flips
  // `seeded` false->true in one UPDATE ... WHERE seeded = false. Postgres
  // guarantees only one concurrent UPDATE can match+affect that row, so
  // when N clients race this at once, exactly one gets a row back from
  // `.select()` and the rest get null — a real guarantee, unlike timing
  // heuristics. Requires the `groups.seeded` column (see migrations).
  const claimGroupForSeeding = async (groupId) => {
    const { data, error } = await supabase
      .from("groups")
      .update({ seeded: true })
      .eq("id", groupId)
      .eq("seeded", false)
      .select("id")
      .maybeSingle();
    if (error) {
      console.error("Error claiming group for seeding:", error);
      return false;
    }
    return !!data;
  };

  // ------------------------------------------------------------
  // Reactive auto-add: every group gets 3 starter items exactly once
  // (the first time it's seen with 0 root items — typically right after
  // creation). With multiple people viewing the same board, every client
  // notices the empty group at nearly the same moment; the atomic claim
  // above ensures only one of them actually inserts.
  // ------------------------------------------------------------
  useEffect(() => {
    if (groupsLoading || loading) return;
    if (groups.length === 0) return;

    const emptyGroups = groups.filter(
      (g) => itemRows.filter((r) => !r.parent_id && r.group_id === groupIdByName[g]).length === 0
    );
    if (emptyGroups.length === 0) return;

    emptyGroups.forEach(async (g) => {
      const groupId = groupIdByName[g];
      if (!groupId) return;
      const claimed = await claimGroupForSeeding(groupId);
      if (!claimed) return;
      seedItems(groupId, 3);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups, itemRows, groupsLoading, loading, groupIdByName]);

  return (
    <ItemsContext.Provider
      value={{
        loading,
        items,
        addItem,
        addSubItem,
        updateItem,
        deleteItem,
      }}
    >
      {children}
    </ItemsContext.Provider>
  );
}

export function useItems() {
  const context = useContext(ItemsContext);
  if (!context) {
    throw new Error("useItems must be used within an ItemsProvider");
  }
  return context;
}
