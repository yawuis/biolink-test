-- ============================================================================
--  rezu.lol  ·  v2 upgrade
--  Run this in: Supabase Dashboard → SQL Editor → New query
--  Safe to run on an existing project — it only ADDS things.
-- ============================================================================

-- 1) New profile fields for the "vibe" layer ---------------------------------
alter table public.profiles
  add column if not exists background_url text default '',
  add column if not exists audio_url      text default '',
  add column if not exists effect         text default 'none',
  add column if not exists cursor_effect  text default 'none',
  add column if not exists enter_text     text default 'click to enter';

-- 2) Storage bucket for uploads (backgrounds, audio, avatars) -----------------
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- 3) Storage access rules -----------------------------------------------------
-- Anyone can VIEW files (so public profiles can show them).
drop policy if exists "media_public_read" on storage.objects;
create policy "media_public_read" on storage.objects
  for select using (bucket_id = 'media');

-- A logged-in user can only write to a folder named after their own user id,
-- e.g. media/<their-uid>/bg.png — so nobody can overwrite someone else's files.
drop policy if exists "media_owner_insert" on storage.objects;
create policy "media_owner_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "media_owner_update" on storage.objects;
create policy "media_owner_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "media_owner_delete" on storage.objects;
create policy "media_owner_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
