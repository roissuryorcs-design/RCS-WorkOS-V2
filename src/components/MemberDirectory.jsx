import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useBoards } from "../context/BoardsContext";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import Avatar from "./Avatar";

// Simple table: who's in this workspace (photo + name) and which boards
// each person can access. Full profile detail (job title/phone/hobby)
// lives in each person's own Settings, not repeated here — kept per user
// request to not over-detail this specific view.
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
    ? members.filter((m) => (m.displayName || m.email || "").toLowerCase().includes(query))
    : members;

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
          maxWidth: 480,
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
          <div style={{ overflowY: "auto", marginBottom: 16 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                  <th style={thStyle}>{t("membersModal.title")}</th>
                  <th style={thStyle}>{t("memberDirectory.boardsLabel")}</th>
                  <th style={{ ...thStyle, width: 1 }} />
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((m) => {
                  const access = boardAccessMap[m.userId];
                  const boardAccessLabel = access && access.length > 0
                    ? access.map((a) => a.boardName).filter(Boolean).join(", ")
                    : t("memberDirectory.allBoards");

                  return (
                    <tr key={m.userId} style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                          <Avatar url={m.avatarUrl} name={m.displayName || m.email} size={30} />
                          <span style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {m.displayName || m.email}
                            {m.userId === user.id ? ` (${t("membersModal.you")})` : ""}
                          </span>
                        </div>
                      </td>
                      <td style={{ ...tdStyle, fontSize: 12, color: "var(--text-secondary)" }}>{boardAccessLabel}</td>
                      <td style={tdStyle}>
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
                              whiteSpace: "nowrap",
                            }}
                          >
                            {t("membersModal.removeBtn")}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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

const thStyle = {
  textAlign: "left",
  padding: "6px 8px",
  fontSize: 10.5,
  fontWeight: 700,
  color: "var(--text-muted)",
  textTransform: "uppercase",
  letterSpacing: 0.3,
};
const tdStyle = {
  padding: "8px",
  verticalAlign: "middle",
};
