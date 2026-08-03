import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import Logo from "./Logo";

const FEATURE_KEYS = ["feature1", "feature2", "feature3", "feature4"];
const FEATURE_ICONS = { feature1: "🔄", feature3: "💬", feature4: "🌐" };
const FEATURE_COLORS = { feature1: "#3b82f6", feature2: "#0ea5e9", feature3: "#a855f7", feature4: "#16a34a" };

// Line-chart icon (axis + connected data points trending up) for the
// S-Curve feature card — reads more clearly as "progress chart" at a
// glance than the earlier sigmoid squiggle did.
function SCurveIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24">
      <path d="M3,1 V20 H23" fill="none" stroke="#1f2937" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="5,18 10,9 16,13 21,4" fill="none" stroke="#2563eb" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {[[5, 18], [10, 9], [16, 13], [21, 4]].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={1.8} fill="white" stroke="#2563eb" strokeWidth={1.8} />
      ))}
    </svg>
  );
}

const primaryBtnStyle = {
  padding: "12px 26px",
  background: "var(--btn-primary-bg)",
  color: "var(--btn-primary-text)",
  border: "none",
  borderRadius: 8,
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

export default function LandingPage({ onGetStarted }) {
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        overflowY: "auto",
        overflowX: "hidden",
        background: "var(--bg-primary)",
        color: "var(--text-primary)",
        zIndex: 2000,
      }}
    >
      {/* Mobile-specific overrides — kept as an actual stylesheet rule
          (rather than JS width-detection) since these need to react to
          real viewport width, including on resize/rotate, without a
          re-render. Everything else on this page is inline-styled and
          fine as-is at any width via flex-wrap. */}
      <style>{`
        @media (max-width: 640px) {
          .rcs-landing-nav-actions { flex-wrap: wrap; justify-content: flex-end; row-gap: 8px; }
          .rcs-landing-scurve-float { position: static !important; margin: 16px auto 0; right: auto !important; bottom: auto !important; }
          .rcs-landing-mockup-col { padding-bottom: 0 !important; }
        }
      `}</style>

      {/* Nav bar */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          rowGap: 8,
          padding: "14px 24px",
          background: "var(--bg-primary)",
          borderBottom: "1px solid var(--border-color)",
        }}
      >
        <div style={{ transform: "scale(0.7)", transformOrigin: "left center" }}>
          <Logo width={90} />
        </div>
        <div className="rcs-landing-nav-actions" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={toggleTheme}
            style={{ padding: "6px 10px", background: "var(--bg-hover)", border: "1px solid var(--border-dark)", borderRadius: 6, cursor: "pointer", fontSize: 12.5, color: "var(--text-primary)" }}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          <button
            onClick={() => setLanguage(language === "id" ? "en" : "id")}
            style={{ padding: "6px 10px", background: "var(--bg-hover)", border: "1px solid var(--border-dark)", borderRadius: 6, cursor: "pointer", fontSize: 12.5, color: "var(--text-primary)" }}
          >
            {language === "id" ? "🇬🇧 EN" : "🇮🇩 ID"}
          </button>
          <button
            onClick={() => onGetStarted("signIn")}
            style={{ padding: "8px 14px", background: "none", border: "none", cursor: "pointer", fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)" }}
          >
            {t("landing.ctaSignIn")}
          </button>
          <button onClick={() => onGetStarted("signUp")} style={{ ...primaryBtnStyle, padding: "9px 18px", fontSize: 13.5 }}>
            {t("landing.ctaSignUp")} →
          </button>
        </div>
      </div>

      {/* Hero: two columns on desktop */}
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "56px 24px 40px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 48,
        }}
      >
        <div style={{ flex: "1 1 420px", minWidth: 300 }}>
          <h1 style={{ fontSize: "clamp(32px, 5vw, 50px)", fontWeight: 800, lineHeight: 1.15, marginBottom: 18 }}>
            {t("landing.headline")}
          </h1>
          <p style={{ fontSize: 16.5, color: "var(--text-secondary)", lineHeight: 1.65, marginBottom: 28, maxWidth: 480 }}>
            {t("landing.subheadline")}
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <button onClick={() => onGetStarted("signUp")} style={primaryBtnStyle}>
              {t("landing.ctaSignUp")} →
            </button>
            <button
              onClick={() => onGetStarted("signIn")}
              style={{ padding: "12px 26px", background: "transparent", color: "var(--text-primary)", border: "1px solid var(--border-dark)", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer" }}
            >
              {t("landing.ctaSignIn")}
            </button>
          </div>
          <div style={{ marginTop: 14, fontSize: 12.5, color: "var(--text-muted)" }}>{t("landing.microcopy")}</div>
        </div>

        <div className="rcs-landing-mockup-col" style={{ flex: "1 1 420px", minWidth: 0, maxWidth: 460, position: "relative", paddingBottom: 60 }}>
          {/* The mockup table has several fixed-width columns and doesn't
              meaningfully compress below ~420px — rather than let it force
              the whole page wider than the viewport on a phone, it scrolls
              horizontally within its own card. */}
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <BoardMockup />
          </div>
          <div className="rcs-landing-scurve-float" style={{ position: "absolute", right: -16, bottom: -40 }}>
            <SCurveMockup t={t} label={t("landing.sCurveMockupLabel")} />
          </div>
        </div>
      </div>

      {/* Feature cards */}
      <div
        style={{
          maxWidth: 1100,
          margin: "16px auto 0",
          padding: "24px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
          gap: 18,
        }}
      >
        {FEATURE_KEYS.map((key) => (
          <div
            key={key}
            style={{
              background: "var(--bg-modal)",
              border: "1px solid var(--border-color)",
              borderRadius: 14,
              padding: "22px 20px",
              textAlign: "left",
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                background: `${FEATURE_COLORS[key]}22`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                marginBottom: 14,
              }}
            >
              {key === "feature2" ? <SCurveIcon /> : FEATURE_ICONS[key]}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{t(`landing.${key}Title`)}</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.55 }}>{t(`landing.${key}Desc`)}</div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: "center", padding: "44px 24px 32px", fontSize: 12, color: "var(--text-muted)" }}>
        {t("landing.footer")}
      </div>
    </div>
  );
}

