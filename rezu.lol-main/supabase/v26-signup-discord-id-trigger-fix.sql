-- v26: Fix signup/claim failing with profiles_discord_id_digits_chk
-- Cause: older schema upgrades left profiles.discord_id defaulting to ''.
-- The secure Discord linking rule only allows NULL or a real numeric Discord ID.
-- This patch makes unlinked Discord accounts use NULL everywhere, including the auth signup trigger.

alter table public.profiles
  alter column discord_id drop default;

update public.profiles
set discord_id = null,
    discord_enabled = false
where discord_id is not null
  and (trim(discord_id) = '' or discord_id !~ '^[0-9]{15,25}$');

alter table public.profiles
  drop constraint if exists profiles_discord_id_digits_chk;

alter table public.profiles
  add constraint profiles_discord_id_digits_chk
  check (discord_id is null or discord_id ~ '^[0-9]{15,25}$');

-- Keep one Discord account linked to one rezu account.
drop index if exists profiles_unique_discord_id;
create unique index profiles_unique_discord_id
on public.profiles (discord_id)
where discord_id is not null;

-- Recreate the email signup trigger so it explicitly inserts discord_id = NULL.
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
    link_color,
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
