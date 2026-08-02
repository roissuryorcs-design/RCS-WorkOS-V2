-- ------------------------------------------------------------
-- Redesign per user feedback: instead of a separate manually-typed
-- project start/end date, S-curve setup now requires the board to
-- already have a Timeline-type column, and the project date range is
-- derived from it (earliest item start -> latest item end). The user
-- also picks which Progress-type column feeds the "Aktual" line,
-- instead of always assuming the first one. Both choices are just
-- column ids (stable text ids, same as columns.id itself).
--
-- Safe to run whether or not 20260802100000 was ever applied — the
-- `drop column if exists` no-ops if it wasn't.
-- ------------------------------------------------------------
alter table boards drop column if exists project_start_date;
alter table boards drop column if exists project_end_date;
alter table boards add column if not exists s_curve_progress_column_id text;
alter table boards add column if not exists s_curve_timeline_column_id text;