// Stylized, hand-built mock of the board table view (framed like a browser
// window) — stands in for a real product screenshot without needing image
// assets. Mirrors the real table's actual column set (Item/Progress/
// Timeline/Status) plus the multi-level nested sub-item tree, with curved
// connector lines sitting between Item and Progress — same spot and shape
// as the real product's own tree lines, which visually tie each sub-item's
// progress back up into its parent's rolled-up (Σ) total.
const MOCK_TREE = [
  {
    name: "Task 1", progress: 46, timeline: "01 Aug → 30 Sep", status: "Open", statusColor: "#3b82f6",
    children: [
      {
        name: "Sub Task A", progress: 76, timeline: "02 Aug → 19 Aug", status: "On Hold", statusColor: "#f59e0b",
        children: [
          {
            name: "Sub Sub Task", progress: 90, timeline: "02 Aug → 07 Aug", status: "Open", statusColor: "#3b82f6",
            children: [
              { name: "Sub Sub Sub Task a", timeline: "02 Aug → 04 Aug", status: "Stuck", statusColor: "#ef4444", stage: "Execution", stageColor: "#f59e0b", stageProgress: 50 },
              { name: "Sub Sub Sub Task b", timeline: "05 Aug → 07 Aug", status: "On Hold", statusColor: "#f59e0b", stage: "Review", stageColor: "#3b82f6", stageProgress: 80 },
            ],
          },
        ],
      },
      { name: "Sub Task B", timeline: "13 Aug → 19 Aug", status: "Closed", statusColor: "#16a34a", stage: "Completed", stageColor: "#16a34a", stageProgress: 100 },
    ],
  },
  { name: "Task 2", timeline: "18 Aug → 31 Aug", status: null, statusColor: null, stage: "Not Started", stageColor: "#6b7280", stageProgress: 0 },
];

