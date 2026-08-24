-- v29: make sure every profile has a stable sequential public UID.
-- The app uses public_uid <= 100 for the Founding 100 badge.

alter table public.profiles
  add column if not exists public_uid integer;

create sequence if not exists public.profiles_public_uid_seq;

with ordered as (
  select id, row_number() over (order by created_at asc nulls last, id asc) as rn
  from public.profiles
  where public_uid is null
)
update public.profiles p
set public_uid = ordered.rn + coalesce((select max(public_uid) from public.profiles where public_uid is not null), 0)
from ordered
where p.id = ordered.id;

select setval(
  'public.profiles_public_uid_seq',
  greatest(coalesce((select max(public_uid) from public.profiles), 0), 1),
  coalesce((select max(public_uid) from public.profiles), 0) > 0
);

alter table public.profiles
  alter column public_uid set default nextval('public.profiles_public_uid_seq');

create unique index if not exists profiles_public_uid_unique_idx
  on public.profiles(public_uid);
