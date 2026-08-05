-- Per-board group chat ("Board Discussion") — every message is visible to
-- anyone who can access the board, unlike direct_messages which is 1:1
-- and private. Reuses can_access_board() (defined in
-- 20260802070000_can_access_board_fix_new_board_race.sql) so access
-- follows the exact same rules as items/groups/updates: workspace owner,
-- or unrestricted board, or explicit board_members grant.
create table board_messages (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references nodes(id) on delete cascade,
  sender_id uuid not null references profiles(id),
  body text not null,
  created_at timestamptz not null default now()
);
create index idx_board_messages_board on board_messages(board_id);

alter table board_messages enable row level security;

create policy board_messages_select on board_messages for select
  using (can_access_board(board_id));

create policy board_messages_insert on board_messages for insert
  with check (can_access_board(board_id) and sender_id = auth.uid());

alter publication supabase_realtime add table board_messages;
