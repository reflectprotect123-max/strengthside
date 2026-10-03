/* STRENGTHSIDE-DESIGNED: select observed data without changing its date or score. */
(function(){
function selection(records,selectedDate,today){
  const exact=records.find(row=>row.date===selectedDate)||{};
  if(selectedDate!==today)return {row:exact,date:selectedDate,stale:false};
  const latest=records.filter(row=>row.source==='WHOOP account'&&row.date<=today&&[row.recovery,row.hrv,row.rhr,row.sleep,row.steps].some(value=>typeof value==='number'&&Number.isFinite(value))).sort((a,b)=>b.date.localeCompare(a.date))[0];
  const row=latest||exact,date=row.date||selectedDate;
  const metrics={};
  for(const key of ['recovery','hrv','rhr','sleep','steps']){
    const observed=records.filter(r=>r.source==='WHOOP account'&&r.date<=today&&Number.isFinite(r[key])).sort((a,b)=>b.date.localeCompare(a.date))[0];
    if(observed)metrics[key]={value:observed[key],date:observed.date,source:observed.sources?.[key]||observed.source};
  }
  return {row,date,metrics,stale:!!latest&&date!==today};
}
window.EngineHome={selection};
})();
