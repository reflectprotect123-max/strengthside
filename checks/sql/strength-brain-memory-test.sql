\set ON_ERROR_STOP on
create schema if not exists auth;
create table if not exists auth.users(id uuid primary key);
create role anon;
create role authenticated;
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
grant usage on schema auth to anon,authenticated;
insert into auth.users values ('11111111-1111-4111-8111-111111111111'),('22222222-2222-4222-8222-222222222222');
\i supabase/migrations/20261010120000_strength_brain_memory.sql
set role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
do $$declare result jsonb;begin
 result:=public.sync_strength_brain_records('[{"record_id":"33333333-3333-4333-8333-333333333333","session_id":"44444444-4444-4444-8444-444444444444","exercise_key":"squat|bar|kg","kind":"set","expected_revision":0,"payload":{"reps":8,"kg":40}}]');
 if result->>'ok'<>'true' then raise exception 'Initial write failed';end if;
 if (select count(*) from public.strength_brain_records)<>1 then raise exception 'Set not persisted';end if;
 result:=public.sync_strength_brain_records('[{"record_id":"33333333-3333-4333-8333-333333333333","session_id":"44444444-4444-4444-8444-444444444444","exercise_key":"squat|bar|kg","kind":"set","expected_revision":0,"payload":{"reps":6}}]');
 if result->>'reason'<>'conflict' then raise exception 'Stale retry overwrote data';end if;
 if (select revision from public.strength_brain_records)<>1 then raise exception 'Stale write advanced revision';end if;
 result:=public.sync_strength_brain_records('[{"record_id":"33333333-3333-4333-8333-333333333333","session_id":"44444444-4444-4444-8444-444444444444","exercise_key":"squat|bar|kg","kind":"set","expected_revision":1,"deleted":true,"payload":{"reps":6}}]');
 if result->>'ok'<>'true' or not (select deleted from public.strength_brain_records) then raise exception 'Deletion tombstone failed';end if;
 begin
  insert into public.strength_brain_records(athlete_id,record_id,session_id,exercise_key,kind,payload) values(auth.uid(),gen_random_uuid(),gen_random_uuid(),'squat','set','{}');
  raise exception 'Direct write was allowed';
 exception when insufficient_privilege then null;end;
end $$;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);
do $$begin if exists(select 1 from public.strength_brain_records) then raise exception 'Athlete B can read A';end if;end $$;
select set_config('request.jwt.claim.sub','',false);
do $$begin
 begin perform public.sync_strength_brain_records('[]');raise exception 'Unauthenticated write allowed';exception when insufficient_privilege then null;end;
end $$;
reset role;
select 'PASS: persisted sets, stale revision rejection, tombstones, direct-write denial, athlete isolation, unauthenticated denial' as result;
