-- Lets each workflow node pick a flowchart shape (rectangle/diamond/
-- circle/parallelogram) instead of always being a plain rounded box.
alter table workflow_nodes add column shape text not null default 'rectangle';
