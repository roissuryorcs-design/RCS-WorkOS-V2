-- WhatsApp-style "reply to a specific message" in the board discussion
-- channel — nullable self-reference, no RLS change needed since the
-- existing select/insert policies on board_messages already cover it.
alter table board_messages add column reply_to_id uuid references board_messages(id) on delete set null;
