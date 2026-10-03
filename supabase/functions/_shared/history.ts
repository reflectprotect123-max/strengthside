// STRENGTHSIDE-DESIGNED: preserve WHOOP's observed metrics; no recovery formula.
export function physiologicalDate(cycle: any) {
  if (!cycle?.start) return null;
  const parsed=Date.parse(cycle.start), offset=/^([+-])(\d{2}):(\d{2})$/.exec(cycle.timezone_offset||'');
  if(!Number.isFinite(parsed)) return null;
  const minutes=offset?(Number(offset[2])*60+Number(offset[3]))*(offset[1]==='-'?-1:1):0;
  return new Date(parsed+minutes*60000).toISOString().slice(0,10);
}
export function dailyPhysiology(recoveries: any[]=[],cycles: any[]=[], sleeps: any[]=[]) {
  const lookup=new Map(cycles.map(c=>[String(c.id),c])), daily=new Map();
  for(const r of recoveries){
    if(r.score_state&&r.score_state!=='SCORED')continue;
    const date=r.date||physiologicalDate(lookup.get(String(r.cycle_id)));
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date||''))continue;
    const s=r.score||r;
    const valid=(n: unknown)=>typeof n==='number'&&Number.isFinite(n)?n:null;
    const recovery=valid(s.recovery_score),hrv=valid(s.hrv_rmssd_milli),rhr=valid(s.resting_heart_rate);
    if(recovery==null&&hrv==null&&rhr==null)continue;
    const previous=daily.get(date);
    const record={date,recovery,hrv,rhr,cycleId:r.cycle_id,source:'WHOOP account',calibrating:!!s.user_calibrating,updatedAt:r.updated_at||r.created_at||''};
    if(!previous||record.updatedAt>previous.updatedAt)daily.set(date,record);
  }
  // CONFIRMED: WHOOP added top-level Cycle.step_count on 2026-09-23,
  // covered by read:cycles. STRENGTHSIDE-DESIGNED: local-cycle-date mapping.
  const stepsByDate=new Map<string, any>();
  for(const cycle of cycles){
    const date=physiologicalDate(cycle),steps=cycle.step_count;
    if(!date||!Number.isSafeInteger(steps)||steps<0||steps>2147483647)continue;
    const updatedAt=cycle.updated_at||cycle.created_at||cycle.start;
    const previous=stepsByDate.get(date);
    if(previous&&updatedAt<previous.stepsUpdatedAt)continue;
    stepsByDate.set(date,{date,steps,stepsCycleId:cycle.id,stepsUpdatedAt:updatedAt,
      stepsCycleStart:cycle.start,stepsCycleEnd:cycle.end??null});
  }
  for(const [date,steps] of stepsByDate){
    const prior=daily.get(date)||{date,source:'WHOOP account'};
    daily.set(date,{...prior,...steps,sources:{...prior.sources,steps:'WHOOP official API'}});
  }
  // Main sleep belongs to the recovery it generated, otherwise to its local wake date.
  const recoveryDates=new Map(recoveries.map(r=>[String(r.sleep_id),r.date||physiologicalDate(lookup.get(String(r.cycle_id)))]));
  for(const sleep of sleeps){
    if(sleep.nap===true||sleep.score_state!=='SCORED')continue;
    const date=recoveryDates.get(String(sleep.id))||physiologicalDate({start:sleep.end,timezone_offset:sleep.timezone_offset});
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date||''))continue;
    const stages=sleep.score?.stage_summary;
    const values=[stages?.total_light_sleep_time_milli,stages?.total_slow_wave_sleep_time_milli,stages?.total_rem_sleep_time_milli];
    if(!values.every(n=>typeof n==='number'&&Number.isFinite(n)&&n>=0))continue;
    const sleepMs=values.reduce((sum,n)=>sum+n,0);
    if(sleepMs>24*3600000)continue;
    const prior=daily.get(date)||{date,source:'WHOOP account'};
    const updatedAt=sleep.updated_at||sleep.created_at||'';
    if(prior.sleepUpdatedAt&&updatedAt<prior.sleepUpdatedAt)continue;
    daily.set(date,{...prior,sleep:sleepMs/3600000,sleepMs,sleepId:sleep.id,sleepUpdatedAt:updatedAt,
      sources:{...prior.sources,sleep:'WHOOP account'}});
  }
  return [...daily.values()].sort((a,b)=>a.date.localeCompare(b.date));
}
export function mergeIntegrationHistory(previous: any={},incoming: any={}){
  const merged={...previous,...incoming};
  for(const key of ['dailyMetrics','dailyRecovery','dailyStrain']){
    if(!Array.isArray(incoming[key]))continue;
    const map=new Map<string, any>((previous[key]||[]).map((r: any)=>[r.date,r]));
    for(const r of incoming[key]){const old=map.get(r.date)||{};map.set(r.date,{...old,...r,...(old.sources||r.sources?{sources:{...old.sources,...r.sources}}:{})});}
    merged[key]=[...map.values()].sort((a,b)=>a.date.localeCompare(b.date));
  }
  for(const key of ['recovery','cycle','sleep','workout']){
    if(!Array.isArray(incoming[key]?.records))continue;
    const id=(r: any)=>String(r.id??r.cycle_id??r.sleep_id??r.start??'');
    const map=new Map<string, any>((previous[key]?.records||[]).map((r: any)=>[id(r),r]));
    for(const r of incoming[key].records)map.set(id(r),r);
    merged[key]={...incoming[key],records:[...map.values()]};
  }
  return merged;
}
