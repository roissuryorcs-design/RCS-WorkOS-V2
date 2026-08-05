import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useBoards } from "../context/BoardsContext";
import { useItems } from "../context/ItemsContext";
import { useUpdates } from "../context/UpdateContext";
import { useLanguage } from "../context/LanguageContext";
import { uploadToCloudinary } from "../utils/cloudinaryUpload";
import Avatar from "./Avatar";

// Matches, in one pass: URLs, @mentions, and [[board:id|Label]] /
// [[item:id|Label]] reference tokens inserted by the # picker below. The
// whole alternation sits in one outer capturing group so split() still
// interleaves cleanly as [text, token, text, token, …].
const TOKEN_REGEX = /(https?:\/\/[^\s]+|@\w+|\[\[(?:board|item):[a-zA-Z0-9_-]+\|[^\]]+\]\])/g;
const REF_TOKEN_REGEX = /^\[\[(board|item):([a-zA-Z0-9_-]+)\|([^\]]+)\]\]$/;

// Item names are only unique within their own group/parent — the same
// "Tugas 1" commonly exists in several groups, and a sub-item's name alone
// doesn't say which parent task it belongs to either. addressOf() builds
// the full "Group › Parent › …" breadcrumb so the picker and the token
// label both show exactly where the item lives, not just its bare name.
function addressOf(it) {
  const parts = [it.group, ...(it.ancestorNames || [])].filter(Boolean).map((s) => s.replace(/[|[\]]/g, ""));
  return parts.join(" › ");
}

// Square brackets/pipes are stripped since they're the token grammar's own
// delimiters.
function itemRefLabel(it) {
  const name = (it.item || "").replace(/[|[\]]/g, "");
  const address = addressOf(it);
  return address ? `${name} (${address})` : name;
}

function flattenItems(items) {
  const out = [];
  const walk = (arr, ancestorNames) => {
    for (const it of arr) {
      out.push({ ...it, ancestorNames });
      if (it.children?.length) walk(it.children, [...ancestorNames, it.item]);
    }
  };
  walk(items, []);
  return out;
}

// Renders a message body: URLs as real links, @mentions highlighted, and
// [[board:…]]/[[item:…]] tokens as clickable chips that jump straight to
// the referenced board or item (onRefClick) — the "click a link to go to
// the exact board/item" behavior requested to match how WhatsApp/Slack
// link previews work, adapted to this app's own boards/items instead of
// external URLs.
function renderMessageBody(body, linkColor, mentionColor, refBg, onRefClick) {
  const parts = body.split(TOKEN_REGEX);
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      if (part.startsWith("[[")) {
        const m = part.match(REF_TOKEN_REGEX);
        if (m) {
          const [, refType, refId, label] = m;
          return (
            <button
              key={i}
              onClick={() => onRefClick(refType, refId)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
                padding: "1px 8px",
                borderRadius: 10,
                border: "none",
                background: refBg,
                color: "#fff",
                fontSize: 11.5,
                fontWeight: 600,
                cursor: "pointer",
                verticalAlign: "middle",
              }}
            >
              {refType === "board" ? "📋" : "🔖"} {label}
            </button>
          );
        }
      }
      if (part.startsWith("@")) {
        return (
          <span key={i} style={{ color: mentionColor, fontWeight: 700 }}>
            {part}
          </span>
        );
      }
      return (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color: linkColor, textDecoration: "underline" }}>
          {part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

// File attachments on a sent message — same compact numbered-link list as
// UpdatePanel's renderFiles, just colored to match whichever side of the
// conversation the bubble is on.
function renderChatFiles(files, linkColor) {
  if (!files || files.length === 0) return null;
  return (
    <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 2 }}>
      {files.map((file, index) => (
        <a
          key={file.id}
          href={file.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 12, color: linkColor, textDecoration: "underline", wordBreak: "break-all" }}
        >
          📎 {index + 1}. {file.name}
        </a>
      ))}
    </div>
  );
}

