-- Combined strength migrations for hosted project orysjncrksmdfabpuftd
-- Apply once in Supabase SQL editor. Files in ledger order.
-- Generated from branch tip; do not edit by hand for production — source is supabase/migrations/


-- ============================================================================
-- BEGIN 20260818_strength_rebuild.sql
-- ============================================================================
-- ============================================================================
-- STRENGTH REBUILD — additive only. Nothing existing is altered. See
-- docs/superpowers/specs/2026-08-17-strength-rebuild-design.md for the full
-- design; this migration implements it slice by slice, in slice order.
-- ============================================================================

-- Slice 1: metric registry — metrics are rows, not an enum, so a prescribed
-- set can carry any combination of targets instead of a fixed 2-metric cap.
create table metric (
  key              text primary key,
  dimension        text not null,
  canonical_unit   text not null,
  value_type       text not null,
  aggregation      text not null,
  higher_is_better boolean,
  is_load_bearing  boolean not null default false
);

insert into metric (key, dimension, canonical_unit, value_type, aggregation, higher_is_better, is_load_bearing) values
  ('load',     'mass',   'kg',  'scalar',   'sum',  true,  true),
  ('reps',     'count',  'rep', 'scalar',   'sum',  true,  false),
  ('rpe',      'ratio',  'rpe', 'scalar',   'mean', null,  false),
  ('rir',      'ratio',  'rep', 'scalar',   'mean', false, false),
  ('tempo',    'time',   's',   'tuple',    'none', null,  false),
  ('rest',     'time',   's',   'duration', 'none', null,  false),
  ('distance', 'length', 'm',   'scalar',   'sum',  true,  false),
  ('duration', 'time',   's',   'duration', 'sum',  null,  false),
  ('calories', 'energy', 'kcal','scalar',   'sum',  true,  false),
  ('watts',    'power',  'W',   'scalar',   'mean', true,  false),
  ('height',   'length', 'm',   'scalar',   'max',  true,  false);

-- Slice 2: exercise rebuild, with equipment and the reference-max/track-as
-- graph. Cycle depth is enforced by a trigger, not app code.
create table equipment (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  increment_kg   numeric,
  rack_values_kg numeric[],
  rounding       text not null default 'down'
);

create table exercise (
  id                        uuid primary key default gen_random_uuid(),
  owner_id                  uuid,
  name                      text not null,
  video_asset_id            uuid,
  cues                      text,
  equipment_id              uuid references equipment(id),
  default_metrics           text[] not null default '{reps,load}',
  reference_max_exercise_id uuid references exercise(id),
  track_as_exercise_id      uuid references exercise(id),
  e1rm_formula              text not null default 'epley',
  check (id <> reference_max_exercise_id),
  check (id <> track_as_exercise_id)
);

create function check_exercise_edge_depth() returns trigger as $$
begin
  if new.reference_max_exercise_id is not null and exists (
    select 1 from exercise e where e.id = new.reference_max_exercise_id
      and e.reference_max_exercise_id is not null
  ) then raise exception 'reference_max_exercise_id must point at a root (depth <= 1)'; end if;
  if new.track_as_exercise_id is not null and exists (
    select 1 from exercise e where e.id = new.track_as_exercise_id
      and e.track_as_exercise_id is not null
  ) then raise exception 'track_as_exercise_id must point at a root (depth <= 1)'; end if;
  return new;
end; $$ language plpgsql;

create trigger exercise_edge_depth before insert or update on exercise
  for each row execute function check_exercise_edge_depth();

-- Slice 3: a prescribed set is a set of typed targets, not fixed columns —
-- the fix for a fixed 2-metric-per-set ceiling.
create table strength_block_item (
  id           uuid primary key default gen_random_uuid(),
  block_id     uuid not null,
  exercise_id  uuid not null references exercise(id),
  ordinal      int  not null,
  grouping_key text,
  unique (block_id, ordinal)
);

create table prescribed_set (
  id                uuid primary key default gen_random_uuid(),
  block_item_id     uuid not null references strength_block_item(id) on delete cascade,
  ordinal           int  not null,
  is_optional       boolean not null default false,
  is_amrap          boolean not null default false,
  unique (block_item_id, ordinal)
);

create table prescribed_target (
  prescribed_set_id uuid not null references prescribed_set(id) on delete cascade,
  metric_key        text not null references metric(key),
  literal_value      numeric,
  range_lo           numeric,
  range_hi           numeric,
  expr_kind          text,
  expr_arg           numeric,
  expr_ref_exercise  uuid references exercise(id),
  primary key (prescribed_set_id, metric_key),
  check (
    (literal_value is not null)::int +
    (range_lo is not null and range_hi is not null)::int +
    (expr_kind is not null)::int = 1
  )
);

-- Slice 6: publish-time snapshot. After publish, nothing reads
-- prescribed_target for this session again — only resolved_snapshot. A
-- later template edit must never rewrite what an athlete was already told.
create table assigned_session (
  id                uuid primary key default gen_random_uuid(),
  athlete_id        uuid not null,
  source_session_id uuid,
  scheduled_date    date not null,
  state             text not null default 'draft',
  published_at      timestamptz,
  resolved_snapshot jsonb,
  timezone          text not null
);

