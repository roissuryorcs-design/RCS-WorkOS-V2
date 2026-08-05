-- Lets the notification bell deep-link straight to where a mention
-- happened instead of just marking it read. source_type distinguishes an
-- item-comment mention (UpdatePanel) from a board-chat mention
-- (BoardDiscussionPanel) so the click handler knows whether to open the
-- item's comment panel or the board discussion channel; board_id/item_id
-- are denormalized here (same idea as updates.board_id) to avoid an extra
-- lookup at click time.
alter table notifications add column source_type text;
alter table notifications add column board_id uuid references nodes(id) on delete cascade;
alter table notifications add column item_id uuid references items(id) on delete cascade;
