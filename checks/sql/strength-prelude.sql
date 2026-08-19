-- The parts of the SHARED Supabase project that this repository does NOT own.
--
-- Every object below is created by THE-HYBRID-ENGINE1 or by the Supabase
-- platform itself. They are stubbed here so the five strength migrations can
-- apply to a scratch cluster — NOT because this repo may create them. See
-- CLAUDE.md's shared-Supabase contract: a migration in this repository that
-- touches any of these is a contract violation.
--
-- Each stub names the real owner. If one of these signatures changes upstream,
-- this file is where the strength repo finds out — by going red.

-- ── Supabase platform ────────────────────────────────────────────────────────
-- auth.uid() is not a constant. RLS is only provable if two different users can
-- be simulated in one cluster, so this mirrors Supabase's own implementation:
-- read `sub` out of the request-scoped GUC PostgREST sets per connection.
--
--   select set_config('request.jwt.claims', '{"sub":"<uuid>"}', true);
--   set local role authenticated;
--
-- `set local role` matters as much as the claim — postgres is a superuser and
-- superusers bypass RLS entirely, so a check that forgets to drop role proves
-- nothing.

create schema if not exists auth;
create table if not exists auth.users (id uuid primary key);
insert into auth.users values
  ('11111111-1111-1111-1111-111111111111'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')
on conflict do nothing;

create or replace function auth.uid() returns uuid language sql stable as $f$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub',
    '11111111-1111-1111-1111-111111111111'
  )::uuid
$f$;

do $d$ begin
  if not exists (select 1 from pg_roles where rolname='anon') then create role anon; end if;
  if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated; end if;
  if not exists (select 1 from pg_roles where rolname='service_role') then create role service_role; end if;
end $d$;

grant usage on schema auth to anon, authenticated, service_role;
grant select on auth.users to authenticated;
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public
  grant select, insert, update, delete on tables to anon, authenticated, service_role;

-- ── Owned by THE-HYBRID-ENGINE1 ──────────────────────────────────────────────
-- public.coaches_athlete_anywhere(uuid) -> boolean
--   Real definition: 20260813_arc_roster_invites_and_names.sql. It joins
--   coach_athlete_assignments to organization_memberships twice and answers
--   "does the CURRENT user coach this athlete, in any org they share".
--
--   Stubbed here as a GUC read rather than hardcoded false, for the same reason
--   auth.uid() is a GUC read: a stub that always says no makes every
--   coach-visibility policy untestable, and one that always says yes makes them
--   un-provable. A test sets `strength.test_coached_athletes` to a comma list.
--
--   THIS SIGNATURE IS A CROSS-REPO CONTRACT. If the hybrid repo changes the
--   argument or return type, this repo's RLS breaks in production and the only
--   warning is this check going red. There is no automated guard — the shared
--   database will not tell you.
create or replace function public.coaches_athlete_anywhere(athlete uuid)
returns boolean language sql stable as $f$
  select coalesce(
    position(athlete::text in coalesce(current_setting('strength.test_coached_athletes', true), '')) > 0,
    false
  )
$f$;
