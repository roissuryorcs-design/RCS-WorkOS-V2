-- Workspace File Manager: custom per-board folders, plus a sparse "files"
-- table that only ever holds rows the user has explicitly touched (a
-- direct upload, or an existing item/update/chat file claimed into a
-- folder). Everything else is aggregated live from items/updates/
-- board_messages by the client — see FileManagerContext.

create table file_folders (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references nodes(id) on delete cascade,
  parent_id uuid references file_folders(id) on delete cascade,
  name text not null,
  position integer not null default 0,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create index idx_file_folders_board on file_folders(board_id);
create index idx_file_folders_parent on file_folders(parent_id);

create table files (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references nodes(id) on delete cascade,
  folder_id uuid references file_folders(id) on delete set null,
  source_type text not null check (source_type in ('manual', 'item', 'update', 'message')),
  source_id uuid,
  url text not null,
  name text not null,
  size bigint,
  type text,
  uploaded_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create unique index files_claim_dedupe on files(source_type, source_id, url) where source_type <> 'manual';
create index idx_files_board on files(board_id);
create index idx_files_folder on files(folder_id);

alter table file_folders enable row level security;
alter table files enable row level security;

create policy file_folders_all on file_folders for all
  using (can_access_board(board_id))
  with check (can_access_board(board_id));

create policy files_all on files for all
  using (can_access_board(board_id))
  with check (can_access_board(board_id));

alter publication supabase_realtime add table file_folders;
alter publication supabase_realtime add table files;
