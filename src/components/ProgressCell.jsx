import { useState, useRef } from "react";
import Popover from "./Popover";
import TreeGuides, { INDENT_SIZE } from "./TreeGuides";
import { computeWeightedProgress } from "../utils/progressWeights";
import { useLanguage } from "../context/LanguageContext";

function getFallbackStages(t) {
  return [{ value: 0, label: t("progressCell.notStarted"), icon: "🔘", color: "#9E9E9E" }];
}

// Every row's bar ends at the same fixed point (the column's own width,
// minus room for the weight box, % label, settings icon and cell padding)
// — only the *start* moves, pushed right by exactly the same amount the
// tree guide's indent already consumes. So the track shrinks by
// INDENT_SIZE per level (matching TreeGuides) purely as a side effect of a
// fixed end, the same way indenting text in an editor leaves the right
// margin where it was.
const DEFAULT_COLUMN_WIDTH = 220;
const BAR_HEIGHT = 16;
const WEIGHT_BOX_WIDTH = 34;
// Cell padding (8px) + row padding (6px) + 3 gaps (6px each) + weight box
// (34px) + % label (~30px) + settings icon (~16px) — the horizontal space
// around the track that isn't track.
const RESERVED_SPACE = 112;
const MIN_TRACK_WIDTH = 30;
function trackWidthForDepth(depth, columnWidth) {
  const base = (columnWidth || DEFAULT_COLUMN_WIDTH) - RESERVED_SPACE;
  return Math.max(MIN_TRACK_WIDTH, base - depth * INDENT_SIZE);
}

function hexToRgb(hex) {
  const clean = (hex || "#9ca3af").replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHex([r, g, b]) {
  return "#" + [r, g, b].map((c) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, "0")).join("");
}

// Blends between the two stage colors a % falls between, so both a parent's
// cumulative bar and a leaf Task's own value read as a position along the
// same color reference, rather than a flat/arbitrary color.
function gradientColorForValue(stages, value) {
  const sorted = [...stages].sort((a, b) => a.value - b.value);
  if (sorted.length === 0) return "#9ca3af";
  if (value <= sorted[0].value) return sorted[0].color;
  if (value >= sorted[sorted.length - 1].value) return sorted[sorted.length - 1].color;
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (value >= a.value && value <= b.value) {
      const t = (value - a.value) / (b.value - a.value || 1);
      const rgbA = hexToRgb(a.color);
      const rgbB = hexToRgb(b.color);
      return rgbToHex(rgbA.map((c, idx) => c + (rgbB[idx] - c) * t));
    }
  }
  return sorted[sorted.length - 1].color;
}

// Compact weight input rendered directly in the row — no popup needed to
// set it. Border/background turn red when the sibling group's explicit
// weights don't add up to 100% (see `weightIncomplete` in
// progressWeights.js), so a mis-configured split is visible at a glance.
function InlineWeightBox({ explicitWeight, resolvedWeight, explicitSiblingSum, onChangeWeight, weightIncomplete }) {
  const { t } = useLanguage();
  const [draft, setDraft] = useState(explicitWeight != null ? String(explicitWeight) : "");

  const commit = () => {
    if (draft.trim() === "") {
      onChangeWeight(null); // back to auto/default
      return;
    }
    let n = parseInt(draft, 10);
    if (isNaN(n)) n = 0;
    n = Math.min(100, Math.max(0, n));
    if (n + explicitSiblingSum > 100) {
      alert(t("progressCell.weightOverLimit", { total: n + explicitSiblingSum }));
      setDraft(explicitWeight != null ? String(explicitWeight) : "");
      return;
    }
    onChangeWeight(n);
  };

  return (
    <input
      type="number"
      className="weight-number-input"
      min={0}
      max={100}
      value={draft}
      placeholder={String(Math.round(resolvedWeight))}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
      onClick={(e) => e.stopPropagation()}
      title={weightIncomplete ? t("progressCell.weightIncompleteWarning") : t("progressCell.weightLabel")}
      style={{
        width: WEIGHT_BOX_WIDTH,
        flexShrink: 0,
        padding: "2px 3px",
        fontSize: 11,
        textAlign: "center",
        borderRadius: 4,
        outline: "none",
        background: weightIncomplete ? "rgba(239,68,68,0.14)" : "var(--bg-input)",
        border: `1px solid ${weightIncomplete ? "#ef4444" : "var(--border-dark)"}`,
        color: "var(--text-primary)",
        MozAppearance: "textfield",
      }}
    />
  );
}

const popoverShellStyle = {
  background: "var(--bg-modal)",
  border: "1px solid var(--border-color)",
  borderRadius: 8,
  boxShadow: "var(--shadow-md)",
  padding: "4px 0",
  minWidth: 200,
};

