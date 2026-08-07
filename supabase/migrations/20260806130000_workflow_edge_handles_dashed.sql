-- Persists exactly which side of each node a connection was actually
-- dragged from/to (manual, not auto-recomputed on every node move), plus
-- an optional dashed line style per edge.
alter table workflow_edges add column source_handle text;
alter table workflow_edges add column target_handle text;
alter table workflow_edges add column dashed boolean not null default false;
