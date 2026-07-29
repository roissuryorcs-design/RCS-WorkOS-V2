import { useState, useRef } from "react";
import Popover from "./Popover";
import TreeGuides from "./TreeGuides";
import { computeWeightedProgress } from "../utils/progressWeights";

const FALLBACK_STAGES = [{ value: 0, label: "Not Started", icon: "🔘", color: "#9E9E9E" }];

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

// "Weight" = how much of the immediate parent's 100% this row accounts for
// — separate from its own completion %. Only meaningful for rows that have
// a parent (depth > 0). Validated against the sum of siblings' *explicit*
// weights so a group can never be configured to exceed 100%.
function WeightField({ explicitWeight, resolvedWeight, explicitSiblingSum, onChangeWeight, progressInfo }) {
  const [draft, setDraft] = useState(explicitWeight != null ? String(explicitWeight) : "");

  const commit = () => {
    if (draft.trim() === "") {
      onChangeWeight(null); // back to auto/even split
      return;
    }
    let n = parseInt(draft, 10);
    if (isNaN(n)) n = 0;
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

  return (
    <div style={{ padding: "6px 10px" }} onClick={(e) => e.stopPropagation()}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)", flex: 1 }}>
          Weight (share of parent)
        </span>
        <input
          type="number"
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
            width: 52,
            padding: "3px 6px",
            fontSize: 12,
            border: "1px solid var(--border-dark)",
            borderRadius: 4,
            outline: "none",
            background: "var(--bg-input)",
            color: "var(--text-primary)",
            textAlign: "right",
          }}
        />
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>%</span>
      </div>
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
        {explicitWeight != null
          ? `Currently: ${explicitWeight}% (set manually)`
          : `Currently: ${Math.round(resolvedWeight)}% (auto — split evenly among sibling items left unset)`}
      </div>
      {progressInfo && (
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
          {progressInfo}
        </div>
      )}
    </div>
  );
}

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
}) {
  const safeStages = stages && stages.length > 0 ? stages : FALLBACK_STAGES;
  const sortedStages = [...safeStages].sort((a, b) => a.value - b.value);

  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);

  const hasChildren = itemChildren && itemChildren.length > 0;
  const showWeightField = depth > 0 && typeof onChangeWeight === "function";

  // Same L-shaped connectors as the ITEM column, so the bar's nesting reads
  // as a direct visual echo of the item tree instead of a flat list of
  // unrelated percentages.
  const wrapperStyle = { display: "flex", alignItems: "center", width: "100%" };
  const treeGuides = (
    <TreeGuides depth={depth} ancestorLines={ancestorLines} isLastChild={isLastChild} color="var(--text-secondary)" thickness={1.5} />
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

  const bar = (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 0 }}>
      <div
        style={{
          flex: 1,
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

  const weightPopoverSection = (progressInfo) => showWeightField && (
    <WeightField
      explicitWeight={explicitWeight}
      resolvedWeight={resolvedWeight}
      explicitSiblingSum={explicitSiblingSum}
      onChangeWeight={onChangeWeight}
      progressInfo={progressInfo}
    />
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
          style={{ display: "flex", alignItems: "center", width: "100%", padding: "4px 2px", background: "transparent", border: "none", cursor: "pointer" }}
        >
          {bar}
        </button>

        <Popover
          anchorRef={triggerRef}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          placement="bottom-start"
          style={{
            background: "var(--bg-modal)",
            border: "1px solid var(--border-color)",
            borderRadius: 6,
            boxShadow: "var(--shadow-md)",
            padding: "4px 0 8px",
            minWidth: 220,
          }}
        >
          <div style={{ padding: "2px 10px 6px", fontSize: 12, color: "var(--text-muted)", borderBottom: "1px solid var(--border-color)" }}>
            Only this item's own weight can be set — its progress is auto-calculated from sub-items.
          </div>
          {weightPopoverSection(`Currently progress: ${rounded}% (auto-calculated from sub-items)`)}
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
          padding: "4px 2px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
        }}
      >
        {bar}
      </button>

      <Popover
        anchorRef={triggerRef}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        placement="bottom-start"
        style={{
          background: "var(--bg-modal)",
          border: "1px solid var(--border-color)",
          borderRadius: 6,
          boxShadow: "var(--shadow-md)",
          padding: 4,
          minWidth: 180,
        }}
      >
        {!showWeightField && (
          <div style={{ padding: "4px 10px 6px", fontSize: 11, color: "var(--text-muted)" }}>
            Currently progress: {rounded}% ({currentStage.label})
          </div>
        )}
        {sortedStages.map((stage) => (
          <div
            key={stage.value}
            onClick={() => handleSelect(stage.value)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: stage.color,
              color: "white",
              padding: "6px 10px",
              borderRadius: 4,
              marginBottom: 2,
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              transition: "filter 0.12s ease, box-shadow 0.12s ease",
              outline: stage.value === currentStage.value ? "2px solid var(--text-primary)" : "none",
              outlineOffset: "-2px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = "brightness(1.15)";
              e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.25)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = "none";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <span>{stage.icon}</span>
            <span style={{ flex: 1 }}>{stage.label}</span>
            <span style={{ opacity: 0.9 }}>{stage.value}%</span>
          </div>
        ))}

        {showWeightField && (
          <div style={{ borderTop: "1px solid var(--border-color)", marginTop: 4 }}>
            {weightPopoverSection(`Currently progress: ${rounded}% (${currentStage.label})`)}
          </div>
        )}

        <div
          onClick={handleManage}
          style={{
            marginTop: 4,
            paddingTop: 6,
            borderTop: "1px solid var(--border-color)",
            padding: "6px 10px",
            fontSize: 12,
            fontWeight: 400,
            color: "var(--text-primary)",
            cursor: "pointer",
            borderRadius: 4,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          📝 Manage Progress Stages...
        </div>
      </Popover>
    </div>
  );
}
