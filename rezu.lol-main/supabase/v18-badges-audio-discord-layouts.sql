-- ============================================================================
-- rezu.lol · v18 invite + badges/audio/layout polish
-- Safe to run after previous SQL files.
-- ============================================================================

alter table public.profiles
  add column if not exists badges jsonb default '[]'::jsonb,
  add column if not exists link_color text default '#ffffff';

alter table public.profiles
  alter column discord_invite_url set default 'https://discord.gg/rezu';

update public.profiles
set discord_invite_url = 'https://discord.gg/rezu'
where discord_invite_url is null
   or discord_invite_url = ''
   or discord_invite_url like 'https://discord.gg/%';

update public.profiles
set monochrome_icons = true
where monochrome_icons is null;

-- Make sure the universal template columns exist.
alter table public.profile_templates
  add column if not exists cover_image_url text default '',
  add column if not exists is_public boolean default true,
  add column if not exists tags text[] default '{}';

update public.profile_templates
set is_public = true
where is_public is null;
