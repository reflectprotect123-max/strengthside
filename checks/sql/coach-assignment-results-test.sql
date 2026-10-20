begin;
insert into public.assigned_session(id,athlete_id,scheduled_date,state,resolved_snapshot,timezone,coach_session_key,published_at)
values('dddddddd-dddd-4ddd-8ddd-dddddddddddd','11111111-1111-1111-1111-111111111111','2026-10-18','published','{"frozen":true}','UTC','receipt-regression',now());
set local role authenticated;
set local request.jwt.claims='{"sub":"11111111-1111-1111-1111-111111111111"}';
do $test$ begin
 begin
  perform public.complete_coach_assignment('dddddddd-dddd-4ddd-8ddd-dddddddddddd','eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee');
  raise exception 'Accepted empty results';
 exception when others then if sqlerrm='Accepted empty results' then raise; end if; end;
end $test$;
select public.sync_strength_brain_records('[{"record_id":"ffffffff-ffff-4fff-8fff-ffffffffffff","session_id":"eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee","exercise_key":"test","kind":"set","expected_revision":0,"payload":{"completed":true,"coachAssignmentId":"dddddddd-dddd-4ddd-8ddd-dddddddddddd","sessionCompletedAt":"2026-10-18T10:00:00Z","sessionStartedAt":"2026-10-18T09:00:00Z","row":{"kg":40,"reps":8}}}]');
select public.complete_coach_assignment('dddddddd-dddd-4ddd-8ddd-dddddddddddd','eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee');
select public.complete_coach_assignment('dddddddd-dddd-4ddd-8ddd-dddddddddddd','eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee');
do $test$ declare r public.assigned_session;begin
 select * into r from public.assigned_session where id='dddddddd-dddd-4ddd-8ddd-dddddddddddd';
 if r.state<>'published' or r.resolved_snapshot<>'{"frozen":true}'::jsonb or jsonb_array_length(r.athlete_result->'sets')<>1
   or r.athlete_result#>>'{sets,0,payload,row,kg}'<>'40' then raise exception 'Receipt or immutable prescription changed incorrectly';end if;
end $test$;
set local request.jwt.claims='{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}';
do $test$ begin
 begin
  perform public.complete_coach_assignment('dddddddd-dddd-4ddd-8ddd-dddddddddddd','eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee');
  raise exception 'Accepted another athlete results';
 exception when others then if sqlerrm='Accepted another athlete results' then raise;end if;end;
end $test$;
set local strength.test_coached_athletes='11111111-1111-1111-1111-111111111111';
do $test$ begin
 if not exists(select 1 from public.assigned_session where id='dddddddd-dddd-4ddd-8ddd-dddddddddddd' and athlete_result is not null)
   then raise exception 'Roster coach cannot read returned results';end if;
end $test$;
rollback;
