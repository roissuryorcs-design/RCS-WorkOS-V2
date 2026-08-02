-- ------------------------------------------------------------
-- Fixes a real bug: "empty board_members = unrestricted" was ambiguous
-- when a board has only one non-owner member and that member gets
-- unchecked — the resulting empty list was indistinguishable from "never
-- restricted", so the restriction silently reverted to "open to everyone"
-- instead of "restricted to owner only". Adds an explicit flag instead of
-- inferring intent from row count.
-- ------------------------------------------------------------
alter table boards add column access_restricted boolean not null default false;

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
    join boards b on b.id = n.id
    where n.id = _board_id
      and wm.user_id = auth.uid()
      and (
        wm.role = 'owner'
        or not b.access_restricted
        or exists (
          select 1 from board_members bm
          where bm.board_id = _board_id and bm.user_id = auth.uid()
        )
      )
  );
$$;

-- Only the workspace administrator or that specific board's creator may
-- flip the restriction flag — deliberately separate from the general
-- `boards_write` policy (title/subtitle/view mode), which any member who
-- can already see the board may edit.
create or replace function set_board_access_restricted(_board_id uuid, _restricted boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from nodes n
    join workspace_members wm on wm.workspace_id = n.workspace_id
    where n.id = _board_id
      and wm.user_id = auth.uid()
      and (wm.role = 'owner' or n.created_by = auth.uid())
  ) then
    raise exception 'only the board owner or workspace administrator can change access settings';
  end if;

  update boards set access_restricted = _restricted where id = _board_id;
end;
$$;
