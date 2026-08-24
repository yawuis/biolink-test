-- v20: Secure Discord linking
-- One Discord account can only be linked to one rezu.lol profile.
-- Manual Discord ID linking is disabled in the app; this DB layer enforces uniqueness.

-- Normalize empty/invalid Discord IDs before adding the unique index.
update public.profiles
set discord_id = null,
    discord_enabled = false
where discord_id is not null
  and (trim(discord_id) = '' or discord_id !~ '^[0-9]{15,25}$');

-- If old data has duplicates, keep the earliest profile and clear the duplicates.
with ranked as (
  select
    id,
    discord_id,
    row_number() over (
      partition by discord_id
      order by created_at asc nulls last, id asc
    ) as rn
  from public.profiles
  where discord_id is not null
    and discord_id <> ''
)
update public.profiles p
set discord_id = null,
    discord_enabled = false
from ranked r
where p.id = r.id
  and r.rn > 1;

-- Enforce valid Discord ID format going forward.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_discord_id_digits_chk'
  ) then
    alter table public.profiles
      add constraint profiles_discord_id_digits_chk
      check (discord_id is null or discord_id ~ '^[0-9]{15,25}$');
  end if;
end $$;

-- Enforce one Discord member per one profile, no exceptions.
create unique index if not exists profiles_unique_discord_id
on public.profiles (discord_id)
where discord_id is not null and discord_id <> '';

-- Helpful check after running:
-- select discord_id, count(*) from public.profiles where discord_id is not null group by discord_id having count(*) > 1;
