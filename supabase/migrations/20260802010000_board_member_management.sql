-- ============================================================
-- Phase 5.5: member management
--   1. Optional per-board allowlist (board_members) — a board with zero
--      rows here stays workspace-wide visible (today's default, no
--      backfill needed for existing boards); a board with >=1 row becomes
--      restricted to just those users, plus workspace owners (who always
--      see every board in their workspace regardless of restriction).
--   2. remove_workspace_member RPC — lets a workspace owner remove
--      another member; RLS then blocks that user's next request for
--      anything in the workspace (their existing Auth session stays
--      logged in, only workspace/board access is cut).
-- ============================================================

create table board_members (
  board_id uuid not null references nodes(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (board_id, user_id)
);
create index idx_board_members_user on board_members(user_id);

alter table board_members enable row level security;

-- Anyone who's a member of the board's workspace can see the allowlist
-- (needed to render "who has access" in the restriction UI). Deliberately
-- checks workspace membership directly rather than can_access_board(),
-- since that function is being redefined below to itself depend on this
-- table — using it here would be circular.
create policy board_members_select on board_members for select
  using (
    exists (
      select 1 from nodes n
      where n.id = board_members.board_id
        and is_workspace_member(n.workspace_id)
    )
  );

-- Only the board's workspace owner manages the allowlist.
create policy board_members_insert on board_members for insert
  with check (
    exists (
      select 1 from nodes n
      join workspace_members wm on wm.workspace_id = n.workspace_id
      where n.id = board_members.board_id
        and wm.user_id = auth.uid()
        and wm.role = 'owner'
    )
  );
create policy board_members_delete on board_members for delete
  using (
    exists (
      select 1 from nodes n
      join workspace_members wm on wm.workspace_id = n.workspace_id
      where n.id = board_members.board_id
        and wm.user_id = auth.uid()
        and wm.role = 'owner'
    )
  );

-- Redefine can_access_board: workspace membership is still required; on
-- top of that, if the board has any board_members rows, access is further
-- narrowed to owners + the listed users.
create or replace function can_access_board(_board_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from nodes n
    join workspace_members wm on wm.workspace_id = n.workspace_id
    where n.id = _board_id
      and wm.user_id = auth.uid()
      and (
        wm.role = 'owner'
        or not exists (select 1 from board_members bm where bm.board_id = _board_id)
        or exists (
          select 1 from board_members bm
          where bm.board_id = _board_id and bm.user_id = auth.uid()
        )
      )
  );
$$;

-- Owner-only: remove another member from the workspace (and any per-board
-- allowlist entries they had in it — board_members isn't FK'd to
-- workspace_members so this needs an explicit cleanup, not a cascade).
create or replace function remove_workspace_member(_workspace_id uuid, _user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from workspace_members
    where workspace_id = _workspace_id and user_id = auth.uid() and role = 'owner'
  ) then
    raise exception 'only an owner can remove members';
  end if;

  delete from board_members
    where user_id = _user_id
      and board_id in (select id from nodes where workspace_id = _workspace_id);

  delete from workspace_members
    where workspace_id = _workspace_id and user_id = _user_id;
end;
$$;
