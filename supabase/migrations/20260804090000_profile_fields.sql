-- Phase 1 of member profiles/directory/DM/notifications work: extend
-- profiles with the fields needed for a real member directory (job title,
-- phone, hobby). avatar_url already exists on the table but nothing has
-- ever written to it — this phase's frontend work adds the upload UI.
-- No new RLS needed: profiles_select (any authenticated user) and
-- profiles_update_own (id = auth.uid()) from the initial schema already
-- cover reading these and letting a user edit their own row.

alter table profiles add column if not exists job_title text;
alter table profiles add column if not exists phone text;
alter table profiles add column if not exists hobby text;
