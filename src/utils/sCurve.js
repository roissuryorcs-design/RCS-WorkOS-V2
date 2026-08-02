// S-curve project tracking math (roadmap item 4). Two distinct models by
// design, per the user's own spec: the BASELINE ("Rencana") uses the
// Miller Method (piecewise quadratic, resource-leveling based "ideal"
// curve) — simple, predictable, and shiftable. The FORECAST ("Prediksi")
// fits a Gompertz curve to actual data points via gradient descent and
// extrapolates it forward — Gompertz's asymmetric shape is what the user
// originally described as good for this (complex end-stage commissioning
// finishes slower than it ramps up).

// ------------------------------------------------------------
// Miller Method baseline
// ------------------------------------------------------------
// x: 0-100 (% of project duration elapsed). Continuous at both phase
// boundaries (33.33% -> 25%, 66.67% -> 75%) by construction.
function millerRaw(x) {
  if (x <= 100 / 3) return 0.0225 * x * x;
  if (x <= 200 / 3) return 1.5 * x - 25;
  return -0.0225 * x * x + 4.5 * x - 125;
}

// shift: -1 (front-loaded, fast start) .. 0 (symmetric) .. 1 (back-loaded,
// slow start). Implemented by skewing the x input through a power curve
// before applying Miller's formula — composing two smooth functions stays
// smooth, so this never introduces a kink the way shifting the phase
// breakpoints directly would.
export function millerBaseline(xPercent, shift = 0) {
  const x = Math.max(0, Math.min(100, xPercent));
  const k = Math.pow(2, shift);
  const xSkewed = 100 * Math.pow(x / 100, k);
  return Math.max(0, Math.min(100, millerRaw(xSkewed)));
}

// For a fixed x, millerBaseline(x, shift) is monotonic in shift (higher
// shift skews x smaller before the lookup, and Miller's formula is
// monotonically increasing over 0-100, so a smaller skewed-x means a
// smaller y) — binary search finds the shift whose curve passes through
// a dragged (x, y) point. Powers direct "click and drag the curve to
// reshape it" interaction instead of only a slider.
export function shiftForPoint(xPercent, yTarget, { min = -1, max = 1, iterations = 40 } = {}) {
  let lo = min;
  let hi = max;
  // millerBaseline decreases as shift increases (for x in (0,100)) — bail
  // out to the nearest bound if the target is outside what's reachable at
  // all, rather than iterating toward a false answer.
  if (yTarget >= millerBaseline(xPercent, min)) return min;
  if (yTarget <= millerBaseline(xPercent, max)) return max;
  for (let i = 0; i < iterations; i++) {
    const mid = (lo + hi) / 2;
    const y = millerBaseline(xPercent, mid);
    if (y > yTarget) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

// ------------------------------------------------------------
// Gompertz forecast — fit b,c (a held fixed) to actual data points via
// plain gradient descent. Not a production-grade solver, but "good
// enough" for a handful of weekly snapshots — this is a forecast, not a
// precision instrument.
// ------------------------------------------------------------
export function gompertz(x, { a, b, c }) {
  return a * Math.exp(-b * Math.exp(-c * x));
}

export function fitGompertz(points, { a = 100, iterations = 3000, learningRate = 0.0005 } = {}) {
  const clean = (points || []).filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y) && p.y > 0);
  if (clean.length < 2) return null;

  let b = 3;
  let c = 0.05;

  for (let iter = 0; iter < iterations; iter++) {
    let gradB = 0;
    let gradC = 0;
    for (const { x, y } of clean) {
      const inner = Math.exp(-c * x);
      const pred = a * Math.exp(-b * inner);
      if (!Number.isFinite(pred)) continue;
      const err = pred - y;
      gradB += err * (-inner * pred);
      gradC += err * (b * x * inner * pred);
    }
    const n = clean.length;
    const nextB = b - learningRate * (gradB / n);
    const nextC = c - learningRate * (gradC / n);
    if (Number.isFinite(nextB)) b = Math.max(0.01, Math.min(50, nextB));
    if (Number.isFinite(nextC)) c = Math.max(0.001, Math.min(1, nextC));
  }

  return { a, b, c };
}

// Solves gompertz(x, params) = threshold for x — used to project the
// forecast completion day. Returns null if the curve never realistically
// reaches the threshold (e.g. degenerate fit).
export function forecastCompletionX(params, threshold = 99) {
  const { a, b, c } = params;
  const inner = -Math.log(threshold / a) / b;
  if (!(inner > 0)) return null;
  const x = -Math.log(inner) / c;
  return Number.isFinite(x) ? x : null;
}
