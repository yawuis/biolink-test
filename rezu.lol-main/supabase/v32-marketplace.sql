-- ============================================================================
-- rezu.lol · v32 Marketplace (Usernames & Badges)
-- ============================================================================

-- 1. Create purchased_usernames table
create table if not exists public.purchased_usernames (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  username citext unique not null,
  price_paid numeric not null default 0,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.purchased_usernames enable row level security;

-- SELECT: anyone can see purchased usernames (needed for checkups)
drop policy if exists "purchased_usernames_public_select" on public.purchased_usernames;
create policy "purchased_usernames_public_select" on public.purchased_usernames
  for select using (true);

-- INSERT: only the user can log their own purchase (or system can insert)
drop policy if exists "purchased_usernames_insert" on public.purchased_usernames;
create policy "purchased_usernames_insert" on public.purchased_usernames
  for insert with check (auth.uid() = user_id);

-- 2. Add owned_badges text array to profiles
alter table public.profiles
  add column if not exists owned_badges text[] default '{}';
