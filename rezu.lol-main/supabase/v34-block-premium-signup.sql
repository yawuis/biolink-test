-- ============================================================================
-- rezu.lol · v34 Block Premium Signup
-- ============================================================================

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

  -- Block premium usernames on initial email signup.
  -- Premium handles (1-2 characters, or listed 3-character usernames) must be purchased via the Marketplace first.
  if length(requested) <= 2 or (length(requested) = 3 and requested in (
    'dev', 'vip', 'ceo', 'lol', 'app', 'bot', 'btc', 'eth', 'sol', 'nft', 
    'pro', 'fun', 'wtf', 'wow', 'god', 'sad', 'bad', 'run', 'fly', 'win', 
    'out', 'new', 'old', 'use', 'get', 'set', 'key', 'api', 'web', 'dns', 
    'git', 'hub', 'sql', 'pay', 'usd', 'ltd', 'gem', 'one', 'yes', 'top',
    'uzi'
  )) then
    raise exception 'Premium handle. Register a standard name first, then purchase this name in the Marketplace.';
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
