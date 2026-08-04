import { useState, useRef } from "react";
import { useProfile } from "../context/ProfileContext";
import { useAuth } from "../context/AuthContext";
import { useBoards } from "../context/BoardsContext";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import Avatar from "./Avatar";
import Popover from "./Popover";
import SettingsModal from "./SettingsModal";
import LanguageSwitcher from "./LanguageSwitcher";
import MemberDirectory from "./MemberDirectory";
import { InviteCodeModal } from "./WorkspaceSwitcher";

// Top-right account entry point — consolidates what used to be split
// across the sidebar footer (email + sign-out button, Settings button)
// and the workspace switcher's overflowing 5-button footer (Invite/Manage
// members) into one avatar-triggered menu, matching the top-right
// account-menu pattern most collaborative apps (including monday.com) use.
export default function AccountMenu() {
  const { t } = useLanguage();
  const { profile } = useProfile();
  const { user, signOut } = useAuth();
  const { isActiveWorkspaceOwner, createInviteCode } = useBoards();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMemberDirectory, setShowMemberDirectory] = useState(false);
  const [inviteCodeToShow, setInviteCodeToShow] = useState(null);
  const btnRef = useRef(null);

  const handleInvite = async () => {
    setIsOpen(false);
    const code = await createInviteCode();
    if (code) setInviteCodeToShow(code);
  };

  const name = profile?.display_name || user?.email || "";
  const email = profile?.email || user?.email || "";

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          borderRadius: "50%",
          lineHeight: 0,
          flexShrink: 0,
        }}
        aria-label={t("sidebar.settingsBtn")}
      >
        <Avatar
          url={profile?.avatar_url}
          name={name}
          size={34}
          style={{ border: "2px solid var(--btn-primary-bg)", boxSizing: "border-box" }}
        />
      </button>

      <Popover
        anchorRef={btnRef}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        placement="bottom-end"
        className="tree-node-popup"
        style={{ minWidth: 220 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 16px 10px" }}>
          <Avatar
            url={profile?.avatar_url}
            name={name}
            size={38}
            style={{ border: "2px solid var(--btn-primary-bg)", boxSizing: "border-box" }}
          />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {name}
            </div>
            <div style={{ fontSize: 11.5, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {email}
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setIsOpen(false);
            setShowSettings(true);
          }}
        >
          {t("sidebar.settingsBtn")}
        </button>

        {/* Moved here from the workspace switcher's footer — that popup
            was cramming 5 buttons into a 280px-wide box and visibly
            overflowing. Workspace-admin actions belong with the other
            account-level actions, not the switcher (whose job is just
            switching/creating/joining workspaces). */}
        <button
          onClick={() => {
            setIsOpen(false);
            setShowMemberDirectory(true);
          }}
        >
          {t("workspaceSwitcher.manageMembersBtn")}
        </button>
        {isActiveWorkspaceOwner && <button onClick={handleInvite}>{t("workspaceSwitcher.inviteBtn")}</button>}

        {/* Moved here from the board Toolbar — quick app-wide preferences
            belong in the account menu, not scattered across a per-board
            toolbar. */}
        <button onClick={toggleTheme}>
          {theme === "light" ? t("toolbar.darkMode") : t("toolbar.lightMode")}
        </button>
        <LanguageSwitcher variant="menuItem" />

        <button onClick={signOut}>{t("auth.signOut")}</button>
      </Popover>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showMemberDirectory && <MemberDirectory onClose={() => setShowMemberDirectory(false)} />}
      {inviteCodeToShow && <InviteCodeModal code={inviteCodeToShow} onClose={() => setInviteCodeToShow(null)} />}
    </>
  );
}
