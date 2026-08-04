-- Restricts creating/deleting boards & folders (nodes) to workspace
-- owner/admin — a plain 'member' can still see and rename/reorder/collapse
-- what they have access to, but can't add or remove boards/folders.
--
-- nodes_write was previously a single `for all` policy (same rule for
-- insert/update/delete). Split into separate per-command policies so
-- update can stay open to any member while insert/delete gate on role.
drop policy if exists nodes_write on nodes;

create policy nodes_update on nodes for update
  using (is_workspace_member(workspace_id) and (type = 'folder' or can_access_board(id)))
  with check (is_workspace_member(workspace_id));

create policy nodes_insert on nodes for insert
  with check (
    exists (
      select 1 from workspace_members
      where workspace_id = nodes.workspace_id
        and user_id = auth.uid()
        and role in ('owner', 'admin')
    )
  );

create policy nodes_delete on nodes for delete
  using (
    is_workspace_member(workspace_id) and (type = 'folder' or can_access_board(id))
    and exists (
      select 1 from workspace_members
      where workspace_id = nodes.workspace_id
        and user_id = auth.uid()
        and role in ('owner', 'admin')
    )
  );
