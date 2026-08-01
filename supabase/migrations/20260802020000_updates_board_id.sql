-- ------------------------------------------------------------
-- Phase 6: denormalize board_id onto `updates` so the client can use the
-- same board-scoped Realtime filter (`board_id=eq.<id>`) already used for
-- columns/groups/items, instead of subscribing to the whole table
-- unfiltered and joining through item_id client-side.
-- ------------------------------------------------------------
alter table updates add column board_id uuid references nodes(id) on delete cascade;
update updates set board_id = (select board_id from items where items.id = updates.item_id) where board_id is null;
alter table updates alter column board_id set not null;
create index idx_updates_board on updates(board_id);

drop policy if exists updates_select on updates;
drop policy if exists updates_write on updates;

create policy updates_select on updates for select
  using (can_access_board(board_id));
create policy updates_write on updates for all
  using (can_access_board(board_id))
  with check (can_access_board(board_id));
