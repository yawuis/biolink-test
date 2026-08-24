-- ============================================================================
-- rezu.lol · v35 Discord Invite Default Update
-- ============================================================================

-- Update default column value for future signups
alter table public.profiles 
  alter column discord_invite_url set default 'https://discord.gg/YGz8v9pvyy';

-- Update all existing profiles that still point to the old invite link
update public.profiles
  set discord_invite_url = 'https://discord.gg/YGz8v9pvyy'
  where discord_invite_url = 'https://discord.gg/rezu'
     or discord_invite_url is null;
