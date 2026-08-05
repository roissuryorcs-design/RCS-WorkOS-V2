-- Group-level archive (same idea as nodes.archived_at for boards) plus a
-- trash/soft-delete column for both groups and boards (nodes), giving
-- deletions a 15-day restore window instead of being instantly permanent.
-- Also adds the missing DELETE policy on workspaces, needed for the new
-- "permanently delete workspace" action (owner-only) — previously no
-- policy existed at all, so RLS silently denied every delete attempt.
alter table groups add column archived_at timestamptz;
alter table groups add column deleted_at timestamptz;
alter table nodes add column deleted_at timestamptz;

create policy workspaces_delete on workspaces for delete
  using (exists (
    select 1 from workspace_members wm
    where wm.workspace_id = workspaces.id
      and wm.user_id = auth.uid()
      and wm.role = 'owner'
  ));
