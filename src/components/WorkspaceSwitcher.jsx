import { useState, useRef } from "react";
import { useBoards } from "../context/BoardsContext";
import { useLanguage } from "../context/LanguageContext";
import Popover from "./Popover";

const AVATAR_COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#ef4444", "#06b6d4", "#6366f1"];

function avatarColor(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function WorkspaceAvatar({ workspace, size = 22 }) {
  return (
    <span
      className="workspace-avatar"
      style={{ width: size, height: size, background: avatarColor(workspace.id), fontSize: size * 0.55 }}
    >
      {workspace.name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}

// A native alert() can't be selected/copied reliably across browsers — this
// gives the invite code its own small modal with a real Copy button instead.
function InviteCodeModal({ code, onClose }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API can fail (permissions, non-HTTPS) — the code is still
      // visible/selectable in the input as a fallback.
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--bg-modal)",
          borderRadius: 12,
          padding: 24,
          maxWidth: 380,
          width: "90%",
          color: "var(--text-primary)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          border: "1px solid var(--border-color)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginBottom: 8, fontSize: 16, fontWeight: 600 }}>{t("workspaceSwitcher.inviteCodeTitle")}</h3>
        <p style={{ fontSize: 12.5, color: "var(--text-secondary)", marginBottom: 14 }}>
          {t("workspaceSwitcher.inviteCodeHint")}
        </p>

        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input
            type="text"
            readOnly
            value={code}
            onFocus={(e) => e.target.select()}
            style={{
              flex: 1,
              padding: "10px 12px",
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: "0.05em",
              border: "1px solid var(--border-dark)",
              borderRadius: 6,
              background: "var(--bg-input)",
              color: "var(--text-primary)",
              textAlign: "center",
            }}
          />
          <button
            onClick={handleCopy}
            style={{
              padding: "0 16px",
              background: copied ? "#22c55e" : "var(--btn-primary-bg)",
              color: "var(--btn-primary-text)",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 500,
              fontSize: 13,
              whiteSpace: "nowrap",
            }}
          >
            {copied ? t("workspaceSwitcher.copied") : t("workspaceSwitcher.copyBtn")}
          </button>
        </div>

        <button
          onClick={onClose}
          style={{
            width: "100%",
            padding: "8px",
            background: "var(--bg-hover)",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            color: "var(--text-secondary)",
          }}
        >
          {t("common.close")}
        </button>
      </div>
    </div>
  );
}

