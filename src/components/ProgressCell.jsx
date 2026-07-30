import { useState, useRef } from "react";
import Popover from "./Popover";
import TreeGuides, { INDENT_SIZE } from "./TreeGuides";
import { computeWeightedProgress } from "../utils/progressWeights";

const FALLBACK_STAGES = [{ value: 0, label: "Not Started", icon: "🔘", color: "#9E9E9E" }];

// Every row's bar ends at the same fixed point (the column's own width,
// minus room for the % label and cell padding) — only the *start* moves,
// pushed right by exactly the same amount the tree guide's indent already
// consumes. So the track shrinks by INDENT_SIZE per level (matching
// TreeGuides, not an arbitrary amount) purely as a side effect of a fixed
// end, the same way indenting text in an editor leaves the right margin
// where it was. Deriving the end from the column's actual (resizable)
// width — rather than a flat constant — is what keeps the bar inside the
// cell instead of overflowing into the next column once it's resized
// narrower.
const DEFAULT_COLUMN_WIDTH = 220;
// Cell padding (8px) + button padding (6px) + gap (6px) + % label
// (~36px) — the horizontal space around the track that isn't track.
const RESERVED_SPACE = 56;
const MIN_TRACK_WIDTH = 40;
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

function SectionLabel({ children }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: "var(--text-muted)",
        padding: "0 12px",
        marginBottom: 6,
      }}
    >
      {children}
    </div>
  );
}

