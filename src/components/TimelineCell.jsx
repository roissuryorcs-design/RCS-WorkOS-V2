import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { parseDateValue } from "../utils/formulaEngine";

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function toInputValue(dateStr) {
  const d = parseDateValue(dateStr);
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fromInputValue(val) {
  if (!val) return "";
  const [y, m, d] = val.split("-");
  const mi = Number(m) - 1;
  if (mi < 0 || mi > 11) return "";
  return `${d} - ${MONTHS_SHORT[mi]} - ${y}`;
}

function shortLabel(dateStr) {
  const d = parseDateValue(dateStr);
  if (!d) return "";
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS_SHORT[d.getMonth()]}`;
}

export default function TimelineCell({ value, onChange }) {
  const timeline = value && typeof value === "object" ? value : {};
  const [open, setOpen] = useState(false);
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const popupRef = useRef(null);

  // Popup di-render lewat portal ke document.body — kalau tidak, dia
  // kepotong (clipped) oleh overflow:hidden milik <td> pembungkusnya.
  const openPopup = () => {
    const rect = triggerRef.current.getBoundingClientRect();
    setPopupPos({ top: rect.bottom + 4, left: rect.left });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        popupRef.current && !popupRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    const handleScrollOrResize = () => setOpen(false);
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [open]);

  const start = parseDateValue(timeline.start);
  const end = parseDateValue(timeline.end);
  const hasRange = start && end;

  let percent = 0;
  let overdue = false;
  if (hasRange) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const total = end.getTime() - start.getTime();
    const elapsed = today.getTime() - start.getTime();
    percent = total > 0 ? Math.min(100, Math.max(0, (elapsed / total) * 100)) : 0;
    overdue = today.getTime() > end.getTime();
  }

  const setStart = (val) => {
    onChange({ ...timeline, start: fromInputValue(val) });
  };
  const setEnd = (val) => {
    onChange({ ...timeline, end: fromInputValue(val) });
  };
  const clearAll = () => {
    onChange({ start: "", end: "" });
    setOpen(false);
  };

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <div
        ref={triggerRef}
        onClick={() => (open ? setOpen(false) : openPopup())}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
          padding: "4px 8px",
          borderRadius: 4,
          cursor: "pointer",
          minHeight: 32,
          justifyContent: "center",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <span
          style={{
            fontSize: 12,
            color: hasRange ? "var(--text-primary)" : "var(--text-muted)",
            whiteSpace: "nowrap",
            fontWeight: hasRange ? 500 : 400,
          }}
        >
          {hasRange ? `${shortLabel(timeline.start)} → ${shortLabel(timeline.end)}` : "Set timeline..."}
        </span>
        {hasRange && (
          <div style={{ width: "100%", height: 5, borderRadius: 3, background: "var(--border-color)", overflow: "hidden" }}>
            <div
              style={{
                width: `${percent}%`,
                height: "100%",
                background: overdue ? "#ef4444" : "#3b82f6",
                borderRadius: 3,
                transition: "width 0.2s",
              }}
            />
          </div>
        )}
      </div>

      {open &&
        createPortal(
          <div
            ref={popupRef}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              top: popupPos.top,
              left: popupPos.left,
              zIndex: 3000,
              background: "var(--bg-modal)",
              borderRadius: 8,
              boxShadow: "var(--shadow-lg)",
              padding: 12,
              border: "1px solid var(--border-color)",
              minWidth: 240,
            }}
          >
            <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>
              Start
            </label>
            <input
              type="date"
              value={toInputValue(timeline.start)}
              onChange={(e) => setStart(e.target.value)}
              style={{
                width: "100%",
                padding: "6px 8px",
                fontSize: 13,
                border: "1px solid var(--border-dark)",
                borderRadius: 4,
                outline: "none",
                background: "var(--bg-input)",
                color: "var(--text-primary)",
                marginBottom: 8,
              }}
            />
            <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>
              End
            </label>
            <input
              type="date"
              value={toInputValue(timeline.end)}
              onChange={(e) => setEnd(e.target.value)}
              style={{
                width: "100%",
                padding: "6px 8px",
                fontSize: 13,
                border: "1px solid var(--border-dark)",
                borderRadius: 4,
                outline: "none",
                background: "var(--bg-input)",
                color: "var(--text-primary)",
              }}
            />

            {hasRange && (
              <button
                onClick={clearAll}
                style={{
                  marginTop: 10,
                  padding: "4px 12px",
                  fontSize: 12,
                  color: "var(--text-muted)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  borderRadius: 4,
                  width: "100%",
                  textAlign: "center",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--bg-hover)";
                  e.currentTarget.style.color = "#ef4444";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--text-muted)";
                }}
              >
                ✕ Clear timeline
              </button>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
