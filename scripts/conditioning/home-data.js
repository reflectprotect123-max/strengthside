/* STRENGTHSIDE-DESIGNED: select observed data without changing its date or score. */
(function(){
function selection(records,selectedDate,today){
  const exact=records.find(row=>row.date===selectedDate)||{};
  if(selectedDate!==today)return {row:exact,date:selectedDate,stale:false};
  const latest=records.filter(row=>row.source==='WHOOP account'&&row.date<=today&&[row.recovery,row.hrv,row.rhr].some(value=>typeof value==='number'&&Number.isFinite(value))).sort((a,b)=>b.date.localeCompare(a.date))[0];
  const row=latest||exact,date=row.date||selectedDate;
  return {row,date,stale:!!latest&&date!==today};
}
window.EngineHome={selection};
})();