// Top-of-popover summary: this row's own % (big, colored) with a mini bar,
// plus — only when it actually differs, so simple single-item boards don't
// see redundant noise — how much that's worth once weight dilutes it down
// to a share of the grand total.
function ProgressSummary({ rounded, shownPercent, barColor, icon, label, note }) {
  const showsContribution = shownPercent != null && shownPercent !== rounded;
  return (
    <div style={{ padding: "10px 12px 12px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
          {icon && <span style={{ fontSize: 14, lineHeight: 1 }}>{icon}</span>}
          <span
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              color: "var(--text-secondary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </span>
        </div>
        <span style={{ fontSize: 22, fontWeight: 700, color: barColor, flexShrink: 0, lineHeight: 1 }}>
          {rounded}%
        </span>
      </div>

      <div style={{ marginTop: 8, height: 6, borderRadius: 3, background: "var(--border-color)", overflow: "hidden" }}>
        <div
          style={{
            width: `${rounded}%`,
            height: "100%",
            background: barColor,
            borderRadius: 3,
            transition: "width 0.2s",
          }}
        />
      </div>

      {note && (
        <div style={{ marginTop: 7, fontSize: 11, color: "var(--text-muted)" }}>{note}</div>
      )}

      {showsContribution && (
        <div
          style={{
            marginTop: 6,
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontSize: 11,
            color: "var(--text-secondary)",
            background: "var(--bg-hover)",
            borderRadius: 5,
            padding: "5px 8px",
          }}
        >
          <span style={{ opacity: 0.7 }}>→</span>
          <span>
            Counts as <strong style={{ color: "var(--text-primary)" }}>{shownPercent}%</strong> of the overall total
          </span>
        </div>
      )}
    </div>
  );
}

// Selectable list of stages. Only the active stage gets full color + a
// checkmark; the rest stay as a plain, low-noise list with a small color
// dot — easier to scan than a wall of solid-colored blocks.
function StageList({ stages, currentValue, onSelect }) {
  return (
    <div style={{ padding: "0 6px" }}>
      {stages.map((stage) => {
        const isSelected = stage.value === currentValue;
        return (
          <button
            key={stage.value}
            onClick={() => onSelect(stage.value)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
              background: isSelected ? stage.color : "transparent",
              color: isSelected ? "#fff" : "var(--text-primary)",
              border: "none",
              padding: "7px 8px",
              borderRadius: 6,
              marginBottom: 2,
              fontSize: 12.5,
              fontWeight: isSelected ? 600 : 500,
              cursor: "pointer",
              textAlign: "left",
              transition: "background 0.12s ease",
            }}
            onMouseEnter={(e) => {
              if (!isSelected) e.currentTarget.style.background = "var(--bg-hover)";
            }}
            onMouseLeave={(e) => {
              if (!isSelected) e.currentTarget.style.background = "transparent";
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: isSelected ? "#fff" : stage.color,
                flexShrink: 0,
              }}
            />
            <span style={{ flexShrink: 0 }}>{stage.icon}</span>
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {stage.label}
            </span>
            <span style={{ opacity: isSelected ? 0.95 : 0.6, fontSize: 11.5, flexShrink: 0 }}>
              {stage.value}%
            </span>
            {isSelected && <span style={{ fontSize: 11, flexShrink: 0 }}>✓</span>}
          </button>
        );
      })}
    </div>
  );
}

// "Weight" = how much of the immediate parent's 100% this row accounts for
// — separate from its own completion %. Depth-0 rows are the exception:
// their "parent" is the ITEM level itself, not each other, so each
// top-level item independently gets up to 100% rather than splitting a
// pool with its depth-0 siblings. For depth > 0, validated against the sum
// of siblings' *explicit* weights so a group can never be configured to
// exceed 100%.
function WeightControl({ explicitWeight, resolvedWeight, explicitSiblingSum, onChangeWeight, depth }) {
  const [draft, setDraft] = useState(explicitWeight != null ? String(explicitWeight) : "");
  const isDefault = explicitWeight == null;
  const sliderValue = draft.trim() !== "" ? Math.min(100, Math.max(0, parseInt(draft, 10) || 0)) : Math.round(resolvedWeight);

  const commitValue = (n) => {
    n = Math.min(100, Math.max(0, n));
    if (n + explicitSiblingSum > 100) {
      alert(
        `Total weight of sibling items would be ${n + explicitSiblingSum}% (over 100%). ` +
        `Reduce this value or adjust the other sibling(s) first.`
      );
      setDraft(explicitWeight != null ? String(explicitWeight) : "");
      return;
    }
    onChangeWeight(n);
  };

  const commit = () => {
    if (draft.trim() === "") {
      onChangeWeight(null); // back to auto/default
      return;
    }
    let n = parseInt(draft, 10);
    if (isNaN(n)) n = 0;
    commitValue(n);
  };

  const handleSlider = (e) => {
    const n = parseInt(e.target.value, 10);
    setDraft(String(n));
    commitValue(n);
  };

  const resetToDefault = () => {
    setDraft("");
    onChangeWeight(null);
  };

  return (
    <div style={{ padding: "8px 12px 10px" }} onClick={(e) => e.stopPropagation()}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11.5, color: "var(--text-secondary)" }}>
          {depth > 0 ? "Share of parent" : "Share of this item"}
        </span>
        <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
          {isDefault ? "auto" : "manual"}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
        <input
          type="range"
          min={0}
          max={100}
          value={sliderValue}
          onChange={handleSlider}
          style={{ flex: 1, accentColor: "var(--btn-primary-bg)", cursor: "pointer" }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
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
            style={{
              width: 40,
              padding: "3px 4px",
              fontSize: 12,
              border: "1px solid var(--border-dark)",
              borderRadius: 4,
              outline: "none",
              background: "var(--bg-input)",
              color: "var(--text-primary)",
              textAlign: "right",
              MozAppearance: "textfield",
            }}
          />
          <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>%</span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 5 }}>
        <span style={{ fontSize: 10.5, color: "var(--text-muted)" }}>
          {isDefault
            ? depth > 0
              ? "Default — split evenly among unset siblings"
              : "Default — full weight, independent of other items"
            : "Set manually"}
        </span>
        {!isDefault && (
          <button
            onClick={resetToDefault}
            style={{
              fontSize: 10.5,
              color: "var(--btn-primary-bg)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}

function Divider() {
  return <div style={{ borderTop: "1px solid var(--border-color)", margin: "2px 0" }} />;
}

const popoverShellStyle = {
  background: "var(--bg-modal)",
  border: "1px solid var(--border-color)",
  borderRadius: 8,
  boxShadow: "var(--shadow-md)",
  padding: "4px 0",
  minWidth: 250,
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
  onChangeWeight,
  onOpenProgressManager,
  displayPercent,
  groupColor,
  expanded = true,
  columnWidth,
}) {
  const safeStages = stages && stages.length > 0 ? stages : FALLBACK_STAGES;
  const sortedStages = [...safeStages].sort((a, b) => a.value - b.value);

  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);

  const hasChildren = itemChildren && itemChildren.length > 0;
  const showWeightField = typeof onChangeWeight === "function";

  // Same L-shaped connectors as the ITEM column, so the bar's nesting reads
  // as a direct visual echo of the item tree instead of a flat list of
  // unrelated percentages.
  // height: 100% (matched with zero vertical padding on the <td> itself,
  // set in Row.jsx) lets the tree guide's vertical line — a stretch-aligned
  // flex sibling below — run the row's full height, so it touches the
  // border above/below and reads as one continuous line across rows
  // instead of a segment that stops short each time.
  // position: relative so TreeGuides' childStub (an absolutely positioned
  // overlay, not a flex slot — see its own comment) anchors to this row's
  // own box rather than some further-out ancestor.
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

  // The % TEXT shown, though, is "progress terhadap total" — this row's own
  // progress × its own weight × its parent's *already-cascaded* %, computed
  // top-down in Row.jsx (a child needs its parent's already-computed value,
  // which only that top-down render pass has). Root rows (depth 0) show
  // their own progress untouched.
  const shownPercent = displayPercent != null ? displayPercent : rounded;

  const trackWidth = trackWidthForDepth(depth, columnWidth);

  const bar = (
    <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
      <div
        style={{
          width: trackWidth,
          flexShrink: 0,
          height: 6,
          background: "var(--border-color)",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${rounded}%`,
            height: "100%",
            background: barColor,
            borderRadius: 3,
            transition: "width 0.2s, background 0.2s",
          }}
        />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", minWidth: 32 }}>
        {shownPercent}%
      </span>
    </div>
  );

  // ============================================================
  // PARENT DENGAN CHILDREN — progress read-only (gradasi warna dari
  // komulatif Task), tapi weight-nya sendiri (porsi ke parent-nya sendiri)
  // tetap bisa diatur lewat popover kecil.
  // ============================================================
  if (hasChildren) {
    if (!showWeightField) {
      return (
        <div title={`Cumulative progress from sub-items: ${rounded}%`} style={{ ...wrapperStyle, cursor: "default" }}>
          {treeGuides}
          {bar}
        </div>
      );
    }

    return (
      <div style={wrapperStyle}>
        {treeGuides}
        <button
          ref={triggerRef}
          onClick={() => setIsOpen((prev) => !prev)}
          title={`Cumulative progress from sub-items: ${rounded}% — click to set this item's weight`}
          style={{ display: "flex", alignItems: "center", width: "100%", padding: "4px 6px 4px 0", background: "transparent", border: "none", cursor: "pointer" }}
        >
          {bar}
        </button>

        <Popover anchorRef={triggerRef} isOpen={isOpen} onClose={() => setIsOpen(false)} placement="bottom-start" style={popoverShellStyle}>
          <ProgressSummary
            rounded={rounded}
            shownPercent={shownPercent}
            barColor={barColor}
            icon="Σ"
            label="Auto-calculated from sub-items"
            note="This item's own progress follows its sub-items — only its weight can be set here."
          />
          <Divider />
          <SectionLabel>Weight</SectionLabel>
          <WeightControl
            explicitWeight={explicitWeight}
            resolvedWeight={resolvedWeight}
            explicitSiblingSum={explicitSiblingSum}
            onChangeWeight={onChangeWeight}
            depth={depth}
          />
        </Popover>
      </div>
    );
  }

  // ============================================================
  // TASK (leaf) — pilih tahapan, plus weight (porsi ke parent-nya)
  // ============================================================
  const currentStage = [...sortedStages].reverse().find((s) => rounded >= s.value) || sortedStages[0];

  const handleSelect = (stageValue) => {
    onChange(stageValue);
    setIsOpen(false);
  };

  const handleManage = () => {
    onOpenProgressManager(columnId);
    setIsOpen(false);
  };

  return (
    <div style={wrapperStyle}>
      {treeGuides}
      <button
        ref={triggerRef}
        onClick={() => setIsOpen((prev) => !prev)}
        title={currentStage.label}
        style={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          padding: "4px 6px 4px 0",
          background: "transparent",
          border: "none",
          cursor: "pointer",
        }}
      >
        {bar}
      </button>

      <Popover anchorRef={triggerRef} isOpen={isOpen} onClose={() => setIsOpen(false)} placement="bottom-start" style={popoverShellStyle}>
        <ProgressSummary
          rounded={rounded}
          shownPercent={shownPercent}
          barColor={barColor}
          icon={currentStage.icon}
          label={currentStage.label}
        />
        <Divider />
        <SectionLabel>Stage</SectionLabel>
        <StageList stages={sortedStages} currentValue={currentStage.value} onSelect={handleSelect} />

        {showWeightField && (
          <>
            <Divider />
            <SectionLabel>Weight</SectionLabel>
            <WeightControl
              explicitWeight={explicitWeight}
              resolvedWeight={resolvedWeight}
              explicitSiblingSum={explicitSiblingSum}
              onChangeWeight={onChangeWeight}
              depth={depth}
            />
          </>
        )}

        <Divider />
        <div
          onClick={handleManage}
          style={{
            padding: "8px 12px",
            fontSize: 12,
            fontWeight: 500,
            color: "var(--text-secondary)",
            cursor: "pointer",
            borderRadius: 4,
            margin: "0 4px",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <span>📝</span>
          <span>Manage stages...</span>
        </div>
      </Popover>
    </div>
  );
}
