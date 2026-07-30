import { useLanguage } from "../context/LanguageContext";
import {
  resolveIndependentWeight,
  computeOwnProgress,
  computeCascadedDisplayPercent,
} from "../utils/progressWeights";

function flattenItems(items) {
  let result = [];
  for (const item of items || []) {
    result.push(item);
    if (item.children && item.children.length > 0) {
      result = result.concat(flattenItems(item.children));
    }
  }
  return result;
}

// Same formula each row already uses to show "progress terhadap total" —
// summed across every top-level item gives the whole board's completion,
// since a depth-0 item's absolute weight is its own share of the implicit
// 100%-wide root (see progressWeights.js).
function computeBoardProgress(items, columnId) {
  let total = 0;
  for (const item of items || []) {
    const ownProgress = computeOwnProgress(item, columnId);
    const weightInfo = resolveIndependentWeight(item, columnId);
    total += computeCascadedDisplayPercent(ownProgress, weightInfo.resolvedWeight, 100);
  }
  return Math.max(0, Math.min(100, Math.round(total)));
}

const cardStyle = {
  background: "var(--bg-modal)",
  border: "1px solid var(--border-color)",
  borderRadius: 8,
  boxShadow: "var(--shadow-sm)",
  padding: "16px 18px",
};

function SummaryCard({ label, value, color }) {
  return (
    <div style={{ ...cardStyle, flex: "1 1 160px", minWidth: 160 }}>
      <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: color || "var(--text-primary)", marginTop: 6 }}>
        {value}
      </div>
    </div>
  );
}

// Hand-rolled donut via stacked stroke-dasharray arcs — no charting
// dependency needed for a handful of static segments.
function DonutChart({ segments, size = 128, thickness = 20 }) {
  const total = segments.reduce((s, seg) => s + seg.count, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--border-color)" strokeWidth={thickness} />
      {total > 0 &&
        segments.map((seg, i) => {
          if (seg.count === 0) return null;
          const fraction = seg.count / total;
          const dash = fraction * circumference;
          const circle = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={thickness}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          );
          offset += dash;
          return circle;
        })}
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        style={{ fontSize: 18, fontWeight: 700, fill: "var(--text-primary)" }}
      >
        {total}
      </text>
    </svg>
  );
}

function Legend({ segments, total }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
      {segments.map((seg) => (
        <div key={seg.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: seg.color, flexShrink: 0 }} />
          <span style={{ color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {seg.label}
          </span>
          <span style={{ marginLeft: "auto", color: "var(--text-muted)", flexShrink: 0 }}>
            {seg.count}{total > 0 ? ` (${Math.round((seg.count / total) * 100)}%)` : ""}
          </span>
        </div>
      ))}
    </div>
  );
}

