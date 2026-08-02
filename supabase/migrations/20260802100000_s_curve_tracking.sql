-- ------------------------------------------------------------
-- S-curve project tracking (roadmap item 4): a board can optionally be
-- configured as a "project" with a start/end date; once configured, a
-- Miller Method baseline curve is computed client-side (no need to store
-- baseline points — just start/end date + shift), and periodic manual
-- "Aktual" snapshots let the dashboard plot a real progress line +
-- forecast against it.
-- ------------------------------------------------------------
alter table boards add column project_start_date date;
alter table boards add column project_end_date date;
-- -1 (front-loaded, fast start) .. 0 (symmetric, Miller default) .. 1
-- (back-loaded, slow start) — see src/utils/sCurve.js for how this skews
-- the baseline while keeping it smooth.
alter table boards add column s_curve_shift numeric not null default 0;

create table board_progress_snapshots (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references nodes(id) on delete cascade,
  snapshot_date date not null,
  actual_progress numeric not null,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  unique (board_id, snapshot_date)
);
create index idx_progress_snapshots_board on board_progress_snapshots(board_id);

alter table board_progress_snapshots enable row level security;

create policy progress_snapshots_select on board_progress_snapshots for select
  using (can_access_board(board_id));
create policy progress_snapshots_write on board_progress_snapshots for all
  using (can_access_board(board_id))
  with check (can_access_board(board_id));

alter publication supabase_realtime add table board_progress_snapshots;
