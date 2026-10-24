begin;
set local role authenticated;
set local request.jwt.claims='{"sub":"11111111-1111-1111-1111-111111111111"}';
insert into public.athlete_starting_level(athlete_id,level) values('11111111-1111-1111-1111-111111111111','partner');
do $test$ begin
  if (select level from public.athlete_starting_level where athlete_id='11111111-1111-1111-1111-111111111111')<>'partner'
    then raise exception 'Athlete cannot read own starting level'; end if;
end $test$;
set local request.jwt.claims='{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}';
do $test$ begin
  if exists(select 1 from public.athlete_starting_level)
    then raise exception 'Other athlete can read starting level'; end if;
  begin
    insert into public.athlete_starting_level(athlete_id,level) values('11111111-1111-1111-1111-111111111111','dan');
    raise exception 'Athlete wrote another account starting level';
  exception when others then if sqlerrm='Athlete wrote another account starting level' then raise; end if; end;
end $test$;
set local request.jwt.claims='{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"}';
set local strength.test_coached_athletes='11111111-1111-1111-1111-111111111111';
do $test$ begin
  if (select level from public.athlete_starting_level where athlete_id='11111111-1111-1111-1111-111111111111')<>'partner'
    then raise exception 'Coach cannot read athlete starting level'; end if;
  update public.athlete_starting_level set level='dan' where athlete_id='11111111-1111-1111-1111-111111111111';
  if (select level from public.athlete_starting_level where athlete_id='11111111-1111-1111-1111-111111111111')<>'dan'
    then raise exception 'Coach cannot set athlete starting level'; end if;
end $test$;
set local strength.test_coached_athletes='';
do $test$ begin
  if exists(select 1 from public.athlete_starting_level)
    then raise exception 'Unrelated user can read starting level'; end if;
end $test$;
rollback;
