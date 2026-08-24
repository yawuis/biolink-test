-- ============================================================================
--  bio.link  ·  Supabase schema
--  Run this whole file once in:  Supabase Dashboard → SQL Editor → New query
-- ============================================================================

-- citext = case-insensitive text. This is what makes "Midnight" and "midnight"
-- count as the SAME name, so only one person can ever own it.
create extension if not exists citext;

-- ── One row per user ────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     citext unique not null,          -- ← THE uniqueness guarantee
  display_name text   default '',
  bio          text   default '',
  accent       text   default '#55acee',
  bg           text   default 'void',
  avatar_url   text   default '',
  links        jsonb  default '[]'::jsonb,
  views        integer default 0,
  created_at   timestamptz default now(),

  -- format guard + a few reserved names that collide with app routes
  constraint username_ok check (
    (username::text) ~ '^[a-z0-9_]{1,20}$'
    and lower(username::text) not in
      ('login','signup','dashboard','api','admin','auth','about','terms','privacy','_next','static')
  )
);

-- ── Row Level Security ──────────────────────────────────────────────────────
alter table public.profiles enable row level security;

-- Anyone (even logged out) can READ profiles → public /username pages work.
drop policy if exists "profiles_public_read" on public.profiles;
create policy "profiles_public_read" on public.profiles
  for select using (true);

-- A logged-in user can create ONLY their own row (id must match their auth id).
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- A user can update ONLY their own row.
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ── View counter ────────────────────────────────────────────────────────────
-- SECURITY DEFINER lets an anonymous visitor bump the count without being able
-- to edit anything else on the row.
create or replace function public.increment_views(profile_username citext)
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles set views = views + 1 where username = profile_username;
$$;

grant execute on function public.increment_views(citext) to anon, authenticated;
