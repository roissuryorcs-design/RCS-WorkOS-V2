-- File attachments (same shape as updates.files) plus edit/delete support
-- for board_messages — previously insert-and-select only.
alter table board_messages add column files jsonb not null default '[]';
alter table board_messages add column edited_at timestamptz;

create policy board_messages_update on board_messages for update
  using (sender_id = auth.uid())
  with check (sender_id = auth.uid());

create policy board_messages_delete on board_messages for delete
  using (sender_id = auth.uid());
