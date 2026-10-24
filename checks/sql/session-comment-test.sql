begin;
insert into public.assigned_session(id,athlete_id,scheduled_date,state,resolved_snapshot,timezone,coach_session_key,published_at)
values('cccccccc-cccc-4ccc-8ccc-cccccccccccc','11111111-1111-1111-1111-111111111111','2026-10-22','published','{"htmlSession":{"blocks":[{"role":"warmup"}]}}','UTC','comment-regression',now());

set local role authenticated;
set local request.jwt.claims='{"sub":"11111111-1111-1111-1111-111111111111"}';

insert into public.session_comment(id,athlete_id,assignment_id,session_id,author_id,author_role,body)
values('11111111-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-1111-1111-111111111111','cccccccc-cccc-4ccc-8ccc-cccccccccccc','sess-1','11111111-1111-1111-1111-111111111111','athlete','Felt strong.');

do $test$ begin
  if (select count(*) from public.session_comment where session_id='sess-1') <> 1 then
    raise exception 'Athlete cannot read own reflection';
  end if;
end $test$;

set local request.jwt.claims='{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}';
do $test$ begin
  if exists(select 1 from public.session_comment where session_id='sess-1') then
    raise exception 'Foreign athlete can read comments';
  end if;
  begin
    insert into public.session_comment(athlete_id,assignment_id,session_id,author_id,author_role,body)
    values('11111111-1111-1111-1111-111111111111','cccccccc-cccc-4ccc-8ccc-cccccccccccc','sess-1','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','coach','Nope');
    raise exception 'Foreign user posted a coach reply';
  exception when others then
    if sqlerrm='Foreign user posted a coach reply' then raise; end if;
  end;
end $test$;

set local strength.test_coached_athletes='11111111-1111-1111-1111-111111111111';
insert into public.session_comment(id,athlete_id,assignment_id,session_id,parent_id,author_id,author_role,body)
values('22222222-bbbb-4bbb-8bbb-bbbbbbbbbbbb','11111111-1111-1111-1111-111111111111','cccccccc-cccc-4ccc-8ccc-cccccccccccc','sess-1','11111111-aaaa-4aaa-8aaa-aaaaaaaaaaaa','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','coach','Nice work.');

do $test$ begin
  if (select count(*) from public.session_comment where session_id='sess-1') <> 2 then
    raise exception 'Roster coach cannot read or reply';
  end if;
end $test$;

do $test$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='exercise' and column_name='video_url'
  ) then raise exception 'exercise.video_url missing'; end if;
end $test$;
rollback;
