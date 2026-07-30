// Shared helpers for names the app itself generates (default group/column/
// status/stage names, seed item names). Every call site that needs one of
// these MUST go through the helper here rather than re-deriving the string
// — e.g. `item.status` is written as literal data in 6+ places across
// App.jsx and read back by ColumnContext.jsx's default status map; if those
// ever drifted to call t("defaults.statusNone") independently instead of
// sharing one helper, a language whose translated word differs between the
// two call sites would silently create items with a status key that
// doesn't exist in the status map. Called at creation time (never cached
// at module scope) so it always reflects whichever language is active
// *when something new is created*, per the app's own bilingual policy:
// existing content is never retroactively translated.
export function getDefaultGroupName(t) {
  return t("defaults.defaultGroupName");
}

export function getDefaultStatusKey(t) {
  return t("defaults.statusNone");
}

export function getTaskName(t, n) {
  return t("defaults.taskName", { n });
}

export function getTaskNameInGroup(t, n, group) {
  return t("defaults.taskNameInGroup", { n, group });
}

export function getDocNumber(t, n) {
  return t("defaults.docNumber", { n: String(n).padStart(3, "0") });
}

export function getPeoplePlaceholder(t) {
  return t("defaults.peoplePlaceholder");
}

export function getRevDefault(t) {
  return t("defaults.revDefault");
}

// depth 0 = top-level ("New Task"/"Tugas Baru"), 1 = "Sub Item", 2 = "Sub
// Sub Item", 3+ = "Sub Sub Sub Item" — matches the existing getLevelName()
// logic previously duplicated separately in App.jsx and BoardTable.jsx.
export function getSubItemLabel(t, depth) {
  if (depth <= 0) return t("defaults.subItemLevel0");
  if (depth === 1) return t("defaults.subItemLevel1");
  if (depth === 2) return t("defaults.subItemLevel2");
  return t("defaults.subItemLevel3");
}