// Flattens the tree into render order, annotating each row with its depth
// and, per ancestor column, whether that ancestor still has a following
// sibling below (so the row knows which columns need a straight pass-
// through line vs. nothing) — the standard "tree printer" algorithm.
// `hasChildren` decides the Progress cell's own display mode: a Σ roll-up
// bar for parents, a stage pill for leaves — matching the real product,
// where only aggregating rows show a percentage bar at all.
function flattenTree(nodes, continues = []) {
  const out = [];
  nodes.forEach((node, i) => {
    const isLast = i === nodes.length - 1;
    const { children, ...rest } = node;
    const hasChildren = !!(children && children.length > 0);
    out.push({ ...rest, depth: continues.length, continues, isLast, hasChildren });
    if (hasChildren) {
      out.push(...flattenTree(children, [...continues, !isLast]));
    }
  });
  return out;
}

const MOCK_ROWS = flattenTree(MOCK_TREE);

function BoardMockup() {
  return (
    <div
      style={{
        borderRadius: 14,
        border: "1px solid var(--border-color)",
        boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
        overflow: "hidden",
        background: "var(--bg-modal)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 14px", borderBottom: "1px solid var(--border-color)" }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b" }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#16a34a" }} />
        <div style={{ flex: 1, marginLeft: 10, height: 18, borderRadius: 5, background: "var(--bg-hover)" }} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderBottom: "1px solid var(--border-color)" }}>
        <span style={{ fontSize: 10, color: "var(--text-muted)" }}>▾</span>
        <span style={{ width: 12, height: 12, borderRadius: 3, background: "#3b82f6" }} />
        <span style={{ fontSize: 12, fontWeight: 700 }}>Default Group</span>
      </div>

      <div style={{ display: "flex", gap: 8, padding: "8px 14px 6px", fontSize: 9, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.3 }}>
        <span style={{ flex: "1 1 auto", textAlign: "center" }}>Item</span>
        <span style={{ width: 130, flexShrink: 0, textAlign: "center" }}>Progress</span>
        <span style={{ width: 84, flexShrink: 0, textAlign: "center" }}>Timeline</span>
        <span style={{ width: 52, flexShrink: 0, textAlign: "center" }}>Status</span>
      </div>

      <div style={{ padding: "0 14px 12px" }}>
        {MOCK_ROWS.map((r) => (
          <MockRow key={r.name} {...r} />
        ))}
      </div>
    </div>
  );
}

const ROW_HEIGHT = 28;
const LEVEL_WIDTH = 14;
// Tree-lane + progress-bar share one fixed total width per row, so the
// bar's right edge always lands at the same x — the deeper the nesting,
// the more of that shared width the tree lines eat into, so the bar
// itself gets shorter (right-aligned "staircase"), matching the real
// product's Progress column.
const PROGRESS_COL_WIDTH = 130;

// Graduated progress-bar fill by percentage level, matching the real
// product's Progress column: low % reads as orange, working up through
// yellow-green, to solid green once it's mostly done — not tied to the
// row's own status color, since a bar's own level is what's meaningful
// here (a stalled 90%-done task should still look "almost there").
function progressLevelColor(pct) {
  if (pct >= 80) return "#22c55e";
  if (pct >= 50) return "#a3e635";
  if (pct > 0) return "#f97316";
  return "#6b7280";
}

