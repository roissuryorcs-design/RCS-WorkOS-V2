import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useBoards } from "../context/BoardsContext";
import { useItems } from "../context/ItemsContext";
import { useUpdates } from "../context/UpdateContext";
import { useLanguage } from "../context/LanguageContext";
import Avatar from "./Avatar";

// Matches, in one pass: URLs, @mentions, and [[board:id|Label]] /
// [[item:id|Label]] reference tokens inserted by the # picker below. The
// whole alternation sits in one outer capturing group so split() still
// interleaves cleanly as [text, token, text, token, …].
const TOKEN_REGEX = /(https?:\/\/[^\s]+|@\w+|\[\[(?:board|item):[a-zA-Z0-9_-]+\|[^\]]+\]\])/g;
const REF_TOKEN_REGEX = /^\[\[(board|item):([a-zA-Z0-9_-]+)\|([^\]]+)\]\]$/;

function flattenItems(items) {
  const out = [];
  const walk = (arr) => {
    for (const it of arr) {
      out.push(it);
      if (it.children?.length) walk(it.children);
    }
  };
  walk(items);
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

// Group chat for this specific board — every message is visible to anyone
// who can access the board (RLS via can_access_board()), unlike
// DirectMessagePanel which is private 1:1. Opened from the header's 💬
// icon, scoped to whatever board is currently open. Supports WhatsApp-style
// reply-to-message and #board/#item reference links (openable straight
// from the chat, no need to go find them manually).
export default function BoardDiscussionPanel({ boardId, boardTitle, onClose }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { fetchWorkspaceMembers, nodes, goToBoard } = useBoards();
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
  const listRef = useRef(null);
  const textareaRef = useRef(null);
  const messageRefs = useRef({});

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
    if (!trimmed || sending) return;
    setSending(true);
    setText("");
    setMentionQuery(null);
    setRefQuery(null);
    const replyToId = replyingTo?.id ?? null;
    setReplyingTo(null);
    const { data, error } = await supabase
      .from("board_messages")
      .insert({ board_id: boardId, sender_id: user.id, body: trimmed, reply_to_id: replyToId })
      .select()
      .single();
    if (error) {
      console.error("Error sending board message:", error);
    } else {
      setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data]));
      notifyMentions(trimmed, data.id);
    }
    setSending(false);
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
        source_id: sourceId,
        preview: body.slice(0, 120),
      }))
    );
    if (error) console.error("Error creating board chat mention notifications:", error);
  };

  const handleTextChange = (e) => {
    const val = e.target.value;
    setText(val);
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
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (mentionMatches.length > 0) {
        insertMention(mentionMatches[0]);
        return;
      }
      if (boardMatches.length > 0) {
        insertRef("board", boardMatches[0].id, boardMatches[0].name);
        return;
      }
      if (itemMatches.length > 0) {
        insertRef("item", itemMatches[0].id, itemMatches[0].item);
        return;
      }
      handleSend();
    } else if (e.key === "Escape" && (mentionQuery !== null || refQuery !== null)) {
      setMentionQuery(null);
      setRefQuery(null);
    }
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
          width: "92%",
          maxWidth: 460,
          height: "72vh",
          maxHeight: 600,
          color: "var(--text-primary)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          border: "1px solid var(--border-color)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
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
                <Avatar url={sender?.avatar_url} name={senderName} size={26} style={{ flexShrink: 0, marginBottom: 2 }} />
                <div style={{ display: "flex", flexDirection: "column", alignItems: isMine ? "flex-end" : "flex-start", maxWidth: "75%" }}>
                  {!isMine && (
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 2 }}>{senderName}</span>
                  )}
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
                    {renderMessageBody(
                      m.body,
                      isMine ? "var(--btn-primary-text)" : "var(--btn-primary-bg)",
                      "#f59e0b",
                      "var(--btn-primary-bg)",
                      handleRefClick
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setReplyingTo(m)}
                  title={t("boardDiscussion.replyBtn")}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--text-muted)", padding: 4, flexShrink: 0 }}
                >
                  ↩
                </button>
              </div>
            );
          })}
        </div>

        <div style={{ padding: "10px 12px", borderTop: "1px solid var(--border-color)" }}>
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

          <div style={{ position: "relative", display: "flex", gap: 8 }}>
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
                      insertRef("item", it.id, it.item);
                    }}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", cursor: "pointer" }}
                  >
                    <span style={{ fontSize: 14 }}>🔖</span>
                    <span style={{ fontSize: 12.5 }}>{it.item}</span>
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
              rows={1}
              style={{
                flex: 1,
                resize: "none",
                padding: "8px 10px",
                borderRadius: 6,
                border: "1px solid var(--border-dark)",
                background: "var(--bg-input)",
                color: "var(--text-primary)",
                fontSize: 13,
                fontFamily: "inherit",
              }}
            />
            <button
              onClick={handleSend}
              disabled={sending || !text.trim()}
              style={{
                padding: "0 16px",
                background: "var(--btn-primary-bg)",
                color: "var(--btn-primary-text)",
                border: "none",
                borderRadius: 6,
                cursor: sending || !text.trim() ? "default" : "pointer",
                fontWeight: 600,
                fontSize: 13,
                opacity: sending || !text.trim() ? 0.6 : 1,
              }}
            >
              {t("directMessage.sendBtn")}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
