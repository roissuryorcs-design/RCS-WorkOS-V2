import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../lib/supabaseClient";
import { useDM } from "../context/DMContext";
import { useAuth } from "../context/AuthContext";
import { useProfile } from "../context/ProfileContext";
import { useBoards } from "../context/BoardsContext";
import { useLanguage } from "../context/LanguageContext";
import Avatar from "./Avatar";

// dm_notes rows are keyed by the pair in canonical (user_a < user_b)
// order so (A,B) and (B,A) always resolve to the same shared row —
// every read/write has to sort the two ids the same way.
function sortedPair(a, b) {
  return a < b ? [a, b] : [b, a];
}

// Matches URLs and @mention tokens in one pass so both can be picked out
// of the interleaved split() result below.
const TOKEN_REGEX = /(https?:\/\/[^\s]+|@\w+)/g;

// Splits a message body on URLs/@mentions and renders URLs as real
// clickable links (needed for the auto-posted "started a video call:
// <link>" message from handleStartCall below to actually be usable) and
// @mentions as highlighted text. Mentions here are cosmetic only — unlike
// UpdatePanel's board-comment mentions, a DM's recipient already gets a
// notification for the message itself, and notifying some third party
// that they were "mentioned" inside someone else's private conversation
// (which they have no way to open) would leak private context to them.
function renderMessageBody(body, linkColor, mentionColor) {
  // split() with a capturing-group regex interleaves the matched groups at
  // odd indices ([text, token, text, token, …]) — checking that directly
  // (rather than re-testing each part against TOKEN_REGEX, whose /g flag
  // carries mutable lastIndex state across calls and would give wrong
  // results here) is what makes this reliable.
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

// 1:1 chat panel for one conversation partner. Same overlay treatment as
// every other modal in the app, just taller/narrower to read as a chat
// window rather than a form.
export default function DirectMessagePanel({ partnerId, partnerName, partnerAvatarUrl, partnerZoomLink, onClose }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { messagesWith, sendMessage, markConversationRead } = useDM();
  const { fetchWorkspaceMembers } = useBoards();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [mode, setMode] = useState("chat"); // "chat" | "notes"
  const [notes, setNotes] = useState("");
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesStatus, setNotesStatus] = useState(null); // null | "saved"
  const [members, setMembers] = useState([]);
  const [mentionQuery, setMentionQuery] = useState(null); // null when no active "@token"
  const listRef = useRef(null);
  const textareaRef = useRef(null);

  const messages = messagesWith(partnerId);

  useEffect(() => {
    markConversationRead(partnerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerId]);

  // Loaded lazily (only once notes mode is actually opened, not on every
  // chat open) — no live Realtime sync for v1, notes are typically
  // written by one person during/after a call rather than edited
  // character-by-character by both sides at once.
  useEffect(() => {
    if (mode !== "notes" || !user?.id || !partnerId) return;
    let cancelled = false;
    setNotesLoading(true);
    const [userA, userB] = sortedPair(user.id, partnerId);
    supabase
      .from("dm_notes")
      .select("body")
      .eq("user_a", userA)
      .eq("user_b", userB)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.error("Error loading notes:", error);
        setNotes(data?.body || "");
        setNotesLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, partnerId]);

  const handleSaveNotes = async () => {
    setNotesSaving(true);
    setNotesStatus(null);
    const [userA, userB] = sortedPair(user.id, partnerId);
    const { error } = await supabase
      .from("dm_notes")
      .upsert(
        { user_a: userA, user_b: userB, body: notes, updated_by: user.id, updated_at: new Date().toISOString() },
        { onConflict: "user_a,user_b" }
      );
    setNotesSaving(false);
    setNotesStatus(error ? "error" : "saved");
    if (error) console.error("Error saving notes:", error);
  };

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setText("");
    setMentionQuery(null);
    await sendMessage(partnerId, trimmed);
    setSending(false);
  };

  // Detects an in-progress "@token" right before the cursor and, on first
  // use, lazy-loads the workspace member list to filter against — same
  // lazy-fetch idea as the notes panel above.
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
    const newText = before + after;
    setText(newText);
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

  // Prefers my own saved Zoom link (so I always land in a room I control)
  // and falls back to the partner's if I haven't set one — either way the
  // link gets posted into the chat too, so both sides know where to go
  // without relying on a separate calendar invite/screenshare-the-link step.
  const handleStartCall = () => {
    const link = profile?.zoom_link || partnerZoomLink;
    if (!link) {
      alert(t("directMessage.noZoomLink"));
      return;
    }
    window.open(link, "_blank", "noopener,noreferrer");
    sendMessage(partnerId, `📹 ${t("directMessage.startedCall")}: ${link}`);
  };

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
          maxWidth: 420,
          height: "70vh",
          maxHeight: 560,
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
          <Avatar url={partnerAvatarUrl} name={partnerName} size={32} />
          <div style={{ fontSize: 14, fontWeight: 700, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {partnerName}
          </div>
          <button
            onClick={handleStartCall}
            title={t("directMessage.startCallBtn")}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 17, color: "var(--text-secondary)", padding: 4 }}
          >
            📹
          </button>
          <button
            onClick={() => setMode((prev) => (prev === "notes" ? "chat" : "notes"))}
            title={t("directMessage.notesBtn")}
            style={{
              background: mode === "notes" ? "var(--bg-hover)" : "none",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 16,
              color: "var(--text-secondary)",
              padding: 4,
            }}
          >
            📝
          </button>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "var(--text-secondary)", padding: 4 }}
          >
            ×
          </button>
        </div>

        {mode === "chat" ? (
          <>
            <div ref={listRef} style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
              {messages.length === 0 && (
                <div style={{ fontSize: 12.5, color: "var(--text-muted)", textAlign: "center", marginTop: 20 }}>
                  {t("directMessage.empty")}
                </div>
              )}
              {messages.map((m) => {
                const isMine = m.sender_id === user.id;
                return (
                  <div key={m.id} style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start" }}>
                    <div
                      style={{
                        maxWidth: "75%",
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
                placeholder={t("directMessage.placeholder")}
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
          </>
        ) : (
          <>
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column" }}>
              <button
                onClick={() => setMode("chat")}
                style={{
                  alignSelf: "flex-start",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  marginBottom: 10,
                  padding: "5px 10px",
                  background: "var(--bg-hover)",
                  border: "1px solid var(--border-dark)",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                }}
              >
                ← {t("directMessage.backToChatBtn")}
              </button>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                {t("directMessage.notesLabel")}
              </label>
              {notesLoading ? (
                <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{t("membersModal.loading")}</div>
              ) : (
                <textarea
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value);
                    setNotesStatus(null);
                  }}
                  placeholder={t("directMessage.notesPlaceholder")}
                  style={{
                    flex: 1,
                    resize: "none",
                    padding: "10px",
                    borderRadius: 6,
                    border: "1px solid var(--border-dark)",
                    background: "var(--bg-input)",
                    color: "var(--text-primary)",
                    fontSize: 13,
                    fontFamily: "inherit",
                    lineHeight: 1.5,
                  }}
                />
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderTop: "1px solid var(--border-color)" }}>
              {notesStatus === "saved" && (
                <span style={{ fontSize: 11.5, color: "#16a34a" }}>{t("settingsModal.saved")}</span>
              )}
              {notesStatus === "error" && (
                <span style={{ fontSize: 11.5, color: "#ef4444" }}>{t("settingsModal.saveFailed")}</span>
              )}
              <button
                onClick={handleSaveNotes}
                disabled={notesSaving || notesLoading}
                style={{
                  marginLeft: "auto",
                  padding: "8px 18px",
                  background: "var(--btn-primary-bg)",
                  color: "var(--btn-primary-text)",
                  border: "none",
                  borderRadius: 6,
                  cursor: notesSaving || notesLoading ? "default" : "pointer",
                  fontWeight: 600,
                  fontSize: 13,
                  opacity: notesSaving || notesLoading ? 0.6 : 1,
                }}
              >
                {t("settingsModal.saveBtn")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
