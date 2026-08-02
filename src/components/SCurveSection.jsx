import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../lib/supabaseClient";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { computeBoardProgress } from "../utils/progressWeights";
import { parseDateValue } from "../utils/formulaEngine";
import { millerBaseline, fitGompertz, gompertz, forecastCompletionX, shiftForPoint } from "../utils/sCurve";

const cardStyle = {
  background: "var(--bg-modal)",
  border: "1px solid var(--border-color)",
  borderRadius: 8,
  boxShadow: "var(--shadow-sm)",
  padding: "16px 18px",
};

function toDateStr(d) {
  return d.toISOString().slice(0, 10);
}

function daysBetween(a, b) {
  return (new Date(b) - new Date(a)) / (1000 * 60 * 60 * 24);
}

function percentElapsed(date, startDate, endDate) {
  const total = daysBetween(startDate, endDate);
  if (total <= 0) return 0;
  return (daysBetween(startDate, date) / total) * 100;
}

function dateAtPercent(pct, startDate, endDate) {
  const total = daysBetween(startDate, endDate);
  const d = new Date(startDate);
  d.setDate(d.getDate() + Math.round((pct / 100) * total));
  return d;
}

function flattenItems(items) {
  let result = [];
  for (const item of items || []) {
    result.push(item);
    if (item.children && item.children.length > 0) result = result.concat(flattenItems(item.children));
  }
  return result;
}

// Project date range comes from the chosen Timeline column's data, not a
// separately-typed date: earliest start across every item that has one,
// latest end across every item that has one.
function deriveDateRange(items, timelineColumnId) {
  const flat = flattenItems(items);
  let start = null;
  let end = null;
  for (const item of flat) {
    const tl = item[timelineColumnId];
    if (!tl || typeof tl !== "object") continue;
    const s = parseDateValue(tl.start);
    const e = parseDateValue(tl.end);
    if (s && (!start || s < start)) start = s;
    if (e && (!end || e > end)) end = e;
  }
  return { start, end };
}

