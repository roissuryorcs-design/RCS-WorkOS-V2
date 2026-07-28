import { createContext, useContext, useState, useEffect } from "react";
import { generateId, boardKey } from "../utils/boardStorage";

const BoardsContext = createContext();

const REGISTRY_KEY = "rcs-boards-registry";

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

// Bootstraps the registry the first time this runs (fresh install or
// migrating a pre-multi-board install), or returns the existing one
// unchanged. Must be safe to call twice under React StrictMode's
// lazy-initializer double-invocation, hence the synchronous re-read at
// the top rather than any "always write" logic.
function loadOrMigrateRegistry() {
  try {
    const saved = localStorage.getItem(REGISTRY_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (
        parsed &&
        Array.isArray(parsed.nodes) &&
        parsed.nodes.length > 0 &&
        parsed.nodes.some((n) => n.id === parsed.activeBoardId)
      ) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error loading boards registry:", e);
  }

  // No valid registry — migrate any existing single-board data (or start
  // fresh if there isn't any; both cases produce the same shape).
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
    version: 1,
    activeBoardId: boardId,
    nodes: [
      { id: engineeringId, type: "folder", name: "Engineering", parentId: null, collapsed: false },
      { id: boardId, type: "board", name: boardName, parentId: engineeringId },
      { id: commissioningId, type: "folder", name: "Commissioning", parentId: null, collapsed: false },
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

  const { nodes, activeBoardId } = state;

  const switchBoard = (id) => {
    if (!nodes.some((n) => n.id === id && n.type === "board")) return;
    setState((prev) => ({ ...prev, activeBoardId: id }));
  };

  const createFolder = (name, parentFolderId = null) => {
    const trimmed = (name || "").trim();
    if (!trimmed) return;
    if (parentFolderId) {
      const parent = nodes.find((n) => n.id === parentFolderId);
      if (!parent || parent.type !== "folder" || parent.parentId) {
        alert("Folders can only be nested one level deep.");
        return;
      }
    }
    const id = generateId("f");
    setState((prev) => ({
      ...prev,
      nodes: [...prev.nodes, { id, type: "folder", name: trimmed, parentId: parentFolderId, collapsed: false }],
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
      nodes: [...prev.nodes, { id, type: "board", name: trimmed, parentId: parentFolderId }],
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
    const node = nodes.find((n) => n.id === id);
    if (!node) return;

    if (node.type === "folder") {
      const hasChildren = nodes.some((n) => n.parentId === id);
      if (hasChildren) {
        alert("This folder isn't empty. Move or delete its boards first.");
        return;
      }
      setState((prev) => ({ ...prev, nodes: prev.nodes.filter((n) => n.id !== id) }));
      return;
    }

    // node.type === "board"
    const totalBoards = nodes.filter((n) => n.type === "board").length;
    if (totalBoards <= 1) {
      alert("You must have at least one board.");
      return;
    }

    LEGACY_KEYS.forEach((key) => {
      localStorage.removeItem(boardKey(key, id));
    });

    setState((prev) => {
      const remainingNodes = prev.nodes.filter((n) => n.id !== id);
      const nextActive =
        prev.activeBoardId === id
          ? remainingNodes.find((n) => n.type === "board")?.id ?? null
          : prev.activeBoardId;
      return { ...prev, nodes: remainingNodes, activeBoardId: nextActive };
    });
  };

  const toggleFolderCollapsed = (id) => {
    setState((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === id ? { ...n, collapsed: !n.collapsed } : n)),
    }));
  };

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
