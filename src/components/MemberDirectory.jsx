import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useBoards } from "../context/BoardsContext";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import Avatar from "./Avatar";

// Richer successor to MembersModal — same remove-member action, but shows
// the full profile (photo/job title/phone/hobby) and per-board access
// instead of just name/email/role. Opened from the same "Manage Members"
// entry point in WorkspaceSwitcher's footer.
export default function MemberDirectory({ onClose }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { isActiveWorkspaceOwner, fetchWorkspaceMembers, fetchWorkspaceBoardAccessMap, removeMember } = useBoards();
  const [members, setMembers] = useState([]);
  const [boardAccessMap, setBoardAccessMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchWorkspaceMembers(), fetchWorkspaceBoardAccessMap()]).then(([memberList, accessMap]) => {
      if (cancelled) return;
      setMembers(memberList);
      setBoardAccessMap(accessMap);
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

  const query = search.trim().toLowerCase();
  const filteredMembers = query
    ? members.filter((m) => (m.displayName || "").toLowerCase().includes(query) || (m.jobTitle || "").toLowerCase().includes(query))
    : members;

  const rowLabelStyle = { fontSize: 10.5, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.3 };
  const rowValueStyle = { fontSize: 12.5, color: "var(--text-primary)" };

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
          padding: 24,
          maxWidth: 560,
          width: "92%",
          color: "var(--text-primary)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          border: "1px solid var(--border-color)",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginBottom: 14, fontSize: 16, fontWeight: 600 }}>{t("membersModal.title")}</h3>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("memberDirectory.searchPlaceholder")}
          style={{
            width: "100%",
            padding: "8px 10px",
            marginBottom: 14,
            borderRadius: 6,
            border: "1px solid var(--border-dark)",
            background: "var(--bg-input)",
            color: "var(--text-primary)",
            fontSize: 13,
            boxSizing: "border-box",
          }}
        />

        {loading ? (
          <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{t("membersModal.loading")}</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, overflowY: "auto", marginBottom: 16 }}>
            {filteredMembers.map((m) => {
              const access = boardAccessMap[m.userId];
              const boardAccessLabel = access && access.length > 0
                ? access.map((a) => a.boardName).filter(Boolean).join(", ")
                : t("memberDirectory.allBoards");

              return (
                <div
                  key={m.userId}
                  style={{
                    display: "flex",
                    gap: 12,
                    padding: "10px 12px",
                    borderRadius: 8,
                    background: "var(--bg-hover)",
                  }}
                >
                  <Avatar url={m.avatarUrl} name={m.displayName || m.email} size={44} style={{ marginTop: 2 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {m.displayName || m.email}
                        {m.userId === user.id ? ` (${t("membersModal.you")})` : ""}
                      </span>
                      {m.jobTitle && (
                        <span style={{ fontSize: 11.5, color: "var(--text-secondary)", flexShrink: 0 }}>· {m.jobTitle}</span>
                      )}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px", marginBottom: 6 }}>
                      <div>
                        <div style={rowLabelStyle}>{t("settingsModal.emailLabel")}</div>
                        <div style={{ ...rowValueStyle, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.email}</div>
                      </div>
                      {m.phone && (
                        <div>
                          <div style={rowLabelStyle}>{t("settingsModal.phoneLabel")}</div>
                          <div style={rowValueStyle}>{m.phone}</div>
                        </div>
                      )}
                      {m.hobby && (
                        <div>
                          <div style={rowLabelStyle}>{t("settingsModal.hobbyLabel")}</div>
                          <div style={rowValueStyle}>{m.hobby}</div>
                        </div>
                      )}
                      <div>
                        <div style={rowLabelStyle}>{t("memberDirectory.boardsLabel")}</div>
                        <div style={rowValueStyle}>{boardAccessLabel}</div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 10.5, color: "var(--text-muted)", textTransform: "capitalize" }}>{m.role}</span>
                      {isActiveWorkspaceOwner && m.userId !== user.id && (
                        <button
                          onClick={() => handleRemove(m)}
                          style={{
                            padding: "3px 10px",
                            background: "transparent",
                            color: "#ef4444",
                            border: "1px solid #ef4444",
                            borderRadius: 6,
                            cursor: "pointer",
                            fontSize: 11.5,
                          }}
                        >
                          {t("membersModal.removeBtn")}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredMembers.length === 0 && (
              <div style={{ fontSize: 13, color: "var(--text-secondary)", padding: "8px 4px" }}>
                {t("memberDirectory.noResults")}
              </div>
            )}
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
    </div>,
    document.body
  );
}