-- Slice 7: performance is an independently-shaped set of measurements.
-- Client-generated id (offline-first): a retried sync is a no-op upsert.
create table performed_set (
  id                  uuid primary key,
  assigned_session_id uuid not null references assigned_session(id),
  exercise_id         uuid not null references exercise(id),
  prescribed_set_id   uuid references prescribed_set(id),
  ordinal             int not null,
  status              text not null,
  performed_at        timestamptz not null,
  client_created_at   timestamptz not null
);

create table performed_measurement (
  performed_set_id uuid not null references performed_set(id) on delete cascade,
  metric_key       text not null references metric(key),
  value            numeric not null,
  primary key (performed_set_id, metric_key)
);

-- Slice 9: working max is event-sourced, never a mutable column.
create table working_max_event (
  id           uuid primary key default gen_random_uuid(),
  athlete_id   uuid not null,
  exercise_id  uuid not null,
  value_kg     numeric not null,
  source       text not null,
  formula      text,
  from_set_id  uuid references performed_set(id),
  effective_at timestamptz not null
);

-- Slice 10: PRs are per rep-count, not collapsed.
create table pr_event (
  athlete_id       uuid not null,
  exercise_id      uuid not null,
  rep_count        int  not null,
  value_kg         numeric not null,
  achieved_at      timestamptz not null,
  performed_set_id uuid not null references performed_set(id),
  primary key (athlete_id, exercise_id, rep_count, achieved_at)
);

-- END 20260818_strength_rebuild.sql

-- ============================================================================
-- BEGIN 20260819_phase_e_pain_metric.sql
-- ============================================================================
-- ============================================================================
-- PHASE E — additive only. Adds the `pain` metric row that Phase E's exposure
-- classification (pain_blocked) depends on. This was originally added by
-- editing 20260818_strength_rebuild.sql in place; moved here because that
-- migration may already be applied elsewhere, in which case an in-place edit
-- silently never lands and any pain-flag write fails its foreign key.
-- ============================================================================

-- `on conflict do nothing`: in the environment this header describes — the
-- one where 20260818 was applied WITH the in-place edit — the `pain` row
-- already exists, and a bare insert would hit the primary key (`key`) and
-- fail the whole migration. Idempotent either way.
insert into metric (key, dimension, canonical_unit, value_type, aggregation, higher_is_better, is_load_bearing) values
  ('pain', 'ratio', 'flag', 'scalar', 'none', null, false)
on conflict (key) do nothing;

-- END 20260819_phase_e_pain_metric.sql

-- ============================================================================
-- BEGIN 20260819_phase_f_knowledge_base.sql
-- ============================================================================
-- ============================================================================
-- PHASE F — coaching-notes knowledge base. Additive only. Does not touch
-- 20260818_strength_rebuild.sql, 20260819_phase_e_pain_metric.sql, or
-- anything else. See docs/superpowers/specs/2026-08-17-adaptive-engine-v2-
-- design.md, Phase F (Slices 34, 36-39 — Slice 35's authoring UI is a
-- separate, later, UI-track build).
-- ============================================================================

create extension if not exists vector;

create table coaching_note (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null,
  body        text not null,
  tags        text[] not null default '{}',
  embedding   vector(1024),
  created_at  timestamptz not null default now()
);

create index coaching_note_embedding_idx on coaching_note
  using hnsw (embedding vector_cosine_ops);

-- Slice 37: cosine-distance retrieval. top-5 default is chosen to fit
-- comfortably inside a decision call's context without needing tuning
-- infrastructure; revisit only if real usage data shows retrieval quality,
-- not count, is the bottleneck.
create function search_coaching_notes(query_embedding vector(1024), match_count int default 5)
returns setof coaching_note language sql stable as $$
  select * from coaching_note
  where embedding is not null
  order by embedding <=> query_embedding
  limit match_count;
$$;

-- END 20260819_phase_f_knowledge_base.sql

