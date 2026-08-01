import { useState, useEffect } from "react";
import { useBoards } from "../context/BoardsContext";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

// Same overlay/box treatment as WorkspaceSwitcher's InviteCodeModal, kept
// as its own component since it's opened from the workspace footer, not
// nested inside the switcher popover.
export default function MembersModal({ onClose }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { isActiveWorkspaceOwner, fetchWorkspaceMembers, removeMember } = useBoards();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchWorkspaceMembers().then((list) => {
      if (cancelled) return;
      setMembers(list);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRemove = async (member) => {
    if (!confirm(t("membersModal.removeConfirm", { name: member.displayName || member.email }))) return;
    const { error } = await removeMember(member.userId);
    if (error) {
      alert(t("membersModal.removeFailed"));
      return;
    }
    setMembers((prev) => prev.filter((m) => m.userId !== member.userId));
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
          maxWidth: 420,
          width: "90%",
          color: "var(--text-primary)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          border: "1px solid var(--border-color)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginBottom: 14, fontSize: 16, fontWeight: 600 }}>{t("membersModal.title")}</h3>

        {loading ? (
          <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{t("membersModal.loading")}</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 340, overflowY: "auto", marginBottom: 16 }}>
            {members.map((m) => (
              <div
                key={m.userId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 10px",
                  borderRadius: 6,
                  background: "var(--bg-hover)",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {m.displayName || m.email}
                    {m.userId === user.id ? ` (${t("membersModal.you")})` : ""}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                    {m.email} · {m.role}
                  </span>
                </div>
                {isActiveWorkspaceOwner && m.userId !== user.id && (
                  <button
                    onClick={() => handleRemove(m)}
                    style={{
                      padding: "4px 10px",
                      background: "transparent",
                      color: "#ef4444",
                      border: "1px solid #ef4444",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontSize: 12,
                      flexShrink: 0,
                    }}
                  >
                    {t("membersModal.removeBtn")}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

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
