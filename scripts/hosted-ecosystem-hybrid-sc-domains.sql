-- Apply on shared Supabase project orysjncrksmdfabpuftd (SQL editor).
-- Canonical migrations: the-hybrid-engine1 supabase/migrations/20260915_*.sql
-- Required before HYBRID S&C plan sync (strength_side / engine_side).

-- === 20260915_hybrid_sc_domains.sql ===

alter table public.athlete_domain_snapshots
  drop constraint if exists athlete_domain_name;
alter table public.athlete_domain_snapshots
  add constraint athlete_domain_name check (domain in (
    'strength', 'conditioning', 'athlete_state', 'coordinator', 'nutrition',
    'strength_side', 'engine_side'
  ));

alter table public.athlete_events
  drop constraint if exists athlete_event_source;
alter table public.athlete_events
  add constraint athlete_event_source check (source_domain in (
    'core', 'strength', 'conditioning', 'athlete_state', 'coordinator', 'nutrition',
    'strength_side', 'engine_side'
  ));

create or replace function public.upsert_athlete_domain_snapshot(
  p_domain text,
  p_schema_version integer,
  p_revision bigint,
  p_writer text,
  p_client_updated_at timestamptz,
  p_snapshot jsonb
)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_changed boolean := false; v_rows integer;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if p_domain not in (
    'strength', 'conditioning', 'athlete_state', 'coordinator', 'nutrition',
    'strength_side', 'engine_side'
  ) then raise exception 'invalid domain'; end if;
  if jsonb_typeof(p_snapshot) <> 'object' then raise exception 'snapshot must be a JSON object'; end if;
  insert into public.athlete_domain_snapshots(user_id, domain, schema_version, revision, writer, snapshot, client_updated_at)
    values (v_uid, p_domain, p_schema_version, p_revision, p_writer, p_snapshot, p_client_updated_at)
  on conflict (user_id, domain) do update set
    schema_version = excluded.schema_version,
    revision = excluded.revision,
    writer = excluded.writer,
    snapshot = excluded.snapshot,
    client_updated_at = excluded.client_updated_at
  where public.athlete_domain_snapshots.revision < excluded.revision
     or (public.athlete_domain_snapshots.revision = excluded.revision
         and coalesce(public.athlete_domain_snapshots.client_updated_at, '-infinity'::timestamptz)
             <= coalesce(excluded.client_updated_at, '-infinity'::timestamptz));
  get diagnostics v_rows = row_count;
  v_changed := v_rows > 0;
  return v_changed;
end;
$$;

create or replace function public.record_athlete_event(
  p_idempotency_key text,
  p_event_type text,
  p_source_domain text,
  p_occurred_at timestamptz,
  p_payload jsonb
)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_changed boolean := false; v_rows integer;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if p_event_type not in ('workout_completed', 'workout_modified', 'training_load_recorded', 'body_weight_recorded', 'readiness_recorded', 'nutrition_target_updated') then raise exception 'invalid event type'; end if;
  if p_source_domain not in (
    'core', 'strength', 'conditioning', 'athlete_state', 'coordinator', 'nutrition',
    'strength_side', 'engine_side'
  ) then raise exception 'invalid source domain'; end if;
  if jsonb_typeof(p_payload) <> 'object' then raise exception 'event payload must be a JSON object'; end if;
  insert into public.athlete_events(user_id, idempotency_key, event_type, source_domain, occurred_at, payload)
    values (v_uid, p_idempotency_key, p_event_type, p_source_domain, p_occurred_at, p_payload)
  on conflict (user_id, idempotency_key) do nothing;
  get diagnostics v_rows = row_count;
  v_changed := v_rows > 0;
  return v_changed;
end;
$$;

revoke all on function public.upsert_athlete_domain_snapshot(text, integer, bigint, text, timestamptz, jsonb) from public;
grant execute on function public.upsert_athlete_domain_snapshot(text, integer, bigint, text, timestamptz, jsonb) to authenticated;
revoke all on function public.record_athlete_event(text, text, text, timestamptz, jsonb) from public;
grant execute on function public.record_athlete_event(text, text, text, timestamptz, jsonb) to authenticated;

-- === 20260915_ecosystem_grant_hardening.sql ===

revoke all on public.athlete_core from anon, authenticated;
revoke all on public.athlete_domain_snapshots from anon, authenticated;
revoke all on public.athlete_events from anon, authenticated;
revoke all on public.athlete_weekly_plans from anon, authenticated;

grant select, delete on public.athlete_core to authenticated;
grant select, delete on public.athlete_domain_snapshots to authenticated;
grant select, delete on public.athlete_events to authenticated;
grant select, delete on public.athlete_weekly_plans to authenticated;
