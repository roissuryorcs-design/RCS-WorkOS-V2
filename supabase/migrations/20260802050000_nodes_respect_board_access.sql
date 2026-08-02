-- ------------------------------------------------------------
-- Fixes a real gap: board-level access restriction (board_members /
-- access_restricted) only ever gated the *content* tables (boards,
-- columns, groups, items, updates) via can_access_board(). The sidebar
-- tree itself (`nodes`) was still governed purely by workspace
-- membership, so a restricted board stayed visible/clickable in the
-- sidebar for excluded members — it just rendered empty once opened,
-- instead of disappearing entirely as intended.
--
-- Folders aren't board content and have no restriction concept of their
-- own, so they stay workspace-membership-gated; only board-type nodes
-- get the extra can_access_board() check.
-- ------------------------------------------------------------
drop policy if exists nodes_select on nodes;

create policy nodes_select on nodes for select
  using (
    is_workspace_member(workspace_id)
    and (type = 'folder' or can_access_board(id))
  );
