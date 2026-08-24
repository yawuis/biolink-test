-- ============================================================================
--  rezu.lol  ·  v3 upgrade  (scroll layout + modules + Discord presence)
--  Run in: Supabase Dashboard → SQL Editor → New query. Adds only — safe.
-- ============================================================================

alter table public.profiles
  add column if not exists layout      text  default 'classic',   -- classic | scroll
  add column if not exists discord_id  text  default '',          -- numeric Discord user id (for Lanyard)
  add column if not exists github_user text  default '',          -- github username for the stats card
  add column if not exists timezone    text  default '',          -- IANA tz e.g. America/Chicago
  add column if not exists skills      jsonb default '[]'::jsonb,  -- ["Python","Go",...]
  add column if not exists modules     jsonb default '["about","discord","github","clock"]'::jsonb;
