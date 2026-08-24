-- v25: Instagram-style profile likes + custom-badge role gate support.

alter table public.profiles
  add column if not exists like_count integer not null default 0;

create table if not exists public.profile_likes (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  liker_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, liker_id)
);

alter table public.profile_likes enable row level security;

drop policy if exists "profile_likes_select_own_or_public" on public.profile_likes;
drop policy if exists "profile_likes_insert_own" on public.profile_likes;
drop policy if exists "profile_likes_delete_own" on public.profile_likes;

-- Users can inspect only likes involving their own profile. Public pages use the security-definer functions below for counts.
create policy "profile_likes_select_own_or_public"
  on public.profile_likes
  for select
  using (auth.uid() = liker_id or auth.uid() = profile_id);

create policy "profile_likes_insert_own"
  on public.profile_likes
  for insert
  with check (auth.uid() = liker_id);

create policy "profile_likes_delete_own"
  on public.profile_likes
  for delete
  using (auth.uid() = liker_id);

-- Backfill count from the likes table.
update public.profiles p
set like_count = coalesce(x.likes, 0)
from (
  select profile_id, count(*)::int as likes
  from public.profile_likes
  group by profile_id
) x
where p.id = x.profile_id;

update public.profiles p
set like_count = 0
where not exists (
  select 1 from public.profile_likes l where l.profile_id = p.id
);

create or replace function public.get_profile_like_state(target_username text)
returns table(liked boolean, likes integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid;
  current_user_id uuid;
begin
  select id into target_id
  from public.profiles
  where username = lower(trim(target_username))
     or alias = lower(trim(target_username))
  limit 1;

  if target_id is null then
    return query select false, 0;
    return;
  end if;

  current_user_id := auth.uid();

  return query
  select
    case
      when current_user_id is null then false
      else exists (
        select 1
        from public.profile_likes l
        where l.profile_id = target_id
          and l.liker_id = current_user_id
      )
    end as liked,
    coalesce((select p.like_count from public.profiles p where p.id = target_id), 0)::int as likes;
end;
$$;

create or replace function public.toggle_profile_like(target_username text)
returns table(liked boolean, likes integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid;
  current_user_id uuid;
  affected int;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'not_authenticated';
  end if;

  -- Make sure the logged-in auth user has a profile. Self-likes are allowed.
  if not exists (select 1 from public.profiles p where p.id = current_user_id) then
    raise exception 'profile_not_claimed';
  end if;

  select id into target_id
  from public.profiles
  where username = lower(trim(target_username))
     or alias = lower(trim(target_username))
  limit 1;

  if target_id is null then
    raise exception 'profile_not_found';
  end if;

  if exists (select 1 from public.profile_likes where profile_id = target_id and liker_id = current_user_id) then
    delete from public.profile_likes
    where profile_id = target_id
      and liker_id = current_user_id;

    update public.profiles
    set like_count = greatest(coalesce(like_count, 0) - 1, 0)
    where id = target_id;

    return query select false, coalesce((select p.like_count from public.profiles p where p.id = target_id), 0)::int;
    return;
  end if;

  insert into public.profile_likes(profile_id, liker_id)
  values (target_id, current_user_id)
  on conflict do nothing;

  get diagnostics affected = row_count;

  if affected > 0 then
    update public.profiles
    set like_count = coalesce(like_count, 0) + 1
    where id = target_id;
  end if;

  return query select true, coalesce((select p.like_count from public.profiles p where p.id = target_id), 0)::int;
end;
$$;

grant execute on function public.get_profile_like_state(text) to anon, authenticated;
grant execute on function public.toggle_profile_like(text) to authenticated;
