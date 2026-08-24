-- v31: custom PNG cursors + refreshed Discord badge role mapping.
-- Badge role IDs are enforced by the app/Railway presence response, so no role IDs are stored in SQL.
-- The Founding 100 badge is now frozen to profiles with public_uid < 200.

alter table public.profiles
  add column if not exists custom_cursor_url text default '';

update public.profiles
set custom_cursor_url = ''
where custom_cursor_url is null;
