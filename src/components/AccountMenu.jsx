import { useState, useRef } from "react";
import { useProfile } from "../context/ProfileContext";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import Avatar from "./Avatar";
import Popover from "./Popover";
import SettingsModal from "./SettingsModal";

// Top-right account entry point — consolidates what used to be split
// across the sidebar footer (email + sign-out button, Settings button)
// into one avatar-triggered menu, matching the top-right account-menu
// pattern most collaborative apps (including monday.com) use instead of
// burying it in the sidebar.
export default function AccountMenu() {
  const { t } = useLanguage();
  const { profile } = useProfile();
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const btnRef = useRef(null);

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
        <Avatar url={profile?.avatar_url} name={name} size={34} />
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
          <Avatar url={profile?.avatar_url} name={name} size={38} />
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
        <button onClick={signOut}>{t("auth.signOut")}</button>
      </Popover>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  );
}
