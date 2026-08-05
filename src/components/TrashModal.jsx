import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../lib/supabaseClient";
import { useBoards } from "../context/BoardsContext";
import { useLanguage } from "../context/LanguageContext";

const TRASH_DAYS = 15;

function daysLeft(deletedAt) {
  const elapsedMs = Date.now() - new Date(deletedAt).getTime();
  const elapsedDays = elapsedMs / 86400000;
  return Math.ceil(TRASH_DAYS - elapsedDays);
}

// Same "boards live in BoardsContext, groups need a direct workspace-wide
// query" split as ArchiveModal. The 15-day expiry has no server-side cron
// behind it (nothing in this Supabase project runs on a schedule) — it's
// enforced lazily instead: whenever this modal loads, anything already
// past its window gets permanently deleted right then as a side effect,
// before the remaining (still-restorable) rows are shown.
export default function TrashModal({ onClose }) {
  const { t } = useLanguage();
  const { trashedBoards, restoreBoardFromTrash, permanentlyDeleteBoard, allNodes, activeWorkspaceId } = useBoards();
  const [trashedGroups, setTrashedGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);

  // Purge expired boards on open.
  useEffect(() => {
    trashedBoards.forEach((b) => {
      if (daysLeft(b.deletedAt) <= 0) permanentlyDeleteBoard(b.id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    const boardIds = allNodes.filter((n) => n.type === "board").map((n) => n.id);
    if (boardIds.length === 0) {
      setTrashedGroups([]);
      setLoadingGroups(false);
      return;
    }
    setLoadingGroups(true);
    supabase
      .from("groups")
      .select("id, name, board_id, deleted_at")
      .in("board_id", boardIds)
      .not("deleted_at", "is", null)
      .then(async ({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("Error loading trashed groups:", error);
          setLoadingGroups(false);
          return;
        }
        const rows = data || [];
        const expired = rows.filter((g) => daysLeft(g.deleted_at) <= 0);
        const live = rows.filter((g) => daysLeft(g.deleted_at) > 0);
        if (expired.length > 0) {
          await Promise.all(expired.map((g) => supabase.from("groups").delete().eq("id", g.id)));
        }
        if (cancelled) return;
        setTrashedGroups(live);
        setLoadingGroups(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWorkspaceId]);

  const boardNameOf = (boardId) => allNodes.find((n) => n.id === boardId)?.name || "";

  const handleRestoreGroup = async (group) => {
    const { error } = await supabase.from("groups").update({ deleted_at: null }).eq("id", group.id);
    if (error) {
      console.error("Error restoring group:", error);
      return;
    }
    setTrashedGroups((prev) => prev.filter((g) => g.id !== group.id));
  };

  const handlePermanentlyDeleteGroup = async (group) => {
    if (!confirm(t("trashModal.deleteForeverConfirm", { name: group.name }))) return;
    const { error } = await supabase.from("groups").delete().eq("id", group.id);
    if (error) {
      console.error("Error permanently deleting group:", error);
      return;
    }
    setTrashedGroups((prev) => prev.filter((g) => g.id !== group.id));
  };

  const handlePermanentlyDeleteBoard = (board) => {
    if (!confirm(t("trashModal.deleteForeverConfirm", { name: board.name }))) return;
    permanentlyDeleteBoard(board.id);
  };

  const rowStyle = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 4px",
    borderBottom: "1px solid var(--border-color)",
  };

  const btnStyle = {
    padding: "3px 10px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 11.5,
    flexShrink: 0,
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
          maxWidth: 560,
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
        <h3 style={{ marginBottom: 4, fontSize: 16, fontWeight: 600 }}>🗑️ {t("trashModal.title")}</h3>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 14 }}>{t("trashModal.hint", { days: TRASH_DAYS })}</p>

        <div style={{ overflowY: "auto", marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.3, margin: "8px 0 4px" }}>
            {t("archiveModal.boardsSection")}
          </div>
          {trashedBoards.length === 0 ? (
            <div style={{ fontSize: 12.5, color: "var(--text-muted)", padding: "6px 4px" }}>{t("trashModal.noBoards")}</div>
          ) : (
            trashedBoards.map((b) => (
              <div key={b.id} style={rowStyle}>
                <span style={{ flex: 1, fontSize: 13.5, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.name}</span>
                <span style={{ fontSize: 11, color: "#f59e0b", flexShrink: 0 }}>
                  {t("trashModal.daysLeft", { count: daysLeft(b.deletedAt) })}
                </span>
                <button
                  onClick={() => restoreBoardFromTrash(b.id)}
                  style={{ ...btnStyle, background: "transparent", color: "var(--btn-primary-bg)", border: "1px solid var(--btn-primary-bg)" }}
                >
                  {t("archiveModal.restoreBtn")}
                </button>
                <button
                  onClick={() => handlePermanentlyDeleteBoard(b)}
                  style={{ ...btnStyle, background: "transparent", color: "#ef4444", border: "1px solid #ef4444" }}
                >
                  {t("trashModal.deleteForeverBtn")}
                </button>
              </div>
            ))
          )}

          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.3, margin: "16px 0 4px" }}>
            {t("archiveModal.groupsSection")}
          </div>
          {loadingGroups ? (
            <div style={{ fontSize: 12.5, color: "var(--text-muted)", padding: "6px 4px" }}>{t("membersModal.loading")}</div>
          ) : trashedGroups.length === 0 ? (
            <div style={{ fontSize: 12.5, color: "var(--text-muted)", padding: "6px 4px" }}>{t("trashModal.noGroups")}</div>
          ) : (
            trashedGroups.map((g) => (
              <div key={g.id} style={rowStyle}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.name}</div>
                  <div style={{ fontSize: 10.5, color: "var(--text-muted)" }}>{boardNameOf(g.board_id)}</div>
                </div>
                <span style={{ fontSize: 11, color: "#f59e0b", flexShrink: 0 }}>
                  {t("trashModal.daysLeft", { count: daysLeft(g.deleted_at) })}
                </span>
                <button
                  onClick={() => handleRestoreGroup(g)}
                  style={{ ...btnStyle, background: "transparent", color: "var(--btn-primary-bg)", border: "1px solid var(--btn-primary-bg)" }}
                >
                  {t("archiveModal.restoreBtn")}
                </button>
                <button
                  onClick={() => handlePermanentlyDeleteGroup(g)}
                  style={{ ...btnStyle, background: "transparent", color: "#ef4444", border: "1px solid #ef4444" }}
                >
                  {t("trashModal.deleteForeverBtn")}
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
