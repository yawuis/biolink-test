-- ============================================================================
-- rezu.lol · v14 role badges + universal templates + link color
-- Safe to run multiple times after schema/v4/v6/v7/v9/v13.
-- ============================================================================

alter table public.profiles
  add column if not exists link_color text default '#ffffff';

update public.profiles
set link_color = coalesce(nullif(link_color, ''), '#ffffff')
where link_color is null or link_color = '';

alter table public.profile_templates
  add column if not exists cover_image_url text default '',
  add column if not exists is_public boolean default true,
  add column if not exists tags text[] default '{}';

update public.profile_templates
set is_public = true
where is_public is null;

alter table public.profile_templates enable row level security;

-- Replace old owner-only read policy with public-template browsing + owner read.
drop policy if exists "profile_templates_owner_read" on public.profile_templates;
drop policy if exists "profile_templates_public_read" on public.profile_templates;
create policy "profile_templates_public_read" on public.profile_templates
  for select to authenticated
  using (is_public = true or auth.uid() = user_id);

-- Keep user-owned insert/update/delete locked down.
drop policy if exists "profile_templates_owner_insert" on public.profile_templates;
create policy "profile_templates_owner_insert" on public.profile_templates
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "profile_templates_owner_update" on public.profile_templates;
create policy "profile_templates_owner_update" on public.profile_templates
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "profile_templates_owner_delete" on public.profile_templates;
create policy "profile_templates_owner_delete" on public.profile_templates
  for delete to authenticated
  using (auth.uid() = user_id);

-- Keep owner email registered for admin checks.
insert into public.app_owners (email)
values ('brallowjillow@gmail.com')
on conflict (email) do nothing;
