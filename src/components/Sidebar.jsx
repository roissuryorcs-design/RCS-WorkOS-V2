import { useState } from "react";
import "../css/sidebar.css";
import Logo from "./Logo";
import { useBoards } from "../context/BoardsContext";
import { useLanguage } from "../context/LanguageContext";
import WorkspaceSwitcher from "./WorkspaceSwitcher";
import Popover from "./Popover";

export default function Sidebar() {
  const { t } = useLanguage();
  const {
    nodes,
    activeBoardId,
    switchBoard,
    goToBoard,
    createFolder,
    createBoard,
    renameNode,
    reorderNode,
    deleteNode,
    toggleFolderCollapsed,
    favoriteBoardIds,
    favoriteBoards,
    toggleFavorite,
  } = useBoards();

  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const closeMenu = () => {
    setOpenMenuId(null);
    setMenuAnchorEl(null);
  };
  const toggleMenu = (id, e) => {
    if (openMenuId === id) {
      closeMenu();
    } else {
      setOpenMenuId(id);
      setMenuAnchorEl(e.currentTarget);
    }
  };

  const [draggedId, setDraggedId] = useState(null);

  const topLevelNodes = nodes.filter((n) => !n.parentId);
  const childrenOf = (id) => nodes.filter((n) => n.parentId === id);

  // Drag-reorder is constrained to siblings under the same parent — dropping
  // onto a node with a different parent shows a "not allowed" cursor and is
  // a no-op (reorderNode itself also guards this, as a second line of defense).
  const handleDragStart = (e, node) => {
    e.stopPropagation();
    setDraggedId(node.id);
    e.dataTransfer.effectAllowed = "move";
    try {
      e.dataTransfer.setData("text/plain", node.id);
    } catch (err) {
      // ignore — some browsers restrict setData outside real drag events
    }
  };

  const handleDragOver = (e, node) => {
    if (!draggedId || draggedId === node.id) return;
    const dragged = nodes.find((n) => n.id === draggedId);
    if (!dragged || dragged.parentId !== node.parentId) {
      e.dataTransfer.dropEffect = "none";
      return;
    }
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e, node) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedId && draggedId !== node.id) {
      reorderNode(draggedId, node.id);
    }
    setDraggedId(null);
  };

  const handleDragEnd = () => setDraggedId(null);

  const handleRename = (node) => {
    const type = node.type === "folder" ? t("sidebar.nodeTypeFolder") : t("sidebar.nodeTypeBoard");
    const name = prompt(t("sidebar.renamePrompt", { type }), node.name);
    if (name && name.trim()) renameNode(node.id, name.trim());
    closeMenu();
  };

  const handleDelete = (node) => {
    const type = node.type === "folder" ? t("sidebar.nodeTypeFolder") : t("sidebar.nodeTypeBoard");
    if (confirm(t("sidebar.deleteConfirm", { type, name: node.name }))) {
      deleteNode(node.id);
    }
    closeMenu();
  };

  const handleAddBoard = (parentFolderId) => {
    const name = prompt(t("sidebar.newBoardNamePrompt"));
    if (name && name.trim()) createBoard(name.trim(), parentFolderId);
    closeMenu();
  };

  const handleAddFolder = (parentFolderId = null) => {
    const name = prompt(t("sidebar.newFolderNamePrompt"));
    if (name && name.trim()) createFolder(name.trim(), parentFolderId);
    closeMenu();
  };

  const renderBoard = (node) => (
    <div
      key={node.id}
      className={`tree-board-row${draggedId === node.id ? " dragging" : ""}`}
      draggable
      onDragStart={(e) => handleDragStart(e, node)}
      onDragOver={(e) => handleDragOver(e, node)}
      onDrop={(e) => handleDrop(e, node)}
      onDragEnd={handleDragEnd}
    >
      <div
        className={`tree-board-item${node.id === activeBoardId ? " active" : ""}`}
        onClick={() => switchBoard(node.id)}
      >
        <span className="tree-board-icon">📋</span>
        <span className="tree-node-label">{node.name}</span>
      </div>
      <button
        className="tree-node-menu-btn"
        onClick={(e) => {
          e.stopPropagation();
          toggleMenu(node.id, e);
        }}
      >
        ⋮
      </button>

      <Popover
        anchorRef={{ current: menuAnchorEl }}
        isOpen={openMenuId === node.id}
        onClose={closeMenu}
        placement="bottom-end"
        className="tree-node-popup"
      >
        <button onClick={() => { toggleFavorite(node.id); closeMenu(); }}>
          {favoriteBoardIds.includes(node.id) ? t("sidebar.removeFromFavorites") : t("sidebar.addToFavorites")}
        </button>
        <button onClick={() => handleRename(node)}>{t("sidebar.renameBoard")}</button>
        <button onClick={() => handleDelete(node)}>{t("sidebar.deleteBoard")}</button>
      </Popover>
    </div>
  );

  const renderFolder = (node) => {
    const children = childrenOf(node.id);
    const isTopLevelFolder = !node.parentId;

    return (
      <div key={node.id} className="tree-folder">
        <div
          className={`tree-folder-header${draggedId === node.id ? " dragging" : ""}`}
          draggable
          onDragStart={(e) => handleDragStart(e, node)}
          onDragOver={(e) => handleDragOver(e, node)}
          onDrop={(e) => handleDrop(e, node)}
          onDragEnd={handleDragEnd}
          onClick={() => toggleFolderCollapsed(node.id)}
        >
          <span className="tree-folder-chevron">{node.collapsed ? "▶" : "▼"}</span>
          <span className="tree-folder-icon">📁</span>
          <span className="tree-node-label">{node.name}</span>
          <button
            className="tree-node-menu-btn"
            onClick={(e) => {
              e.stopPropagation();
              toggleMenu(node.id, e);
            }}
          >
            ⋮
          </button>
        </div>

        <Popover
          anchorRef={{ current: menuAnchorEl }}
          isOpen={openMenuId === node.id}
          onClose={closeMenu}
          placement="bottom-end"
          className="tree-node-popup"
        >
          <button onClick={() => handleAddBoard(node.id)}>{t("sidebar.addBoard")}</button>
          {isTopLevelFolder && (
            <button onClick={() => handleAddFolder(node.id)}>{t("sidebar.addSubFolder")}</button>
          )}
          <button onClick={() => handleRename(node)}>{t("sidebar.renameFolder")}</button>
          <button onClick={() => handleDelete(node)}>{t("sidebar.deleteFolder")}</button>
        </Popover>

        {!node.collapsed && children.length > 0 && (
          <div className="tree-folder-children">
            {children.map((child) => (child.type === "folder" ? renderFolder(child) : renderBoard(child)))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <Logo width={150} />
      </div>

      <div className="nav-section">
        <div className="nav-item active">{t("sidebar.home")}</div>
        <div className="nav-item">{t("sidebar.myWork")}</div>
        <div className="nav-item">{t("sidebar.more")}</div>
      </div>

      <div className="sidebar-section">
        <div className="section-title">{t("sidebar.favoritesTitle")}</div>
        {favoriteBoards.length > 0 ? (
          favoriteBoards.map((board) => (
            <div key={board.id} className="favorite-item" onClick={() => goToBoard(board.id)}>
              <span className="favorite-star">⭐</span>
              <span className="tree-node-label">{board.name}</span>
            </div>
          ))
        ) : (
          <div className="favorites-empty-hint">{t("sidebar.favoritesEmptyHint")}</div>
        )}
      </div>

      <div className="sidebar-section">
        <div className="section-title">{t("sidebar.workspaceTitle")}</div>
        <WorkspaceSwitcher />
        {topLevelNodes.map((node) => (node.type === "folder" ? renderFolder(node) : renderBoard(node)))}
        <div className="tree-add-btn" onClick={() => handleAddBoard(null)}>{t("sidebar.addBoardBtn")}</div>
        <div className="tree-add-btn" onClick={() => handleAddFolder(null)}>{t("sidebar.addFolderBtn")}</div>
      </div>

      <div className="sidebar-section">
        <div className="section-title">{t("sidebar.moreTitle")}</div>
        <div className="nav-item">{t("sidebar.automate")}</div>
      </div>
    </div>
  );
}
