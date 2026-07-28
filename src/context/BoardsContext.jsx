import { createContext, useContext, useState, useEffect } from "react";
import { generateId, boardKey } from "../utils/boardStorage";

const BoardsContext = createContext();

const REGISTRY_KEY = "rcs-boards-registry";
const DEFAULT_WORKSPACE_NAME = "FOREL FPSO";
const MAX_RECENT_WORKSPACES = 5;

const LEGACY_KEYS = [
  "forelItems",
  "board-groups",
  "forelGroupColors",
  "forelStatuses",
  "forelColumns",
  "forelBoardTitle",
  "forelBoardSubtitle",
  "forelUpdates",
];

// Bootstraps the registry the first time this runs (fresh install, an old
// single-workspace v1 registry, or migrating a pre-multi-board install), or
// returns the existing v2 registry unchanged. Must be safe to call twice
// under React StrictMode's lazy-initializer double-invocation, hence the
// synchronous re-read at the top rather than any "always write" logic.
function loadOrMigrateRegistry() {
  try {
    const saved = localStorage.getItem(REGISTRY_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);

      // Already v2 — validate and repair any orphaned active ids.
      if (
        parsed &&
        parsed.version === 2 &&
        Array.isArray(parsed.workspaces) &&
        parsed.workspaces.length > 0 &&
        Array.isArray(parsed.nodes)
      ) {
        const activeWorkspaceId = parsed.workspaces.some((w) => w.id === parsed.activeWorkspaceId)
          ? parsed.activeWorkspaceId
          : parsed.workspaces[0].id;
        const boardsInWorkspace = parsed.nodes.filter(
          (n) => n.type === "board" && n.workspaceId === activeWorkspaceId
        );
        const activeBoardId = boardsInWorkspace.some((b) => b.id === parsed.activeBoardId)
          ? parsed.activeBoardId
          : boardsInWorkspace[0]?.id ?? null;
        const recentWorkspaceIds = Array.isArray(parsed.recentWorkspaceIds)
          ? parsed.recentWorkspaceIds.filter((id) => parsed.workspaces.some((w) => w.id === id))
          : [activeWorkspaceId];

        return { ...parsed, activeWorkspaceId, activeBoardId, recentWorkspaceIds };
      }

      // v1 (single implicit workspace) — wrap everything into one real workspace.
      if (parsed && parsed.version === 1 && Array.isArray(parsed.nodes) && parsed.nodes.length > 0) {
        const workspaceId = generateId("w");
        const registry = {
          version: 2,
          activeWorkspaceId: workspaceId,
          activeBoardId: parsed.activeBoardId ?? null,
          recentWorkspaceIds: [workspaceId],
          workspaces: [{ id: workspaceId, name: DEFAULT_WORKSPACE_NAME }],
          nodes: parsed.nodes.map((n) => ({ ...n, workspaceId })),
        };
        localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry));
        return registry;
      }
    }
  } catch (e) {
    console.error("Error loading boards registry:", e);
  }

  // No valid registry — migrate any existing single-board data (or start
  // fresh if there isn't any; both cases produce the same shape).
  const workspaceId = generateId("w");
  const boardId = generateId("b");
  const engineeringId = generateId("f");
  const commissioningId = generateId("f");

  const legacyTitle = localStorage.getItem("forelBoardTitle");
  const boardName = legacyTitle && legacyTitle.trim() ? legacyTitle.trim() : "Board 1";

  LEGACY_KEYS.forEach((key) => {
    const val = localStorage.getItem(key);
    if (val !== null) {
      localStorage.setItem(boardKey(key, boardId), val);
    }
  });

  const registry = {
    version: 2,
    activeWorkspaceId: workspaceId,
    activeBoardId: boardId,
    recentWorkspaceIds: [workspaceId],
    workspaces: [{ id: workspaceId, name: DEFAULT_WORKSPACE_NAME }],
    nodes: [
      { id: engineeringId, type: "folder", name: "Engineering", parentId: null, workspaceId, collapsed: false },
      { id: boardId, type: "board", name: boardName, parentId: engineeringId, workspaceId },
      { id: commissioningId, type: "folder", name: "Commissioning", parentId: null, workspaceId, collapsed: false },
    ],
  };

  try {
    localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry));
  } catch (e) {
    console.error("Error writing boards registry:", e);
  }

  return registry;
}

