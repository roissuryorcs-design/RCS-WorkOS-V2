import { useState, useEffect, useMemo, useRef } from "react";
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
  const [progressColumnId, setProgressColumnId] = useState(null);
  const [timelineColumnId, setTimelineColumnId] = useState(null);
  const [groupScope, setGroupScope] = useState(null); // null = whole board
  const [shift, setShift] = useState(0);
  const [snapshots, setSnapshots] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [formProgressCol, setFormProgressCol] = useState("");
  const [formTimelineCol, setFormTimelineCol] = useState("");
  const [formGroupScope, setFormGroupScope] = useState("");
  const [formShift, setFormShift] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const [{ data: board, error: boardError }, { data: snaps, error: snapError }] = await Promise.all([
        supabase.from("boards").select("s_curve_progress_column_id, s_curve_timeline_column_id, s_curve_shift, s_curve_group_name").eq("id", boardId).single(),
        supabase.from("board_progress_snapshots").select("snapshot_date, actual_progress").eq("board_id", boardId).order("snapshot_date"),
      ]);
      if (cancelled) return;
      if (boardError) console.error("Error loading S-curve settings:", boardError);
      if (snapError) console.error("Error loading progress snapshots:", snapError);
      if (board) {
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
    for (let x = 0; x <= 100; x += 2) baseline.push({ x, y: millerBaseline(x, shift) });

    const actual = snapshots
      .map((s) => ({ x: percentElapsed(new Date(s.snapshot_date), startDate, endDate), y: s.actual_progress }))
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
            {t("sCurve.title")}{groupScope ? ` — ${groupScope}` : ` — ${t("sCurve.scopeWholeBoard")}`}
          </div>
          <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
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

      <SCurveChart chart={chart} startDate={startDate} endDate={endDate} onShiftDrag={handleShiftDrag} onShiftDragEnd={handleShiftDragEnd} />
      <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 4, textAlign: "center" }}>{t("sCurve.dragHint")}</div>

      <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 11.5, color: "var(--text-secondary)", flexWrap: "wrap" }}>
        <LegendDot color="#9ca3af" dashed label={t("sCurve.legendPlan")} />
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

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function shortDateLabel(d) {
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS_SHORT[d.getMonth()]}`;
}

function SCurveChart({ chart, startDate, endDate, onShiftDrag, onShiftDragEnd }) {
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

  const xScale = (x) => padL + (x / chart.maxX) * plotW;
  const yScale = (y) => padT + plotH - (Math.max(0, Math.min(105, y)) / 100) * plotH;

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
    const yPercent = ((padT + plotH - svgPoint.y) / plotH) * 100;
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
  const toAreaPath = (topPoints, bottomPoints) => {
    if (topPoints.length === 0 || bottomPoints.length === 0) return "";
    const top = topPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(p.x)} ${yScale(p.y)}`).join(" ");
    const bottom = [...bottomPoints].reverse().map((p) => `L ${xScale(p.x)} ${yScale(p.y)}`).join(" ");
    return `${top} ${bottom} Z`;
  };

  const lastActual = chart.actual[chart.actual.length - 1];
  const baselineAtLastActual = lastActual ? millerAtX(chart.baseline, lastActual.x) : null;
  const isAhead = lastActual && baselineAtLastActual != null && lastActual.y >= baselineAtLastActual;

  return (
    <svg
      ref={svgRef}
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: "block", touchAction: "none" }}
    >
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

      {lastActual && baselineAtLastActual != null && (
        <path
          d={toAreaPath(chart.baseline.filter((p) => p.x <= lastActual.x), chart.actual)}
          fill={isAhead ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)"}
          stroke="none"
        />
      )}

      <path d={toPath(chart.baseline)} fill="none" stroke="#9ca3af" strokeWidth={2} strokeDasharray="5 4" />

      {chart.forecast && <path d={toPath(chart.forecast)} fill="none" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 3" />}

      {chart.actual.length > 0 && <path d={toPath(chart.actual)} fill="none" stroke="#3b82f6" strokeWidth={2.5} />}
      {chart.actual.map((p, i) => (
        <circle key={i} cx={xScale(p.x)} cy={yScale(p.y)} r={3} fill="#3b82f6" />
      ))}

      {/* Wide, invisible hit area over the baseline — "grab the shape"
          drag target, wider than the visible 2px stroke so it's easy to
          catch with a mouse/finger. */}
      <path
        d={toPath(chart.baseline)}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        style={{ cursor: dragging ? "grabbing" : "grab" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
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
