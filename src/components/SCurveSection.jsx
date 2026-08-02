import { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { millerBaseline, fitGompertz, gompertz, forecastCompletionX } from "../utils/sCurve";

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

// % of project duration elapsed for a given calendar date (can exceed 100
// if the date is past the planned end date — plotted, not clamped, so a
// late-running actual/forecast line visibly overshoots the baseline).
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

export default function SCurveSection({ boardId, currentProgress }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [shift, setShift] = useState(0);
  const [snapshots, setSnapshots] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [formStart, setFormStart] = useState("");
  const [formEnd, setFormEnd] = useState("");
  const [formShift, setFormShift] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const [{ data: board, error: boardError }, { data: snaps, error: snapError }] = await Promise.all([
        supabase.from("boards").select("project_start_date, project_end_date, s_curve_shift").eq("id", boardId).single(),
        supabase.from("board_progress_snapshots").select("snapshot_date, actual_progress").eq("board_id", boardId).order("snapshot_date"),
      ]);
      if (cancelled) return;
      if (boardError) console.error("Error loading project settings:", boardError);
      if (snapError) console.error("Error loading progress snapshots:", snapError);
      if (board) {
        setStartDate(board.project_start_date);
        setEndDate(board.project_end_date);
        setShift(board.s_curve_shift ?? 0);
        setFormStart(board.project_start_date || "");
        setFormEnd(board.project_end_date || "");
        setFormShift(board.s_curve_shift ?? 0);
      }
      setSnapshots(snaps || []);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [boardId]);

  const isConfigured = !!(startDate && endDate);

  const chart = useMemo(() => {
    if (!isConfigured) return null;
    const maxX = 130; // extend past 100% so a late forecast/actual can overshoot visibly

    const baseline = [];
    for (let x = 0; x <= 100; x += 2) baseline.push({ x, y: millerBaseline(x, shift) });

    const actual = snapshots
      .map((s) => ({ x: percentElapsed(s.snapshot_date, startDate, endDate), y: s.actual_progress }))
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
  }, [isConfigured, shift, snapshots, startDate, endDate]);

  const todaySnapshot = snapshots.find((s) => s.snapshot_date === toDateStr(new Date()));

  const handleSaveSettings = async () => {
    if (!formStart || !formEnd) return;
    setSaving(true);
    const { error } = await supabase
      .from("boards")
      .update({ project_start_date: formStart, project_end_date: formEnd, s_curve_shift: formShift })
      .eq("id", boardId);
    setSaving(false);
    if (error) {
      console.error("Error saving project settings:", error);
      alert(t("sCurve.saveFailed"));
      return;
    }
    setStartDate(formStart);
    setEndDate(formEnd);
    setShift(formShift);
    setShowSettings(false);
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

  if (!isConfigured) {
    return (
      <div style={{ ...cardStyle, marginBottom: 16, textAlign: "center" }}>
        <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 10 }}>{t("sCurve.notSetHint")}</div>
        <button
          onClick={() => setShowSettings(true)}
          style={{ padding: "8px 16px", background: "var(--btn-primary-bg)", color: "var(--btn-primary-text)", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 500 }}
        >
          {t("sCurve.setupBtn")}
        </button>
        {showSettings && (
          <SettingsModal
            t={t}
            formStart={formStart}
            formEnd={formEnd}
            formShift={formShift}
            setFormStart={setFormStart}
            setFormEnd={setFormEnd}
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
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{t("sCurve.title")}</div>
          <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
            {startDate} → {endDate}
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

      <SCurveChart chart={chart} t={t} />

      <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 11.5, color: "var(--text-secondary)", flexWrap: "wrap" }}>
        <LegendDot color="#9ca3af" dashed label={t("sCurve.legendPlan")} />
        <LegendDot color="#3b82f6" label={t("sCurve.legendActual")} />
        {chart?.forecast && <LegendDot color="#f59e0b" dashed label={t("sCurve.legendForecast")} />}
      </div>

      {showSettings && (
        <SettingsModal
          t={t}
          formStart={formStart}
          formEnd={formEnd}
          formShift={formShift}
          setFormStart={setFormStart}
          setFormEnd={setFormEnd}
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

function LegendDot({ color, dashed, label }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 16, height: 0, borderTop: `2px ${dashed ? "dashed" : "solid"} ${color}` }} />
      {label}
    </span>
  );
}

function SCurveChart({ chart, t }) {
  const width = 720;
  const height = 260;
  const padL = 36;
  const padB = 22;
  const padT = 10;
  const padR = 10;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const xScale = (x) => padL + (x / chart.maxX) * plotW;
  const yScale = (y) => padT + plotH - (Math.max(0, Math.min(105, y)) / 100) * plotH;

  const toPath = (points) => points.map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(p.x)} ${yScale(p.y)}`).join(" ");
  // Closed polygon tracing the baseline forward then the actual points
  // backward, so the fill between them renders as one continuous shape —
  // reusing toPath() for the "backward" leg would re-emit a mid-path `M`,
  // which starts a disconnected subpath instead of continuing the polygon.
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
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: "block" }}>
      {[0, 25, 50, 75, 100].map((pct) => (
        <g key={pct}>
          <line x1={padL} x2={width - padR} y1={yScale(pct)} y2={yScale(pct)} stroke="var(--border-color)" strokeWidth={1} />
          <text x={padL - 6} y={yScale(pct)} textAnchor="end" dominantBaseline="middle" style={{ fontSize: 9, fill: "var(--text-muted)" }}>
            {pct}%
          </text>
        </g>
      ))}
      {[0, 25, 50, 75, 100].map((pct) => (
        <text key={pct} x={xScale(pct)} y={height - 6} textAnchor="middle" style={{ fontSize: 9, fill: "var(--text-muted)" }}>
          {pct}%
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

function SettingsModal({ t, formStart, formEnd, formShift, setFormStart, setFormEnd, setFormShift, onSave, onClose, saving }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        style={{ background: "var(--bg-modal)", borderRadius: 12, padding: 24, maxWidth: 380, width: "90%", color: "var(--text-primary)", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", border: "1px solid var(--border-color)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginBottom: 12, fontSize: 16, fontWeight: 600 }}>{t("sCurve.settingsTitle")}</h3>

        <label style={{ display: "block", fontSize: 12, color: "var(--text-secondary)", marginBottom: 4 }}>{t("sCurve.startDateLabel")}</label>
        <input type="date" value={formStart} onChange={(e) => setFormStart(e.target.value)} style={inputStyle} />

        <label style={{ display: "block", fontSize: 12, color: "var(--text-secondary)", margin: "10px 0 4px" }}>{t("sCurve.endDateLabel")}</label>
        <input type="date" value={formEnd} onChange={(e) => setFormEnd(e.target.value)} style={inputStyle} />

        <label style={{ display: "block", fontSize: 12, color: "var(--text-secondary)", margin: "14px 0 4px" }}>
          {t("sCurve.shiftLabel")}: {formShift > 0 ? t("sCurve.shiftBackLoaded") : formShift < 0 ? t("sCurve.shiftFrontLoaded") : t("sCurve.shiftSymmetric")}
        </label>
        <input
          type="range"
          min={-1}
          max={1}
          step={0.1}
          value={formShift}
          onChange={(e) => setFormShift(parseFloat(e.target.value))}
          style={{ width: "100%" }}
        />

        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
          <button onClick={onClose} disabled={saving} style={{ flex: 1, padding: 8, background: "var(--bg-hover)", border: "none", borderRadius: 6, cursor: "pointer", color: "var(--text-secondary)" }}>
            {t("common.cancel")}
          </button>
          <button
            onClick={onSave}
            disabled={saving || !formStart || !formEnd}
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
