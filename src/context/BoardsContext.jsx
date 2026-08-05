import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "./AuthContext";
import { useLanguage } from "./LanguageContext";

const BoardsContext = createContext();

const MAX_RECENT_WORKSPACES = 5;

// activeWorkspaceId/activeBoardId/recentWorkspaceIds are per-device UI
// preferences, not shared board data — kept in localStorage (scoped by
// user id so switching accounts on the same browser doesn't cross-wire),
// same as theme/language. Everything else now lives in Supabase.
function prefsKey(userId) {
  return `rcs-board-prefs::${userId}`;
}
function loadPrefs(userId) {
  try {
    const saved = localStorage.getItem(prefsKey(userId));
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error("Error loading board prefs:", e);
  }
  return { activeWorkspaceId: null, activeBoardId: null, recentWorkspaceIds: [] };
}

// DB rows are snake_case; the rest of the app (Sidebar.jsx, WorkspaceSwitcher.jsx)
// expects the same camelCase node shape the old localStorage registry used —
// bridging it here means those components need zero changes.
function mapNode(row) {
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    parentId: row.parent_id,
    workspaceId: row.workspace_id,
    position: row.position,
    collapsed: row.collapsed,
    createdBy: row.created_by,
    archivedAt: row.archived_at,
    deletedAt: row.deleted_at,
  };
}

function randomInviteCode() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 10);
}

