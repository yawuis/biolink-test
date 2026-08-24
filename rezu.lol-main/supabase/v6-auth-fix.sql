-- ============================================================================
-- rezu.lol · v6 auth / signup fix
-- Run this in Supabase SQL Editor after schema.sql and v4-pro-dashboard-upgrade.sql.
-- This fixes:
--   1. "new row violates row-level security policy for table profiles"
--   2. email confirmation creating an auth user before the browser has a session
--   3. verification links landing back on the app correctly
-- ============================================================================

create extension if not exists citext;

-- Make sure the base profiles policies exist, even if an older SQL file missed them.
alter table public.profiles enable row level security;

drop policy if exists "profiles_public_read" on public.profiles;
create policy "profiles_public_read" on public.profiles
  for select using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- The app now sends claim_username in Supabase auth metadata during email signup.
-- When email confirmation is enabled, the browser does NOT have a logged-in session
-- yet, so client-side profile insert fails RLS. This trigger reserves the username
-- safely from the server side as soon as Supabase creates auth.users.
create or replace function public.create_profile_from_auth_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested text;
  clean_username citext;
begin
  requested := coalesce(new.raw_user_meta_data ->> 'claim_username', '');
  requested := lower(regexp_replace(requested, '[^a-z0-9_]', '', 'g'));

  -- Discord/OAuth users do not use this. They still go through /claim if needed.
  if requested = '' then
    return new;
  end if;

  if requested !~ '^[a-z0-9_]{1,20}$' then
    raise exception 'Invalid username';
  end if;

  if requested in ('login','signup','dashboard','api','admin','auth','about','terms','privacy','_next','static') then
    raise exception 'Reserved username';
  end if;

  clean_username := requested::citext;

  insert into public.profiles (
    id,
    username,
    display_name,
    accent,
    text_color,
    icon_color,
    background_color,
    bg,
    modules,
    discord_id,
    discord_enabled
  ) values (
    new.id,
    clean_username,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), requested),
    '#55acee',
    '#ffffff',
    '#ffffff',
    '#000000',
    'void',
    '["about","discord","github","spotify","clock"]'::jsonb,
    null,
    false
  );

  return new;
exception
  when unique_violation then
    raise exception 'Username is already taken';
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function public.create_profile_from_auth_signup();

-- Alias uniqueness: one alias can only belong to one account. Blank aliases stay NULL.
create unique index if not exists profiles_alias_unique_idx
  on public.profiles (lower(alias::text))
  where alias is not null and alias::text <> '';
