import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useBoards } from "../context/BoardsContext";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import Avatar from "./Avatar";
import Popover from "./Popover";

// Simple table: who's in this workspace (photo + name), which boards each
// person can access, and their role (owner/admin/member). Full profile
// detail (job title/phone/hobby) lives in each person's own Settings, not
// repeated here — kept deliberately simple per user request.
export default function MemberDirectory({ onClose }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { isActiveWorkspaceOwner, fetchWorkspaceMembers, fetchWorkspaceBoardAccessMap, removeMember, updateMemberRole } = useBoards();
  const [members, setMembers] = useState([]);
  const [boardAccessMap, setBoardAccessMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openMenuUserId, setOpenMenuUserId] = useState(null);
  const menuAnchorsRef = useRef({});

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
    setOpenMenuUserId(null);
    if (!confirm(t("membersModal.removeConfirm", { name: member.displayName || member.email }))) return;
    const { error } = await removeMember(member.userId);
    if (error) {
      alert(t("membersModal.removeFailed"));
      return;
    }
    setMembers((prev) => prev.filter((m) => m.userId !== member.userId));
  };

  const handleSetRole = async (member, role) => {
    setOpenMenuUserId(null);
    const { error } = await updateMemberRole(member.userId, role);
    if (error) {
      alert(t("memberDirectory.roleChangeFailed"));
      return;
    }
    setMembers((prev) => prev.map((m) => (m.userId === member.userId ? { ...m, role } : m)));
  };

  const query = search.trim().toLowerCase();
  const filteredMembers = query
    ? members.filter((m) => (m.displayName || m.email || "").toLowerCase().includes(query))
    : members;

  const roleLabel = (role) =>
    role === "owner" ? t("memberDirectory.roleOwner") : role === "admin" ? t("memberDirectory.roleAdmin") : t("memberDirectory.roleMember");

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
          maxWidth: 520,
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
                  <th style={thStyle}>{t("memberDirectory.roleLabel")}</th>
                  <th style={{ ...thStyle, width: 1 }} />
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((m) => {
                  const access = boardAccessMap[m.userId];
                  const boardAccessLabel = access && access.length > 0
                    ? access.map((a) => a.boardName).filter(Boolean).join(", ")
                    : t("memberDirectory.allBoards");
                  const isSelf = m.userId === user.id;

                  return (
                    <tr key={m.userId} style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                          <Avatar url={m.avatarUrl} name={m.displayName || m.email} size={30} />
                          <span style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {m.displayName || m.email}
                            {isSelf ? ` (${t("membersModal.you")})` : ""}
                          </span>
                        </div>
                      </td>
                      <td style={{ ...tdStyle, fontSize: 12, color: "var(--text-secondary)" }}>{boardAccessLabel}</td>
                      <td style={tdStyle}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: m.role === "owner" ? "#f59e0b" : "var(--text-secondary)" }}>
                          {m.role === "owner" && "👑"}
                          {roleLabel(m.role)}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        {isActiveWorkspaceOwner && !isSelf && (
                          <>
                            <button
                              ref={(el) => (menuAnchorsRef.current[m.userId] = el)}
                              onClick={() => setOpenMenuUserId(openMenuUserId === m.userId ? null : m.userId)}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontSize: 16,
                                color: "var(--text-secondary)",
                                padding: "2px 8px",
                              }}
                            >
                              ⋯
                            </button>
                            <Popover
                              anchorRef={{ current: menuAnchorsRef.current[m.userId] }}
                              isOpen={openMenuUserId === m.userId}
                              onClose={() => setOpenMenuUserId(null)}
                              placement="bottom-end"
                              className="tree-node-popup"
                            >
                              {m.role !== "admin" && (
                                <button onClick={() => handleSetRole(m, "admin")}>{t("memberDirectory.makeAdmin")}</button>
                              )}
                              {m.role !== "member" && (
                                <button onClick={() => handleSetRole(m, "member")}>{t("memberDirectory.makeMember")}</button>
                              )}
                              <button onClick={() => handleRemove(m)}>{t("membersModal.removeBtn")}</button>
                            </Popover>
                          </>
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
