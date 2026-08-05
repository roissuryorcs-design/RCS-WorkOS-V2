import { useLanguage } from "../context/LanguageContext";
import { useBoards } from "../context/BoardsContext";

// Main-panel landing page for a folder — clicking a folder in the sidebar
// used to only expand/collapse it there; this gives folders an actual
// destination of their own (list of the boards/sub-folders inside, same
// idea as monday.com's workspace/folder overview page), rather than
// folders being purely a sidebar organizing device with no page to land on.
export default function FolderOverview({ folderId }) {
  const { t } = useLanguage();
  const { nodes, switchBoard, viewFolder, createBoard, createFolder, activeRole } = useBoards();
  const canManageStructure = activeRole !== "member";

  const folder = nodes.find((n) => n.id === folderId);
  const children = nodes.filter((n) => n.parentId === folderId);

  if (!folder) return null;

  const handleAddBoard = () => {
    const name = prompt(t("sidebar.newBoardNamePrompt"));
    if (name && name.trim()) createBoard(name.trim(), folderId);
  };

  const handleAddFolder = () => {
    const name = prompt(t("sidebar.newFolderNamePrompt"));
    if (name && name.trim()) createFolder(name.trim(), folderId);
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "32px 40px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 12,
            background: "var(--btn-primary-bg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 26,
            flexShrink: 0,
          }}
        >
          📁
        </div>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>{folder.name}</h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "2px 0 0" }}>
            {t("folderOverview.itemCount", { count: children.length })}
          </p>
        </div>
      </div>

      {canManageStructure && (
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <button
            onClick={handleAddBoard}
            style={{ padding: "7px 14px", background: "var(--btn-primary-bg)", color: "var(--btn-primary-text)", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12.5, fontWeight: 600 }}
          >
            {t("sidebar.addBoardBtn")}
          </button>
          <button
            onClick={handleAddFolder}
            style={{ padding: "7px 14px", background: "var(--bg-hover)", color: "var(--text-primary)", border: "1px solid var(--border-dark)", borderRadius: 6, cursor: "pointer", fontSize: 12.5, fontWeight: 600 }}
          >
            {t("sidebar.addFolderBtn")}
          </button>
        </div>
      )}

      {children.length === 0 ? (
        <div style={{ fontSize: 13.5, color: "var(--text-muted)", padding: "20px 4px" }}>{t("folderOverview.empty")}</div>
      ) : (
        <div style={{ border: "1px solid var(--border-color)", borderRadius: 8, overflow: "hidden" }}>
          {children.map((child, i) => (
            <div
              key={child.id}
              onClick={() => (child.type === "folder" ? viewFolder(child.id) : switchBoard(child.id))}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 16px",
                cursor: "pointer",
                borderBottom: i === children.length - 1 ? "none" : "1px solid var(--border-color)",
                background: "var(--bg-secondary)",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-secondary)")}
            >
              <span style={{ fontSize: 17 }}>{child.type === "folder" ? "📁" : "📋"}</span>
              <span style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 500 }}>{child.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
