import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../lib/supabaseClient";
import { useBoards } from "../context/BoardsContext";
import { useLanguage } from "../context/LanguageContext";

// Boards' archive state already lives in BoardsContext (workspace-wide,
// reactive). Groups don't have an equivalent workspace-wide context —
// GroupContext is mounted per-board — so archived groups are fetched here
// directly, scoped to every board node in the active workspace, with a
// plain restore-via-direct-update (not routed through GroupContext, which
// may not even be mounted for whichever board a given archived group
// belongs to).
export default function ArchiveModal({ onClose }) {
  const { t } = useLanguage();
  const { archivedBoards, restoreBoard, allNodes, activeWorkspaceId } = useBoards();
  const [archivedGroups, setArchivedGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const boardIds = allNodes.filter((n) => n.type === "board").map((n) => n.id);
    if (boardIds.length === 0) {
      setArchivedGroups([]);
      setLoadingGroups(false);
      return;
    }
    setLoadingGroups(true);
    supabase
      .from("groups")
      .select("id, name, board_id, archived_at")
      .in("board_id", boardIds)
      .not("archived_at", "is", null)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.error("Error loading archived groups:", error);
        setArchivedGroups(data || []);
        setLoadingGroups(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWorkspaceId]);

  const boardNameOf = (boardId) => allNodes.find((n) => n.id === boardId)?.name || "";

  const handleRestoreGroup = async (group) => {
    const { error } = await supabase.from("groups").update({ archived_at: null }).eq("id", group.id);
    if (error) {
      console.error("Error restoring group:", error);
      return;
    }
    setArchivedGroups((prev) => prev.filter((g) => g.id !== group.id));
  };

  const formatDate = (iso) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

  const rowStyle = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 4px",
    borderBottom: "1px solid var(--border-color)",
  };

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
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          color: "var(--text-primary)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          border: "1px solid var(--border-color)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginBottom: 14, fontSize: 16, fontWeight: 600 }}>📦 {t("archiveModal.title")}</h3>

        <div style={{ overflowY: "auto", marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.3, margin: "8px 0 4px" }}>
            {t("archiveModal.boardsSection")}
          </div>
          {archivedBoards.length === 0 ? (
            <div style={{ fontSize: 12.5, color: "var(--text-muted)", padding: "6px 4px" }}>{t("archiveModal.noBoards")}</div>
          ) : (
            archivedBoards.map((b) => (
              <div key={b.id} style={rowStyle}>
                <span style={{ flex: 1, fontSize: 13.5, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.name}</span>
                <span style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0 }}>
                  {t("archiveModal.archivedOn", { date: formatDate(b.archivedAt) })}
                </span>
                <button
                  onClick={() => restoreBoard(b.id)}
                  style={{ padding: "3px 10px", background: "transparent", color: "var(--btn-primary-bg)", border: "1px solid var(--btn-primary-bg)", borderRadius: 6, cursor: "pointer", fontSize: 11.5, flexShrink: 0 }}
                >
                  {t("archiveModal.restoreBtn")}
                </button>
              </div>
            ))
          )}

          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.3, margin: "16px 0 4px" }}>
            {t("archiveModal.groupsSection")}
          </div>
          {loadingGroups ? (
            <div style={{ fontSize: 12.5, color: "var(--text-muted)", padding: "6px 4px" }}>{t("membersModal.loading")}</div>
          ) : archivedGroups.length === 0 ? (
            <div style={{ fontSize: 12.5, color: "var(--text-muted)", padding: "6px 4px" }}>{t("archiveModal.noGroups")}</div>
          ) : (
            archivedGroups.map((g) => (
              <div key={g.id} style={rowStyle}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.name}</div>
                  <div style={{ fontSize: 10.5, color: "var(--text-muted)" }}>{boardNameOf(g.board_id)}</div>
                </div>
                <span style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0 }}>
                  {t("archiveModal.archivedOn", { date: formatDate(g.archived_at) })}
                </span>
                <button
                  onClick={() => handleRestoreGroup(g)}
                  style={{ padding: "3px 10px", background: "transparent", color: "var(--btn-primary-bg)", border: "1px solid var(--btn-primary-bg)", borderRadius: 6, cursor: "pointer", fontSize: 11.5, flexShrink: 0 }}
                >
                  {t("archiveModal.restoreBtn")}
                </button>
              </div>
            ))
          )}
        </div>

        <button
          onClick={onClose}
          style={{ width: "100%", padding: 8, background: "var(--bg-hover)", border: "none", borderRadius: 6, cursor: "pointer", color: "var(--text-secondary)" }}
        >
          {t("common.close")}
        </button>
      </div>
    </div>,
    document.body
  );
}
