-- Shared meeting-notes ("notulen") text per DM conversation pair — one
-- row per unique pair of participants, editable by either side. Pair is
-- stored in canonical order (user_a < user_b) so (A,B) and (B,A) always
-- resolve to the same row instead of creating duplicates; the client is
-- responsible for sorting the two ids before every read/write.
create table dm_notes (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references profiles(id) on delete cascade,
  user_b uuid not null references profiles(id) on delete cascade,
  body text not null default '',
  updated_at timestamptz not null default now(),
  updated_by uuid references profiles(id),
  constraint dm_notes_pair_order check (user_a < user_b),
  unique (user_a, user_b)
);

alter table dm_notes enable row level security;

create policy dm_notes_select on dm_notes for select
  using (auth.uid() = user_a or auth.uid() = user_b);

create policy dm_notes_insert on dm_notes for insert
  with check (auth.uid() = user_a or auth.uid() = user_b);

create policy dm_notes_update on dm_notes for update
  using (auth.uid() = user_a or auth.uid() = user_b)
  with check (auth.uid() = user_a or auth.uid() = user_b);

alter publication supabase_realtime add table dm_notes;
