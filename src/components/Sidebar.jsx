import "../css/sidebar.css";

export default function Sidebar({
  workspaces,
  activeWorkspaceId,
  activeBoardId,
  onSelectWorkspace,
  onSelectBoard,
  onAddWorkspace,
  onAddBoard,
}) {
  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

  return (
    <div className="sidebar">
      <h2 className="sidebar-title">📊 WorkOS</h2>

      <div className="sidebar-section">
        <p className="sidebar-section-title">WORKSPACES</p>
        {workspaces.map((ws) => (
          <div
            key={ws.id}
            className={`sidebar-item ${ws.id === activeWorkspaceId ? "active" : ""}`}
            onClick={() => onSelectWorkspace(ws.id)}
          >
            📁 {ws.name}
          </div>
        ))}
        <div className="sidebar-add-btn" onClick={onAddWorkspace}>
          + New Workspace
        </div>
      </div>

      {activeWorkspace && (
        <div className="sidebar-section">
          <p className="sidebar-section-title">BOARDS</p>
          {activeWorkspace.boards.map((board) => (
            <div
              key={board.id}
              className={`sidebar-board ${board.id === activeBoardId ? "active" : ""}`}
              onClick={() => onSelectBoard(board.id)}
            >
              📋 {board.name}
            </div>
          ))}
          <div className="sidebar-add-btn" onClick={() => onAddBoard(activeWorkspaceId)}>
            + New Board
          </div>
        </div>
      )}
    </div>
  );
}
