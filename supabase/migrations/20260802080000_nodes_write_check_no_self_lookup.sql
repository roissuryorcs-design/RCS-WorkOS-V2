-- ------------------------------------------------------------
-- Fixes the real root cause behind board creation always failing RLS:
-- nodes_write's WITH CHECK called can_access_board(id), which itself
-- queries `from nodes n where n.id = _board_id` — a self-referential
-- lookup into the very table being inserted into. During an INSERT, the
-- new row isn't yet a visible committed tuple when WITH CHECK runs, so
-- that inner lookup can never find it and can_access_board() always
-- returned false for a brand-new board node, regardless of the earlier
-- boards-row-missing fix (20260802070000) — that fix was necessary but
-- not sufficient.
--
-- WITH CHECK's job is "is this a valid row", not "does this specific
-- user have elevated per-board access" — that's already USING's job
-- (evaluated against rows that already exist, so the self-lookup works
-- fine there). Dropping can_access_board() from WITH CHECK entirely;
-- USING still fully enforces the restriction for reading/targeting
-- existing restricted boards.
-- ------------------------------------------------------------
drop policy if exists nodes_write on nodes;

create policy nodes_write on nodes for all
  using (is_workspace_member(workspace_id) and (type = 'folder' or can_access_board(id)))
  with check (is_workspace_member(workspace_id));
