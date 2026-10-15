\set ON_ERROR_STOP on
-- Run after the existing isolated-database fixture/migration. No hosted database.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
do $$
declare result jsonb; batch jsonb; bad jsonb; rejected boolean; before_count bigint;
begin
 batch:='[{"record_id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1","session_id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","exercise_key":"squat","kind":"set","expected_revision":0,"payload":{"contractVersion":2,"row":{"kg":40}}},{"record_id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2","session_id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","exercise_key":"squat","kind":"set","expected_revision":0,"payload":{"contractVersion":3,"ownerId":"22222222-2222-4222-8222-222222222222","normalizedLoad":{"externalKg":60}}}]';
 result:=public.sync_strength_brain_records(batch);
 if result->>'ok'<>'true' or result->>'count'<>'2' then raise exception 'Mixed clients failed';end if;
 if (select count(*) from public.strength_brain_records where record_id::text like 'aaaaaaaa%')<>2 then raise exception 'Mixed clients lost facts';end if;
 if exists(select 1 from public.strength_brain_records where athlete_id<>auth.uid()) then raise exception 'Payload owner overrode JWT';end if;
 select count(*) into before_count from public.strength_brain_records;
 rejected:=false;
 begin perform public.sync_strength_brain_records(null);exception when others then rejected:=true;end;
 if not rejected then raise exception 'SQL NULL batch accepted';end if;
 -- Each malformed batch must reject without writing its otherwise-valid prefix.
 for bad in select value from jsonb_array_elements(jsonb_build_array(
   null,'{}'::jsonb,'null'::jsonb,
   batch||jsonb_build_array(batch->0),
   jsonb_build_array(jsonb_set(batch->0,'{record_id}','"cccccccc-cccc-4ccc-8ccc-ccccccccccc1"'),jsonb_set(batch->0,'{record_id}','"CCCCCCCC-CCCC-4CCC-8CCC-CCCCCCCCCCC1"')),
   jsonb_build_array(jsonb_set(batch->0,'{record_id}','"invalid-uuid"')),
   jsonb_build_array(jsonb_set(batch->0,'{expected_revision}','-1')),
   jsonb_build_array(jsonb_set(batch->0,'{payload}','[]')),
   jsonb_build_array(jsonb_set(batch->0,'{payload}',jsonb_build_object('large',repeat('x',200001))))
 )) loop
   rejected:=false;
   begin perform public.sync_strength_brain_records(bad);exception when others then rejected:=true;end;
   if not rejected then raise exception 'Malformed batch accepted: %',bad;end if;
   if (select count(*) from public.strength_brain_records)<>before_count then raise exception 'Malformed batch partially wrote';end if;
 end loop;
 -- Conflict in the second row must not insert the first row.
 batch:=jsonb_set(batch,'{0,record_id}','"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3"');
 result:=public.sync_strength_brain_records(batch);
 if result->>'reason'<>'conflict' then raise exception 'Missing stale revision conflict';end if;
 if exists(select 1 from public.strength_brain_records where record_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3') then raise exception 'Stale batch partially committed';end if;
 batch:=jsonb_set(batch,'{0,expected_revision}','0');
 batch:=jsonb_set(batch,'{1,expected_revision}','1');
 batch:=jsonb_set(batch,'{1,deleted}','true');
 result:=public.sync_strength_brain_records(batch);
 if result->>'ok'<>'true' or not(select deleted from public.strength_brain_records where record_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2') then raise exception 'V3 tombstone lost';end if;
end $$;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
do $$begin
 if exists(select 1 from public.strength_brain_records where athlete_id='11111111-1111-4111-8111-111111111111') then raise exception 'B read A';end if;
end $$;
set local role anon;
select set_config('request.jwt.claim.sub','',true);
do $$declare rejected boolean:=false;begin
 begin perform public.sync_strength_brain_records('[]');exception when insufficient_privilege then rejected:=true;end;
 if not rejected then raise exception 'Anon executed RPC';end if;
end $$;
rollback;
select 'PASS: mixed-v2/v3, JWT ownership, 9 malformed/atomic batches, stale-batch atomicity, tombstone, B isolation, anon denial' as result;
