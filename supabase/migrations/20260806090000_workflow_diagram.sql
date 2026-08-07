-- Freeform workflow/flowchart view — a new per-board canvas of draggable,
-- connectable nodes (separate from the Status column's fixed states),
-- matching the "Workflow" tab pattern seen in reference tools: nodes carry
-- their own label/color/position, edges just connect two node ids.
create table workflow_nodes (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references nodes(id) on delete cascade,
  label text not null default 'New task',
  color text not null default '#808080',
  pos_x double precision not null default 0,
  pos_y double precision not null default 0,
  created_at timestamptz not null default now()
);
create index idx_workflow_nodes_board on workflow_nodes(board_id);

create table workflow_edges (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references nodes(id) on delete cascade,
  source_id uuid not null references workflow_nodes(id) on delete cascade,
  target_id uuid not null references workflow_nodes(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index idx_workflow_edges_board on workflow_edges(board_id);

alter table workflow_nodes enable row level security;
alter table workflow_edges enable row level security;

create policy workflow_nodes_select on workflow_nodes for select using (can_access_board(board_id));
create policy workflow_nodes_write on workflow_nodes for all
  using (can_access_board(board_id))
  with check (can_access_board(board_id));

create policy workflow_edges_select on workflow_edges for select using (can_access_board(board_id));
create policy workflow_edges_write on workflow_edges for all
  using (can_access_board(board_id))
  with check (can_access_board(board_id));

alter publication supabase_realtime add table workflow_nodes;
alter publication supabase_realtime add table workflow_edges;
