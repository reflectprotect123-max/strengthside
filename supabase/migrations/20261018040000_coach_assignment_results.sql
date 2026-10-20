begin;
-- Result receipts are separate from the immutable published prescription.
alter table public.assigned_session add column if not exists athlete_result jsonb;
comment on column public.assigned_session.athlete_result is
  'Completed athlete results, derived from that athlete''s durable strength records. Never used as a prescription.';

create or replace function public.complete_coach_assignment(p_assignment_id uuid,p_session_id uuid)
returns jsonb language plpgsql security invoker set search_path = '' as $fn$
declare
  uid uuid := auth.uid();
  assignment public.assigned_session;
  receipt jsonb;
  sets jsonb;
  estimates jsonb;
  finished text;
  started text;
begin
  if uid is null then raise exception 'Authentication required'; end if;
  select * into assignment from public.assigned_session
    where id=p_assignment_id and athlete_id=uid for update;
  if not found then raise exception 'Assignment not owned by athlete'; end if;
  select jsonb_agg(jsonb_build_object('id',record_id,'exerciseKey',exercise_key,'payload',payload) order by record_id),
         max(payload->>'sessionCompletedAt'),max(payload->>'sessionStartedAt')
    into sets,finished,started
    from public.strength_brain_records
    where athlete_id=uid and session_id=p_session_id and kind='set' and not deleted
      and payload->>'coachAssignmentId'=p_assignment_id::text and payload->>'completed'='true';
  if sets is null or finished is null or started is null then raise exception 'No completed assignment evidence'; end if;
  if exists(select 1 from public.strength_brain_records where athlete_id=uid and session_id=p_session_id
    and not deleted and payload->>'coachAssignmentId'=p_assignment_id::text and (payload->>'completed') is distinct from 'true')
    then raise exception 'Assignment evidence has not finished syncing'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',record_id,'exerciseKey',exercise_key,'payload',payload) order by record_id),'[]'::jsonb)
    into estimates from public.strength_brain_records where athlete_id=uid and session_id=p_session_id
      and kind='session_estimate' and not deleted and payload->>'completed'='true'
      and payload->>'coachAssignmentId'=p_assignment_id::text;
  receipt=jsonb_build_object('version',1,'sessionId',p_session_id,'startedAt',started,'completedAt',finished,'sets',sets,'estimates',estimates);
  -- A delayed upload from an older session must not replace newer results.
  if coalesce(assignment.athlete_result->>'startedAt','') > started then
    return jsonb_build_object('ok',true,'superseded',true);
  end if;
  update public.assigned_session set athlete_result=receipt where id=p_assignment_id and athlete_id=uid;
  return jsonb_build_object('ok',true);
end;
$fn$;
revoke all on function public.complete_coach_assignment(uuid,uuid) from public,anon;
grant execute on function public.complete_coach_assignment(uuid,uuid) to authenticated;

notify pgrst,'reload schema';
commit;
