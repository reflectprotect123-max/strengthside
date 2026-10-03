// STRENGTHSIDE-DESIGNED: preserve WHOOP's observed metrics; no recovery formula.
export function physiologicalDate(cycle) {
  if (!cycle?.start) return null;
  const parsed=Date.parse(cycle.start), offset=/^([+-])(\d{2}):(\d{2})$/.exec(cycle.timezone_offset||'');
  if(!Number.isFinite(parsed)) return null;
  const minutes=offset?(Number(offset[2])*60+Number(offset[3]))*(offset[1]==='-'?-1:1):0;
  return new Date(parsed+minutes*60000).toISOString().slice(0,10);
}
export function dailyPhysiology(recoveries=[],cycles=[]) {
  const lookup=new Map(cycles.map(c=>[String(c.id),c])), daily=new Map();
  for(const r of recoveries){
    if(r.score_state&&r.score_state!=='SCORED')continue;
    const date=r.date||physiologicalDate(lookup.get(String(r.cycle_id)));
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date||''))continue;
    const s=r.score||r;
    const valid=n=>typeof n==='number'&&Number.isFinite(n)?n:null;
    const recovery=valid(s.recovery_score),hrv=valid(s.hrv_rmssd_milli),rhr=valid(s.resting_heart_rate);
    if(recovery==null&&hrv==null&&rhr==null)continue;
    const previous=daily.get(date);
    const record={date,recovery,hrv,rhr,cycleId:r.cycle_id,source:'WHOOP account',calibrating:!!s.user_calibrating,updatedAt:r.updated_at||r.created_at||''};
    if(!previous||record.updatedAt>previous.updatedAt)daily.set(date,record);
  }
  return [...daily.values()].sort((a,b)=>a.date.localeCompare(b.date));
}
export function mergeIntegrationHistory(previous={},incoming={}){
  const merged={...previous,...incoming};
  for(const key of ['dailyMetrics','dailyRecovery','dailyStrain']){
    if(!Array.isArray(incoming[key]))continue;
    const map=new Map((previous[key]||[]).map(r=>[r.date,r]));
    for(const r of incoming[key])map.set(r.date,{...map.get(r.date),...r});
    merged[key]=[...map.values()].sort((a,b)=>a.date.localeCompare(b.date));
  }
  for(const key of ['recovery','cycle','sleep','workout']){
    if(!Array.isArray(incoming[key]?.records))continue;
    const id=r=>String(r.id??r.cycle_id??r.sleep_id??r.start??'');
    const map=new Map((previous[key]?.records||[]).map(r=>[id(r),r]));
    for(const r of incoming[key].records)map.set(id(r),r);
    merged[key]={...incoming[key],records:[...map.values()]};
  }
  return merged;
}
