import { supabase } from "../lib/supabaseClient";
import { boardKey } from "./boardStorage";

// Pre-Supabase (localStorage-only) shapes, as they were before Phases 3-6
// rewrote every context — see the migration plan's "Current architecture"
// section for the full inventory this was derived from.
const LEGACY_REGISTRY_KEY = "rcs-boards-registry";
const IMPORTED_FLAG_PREFIX = "rcs-migration-imported-v1";
const RESERVED_ITEM_KEYS = new Set(["id", "group", "item", "isExpanded", "children"]);

export function hasLegacyData() {
  return !!localStorage.getItem(LEGACY_REGISTRY_KEY);
}

export function isAlreadyImported(userId) {
  return localStorage.getItem(`${IMPORTED_FLAG_PREFIX}::${userId}`) === "true";
}

export function markLegacyImportDone(userId) {
  localStorage.setItem(`${IMPORTED_FLAG_PREFIX}::${userId}`, "true");
}

function readJson(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Error parsing legacy key "${key}":`, e);
    return fallback;
  }
}

// Recursively flattens the old nested items[] (children[]) into insertable
// `items` rows, assigning fresh uuids and resolving parent_id/group_id via
// the running maps — mirrors ItemsContext.jsx's field-splitting convention
// (title/isExpanded/group get dedicated columns, everything else lands in
// `fields` jsonb) so imported items render identically to items created
// after the migration.
function flattenLegacyItems(legacyItems, { boardId, groupIdByName, parentId, depth, userId }) {
  const rows = [];
  (legacyItems || []).forEach((legacyItem, index) => {
    const newId = crypto.randomUUID();
    const fields = {};
    for (const key of Object.keys(legacyItem)) {
      if (RESERVED_ITEM_KEYS.has(key)) continue;
      fields[key] = legacyItem[key];
    }
    rows.push({
      __oldId: legacyItem.id,
      row: {
        id: newId,
        board_id: boardId,
        group_id: groupIdByName[legacyItem.group] ?? null,
        parent_id: parentId,
        position: index,
        depth,
        name: legacyItem.item || "",
        is_expanded: !!legacyItem.isExpanded,
        fields,
        created_by: userId,
      },
    });
    if (legacyItem.children && legacyItem.children.length > 0) {
      rows.push(
        ...flattenLegacyItems(legacyItem.children, {
          boardId,
          groupIdByName,
          parentId: newId,
          depth: depth + 1,
          userId,
        })
      );
    }
  });
  return rows;
}

// Same flattening idea for the old updates tree (replies[] + parentReplyId
// duplicated the same nesting two ways — only replies[] actually matters
// for reconstructing the tree here).
function flattenLegacyUpdates(legacyUpdates, { itemId, boardId, parentId, userId }) {
  const rows = [];
  (legacyUpdates || []).forEach((legacyUpdate) => {
    const newId = crypto.randomUUID();
    rows.push({
      id: newId,
      item_id: itemId,
      board_id: boardId,
      parent_id: parentId,
      author_id: userId,
      text: legacyUpdate.text || "",
      files: legacyUpdate.files || [],
    });
    if (legacyUpdate.replies && legacyUpdate.replies.length > 0) {
      rows.push(...flattenLegacyUpdates(legacyUpdate.replies, { itemId, boardId, parentId: newId, userId }));
    }
  });
  return rows;
}

// Imports every legacy workspace/folder/board and its content into
// Supabase under the current user's account. Never deletes or modifies
// the source localStorage data — safe to retry if something fails partway
// (already-imported boards would just get duplicated on a retry, so the
// caller should only offer a retry after investigating a failure, not
// automatically).
export async function importLegacyBoards(userId) {
  const registry = readJson(LEGACY_REGISTRY_KEY, null);
  if (!registry) return { imported: false, reason: "no-legacy-data" };

  const legacyWorkspaces = registry.workspaces || [];
  const legacyNodes = registry.nodes || [];
  if (legacyWorkspaces.length === 0 && legacyNodes.length === 0) {
    return { imported: false, reason: "empty" };
  }

  const workspaceIdMap = {};
  const nodeIdMap = {};
  let boardsImported = 0;
  let itemsImported = 0;

  try {
    // 1. Workspaces — recreated fresh under this account (the old ones
    // were local-only labels, never a real shared/multi-user concept).
    const sourceWorkspaces = legacyWorkspaces.length > 0 ? legacyWorkspaces : [{ id: "__default__", name: "Imported" }];
    for (const ws of sourceWorkspaces) {
      const { data: newWorkspaceId, error } = await supabase.rpc("create_workspace", { _name: ws.name || "Imported" });
      if (error) throw new Error(`Creating workspace "${ws.name}": ${error.message}`);
      workspaceIdMap[ws.id] = newWorkspaceId;
    }
    const fallbackWorkspaceId = workspaceIdMap[sourceWorkspaces[0].id];

    // 2. Nodes (folders + boards) — insert parents before children, so a
    // node's parent_id is always already resolved in nodeIdMap by the
    // time a child references it. The old tree is flat with parentId
    // pointers (not nested), so repeatedly sweep for "ready" nodes
    // (root, or parent already imported) rather than assuming any
    // particular array order.
    const remaining = [...legacyNodes];
    let guard = remaining.length + 1;
    while (remaining.length > 0 && guard-- > 0) {
      const readyIndex = remaining.findIndex((n) => !n.parentId || nodeIdMap[n.parentId]);
      if (readyIndex === -1) break; // orphaned nodes (broken parentId) — stop rather than loop forever
      const [node] = remaining.splice(readyIndex, 1);
      const newWorkspaceId = workspaceIdMap[node.workspaceId] || fallbackWorkspaceId;
      const { data: inserted, error } = await supabase
        .from("nodes")
        .insert({
          workspace_id: newWorkspaceId,
          type: node.type,
          name: node.name,
          parent_id: node.parentId ? nodeIdMap[node.parentId] : null,
          position: node.position || 0,
          collapsed: !!node.collapsed,
          created_by: userId,
        })
        .select()
        .single();
      if (error) throw new Error(`Creating ${node.type} "${node.name}": ${error.message}`);
      nodeIdMap[node.id] = inserted.id;

      if (node.type === "board") {
        await importLegacyBoardContent({ oldBoardId: node.id, newBoardId: inserted.id, userId });
        boardsImported += 1;
      }
    }

    markLegacyImportDone(userId);
    return { imported: true, boardsImported, itemsImported };
  } catch (error) {
    console.error("Legacy import failed:", error);
    return { imported: false, error };
  }

  async function importLegacyBoardContent({ oldBoardId, newBoardId }) {
    const title = localStorage.getItem(boardKey("forelBoardTitle", oldBoardId));
    const subtitle = localStorage.getItem(boardKey("forelBoardSubtitle", oldBoardId));
    const currentView = localStorage.getItem(boardKey("forelCurrentView", oldBoardId));
    await supabase
      .from("boards")
      .upsert({
        id: newBoardId,
        title: title || null,
        subtitle: subtitle || null,
        current_view: currentView === "dashboard" ? "dashboard" : "table",
      });

    // Columns — ids are stable human-readable strings (not uuids) by
    // design, so they're reused as-is, just re-pointed at the new board.
    const legacyColumns = readJson(boardKey("forelColumns", oldBoardId), []);
    if (legacyColumns.length > 0) {
      const { error } = await supabase.from("columns").insert(
        legacyColumns.map((col, i) => ({
          id: col.id,
          board_id: newBoardId,
          label: col.label,
          type: col.type,
          width: col.width ?? 150,
          visible: col.visible !== false,
          position: i,
          statuses: col.statuses ?? null,
          status_order: col.statusOrder ?? null,
          progress_stages: col.progressStages ?? null,
          formula: col.formula ?? null,
        }))
      );
      if (error) console.error(`Error importing columns for board ${newBoardId}:`, error);
    }

    // Groups — old data only ever referenced groups by name (no ids), so
    // build the name->id map fresh per board here.
    const legacyGroupNames = readJson(boardKey("board-groups", oldBoardId), []);
    const groupColors = readJson(boardKey("forelGroupColors", oldBoardId), {});
    const groupHeaderColors = readJson(boardKey("forelGroupHeaderColors", oldBoardId), {});
    const groupIdByName = {};
    for (let i = 0; i < legacyGroupNames.length; i++) {
      const name = legacyGroupNames[i];
      const { data, error } = await supabase
        .from("groups")
        .insert({
          board_id: newBoardId,
          name,
          color: groupColors[name] || "#3b82f6",
          header_color: groupHeaderColors[name] || null,
          position: i,
        })
        .select()
        .single();
      if (error) {
        console.error(`Error importing group "${name}" for board ${newBoardId}:`, error);
        continue;
      }
      groupIdByName[name] = data.id;
    }

    // Items — flatten the nested tree, then insert in one batch (parent
    // rows and children alike share fresh uuids assigned client-side
    // before insert, so parent_id references are already valid).
    const legacyItems = readJson(boardKey("forelItems", oldBoardId), []);
    const flatItems = flattenLegacyItems(legacyItems, {
      boardId: newBoardId,
      groupIdByName,
      parentId: null,
      depth: 0,
      userId,
    });
    const itemIdMap = {};
    for (const { __oldId, row } of flatItems) {
      itemIdMap[__oldId] = row.id;
    }
    if (flatItems.length > 0) {
      const { error } = await supabase.from("items").insert(flatItems.map((f) => f.row));
      if (error) console.error(`Error importing items for board ${newBoardId}:`, error);
      itemsImported += flatItems.length;
    }

    // Updates/comments — item_id must point at an item that actually got
    // imported; skip any update whose item was dropped (shouldn't happen
    // in practice, but a missing item_id would violate the FK).
    const legacyUpdatesByItem = {};
    const allLegacyUpdates = readJson(boardKey("forelUpdates", oldBoardId), []);
    for (const u of allLegacyUpdates) {
      (legacyUpdatesByItem[u.itemId] ||= []).push(u);
    }
    const updateRows = [];
    for (const [oldItemId, updatesForItem] of Object.entries(legacyUpdatesByItem)) {
      const newItemId = itemIdMap[oldItemId];
      if (!newItemId) continue;
      updateRows.push(
        ...flattenLegacyUpdates(updatesForItem, { itemId: newItemId, boardId: newBoardId, parentId: null, userId })
      );
    }
    if (updateRows.length > 0) {
      const { error } = await supabase.from("updates").insert(updateRows);
      if (error) console.error(`Error importing updates for board ${newBoardId}:`, error);
    }

    // forelStatuses::<id> (board-wide status blob) is confirmed dead code
    // pre-migration — deliberately not imported.
  }
}
