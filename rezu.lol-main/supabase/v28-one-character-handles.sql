-- rezu.lol v28: allow 1-character usernames and aliases.
-- Run after the previous schema/migrations.

-- Update the base profiles username check constraint if it exists.
alter table public.profiles
  drop constraint if exists username_ok;

alter table public.profiles
  add constraint username_ok check (
    (username::text) ~ '^[a-z0-9_]{1,20}$'
    and lower(username::text) not in
      ('login','signup','dashboard','api','admin','auth','about','terms','privacy','_next','static')
  );

-- Keep username + alias in the same global namespace, now allowing length 1.
create or replace function public.validate_profile_handles()
returns trigger
language plpgsql
as $$
declare
  clean_username text;
  clean_alias text;
begin
  clean_username := lower(coalesce(new.username::text, ''));
  clean_alias := nullif(lower(coalesce(new.alias::text, '')), '');

  new.username := clean_username::citext;
  new.alias := clean_alias::citext;

  if clean_username !~ '^[a-z0-9_]{1,20}$' then
    raise exception 'Invalid username';
  end if;

  if clean_username in ('login','signup','dashboard','api','admin','auth','about','terms','privacy','_next','static') then
    raise exception 'Reserved username';
  end if;

  if clean_alias is not null then
    if clean_alias !~ '^[a-z0-9_]{1,20}$' then
      raise exception 'Invalid alias';
    end if;

    if clean_alias = clean_username then
      raise exception 'Alias cannot be the same as username';
    end if;

    if clean_alias in ('login','signup','dashboard','api','admin','auth','about','terms','privacy','_next','static') then
      raise exception 'Reserved alias';
    end if;
  end if;

  if exists (
    select 1 from public.profiles p
    where p.id <> new.id
      and (lower(p.username::text) = clean_username or lower(coalesce(p.alias::text,'')) = clean_username)
  ) then
    raise exception 'Username is already taken as a username or alias';
  end if;

  if clean_alias is not null and exists (
    select 1 from public.profiles p
    where p.id <> new.id
      and (lower(p.username::text) = clean_alias or lower(coalesce(p.alias::text,'')) = clean_alias)
  ) then
    raise exception 'Alias is already taken as a username or alias';
  end if;

  return new;
end;
$$;

-- Update email-signup profile creation to accept 1-character usernames.
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
    '#e11d2e',
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

-- Recreate the auth trigger in case an older migration replaced it.
drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function public.create_profile_from_auth_signup();
