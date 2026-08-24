-- ============================================================================
--  rezu.lol · v4 dashboard / public profile / image-host upgrade
--  Safe to run multiple times. Adds only new columns, policies, and buckets.
-- ============================================================================

create extension if not exists pgcrypto;
create extension if not exists citext;

alter table public.profiles
  add column if not exists background_url text default '',
  add column if not exists audio_url text default '',
  add column if not exists audio_tracks jsonb default '[]'::jsonb,
  add column if not exists audio_shuffle boolean default false,
  add column if not exists public_uid integer,
  add column if not exists effect text default 'none',
  add column if not exists cursor_effect text default 'none',
  add column if not exists enter_text text default 'click to enter',
  add column if not exists layout text default 'classic',
  add column if not exists discord_id text default '',
  add column if not exists discord_enabled boolean default false,
  add column if not exists discord_invite_url text default '',
  add column if not exists alias citext,
  add column if not exists github_user text default '',
  add column if not exists timezone text default '',
  add column if not exists skills jsonb default '[]'::jsonb,
  add column if not exists modules jsonb default '["about","discord","github","spotify","clock"]'::jsonb,
  add column if not exists aliases jsonb default '[]'::jsonb,
  add column if not exists badges jsonb default '[]'::jsonb,
  add column if not exists text_color text default '#ffffff',
  add column if not exists icon_color text default '#ffffff',
  add column if not exists background_color text default '#000000',
  add column if not exists primary_color text default '#000000',
  add column if not exists secondary_color text default '#ffffff',
  add column if not exists background_effect_color text default '#ffffff',
  add column if not exists profile_opacity integer default 70,
  add column if not exists profile_blur integer default 22,
  add column if not exists avatar_shape text default 'circle',
  add column if not exists location text default '',
  add column if not exists pronouns text default '',
  add column if not exists font text default 'Inter',
  add column if not exists profile_animation text default 'unfold',
  add column if not exists background_effect text default 'blurred',
  add column if not exists username_effect text default 'none',
  add column if not exists profile_gradient boolean default false,
  add column if not exists monochrome_icons boolean default true,
  add column if not exists animated_title boolean default true,
  add column if not exists use_discord_avatar boolean default false,
  add column if not exists swap_box_colors boolean default true,
  add column if not exists discord_avatar_decoration boolean default false,
  add column if not exists badges_glow boolean default true,
  add column if not exists hide_views boolean default false,
  add column if not exists hide_likes boolean default false,
  add column if not exists hide_join_date boolean default false,
  add column if not exists search_indexing boolean default true,
  add column if not exists website_title text default '',
  add column if not exists website_description text default '',
  add column if not exists website_image_url text default '',
  add column if not exists favicon_url text default '',
  add column if not exists add_user_info_overlay boolean default true,
  add column if not exists spotify_title text default '',
  add column if not exists spotify_artist text default '',
  add column if not exists spotify_url text default '',
  add column if not exists spotify_cover_url text default '';

insert into storage.buckets (id, name, public)
values ('media', 'media', true), ('image-host', 'image-host', true)
on conflict (id) do nothing;

-- Public read for profile media and image-host files.
drop policy if exists "media_public_read" on storage.objects;
create policy "media_public_read" on storage.objects
  for select using (bucket_id = 'media');

drop policy if exists "image_host_public_read" on storage.objects;
create policy "image_host_public_read" on storage.objects
  for select using (bucket_id = 'image-host');

-- Users can only write/delete files inside their own folder.
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

drop policy if exists "image_host_owner_insert" on storage.objects;
create policy "image_host_owner_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'image-host' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "image_host_owner_update" on storage.objects;
create policy "image_host_owner_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'image-host' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "image_host_owner_delete" on storage.objects;
create policy "image_host_owner_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'image-host' and (storage.foldername(name))[1] = auth.uid()::text);

create table if not exists public.hosted_images (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  url text not null,
  path text not null,
  name text not null,
  size integer default 0,
  created_at timestamptz default now()
);

alter table public.hosted_images enable row level security;

drop policy if exists "hosted_images_owner_read" on public.hosted_images;
create policy "hosted_images_owner_read" on public.hosted_images
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "hosted_images_owner_insert" on public.hosted_images;
create policy "hosted_images_owner_insert" on public.hosted_images
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "hosted_images_owner_delete" on public.hosted_images;
create policy "hosted_images_owner_delete" on public.hosted_images
  for delete to authenticated using (auth.uid() = user_id);


-- ============================================================================
-- v5 cleanup: unique aliases, owner badge lock support, real templates, safer views
-- ============================================================================

-- Only one user can own a username (already true in schema) and only one user can
-- own a given alias. Blank aliases are stored as NULL so they do not collide.
create unique index if not exists profiles_alias_unique_idx
  on public.profiles (lower(alias::text))
  where alias is not null and alias::text <> '';

-- Owner/admin marker. Use this for future admin-only badge unlocks.
create table if not exists public.app_owners (
  email citext primary key,
  created_at timestamptz default now()
);

insert into public.app_owners (email)
values ('brallowjillow@gmail.com')
on conflict (email) do nothing;

-- User-created profile templates.
create table if not exists public.profile_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  description text default '',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.profile_templates enable row level security;

drop policy if exists "profile_templates_owner_read" on public.profile_templates;
create policy "profile_templates_owner_read" on public.profile_templates
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "profile_templates_owner_insert" on public.profile_templates;
create policy "profile_templates_owner_insert" on public.profile_templates
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "profile_templates_owner_delete" on public.profile_templates;
create policy "profile_templates_owner_delete" on public.profile_templates
  for delete to authenticated using (auth.uid() = user_id);

-- View events: one counted view per profile + hashed viewer per day.
create table if not exists public.profile_view_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  viewer_hash text not null,
  created_at timestamptz default now(),
  unique (profile_id, viewer_hash)
);

alter table public.profile_view_events enable row level security;

drop policy if exists "profile_view_events_no_direct_read" on public.profile_view_events;
create policy "profile_view_events_no_direct_read" on public.profile_view_events
  for select using (false);

create or replace function public.increment_view_once(profile_username citext, viewer_hash text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid;
begin
  select id into target_id
  from public.profiles
  where username = profile_username
  limit 1;

  if target_id is null then
    return;
  end if;

  insert into public.profile_view_events(profile_id, viewer_hash)
  values (target_id, viewer_hash)
  on conflict do nothing;

  if found then
    update public.profiles
    set views = views + 1
    where id = target_id;
  end if;
end;
$$;

grant execute on function public.increment_view_once(citext, text) to anon, authenticated;

-- If you are using email signup with confirmation enabled, also run:
-- supabase/v6-auth-fix.sql
