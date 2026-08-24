-- v9 official Discord invite polish
-- Run this after earlier migrations.
-- This locks the default invite value used by saved profiles. The app server also forces this value on saves.
alter table public.profiles
  alter column discord_invite_url set default 'https://discord.gg/rezu';

update public.profiles
set discord_invite_url = 'https://discord.gg/rezu'
where discord_invite_url is null
   or discord_invite_url = ''
   or discord_invite_url <> 'https://discord.gg/rezu';
