-- Optional pictogram per node (rendered as a small badge above the box),
-- matching the illustrated-icon style seen in reference workflow diagrams
-- (a person-at-laptop icon for "design", a report icon for "review", etc).
alter table workflow_nodes add column icon text;
