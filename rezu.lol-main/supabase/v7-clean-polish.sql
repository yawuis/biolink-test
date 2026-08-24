-- ============================================================================
-- rezu.lol · v7 clean polish
-- Run after schema.sql, v4-pro-dashboard-upgrade.sql, and v6-auth-fix.sql.
-- Adds sequential public UUIDs, 3-song audio support, stronger username/alias
-- uniqueness, owner setup, and removes the old image-host badge from profile data.
-- ============================================================================

create extension if not exists citext;

-- Red/black/gray/white defaults for new profiles.
alter table public.profiles
  alter column accent set default '#e11d2f',
  alter column bg set default 'void';

alter table public.profiles
  add column if not exists public_uid integer,
  add column if not exists audio_tracks jsonb default '[]'::jsonb,
  add column if not exists audio_shuffle boolean default false;

-- Public sequential UUID: first account = 1, second = 2, etc.
create sequence if not exists public.profiles_public_uid_seq;

with ordered as (
  select id, row_number() over (order by created_at, id) as rn
  from public.profiles
  where public_uid is null
)
update public.profiles p
set public_uid = ordered.rn
from ordered
where p.id = ordered.id;

select setval(
  'public.profiles_public_uid_seq',
  greatest(coalesce((select max(public_uid) from public.profiles), 0), 1),
  coalesce((select max(public_uid) from public.profiles), 0) > 0
);

alter table public.profiles
  alter column public_uid set default nextval('public.profiles_public_uid_seq');

create unique index if not exists profiles_public_uid_unique_idx
  on public.profiles(public_uid);

-- Keep alias blank values as NULL and enforce one global namespace across
-- usernames and aliases. If someone owns /kill as an alias, nobody can take
-- /kill as a username, and vice versa.
create unique index if not exists profiles_alias_unique_idx
  on public.profiles (lower(alias::text))
  where alias is not null and alias::text <> '';

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

drop trigger if exists validate_profile_handles_before_write on public.profiles;
create trigger validate_profile_handles_before_write
  before insert or update of username, alias on public.profiles
  for each row execute function public.validate_profile_handles();

-- Owner account. Dashboard/server code treats this email as owner for locked badges.
create table if not exists public.app_owners (
  email citext primary key,
  created_at timestamptz default now()
);

alter table public.app_owners enable row level security;

drop policy if exists "app_owners_public_read" on public.app_owners;
create policy "app_owners_public_read" on public.app_owners
  for select using (true);

insert into public.app_owners(email)
values ('brallowjillow@gmail.com')
on conflict(email) do nothing;

-- Remove the removed Image Host badge from existing JSON badge arrays.
update public.profiles
set badges = coalesce((
  select jsonb_agg(item)
  from jsonb_array_elements(coalesce(badges, '[]'::jsonb)) item
  where item ->> 'id' <> 'image-host'
), '[]'::jsonb);
