-- Phase 3 of member management: 1:1 direct messaging. Scope deliberately
-- kept simple (no group DMs) — reachable only from MemberDirectory, which
-- is already workspace-scoped, so "can message anyone you share a
-- workspace with" is enforced at the UI level rather than a DB constraint.

create table direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references profiles(id) on delete cascade,
  recipient_id uuid not null references profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index idx_direct_messages_sender on direct_messages(sender_id);
create index idx_direct_messages_recipient on direct_messages(recipient_id);

alter table direct_messages enable row level security;

create policy direct_messages_select on direct_messages for select
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

create policy direct_messages_insert on direct_messages for insert
  with check (auth.uid() = sender_id);

-- Only the recipient marks a message read.
create policy direct_messages_update_read on direct_messages for update
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);

alter publication supabase_realtime add table direct_messages;
