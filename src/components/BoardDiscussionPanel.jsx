import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useBoards } from "../context/BoardsContext";
import { useLanguage } from "../context/LanguageContext";
import Avatar from "./Avatar";

const TOKEN_REGEX = /(https?:\/\/[^\s]+|@\w+)/g;

// Same URL/@mention split as DirectMessagePanel — kept as a local copy
// (not a shared import) since the two message shapes diverge slightly
// (group chat here vs 1:1 there) and this is a small enough function that
// a shared abstraction isn't worth it yet.
function renderMessageBody(body, linkColor, mentionColor) {
  const parts = body.split(TOKEN_REGEX);
  return parts.map((part, i) => {
    if (i % 2 === 1) {
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
// icon, scoped to whatever board is currently open.
export default function BoardDiscussionPanel({ boardId, boardTitle, onClose }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { fetchWorkspaceMembers } = useBoards();
  const [messages, setMessages] = useState([]);
  const [profilesById, setProfilesById] = useState({});
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [members, setMembers] = useState([]);
  const [mentionQuery, setMentionQuery] = useState(null);
  const listRef = useRef(null);
  const textareaRef = useRef(null);

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

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setText("");
    setMentionQuery(null);
    const { data, error } = await supabase
      .from("board_messages")
      .insert({ board_id: boardId, sender_id: user.id, body: trimmed })
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
    const match = val.slice(0, cursor).match(/@(\w*)$/);
    if (match) {
      setMentionQuery(match[1].toLowerCase());
      if (members.length === 0) fetchWorkspaceMembers().then(setMembers);
    } else {
      setMentionQuery(null);
    }
  };

  const insertMention = (member) => {
    const firstName = (member.displayName || member.email || "").trim().split(/\s+/)[0] || "";
    const el = textareaRef.current;
    const cursor = el ? el.selectionStart : text.length;
    const before = text.slice(0, cursor).replace(/@\w*$/, `@${firstName} `);
    const after = text.slice(cursor);
    setText(before + after);
    setMentionQuery(null);
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      el.setSelectionRange(before.length, before.length);
    });
  };

  const mentionMatches =
    mentionQuery === null
      ? []
      : members
          .filter((m) => m.userId !== user.id)
          .filter((m) => !mentionQuery || (m.displayName || m.email || "").toLowerCase().startsWith(mentionQuery))
          .slice(0, 5);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (mentionMatches.length > 0) {
        insertMention(mentionMatches[0]);
        return;
      }
      handleSend();
    } else if (e.key === "Escape" && mentionQuery !== null) {
      setMentionQuery(null);
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
            return (
              <div key={m.id} style={{ display: "flex", gap: 8, flexDirection: isMine ? "row-reverse" : "row" }}>
                <Avatar url={sender?.avatar_url} name={senderName} size={26} style={{ flexShrink: 0, marginTop: 2 }} />
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
                    {renderMessageBody(m.body, isMine ? "var(--btn-primary-text)" : "var(--btn-primary-bg)", "#f59e0b")}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ position: "relative", display: "flex", gap: 8, padding: "10px 12px", borderTop: "1px solid var(--border-color)" }}>
          {mentionMatches.length > 0 && (
            <div
              style={{
                position: "absolute",
                bottom: "100%",
                left: 12,
                right: 12,
                marginBottom: 4,
                background: "var(--bg-modal)",
                border: "1px solid var(--border-color)",
                borderRadius: 8,
                boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
                overflow: "hidden",
              }}
            >
              {mentionMatches.map((m) => (
                <div
                  key={m.userId}
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
    </div>,
    document.body
  );
}
