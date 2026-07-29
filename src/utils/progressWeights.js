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
  const explicitSiblingSum = siblings.reduce((sum, s, i) => {
    if (i === selfIndex) return sum;
    return sum + (typeof s[key] === "number" ? s[key] : 0);
  }, 0);
  return {
    explicitWeight: explicitSelf,
    resolvedWeight: selfIndex >= 0 ? weights[selfIndex] : 0,
    explicitSiblingSum,
    siblingCount: siblings.length,
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

// "Progress terhadap total": this row's own progress × its own weight ×
// its parent's *already-cascaded* display percent, all divided down to a
// 0-100 range. Cascading through `parentDisplayPercent` (rather than just
// one level) means a deeply-nested row's displayed % reflects its true
// contribution to the grand total, not just to its immediate parent — each
// ancestor's weight along the way compounds the dilution. Root rows
// (depth 0, no parent) show their own progress untouched.
export function computeCascadedDisplayPercent(ownProgress, resolvedWeight, parentDisplayPercent, depth) {
  if (depth === 0 || resolvedWeight == null) return Math.round(ownProgress);
  return Math.round((ownProgress * resolvedWeight * parentDisplayPercent) / (100 * 100));
}
