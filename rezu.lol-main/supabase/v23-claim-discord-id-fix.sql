-- v23: Fix claim/signup failing on profiles_discord_id_digits_chk
-- Cause: older upgrades set discord_id default to '' but v20 requires NULL or digits.
-- Fix: store unlinked Discord as NULL, then enforce one Discord ID per account.

alter table public.profiles
  alter column discord_id drop default;

update public.profiles
set discord_id = null,
    discord_enabled = false
where discord_id is not null
  and trim(discord_id) = '';

alter table public.profiles
  drop constraint if exists profiles_discord_id_digits_chk;

alter table public.profiles
  add constraint profiles_discord_id_digits_chk
  check (discord_id is null or discord_id ~ '^[0-9]{15,25}$');

-- Keep one Discord member linked to one profile.
drop index if exists profiles_unique_discord_id;
create unique index profiles_unique_discord_id
on public.profiles (discord_id)
where discord_id is not null;
