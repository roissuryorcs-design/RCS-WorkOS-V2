import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../lib/supabaseClient";
import { useDM } from "../context/DMContext";
import { useBoards } from "../context/BoardsContext";
import { useLanguage } from "../context/LanguageContext";
import Avatar from "./Avatar";
import DirectMessagePanel from "./DirectMessagePanel";

// DM inbox opened from the header's 💬 icon — lists everyone you've
// exchanged messages with (DMContext only stores partner ids, so their
// profile info is fetched here the same way NotificationBell fetches
// actor profiles) plus a "+ New message" picker sourced from the workspace
// member list, for starting a first conversation with someone new. The
// per-row "Message" button in the Team panel (MemberDirectory) still opens
// the same DirectMessagePanel directly as a shortcut — this is just the
// dedicated, centralized entry point.
export default function ConversationsList({ onClose }) {
  const { t } = useLanguage();
  const { conversations } = useDM();
  const { fetchWorkspaceMembers } = useBoards();
  const [profilesById, setProfilesById] = useState({});
  const [members, setMembers] = useState([]);
  const [picking, setPicking] = useState(false);
  const [search, setSearch] = useState("");
  const [dmTarget, setDmTarget] = useState(null);

  useEffect(() => {
    const ids = conversations.map((c) => c.partnerId).filter((id) => !profilesById[id]);
    if (ids.length === 0) return;
    supabase
      .from("profiles")
      .select("id, display_name, email, avatar_url, zoom_link")
      .in("id", ids)
      .then(({ data, error }) => {
        if (error) {
          console.error("Error loading conversation partners:", error);
          return;
        }
        setProfilesById((prev) => {
          const next = { ...prev };
          for (const p of data || []) next[p.id] = p;
          return next;
        });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations]);

  useEffect(() => {
    if (!picking || members.length > 0) return;
    fetchWorkspaceMembers().then(setMembers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picking]);

  const relativeTime = (iso) => {
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return t("notifications.justNow");
    if (mins < 60) return t("notifications.minutesAgo", { count: mins });
    const hours = Math.floor(mins / 60);
    if (hours < 24) return t("notifications.hoursAgo", { count: hours });
    return t("notifications.daysAgo", { count: Math.floor(hours / 24) });
  };

  const openConversation = (partnerId) => {
    const p = profilesById[partnerId];
    setDmTarget({ userId: partnerId, displayName: p?.display_name || p?.email, avatarUrl: p?.avatar_url, zoomLink: p?.zoom_link });
  };

  const openWithMember = (m) => {
    setPicking(false);
    setDmTarget({ userId: m.userId, displayName: m.displayName || m.email, avatarUrl: m.avatarUrl, zoomLink: m.zoomLink });
  };

  const query = search.trim().toLowerCase();
  const existingPartnerIds = new Set(conversations.map((c) => c.partnerId));
  const pickableMembers = members
    .filter((m) => !existingPartnerIds.has(m.userId))
    .filter((m) => !query || (m.displayName || m.email || "").toLowerCase().includes(query));

  return createPortal(
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
          width: "92%",
          maxWidth: 420,
          height: "70vh",
          maxHeight: 560,
          color: "var(--text-primary)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          border: "1px solid var(--border-color)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid var(--border-color)" }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>
            {picking ? t("conversations.pickTitle") : t("conversations.title")}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {!picking && (
              <button
                onClick={() => setPicking(true)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12.5, color: "var(--btn-primary-bg)", fontWeight: 600 }}
              >
                {t("conversations.newMessageBtn")}
              </button>
            )}
            <button
              onClick={onClose}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "var(--text-secondary)", padding: 4 }}
            >
              ×
            </button>
          </div>
        </div>

        {picking ? (
          <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
            <div style={{ padding: "10px 14px" }}>
              <button
                onClick={() => setPicking(false)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--text-secondary)", padding: 0, marginBottom: 8 }}
              >
                {t("conversations.backBtn")}
              </button>
              <input
                type="text"
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("memberDirectory.searchPlaceholder")}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 6,
                  border: "1px solid var(--border-dark)",
                  background: "var(--bg-input)",
                  color: "var(--text-primary)",
                  fontSize: 13,
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ overflowY: "auto", flex: 1 }}>
              {pickableMembers.length === 0 && (
                <div style={{ padding: "12px 14px", fontSize: 12.5, color: "var(--text-muted)" }}>
                  {t("conversations.noMembersFound")}
                </div>
              )}
              {pickableMembers.map((m) => (
                <div
                  key={m.userId}
                  onClick={() => openWithMember(m)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 16px", cursor: "pointer" }}
                >
                  <Avatar url={m.avatarUrl} name={m.displayName || m.email} size={30} />
                  <span style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {m.displayName || m.email}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ overflowY: "auto", flex: 1 }}>
            {conversations.length === 0 && (
              <div style={{ padding: "24px 16px", fontSize: 12.5, color: "var(--text-muted)", textAlign: "center" }}>
                {t("conversations.empty")}
              </div>
            )}
            {conversations.map((c) => {
              const p = profilesById[c.partnerId];
              const name = p?.display_name || p?.email || "";
              return (
                <div
                  key={c.partnerId}
                  onClick={() => openConversation(c.partnerId)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 16px",
                    cursor: "pointer",
                    borderBottom: "1px solid var(--border-color)",
                    background: c.unreadCount > 0 ? "var(--bg-hover)" : "transparent",
                  }}
                >
                  <Avatar url={p?.avatar_url} name={name} size={34} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {name}
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>
                      {c.lastMessage.body}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                    <span style={{ fontSize: 10.5, color: "var(--text-muted)" }}>{relativeTime(c.lastMessage.created_at)}</span>
                    {c.unreadCount > 0 && (
                      <span
                        style={{
                          minWidth: 15,
                          height: 15,
                          padding: "0 3px",
                          borderRadius: 8,
                          background: "#ef4444",
                          color: "#fff",
                          fontSize: 9.5,
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          lineHeight: 1,
                        }}
                      >
                        {c.unreadCount > 9 ? "9+" : c.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {dmTarget && (
        <DirectMessagePanel
          partnerId={dmTarget.userId}
          partnerName={dmTarget.displayName}
          partnerAvatarUrl={dmTarget.avatarUrl}
          partnerZoomLink={dmTarget.zoomLink}
          onClose={() => setDmTarget(null)}
        />
      )}
    </div>,
    document.body
  );
}