export default function SCurveSection({ boardId, items, groups, progressColumns, timelineColumns }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [boardTitle, setBoardTitle] = useState("");
  const [progressColumnId, setProgressColumnId] = useState(null);
  const [timelineColumnId, setTimelineColumnId] = useState(null);
  const [groupScope, setGroupScope] = useState(null); // null = whole board
  const [shift, setShift] = useState(0);
  const [snapshots, setSnapshots] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null); // {point, prevPoint} for the snapshot-detail popup
  const [formProgressCol, setFormProgressCol] = useState("");
  const [formTimelineCol, setFormTimelineCol] = useState("");
  const [formGroupScope, setFormGroupScope] = useState("");
  const [formShift, setFormShift] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const [{ data: board, error: boardError }, { data: snaps, error: snapError }, { data: nodeData }] = await Promise.all([
        supabase.from("boards").select("title, s_curve_progress_column_id, s_curve_timeline_column_id, s_curve_shift, s_curve_group_name").eq("id", boardId).single(),
        supabase.from("board_progress_snapshots").select("snapshot_date, actual_progress").eq("board_id", boardId).order("snapshot_date"),
        // Fallback source when title was never set (e.g. legacy-imported
        // boards whose old in-page title was left blank) — the sidebar
        // name is a far more useful default than a generic placeholder.
        supabase.from("nodes").select("name").eq("id", boardId).single(),
      ]);
      if (cancelled) return;
      if (boardError) console.error("Error loading S-curve settings:", boardError);
      if (snapError) console.error("Error loading progress snapshots:", snapError);
      if (board) {
        const fallbackTitle = (nodeData && nodeData.name) || t("defaults.boardTitle");
        setBoardTitle(board.title && board.title.trim() !== "" ? board.title : fallbackTitle);
        setProgressColumnId(board.s_curve_progress_column_id);
        setTimelineColumnId(board.s_curve_timeline_column_id);
        setGroupScope(board.s_curve_group_name || null);
        setShift(board.s_curve_shift ?? 0);
        setFormProgressCol(board.s_curve_progress_column_id || progressColumns[0]?.id || "");
        setFormTimelineCol(board.s_curve_timeline_column_id || timelineColumns[0]?.id || "");
        setFormGroupScope(board.s_curve_group_name || "");
        setFormShift(board.s_curve_shift ?? 0);
      }
      setSnapshots(snaps || []);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);

  // Scoping to a group just narrows which top-level items feed the date
  // range + progress calc — items already carry their group name as a
  // plain string, same as everywhere else in the app.
  const scopedItems = useMemo(
    () => (groupScope ? (items || []).filter((i) => i.group === groupScope) : items),
    [items, groupScope]
  );

  const isConfigured = !!(progressColumnId && timelineColumnId);
  const { start: startDate, end: endDate } = useMemo(
    () => (isConfigured ? deriveDateRange(scopedItems, timelineColumnId) : { start: null, end: null }),
    [isConfigured, scopedItems, timelineColumnId]
  );
  const hasDateRange = !!(startDate && endDate && endDate > startDate);
  const currentProgress = isConfigured ? computeBoardProgress(scopedItems, progressColumnId) : 0;

  const chart = useMemo(() => {
    if (!hasDateRange) return null;
    const maxX = 130;

    const baseline = [];
    for (let x = 0; x <= 100; x += 1) baseline.push({ x, y: millerBaseline(x, shift) });

    const actual = snapshots
      .map((s) => ({ x: percentElapsed(new Date(s.snapshot_date), startDate, endDate), y: s.actual_progress, date: s.snapshot_date }))
      .filter((p) => Number.isFinite(p.x))
      .sort((a, b) => a.x - b.x);

    let forecast = null;
    let forecastCompletionDate = null;
    if (actual.length >= 2) {
      const params = fitGompertz(actual);
      if (params) {
        forecast = [];
        const lastX = actual[actual.length - 1].x;
        for (let x = lastX; x <= maxX; x += 2) forecast.push({ x, y: Math.min(105, gompertz(x, params)) });
        const completionX = forecastCompletionX(params);
        if (completionX && completionX > 0 && completionX < 365) {
          forecastCompletionDate = dateAtPercent(completionX, startDate, endDate);
        }
      }
    }

    return { baseline, actual, forecast, forecastCompletionDate, maxX };
  }, [hasDateRange, shift, snapshots, startDate, endDate]);

  const todaySnapshot = snapshots.find((s) => s.snapshot_date === toDateStr(new Date()));

  // Most recent recorded value before today — the baseline "change" is
  // measured against, so a flat/unedited day doesn't get force-recorded
  // the moment the board loads.
  const priorValue = useMemo(() => {
    const todayStr = toDateStr(new Date());
    const prior = snapshots.filter((s) => s.snapshot_date < todayStr);
    return prior.length > 0 ? prior[prior.length - 1].actual_progress : null;
  }, [snapshots]);

  // Ticks every 5 min so the 6pm cutoff below gets re-checked even on a
  // day with zero item edits (no other state change would otherwise
  // re-run the effect).
  const [autoTick, setAutoTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setAutoTick((n) => n + 1), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // Today's "Aktual" point auto-follows the chosen Progress column: any
  // real change to it is recorded the moment it's read (any time of
  // day, including after 6pm) — but if nothing changes at all, the day
  // still gets a data point, committed at 6pm with whatever value reads
  // at that time. This replaces having to remember to click "record"
  // every day; the manual button below stays as an explicit override.
  useEffect(() => {
    if (!isConfigured || !hasDateRange || !user) return;
    const rounded = Math.round(currentProgress);
    if (!Number.isFinite(rounded)) return;
    const todayStr = toDateStr(new Date());
    const isPast6PM = new Date().getHours() >= 18;

    const changedFromRecorded = todaySnapshot ? todaySnapshot.actual_progress !== rounded : priorValue !== rounded;
    const shouldWrite = todaySnapshot ? changedFromRecorded : changedFromRecorded || isPast6PM;
    if (!shouldWrite) return;

    supabase
      .from("board_progress_snapshots")
      .upsert({ board_id: boardId, snapshot_date: todayStr, actual_progress: rounded, created_by: user.id }, { onConflict: "board_id,snapshot_date" })
      .then(({ error }) => {
        if (error) {
          console.error("Error auto-recording snapshot:", error);
          return;
        }
        setSnapshots((prev) => {
          const next = prev.filter((s) => s.snapshot_date !== todayStr);
          next.push({ snapshot_date: todayStr, actual_progress: rounded });
          return next.sort((a, b) => (a.snapshot_date < b.snapshot_date ? -1 : 1));
        });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProgress, todaySnapshot, priorValue, isConfigured, hasDateRange, user, boardId, autoTick]);

  // Baseline snaps to touch the latest recorded actual point — on mount
  // (so a refresh always re-anchors to whatever's latest, discarding any
  // stale manually-dragged shift from a previous session) and again
  // whenever a new snapshot lands (including the 6pm auto-record above,
  // since that just adds to `snapshots` like any other write). Manual
  // dragging afterward still works freely — it doesn't touch `snapshots`,
  // so it can't re-trigger this. shiftForPoint already clamps to the
  // nearest reachable shift when the exact point is outside what the
  // Miller curve can express, so this never throws or produces NaN.
  const lastAutoSnapKeyRef = useRef(null);
  useEffect(() => {
    if (!hasDateRange || !chart || chart.actual.length === 0) return;
    const last = chart.actual[chart.actual.length - 1];
    const key = `${last.date}:${last.y}`;
    if (lastAutoSnapKeyRef.current === key) return;
    lastAutoSnapKeyRef.current = key;
    const snappedShift = shiftForPoint(Math.min(100, last.x), last.y);
    setShift(snappedShift);
    setFormShift(snappedShift);
    supabase
      .from("boards")
      .update({ s_curve_shift: snappedShift })
      .eq("id", boardId)
      .then(({ error }) => {
        if (error) console.error("Error auto-snapping baseline shift:", error);
      });
  }, [hasDateRange, chart, boardId]);

  const handleSaveSettings = async () => {
    if (!formProgressCol || !formTimelineCol) return;
    setSaving(true);
    const { error } = await supabase
      .from("boards")
      .update({
        s_curve_progress_column_id: formProgressCol,
        s_curve_timeline_column_id: formTimelineCol,
        s_curve_group_name: formGroupScope || null,
        s_curve_shift: formShift,
      })
      .eq("id", boardId);
    setSaving(false);
    if (error) {
      console.error("Error saving S-curve settings:", error);
      alert(t("sCurve.saveFailed"));
      return;
    }
    setProgressColumnId(formProgressCol);
    setTimelineColumnId(formTimelineCol);
    setGroupScope(formGroupScope || null);
    setShift(formShift);
    setShowSettings(false);
  };

  // Dragging the baseline directly in the chart updates `shift` live (for
  // instant visual feedback as the curve reshapes) and persists only once
  // the drag ends — same field the settings-modal slider controls, just a
  // second, more direct way to set it ("grab the shape and pull it").
  const handleShiftDrag = (newShift) => setShift(newShift);
  const handleShiftDragEnd = async (newShift) => {
    setFormShift(newShift);
    const { error } = await supabase.from("boards").update({ s_curve_shift: newShift }).eq("id", boardId);
    if (error) console.error("Error saving baseline shift:", error);
  };

  const handleRecordSnapshot = async () => {
    const input = prompt(t("sCurve.recordPrompt"), String(Math.round(currentProgress)));
    if (input === null) return;
    const value = Math.max(0, Math.min(100, parseFloat(input)));
    if (!Number.isFinite(value)) return;
    const dateStr = toDateStr(new Date());
    const { error } = await supabase
      .from("board_progress_snapshots")
      .upsert({ board_id: boardId, snapshot_date: dateStr, actual_progress: value, created_by: user.id }, { onConflict: "board_id,snapshot_date" });
    if (error) {
      console.error("Error recording snapshot:", error);
      alert(t("sCurve.recordFailed"));
      return;
    }
    setSnapshots((prev) => {
      const next = prev.filter((s) => s.snapshot_date !== dateStr);
      next.push({ snapshot_date: dateStr, actual_progress: value });
      return next.sort((a, b) => (a.snapshot_date < b.snapshot_date ? -1 : 1));
    });
  };

  if (loading) return null;

  if (progressColumns.length === 0 || timelineColumns.length === 0) {
    return (
      <div style={{ ...cardStyle, textAlign: "center", color: "var(--text-secondary)", fontSize: 13 }}>
        {t("sCurve.needColumnsHint")}
      </div>
    );
  }

  if (!isConfigured) {
    return (
      <div style={{ ...cardStyle, textAlign: "center" }}>
        <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 10 }}>{t("sCurve.notSetHint")}</div>
        <button onClick={() => setShowSettings(true)} style={primaryBtnStyle}>
          {t("sCurve.setupBtn")}
        </button>
        {showSettings && (
          <SettingsModal
            t={t}
            groups={groups}
            progressColumns={progressColumns}
            timelineColumns={timelineColumns}
            formProgressCol={formProgressCol}
            formTimelineCol={formTimelineCol}
            formGroupScope={formGroupScope}
            formShift={formShift}
            setFormProgressCol={setFormProgressCol}
            setFormTimelineCol={setFormTimelineCol}
            setFormGroupScope={setFormGroupScope}
            setFormShift={setFormShift}
            onSave={handleSaveSettings}
            onClose={() => setShowSettings(false)}
            saving={saving}
          />
        )}
      </div>
    );
  }

  if (!hasDateRange) {
    return (
      <div style={{ ...cardStyle, textAlign: "center", color: "var(--text-secondary)", fontSize: 13 }}>
        {t("sCurve.noTimelineDataHint")}
        <div style={{ marginTop: 10 }}>
          <button onClick={() => setShowSettings(true)} style={smallBtnStyle}>
            {t("sCurve.settingsBtn")}
          </button>
        </div>
        {showSettings && (
          <SettingsModal
            t={t}
            groups={groups}
            progressColumns={progressColumns}
            timelineColumns={timelineColumns}
            formProgressCol={formProgressCol}
            formTimelineCol={formTimelineCol}
            formGroupScope={formGroupScope}
            formShift={formShift}
            setFormProgressCol={setFormProgressCol}
            setFormTimelineCol={setFormTimelineCol}
            setFormGroupScope={setFormGroupScope}
            setFormShift={setFormShift}
            onSave={handleSaveSettings}
            onClose={() => setShowSettings(false)}
            saving={saving}
          />
        )}
      </div>
    );
  }

  return (
    <div style={{ ...cardStyle, marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
            {t("sCurve.title")} — {boardTitle}{groupScope ? ` - ${groupScope}` : ` - ${t("sCurve.scopeWholeBoard")}`}
          </div>
          <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 6 }}>
            {toDateStr(startDate)} → {toDateStr(endDate)}
            {chart?.forecastCompletionDate && (
              <span style={{ marginLeft: 8, color: "#f59e0b", fontWeight: 600 }}>
                {t("sCurve.forecastCompletion")} {toDateStr(chart.forecastCompletionDate)}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleRecordSnapshot} style={smallBtnStyle}>
            {todaySnapshot ? t("sCurve.updateTodayBtn") : t("sCurve.recordTodayBtn")}
          </button>
          <button onClick={() => setShowSettings(true)} style={smallBtnStyle}>
            {t("sCurve.settingsBtn")}
          </button>
        </div>
      </div>

      <SCurveChart
        t={t}
        chart={chart}
        startDate={startDate}
        endDate={endDate}
        onShiftDrag={handleShiftDrag}
        onShiftDragEnd={handleShiftDragEnd}
        onPointClick={(point, prevPoint, clientX, clientY) => setSelectedPoint({ point, prevPoint, clientX, clientY })}
      />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 10, fontSize: 11.5, color: "var(--text-secondary)", flexWrap: "wrap" }}>
        <span style={{ color: "var(--text-muted)" }}>{t("sCurve.dragHint")}</span>
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{t("sCurve.legendPlanHint")}</span>
        <LegendDot color="#15803d" dashed label={t("sCurve.legendGood")} />
        <LegendDot color="#ca8a04" dashed label={t("sCurve.legendCaution")} />
        <LegendDot color="#b91c1c" dashed label={t("sCurve.legendDanger")} />
        <LegendDot color="#3b82f6" label={t("sCurve.legendActual")} />
        {chart?.forecast && <LegendDot color="#f59e0b" dashed label={t("sCurve.legendForecast")} />}
      </div>

      {showSettings && (
        <SettingsModal
          t={t}
          groups={groups}
          progressColumns={progressColumns}
          timelineColumns={timelineColumns}
          formProgressCol={formProgressCol}
          formTimelineCol={formTimelineCol}
          formGroupScope={formGroupScope}
          formShift={formShift}
          setFormProgressCol={setFormProgressCol}
          setFormTimelineCol={setFormTimelineCol}
          setFormGroupScope={setFormGroupScope}
          setFormShift={setFormShift}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
          saving={saving}
        />
      )}

      {selectedPoint && (
        <SnapshotPopup
          t={t}
          point={selectedPoint.point}
          prevPoint={selectedPoint.prevPoint}
          clientX={selectedPoint.clientX}
          clientY={selectedPoint.clientY}
          onClose={() => setSelectedPoint(null)}
        />
      )}
    </div>
  );
}

