// A child's "weight" is its configured share of its immediate parent's
// 100% — separate from its own completion %. Stored per-progress-column as
// item[`${columnId}__weight`] so a board can have more than one Progress
// column without them clashing.
export function weightKeyFor(columnId) {
  return `${columnId}__weight`;
}

// Resolves every sibling's effective weight: explicit values are used as-is,
// siblings left unset split whatever's left over equally. With nothing set
// at all this reduces to 100/N each — the original plain-average behavior,
// so existing boards don't change until someone actually sets a weight.
export function resolveWeights(siblings, columnId) {
  const key = weightKeyFor(columnId);
  const explicit = siblings.map((s) => (typeof s[key] === "number" ? s[key] : null));
  const explicitSum = explicit.reduce((sum, w) => sum + (w || 0), 0);
  const unsetCount = explicit.filter((w) => w === null).length;
  const autoShare = unsetCount > 0 ? Math.max(0, 100 - explicitSum) / unsetCount : 0;
  return explicit.map((w) => (w === null ? autoShare : w));
}

// Same resolution, but framed for a single item: what it's currently set to
// (or would auto-resolve to if left unset), plus the sum of its *other*
// siblings' explicit weights — the number a new explicit value for this
// item must not push over 100 when added together.
export function resolveSelfWeight(siblings, itemId, columnId) {
  const key = weightKeyFor(columnId);
  const selfIndex = siblings.findIndex((s) => s.id === itemId);
  const weights = resolveWeights(siblings, columnId);
  const explicitSelf = selfIndex >= 0 && typeof siblings[selfIndex][key] === "number" ? siblings[selfIndex][key] : null;
  const explicitValues = siblings.map((s) => (typeof s[key] === "number" ? s[key] : null));
  const explicitSiblingSum = explicitValues.reduce((sum, w, i) => {
    if (i === selfIndex) return sum;
    return sum + (w || 0);
  }, 0);
  // Unset siblings auto-split whatever's left, so the group only sums to
  // something other than 100% once *every* sibling has an explicit value —
  // there's no more "auto" slot left to absorb the remainder.
  const allExplicit = siblings.length > 0 && explicitValues.every((w) => w !== null);
  const explicitTotal = explicitValues.reduce((sum, w) => sum + (w || 0), 0);
  const weightIncomplete = allExplicit && Math.round(explicitTotal) !== 100;
  return {
    explicitWeight: explicitSelf,
    resolvedWeight: selfIndex >= 0 ? weights[selfIndex] : 0,
    explicitSiblingSum,
    siblingCount: siblings.length,
    weightIncomplete,
  };
}

// Depth-0 rows' shared "parent" is the ITEM level itself, not each other —
// each top-level item independently gets up to 100% weight rather than
// splitting a pool with its depth-0 siblings. Default (unset) is full
// weight, and there's no sibling sum to cap against.
export function resolveIndependentWeight(item, columnId) {
  const key = weightKeyFor(columnId);
  const explicit = typeof item[key] === "number" ? item[key] : null;
  return {
    explicitWeight: explicit,
    resolvedWeight: explicit == null ? 100 : explicit,
    explicitSiblingSum: 0,
    siblingCount: 1,
    weightIncomplete: false,
  };
}

// Recursive weighted rollup: a leaf's progress is its own stored stage
// value; a parent's progress is Σ(child weight% × child progress%) across
// its direct children.
export function computeWeightedProgress(children, columnId) {
  if (!children || children.length === 0) return 0;
  const weights = resolveWeights(children, columnId);
  return children.reduce((total, child, i) => {
    const grandchildren = child.children && Array.isArray(child.children) ? child.children : [];
    const childProgress = grandchildren.length > 0
      ? computeWeightedProgress(grandchildren, columnId)
      : Math.min(100, Math.max(0, parseInt(child[columnId]) || 0));
    return total + (weights[i] / 100) * childProgress;
  }, 0);
}

// A row's own local progress: its own stored stage value if it's a leaf,
// or its own weighted rollup from its children otherwise. This is what a
// row's bar width/color represent — never diluted by weight.
export function computeOwnProgress(item, columnId) {
  const kids = item.children && Array.isArray(item.children) ? item.children : [];
  if (kids.length === 0) {
    return Math.min(100, Math.max(0, parseInt(item[columnId]) || 0));
  }
  return computeWeightedProgress(kids, columnId);
}

// A row's own absolute weight — its true share of the *whole board*, not
// just of its immediate parent. Found by chaining relative weights down
// from the root: each ancestor's relative weight (0-100, share of *its*
// parent) multiplies into the running product. The implicit root has an
// absolute weight of 100, so a depth-0 row's absolute weight equals its own
// relative weight.
export function computeAbsoluteWeight(resolvedWeight, parentAbsoluteWeight) {
  const weight = resolvedWeight == null ? 100 : resolvedWeight;
  const parentWeight = parentAbsoluteWeight == null ? 100 : parentAbsoluteWeight;
  return (weight / 100) * parentWeight;
}

// "Progress terhadap total": this row's own progress × its own absolute
// weight (its true share of the whole board — the product of every
// ancestor's relative weight, chained via `parentAbsoluteWeight`). Only
// weight compounds down the chain here, never progress — an ancestor being
// half-done doesn't additionally dilute a fully-done descendant's
// contribution, it only sets how large a slice that descendant owns.
// Applies uniformly at every depth, including depth 0 (whose "parent" is
// the implicit whole-board root, absolute weight 100).
export function computeCascadedDisplayPercent(ownProgress, resolvedWeight, parentAbsoluteWeight) {
  const absoluteWeight = computeAbsoluteWeight(resolvedWeight, parentAbsoluteWeight);
  return Math.round((ownProgress * absoluteWeight) / 100);
}