-- ============================================================================
-- BEGIN 20260820_strength_hardening.sql
-- ============================================================================
-- ============================================================================
-- STRENGTH HARDENING — fixes confirmed defects in 20260818_strength_rebuild
-- (and one function from 20260819_phase_f) WITHOUT editing either file in
-- place, because 20260818 may already be applied somewhere and an in-place
-- edit silently never lands there (the exact failure 20260819_phase_e's own
-- header records).
--
-- Constraint style: every CHECK and FK below is added PLAIN, not as
-- `not valid` + `validate`. These tables are empty pre-production — nothing
-- here has ever run against real rows — so there is no long-lived lock or
-- existing-row risk to stage around. If this ever has to be re-run against a
-- populated database, switch to `add constraint ... not valid` followed by
-- `validate constraint`.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Exercise edge depth, done properly.
--
-- The 20260818 trigger only validated the NEW row's outgoing edge, so
-- updating a PARENT could create depth>1 chains: with A→B in place, updating
-- B to point at C passed (B's own edge target C is a root) while leaving
-- A→B→C. Both edge columns (`reference_max_exercise_id`, `track_as_exercise_id`)
-- had the identical hole.
--
-- Replaced with a CONSTRAINT trigger that
--   (a) locks the far end of each changed edge (`for update`), so two
--       concurrent transactions cannot each commit half of a 2-cycle — the
--       second blocks on the row lock, then re-reads committed state and fails;
--   (b) walks the FULL chain from the changed row with a recursive CTE, so
--       any chain deeper than one hop — or any cycle reachable from the row —
--       is refused no matter which end was edited;
--   (c) re-checks rows that REFERENCE the changed row: a row that now has an
--       outgoing edge may not itself be pointed at.
-- ----------------------------------------------------------------------------

drop trigger if exists exercise_edge_depth on public.exercise;

create or replace function public.check_exercise_edge_depth() returns trigger
language plpgsql
set search_path = ''
as $fn$
begin
  -- Lock the targets of the changed edges. This serialises the concurrent
  -- "A→B while B→A" race: whichever transaction commits second re-reads the
  -- winner's committed edge and fails one of the checks below.
  perform 1 from public.exercise e
    where e.id = any (array_remove(
      array[new.reference_max_exercise_id, new.track_as_exercise_id], null))
    for update;

  -- reference_max: full-chain walk from the changed row. depth > 1 covers
  -- both a too-deep chain and any cycle (a cycle revisits a seen id, which
  -- always happens at depth >= 2 given the table's own id <> self checks).
  if exists (
    with recursive chain as (
      select e.id, e.reference_max_exercise_id, 0 as depth, array[e.id] as seen
        from public.exercise e where e.id = new.id
      union all
      select e.id, e.reference_max_exercise_id, c.depth + 1, c.seen || e.id
        from chain c
        join public.exercise e on e.id = c.reference_max_exercise_id
       where c.depth < 8 -- hard stop; anything past depth 1 already fails
    )
    select 1 from chain where depth > 1
  ) then
    raise exception 'reference_max_exercise_id must point at a root (depth <= 1)';
  end if;

  -- reference_max: the reverse direction — if this row now has an outgoing
  -- edge, nothing may point at it.
  if new.reference_max_exercise_id is not null and exists (
    select 1 from public.exercise e
     where e.reference_max_exercise_id = new.id and e.id <> new.id
  ) then
    raise exception 'exercise is referenced as a reference max and may not itself reference one (depth <= 1)';
  end if;

  -- track_as: same pattern, same holes, same fix.
  if exists (
    with recursive chain as (
      select e.id, e.track_as_exercise_id, 0 as depth, array[e.id] as seen
        from public.exercise e where e.id = new.id
      union all
      select e.id, e.track_as_exercise_id, c.depth + 1, c.seen || e.id
        from chain c
        join public.exercise e on e.id = c.track_as_exercise_id
       where c.depth < 8
    )
    select 1 from chain where depth > 1
  ) then
    raise exception 'track_as_exercise_id must point at a root (depth <= 1)';
  end if;

  if new.track_as_exercise_id is not null and exists (
    select 1 from public.exercise e
     where e.track_as_exercise_id = new.id and e.id <> new.id
  ) then
    raise exception 'exercise is tracked-as by others and may not itself track as another (depth <= 1)';
  end if;

  return new;
end;
$fn$;

revoke all on function public.check_exercise_edge_depth() from public;

-- Constraint triggers are AFTER by definition, which is what the re-check
-- semantics need: the row is in place when the walk runs.
create constraint trigger exercise_edge_depth
  after insert or update of reference_max_exercise_id, track_as_exercise_id
  on public.exercise
  for each row execute function public.check_exercise_edge_depth();

-- ----------------------------------------------------------------------------
-- 2. Freeze resolved_snapshot after publish.
--
-- 20260818's own comment promises "after publish, nothing reads
-- prescribed_target for this session again — only resolved_snapshot. A later
-- template edit must never rewrite what an athlete was already told" — and
-- nothing enforced it. Once a session has left 'draft', its snapshot and its
-- published_at are immutable; state transitions themselves
-- (published → in_progress → completed | skipped) remain allowed.
-- ----------------------------------------------------------------------------

create or replace function public.enforce_assigned_session_freeze() returns trigger
language plpgsql
set search_path = ''
as $fn$
begin
  if old.state <> 'draft' then
    if new.resolved_snapshot is distinct from old.resolved_snapshot then
      raise exception 'resolved_snapshot is frozen once the session is published';
    end if;
    if new.published_at is distinct from old.published_at then
      raise exception 'published_at is frozen once the session is published';
    end if;
    if new.state = 'draft' then
      raise exception 'a published session cannot return to draft';
    end if;
  end if;
  return new;
end;
$fn$;

revoke all on function public.enforce_assigned_session_freeze() from public;

create trigger assigned_session_freeze
  before update on public.assigned_session
  for each row execute function public.enforce_assigned_session_freeze();

-- ----------------------------------------------------------------------------
-- 3. Missing foreign keys.
--
-- exercise_id on the two append-only ledgers is RESTRICT, not CASCADE: a
-- ledger must not lose history because an exercise row went away.
-- athlete_id follows 20260804's convention for user FKs:
-- `references auth.users(id) on delete cascade` (account erasure takes the
-- user's rows with it).
-- ----------------------------------------------------------------------------

alter table public.working_max_event
  add constraint working_max_event_exercise_fk
  foreign key (exercise_id) references public.exercise(id) on delete restrict;

alter table public.pr_event
  add constraint pr_event_exercise_fk
  foreign key (exercise_id) references public.exercise(id) on delete restrict;

alter table public.working_max_event
  add constraint working_max_event_athlete_fk
  foreign key (athlete_id) references auth.users(id) on delete cascade;

alter table public.pr_event
  add constraint pr_event_athlete_fk
  foreign key (athlete_id) references auth.users(id) on delete cascade;

alter table public.assigned_session
  add constraint assigned_session_athlete_fk
  foreign key (athlete_id) references auth.users(id) on delete cascade;

-- Deliberately NOT foreign keys, recorded so nobody "fixes" them:
comment on column public.strength_block_item.block_id is
  'No FK on purpose: blocks live client-side in @hybrid/engine''s Block<S> '
  'union — there is no server-side block table to reference.';
comment on column public.assigned_session.source_session_id is
  'No FK on purpose: provenance to the authored template/day, which has no '
  'server-side table in this schema.';

-- ----------------------------------------------------------------------------
-- 4. prescribed_target shape checks.
--
-- The 20260818 exactly-one-strategy check counted "(range_lo is not null and
-- range_hi is not null)" as one unit, so a dangling range_lo alongside a
-- literal_value still summed to 1 and passed. Companion columns are pinned
-- to their strategy here. Unions per packages/strength-engine/src
-- (prescription.ts, resolve.ts): expr_arg is REQUIRED for pct_of_max,
-- lwp_delta and pct_of_bodyweight and forbidden otherwise; expr_ref_exercise
-- only means anything to pct_of_max. lwp_delta's arg is a DELTA and may be
-- negative; the other numeric columns may not.
-- ----------------------------------------------------------------------------

alter table public.prescribed_target
  add constraint prescribed_target_range_pair
  check ((range_lo is null) = (range_hi is null));

alter table public.prescribed_target
  add constraint prescribed_target_range_order
  check (range_lo is null or range_lo <= range_hi);

alter table public.prescribed_target
  add constraint prescribed_target_expr_kind
  check (expr_kind is null
         or expr_kind in ('pct_of_max', 'lwp_delta', 'pct_of_bodyweight', 'rpe_autoreg'));

alter table public.prescribed_target
  add constraint prescribed_target_expr_arg
  check (case when expr_kind in ('pct_of_max', 'lwp_delta', 'pct_of_bodyweight')
              then expr_arg is not null
              else expr_arg is null end);

alter table public.prescribed_target
  add constraint prescribed_target_expr_ref
  check (expr_ref_exercise is null or expr_kind = 'pct_of_max');

alter table public.prescribed_target
  add constraint prescribed_target_nonnegative
  check ((literal_value is null or literal_value >= 0)
     and (range_lo is null or range_lo >= 0)
     and (range_hi is null or range_hi >= 0)
     and (expr_arg is null or expr_kind = 'lwp_delta' or expr_arg >= 0));

-- ----------------------------------------------------------------------------
-- 5. Enum-shaped text pinned to the engine's unions, and positivity.
--
-- Values are copied from packages/strength-engine/src — workingMax.ts,
-- performed.ts, exercise.ts, e1rm.ts, metric.ts — and from the design doc's
-- assigned_session state machine (draft|published|in_progress|completed|
-- skipped). increment_kg = 0 is refused because the engine divides by it
-- (rounding.ts) and a zero produces NaN loads — audit-confirmed.
-- ----------------------------------------------------------------------------

alter table public.working_max_event
  add constraint working_max_event_source_ck
  check (source in ('auto_estimate', 'coach_set', 'athlete_set', 'test_result'));

alter table public.working_max_event
  add constraint working_max_event_formula_ck
  check (formula is null or formula in ('epley', 'brzycki'));

alter table public.working_max_event
  add constraint working_max_event_value_ck
  check (value_kg > 0);

alter table public.performed_set
  add constraint performed_set_status_ck
  check (status in ('completed', 'skipped', 'not_reached'));

alter table public.assigned_session
  add constraint assigned_session_state_ck
  check (state in ('draft', 'published', 'in_progress', 'completed', 'skipped'));

alter table public.equipment
  add constraint equipment_rounding_ck
  check (rounding in ('down', 'nearest', 'none'));

alter table public.equipment
  add constraint equipment_increment_ck
  check (increment_kg is null or increment_kg > 0);

alter table public.exercise
  add constraint exercise_e1rm_formula_ck
  check (e1rm_formula in ('epley', 'brzycki'));

alter table public.metric
  add constraint metric_value_type_ck
  check (value_type in ('scalar', 'range', 'tuple', 'duration'));

alter table public.metric
  add constraint metric_aggregation_ck
  check (aggregation in ('sum', 'mean', 'max', 'min', 'last', 'none'));

alter table public.pr_event
  add constraint pr_event_value_ck
  check (value_kg > 0);

alter table public.pr_event
  add constraint pr_event_rep_count_ck
  check (rep_count >= 0);

-- ----------------------------------------------------------------------------
-- 6. search_coaching_notes hardening (from 20260819_phase_f).
--
-- Guarded: locally, phase_f dies at `create extension vector` (no pgvector),
-- so coaching_note and the original function never exist and this block must
-- be a no-op rather than a second failure. `to_regclass` is the guard.
--
-- search_path is `public, extensions`, NOT '' — 20260815_arc_pgcrypto_
-- search_path records exactly why: the vector type and its <=> operator live
-- in `public` on a bare local Postgres and in `extensions` on Supabase, so a
-- fully-qualified spelling breaks one of the two. The pin still excludes
-- anything a caller might put in front. Revoke/grant follows 20260804's
-- pattern (revoke from public, grant execute to authenticated).
-- ----------------------------------------------------------------------------

do $do$
begin
  if to_regclass('public.coaching_note') is not null then
    -- Transaction-local search_path so the unqualified `vector` in the
    -- signatures below resolves wherever the extension actually lives.
    -- (set_config tolerates the missing `extensions` schema locally.)
    perform set_config('search_path', 'public, extensions', true);

    execute $sql$
      alter table public.coaching_note
        add constraint coaching_note_owner_fk
        foreign key (owner_id) references auth.users(id) on delete cascade;

      create or replace function public.search_coaching_notes(query_embedding vector(1024), match_count int default 5)
      returns setof public.coaching_note
      language sql stable
      set search_path = public, extensions
      as $body$
        select * from public.coaching_note
        where embedding is not null
        order by embedding <=> query_embedding
        limit match_count;
      $body$;

      revoke all on function public.search_coaching_notes(vector, int) from public;
      grant execute on function public.search_coaching_notes(vector, int) to authenticated;
    $sql$;
  end if;
end
$do$;

-- END 20260820_strength_hardening.sql

-- ============================================================================
-- BEGIN 20260821_strength_rls.sql
-- ============================================================================
-- ============================================================================
-- STRENGTH RLS — row level security for every table 20260818_strength_rebuild
-- created, plus coaching_note from 20260819_phase_f. Additive only; sorts
-- after 20260820_strength_hardening and edits neither file in place, for the
-- same reason that one didn't: 20260818 may already be applied somewhere.
--
-- Until this migration, every strength table was created with the
-- project-default ACL (ALL to anon and authenticated) and NO row level
-- security — any signed-in user could read and rewrite any athlete's
-- working-max history, PRs and logged sets, and `anon` could too. This file
-- closes that, following the conventions already in the tree:
--
--   * 20260807_macrotrack_food_catalogue: explicit grants instead of the
--     Supabase default ACL ("anon gets nothing at all"), shared catalogue =
--     select-only with no write policy (seeding is a service-role job;
--     service_role bypasses RLS), owner tables keyed on the user, child
--     tables owned through their parent row.
--   * 20260808_arc_coach_workspace / 20260813_arc_roster_invites_and_names:
--     a coach's read access is the three-row test `coaches_athlete_anywhere`
--     already encodes — active assignment, active privileged coach
--     membership, active athlete membership. The strength tables carry no
--     organization_id (assigned_session is keyed on the athlete alone), so
--     the org-less variant is the one that fits, exactly as it fits
--     athlete_profiles.
--   * auth.uid() is wrapped in (select auth.uid()) so the planner evaluates
--     it once per statement (initplan), not once per row, and every column a
--     policy filters on is indexed below.
--
-- Write model, stated plainly so nobody widens it by accident:
--
--   * The ATHLETE writes their own performance: assigned_session,
--     performed_set, performed_measurement (all upsert-shaped — 20260818's
--     own comment says a retried offline sync is a no-op upsert, so UPDATE
--     is part of the contract), and appends to the two ledgers.
--   * working_max_event and pr_event are LEDGERS: insert and select only.
--     There are deliberately NO update or delete policies, and update/delete
--     are not even granted — history is append-only at both layers.
--     `source = 'coach_set'` rows are minted by the server-side command
--     layer (service role), not by a client policy here.
--   * A COACH reads. No coach write policy exists on any of these tables;
--     coach-driven writes arrive through SECURITY DEFINER commands the way
--     every ARC write does, when those commands are built.
--   * The shared reference tables (metric, equipment, and the authored
--     template content strength_block_item / prescribed_set /
--     prescribed_target, which carry no owner column — block_id points at
--     client-side blocks on purpose, see 20260820's column comment) are
--     readable by every signed-in user and writable by nobody but the
--     service role.
-- ============================================================================

alter table public.metric enable row level security;
alter table public.equipment enable row level security;
alter table public.exercise enable row level security;
alter table public.strength_block_item enable row level security;
alter table public.prescribed_set enable row level security;
alter table public.prescribed_target enable row level security;
alter table public.assigned_session enable row level security;
alter table public.performed_set enable row level security;
alter table public.performed_measurement enable row level security;
alter table public.pr_event enable row level security;
alter table public.working_max_event enable row level security;

-- ---------------------------------------------------------------------------
-- Table privileges. Same shape as 20260807: the default ACL granted ALL to
-- both roles, so it is revoked outright and only what the policies below
-- could ever allow is granted back. `anon` gets nothing at all; the ledgers
-- lose update/delete at the GRANT layer as well as the policy layer, so
-- append-only does not depend on a single mechanism. service_role is
-- untouched and keeps its bypass — that is the seeding/command path.
-- ---------------------------------------------------------------------------

revoke all on public.metric from anon, authenticated;
revoke all on public.equipment from anon, authenticated;
revoke all on public.exercise from anon, authenticated;
revoke all on public.strength_block_item from anon, authenticated;
revoke all on public.prescribed_set from anon, authenticated;
revoke all on public.prescribed_target from anon, authenticated;
revoke all on public.assigned_session from anon, authenticated;
revoke all on public.performed_set from anon, authenticated;
revoke all on public.performed_measurement from anon, authenticated;
revoke all on public.pr_event from anon, authenticated;
revoke all on public.working_max_event from anon, authenticated;

grant select on
    public.metric,
    public.equipment,
    public.strength_block_item,
    public.prescribed_set,
    public.prescribed_target
to authenticated;
grant select, insert, update, delete on public.exercise to authenticated;
grant select, insert, update on
    public.assigned_session,
    public.performed_set,
    public.performed_measurement
to authenticated;
grant select, insert on public.pr_event, public.working_max_event to authenticated;

-- ---------------------------------------------------------------------------
-- Shared reference data: read for every signed-in user, write for nobody.
-- There is deliberately no insert/update/delete policy — exactly the foods /
-- food_servings pattern.
-- ---------------------------------------------------------------------------

drop policy if exists metric_read_authenticated on public.metric;
create policy metric_read_authenticated on public.metric
    for select to authenticated using (true);

drop policy if exists equipment_read_authenticated on public.equipment;
create policy equipment_read_authenticated on public.equipment
    for select to authenticated using (true);

drop policy if exists block_item_read_authenticated on public.strength_block_item;
create policy block_item_read_authenticated on public.strength_block_item
    for select to authenticated using (true);

drop policy if exists prescribed_set_read_authenticated on public.prescribed_set;
create policy prescribed_set_read_authenticated on public.prescribed_set
    for select to authenticated using (true);

drop policy if exists prescribed_target_read_authenticated on public.prescribed_target;
create policy prescribed_target_read_authenticated on public.prescribed_target
    for select to authenticated using (true);

-- ---------------------------------------------------------------------------
-- exercise: owner_id is nullable on purpose — a null owner is the global
-- library, a non-null owner is somebody's custom exercise. Read: the library
-- plus your own. Write: your own only, and with check pins owner_id to the
-- caller so nobody publishes into the global library (owner_id null fails
-- the with check) or into somebody else's account through the client role.
-- ---------------------------------------------------------------------------

drop policy if exists exercise_read on public.exercise;
create policy exercise_read on public.exercise
    for select to authenticated
    using (owner_id is null or owner_id = (select auth.uid()));

drop policy if exists exercise_owner_insert on public.exercise;
create policy exercise_owner_insert on public.exercise
    for insert to authenticated
    with check (owner_id = (select auth.uid()));

drop policy if exists exercise_owner_update on public.exercise;
create policy exercise_owner_update on public.exercise
    for update to authenticated
    using (owner_id = (select auth.uid()))
    with check (owner_id = (select auth.uid()));

drop policy if exists exercise_owner_delete on public.exercise;
create policy exercise_owner_delete on public.exercise
    for delete to authenticated
    using (owner_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- assigned_session: keyed directly on the athlete. The athlete reads and
-- writes their own; a current coach reads (coaches_athlete_anywhere — the
-- table has no organization_id, so the org-less three-row test is the right
-- one). Update's with check repeats the ownership test so a row cannot be
-- reassigned to another athlete; what may change WITHIN a published row is
-- 20260820's freeze trigger's job, not RLS's.
-- ---------------------------------------------------------------------------

drop policy if exists assigned_session_athlete_select on public.assigned_session;
create policy assigned_session_athlete_select on public.assigned_session
    for select to authenticated
    using (athlete_id = (select auth.uid()));

drop policy if exists assigned_session_coach_select on public.assigned_session;
create policy assigned_session_coach_select on public.assigned_session
    for select to authenticated
    using (public.coaches_athlete_anywhere(athlete_id));

drop policy if exists assigned_session_athlete_insert on public.assigned_session;
create policy assigned_session_athlete_insert on public.assigned_session
    for insert to authenticated
    with check (athlete_id = (select auth.uid()));

drop policy if exists assigned_session_athlete_update on public.assigned_session;
create policy assigned_session_athlete_update on public.assigned_session
    for update to authenticated
    using (athlete_id = (select auth.uid()))
    with check (athlete_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- performed_set: owned through its assigned_session (the parent-row pattern
-- macro_program_days uses). The subquery runs as the caller, so the parent's
-- own RLS applies inside it — a coach passes because the coach SELECT policy
-- above lets them see the session; an athlete passes only for their own.
-- The write policies do NOT lean on that indirection: they name the athlete
-- test explicitly, so a coach's read access never quietly becomes write
-- access if a broader session policy is ever added.
-- ---------------------------------------------------------------------------

drop policy if exists performed_set_select on public.performed_set;
create policy performed_set_select on public.performed_set
    for select to authenticated
    using (exists (
        select 1 from public.assigned_session s
        where s.id = performed_set.assigned_session_id
    ));

drop policy if exists performed_set_athlete_insert on public.performed_set;
create policy performed_set_athlete_insert on public.performed_set
    for insert to authenticated
    with check (exists (
        select 1 from public.assigned_session s
        where s.id = performed_set.assigned_session_id
          and s.athlete_id = (select auth.uid())
    ));

drop policy if exists performed_set_athlete_update on public.performed_set;
create policy performed_set_athlete_update on public.performed_set
    for update to authenticated
    using (exists (
        select 1 from public.assigned_session s
        where s.id = performed_set.assigned_session_id
          and s.athlete_id = (select auth.uid())
    ))
    with check (exists (
        select 1 from public.assigned_session s
        where s.id = performed_set.assigned_session_id
          and s.athlete_id = (select auth.uid())
    ));

-- ---------------------------------------------------------------------------
-- performed_measurement: owned two hops up, through its set's session.
-- ---------------------------------------------------------------------------

drop policy if exists performed_measurement_select on public.performed_measurement;
create policy performed_measurement_select on public.performed_measurement
    for select to authenticated
    using (exists (
        select 1 from public.performed_set ps
        where ps.id = performed_measurement.performed_set_id
    ));

drop policy if exists performed_measurement_athlete_insert on public.performed_measurement;
create policy performed_measurement_athlete_insert on public.performed_measurement
    for insert to authenticated
    with check (exists (
        select 1
        from public.performed_set ps
        join public.assigned_session s on s.id = ps.assigned_session_id
        where ps.id = performed_measurement.performed_set_id
          and s.athlete_id = (select auth.uid())
    ));

drop policy if exists performed_measurement_athlete_update on public.performed_measurement;
create policy performed_measurement_athlete_update on public.performed_measurement
    for update to authenticated
    using (exists (
        select 1
        from public.performed_set ps
        join public.assigned_session s on s.id = ps.assigned_session_id
        where ps.id = performed_measurement.performed_set_id
          and s.athlete_id = (select auth.uid())
    ))
    with check (exists (
        select 1
        from public.performed_set ps
        join public.assigned_session s on s.id = ps.assigned_session_id
        where ps.id = performed_measurement.performed_set_id
          and s.athlete_id = (select auth.uid())
    ));

-- ---------------------------------------------------------------------------
-- The two ledgers. Insert and select only — no update, no delete, at either
-- the grant or the policy layer. The insert policies also close the
-- owner-reference hole 20260807's food-log policies closed: a foreign key
-- check does not consult RLS, so without the extra exists an athlete could
-- mint a working-max or PR event pointing at ANOTHER athlete's performed
-- set. The referenced set must belong to the caller's own session.
-- ---------------------------------------------------------------------------

drop policy if exists working_max_event_athlete_select on public.working_max_event;
create policy working_max_event_athlete_select on public.working_max_event
    for select to authenticated
    using (athlete_id = (select auth.uid()));

drop policy if exists working_max_event_coach_select on public.working_max_event;
create policy working_max_event_coach_select on public.working_max_event
    for select to authenticated
    using (public.coaches_athlete_anywhere(athlete_id));

drop policy if exists working_max_event_athlete_insert on public.working_max_event;
create policy working_max_event_athlete_insert on public.working_max_event
    for insert to authenticated
    with check (
        athlete_id = (select auth.uid())
        and (from_set_id is null or exists (
            select 1
            from public.performed_set ps
            join public.assigned_session s on s.id = ps.assigned_session_id
            where ps.id = working_max_event.from_set_id
              and s.athlete_id = (select auth.uid())
        ))
    );

drop policy if exists pr_event_athlete_select on public.pr_event;
create policy pr_event_athlete_select on public.pr_event
    for select to authenticated
    using (athlete_id = (select auth.uid()));

drop policy if exists pr_event_coach_select on public.pr_event;
create policy pr_event_coach_select on public.pr_event
    for select to authenticated
    using (public.coaches_athlete_anywhere(athlete_id));

drop policy if exists pr_event_athlete_insert on public.pr_event;
create policy pr_event_athlete_insert on public.pr_event
    for insert to authenticated
    with check (
        athlete_id = (select auth.uid())
        and exists (
            select 1
            from public.performed_set ps
            join public.assigned_session s on s.id = ps.assigned_session_id
            where ps.id = pr_event.performed_set_id
              and s.athlete_id = (select auth.uid())
        )
    );

-- ---------------------------------------------------------------------------
-- Indexes on the columns the policies filter on, where nothing indexes them
-- yet. Not needed: pr_event.athlete_id (leading column of its primary key),
-- performed_measurement.performed_set_id (leading column of its primary
-- key), prescribed_set.block_item_id and strength_block_item's block_id
-- (leading columns of their unique constraints).
-- ---------------------------------------------------------------------------

create index if not exists exercise_owner_idx
    on public.exercise (owner_id) where owner_id is not null;
create index if not exists assigned_session_athlete_idx
    on public.assigned_session (athlete_id, scheduled_date);
create index if not exists performed_set_session_idx
    on public.performed_set (assigned_session_id);
create index if not exists working_max_event_athlete_idx
    on public.working_max_event (athlete_id, exercise_id, effective_at);

-- ---------------------------------------------------------------------------
-- coaching_note — owner-scoped everything, and the search function gets the
-- owner filter its RLS-bypassing absence implied. Guarded exactly the way
-- 20260820's section 6 is: on a machine without pgvector, phase_f never
-- applied, the table does not exist, and this block must be a no-op rather
-- than a second failure. Same transaction-local search_path dance, same
-- reason (the vector type lives in `public` locally and `extensions` on
-- Supabase).
--
-- The function is SECURITY INVOKER, so once RLS is on, the policy alone
-- already scopes it — the explicit `owner_id = (select auth.uid())` is kept
-- anyway so the function states its own boundary and survives someone later
-- marking it definer or widening a policy.
-- ---------------------------------------------------------------------------

do $do$
begin
  if to_regclass('public.coaching_note') is not null then
    perform set_config('search_path', 'public, extensions', true);

    execute $sql$
      alter table public.coaching_note enable row level security;

      revoke all on public.coaching_note from anon, authenticated;
      grant select, insert, update, delete on public.coaching_note to authenticated;

      drop policy if exists coaching_note_owner_all on public.coaching_note;
      create policy coaching_note_owner_all on public.coaching_note for all to authenticated
          using (owner_id = (select auth.uid()))
          with check (owner_id = (select auth.uid()));

      create index if not exists coaching_note_owner_idx
          on public.coaching_note (owner_id);

      create or replace function public.search_coaching_notes(query_embedding vector(1024), match_count int default 5)
      returns setof public.coaching_note
      language sql stable
      set search_path = public, extensions
      as $body$
        select * from public.coaching_note
        where embedding is not null
          and owner_id = (select auth.uid())
        order by embedding <=> query_embedding
        limit match_count;
      $body$;

      revoke all on function public.search_coaching_notes(vector, int) from public;
      grant execute on function public.search_coaching_notes(vector, int) to authenticated;
    $sql$;
  end if;
end
$do$;

-- END 20260821_strength_rls.sql

-- ============================================================================
-- BEGIN 20260827_coach_publish_assigned_session.sql
-- ============================================================================
-- Coach publish → athlete calendar via assigned_session (this repo owns the table).
-- Adds coach INSERT/UPDATE when coaches_athlete_anywhere, plus 'unpublished' state
-- so Publish/Unpublish matches the coach calendar without thawing frozen snapshots.

-- Expand state machine: unpublished = was live, now hidden from athlete pull.
alter table public.assigned_session
  drop constraint if exists assigned_session_state_ck;

alter table public.assigned_session
  add constraint assigned_session_state_ck
  check (state in (
    'draft',
    'published',
    'unpublished',
    'in_progress',
    'completed',
    'skipped'
  ));

-- Soft identity for HTML coach sessions (local ses_* ids are not uuids).
alter table public.assigned_session
  add column if not exists coach_session_key text;

-- Multiple null keys allowed (legacy athlete-created rows); coach publishes set a key.
create unique index if not exists assigned_session_athlete_coach_key_uidx
  on public.assigned_session (athlete_id, coach_session_key)
  where coach_session_key is not null;

comment on column public.assigned_session.coach_session_key is
  'Stable key from coach HTML session id; used for idempotent publish upsert.';

comment on column public.assigned_session.resolved_snapshot is
  'Publish-time payload. HTML coach stores { v, htmlSession, nutrition? }.';

-- Coach may insert/update rows for athletes they coach (same helper RLS already uses).
drop policy if exists assigned_session_coach_insert on public.assigned_session;
create policy assigned_session_coach_insert on public.assigned_session
  for insert to authenticated
  with check (public.coaches_athlete_anywhere(athlete_id));

drop policy if exists assigned_session_coach_update on public.assigned_session;
create policy assigned_session_coach_update on public.assigned_session
  for update to authenticated
  using (public.coaches_athlete_anywhere(athlete_id))
  with check (public.coaches_athlete_anywhere(athlete_id));

-- Freeze: unpublished is allowed from published; returning to draft still blocked.
-- Snapshot stays immutable once it has left draft (including unpublished).
create or replace function public.enforce_assigned_session_freeze() returns trigger
language plpgsql
set search_path = ''
as $fn$
begin
  if old.state <> 'draft' then
    if new.resolved_snapshot is distinct from old.resolved_snapshot then
      raise exception 'resolved_snapshot is frozen once the session is published';
    end if;
    if new.published_at is distinct from old.published_at then
      raise exception 'published_at is frozen once the session is published';
    end if;
    if new.state = 'draft' then
      raise exception 'a published session cannot return to draft';
    end if;
  end if;
  return new;
end;
$fn$;

-- END 20260827_coach_publish_assigned_session.sql
