/* STRENGTHSIDE-DESIGNED: estimated three-zone boundaries using Karvonen.
 * The HR-reserve equation is standard; 50/70/85% cutoffs are our defaults,
 * not disclosed Morpheus formulas or measured physiological thresholds. */
(function(){
const CONFIG=Object.freeze({version:'karvonen-v1',blue:.50,green:.70,red:.85,windowDays:28});
const valid=n=>typeof n==='number'&&Number.isFinite(n)&&n>0&&n<=300;
function karvonen(max,resting,config=CONFIG){
  if(!valid(max)||!Number.isInteger(max)||!valid(resting)||max-resting<10)return null;
  if(!(0<=config.blue&&config.blue<config.green&&config.green<config.red&&config.red<1))return null;
  const reserve=max-resting,at=f=>Math.round(resting+f*reserve);
  const blue=at(config.blue),green=at(config.green),red=at(config.red);
  if(!(blue>0&&blue<green&&green<red&&red<max))return null;
  return {blue,green,red,max,resting,mode:'karvonen',reserve,
    fractions:{blue:config.blue,green:config.green,red:config.red},
    baseline_version:config.version,version:config.version+':'+max+':'+resting,
    confidence:'low',estimated:true,evidenceLabel:'STRENGTHSIDE-DESIGNED'};
}
function restingBaseline(state,date){
  const start=new Date(date+'T12:00:00Z');start.setUTCDate(start.getUTCDate()-CONFIG.windowDays+1);
  const from=start.toISOString().slice(0,10),days=new Map();
  for(const row of state.whoopHistory||[]){
    if(row.date>=from&&row.date<=date&&valid(row.rhr)&&/WHOOP/i.test(row.source||''))days.set(row.date,{date:row.date,rhr:row.rhr,source:row.source});
  }
  for(const [day,row] of Object.entries(state.checkin||{})){
    if(day>=from&&day<=date&&row.whoopSyncedAt&&valid(row.restingHr))days.set(day,{date:day,rhr:row.restingHr,source:'WHOOP account'});
  }
  const samples=[...days.values()].sort((a,b)=>a.date.localeCompare(b.date));
  return {resting:samples.length?samples.reduce((n,r)=>n+r.rhr,0)/samples.length:null,
    source:'WHOOP '+CONFIG.windowDays+'-day average',windowStart:from,windowEnd:date,samples};
}
function profile(state,date){
  const stored=state.settings.liveZones;
  if(!stored)return null;
  // Keep previously saved custom boundaries until the athlete selects Karvonen.
  if(stored.mode!=='karvonen')return [stored.blue,stored.green,stored.red,stored.max].every(valid)&&stored.blue<stored.green&&stored.green<stored.red&&stored.red<=stored.max?{...stored,mode:'custom'}:null;
  const observed=restingBaseline(state,date),manual=stored.restingMode==='manual';
  const resting=manual?stored.resting:observed.resting;
  const result=karvonen(stored.max,resting);
  return result?{...result,restingMode:manual?'manual':'whoop',restingSource:manual?'Manual resting HR':observed.source,
    baseline_inputs:manual?[{rhr:resting,source:'Manual resting HR'}]:observed.samples,
    baseline_window:manual?null:{start:observed.windowStart,end:observed.windowEnd},
    version:result.version+':'+(manual?'manual':date)}:null;
}
function settings(max,resting,state,date){
  const manual=resting!=null&&resting!=='';
  const effective=manual?resting:restingBaseline(state,date).resting;
  if(!karvonen(max,effective))return null;
  return {mode:'karvonen',max,resting:manual?resting:null,restingMode:manual?'manual':'whoop',
    version:CONFIG.version,baseline_version:CONFIG.version,evidenceLabel:'STRENGTHSIDE-DESIGNED'};
}
window.EngineZones={CONFIG,karvonen,restingBaseline,profile,settings};
})();
