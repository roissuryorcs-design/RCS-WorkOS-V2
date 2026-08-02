-- ------------------------------------------------------------
-- Fixes a serious regression from the access_restricted work: creating a
-- new board always inserts into `nodes` first, then `boards` second
-- (boards.id is itself a FK to nodes.id, so the order can't be reversed).
-- can_access_board()'s `join boards b on b.id = n.id` was an INNER JOIN,
-- so during that brief window where the nodes row exists but the boards
-- row doesn't yet, the join found nothing and access was denied — every
-- new board insert failed RLS ("new row violates row-level security
-- policy for table nodes"), whether created through the normal UI or the
-- legacy importer.
--
-- Switched to LEFT JOIN + coalesce: a board with no boards row yet (or
-- one where access_restricted was somehow never set) is treated as
-- unrestricted, matching the intended default.
-- ------------------------------------------------------------
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
    left join boards b on b.id = n.id
    where n.id = _board_id
      and wm.user_id = auth.uid()
      and (
        wm.role = 'owner'
        or coalesce(b.access_restricted, false) = false
        or exists (
          select 1 from board_members bm
          where bm.board_id = _board_id and bm.user_id = auth.uid()
        )
      )
  );
$$;
