-- Phase 4 of member management: notifications for @mentions and direct
-- messages. Insert is allowed for any authenticated user since a
-- notification is always created *for someone else* (the recipient) by
-- whoever triggered it (mentioning them in a comment, or DMing them) —
-- only the recipient can read/mark their own as read.

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,   -- recipient
  actor_id uuid not null references profiles(id) on delete cascade,  -- who triggered it
  type text not null check (type in ('mention', 'dm')),
  source_id uuid,
  preview text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_notifications_user on notifications(user_id);

alter table notifications enable row level security;

create policy notifications_select on notifications for select
  using (auth.uid() = user_id);

create policy notifications_insert on notifications for insert
  with check (auth.uid() = actor_id);

create policy notifications_update_read on notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter publication supabase_realtime add table notifications;