export default function WorkspaceSwitcher() {
  const {
    workspaces,
    activeWorkspaceId,
    isActiveWorkspaceOwner,
    recentWorkspaces,
    switchWorkspace,
    createWorkspace,
    renameWorkspace,
    deleteWorkspace,
    createInviteCode,
    joinWorkspaceByCode,
  } = useBoards();
  const { t } = useLanguage();

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [itemMenuAnchorEl, setItemMenuAnchorEl] = useState(null);
  const [inviteCodeToShow, setInviteCodeToShow] = useState(null);
  const switcherBtnRef = useRef(null);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  const close = () => {
    setIsOpen(false);
    setSearch("");
    setOpenMenuId(null);
    setItemMenuAnchorEl(null);
  };

  const filteredWorkspaces = workspaces.filter((w) =>
    w.name.toLowerCase().includes(search.trim().toLowerCase())
  );
  const filteredRecent = recentWorkspaces.filter((w) =>
    w.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  const handleSwitch = (id) => {
    switchWorkspace(id);
    close();
  };

  const handleAddWorkspace = () => {
    const name = prompt(t("workspaceSwitcher.newWorkspacePrompt"));
    if (name && name.trim()) createWorkspace(name.trim());
    close();
  };

  const handleRename = (workspace) => {
    const name = prompt(t("workspaceSwitcher.renameWorkspacePrompt"), workspace.name);
    if (name && name.trim()) renameWorkspace(workspace.id, name.trim());
    setOpenMenuId(null);
  };

  const handleDelete = (workspace) => {
    deleteWorkspace(workspace.id);
    setOpenMenuId(null);
  };

  const handleInvite = async () => {
    const code = await createInviteCode();
    close();
    if (code) setInviteCodeToShow(code);
  };

  const handleJoin = () => {
    const code = prompt(t("workspaceSwitcher.joinWorkspacePrompt"));
    if (code && code.trim()) joinWorkspaceByCode(code.trim());
    close();
  };

  const renderWorkspaceItem = (workspace, sectionKey) => {
    const menuKey = `${sectionKey}:${workspace.id}`;
    return (
    <div
      key={menuKey}
      className={`workspace-item${workspace.id === activeWorkspaceId ? " active" : ""}`}
      onClick={() => handleSwitch(workspace.id)}
    >
      <WorkspaceAvatar workspace={workspace} />
      <span className="tree-node-label">{workspace.name}</span>
      <button
        className="tree-node-menu-btn"
        onClick={(e) => {
          e.stopPropagation();
          if (openMenuId === menuKey) {
            setOpenMenuId(null);
            setItemMenuAnchorEl(null);
          } else {
            setOpenMenuId(menuKey);
            setItemMenuAnchorEl(e.currentTarget);
          }
        }}
      >
        ⋮
      </button>

      <Popover
        anchorRef={{ current: itemMenuAnchorEl }}
        isOpen={openMenuId === menuKey}
        onClose={(e) => { e?.stopPropagation?.(); setOpenMenuId(null); setItemMenuAnchorEl(null); }}
        placement="bottom-end"
        className="tree-node-popup workspace-item-popup"
      >
        <button onClick={(e) => { e.stopPropagation(); handleRename(workspace); }}>{t("workspaceSwitcher.renameWorkspaceBtn")}</button>
        <button onClick={(e) => { e.stopPropagation(); handleDelete(workspace); }}>{t("workspaceSwitcher.deleteWorkspaceBtn")}</button>
      </Popover>
    </div>
    );
  };

  if (!activeWorkspace) return null;

  return (
    <div className="workspace-switcher">
      <button ref={switcherBtnRef} className="workspace-switcher-btn" onClick={() => setIsOpen((prev) => !prev)}>
        <WorkspaceAvatar workspace={activeWorkspace} />
        <span className="workspace-switcher-name">{activeWorkspace.name}</span>
        <span className="workspace-switcher-chevron">{isOpen ? "▲" : "▼"}</span>
      </button>

      <Popover anchorRef={switcherBtnRef} isOpen={isOpen} onClose={close} placement="bottom-start" className="workspace-switcher-popup">
        <input
          type="text"
          className="workspace-search-input"
          placeholder={t("workspaceSwitcher.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />

        {filteredRecent.length > 0 && (
          <>
            <div className="workspace-list-section-title">{t("workspaceSwitcher.recentWorkspaces")}</div>
            {filteredRecent.map((w) => renderWorkspaceItem(w, "recent"))}
          </>
        )}

        <div className="workspace-list-section-title">{t("workspaceSwitcher.myWorkspaces")}</div>
        {filteredWorkspaces.length > 0 ? (
          filteredWorkspaces.map((w) => renderWorkspaceItem(w, "my"))
        ) : (
          <div className="workspace-empty-search">{t("workspaceSwitcher.noWorkspacesFound")}</div>
        )}

        <div className="workspace-switcher-footer">
          <button className="workspace-footer-btn" onClick={handleAddWorkspace}>{t("workspaceSwitcher.addWorkspace")}</button>
          <button className="workspace-footer-btn" onClick={handleJoin}>{t("workspaceSwitcher.joinWorkspace")}</button>
          {isActiveWorkspaceOwner && (
            <button className="workspace-footer-btn" onClick={handleInvite}>{t("workspaceSwitcher.inviteBtn")}</button>
          )}
          <button className="workspace-footer-btn" onClick={() => setSearch("")}>{t("workspaceSwitcher.browseAll")}</button>
        </div>
      </Popover>

      {inviteCodeToShow && (
        <InviteCodeModal code={inviteCodeToShow} onClose={() => setInviteCodeToShow(null)} />
      )}
    </div>
  );
}
