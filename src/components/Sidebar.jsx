import { useState } from "react";
import "../css/sidebar.css";
import Logo from "./Logo";
import { useBoards } from "../context/BoardsContext";

export default function Sidebar({ favorites, onAddFavorite, onRemoveFavorite }) {
  const {
    nodes,
    activeBoardId,
    switchBoard,
    createFolder,
    createBoard,
    renameNode,
    deleteNode,
    toggleFolderCollapsed,
  } = useBoards();

  const [openMenuId, setOpenMenuId] = useState(null);
  const closeMenu = () => setOpenMenuId(null);
  const toggleMenu = (id) => setOpenMenuId((prev) => (prev === id ? null : id));

  const topLevelNodes = nodes.filter((n) => !n.parentId);
  const childrenOf = (id) => nodes.filter((n) => n.parentId === id);

  const handleRename = (node) => {
    const name = prompt(`Rename ${node.type}:`, node.name);
    if (name && name.trim()) renameNode(node.id, name.trim());
    closeMenu();
  };

  const handleDelete = (node) => {
    const label = node.type === "folder" ? "folder" : "board";
    if (confirm(`Delete ${label} "${node.name}"?`)) {
      deleteNode(node.id);
    }
    closeMenu();
  };

  const handleAddBoard = (parentFolderId) => {
    const name = prompt("New board name:");
    if (name && name.trim()) createBoard(name.trim(), parentFolderId);
    closeMenu();
  };

  const handleAddFolder = (parentFolderId = null) => {
    const name = prompt("New folder name:");
    if (name && name.trim()) createFolder(name.trim(), parentFolderId);
    closeMenu();
  };

  const renderBoard = (node) => (
    <div key={node.id} className="tree-board-row">
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
          toggleMenu(node.id);
        }}
      >
        ⋮
      </button>

      {openMenuId === node.id && (
        <>
          <div className="tree-node-popup-overlay" onClick={closeMenu} />
          <div className="tree-node-popup">
            <button onClick={() => handleRename(node)}>✏️ Rename board</button>
            <button onClick={() => handleDelete(node)}>🗑️ Delete board</button>
          </div>
        </>
      )}
    </div>
  );

  const renderFolder = (node) => {
    const children = childrenOf(node.id);
    const isTopLevelFolder = !node.parentId;

    return (
      <div key={node.id} className="tree-folder">
        <div className="tree-folder-header" onClick={() => toggleFolderCollapsed(node.id)}>
          <span className="tree-folder-chevron">{node.collapsed ? "▶" : "▼"}</span>
          <span className="tree-folder-icon">📁</span>
          <span className="tree-node-label">{node.name}</span>
          <button
            className="tree-node-menu-btn"
            onClick={(e) => {
              e.stopPropagation();
              toggleMenu(node.id);
            }}
          >
            ⋮
          </button>
        </div>

        {openMenuId === node.id && (
          <>
            <div className="tree-node-popup-overlay" onClick={closeMenu} />
            <div className="tree-node-popup">
              <button onClick={() => handleAddBoard(node.id)}>➕ Add board</button>
              {isTopLevelFolder && (
                <button onClick={() => handleAddFolder(node.id)}>📁 Add sub-folder</button>
              )}
              <button onClick={() => handleRename(node)}>✏️ Rename folder</button>
              <button onClick={() => handleDelete(node)}>🗑️ Delete folder</button>
            </div>
          </>
        )}

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
        <div className="nav-item active">🏠 Home</div>
        <div className="nav-item">📋 My work</div>
        <div className="nav-item">➕ More</div>
        <div className="nav-item">🤖 monday AI</div>
      </div>

      <div className="sidebar-section">
        <div className="section-title">FAVORITES</div>
        {favorites.map((fav, idx) => (
          <div key={idx} className="favorite-item">
            <span>📁 {fav}</span>
            <button onClick={() => onRemoveFavorite(idx)} className="favorite-remove-btn">✕</button>
          </div>
        ))}
        <div onClick={onAddFavorite} className="add-favorite-btn">+ Add favorites</div>
      </div>

      <div className="sidebar-section">
        <div className="section-title">FOREL FPSO</div>
        {topLevelNodes.map((node) => (node.type === "folder" ? renderFolder(node) : renderBoard(node)))}
        <div className="tree-add-btn" onClick={() => handleAddBoard(null)}>+ Add board</div>
        <div className="tree-add-btn" onClick={() => handleAddFolder(null)}>+ Add folder</div>
      </div>

      <div className="sidebar-section">
        <div className="section-title">MORE</div>
        <div className="nav-item">Monday AI</div>
        <div className="nav-item">Automate</div>
      </div>
    </div>
  );
}
