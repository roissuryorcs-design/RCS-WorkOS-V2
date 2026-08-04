import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useDM } from "../context/DMContext";
import { useAuth } from "../context/AuthContext";
import { useProfile } from "../context/ProfileContext";
import { useLanguage } from "../context/LanguageContext";
import Avatar from "./Avatar";

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

// Splits a message body on URLs and renders those as real clickable
// links — needed for the auto-posted "started a video call: <link>"
// message from handleStartCall below to actually be usable, not just
// readable.
function renderMessageBody(body, linkColor) {
  // split() with a capturing-group regex interleaves the matched groups at
  // odd indices ([text, url, text, url, …]) — checking that directly
  // (rather than re-testing each part against URL_REGEX, whose /g flag
  // carries mutable lastIndex state across calls and would give wrong
  // results here) is what makes this reliable.
  const parts = body.split(URL_REGEX);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color: linkColor, textDecoration: "underline" }}>
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

// 1:1 chat panel for one conversation partner. Same overlay treatment as
// every other modal in the app, just taller/narrower to read as a chat
// window rather than a form.
export default function DirectMessagePanel({ partnerId, partnerName, partnerAvatarUrl, partnerZoomLink, onClose }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { messagesWith, sendMessage, markConversationRead } = useDM();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  const messages = messagesWith(partnerId);

  useEffect(() => {
    markConversationRead(partnerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerId]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setText("");
    await sendMessage(partnerId, trimmed);
    setSending(false);
  };

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
      handleSend();
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
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "var(--text-secondary)", padding: 4 }}
          >
            ×
          </button>
        </div>

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
                  {renderMessageBody(m.body, isMine ? "var(--btn-primary-text)" : "var(--btn-primary-bg)")}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 8, padding: "10px 12px", borderTop: "1px solid var(--border-color)" }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
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
      </div>
    </div>,
    document.body
  );
}