export function BoardsProvider({ children }) {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [workspaces, setWorkspaces] = useState([]); // [{id, name, role}]
  const [allNodesByWorkspace, setAllNodesByWorkspace] = useState({}); // {workspaceId: node[]}
  const [favoriteBoardIds, setFavoriteBoardIds] = useState([]);
  const [favoriteBoardsMeta, setFavoriteBoardsMeta] = useState([]); // resolved {id,name,workspaceId}
  const [loading, setLoading] = useState(true);

  const [prefs, setPrefs] = useState(() => loadPrefs(user.id));
  const { activeWorkspaceId, activeBoardId, recentWorkspaceIds } = prefs;

  const updatePrefs = (patch) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(prefsKey(user.id), JSON.stringify(next));
      return next;
    });
  };

  // ------------------------------------------------------------
  // Initial load: workspaces the user belongs to, then nodes for
  // whichever workspace ends up active.
  // ------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setLoading(true);

      const { data: memberRows, error: memberError } = await supabase
        .from("workspace_members")
        .select("role, workspaces(id, name)")
        .eq("user_id", user.id);

      if (memberError) {
        console.error("Error loading workspaces:", memberError);
        setLoading(false);
        return;
      }

      let ws = (memberRows || [])
        .filter((r) => r.workspaces)
        .map((r) => ({ id: r.workspaces.id, name: r.workspaces.name, role: r.role }));

      // Brand new account with zero workspaces — bootstrap one starter
      // workspace so the app isn't a dead end (mirrors the old localStorage
      // fresh-install path, minus the auto-seeded folders/board — the
      // existing EmptyWorkspaceState UI already handles "create your first
      // board" from here).
      if (ws.length === 0) {
        const { data: newId, error: createError } = await supabase.rpc("create_workspace", {
          _name: t("defaults.defaultWorkspaceName"),
        });
        if (createError) {
          console.error("Error bootstrapping starter workspace:", createError);
          setLoading(false);
          return;
        }
        ws = [{ id: newId, name: t("defaults.defaultWorkspaceName"), role: "owner" }];
      }

      if (cancelled) return;
      setWorkspaces(ws);

      const savedPrefs = loadPrefs(user.id);
      const activeWs = ws.some((w) => w.id === savedPrefs.activeWorkspaceId)
        ? savedPrefs.activeWorkspaceId
        : ws[0].id;

      const { data: nodeRows, error: nodeError } = await supabase
        .from("nodes")
        .select("*")
        .eq("workspace_id", activeWs)
        .order("position");

      if (cancelled) return;
      if (nodeError) {
        console.error("Error loading nodes:", nodeError);
      }
      const mapped = (nodeRows || []).map(mapNode);
      setAllNodesByWorkspace({ [activeWs]: mapped });

      const boardsInWs = mapped.filter((n) => n.type === "board");
      const activeBoard = boardsInWs.some((b) => b.id === savedPrefs.activeBoardId)
        ? savedPrefs.activeBoardId
        : boardsInWs[0]?.id ?? null;

      updatePrefs({
        activeWorkspaceId: activeWs,
        activeBoardId: activeBoard,
        recentWorkspaceIds: savedPrefs.recentWorkspaceIds?.length ? savedPrefs.recentWorkspaceIds : [activeWs],
      });

      // Favorites can point into any workspace the user belongs to.
      const { data: favRows, error: favError } = await supabase
        .from("user_board_favorites")
        .select("board_id, nodes(id, name, workspace_id)")
        .eq("user_id", user.id);
      if (!cancelled && !favError) {
        const favs = (favRows || []).filter((r) => r.nodes);
        setFavoriteBoardIds(favs.map((r) => r.board_id));
        setFavoriteBoardsMeta(favs.map((r) => ({ id: r.nodes.id, name: r.nodes.name, workspaceId: r.nodes.workspace_id })));
      }

      setLoading(false);
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  // ------------------------------------------------------------
  // Fetch nodes whenever the active workspace changes and we don't
  // already have them cached.
  // ------------------------------------------------------------
  useEffect(() => {
    if (!activeWorkspaceId || allNodesByWorkspace[activeWorkspaceId]) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("nodes")
        .select("*")
        .eq("workspace_id", activeWorkspaceId)
        .order("position");
      if (cancelled) return;
      if (error) {
        console.error("Error loading nodes:", error);
        return;
      }
      setAllNodesByWorkspace((prev) => ({ ...prev, [activeWorkspaceId]: (data || []).map(mapNode) }));
    })();
    return () => {
      cancelled = true;
    };
  }, [activeWorkspaceId, allNodesByWorkspace]);

  // ------------------------------------------------------------
  // Realtime: keep the active workspace's node list in sync live.
  // ------------------------------------------------------------
  useEffect(() => {
    if (!activeWorkspaceId) return;
    const channel = supabase
      .channel(`nodes:${activeWorkspaceId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "nodes", filter: `workspace_id=eq.${activeWorkspaceId}` },
        (payload) => {
          setAllNodesByWorkspace((prev) => {
            const list = prev[activeWorkspaceId] || [];
            if (payload.eventType === "DELETE") {
              return { ...prev, [activeWorkspaceId]: list.filter((n) => n.id !== payload.old.id) };
            }
            const mapped = mapNode(payload.new);
            const exists = list.some((n) => n.id === mapped.id);
            const next = exists ? list.map((n) => (n.id === mapped.id ? mapped : n)) : [...list, mapped];
            return { ...prev, [activeWorkspaceId]: next };
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeWorkspaceId]);

  const allNodes = allNodesByWorkspace[activeWorkspaceId] || [];
  // `nodes` (fed to the sidebar tree) excludes archived boards — those are
  // surfaced separately via `archivedBoards` instead. Everything else in
  // this file still reads from the unfiltered `allNodes`.
  const nodes = allNodes.filter((n) => !n.archivedAt && !n.deletedAt);
  const archivedBoards = allNodes.filter((n) => n.type === "board" && n.archivedAt && !n.deletedAt);
  const trashedBoards = allNodes.filter((n) => n.type === "board" && n.deletedAt && !n.archivedAt);

  const activeMembership = workspaces.find((w) => w.id === activeWorkspaceId);
  const isActiveWorkspaceOwner = activeMembership?.role === "owner";

  // Ensures a workspace's nodes are loaded, then makes it (and its first
  // board, if any) active. Resolves from the freshly-fetched data directly
  // rather than re-reading `allNodesByWorkspace` right after setting it —
  // state updates aren't synchronous, so a read on the very next line would
  // still see the pre-update value.
  const activateWorkspace = async (id) => {
    let nodesForWs = allNodesByWorkspace[id];
    if (!nodesForWs) {
      const { data } = await supabase.from("nodes").select("*").eq("workspace_id", id).order("position");
      nodesForWs = (data || []).map(mapNode);
      setAllNodesByWorkspace((prev) => ({ ...prev, [id]: nodesForWs }));
    }
    const boardsInWs = nodesForWs.filter((n) => n.type === "board");
    updatePrefs({
      activeWorkspaceId: id,
      activeBoardId: boardsInWs[0]?.id ?? null,
      recentWorkspaceIds: [id, ...recentWorkspaceIds.filter((w) => w !== id)].slice(0, MAX_RECENT_WORKSPACES),
    });
  };

  // ------------------------------------------------------------
  // Board/folder tree operations
  // ------------------------------------------------------------
  const switchBoard = (id) => {
    if (!allNodes.some((n) => n.id === id && n.type === "board")) return;
    updatePrefs({ activeBoardId: id });
  };

  const goToBoard = async (id) => {
    const meta = favoriteBoardsMeta.find((f) => f.id === id);
    const targetWorkspaceId = meta?.workspaceId ?? allNodes.find((n) => n.id === id)?.workspaceId;
    if (!targetWorkspaceId) return;

    if (targetWorkspaceId !== activeWorkspaceId && !allNodesByWorkspace[targetWorkspaceId]) {
      const { data } = await supabase.from("nodes").select("*").eq("workspace_id", targetWorkspaceId).order("position");
      setAllNodesByWorkspace((prev) => ({ ...prev, [targetWorkspaceId]: (data || []).map(mapNode) }));
    }

    updatePrefs({
      activeWorkspaceId: targetWorkspaceId,
      activeBoardId: id,
      recentWorkspaceIds: [targetWorkspaceId, ...recentWorkspaceIds.filter((w) => w !== targetWorkspaceId)].slice(
        0,
        MAX_RECENT_WORKSPACES
      ),
    });
  };

  // A "go straight to X" action that can't be fulfilled from here — e.g.
  // the notification bell wants to open a specific item's comment panel
  // or the board discussion channel, but those live inside per-board
  // providers (UpdateProvider/Header) that get freshly (re)mounted on a
  // board switch. Stashing the intent here and letting Header.jsx's own
  // effect pick it up once its boardId prop matches is what survives that
  // remount without needing real URL routing.
  const [pendingBoardAction, setPendingBoardAction] = useState(null); // { boardId, type: 'item' | 'discussion', itemId? }

  const requestBoardNavigation = (action) => {
    setPendingBoardAction(action);
    goToBoard(action.boardId);
  };

  const clearPendingBoardAction = () => setPendingBoardAction(null);

  // While the board discussion chat has an in-progress "#" reference
  // search, this lets Row.jsx offer "click this item instead of typing
  // its name" — set/cleared by BoardDiscussionPanel itself, read by every
  // Row in the currently open board (they're always the same board, since
  // the discussion panel only exists for whatever board is active).
  const [itemPickRequest, setItemPickRequest] = useState(null); // { boardId, onPick: (item) => void } | null

  const toggleFavorite = async (id) => {
    const isFav = favoriteBoardIds.includes(id);
    if (isFav) {
      setFavoriteBoardIds((prev) => prev.filter((f) => f !== id));
      setFavoriteBoardsMeta((prev) => prev.filter((f) => f.id !== id));
      await supabase.from("user_board_favorites").delete().eq("user_id", user.id).eq("board_id", id);
    } else {
      const node = allNodes.find((n) => n.id === id);
      if (!node) return;
      setFavoriteBoardIds((prev) => [...prev, id]);
      setFavoriteBoardsMeta((prev) => [...prev, { id, name: node.name, workspaceId: node.workspaceId }]);
      await supabase.from("user_board_favorites").insert({ user_id: user.id, board_id: id });
    }
  };

  const createFolder = async (name, parentFolderId = null) => {
    const trimmed = (name || "").trim();
    if (!trimmed) return;
    if (parentFolderId) {
      const parent = allNodes.find((n) => n.id === parentFolderId);
      if (!parent || parent.type !== "folder" || parent.parentId) {
        alert(t("boardsContext.folderNestingLimit"));
        return;
      }
    }
    const position = allNodes.filter((n) => n.parentId === parentFolderId).length;
    const { data, error } = await supabase
      .from("nodes")
      .insert({ workspace_id: activeWorkspaceId, type: "folder", name: trimmed, parent_id: parentFolderId, position, created_by: user.id })
      .select()
      .single();
    if (error) {
      console.error("Error creating folder:", error);
      return;
    }
    const mapped = mapNode(data);
    setAllNodesByWorkspace((prev) => {
      const list = prev[activeWorkspaceId] || [];
      // The Realtime INSERT echo of this same row can land before this
      // optimistic update does — de-dupe by id rather than blindly
      // appending, or the creator's own screen briefly shows it twice.
      if (list.some((n) => n.id === mapped.id)) return prev;
      return { ...prev, [activeWorkspaceId]: [...list, mapped] };
    });
  };

  // Generates the id client-side and inserts without `.select()` — a
  // board-type node's row-return would otherwise trigger nodes_select's
  // can_access_board(id) check against a row that isn't visible to that
  // self-lookup yet (the INSERT ... RETURNING clause is itself governed
  // by the table's SELECT policies). Folders don't hit this (their
  // policies short-circuit on type='folder'), only boards do.
  const createBoard = async (name, parentFolderId = null) => {
    const trimmed = (name || "").trim();
    if (!trimmed) return;
    const position = allNodes.filter((n) => n.parentId === parentFolderId).length;
    const newId = crypto.randomUUID();
    const { error: nodeError } = await supabase
      .from("nodes")
      .insert({ id: newId, workspace_id: activeWorkspaceId, type: "board", name: trimmed, parent_id: parentFolderId, position, created_by: user.id });
    if (nodeError) {
      console.error("Error creating board:", nodeError);
      return;
    }
    const { error: boardError } = await supabase.from("boards").insert({ id: newId, title: trimmed });
    if (boardError) {
      console.error("Error seeding board settings:", boardError);
    }
    const mapped = mapNode({
      id: newId,
      workspace_id: activeWorkspaceId,
      type: "board",
      name: trimmed,
      parent_id: parentFolderId,
      position,
      collapsed: false,
      created_by: user.id,
    });
    setAllNodesByWorkspace((prev) => {
      const list = prev[activeWorkspaceId] || [];
      if (list.some((n) => n.id === mapped.id)) return prev;
      return { ...prev, [activeWorkspaceId]: [...list, mapped] };
    });
    updatePrefs({ activeBoardId: mapped.id });
  };

  const renameNode = async (id, name) => {
    const trimmed = (name || "").trim();
    if (!trimmed) return;
    const node = allNodes.find((n) => n.id === id);
    setAllNodesByWorkspace((prev) => ({
      ...prev,
      [activeWorkspaceId]: (prev[activeWorkspaceId] || []).map((n) => (n.id === id ? { ...n, name: trimmed } : n)),
    }));
    const { error } = await supabase.from("nodes").update({ name: trimmed }).eq("id", id);
    if (error) console.error("Error renaming node:", error);
    // Board name and the sidebar label are the same name, editable from
    // either place — keep boards.title (what Header.jsx displays) in
    // sync so they never silently diverge again.
    if (node?.type === "board") {
      const { error: titleError } = await supabase.from("boards").update({ title: trimmed }).eq("id", id);
      if (titleError) console.error("Error syncing board title:", titleError);
    }
  };

  // Drag-reorder: only takes effect when both nodes share the same parent.
  // Persists by renumbering every sibling's `position` to match the new
  // local order (small sibling counts, cheap to renumber in full).
  const reorderNode = async (draggedId, targetId) => {
    if (draggedId === targetId) return;
    const dragged = allNodes.find((n) => n.id === draggedId);
    const target = allNodes.find((n) => n.id === targetId);
    if (!dragged || !target || dragged.parentId !== target.parentId) return;

    const withoutDragged = allNodes.filter((n) => n.id !== draggedId);
    const targetIndex = withoutDragged.findIndex((n) => n.id === targetId);
    if (targetIndex === -1) return;
    const reordered = [...withoutDragged.slice(0, targetIndex), dragged, ...withoutDragged.slice(targetIndex)];

    setAllNodesByWorkspace((prev) => ({ ...prev, [activeWorkspaceId]: reordered }));

    const siblings = reordered.filter((n) => n.parentId === dragged.parentId);
    await Promise.all(
      siblings.map((n, i) => supabase.from("nodes").update({ position: i }).eq("id", n.id))
    );
  };

  // Drag a board into a folder (folderId) or back out to the top level
  // (folderId = null) — reorderNode above only ever reorders *within* the
  // same parent, this is the "actually change the parent" move. Board-only
  // for now (no folder-into-folder dragging, to sidestep the nesting-depth/
  // cycle bookkeeping that would need).
  const moveBoardToFolder = async (boardId, folderId) => {
    const node = allNodes.find((n) => n.id === boardId);
    if (!node || node.type !== "board") return;
    if (node.parentId === folderId) return;
    if (folderId) {
      const folder = allNodes.find((n) => n.id === folderId);
      if (!folder || folder.type !== "folder") return;
    }
    const position = allNodes.filter((n) => n.parentId === folderId && n.id !== boardId).length;

    setAllNodesByWorkspace((prev) => ({
      ...prev,
      [activeWorkspaceId]: (prev[activeWorkspaceId] || []).map((n) =>
        n.id === boardId ? { ...n, parentId: folderId, position } : n
      ),
    }));
    const { error } = await supabase.from("nodes").update({ parent_id: folderId, position }).eq("id", boardId);
    if (error) console.error("Error moving board into folder:", error);
  };

  // Folders still hard-delete (guarded to only ever fire on an empty
  // folder, so there's nothing meaningful to recover). Boards go to Trash
  // instead — same soft-hide idea as archive, just with a 15-day countdown
  // before permanentlyDeleteBoard actually removes the row.
  const deleteNode = async (id) => {
    const node = allNodes.find((n) => n.id === id);
    if (!node) return;

    if (node.type === "board") {
      await trashBoard(id);
      return;
    }

    const hasChildren = allNodes.some((n) => n.parentId === id);
    if (hasChildren) {
      alert(t("boardsContext.folderNotEmpty"));
      return;
    }

    setAllNodesByWorkspace((prev) => ({
      ...prev,
      [activeWorkspaceId]: (prev[activeWorkspaceId] || []).filter((n) => n.id !== id),
    }));
    setFavoriteBoardIds((prev) => prev.filter((f) => f !== id));
    setFavoriteBoardsMeta((prev) => prev.filter((f) => f.id !== id));

    const { error } = await supabase.from("nodes").delete().eq("id", id);
    if (error) console.error("Error deleting node:", error);
  };

  const trashBoard = async (id) => {
    const node = allNodes.find((n) => n.id === id);
    if (!node || node.type !== "board") return;
    const deletedAt = new Date().toISOString();
    setAllNodesByWorkspace((prev) => ({
      ...prev,
      [activeWorkspaceId]: (prev[activeWorkspaceId] || []).map((n) => (n.id === id ? { ...n, deletedAt } : n)),
    }));
    if (activeBoardId === id) {
      const remaining = allNodes.filter((n) => n.id !== id && n.type === "board" && !n.archivedAt && !n.deletedAt);
      updatePrefs({ activeBoardId: remaining[0]?.id ?? null });
    }
    setFavoriteBoardIds((prev) => prev.filter((f) => f !== id));
    setFavoriteBoardsMeta((prev) => prev.filter((f) => f.id !== id));
    const { error } = await supabase.from("nodes").update({ deleted_at: deletedAt }).eq("id", id);
    if (error) console.error("Error trashing board:", error);
  };

  const restoreBoardFromTrash = async (id) => {
    setAllNodesByWorkspace((prev) => ({
      ...prev,
      [activeWorkspaceId]: (prev[activeWorkspaceId] || []).map((n) => (n.id === id ? { ...n, deletedAt: null } : n)),
    }));
    const { error } = await supabase.from("nodes").update({ deleted_at: null }).eq("id", id);
    if (error) console.error("Error restoring board from trash:", error);
  };

  // Real, permanent removal — used both for a manual "delete forever" and
  // for auto-purging anything past the 15-day trash window (no server
  // cron in this setup, so the purge happens lazily whenever the Trash
  // view is opened instead).
  const permanentlyDeleteBoard = async (id) => {
    setAllNodesByWorkspace((prev) => ({
      ...prev,
      [activeWorkspaceId]: (prev[activeWorkspaceId] || []).filter((n) => n.id !== id),
    }));
    const { error } = await supabase.from("nodes").delete().eq("id", id);
    if (error) console.error("Error permanently deleting board:", error);
  };

  // Archive/Restore — a board-only soft-hide, distinct from delete: the
  // board and everything in it stays fully intact, just filtered out of
  // the normal sidebar tree until restored. Same permission level as
  // rename/delete today (no extra ownership gate).
  const archiveBoard = async (id) => {
    const node = allNodes.find((n) => n.id === id);
    if (!node || node.type !== "board") return;
    const archivedAt = new Date().toISOString();
    setAllNodesByWorkspace((prev) => ({
      ...prev,
      [activeWorkspaceId]: (prev[activeWorkspaceId] || []).map((n) => (n.id === id ? { ...n, archivedAt } : n)),
    }));
    if (activeBoardId === id) {
      const remaining = allNodes.filter((n) => n.id !== id && n.type === "board" && !n.archivedAt && !n.deletedAt);
      updatePrefs({ activeBoardId: remaining[0]?.id ?? null });
    }
    const { error } = await supabase.from("nodes").update({ archived_at: archivedAt }).eq("id", id);
    if (error) console.error("Error archiving board:", error);
  };

  const restoreBoard = async (id) => {
    setAllNodesByWorkspace((prev) => ({
      ...prev,
      [activeWorkspaceId]: (prev[activeWorkspaceId] || []).map((n) => (n.id === id ? { ...n, archivedAt: null } : n)),
    }));
    const { error } = await supabase.from("nodes").update({ archived_at: null }).eq("id", id);
    if (error) console.error("Error restoring board:", error);
  };

  const toggleFolderCollapsed = async (id) => {
    const node = allNodes.find((n) => n.id === id);
    if (!node) return;
    const collapsed = !node.collapsed;
    setAllNodesByWorkspace((prev) => ({
      ...prev,
      [activeWorkspaceId]: (prev[activeWorkspaceId] || []).map((n) => (n.id === id ? { ...n, collapsed } : n)),
    }));
    await supabase.from("nodes").update({ collapsed }).eq("id", id);
  };

  // ------------------------------------------------------------
  // Workspaces
  // ------------------------------------------------------------
  const switchWorkspace = async (id) => {
    if (id === activeWorkspaceId) return;
    if (!workspaces.some((w) => w.id === id)) return;
    await activateWorkspace(id);
  };

  const createWorkspace = async (name) => {
    const trimmed = (name || "").trim();
    if (!trimmed) return;
    const { data: id, error } = await supabase.rpc("create_workspace", { _name: trimmed });
    if (error) {
      console.error("Error creating workspace:", error);
      return;
    }
    setWorkspaces((prev) => [...prev, { id, name: trimmed, role: "owner" }]);
    setAllNodesByWorkspace((prev) => ({ ...prev, [id]: [] }));
    updatePrefs({
      activeWorkspaceId: id,
      activeBoardId: null,
      recentWorkspaceIds: [id, ...recentWorkspaceIds.filter((w) => w !== id)].slice(0, MAX_RECENT_WORKSPACES),
    });
  };

  const renameWorkspace = async (id, name) => {
    const trimmed = (name || "").trim();
    if (!trimmed) return;
    setWorkspaces((prev) => prev.map((w) => (w.id === id ? { ...w, name: trimmed } : w)));
    const { error } = await supabase.from("workspaces").update({ name: trimmed }).eq("id", id);
    if (error) console.error("Error renaming workspace:", error);
  };

  const deleteWorkspace = async (id) => {
    if (workspaces.length <= 1) {
      alert(t("boardsContext.needAtLeastOneWorkspace"));
      return;
    }
    const target = workspaces.find((w) => w.id === id);
    if (!target) return;
    if (!confirm(t("boardsContext.deleteWorkspaceConfirm", { name: target.name }))) return;

    // Leaving membership is enough — RLS means only members can see/act on
    // a workspace; if you're the sole owner this just orphans it for
    // everyone (acceptable for v1, matches "no admin console" scope).
    const { error } = await supabase.from("workspace_members").delete().eq("workspace_id", id).eq("user_id", user.id);
    if (error) {
      console.error("Error leaving workspace:", error);
      return;
    }

    const remainingWorkspaces = workspaces.filter((w) => w.id !== id);
    const remainingRecent = recentWorkspaceIds.filter((w) => w !== id);
    const remainingFavorites = favoriteBoardsMeta.filter((f) => f.workspaceId !== id);

    setWorkspaces(remainingWorkspaces);
    setFavoriteBoardIds(remainingFavorites.map((f) => f.id));
    setFavoriteBoardsMeta(remainingFavorites);
    setAllNodesByWorkspace((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    if (activeWorkspaceId === id) {
      const nextActiveWorkspaceId = remainingRecent[0] || remainingWorkspaces[0].id;
      await activateWorkspace(nextActiveWorkspaceId);
    } else if (remainingRecent.length !== recentWorkspaceIds.length) {
      updatePrefs({ recentWorkspaceIds: remainingRecent.length ? remainingRecent : [activeWorkspaceId] });
    }
  };

  // Actually destroys the workspace row (owner-only) — cascades via FK to
  // every node/board/group/item/etc underneath it for every member, with
  // no trash/recovery. Distinct from deleteWorkspace() above, which only
  // removes the *caller's own* membership ("leave"). Requires typing the
  // workspace's exact name as a stronger confirmation than a plain
  // confirm() dialog, given the blast radius.
  const deleteWorkspacePermanently = async (id) => {
    const target = workspaces.find((w) => w.id === id);
    if (!target) return;
    if (target.role !== "owner") {
      alert(t("boardsContext.onlyOwnerCanDeleteWorkspace"));
      return;
    }
    if (workspaces.length <= 1) {
      alert(t("boardsContext.needAtLeastOneWorkspace"));
      return;
    }
    const typed = prompt(t("boardsContext.deleteWorkspacePermanentlyPrompt", { name: target.name }));
    if (typed === null) return;
    if (typed !== target.name) {
      alert(t("boardsContext.deleteWorkspaceNameMismatch"));
      return;
    }

    const { error } = await supabase.from("workspaces").delete().eq("id", id);
    if (error) {
      console.error("Error deleting workspace:", error);
      alert(t("boardsContext.deleteWorkspaceFailed"));
      return;
    }

    const remainingWorkspaces = workspaces.filter((w) => w.id !== id);
    const remainingRecent = recentWorkspaceIds.filter((w) => w !== id);
    const remainingFavorites = favoriteBoardsMeta.filter((f) => f.workspaceId !== id);

    setWorkspaces(remainingWorkspaces);
    setFavoriteBoardIds(remainingFavorites.map((f) => f.id));
    setFavoriteBoardsMeta(remainingFavorites);
    setAllNodesByWorkspace((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    if (activeWorkspaceId === id) {
      const nextActiveWorkspaceId = remainingRecent[0] || remainingWorkspaces[0]?.id;
      if (nextActiveWorkspaceId) await activateWorkspace(nextActiveWorkspaceId);
    } else if (remainingRecent.length !== recentWorkspaceIds.length) {
      updatePrefs({ recentWorkspaceIds: remainingRecent.length ? remainingRecent : [activeWorkspaceId] });
    }
  };

  // ------------------------------------------------------------
  // Sharing: join-code invites
  // ------------------------------------------------------------
  const createInviteCode = async () => {
    if (!activeWorkspaceId) return null;
    const code = randomInviteCode();
    const { error } = await supabase
      .from("workspace_invites")
      .insert({ workspace_id: activeWorkspaceId, code, created_by: user.id });
    if (error) {
      console.error("Error creating invite:", error);
      alert(t("boardsContext.inviteCreateFailed"));
      return null;
    }
    return code;
  };

  const joinWorkspaceByCode = async (code) => {
    const trimmed = (code || "").trim();
    if (!trimmed) return;
    const { data: workspaceId, error } = await supabase.rpc("redeem_workspace_invite", { _code: trimmed });
    if (error) {
      alert(t("boardsContext.inviteRedeemFailed"));
      return;
    }
    const { data: wsRow } = await supabase.from("workspaces").select("id, name").eq("id", workspaceId).single();
    if (wsRow) {
      setWorkspaces((prev) => (prev.some((w) => w.id === wsRow.id) ? prev : [...prev, { id: wsRow.id, name: wsRow.name, role: "member" }]));
    }
    // Call activateWorkspace directly rather than switchWorkspace() — the
    // latter validates against the `workspaces` state we just updated
    // above, but that update hasn't landed yet in this closure (state
    // updates aren't synchronous), so the validation would incorrectly
    // reject the workspace we just joined.
    await activateWorkspace(workspaceId);
  };

  // Someone opened a shared invite link (?join=<code>) — redeem it once on
  // boot, then strip the param so a refresh doesn't re-prompt. No router in
  // this app, so a plain query-param read is the whole mechanism.
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("join");
    if (!code) return;
    const url = new URL(window.location.href);
    url.searchParams.delete("join");
    window.history.replaceState({}, "", url.toString());
    if (confirm(t("boardsContext.confirmJoinFromLink", { code }))) {
      joinWorkspaceByCode(code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ------------------------------------------------------------
  // Member management (Phase 5.5) — fetched on demand (when a members/
  // access modal opens) rather than kept as live context state, since
  // membership changes are infrequent and every consumer here already
  // owns its own local list + loading state.
  // ------------------------------------------------------------
  const fetchWorkspaceMembers = async () => {
    if (!activeWorkspaceId) return [];
    const { data, error } = await supabase
      .from("workspace_members")
      .select("user_id, role, profiles(id, email, display_name, avatar_url, job_title, phone, hobby, zoom_link)")
      .eq("workspace_id", activeWorkspaceId);
    if (error) {
      console.error("Error loading workspace members:", error);
      return [];
    }
    return (data || [])
      .filter((r) => r.profiles)
      .map((r) => ({
        userId: r.user_id,
        role: r.role,
        email: r.profiles.email,
        displayName: r.profiles.display_name,
        avatarUrl: r.profiles.avatar_url,
        jobTitle: r.profiles.job_title,
        phone: r.profiles.phone,
        hobby: r.profiles.hobby,
        zoomLink: r.profiles.zoom_link,
      }));
  };

  // Per-member "which boards" for the directory — one query for the whole
  // workspace rather than N+1 (one per member row). Members with no entry
  // here have the default/unrestricted access (every board in the
  // workspace) — board_members only ever holds rows for boards explicitly
  // restricted (see fetchBoardAccess above).
  const fetchWorkspaceBoardAccessMap = async () => {
    if (!activeWorkspaceId) return {};
    const { data, error } = await supabase
      .from("board_members")
      .select("user_id, board_id, nodes!inner(name, workspace_id)")
      .eq("nodes.workspace_id", activeWorkspaceId);
    if (error) {
      console.error("Error loading workspace board access map:", error);
      return {};
    }
    const map = {};
    (data || []).forEach((row) => {
      if (!map[row.user_id]) map[row.user_id] = [];
      map[row.user_id].push({ boardId: row.board_id, boardName: row.nodes?.name });
    });
    return map;
  };

  // Owner-only (enforced by the RPC itself, not just the UI). Removing a
  // member deletes their workspace_members row (and any board_members
  // rows they had in this workspace) — RLS then blocks their next request
  // for anything here. Their existing Auth session stays logged in; only
  // access to this workspace's data is cut.
  const removeMember = async (userId) => {
    if (!activeWorkspaceId) return { error: "no active workspace" };
    const { error } = await supabase.rpc("remove_workspace_member", {
      _workspace_id: activeWorkspaceId,
      _user_id: userId,
    });
    if (error) console.error("Error removing member:", error);
    return { error };
  };

  // Owner-only (enforced by the RPC itself), same pattern as removeMember.
  const updateMemberRole = async (userId, role) => {
    if (!activeWorkspaceId) return { error: "no active workspace" };
    const { error } = await supabase.rpc("set_member_role", {
      _workspace_id: activeWorkspaceId,
      _user_id: userId,
      _role: role,
    });
    if (error) console.error("Error updating member role:", error);
    return { error };
  };

  // `restricted` is an explicit flag (boards.access_restricted), not
  // inferred from whether board_members has rows — an empty allowlist is
  // ambiguous between "never restricted" and "restricted to owner only,
  // zero other members granted", which surfaced as a real bug (unchecking
  // the sole non-owner member silently reverted to unrestricted instead
  // of locking them out).
  const fetchBoardAccess = async (boardId) => {
    const [{ data: boardRow, error: boardError }, { data: memberRows, error: memberError }] = await Promise.all([
      supabase.from("boards").select("access_restricted").eq("id", boardId).single(),
      supabase.from("board_members").select("user_id").eq("board_id", boardId),
    ]);
    if (boardError) console.error("Error loading board access flag:", boardError);
    if (memberError) console.error("Error loading board access list:", memberError);
    return {
      restricted: boardRow?.access_restricted ?? false,
      memberIds: (memberRows || []).map((r) => r.user_id),
    };
  };

  // Replaces the board's allowlist wholesale with `userIds` and sets the
  // explicit restriction flag. Simple delete-then-insert rather than
  // diffing — board member lists are small, and this only runs on an
  // explicit "Save" click, not per-checkbox-toggle.
  const setBoardAccess = async (boardId, userIds, restricted) => {
    const { error: flagError } = await supabase.rpc("set_board_access_restricted", {
      _board_id: boardId,
      _restricted: restricted,
    });
    if (flagError) {
      console.error("Error setting board access flag:", flagError);
      return { error: flagError };
    }
    const { error: delError } = await supabase.from("board_members").delete().eq("board_id", boardId);
    if (delError) {
      console.error("Error clearing board access list:", delError);
      return { error: delError };
    }
    if (userIds.length > 0) {
      const { error: insError } = await supabase
        .from("board_members")
        .insert(userIds.map((userId) => ({ board_id: boardId, user_id: userId })));
      if (insError) {
        console.error("Error setting board access list:", insError);
        return { error: insError };
      }
    }
    return { error: null };
  };

  const recentWorkspaces = recentWorkspaceIds.map((id) => workspaces.find((w) => w.id === id)).filter(Boolean);

  return (
    <BoardsContext.Provider
      value={{
        loading,
        nodes,
        allNodes,
        archivedBoards,
        archiveBoard,
        restoreBoard,
        trashedBoards,
        trashBoard,
        restoreBoardFromTrash,
        permanentlyDeleteBoard,
        activeBoardId,
        switchBoard,
        goToBoard,
        pendingBoardAction,
        requestBoardNavigation,
        clearPendingBoardAction,
        itemPickRequest,
        setItemPickRequest,
        createFolder,
        createBoard,
        renameNode,
        reorderNode,
        moveBoardToFolder,
        deleteNode,
        toggleFolderCollapsed,
        workspaces,
        activeWorkspaceId,
        isActiveWorkspaceOwner,
        activeRole: activeMembership?.role,
        recentWorkspaces,
        switchWorkspace,
        createWorkspace,
        renameWorkspace,
        deleteWorkspace,
        deleteWorkspacePermanently,
        favoriteBoardIds,
        favoriteBoards: favoriteBoardsMeta,
        toggleFavorite,
        createInviteCode,
        joinWorkspaceByCode,
        fetchWorkspaceMembers,
        fetchWorkspaceBoardAccessMap,
        removeMember,
        updateMemberRole,
        fetchBoardAccess,
        setBoardAccess,
      }}
    >
      {children}
    </BoardsContext.Provider>
  );
}

export function useBoards() {
  const context = useContext(BoardsContext);
  if (!context) {
    throw new Error("useBoards must be used within a BoardsProvider");
  }
  return context;
}
