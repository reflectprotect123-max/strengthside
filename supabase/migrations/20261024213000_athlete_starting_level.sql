-- Coach-set per-athlete starting level (dan | partner). Fourteenth strength-owned table.
create table if not exists public.athlete_starting_level (
  athlete_id uuid primary key references auth.users(id) on delete cascade,
  level text not null default 'dan' check (level in ('dan', 'partner')),
  updated_at timestamptz not null default now()
);

alter table public.athlete_starting_level enable row level security;
revoke all on public.athlete_starting_level from anon, authenticated;
grant select, insert, update on public.athlete_starting_level to authenticated;

drop policy if exists athlete_starting_level_self_read on public.athlete_starting_level;
create policy athlete_starting_level_self_read on public.athlete_starting_level
  for select to authenticated
  using (athlete_id = (select auth.uid()));

drop policy if exists athlete_starting_level_coach_read on public.athlete_starting_level;
create policy athlete_starting_level_coach_read on public.athlete_starting_level
  for select to authenticated
  using (public.coaches_athlete_anywhere(athlete_id));

drop policy if exists athlete_starting_level_coach_insert on public.athlete_starting_level;
create policy athlete_starting_level_coach_insert on public.athlete_starting_level
  for insert to authenticated
  with check (public.coaches_athlete_anywhere(athlete_id));

drop policy if exists athlete_starting_level_coach_update on public.athlete_starting_level;
create policy athlete_starting_level_coach_update on public.athlete_starting_level
  for update to authenticated
  using (public.coaches_athlete_anywhere(athlete_id))
  with check (public.coaches_athlete_anywhere(athlete_id));
