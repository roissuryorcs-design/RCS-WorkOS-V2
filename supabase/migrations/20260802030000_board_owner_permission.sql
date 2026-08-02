-- ------------------------------------------------------------
-- Refines the permission model per user feedback (mirrors monday.com's
-- distinction between "board owner" and account "Administrator"):
--   - workspace_members.role = 'owner' is the workspace ADMINISTRATOR —
--     full power, access to every board, can remove members. Unchanged.
--   - a board's creator (nodes.created_by) is that specific board's OWNER
--     and should also be able to manage *that board's* access allowlist,
--     without needing workspace-admin power.
-- Boards created before this migration have created_by = null (it wasn't
-- being set) — for those, only the workspace administrator can manage
-- access until something re-attributes them; no backfill attempted here.
-- ------------------------------------------------------------
drop policy if exists board_members_insert on board_members;
drop policy if exists board_members_delete on board_members;

create policy board_members_insert on board_members for insert
  with check (
    exists (
      select 1 from nodes n
      join workspace_members wm on wm.workspace_id = n.workspace_id
      where n.id = board_members.board_id
        and wm.user_id = auth.uid()
        and (wm.role = 'owner' or n.created_by = auth.uid())
    )
  );
create policy board_members_delete on board_members for delete
  using (
    exists (
      select 1 from nodes n
      join workspace_members wm on wm.workspace_id = n.workspace_id
      where n.id = board_members.board_id
        and wm.user_id = auth.uid()
        and (wm.role = 'owner' or n.created_by = auth.uid())
    )
  );
