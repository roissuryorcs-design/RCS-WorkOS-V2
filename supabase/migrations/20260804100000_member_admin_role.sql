-- Adds an 'admin' role alongside the existing 'owner'/'member', and an
-- owner-only RPC to set it — same SECURITY DEFINER pattern as
-- remove_workspace_member (no direct UPDATE policy exists on
-- workspace_members, so this is the only way to change a role).

alter table workspace_members drop constraint if exists workspace_members_role_check;
alter table workspace_members add constraint workspace_members_role_check
  check (role in ('owner', 'admin', 'member'));

create or replace function set_member_role(_workspace_id uuid, _user_id uuid, _role text)
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
    raise exception 'only an owner can change member roles';
  end if;

  if _role not in ('owner', 'admin', 'member') then
    raise exception 'invalid role: %', _role;
  end if;

  update workspace_members
    set role = _role
    where workspace_id = _workspace_id and user_id = _user_id;
end;
$$;
