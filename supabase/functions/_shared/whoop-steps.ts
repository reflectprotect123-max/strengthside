// STRENGTHSIDE-DESIGNED: optional personal read-only adapter.
// Endpoint/graph schema researched in MIT-licensed thebriangao/totem (see docs).
// Never accepts a browser-supplied token, URL, metric or WHOOP write operation.
export function stepsFromTrend(raw: any, endDate: string) {
  const daily=new Map<string, any>();
  // Only the daily week plot: longer windows can contain aggregate values.
  const segment=raw?.week_time_segment;
  if(!segment||segment.is_hidden===true)return [];
  const add=(point: any)=>{
    const detail=point?.data_scrubber_details;
    const label=detail?.primary_contextual_display;
    // Reject ambiguous, yearless and relative labels instead of guessing dates.
    let date=typeof label==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(label)?label:null;
    if(!date&&typeof label==='string'){
      const match=/^(?:[A-Za-z]+,? )?([A-Za-z]+) (\d{1,2}), (\d{4})$/.exec(label);
      if(match){
        const month=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'].indexOf(match[1].slice(0,3).toLowerCase());
        if(month>=0){const parsed=new Date(Date.UTC(Number(match[3]),month,Number(match[2]),12));
          if(parsed.getUTCMonth()===month&&parsed.getUTCDate()===Number(match[2])&&parsed.getUTCFullYear()===Number(match[3]))date=parsed.toISOString().slice(0,10);}
      }
    }
    const parsed=date?Date.parse(date+'T12:00:00Z'):NaN;
    if(!date||date>endDate||!Number.isFinite(parsed)||new Date(parsed).toISOString().slice(0,10)!==date)return;
    const text=detail?.value_display;
    if(typeof text!=='string'||!/^\d{1,3}(?:,\d{3})*$|^\d+$/.test(text.trim()))return;
    const steps=Number(text.replaceAll(',',''));
    if(!Number.isSafeInteger(steps)||steps<0||steps>200000)return;
    const prior=daily.get(date);
    if(prior&&prior.steps!==steps)throw Error('conflicting_daily_steps');
    daily.set(date,{date,steps,source:'WHOOP account',sources:{steps:'WHOOP private feed'}});
  };
  for(const entry of segment.graph?.plots||[]){
    for(const seg of entry.plot?.segments||[])for(const point of seg.points||[])add(point);
    for(const group of entry.plot?.bar_groups||[])for(const bar of group.bars||[])add(bar);
  }
  return [...daily.values()].sort((a,b)=>a.date.localeCompare(b.date));
}
export async function fetchPersonalSteps(owner: string, endDate: string, officialToken: string) {
  const boundOwner=Deno.env.get('WHOOP_STEPS_OWNER');
  const token=Deno.env.get('WHOOP_PRIVATE_ACCESS_TOKEN');
  if(!boundOwner||owner!==boundOwner||!token)return {rows:[],status:'not_configured'};
  try{
    // Ensure the private session is the same WHOOP account as this OAuth connection.
    const [official,privateAccount]=await Promise.all([
      fetch('https://api.prod.whoop.com/developer/v2/user/profile',{headers:{authorization:'Bearer '+officialToken},signal:AbortSignal.timeout(10000)}),
      fetch('https://api.prod.whoop.com/users-service/v2/bootstrap?apiVersion=7',{headers:{authorization:'Bearer '+token,accept:'application/json'},signal:AbortSignal.timeout(10000)})
    ]);
    if(privateAccount.status===401||privateAccount.status===403)return {rows:[],status:'reauth_required'};
    if(!official.ok||!privateAccount.ok)return {rows:[],status:'unavailable'};
    const officialId=(await official.json()).user_id,privateId=(await privateAccount.json()).user?.id;
    if(officialId==null||privateId==null||String(officialId)!==String(privateId))return {rows:[],status:'account_mismatch'};
    const url=new URL('https://api.prod.whoop.com/progression-service/v3/trends/STEPS');
    url.searchParams.set('endDate',endDate);
    const response=await fetch(url,{headers:{authorization:'Bearer '+token,accept:'application/json','accept-language':'en',locale:'en_US'},signal:AbortSignal.timeout(10000)});
    if(response.status===401||response.status===403)return {rows:[],status:'reauth_required'};
    if(!response.ok)return {rows:[],status:'unavailable'};
    const rows=stepsFromTrend(await response.json(),endDate);
    return {rows,status:rows.length?'ok':'no_dated_readings'};
  }catch{return {rows:[],status:'unavailable'};}
}
