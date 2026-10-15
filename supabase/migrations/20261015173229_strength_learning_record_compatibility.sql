-- Preserve v2/v3 payload compatibility; reject SQL NULL requests atomically.
begin;
create or replace function public.sync_strength_brain_records(p_records jsonb)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare uid uuid:=auth.uid(); item jsonb; actual bigint; expected bigint; rid uuid;
begin
  if uid is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if jsonb_typeof(p_records) is distinct from 'array' or jsonb_array_length(p_records)>100 then raise exception 'Expected at most 100 records'; end if;
  perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
  if (select count(*)<>count(distinct value->>'record_id') from jsonb_array_elements(p_records)) then raise exception 'Duplicate record IDs'; end if;
  for item in select value from jsonb_array_elements(p_records) loop
    rid:=(item->>'record_id')::uuid; expected:=(item->>'expected_revision')::bigint;
    if rid is null or expected is null or expected<0 or item->>'kind' not in ('set','session_estimate') or (item->>'session_id') is null or coalesce(item->>'exercise_key','')='' or jsonb_typeof(item->'payload') is distinct from 'object' or octet_length((item->'payload')::text)>200000 then raise exception 'Invalid strength record'; end if;
    select revision into actual from public.strength_brain_records where athlete_id=uid and record_id=rid;
    if coalesce(actual,0)<>expected then return jsonb_build_object('ok',false,'reason','conflict','record_id',rid); end if;
  end loop;
  for item in select value from jsonb_array_elements(p_records) loop
    insert into public.strength_brain_records(athlete_id,record_id,session_id,exercise_key,kind,revision,deleted,payload)
    values(uid,(item->>'record_id')::uuid,(item->>'session_id')::uuid,item->>'exercise_key',item->>'kind',1,coalesce((item->>'deleted')::boolean,false),item->'payload')
    on conflict(athlete_id,record_id) do update set session_id=excluded.session_id,exercise_key=excluded.exercise_key,kind=excluded.kind,revision=strength_brain_records.revision+1,deleted=excluded.deleted,payload=excluded.payload,updated_at=now();
  end loop;
  return jsonb_build_object('ok',true,'count',jsonb_array_length(p_records));
end $$;
revoke all on function public.sync_strength_brain_records(jsonb) from public,anon;
grant execute on function public.sync_strength_brain_records(jsonb) to authenticated;
notify pgrst,'reload schema';
commit;