function StatusBreakdownCard({ column, flatItems, t }) {
  const statuses = column.statuses || {};
  const order = column.statusOrder && column.statusOrder.length > 0 ? column.statusOrder : Object.keys(statuses);

  const counts = {};
  let otherCount = 0;
  flatItems.forEach((item) => {
    const val = item[column.id];
    if (val && statuses[val] !== undefined) {
      counts[val] = (counts[val] || 0) + 1;
    } else {
      otherCount += 1;
    }
  });

  const segments = order
    .map((key) => ({ label: key, count: counts[key] || 0, color: statuses[key] || "#9ca3af" }));
  if (otherCount > 0) {
    segments.push({ label: t("dashboard.other"), count: otherCount, color: "#9ca3af" });
  }
  const total = segments.reduce((s, seg) => s + seg.count, 0);

  return (
    <div style={{ ...cardStyle, flex: "1 1 320px", minWidth: 280 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>
        {column.label}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <DonutChart segments={segments} />
        <Legend segments={segments} total={total} />
      </div>
    </div>
  );
}

function ProgressBreakdownCard({ column, items, flatItems, t }) {
  const boardProgress = computeBoardProgress(items, column.id);
  const stages = column.progressStages || [];

  // Bucket every leaf item's own progress % into the nearest-below stage,
  // same rule ProgressCell uses to decide which stage a % currently reads
  // as (StageList's own selection highlight uses the identical lookup).
  const counts = {};
  stages.forEach((s) => (counts[s.value] = 0));
  flatItems.forEach((item) => {
    const hasChildren = item.children && item.children.length > 0;
    if (hasChildren) return; // rollups aren't a stage of their own
    const own = Math.min(100, Math.max(0, parseInt(item[column.id]) || 0));
    const sorted = [...stages].sort((a, b) => a.value - b.value);
    const match = [...sorted].reverse().find((s) => own >= s.value) || sorted[0];
    if (match) counts[match.value] = (counts[match.value] || 0) + 1;
  });

  const maxCount = Math.max(1, ...Object.values(counts));

  return (
    <div style={{ ...cardStyle, flex: "1 1 320px", minWidth: 280 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{column.label}</div>
        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {t("dashboard.overallProgress")} <strong style={{ color: "var(--text-primary)" }}>{boardProgress}%</strong>
        </div>
      </div>

      <div style={{ height: 8, borderRadius: 4, background: "var(--border-color)", overflow: "hidden", marginBottom: 16 }}>
        <div style={{ width: `${boardProgress}%`, height: "100%", background: "var(--btn-primary-bg)", transition: "width 0.3s" }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {stages.map((s) => (
          <div key={s.value} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: "var(--text-secondary)", width: 90, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {s.icon} {s.label}
            </span>
            <div style={{ flex: 1, height: 8, borderRadius: 4, background: "var(--border-color)", overflow: "hidden" }}>
              <div style={{ width: `${((counts[s.value] || 0) / maxCount) * 100}%`, height: "100%", background: s.color, transition: "width 0.3s" }} />
            </div>
            <span style={{ fontSize: 12, color: "var(--text-muted)", width: 20, textAlign: "right", flexShrink: 0 }}>
              {counts[s.value] || 0}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function GroupBreakdownCard({ items, groups, groupColors, t }) {
  const counts = {};
  groups.forEach((g) => (counts[g] = 0));
  items.forEach((item) => {
    counts[item.group] = (counts[item.group] || 0) + 1;
  });
  const maxCount = Math.max(1, ...Object.values(counts));

  return (
    <div style={{ ...cardStyle, flex: "1 1 320px", minWidth: 280 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>
        {t("dashboard.itemsPerGroup")}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {groups.map((g) => (
          <div key={g} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: "var(--text-secondary)", width: 100, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {g}
            </span>
            <div style={{ flex: 1, height: 8, borderRadius: 4, background: "var(--border-color)", overflow: "hidden" }}>
              <div
                style={{
                  width: `${((counts[g] || 0) / maxCount) * 100}%`,
                  height: "100%",
                  background: groupColors[g] || "#3b82f6",
                  transition: "width 0.3s",
                }}
              />
            </div>
            <span style={{ fontSize: 12, color: "var(--text-muted)", width: 24, textAlign: "right", flexShrink: 0 }}>
              {counts[g] || 0}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard({ items, columns, groups, groupColors }) {
  const { t } = useLanguage();
  const flatItems = flattenItems(items);
  const statusColumns = (columns || []).filter((c) => c && c.type === "status");
  const progressColumns = (columns || []).filter((c) => c && c.type === "progress");

  return (
    <div style={{ padding: "8px 0 40px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <SummaryCard label={t("dashboard.totalItems")} value={flatItems.length} />
        <SummaryCard label={t("dashboard.totalGroups")} value={groups.length} />
        {progressColumns.slice(0, 1).map((col) => (
          <SummaryCard
            key={col.id}
            label={t("dashboard.overallProgress")}
            value={`${computeBoardProgress(items, col.id)}%`}
            color="var(--btn-primary-bg)"
          />
        ))}
      </div>

      {flatItems.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: "center", color: "var(--text-secondary)" }}>
          {t("dashboard.noData")}
        </div>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
          {statusColumns.map((col) => (
            <StatusBreakdownCard key={col.id} column={col} flatItems={flatItems} t={t} />
          ))}
          {progressColumns.map((col) => (
            <ProgressBreakdownCard key={col.id} column={col} items={items} flatItems={flatItems} t={t} />
          ))}
          <GroupBreakdownCard items={items} groups={groups} groupColors={groupColors} t={t} />
        </div>
      )}
    </div>
  );
}
