import { useState, useEffect } from "react";
import { useBoards } from "../context/BoardsContext";
import { useLanguage } from "../context/LanguageContext";

export default function BoardAccessModal({ boardId, boardName, onClose }) {
  const { t } = useLanguage();
  const { fetchWorkspaceMembers, fetchBoardMembers, setBoardAccess } = useBoards();
  const [members, setMembers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchWorkspaceMembers(), fetchBoardMembers(boardId)]).then(([memberList, restrictedIds]) => {
      if (cancelled) return;
      setMembers(memberList);
      setSelectedIds(restrictedIds);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);

  const isRestricted = selectedIds.length > 0;

  const toggleMember = (userId) => {
    setSelectedIds((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]));
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await setBoardAccess(boardId, selectedIds);
    setSaving(false);
    if (error) {
      alert(t("boardAccessModal.saveFailed"));
      return;
    }
    onClose();
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
        <h3 style={{ marginBottom: 8, fontSize: 16, fontWeight: 600 }}>
          {t("boardAccessModal.title", { name: boardName })}
        </h3>
        <p style={{ fontSize: 12.5, color: "var(--text-secondary)", marginBottom: 12 }}>
          {t("boardAccessModal.hint")}
        </p>

        {!loading && (
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              padding: "6px 10px",
              borderRadius: 6,
              marginBottom: 12,
              background: isRestricted ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.12)",
              color: isRestricted ? "#ef4444" : "#22c55e",
            }}
          >
            {isRestricted ? t("boardAccessModal.restrictedNote") : t("boardAccessModal.openNote")}
          </div>
        )}

        {loading ? (
          <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{t("membersModal.loading")}</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 280, overflowY: "auto", marginBottom: 16 }}>
            {members.map((m) => (
              <label
                key={m.userId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 10px",
                  borderRadius: 6,
                  background: "var(--bg-hover)",
                  cursor: m.role === "owner" ? "default" : "pointer",
                  opacity: m.role === "owner" ? 0.6 : 1,
                }}
              >
                <input
                  type="checkbox"
                  checked={m.role === "owner" || selectedIds.includes(m.userId)}
                  disabled={m.role === "owner"}
                  onChange={() => toggleMember(m.userId)}
                />
                <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {m.displayName || m.email}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                    {m.role === "owner" ? t("boardAccessModal.ownerAlwaysHint") : m.email}
                  </span>
                </div>
              </label>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              flex: 1,
              padding: "8px",
              background: "var(--bg-hover)",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              color: "var(--text-secondary)",
            }}
          >
            {t("boardAccessModal.cancelBtn")}
          </button>
          <button
            onClick={handleSave}
            disabled={loading || saving}
            style={{
              flex: 1,
              padding: "8px",
              background: "var(--btn-primary-bg)",
              color: "var(--btn-primary-text)",
              border: "none",
              borderRadius: 6,
              cursor: saving ? "default" : "pointer",
              fontWeight: 500,
              opacity: saving ? 0.7 : 1,
            }}
          >
            {t("boardAccessModal.saveBtn")}
          </button>
        </div>
      </div>
    </div>
  );
}