// Group chat for this specific board — every message is visible to anyone
// who can access the board (RLS via can_access_board()), unlike
// DirectMessagePanel which is private 1:1. Opened from the header's 💬
// icon, scoped to whatever board is currently open. Supports WhatsApp-style
// reply-to-message and #board/#item reference links (openable straight
// from the chat, no need to go find them manually).
export default function BoardDiscussionPanel({ boardId, boardTitle, onClose }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { fetchWorkspaceMembers, nodes, goToBoard, setItemPickRequest } = useBoards();
  const { items } = useItems();
  const { openPanel } = useUpdates();
  const [messages, setMessages] = useState([]);
  const [profilesById, setProfilesById] = useState({});
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [members, setMembers] = useState([]);
  const [mentionQuery, setMentionQuery] = useState(null);
  const [refQuery, setRefQuery] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [highlightedId, setHighlightedId] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState("");
  const listRef = useRef(null);
  const textareaRef = useRef(null);
  const messageRefs = useRef({});
  const fileInputRef = useRef(null);

  const flatItems = useMemo(() => flattenItems(items), [items]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabase
      .from("board_messages")
      .select("*")
      .eq("board_id", boardId)
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.error("Error loading board messages:", error);
        setMessages(data || []);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [boardId]);

  useEffect(() => {
    const channel = supabase
      .channel(`board_messages:${boardId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "board_messages", filter: `board_id=eq.${boardId}` },
        (payload) => {
          setMessages((prev) => (prev.some((m) => m.id === payload.new.id) ? prev : [...prev, payload.new]));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [boardId]);

  useEffect(() => {
    const ids = [...new Set(messages.map((m) => m.sender_id))].filter((id) => !profilesById[id]);
    if (ids.length === 0) return;
    supabase
      .from("profiles")
      .select("id, display_name, email, avatar_url")
      .in("id", ids)
      .then(({ data, error }) => {
        if (error) {
          console.error("Error loading board message senders:", error);
          return;
        }
        setProfilesById((prev) => {
          const next = { ...prev };
          for (const p of data || []) next[p.id] = p;
          return next;
        });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length]);

  const senderNameOf = (m) => {
    const p = profilesById[m.sender_id];
    return p?.display_name || p?.email || "";
  };

  const scrollToMessage = (id) => {
    const el = messageRefs.current[id];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightedId(id);
    setTimeout(() => setHighlightedId((cur) => (cur === id ? null : cur)), 1500);
  };

  const handleRefClick = (refType, refId) => {
    if (refType === "board") {
      onClose();
      goToBoard(refId);
    } else {
      onClose();
      openPanel(refId);
    }
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if ((!trimmed && uploadedFiles.length === 0) || sending) return;
    setSending(true);
    setText("");
    if (textareaRef.current) textareaRef.current.style.height = "";
    setMentionQuery(null);
    setRefQuery(null);
    const replyToId = replyingTo?.id ?? null;
    setReplyingTo(null);
    const filesToSend = uploadedFiles;
    setUploadedFiles([]);
    const { data, error } = await supabase
      .from("board_messages")
      .insert({ board_id: boardId, sender_id: user.id, body: trimmed, reply_to_id: replyToId, files: filesToSend })
      .select()
      .single();
    if (error) {
      console.error("Error sending board message:", error);
    } else {
      setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data]));
      if (trimmed) notifyMentions(trimmed, data.id);
    }
    setSending(false);
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (files.length === 0) return;
    setUploadingFiles(true);
    try {
      const uploaded = await Promise.all(files.map((f) => uploadToCloudinary(f)));
      setUploadedFiles((prev) => [...prev, ...uploaded.map((u) => ({ ...u, id: u.url }))]);
    } catch (err) {
      console.error("Upload failed:", err);
      alert(t("fileAttachment.uploadFailed"));
    } finally {
      setUploadingFiles(false);
    }
  };

  const removeUploadedFile = (fileId) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleEditStart = (m) => {
    setEditingMessageId(m.id);
    setEditText(m.body);
  };

  const handleEditCancel = () => {
    setEditingMessageId(null);
    setEditText("");
  };

  const handleEditSave = async () => {
    const trimmed = editText.trim();
    if (!trimmed) return;
    const editedAt = new Date().toISOString();
    const { data, error } = await supabase
      .from("board_messages")
      .update({ body: trimmed, edited_at: editedAt })
      .eq("id", editingMessageId)
      .select()
      .single();
    if (error) {
      console.error("Error editing board message:", error);
      return;
    }
    setMessages((prev) => prev.map((m) => (m.id === data.id ? data : m)));
    setEditingMessageId(null);
    setEditText("");
  };

  const handleDelete = async (m) => {
    if (!confirm(t("boardDiscussion.deleteConfirm"))) return;
    const { error } = await supabase.from("board_messages").delete().eq("id", m.id);
    if (error) {
      console.error("Error deleting board message:", error);
      return;
    }
    setMessages((prev) => prev.filter((x) => x.id !== m.id));
  };

  // Unlike DirectMessagePanel's cosmetic-only mentions, everyone tagged
  // here can already see the message (it's a shared board channel, not a
  // private 1:1), so a real notification is safe to fire — same
  // resolve-and-insert pattern as UpdatePanel's notifyMentions for board
  // comments.
  const notifyMentions = async (body, sourceId) => {
    const tokens = [...body.matchAll(/@(\w+)/g)].map((m) => m[1].toLowerCase());
    if (tokens.length === 0) return;
    const memberList = members.length > 0 ? members : await fetchWorkspaceMembers();
    const matchedUserIds = new Set();
    memberList.forEach((m) => {
      if (m.userId === user.id) return;
      const firstWord = (m.displayName || m.email || "").trim().split(/\s+/)[0]?.toLowerCase();
      if (firstWord && tokens.includes(firstWord)) matchedUserIds.add(m.userId);
    });
    if (matchedUserIds.size === 0) return;
    const { error } = await supabase.from("notifications").insert(
      [...matchedUserIds].map((userId) => ({
        user_id: userId,
        actor_id: user.id,
        type: "mention",
        source_type: "board_message",
        source_id: sourceId,
        board_id: boardId,
        preview: body.slice(0, 120),
      }))
    );
    if (error) console.error("Error creating board chat mention notifications:", error);
  };

  // Same auto-grow-up-to-5-lines behavior as the item comment box
  // (UpdatePanel) — grows with content via scrollHeight, then switches to
  // an internal scrollbar instead of growing further.
  const AUTO_GROW_MAX_LINES = 5;
  const AUTO_GROW_LINE_HEIGHT = 19;
  const AUTO_GROW_V_PADDING = 16; // 8px top + 8px bottom
  const autoGrowTextarea = (el) => {
    if (!el) return;
    el.style.height = "auto";
    const maxHeight = AUTO_GROW_LINE_HEIGHT * AUTO_GROW_MAX_LINES + AUTO_GROW_V_PADDING;
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
  };

  const handleTextChange = (e) => {
    const val = e.target.value;
    setText(val);
    autoGrowTextarea(e.target);
    const cursor = e.target.selectionStart;
    const uptoCursor = val.slice(0, cursor);
    const mentionMatch = uptoCursor.match(/@(\w*)$/);
    const refMatch = uptoCursor.match(/#(\S*)$/);
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1].toLowerCase());
      setRefQuery(null);
      if (members.length === 0) fetchWorkspaceMembers().then(setMembers);
    } else if (refMatch) {
      setRefQuery(refMatch[1].toLowerCase());
      setMentionQuery(null);
    } else {
      setMentionQuery(null);
      setRefQuery(null);
    }
  };

  const insertAtTrigger = (trigger, replacement) => {
    const el = textareaRef.current;
    const cursor = el ? el.selectionStart : text.length;
    const pattern = trigger === "@" ? /@\w*$/ : /#\S*$/;
    const before = text.slice(0, cursor).replace(pattern, `${replacement} `);
    const after = text.slice(cursor);
    setText(before + after);
    setMentionQuery(null);
    setRefQuery(null);
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      el.setSelectionRange(before.length, before.length);
    });
  };

  const insertMention = (member) => {
    const firstName = (member.displayName || member.email || "").trim().split(/\s+/)[0] || "";
    insertAtTrigger("@", `@${firstName}`);
  };

  const insertRef = (refType, id, label) => {
    insertAtTrigger("#", `[[${refType}:${id}|${label}]]`);
  };

  // itemPickRequest.onPick is a stable function handed to BoardsContext
  // (and from there to every Row), but insertRef closes over `text`/the
  // textarea's live cursor — a plain useEffect-provided closure would go
  // stale the moment the user kept typing after opening "#" mode. Routing
  // the actual call through a ref that's refreshed every render keeps it
  // current without re-publishing the request on every keystroke.
  const insertRefLive = useRef(insertRef);
  insertRefLive.current = insertRef;

  useEffect(() => {
    if (refQuery !== null) {
      setItemPickRequest({
        boardId,
        onPick: (item) => insertRefLive.current("item", item.id, itemRefLabel(item)),
      });
    } else {
      setItemPickRequest((prev) => (prev && prev.boardId === boardId ? null : prev));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refQuery, boardId]);

  useEffect(() => {
    return () => setItemPickRequest((prev) => (prev && prev.boardId === boardId ? null : prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mentionMatches =
    mentionQuery === null
      ? []
      : members
          .filter((m) => m.userId !== user.id)
          .filter((m) => !mentionQuery || (m.displayName || m.email || "").toLowerCase().startsWith(mentionQuery))
          .slice(0, 5);

  const boardMatches =
    refQuery === null
      ? []
      : nodes
          .filter((n) => n.type === "board" && n.id !== boardId)
          .filter((n) => !refQuery || (n.name || "").toLowerCase().includes(refQuery))
          .slice(0, 4);

  const itemMatches =
    refQuery === null
      ? []
      : flatItems.filter((it) => !refQuery || (it.item || "").toLowerCase().includes(refQuery)).slice(0, 4);

  const handleKeyDown = (e) => {
    // Enter alone just inserts a newline now — sending is Kirim-only,
    // matching the item comment box. The one carve-out: Enter still picks
    // a highlighted @mention/#board/#item match when that dropdown is
    // open, same as before.
    if (e.key === "Enter") {
      if (mentionMatches.length > 0) {
        e.preventDefault();
        insertMention(mentionMatches[0]);
      } else if (boardMatches.length > 0) {
        e.preventDefault();
        insertRef("board", boardMatches[0].id, boardMatches[0].name);
      } else if (itemMatches.length > 0) {
        e.preventDefault();
        insertRef("item", itemMatches[0].id, itemRefLabel(itemMatches[0]));
      }
    } else if (e.key === "Escape" && (mentionQuery !== null || refQuery !== null)) {
      setMentionQuery(null);
      setRefQuery(null);
    }
  };

  return createPortal(
    // Docked to the right edge instead of a centered modal-with-backdrop —
    // deliberately, so the board table stays visible and clickable behind
    // it (needed for the "# then click an item in the table" picker
    // instead of only being able to search by typing).
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        width: 380,
        maxWidth: "92vw",
        background: "var(--bg-modal)",
        borderLeft: "1px solid var(--border-color)",
        boxShadow: "-8px 0 32px rgba(0,0,0,0.25)",
        color: "var(--text-primary)",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: "1px solid var(--border-color)" }}>
          <div style={{ fontSize: 14, fontWeight: 700, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            💬 {t("header.discussionLabel")}
            {boardTitle && (
              <span style={{ fontWeight: 400, color: "var(--text-secondary)" }}> · {boardTitle}</span>
            )}
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "var(--text-secondary)", padding: 4 }}
          >
            ×
          </button>
        </div>

        <div ref={listRef} style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
          {!loading && messages.length === 0 && (
            <div style={{ fontSize: 12.5, color: "var(--text-muted)", textAlign: "center", marginTop: 20 }}>
              {t("boardDiscussion.empty")}
            </div>
          )}
          {messages.map((m) => {
            const isMine = m.sender_id === user.id;
            const sender = profilesById[m.sender_id];
            const senderName = sender?.display_name || sender?.email || "";
            const quoted = m.reply_to_id ? messages.find((x) => x.id === m.reply_to_id) : null;
            const isEditing = editingMessageId === m.id;
            return (
              <div
                key={m.id}
                ref={(el) => (messageRefs.current[m.id] = el)}
                style={{
                  display: "flex",
                  gap: 8,
                  flexDirection: isMine ? "row-reverse" : "row",
                  alignItems: "flex-end",
                  borderRadius: 8,
                  transition: "background 0.4s",
                  background: highlightedId === m.id ? "rgba(59,130,246,0.15)" : "transparent",
                  padding: 2,
                }}
              >
                <Avatar url={sender?.avatar_url} name={senderName} size={26} style={{ flexShrink: 0, marginBottom: 6 }} />
                <div style={{ display: "flex", flexDirection: "column", alignItems: isMine ? "flex-end" : "flex-start", maxWidth: "75%" }}>
                  {!isMine && (
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 2 }}>{senderName}</span>
                  )}
                  {isEditing ? (
                    <div style={{ width: 220 }}>
                      <textarea
                        autoFocus
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleEditSave();
                          } else if (e.key === "Escape") {
                            handleEditCancel();
                          }
                        }}
                        rows={2}
                        style={{
                          width: "100%",
                          resize: "none",
                          padding: "7px 10px",
                          borderRadius: 10,
                          border: "2px solid var(--btn-primary-bg)",
                          background: "var(--bg-input)",
                          color: "var(--text-primary)",
                          fontSize: 13,
                          fontFamily: "inherit",
                          boxSizing: "border-box",
                        }}
                      />
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", marginTop: 4 }}>
                        <button
                          onClick={handleEditCancel}
                          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11.5, color: "var(--text-secondary)" }}
                        >
                          {t("updatePanel.cancel")}
                        </button>
                        <button
                          onClick={handleEditSave}
                          disabled={!editText.trim()}
                          style={{
                            background: "var(--btn-primary-bg)",
                            color: "var(--btn-primary-text)",
                            border: "none",
                            borderRadius: 6,
                            padding: "3px 10px",
                            cursor: editText.trim() ? "pointer" : "default",
                            opacity: editText.trim() ? 1 : 0.6,
                            fontSize: 11.5,
                            fontWeight: 600,
                          }}
                        >
                          {t("settingsModal.saveBtn")}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: "7px 11px",
                        borderRadius: 12,
                        borderBottomRightRadius: isMine ? 3 : 12,
                        borderBottomLeftRadius: isMine ? 12 : 3,
                        background: isMine ? "var(--btn-primary-bg)" : "var(--bg-hover)",
                        color: isMine ? "var(--btn-primary-text)" : "var(--text-primary)",
                        fontSize: 13,
                        wordBreak: "break-word",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {quoted && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            scrollToMessage(quoted.id);
                          }}
                          style={{
                            cursor: "pointer",
                            borderLeft: `3px solid ${isMine ? "rgba(255,255,255,0.6)" : "var(--btn-primary-bg)"}`,
                            paddingLeft: 6,
                            marginBottom: 4,
                            opacity: 0.85,
                          }}
                        >
                          <div style={{ fontSize: 10, fontWeight: 700 }}>{senderNameOf(quoted)}</div>
                          <div style={{ fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>
                            {quoted.body}
                          </div>
                        </div>
                      )}
                      {m.body &&
                        renderMessageBody(
                          m.body,
                          isMine ? "var(--btn-primary-text)" : "var(--btn-primary-bg)",
                          "#f59e0b",
                          "var(--btn-primary-bg)",
                          handleRefClick
                        )}
                      {renderChatFiles(m.files, isMine ? "var(--btn-primary-text)" : "var(--btn-primary-bg)")}
                      {m.edited_at && (
                        <div style={{ fontSize: 9.5, opacity: 0.7, marginTop: 2 }}>{t("boardDiscussion.editedLabel")}</div>
                      )}
                    </div>
                  )}
                </div>
                {!isEditing && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 2, flexShrink: 0 }}>
                    <button
                      onClick={() => setReplyingTo(m)}
                      title={t("boardDiscussion.replyBtn")}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--text-muted)", padding: 4 }}
                    >
                      ↩
                    </button>
                    {isMine && (
                      <>
                        <button
                          onClick={() => handleEditStart(m)}
                          title={t("updatePanel.edit")}
                          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--text-muted)", padding: 4 }}
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => handleDelete(m)}
                          title={t("updatePanel.delete")}
                          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--text-muted)", padding: 4 }}
                        >
                          🗑
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ padding: "10px 12px 20px", borderTop: "1px solid var(--border-color)" }}>
          {replyingTo && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "var(--bg-hover)", borderRadius: 6, marginBottom: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--btn-primary-bg)" }}>
                  {t("boardDiscussion.replyingTo", { name: senderNameOf(replyingTo) })}
                </div>
                <div style={{ fontSize: 11.5, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {replyingTo.body}
                </div>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 15, color: "var(--text-secondary)", padding: 2 }}
              >
                ×
              </button>
            </div>
          )}

          {refQuery !== null && (
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>
              {t("boardDiscussion.pickItemHint")}
            </div>
          )}

          {uploadedFiles.length > 0 && (
            <div style={{ marginBottom: 6, display: "flex", flexWrap: "wrap", gap: 4 }}>
              {uploadedFiles.map((file, idx) => (
                <div
                  key={file.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "2px 8px",
                    background: "var(--bg-hover)",
                    borderRadius: 4,
                    border: "1px solid var(--border-dark)",
                    fontSize: 11,
                  }}
                >
                  <span style={{ color: "var(--btn-primary-bg)" }}>{idx + 1}.</span>
                  <span style={{ color: "var(--btn-primary-bg)", textDecoration: "underline", wordBreak: "break-all" }}>{file.name}</span>
                  <button
                    onClick={() => removeUploadedFile(file.id)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: 13, fontWeight: 700, padding: "0 2px" }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={{ position: "relative" }}>
            {(mentionMatches.length > 0 || boardMatches.length > 0 || itemMatches.length > 0) && (
              <div
                style={{
                  position: "absolute",
                  bottom: "100%",
                  left: 0,
                  right: 0,
                  marginBottom: 4,
                  background: "var(--bg-modal)",
                  border: "1px solid var(--border-color)",
                  borderRadius: 8,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
                  overflow: "hidden",
                  maxHeight: 220,
                  overflowY: "auto",
                }}
              >
                {mentionMatches.map((m) => (
                  <div
                    key={`mem-${m.userId}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      insertMention(m);
                    }}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", cursor: "pointer" }}
                  >
                    <Avatar url={m.avatarUrl} name={m.displayName || m.email} size={22} />
                    <span style={{ fontSize: 12.5 }}>{m.displayName || m.email}</span>
                  </div>
                ))}
                {boardMatches.map((n) => (
                  <div
                    key={`brd-${n.id}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      insertRef("board", n.id, n.name);
                    }}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", cursor: "pointer" }}
                  >
                    <span style={{ fontSize: 14 }}>📋</span>
                    <span style={{ fontSize: 12.5 }}>{n.name}</span>
                  </div>
                ))}
                {itemMatches.map((it) => (
                  <div
                    key={`itm-${it.id}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      insertRef("item", it.id, itemRefLabel(it));
                    }}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", cursor: "pointer" }}
                  >
                    <span style={{ fontSize: 14 }}>🔖</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.item}</div>
                      {addressOf(it) && (
                        <div style={{ fontSize: 10, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {addressOf(it)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder={t("boardDiscussion.placeholder")}
              rows={2}
              style={{
                width: "100%",
                resize: "none",
                padding: "8px 10px",
                borderRadius: 6,
                border: "1px solid var(--border-dark)",
                background: "var(--bg-input)",
                color: "var(--text-primary)",
                fontSize: 13,
                lineHeight: "19px",
                fontFamily: "inherit",
                overflowY: "hidden",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingFiles}
              title={t("updatePanel.uploadFile")}
              style={{
                background: "none",
                border: "none",
                fontSize: 16,
                cursor: uploadingFiles ? "default" : "pointer",
                padding: "2px 6px",
                borderRadius: 4,
                color: "var(--text-secondary)",
                opacity: uploadingFiles ? 0.5 : 1,
              }}
            >
              {uploadingFiles ? "⏳" : "📎"}
            </button>
            <button
              onClick={handleSend}
              disabled={sending || (!text.trim() && uploadedFiles.length === 0)}
              style={{
                padding: "0 16px",
                height: 30,
                background: "var(--btn-primary-bg)",
                color: "var(--btn-primary-text)",
                border: "none",
                borderRadius: 6,
                cursor: sending || (!text.trim() && uploadedFiles.length === 0) ? "default" : "pointer",
                fontWeight: 600,
                fontSize: 13,
                opacity: sending || (!text.trim() && uploadedFiles.length === 0) ? 0.6 : 1,
              }}
            >
              {t("directMessage.sendBtn")}
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
            onChange={handleFileUpload}
            style={{ display: "none" }}
          />
        </div>
    </div>,
    document.body
  );
}
