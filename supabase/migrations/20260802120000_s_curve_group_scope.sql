-- ------------------------------------------------------------
-- S-curve scope: null = whole board (default, unchanged behavior), or a
-- specific group name to track just that group's items instead. One
-- S-curve config per board for now (not one per group simultaneously) —
-- picking a different group just re-scopes the same chart.
-- ------------------------------------------------------------
alter table boards add column if not exists s_curve_group_name text;
