import { useState, useRef, useEffect } from "react";
import { parseDateValue } from "../utils/formulaEngine";
import Popover from "./Popover";
import { useLanguage } from "../context/LanguageContext";

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

export default function TimelineCell({ value, onChange, parentValue }) {
  const { t } = useLanguage();
  const timeline = value && typeof value === "object" ? value : {};
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);

  // A sub-item's timeline must stay within its parent's — only enforced
  // when the parent actually has a complete range set (an unset parent
  // range doesn't constrain anything).
  const parent = parentValue && typeof parentValue === "object" ? parentValue : {};
  const parentStart = parseDateValue(parent.start);
  const parentEnd = parseDateValue(parent.end);
  const hasParentRange = !!(parentStart && parentEnd);
  const minInput = hasParentRange ? toInputValue(parent.start) : undefined;
  const maxInput = hasParentRange ? toInputValue(parent.end) : undefined;

  // Defensive clamp for the rare case a date lands outside the parent's
  // range some other way (e.g. the parent's own range shrinks after the
  // child's dates were already set) — native min/max on the <input>
  // handles the normal picking flow, this just keeps saved data honest.
  const clampToParent = (d) => {
    if (!hasParentRange || !d) return d;
    if (d < parentStart) return parentStart;
    if (d > parentEnd) return parentEnd;
    return d;
  };

  // Closes on scroll (of the table's scroll container or the page) rather
  // than trying to track the trigger's moving position — simplest way to
  // avoid the popup drifting away from the cell it was opened from.
  useEffect(() => {
    if (!open) return;
    const handleScroll = () => setOpen(false);
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
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

  const clampInputValue = (val) => {
    if (!hasParentRange || !val) return val;
    const clamped = clampToParent(new Date(`${val}T00:00:00`));
    if (!clamped) return val;
    const y = clamped.getFullYear();
    const m = String(clamped.getMonth() + 1).padStart(2, "0");
    const day = String(clamped.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const setStart = (val) => {
    onChange({ ...timeline, start: fromInputValue(clampInputValue(val)) });
  };
  const setEnd = (val) => {
    onChange({ ...timeline, end: fromInputValue(clampInputValue(val)) });
  };
  const clearAll = () => {
    onChange({ start: "", end: "" });
    setOpen(false);
  };

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <div
        ref={triggerRef}
        onClick={() => setOpen((prev) => !prev)}
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
          {hasRange ? `${shortLabel(timeline.start)} → ${shortLabel(timeline.end)}` : t("timelineCell.setTimeline")}
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

      <Popover
        anchorRef={triggerRef}
        isOpen={open}
        onClose={() => setOpen(false)}
        placement="bottom-start"
        style={{
          background: "var(--bg-modal)",
          borderRadius: 8,
          boxShadow: "var(--shadow-lg)",
          padding: 12,
          border: "1px solid var(--border-color)",
          minWidth: 240,
        }}
      >
        <div onClick={(e) => e.stopPropagation()}>
            <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>
              {t("timelineCell.start")}
            </label>
            <input
              type="date"
              value={toInputValue(timeline.start)}
              onChange={(e) => setStart(e.target.value)}
              min={minInput}
              max={maxInput}
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
              {t("timelineCell.end")}
            </label>
            <input
              type="date"
              value={toInputValue(timeline.end)}
              onChange={(e) => setEnd(e.target.value)}
              min={minInput}
              max={maxInput}
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
            {hasParentRange && (
              <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 6 }}>
                {t("timelineCell.parentRangeHint", { start: shortLabel(parent.start), end: shortLabel(parent.end) })}
              </div>
            )}

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
                {t("timelineCell.clearTimeline")}
              </button>
            )}
        </div>
      </Popover>
    </div>
  );
}