const smallBtnStyle = {
  padding: "6px 12px",
  background: "var(--bg-hover)",
  border: "1px solid var(--border-dark)",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 12,
  color: "var(--text-primary)",
};

const primaryBtnStyle = {
  padding: "8px 16px",
  background: "var(--btn-primary-bg)",
  color: "var(--btn-primary-text)",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 500,
};

function LegendDot({ color, dashed, label }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 16, height: 0, borderTop: `2px ${dashed ? "dashed" : "solid"} ${color}` }} />
      {label}
    </span>
  );
}

function formatFullDate(dateStr) {
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

function SnapshotPopup({ t, point, prevPoint, clientX, clientY, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const handleOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("pointerdown", handleOutside);
    return () => document.removeEventListener("pointerdown", handleOutside);
  }, [onClose]);

  const delta = prevPoint ? point.y - prevPoint.y : null;
  const deltaSymbol = delta == null ? "" : delta > 0 ? "▲ " : delta < 0 ? "▼ " : "";
  const deltaColor = delta == null ? "var(--text-muted)" : delta >= 0 ? "#16a34a" : "#dc2626";

  // Clamp near viewport edges so the card never renders partly off-screen.
  const left = Math.min(Math.max(clientX - 70, 8), window.innerWidth - 148);
  const top = Math.min(clientY + 12, window.innerHeight - 90);

  return createPortal(
    <div
      ref={ref}
      style={{
        position: "fixed", left, top, zIndex: 1000,
        background: "var(--bg-modal)", borderRadius: 8, padding: "8px 10px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.25)", border: "1px solid var(--border-color)",
        color: "var(--text-primary)", fontSize: 11.5, minWidth: 140, lineHeight: 1.5,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 2 }}>{formatFullDate(point.date)}</div>
      <div style={{ color: deltaColor, fontWeight: 600 }}>
        {delta == null ? t("sCurve.snapshotNoPrevious") : `${deltaSymbol}${delta > 0 ? "+" : ""}${Math.round(delta)}%`}
      </div>
      <div>{t("sCurve.snapshotTotalLabel")}: <strong>{Math.round(point.y)}%</strong></div>
    </div>,
    document.body
  );
}

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function shortDateLabel(d) {
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS_SHORT[d.getMonth()]}`;
}

function SCurveChart({ t, chart, startDate, endDate, onShiftDrag, onShiftDragEnd, onPointClick }) {
  const width = 720;
  const height = 260;
  const padL = 36;
  const padB = 26;
  const padT = 10;
  const padR = 10;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;
  const svgRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [dragPoint, setDragPoint] = useState(null); // {x, y} live while dragging

  const xScale = (x) => padL + (x / chart.maxX) * plotW;
  const yScale = (y) => padT + plotH - (Math.max(0, Math.min(105, y)) / 100) * plotH;

  // Whole-curve color category, judged by a single reference point: the
  // baseline's progress value at 50% time elapsed (the 50/70-rule
  // anchor). The entire curve turns green/yellow/red together — not
  // per-point — with a light-to-dark gradient of that one hue for
  // visual depth rather than a flat fill.
  const curveColorFamily = (y) => {
    if (y >= 55) return { light: "#86efac", dark: "#15803d" };
    if (y >= 40) return { light: "#fde68a", dark: "#ca8a04" };
    return { light: "#fca5a5", dark: "#b91c1c" };
  };

  // Converts a pointer event's screen position into this chart's own SVG
  // user-space coordinates (720x260, per the viewBox) regardless of how
  // large the SVG is actually rendered — then inverts xScale/yScale to
  // get back (x%, y%), and solves for the shift whose baseline passes
  // through that point.
  const handlePointer = (e) => {
    const svg = svgRef.current;
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgPoint = pt.matrixTransform(svg.getScreenCTM().inverse());
    const xPercent = Math.max(1, Math.min(99, ((svgPoint.x - padL) / plotW) * chart.maxX));
    const yPercent = Math.max(0, Math.min(100, ((padT + plotH - svgPoint.y) / plotH) * 100));
    setDragPoint({ x: xPercent, y: yPercent });
    const newShift = shiftForPoint(Math.min(100, xPercent), yPercent);
    onShiftDrag(newShift);
    return newShift;
  };

  const handlePointerDown = (e) => {
    e.preventDefault();
    e.target.setPointerCapture(e.pointerId);
    setDragging(true);
    handlePointer(e);
  };
  const handlePointerMove = (e) => {
    if (!dragging) return;
    handlePointer(e);
  };
  const handlePointerUp = (e) => {
    if (!dragging) return;
    setDragging(false);
    const finalShift = handlePointer(e);
    onShiftDragEnd(finalShift);
    setDragPoint(null);
  };

  // X-axis ticks are real calendar dates (spread across the full plotted
  // range, including the >100% overshoot zone when a forecast/actual
  // runs past the planned end date), not raw percentages — matching a
  // normal S-curve chart's convention.
  const xTickCount = 6;
  const xTicks = Array.from({ length: xTickCount + 1 }, (_, i) => (i / xTickCount) * chart.maxX);
  const totalDays = daysBetween(startDate, endDate);
  const dateForX = (x) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + Math.round((x / 100) * totalDays));
    return d;
  };

  const toPath = (points) => points.map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(p.x)} ${yScale(p.y)}`).join(" ");

  // Smooths a polyline into a run of quadratic curves through the
  // midpoints of each consecutive pair, using the original points as
  // control points — rounds off the baseline's piecewise-quadratic
  // breakpoints instead of just connecting dense samples with straight
  // segments.
  const toSmoothPath = (points) => {
    if (points.length === 0) return "";
    const pts = points.map((p) => ({ x: xScale(p.x), y: yScale(p.y) }));
    if (pts.length < 3) return toPath(points);
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const midX = (pts[i].x + pts[i + 1].x) / 2;
      const midY = (pts[i].y + pts[i + 1].y) / 2;
      d += ` Q ${pts[i].x} ${pts[i].y} ${midX} ${midY}`;
    }
    const last = pts[pts.length - 1];
    d += ` L ${last.x} ${last.y}`;
    return d;
  };
  const toSmoothAreaPath = (topPoints, bottomPoints) => {
    if (topPoints.length === 0 || bottomPoints.length === 0) return "";
    const bottom = [...bottomPoints].reverse().map((p) => `L ${xScale(p.x)} ${yScale(p.y)}`).join(" ");
    return `${toSmoothPath(topPoints)} ${bottom} Z`;
  };

  const lastActual = chart.actual[chart.actual.length - 1];
  const baselineAtLastActual = lastActual ? millerAtX(chart.baseline, lastActual.x) : null;
  const isAhead = lastActual && baselineAtLastActual != null && lastActual.y >= baselineAtLastActual;

  const refY50 = millerAtX(chart.baseline, 50);
  const curveColor = curveColorFamily(refY50);

  return (
    <svg
      ref={svgRef}
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: "block", touchAction: "none" }}
    >
      <defs>
        <linearGradient id="baselineColorGradient" gradientUnits="userSpaceOnUse" x1={xScale(0)} y1="0" x2={xScale(100)} y2="0">
          <stop offset="0%" stopColor={curveColor.light} />
          <stop offset="100%" stopColor={curveColor.dark} />
        </linearGradient>
      </defs>
      {[0, 25, 50, 75, 100].map((pct) => (
        <g key={pct}>
          <line x1={padL} x2={width - padR} y1={yScale(pct)} y2={yScale(pct)} stroke="var(--border-color)" strokeWidth={1} />
          <text x={padL - 6} y={yScale(pct)} textAnchor="end" dominantBaseline="middle" style={{ fontSize: 9, fill: "var(--text-muted)" }}>
            {pct}%
          </text>
        </g>
      ))}
      {xTicks.map((x) => (
        <text key={x} x={xScale(x)} y={height - 8} textAnchor="middle" style={{ fontSize: 9, fill: "var(--text-muted)" }}>
          {shortDateLabel(dateForX(x))}
        </text>
      ))}

      {/* 50%-time reference marker — the anchor point the whole-curve
          color category above is judged against. */}
      <line x1={xScale(50)} x2={xScale(50)} y1={padT} y2={padT + plotH} stroke="var(--text-muted)" strokeWidth={1} strokeDasharray="3 3" opacity={0.6} />
      <text
        x={xScale(50) - 8} y={(yScale(75) + yScale(100)) / 2}
        textAnchor="middle"
        transform={`rotate(-90 ${xScale(50) - 8} ${(yScale(75) + yScale(100)) / 2})`}
        style={{ fontSize: 7, fill: "var(--text-muted)" }}
      >
        {t("sCurve.halfTimeLabel")}
      </text>

      {lastActual && baselineAtLastActual != null && (
        <path
          d={toSmoothAreaPath(chart.baseline.filter((p) => p.x <= lastActual.x), chart.actual)}
          fill={isAhead ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)"}
          stroke="none"
        />
      )}

      <path d={toSmoothPath(chart.baseline)} fill="none" stroke="url(#baselineColorGradient)" strokeWidth={2.5} strokeDasharray="5 4" strokeLinecap="round" />

      {/* Wide, invisible hit area over the baseline — "grab the shape"
          drag target, wider than the visible 2px stroke so it's easy to
          catch with a mouse/finger. Painted before the actual-progress
          points below so those points stay clickable even where they
          sit on top of the baseline (SVG paints later siblings on top,
          so this must come first or it swallows their clicks). */}
      <path
        d={toSmoothPath(chart.baseline)}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        style={{ cursor: dragging ? "grabbing" : "grab" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />

      {chart.forecast && <path d={toPath(chart.forecast)} fill="none" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 3" />}

      {chart.actual.length > 0 && <path d={toPath(chart.actual)} fill="none" stroke="#3b82f6" strokeWidth={2.5} />}
      {chart.actual.map((p, i) => (
        <circle
          key={i}
          cx={xScale(p.x)} cy={yScale(p.y)} r={5}
          fill="#3b82f6"
          stroke="var(--bg-modal)" strokeWidth={1.5}
          style={{ cursor: "pointer" }}
          onClick={(e) => {
            e.stopPropagation();
            onPointClick(p, i > 0 ? chart.actual[i - 1] : null, e.clientX, e.clientY);
          }}
        />
      ))}

      {dragging && dragPoint && (
        <g>
          <rect
            x={Math.min(width - padR - 96, Math.max(padL, xScale(dragPoint.x) - 48))}
            y={Math.max(padT, yScale(dragPoint.y) - 30)}
            width={96} height={20} rx={4}
            fill={curveColor.dark}
            stroke={curveColor.dark}
          />
          <text
            x={Math.min(width - padR - 48, Math.max(padL + 48, xScale(dragPoint.x)))}
            y={Math.max(padT, yScale(dragPoint.y) - 20)}
            textAnchor="middle" dominantBaseline="middle"
            style={{ fontSize: 10, fontWeight: 600, fill: "#fff" }}
          >
            {Math.round(dragPoint.x)}% / {Math.round(dragPoint.y)}%
          </text>
        </g>
      )}
    </svg>
  );
}

function millerAtX(baseline, x) {
  let closest = baseline[0];
  for (const p of baseline) {
    if (Math.abs(p.x - x) < Math.abs(closest.x - x)) closest = p;
  }
  return closest?.y;
}

function SettingsModal({
  t,
  groups,
  progressColumns,
  timelineColumns,
  formProgressCol,
  formTimelineCol,
  formGroupScope,
  formShift,
  setFormProgressCol,
  setFormTimelineCol,
  setFormGroupScope,
  setFormShift,
  onSave,
  onClose,
  saving,
}) {
  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        style={{ background: "var(--bg-modal)", borderRadius: 12, padding: 24, maxWidth: 380, width: "90%", color: "var(--text-primary)", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", border: "1px solid var(--border-color)", textAlign: "left" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginBottom: 12, fontSize: 16, fontWeight: 600 }}>{t("sCurve.settingsTitle")}</h3>

        <label style={{ display: "block", fontSize: 12, color: "var(--text-secondary)", marginBottom: 4 }}>{t("sCurve.scopeLabel")}</label>
        <select value={formGroupScope} onChange={(e) => setFormGroupScope(e.target.value)} style={inputStyle}>
          <option value="">{t("sCurve.scopeWholeBoard")}</option>
          {(groups || []).map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>

        <label style={{ display: "block", fontSize: 12, color: "var(--text-secondary)", margin: "10px 0 4px" }}>{t("sCurve.progressColumnLabel")}</label>
        <select value={formProgressCol} onChange={(e) => setFormProgressCol(e.target.value)} style={inputStyle}>
          {progressColumns.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>

        <label style={{ display: "block", fontSize: 12, color: "var(--text-secondary)", margin: "10px 0 4px" }}>{t("sCurve.timelineColumnLabel")}</label>
        <select value={formTimelineCol} onChange={(e) => setFormTimelineCol(e.target.value)} style={inputStyle}>
          {timelineColumns.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>

        <label style={{ display: "block", fontSize: 12, color: "var(--text-secondary)", margin: "14px 0 4px" }}>
          {t("sCurve.shiftLabel")}: {formShift > 0 ? t("sCurve.shiftBackLoaded") : formShift < 0 ? t("sCurve.shiftFrontLoaded") : t("sCurve.shiftSymmetric")}
        </label>
        <input type="range" min={-1} max={1} step={0.1} value={formShift} onChange={(e) => setFormShift(parseFloat(e.target.value))} style={{ width: "100%" }} />
        <button
          type="button"
          onClick={() => setFormShift(shiftForPoint(50, 70))}
          style={{ marginTop: 6, padding: "5px 10px", background: "var(--bg-hover)", border: "1px solid var(--border-dark)", borderRadius: 6, cursor: "pointer", fontSize: 11.5, color: "var(--text-secondary)" }}
        >
          {t("sCurve.apply5070Btn")}
        </button>

        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
          <button onClick={onClose} disabled={saving} style={{ flex: 1, padding: 8, background: "var(--bg-hover)", border: "none", borderRadius: 6, cursor: "pointer", color: "var(--text-secondary)" }}>
            {t("common.cancel")}
          </button>
          <button
            onClick={onSave}
            disabled={saving || !formProgressCol || !formTimelineCol}
            style={{ flex: 1, padding: 8, background: "var(--btn-primary-bg)", color: "var(--btn-primary-text)", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 500, opacity: saving ? 0.7 : 1 }}
          >
            {t("common.save")}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  border: "1px solid var(--border-dark)",
  borderRadius: 6,
  background: "var(--bg-input)",
  color: "var(--text-primary)",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
};
