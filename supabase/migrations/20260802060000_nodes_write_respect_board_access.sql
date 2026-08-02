-- ------------------------------------------------------------
-- Follow-up to 20260802050000: that migration fixed `nodes_select`, but
-- missed that `nodes_write` is declared `for all` — which *also* covers
-- SELECT. Postgres combines multiple permissive policies for the same
-- command with OR, so nodes_write's broader (unrestricted) condition was
-- still letting a restricted board's node through even though
-- nodes_select correctly blocked it — a restricted board stayed visible
-- in the sidebar no matter how many times the client refetched.
-- ------------------------------------------------------------
drop policy if exists nodes_write on nodes;

create policy nodes_write on nodes for all
  using (is_workspace_member(workspace_id) and (type = 'folder' or can_access_board(id)))
  with check (is_workspace_member(workspace_id) and (type = 'folder' or can_access_board(id)));