export default function ProgressCell({
  value,
  onChange,
  stages,
  itemChildren,
  columnId,
  depth = 0,
  isLastChild,
  ancestorLines,
  explicitWeight,
  resolvedWeight,
  explicitSiblingSum,
  weightIncomplete = false,
  onChangeWeight,
  onOpenProgressManager,
  displayPercent,
  groupColor,
  expanded = true,
  columnWidth,
}) {
  const { t } = useLanguage();
  const safeStages = stages && stages.length > 0 ? stages : getFallbackStages(t);
  const sortedStages = [...safeStages].sort((a, b) => a.value - b.value);

  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);

  const hasChildren = itemChildren && itemChildren.length > 0;
  const isLeaf = !hasChildren;
  const showWeightField = typeof onChangeWeight === "function";

  // Same L-shaped connectors as the ITEM column, so the bar's nesting reads
  // as a direct visual echo of the item tree instead of a flat list of
  // unrelated percentages.
  const wrapperStyle = { display: "flex", alignItems: "center", width: "100%", height: "100%", position: "relative" };
  const treeGuides = (
    <TreeGuides
      depth={depth}
      ancestorLines={ancestorLines}
      isLastChild={isLastChild}
      color={groupColor || "var(--text-secondary)"}
      thickness={1.5}
      childrenVisible={hasChildren && expanded}
    />
  );

  // `rounded` = this row's own local progress (its own stage for a Task, or
  // its own weighted rollup from children for a parent) — this is what the
  // bar's width/color represent, unchanged regardless of weight.
  const rounded = hasChildren
    ? Math.round(computeWeightedProgress(itemChildren, columnId))
    : Math.min(100, Math.max(0, parseInt(value) || 0));
  const barColor = gradientColorForValue(sortedStages, rounded);

  // The % TEXT on the far right, though, is "progress terhadap total" — this
  // row's own progress × its own weight × its parent's already-cascaded %.
  const shownPercent = displayPercent != null ? displayPercent : rounded;

  const trackWidth = trackWidthForDepth(depth, columnWidth);

  const currentStage = isLeaf
    ? [...sortedStages].reverse().find((s) => rounded >= s.value) || sortedStages[0]
    : null;

  const handleManage = () => {
    onOpenProgressManager(columnId);
    setIsOpen(false);
  };

  // The bar itself is the "actual progress" control: a Task shows its
  // current stage with a transparent native <select> overlaid on top (click
  // anywhere on the bar to change stage, no popup needed); a parent shows
  // its auto-computed rollup as plain text since it has no stage to pick.
  const barTrack = (
    <div
      style={{
        position: "relative",
        width: trackWidth,
        flexShrink: 0,
        height: BAR_HEIGHT,
        borderRadius: 4,
        overflow: "hidden",
        background: "var(--border-color)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          width: `${rounded}%`,
          background: barColor,
          transition: "width 0.2s, background 0.2s",
        }}
      />
      <span
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          paddingLeft: 4,
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 3,
            maxWidth: "100%",
            padding: "1px 5px",
            borderRadius: 3,
            background: "rgba(0,0,0,0.35)",
            fontSize: 10.5,
            fontWeight: 600,
            color: "#fff",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {isLeaf ? (
            <>{currentStage.icon} {currentStage.label} ▾</>
          ) : (
            <>Σ {rounded}%</>
          )}
        </span>
      </span>
      {isLeaf && (
        <select
          value={currentStage.value}
          onChange={(e) => onChange(Number(e.target.value))}
          onClick={(e) => e.stopPropagation()}
          title={currentStage.label}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            opacity: 0,
            cursor: "pointer",
            border: "none",
          }}
        >
          {sortedStages.map((s) => (
            <option key={s.value} value={s.value}>
              {s.icon} {s.label} — {s.value}%
            </option>
          ))}
        </select>
      )}
    </div>
  );

  return (
    <div
      style={wrapperStyle}
      title={!isLeaf ? t("progressCell.cumulativeProgress", { percent: rounded }) : undefined}
    >
      {treeGuides}
      <div style={{ display: "flex", alignItems: "center", width: "100%", padding: "4px 6px 4px 0", gap: 6 }}>
        {barTrack}

        {showWeightField && (
          <InlineWeightBox
            explicitWeight={explicitWeight}
            resolvedWeight={resolvedWeight}
            explicitSiblingSum={explicitSiblingSum}
            onChangeWeight={onChangeWeight}
            weightIncomplete={weightIncomplete}
          />
        )}

        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", minWidth: 30, textAlign: "right", flexShrink: 0 }}>
          {shownPercent}%
        </span>

        <button
          ref={triggerRef}
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen((prev) => !prev);
          }}
          title={t("progressCell.manageStages")}
          style={{
            flexShrink: 0,
            width: 16,
            height: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--text-muted)",
            fontSize: 11,
          }}
        >
          ⚙
        </button>
      </div>

      <Popover anchorRef={triggerRef} isOpen={isOpen} onClose={() => setIsOpen(false)} placement="bottom-end" style={popoverShellStyle}>
        <div
          onClick={handleManage}
          style={{
            padding: "8px 12px",
            fontSize: 12,
            fontWeight: 500,
            color: "var(--text-secondary)",
            cursor: "pointer",
            borderRadius: 4,
            margin: "4px",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <span>📝</span>
          <span>{t("progressCell.manageStages")}</span>
        </div>
      </Popover>
    </div>
  );
}