function MockRow({ depth, continues, isLast, hasChildren, name, progress, timeline, status, statusColor, stage, stageColor, stageProgress }) {
  const laneWidth = depth > 0 ? depth * LEVEL_WIDTH + 6 : 0;
  const branchX = (depth - 1) * LEVEL_WIDTH + 7;
  const barWidth = PROGRESS_COL_WIDTH - laneWidth;
  // Parents show their rolled-up (Σ) total, colored by level; leaves show
  // their own stage's fill amount, colored by that stage's own color —
  // e.g. "Execution" at 50% isn't "half-good", it's just half through
  // that stage, so it keeps the stage's identity color instead of the
  // level gradient.
  const fillPct = hasChildren ? progress : stageProgress;
  const barColor = hasChildren ? progressLevelColor(progress) : stageColor;
  const barLabel = hasChildren ? `Σ ${progress}%` : stage;

  const LINE_STROKE = "var(--text-muted)";
  const LINE_WIDTH = 1.5;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, height: ROW_HEIGHT, padding: "0", borderBottom: "1px solid var(--border-color)" }}>
      <span style={{ flex: "1 1 auto", minWidth: 0, paddingLeft: depth * 12, fontSize: 11.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {name}
      </span>
      {laneWidth > 0 && (
        // Extends 1px above/below the row's own height so each row's
        // segment overlaps its neighbor by a hair instead of trying to
        // land exactly edge-to-edge — that's what actually guarantees no
        // visible gap where two rows' lines are meant to connect.
        <svg width={laneWidth} height={ROW_HEIGHT + 2} style={{ flexShrink: 0, overflow: "visible", marginTop: -1, marginBottom: -1 }}>
          {/* Only the outermost ancestor lane lines up with a real branch
              column (the leftmost tree indent) — inner ones would land
              between columns with nothing to connect to, so only that one
              is drawn. */}
          {continues[0] && depth > 1 && (
            <line x1={7} y1={-1} x2={7} y2={ROW_HEIGHT + 1} stroke={LINE_STROKE} strokeWidth={LINE_WIDTH} />
          )}
          <path
            d={`M ${branchX} -1 V 13 Q ${branchX} 15 ${branchX + 6} 15 H ${laneWidth}`}
            fill="none"
            stroke={LINE_STROKE}
            strokeWidth={LINE_WIDTH}
          />
          {!isLast && <line x1={branchX} y1={15} x2={branchX} y2={ROW_HEIGHT + 1} stroke={LINE_STROKE} strokeWidth={LINE_WIDTH} />}
        </svg>
      )}
      <div style={{ width: barWidth, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
        <div style={{ width: "100%", height: 18, borderRadius: 4, background: "var(--bg-hover)", overflow: "hidden" }}>
          <div style={{ width: `${fillPct}%`, height: "100%", background: barColor, opacity: 0.9, display: "flex", alignItems: "center", paddingLeft: 5 }}>
            <span style={{ fontSize: 8, fontWeight: 700, color: "#1a1a1a", whiteSpace: "nowrap" }}>{barLabel}</span>
          </div>
        </div>
      </div>
      <span style={{ width: 84, flexShrink: 0, textAlign: "center", fontSize: 8.5, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {timeline}
      </span>
      {status ? (
        <span style={{ width: 52, flexShrink: 0, textAlign: "center", fontSize: 9, fontWeight: 600, color: "#fff", background: statusColor, borderRadius: 4, padding: "3px 0" }}>
          {status}
        </span>
      ) : (
        <span style={{ width: 52, flexShrink: 0, textAlign: "center", fontSize: 9, color: "var(--text-muted)", background: "var(--bg-hover)", borderRadius: 4, padding: "3px 0" }}>
          –
        </span>
      )}
    </div>
  );
}

// Small floating card previewing the S-curve feature — same idea as the
// board mockup (hand-built, no image asset), styled to overlap the main
// mockup's corner the way monday.com's own landing page layers little
// feature callouts over its main screenshot.
function SCurveMockup({ t, label }) {
  return (
    <div
      style={{
        width: 210,
        borderRadius: 12,
        border: "1px solid var(--border-color)",
        boxShadow: "0 16px 40px rgba(0,0,0,0.3)",
        background: "var(--bg-modal)",
        padding: "12px 14px 10px",
      }}
    >
      <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6 }}>{label}</div>
      <svg width="100%" viewBox="0 0 180 90" style={{ display: "block" }}>
        <path d="M8,80 C45,20 90,11 172,10" fill="none" stroke="#16a34a" strokeWidth={2.5} strokeLinecap="round" />
        <path d="M8,80 C60,80 90,15 172,10" fill="none" stroke="#f59e0b" strokeWidth={2.5} strokeLinecap="round" />
        <path d="M8,80 C115,80 135,20 172,10" fill="none" stroke="#ef4444" strokeWidth={2.5} strokeLinecap="round" />
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 6 }}>
        <LegendSwatch color="#16a34a" label={t("landing.sCurveShapeGood")} />
        <LegendSwatch color="#f59e0b" label={t("landing.sCurveShapeTypical")} />
        <LegendSwatch color="#ef4444" label={t("landing.sCurveShapeRisk")} />
      </div>
    </div>
  );
}

function LegendSwatch({ color, dashed, label }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9.5, color: "var(--text-muted)" }}>
      <span style={{ width: 12, height: 0, borderTop: `2px ${dashed ? "dashed" : "solid"} ${color}` }} />
      {label}
    </span>
  );
}