export function BoardsProvider({ children }) {
  const [state, setState] = useState(loadOrMigrateRegistry);

  useEffect(() => {
    try {
      localStorage.setItem(REGISTRY_KEY, JSON.stringify(state));
    } catch (e) {
      console.error("Error saving boards registry:", e);
    }
  }, [state]);

  const { nodes: allNodes, activeBoardId, workspaces, activeWorkspaceId, recentWorkspaceIds } = state;
  const nodes = allNodes.filter((n) => n.workspaceId === activeWorkspaceId);

  const switchBoard = (id) => {
    if (!allNodes.some((n) => n.id === id && n.type === "board" && n.workspaceId === activeWorkspaceId)) return;
    setState((prev) => ({ ...prev, activeBoardId: id }));
  };

  const createFolder = (name, parentFolderId = null) => {
    const trimmed = (name || "").trim();
    if (!trimmed) return;
    if (parentFolderId) {
      const parent = allNodes.find((n) => n.id === parentFolderId);
      if (!parent || parent.type !== "folder" || parent.parentId) {
        alert("Folders can only be nested one level deep.");
        return;
      }
    }
    const id = generateId("f");
    setState((prev) => ({
      ...prev,
      nodes: [
        ...prev.nodes,
        { id, type: "folder", name: trimmed, parentId: parentFolderId, workspaceId: prev.activeWorkspaceId, collapsed: false },
      ],
    }));
  };

  const createBoard = (name, parentFolderId = null) => {
    const trimmed = (name || "").trim();
    if (!trimmed) return;
    const id = generateId("b");
    try {
      localStorage.setItem(boardKey("forelBoardTitle", id), trimmed);
    } catch (e) {
      console.error("Error seeding new board title:", e);
    }
    setState((prev) => ({
      ...prev,
      activeBoardId: id,
      nodes: [
        ...prev.nodes,
        { id, type: "board", name: trimmed, parentId: parentFolderId, workspaceId: prev.activeWorkspaceId },
      ],
    }));
  };

  const renameNode = (id, name) => {
    const trimmed = (name || "").trim();
    if (!trimmed) return;
    setState((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === id ? { ...n, name: trimmed } : n)),
    }));
  };

  const deleteNode = (id) => {
    const node = allNodes.find((n) => n.id === id);
    if (!node) return;

    if (node.type === "folder") {
      const hasChildren = allNodes.some((n) => n.parentId === id);
      if (hasChildren) {
        alert("This folder isn't empty. Move or delete its boards first.");
        return;
      }
      setState((prev) => ({ ...prev, nodes: prev.nodes.filter((n) => n.id !== id) }));
      return;
    }

    // node.type === "board" — a workspace is allowed to end up with zero
    // boards (mirrors real Monday.com); the empty state lives in AppShellInner.
    LEGACY_KEYS.forEach((key) => {
      localStorage.removeItem(boardKey(key, id));
    });

    setState((prev) => {
      const remainingNodes = prev.nodes.filter((n) => n.id !== id);
      let nextActiveBoardId = prev.activeBoardId;
      if (prev.activeBoardId === id) {
        const remainingInWorkspace = remainingNodes.filter(
          (n) => n.type === "board" && n.workspaceId === prev.activeWorkspaceId
        );
        nextActiveBoardId = remainingInWorkspace[0]?.id ?? null;
      }
      return { ...prev, nodes: remainingNodes, activeBoardId: nextActiveBoardId };
    });
  };

  const toggleFolderCollapsed = (id) => {
    setState((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === id ? { ...n, collapsed: !n.collapsed } : n)),
    }));
  };

  // ============================================================
  // WORKSPACES
  // ============================================================
  const switchWorkspace = (id) => {
    if (id === activeWorkspaceId) return;
    if (!workspaces.some((w) => w.id === id)) return;
    setState((prev) => {
      const boardsInWorkspace = prev.nodes.filter((n) => n.type === "board" && n.workspaceId === id);
      return {
        ...prev,
        activeWorkspaceId: id,
        activeBoardId: boardsInWorkspace[0]?.id ?? null,
        recentWorkspaceIds: [id, ...prev.recentWorkspaceIds.filter((w) => w !== id)].slice(0, MAX_RECENT_WORKSPACES),
      };
    });
  };

  const createWorkspace = (name) => {
    const trimmed = (name || "").trim();
    if (!trimmed) return;
    const id = generateId("w");
    setState((prev) => ({
      ...prev,
      activeWorkspaceId: id,
      activeBoardId: null,
      workspaces: [...prev.workspaces, { id, name: trimmed }],
      recentWorkspaceIds: [id, ...prev.recentWorkspaceIds.filter((w) => w !== id)].slice(0, MAX_RECENT_WORKSPACES),
    }));
  };

  const renameWorkspace = (id, name) => {
    const trimmed = (name || "").trim();
    if (!trimmed) return;
    setState((prev) => ({
      ...prev,
      workspaces: prev.workspaces.map((w) => (w.id === id ? { ...w, name: trimmed } : w)),
    }));
  };

  const deleteWorkspace = (id) => {
    if (workspaces.length <= 1) {
      alert("You must have at least one workspace.");
      return;
    }
    const target = workspaces.find((w) => w.id === id);
    if (!target) return;
    if (!confirm(`Delete workspace "${target.name}" and everything inside it? This cannot be undone.`)) return;

    allNodes
      .filter((n) => n.workspaceId === id && n.type === "board")
      .forEach((b) => {
        LEGACY_KEYS.forEach((key) => localStorage.removeItem(boardKey(key, b.id)));
      });

    setState((prev) => {
      const remainingWorkspaces = prev.workspaces.filter((w) => w.id !== id);
      const remainingNodes = prev.nodes.filter((n) => n.workspaceId !== id);
      const remainingRecent = prev.recentWorkspaceIds.filter((w) => w !== id);

      let nextActiveWorkspaceId = prev.activeWorkspaceId;
      let nextActiveBoardId = prev.activeBoardId;
      if (prev.activeWorkspaceId === id) {
        nextActiveWorkspaceId = remainingRecent[0] || remainingWorkspaces[0].id;
        const boardsInNext = remainingNodes.filter(
          (n) => n.type === "board" && n.workspaceId === nextActiveWorkspaceId
        );
        nextActiveBoardId = boardsInNext[0]?.id ?? null;
      }

      return {
        ...prev,
        workspaces: remainingWorkspaces,
        nodes: remainingNodes,
        activeWorkspaceId: nextActiveWorkspaceId,
        activeBoardId: nextActiveBoardId,
        recentWorkspaceIds: remainingRecent.length ? remainingRecent : [nextActiveWorkspaceId],
      };
    });
  };

  const recentWorkspaces = recentWorkspaceIds
    .map((id) => workspaces.find((w) => w.id === id))
    .filter(Boolean);

  return (
    <BoardsContext.Provider
      value={{
        nodes,
        activeBoardId,
        switchBoard,
        createFolder,
        createBoard,
        renameNode,
        deleteNode,
        toggleFolderCollapsed,
        workspaces,
        activeWorkspaceId,
        recentWorkspaces,
        switchWorkspace,
        createWorkspace,
        renameWorkspace,
        deleteWorkspace,
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
