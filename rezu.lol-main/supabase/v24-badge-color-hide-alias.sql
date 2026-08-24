-- v24: badge color / hide alias polish
-- Adds a profile privacy toggle so users can keep their alias URL active while hiding the alias line publicly.

alter table public.profiles
  add column if not exists hide_alias boolean not null default false;

update public.profiles
set hide_alias = false
where hide_alias is null;
