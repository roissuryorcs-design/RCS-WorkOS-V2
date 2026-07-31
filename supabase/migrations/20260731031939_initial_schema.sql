-- ============================================================
-- RCS-WorkOS-V2 initial multi-tenant schema
-- See plan: workspaces -> (folders|boards) -> columns/groups/items -> updates
-- ============================================================

-- ------------------------------------------------------------
-- 1. profiles
-- ------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Auto-populate a profile row whenever a new auth user is created.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ------------------------------------------------------------
-- 2. workspaces / workspace_members / workspace_invites
-- ------------------------------------------------------------
create table workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table workspace_members (
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);
create index idx_workspace_members_user on workspace_members(user_id);

create table workspace_invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  code text not null unique,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_by uuid references profiles(id),
  max_uses integer,
  use_count integer not null default 0,
  expires_at timestamptz,
  revoked boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_workspace_invites_workspace on workspace_invites(workspace_id);

-- ------------------------------------------------------------
-- 3. nodes (folders + boards, polymorphic — matches today's flat nodes[])
-- ------------------------------------------------------------
create table nodes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  type text not null check (type in ('folder', 'board')),
  name text not null,
  parent_id uuid references nodes(id) on delete cascade,
  position integer not null default 0,
  collapsed boolean not null default false,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_nodes_workspace on nodes(workspace_id);
create index idx_nodes_parent on nodes(parent_id);

-- ------------------------------------------------------------
-- 4. boards (1:1 extension of nodes where type='board')
-- ------------------------------------------------------------
create table boards (
  id uuid primary key references nodes(id) on delete cascade,
  title text,
  subtitle text,
  current_view text not null default 'table' check (current_view in ('table', 'dashboard')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table user_board_favorites (
  user_id uuid not null references profiles(id) on delete cascade,
  board_id uuid not null references nodes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, board_id)
);

-- ------------------------------------------------------------
-- 5. columns
-- ------------------------------------------------------------
create table columns (
  id text not null,
  board_id uuid not null references nodes(id) on delete cascade,
  label text not null,
  type text not null,
  width integer not null default 150,
  visible boolean not null default true,
  position integer not null default 0,
  statuses jsonb,
  status_order jsonb,
  progress_stages jsonb,
  formula text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (board_id, id)
);

-- ------------------------------------------------------------
-- 6. groups (consolidates board-groups + forelGroupColors + forelGroupHeaderColors)
-- ------------------------------------------------------------
create table groups (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references nodes(id) on delete cascade,
  name text not null,
  color text not null default '#3b82f6',
  header_color text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (board_id, name)
);
create index idx_groups_board on groups(board_id);

-- ------------------------------------------------------------
-- 7. items (flat adjacency list, replaces nested children[])
-- ------------------------------------------------------------
create table items (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references nodes(id) on delete cascade,
  group_id uuid references groups(id) on delete cascade,
  parent_id uuid references items(id) on delete cascade,
  position integer not null default 0,
  depth integer not null default 0,
  name text not null default '',
  is_expanded boolean not null default false,
  fields jsonb not null default '{}',
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_items_board on items(board_id);
create index idx_items_parent on items(parent_id);
create index idx_items_group on items(group_id);

-- ------------------------------------------------------------
-- 8. updates (comments/replies, soft-delete)
-- ------------------------------------------------------------
create table updates (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references items(id) on delete cascade,
  parent_id uuid references updates(id) on delete cascade,
  author_id uuid references profiles(id),
  text text not null default '',
  files jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_updates_item on updates(item_id);
create index idx_updates_parent on updates(parent_id);

-- ============================================================
-- RLS helper functions
-- ============================================================
create or replace function is_workspace_member(_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from workspace_members
    where workspace_id = _workspace_id and user_id = auth.uid()
  );
$$;

create or replace function can_access_board(_board_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from nodes n
    join workspace_members wm on wm.workspace_id = n.workspace_id
    where n.id = _board_id and wm.user_id = auth.uid()
  );
$$;

-- ============================================================
-- SECURITY DEFINER RPCs (escape the chicken-and-egg RLS problem)
-- ============================================================
create or replace function create_workspace(_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare _id uuid;
begin
  insert into workspaces (name, created_by) values (_name, auth.uid()) returning id into _id;
  insert into workspace_members (workspace_id, user_id, role) values (_id, auth.uid(), 'owner');
  return _id;
end;
$$;

create or replace function redeem_workspace_invite(_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare _invite workspace_invites%rowtype;
begin
  select * into _invite from workspace_invites
    where code = _code and not revoked
      and (expires_at is null or expires_at > now())
      and (max_uses is null or use_count < max_uses);

  if not found then
    raise exception 'invalid or expired invite code';
  end if;

  insert into workspace_members (workspace_id, user_id, role)
    values (_invite.workspace_id, auth.uid(), _invite.role)
    on conflict do nothing;

  update workspace_invites set use_count = use_count + 1 where id = _invite.id;

  return _invite.workspace_id;
end;
$$;

-- ============================================================
-- Row Level Security
-- ============================================================
alter table profiles enable row level security;
alter table workspaces enable row level security;
alter table workspace_members enable row level security;
alter table workspace_invites enable row level security;
alter table nodes enable row level security;
alter table boards enable row level security;
alter table user_board_favorites enable row level security;
alter table columns enable row level security;
alter table groups enable row level security;
alter table items enable row level security;
alter table updates enable row level security;

-- profiles: any authenticated user can read (display name/avatar only,
-- low sensitivity); users can only update their own row.
create policy profiles_select on profiles for select
  using (auth.role() = 'authenticated');
create policy profiles_update_own on profiles for update
  using (id = auth.uid());

-- workspaces: visible/writable to members only. Insert happens only via
-- create_workspace() (SECURITY DEFINER), so no direct insert policy needed,
-- but we allow it for members updating their own workspace's metadata.
create policy workspaces_select on workspaces for select
  using (is_workspace_member(id));
create policy workspaces_update on workspaces for update
  using (is_workspace_member(id));

-- workspace_members: see your own memberships and co-members of workspaces
-- you belong to. No direct insert/delete policy for INSERT (goes through
-- RPCs) — DELETE (leave workspace) is allowed for your own row.
create policy workspace_members_select on workspace_members for select
  using (user_id = auth.uid() or is_workspace_member(workspace_id));
create policy workspace_members_delete_own on workspace_members for delete
  using (user_id = auth.uid());

-- workspace_invites: owner-only.
create policy workspace_invites_all on workspace_invites for all
  using (
    exists (
      select 1 from workspace_members
      where workspace_id = workspace_invites.workspace_id
        and user_id = auth.uid()
        and role = 'owner'
    )
  )
  with check (
    exists (
      select 1 from workspace_members
      where workspace_id = workspace_invites.workspace_id
        and user_id = auth.uid()
        and role = 'owner'
    )
  );

-- nodes / boards / columns / groups / items: member-scoped via can_access_board
-- (nodes IS the board/folder id space, so nodes uses is_workspace_member directly).
create policy nodes_select on nodes for select using (is_workspace_member(workspace_id));
create policy nodes_write on nodes for all
  using (is_workspace_member(workspace_id))
  with check (is_workspace_member(workspace_id));

create policy boards_select on boards for select using (can_access_board(id));
create policy boards_write on boards for all
  using (can_access_board(id))
  with check (can_access_board(id));

create policy columns_select on columns for select using (can_access_board(board_id));
create policy columns_write on columns for all
  using (can_access_board(board_id))
  with check (can_access_board(board_id));

create policy groups_select on groups for select using (can_access_board(board_id));
create policy groups_write on groups for all
  using (can_access_board(board_id))
  with check (can_access_board(board_id));

create policy items_select on items for select using (can_access_board(board_id));
create policy items_write on items for all
  using (can_access_board(board_id))
  with check (can_access_board(board_id));

-- updates: scoped via the parent item's board.
create policy updates_select on updates for select
  using (exists (select 1 from items where items.id = updates.item_id and can_access_board(items.board_id)));
create policy updates_write on updates for all
  using (exists (select 1 from items where items.id = updates.item_id and can_access_board(items.board_id)))
  with check (exists (select 1 from items where items.id = updates.item_id and can_access_board(items.board_id)));

-- user_board_favorites: own rows only.
create policy favorites_select on user_board_favorites for select using (user_id = auth.uid());
create policy favorites_write on user_board_favorites for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and can_access_board(board_id));

-- ============================================================
-- Realtime — enable Postgres Changes replication on collaborative tables
-- ============================================================
alter publication supabase_realtime add table nodes;
alter publication supabase_realtime add table boards;
alter publication supabase_realtime add table columns;
alter publication supabase_realtime add table groups;
alter publication supabase_realtime add table items;
alter publication supabase_realtime add table updates;
