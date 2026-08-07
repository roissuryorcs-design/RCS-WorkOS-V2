-- Manually-draggable bend point per edge (the "yellow dot" on a step
-- path) — null means "auto center", set once dragged.
alter table workflow_edges add column bend_x double precision;
alter table workflow_edges add column bend_y double precision;
