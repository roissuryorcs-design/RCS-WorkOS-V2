import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNotifications } from "../context/NotificationContext";
import { useLanguage } from "../context/LanguageContext";
import Popover from "./Popover";
import Avatar from "./Avatar";
import DirectMessagePanel from "./DirectMessagePanel";

// Bell icon + unread badge, placed in Header.jsx's nav row. Dropdown lists
// recent notifications (mentions + DMs); clicking one marks it read and,
// for a DM notification, opens that conversation — mentions don't deep-link
// anywhere yet (would need board/comment routing that doesn't exist in
// this app), they just mark read.
export default function NotificationBell() {
  const { t } = useLanguage();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [actorsById, setActorsById] = useState({});
  const [dmTarget, setDmTarget] = useState(null);
  const btnRef = useRef(null);

  useEffect(() => {
    const missing = [...new Set(notifications.map((n) => n.actor_id))].filter((id) => id && !actorsById[id]);
    if (missing.length === 0) return;
    supabase
      .from("profiles")
      .select("id, display_name, email, avatar_url")
      .in("id", missing)
      .then(({ data, error }) => {
        if (error) {
          console.error("Error loading notification actors:", error);
          return;
        }
        setActorsById((prev) => {
          const next = { ...prev };
          for (const p of data || []) next[p.id] = p;
          return next;
        });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications]);

  const handleClickNotification = (n) => {
    markRead(n.id);
    if (n.type === "dm") {
      const actor = actorsById[n.actor_id];
      setDmTarget({ userId: n.actor_id, displayName: actor?.display_name || actor?.email, avatarUrl: actor?.avatar_url });
      setIsOpen(false);
    }
  };

  const relativeTime = (iso) => {
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return t("notifications.justNow");
    if (mins < 60) return t("notifications.minutesAgo", { count: mins });
    const hours = Math.floor(mins / 60);
    if (hours < 24) return t("notifications.hoursAgo", { count: hours });
    return t("notifications.daysAgo", { count: Math.floor(hours / 24) });
  };

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          position: "relative",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: 18,
          color: "var(--text-secondary)",
          padding: 6,
        }}
        aria-label={t("notifications.title")}
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: 0,
              right: 0,
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
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <Popover
        anchorRef={btnRef}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        placement="bottom-end"
        style={{
          background: "var(--bg-modal)",
          border: "1px solid var(--border-color)",
          borderRadius: 10,
          boxShadow: "0 12px 32px rgba(0,0,0,0.25)",
          width: 320,
          maxHeight: 420,
          display: "flex",
          flexDirection: "column",
          zIndex: 1200,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderBottom: "1px solid var(--border-color)" }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>{t("notifications.title")}</span>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11.5, color: "var(--btn-primary-bg)" }}
            >
              {t("notifications.markAllRead")}
            </button>
          )}
        </div>

        <div style={{ overflowY: "auto" }}>
          {notifications.length === 0 && (
            <div style={{ padding: "20px 14px", fontSize: 12.5, color: "var(--text-muted)", textAlign: "center" }}>
              {t("notifications.empty")}
            </div>
          )}
          {notifications.map((n) => {
            const actor = actorsById[n.actor_id];
            const actorName = actor?.display_name || actor?.email || "";
            return (
              <div
                key={n.id}
                onClick={() => handleClickNotification(n)}
                style={{
                  display: "flex",
                  gap: 10,
                  padding: "10px 14px",
                  cursor: "pointer",
                  background: n.read_at ? "transparent" : "var(--bg-hover)",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                <Avatar url={actor?.avatar_url} name={actorName} size={28} style={{ marginTop: 2 }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 12.5, color: "var(--text-primary)" }}>
                    <span style={{ fontWeight: 700 }}>{actorName}</span>{" "}
                    {n.type === "mention" ? t("notifications.mentionedYou") : t("notifications.sentMessage")}
                  </div>
                  {n.preview && (
                    <div style={{ fontSize: 11.5, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>
                      {n.preview}
                    </div>
                  )}
                  <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 3 }}>{relativeTime(n.created_at)}</div>
                </div>
                {!n.read_at && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#3b82f6", flexShrink: 0, marginTop: 6 }} />}
              </div>
            );
          })}
        </div>
      </Popover>

      {dmTarget && (
        <DirectMessagePanel
          partnerId={dmTarget.userId}
          partnerName={dmTarget.displayName}
          partnerAvatarUrl={dmTarget.avatarUrl}
          onClose={() => setDmTarget(null)}
        />
      )}
    </>
  );
}
