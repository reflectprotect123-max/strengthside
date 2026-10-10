/* Recovery home adapted from the conditioning APK. Observations never change strength loads. */
(function(root){
const defs=[['recovery','Recovery','%',0,100,'whoopRecovery'],['hrv','HRV','ms',0,1000,'hrv'],['rhr','Resting HR','bpm',1,300,'restingHr'],['sleep','Sleep','h',0,24,'sleepHours'],['steps','Steps','',0,2147483647,'steps'],['sleepPerformance','Sleep performance','%',0,100,'whoopSleepPerformance'],['strain','Strain','',0,21,'whoopStrain']];
const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=v=>v==null||String(v).trim()===''?null:Number.isFinite(Number(v))?Number(v):null;
function day(d){if(!/^\d{4}-\d{2}-\d{2}$/.test(d||''))return null;const parsed=new Date(d+'T12:00:00Z');return Number.isFinite(parsed.getTime())&&parsed.toISOString().slice(0,10)===d?d:null;}
function importHistory(state,body,todayDate){
  state.checkin=state.checkin||{};
  const rows=body.dailyMetrics||body.dailyPhysiology||[];
  const map=new Map((state.whoopHistory||[]).map(r=>[r.date,r]));let count=0;
  const all=[...rows];if(body.normalized){const n=body.normalized;all.push({date:n.date,recovery:n.recoveryScore,hrv:n.hrvMs,rhr:n.restingHr,sleep:n.sleepHours,steps:n.steps,sleepPerformance:n.metricDates?.sleepPerformance===n.date?n.sleepPerformance:null,strain:n.metricDates?.strain===n.date?n.strain:null});}
  for(const r of body.dailyStrain||[])all.push({date:r.date,strain:r.strain});
  for(const [key,date] of Object.entries(body.normalized?.metricDates||{}))if(['sleepPerformance','strain'].includes(key))all.push({date,[key]:body.normalized[key]});
  for(const r of all){const date=day(r.date);if(!date||date>todayDate)continue;const old=map.get(date)||{date,source:'WHOOP account'},row={...old,sources:{...old.sources}},c=state.checkin[date]||(state.checkin[date]={date});let changed=false;
    const aliases={recovery:'recoveryScore',hrv:'hrvMs',rhr:'restingHr',sleep:'sleepHours'};
    for(const [key,,,min,max,field] of defs){const value=number(r[key]??r[aliases[key]]);if(value==null||value<min||value>max||(key==='hrv'&&value===0)||(key==='steps'&&!Number.isSafeInteger(value)))continue;row[key]=value;row.sources[key]=r.sources?.[key]||'WHOOP account';c[field]=value;changed=true;}
    if(!changed)continue;row.source='WHOOP account';map.set(date,row);c.whoopSyncedAt=body.syncedAt||new Date().toISOString();c.whoopSampleDate=date;count++;
  }
  state.whoopHistory=[...map.values()].sort((a,b)=>a.date.localeCompare(b.date));return count;
}
function records(state=root.S){const map=new Map();for(const [date,c] of Object.entries(state.checkin||{})){if(!day(date))continue;const row={date,source:c.whoopSyncedAt?'WHOOP account':'Manual entry'};for(const [key,,,,,field] of defs)row[key]=number(c[field]);map.set(date,row);}for(const r of state.whoopHistory||[]){const old=map.get(r.date)||{};map.set(r.date,{...old,...Object.fromEntries(Object.entries(r).filter(([,v])=>v!=null))});}return [...map.values()].sort((a,b)=>a.date.localeCompare(b.date));}
function selection(rows,date,todayDate){const exact=rows.find(r=>r.date===date)||{},metrics={};for(const [key] of defs){const observed=date===todayDate?rows.filter(r=>r.date<=date&&Number.isFinite(r[key])).sort((a,b)=>b.date.localeCompare(a.date))[0]:exact;if(observed&&Number.isFinite(observed[key]))metrics[key]={value:observed[key],date:observed.date,source:observed.sources?.[key]||observed.source};}return {metrics};}
const fmt=(v,key)=>v==null?'—':key==='steps'?Math.round(v).toLocaleString():Number(v).toFixed(['sleep','hrv','strain'].includes(key)?1:0);
const dailyQuestions=[['sleepQuality','Sleep quality','Bad','Great'],['soreness','Soreness','None','Very sore'],['wellbeing','How do you feel?','Bad','Great']];
let dailyDraft=null;
function dailyState(date){
  const account=S.accountId||'device';
  if(!dailyDraft||dailyDraft.date!==date||dailyDraft.account!==account)dailyDraft={date,account,values:{...(S.checkin[date]?.subjectiveRecovery||{})},editing:false,open:null};
  return dailyDraft;
}
function dailyCheckin(date){
  const c=S.checkin[date]||{},saved=c.subjectiveRecovery,complete=dailyQuestions.every(([key])=>Number.isInteger(saved?.[key])&&saved[key]>=1&&saved[key]<=5),draft=dailyState(date),current=date===today();
  const open=current&&(draft.open??(!complete&&!c.subjectiveRecoveryDeferredAt));
  const summary=complete?dailyQuestions.map(([key,label,low,high])=>'<p class="pg-between"><span>'+label+'</span><b>'+saved[key]+'/5'+(saved[key]===1?' · '+low:saved[key]===5?' · '+high:'')+'</b></p>').join(''):'<p class="pg-muted">'+'No answers recorded for this day.'+'</p>';
  const form='<form onsubmit="StrengthHome.saveDaily(event,\''+date+'\')">'+dailyQuestions.map(([key,label,low,high])=>'<fieldset class="pg-daily-question"><legend>'+label+'</legend><div class="pg-daily-options">'+[1,2,3,4,5].map(value=>'<label><input type="radio" name="'+key+'" value="'+value+'" aria-label="'+label+': '+value+(value===1?' — '+low:value===5?' — '+high:'')+'" required '+(draft.values[key]===value?'checked':'')+' onchange="StrengthHome.dailyAnswer(\''+date+'\',\''+key+'\',this.value)"><span>'+value+'</span></label>').join('')+'</div><div class="pg-between pg-muted"><span>1 · '+low+'</span><span>5 · '+high+'</span></div></fieldset>').join('')+'<p id="dailyCheckinError" class="pg-muted" role="status"></p><button class="method-load" type="submit">Save check-in</button><button class="method-secondary" type="button" onclick="StrengthHome.skipDaily(\''+date+'\')">'+(complete?'Cancel':'Not now')+'</button></form>';
  return '<details class="pg-card pg-daily" '+(open?'open':'')+' ontoggle="StrengthHome.dailyToggle(\''+date+'\',this.open)"><summary>Morning check-in'+(complete?' · Completed':'')+'</summary><p class="pg-muted">'+(current?'Sleep hours sync from WHOOP. These answers are saved alongside your recovery.':e(date)+' · Your recorded answers')+'</p>'+(current&&(!complete||draft.editing)?form:summary+(current?'<button class="method-secondary" onclick="StrengthHome.editDaily(\''+date+'\')">Edit check-in</button>':''))+'</details>';
}
// HISTORICAL: optional bedtime questions in the 2019 Morpheus guide, p.23.
// STRENGTHSIDE-DESIGNED: date/account storage and UI; no score/zone adjustment.
const bedtimeQuestions=[['fatigue','Fatigue level','No fatigue','Highest'],['nutrition','Nutrition quality','Lowest','Best']];
let bedtimeDraft=null;
function bedtimeState(date){
  const account=S.accountId||'device';
  if(!bedtimeDraft||bedtimeDraft.date!==date||bedtimeDraft.account!==account)bedtimeDraft={date,account,values:{...(S.checkin[date]?.bedtimeQuestionnaire||{})},editing:false,open:false};
  return bedtimeDraft;
}
function bedtimeComplete(v){return bedtimeQuestions.every(([k])=>Number.isInteger(v?.[k])&&v[k]>=1&&v[k]<=5)&&Number.isSafeInteger(v?.alcoholDrinks)&&v.alcoholDrinks>=0;}
function bedtimeCheckin(date){
  const saved=S.checkin[date]?.bedtimeQuestionnaire,complete=bedtimeComplete(saved),draft=bedtimeState(date),current=date===today();
  const summary=complete?bedtimeQuestions.map(([k,label])=>'<p class="pg-between"><span>'+label+'</span><b>'+saved[k]+'/5</b></p>').join('')+'<p class="pg-between"><span>Alcohol</span><b>'+saved.alcoholDrinks+' '+(saved.alcoholDrinks===1?'drink':'drinks')+'</b></p>':'<p class="pg-muted">No answers recorded for this day.</p>';
  const form='<form onsubmit="StrengthHome.saveBedtime(event,\''+date+'\')">'+bedtimeQuestions.map(([k,label,low,high])=>'<fieldset class="pg-daily-question"><legend>'+label+'</legend><div class="pg-daily-options">'+[1,2,3,4,5].map(v=>'<label><input type="radio" name="'+k+'" value="'+v+'" aria-label="'+label+': '+v+'" required '+(draft.values[k]===v?'checked':'')+' onchange="StrengthHome.bedtimeAnswer(\''+date+'\',\''+k+'\',this.value)"><span>'+v+'</span></label>').join('')+'</div><div class="pg-between pg-muted"><span>1 · '+low+'</span><span>5 · '+high+'</span></div></fieldset>').join('')+'<label for="bedtimeAlcohol">Alcohol · number of drinks</label><input id="bedtimeAlcohol" name="alcoholDrinks" type="number" inputmode="numeric" min="0" step="1" required value="'+e(draft.values.alcoholDrinks??'')+'" oninput="StrengthHome.bedtimeAnswer(\''+date+'\',\'alcoholDrinks\',this.value)"><p class="pg-muted">Enter 0 if you had none.</p><p id="bedtimeCheckinError" class="pg-muted" role="status"></p><button class="method-load" type="submit">Save bedtime check-in</button><button class="method-secondary" type="button" onclick="StrengthHome.dismissBedtime(\''+date+'\')">'+(complete?'Cancel':'Not now')+'</button></form>';
  return '<details class="pg-card pg-bedtime" '+(current&&draft.open?'open':'')+' ontoggle="StrengthHome.bedtimeToggle(\''+date+'\',this.open)"><summary>Bedtime check-in'+(complete?' · Completed':'')+'</summary><p class="pg-muted">'+e(date)+' · Optional. Saved separately from your morning answers.'+'</p>'+(current&&(!complete||draft.editing)?form:summary+(current?'<button class="method-secondary" onclick="StrengthHome.editBedtime(\''+date+'\')">Edit bedtime check-in</button>':''))+'</details>';
}

function readingsHtml(date=S.selectedDate||today()){
  const reading=selection(records(),date,today());return '<div class="pg-cards">'+defs.map(([key,label,unit])=>{const m=reading.metrics[key];return '<section class="pg-card" data-metric="'+key+'"><h2>'+label+'</h2><div class="pg-value">'+fmt(m?.value,key)+' <small>'+unit+'</small></div><p class="pg-muted">'+e(m?m.source+(m.date!==date?' · '+m.date:''):'Not recorded')+'</p></section>';}).join('')+'</div>';
}
function html(){const d=S.selectedDate||today(),connected=!!S.settings.whoop?.connected,message=root.Whoop?.uiMessage()||'';
return '<div class="pg-page strength-recovery-home"><p class="lib-kicker">Hybrid Strength</p><h1>Today</h1><label class="pg-date">View day <input aria-label="Home date" type="date" max="'+today()+'" value="'+e(d)+'" onchange="StrengthHome.homeDate(this.value)"></label><button class="method-secondary" onclick="'+(connected?'StrengthHome.refresh()':"setTab('me')")+'">'+(connected?'Refresh WHOOP':'Connect WHOOP')+'</button><p class="pg-muted" id="whoopHomeStatus" role="status">'+e(message||root.Whoop?.metaLine()||'')+'</p>'+dailyCheckin(d)+bedtimeCheckin(d)+readingsHtml(d)+'<button class="method-load" onclick="setTab(\'training\')">Start training</button><button class="method-secondary" onclick="setTab(\'progress\')">View progress and history</button></div>';}
root.StrengthHome={html,readingsHtml,records,selection,importHistory,day,
bedtimeToggle(date,open){bedtimeState(date).open=open;},
bedtimeAnswer(date,key,value){if(date!==today()||!['fatigue','nutrition','alcoholDrinks'].includes(key))return;bedtimeState(date).values[key]=value===''?'':Number(value);},
editBedtime(date){if(date!==today())return;const draft=bedtimeState(date);draft.values={...(S.checkin[date]?.bedtimeQuestionnaire||{})};draft.editing=true;draft.open=true;render();},
dismissBedtime(date){if(date!==today())return;const draft=bedtimeState(date);draft.values={...(S.checkin[date]?.bedtimeQuestionnaire||{})};draft.editing=false;draft.open=false;render();},
saveBedtime(event,date){event.preventDefault();if(date!==today())return;const form=new FormData(event.target),values={};for(const key of ['fatigue','nutrition','alcoholDrinks']){const raw=form.get(key);values[key]=raw==null||String(raw).trim()===''?null:Number(raw);}if(!bedtimeComplete(values)){document.getElementById('bedtimeCheckinError').textContent='Choose both 1–5 ratings and enter a whole number of drinks (0 if none).';return;}const c=S.checkin[date]||(S.checkin[date]={});c.bedtimeQuestionnaire={...values,completedAt:c.bedtimeQuestionnaire?.completedAt||new Date().toISOString(),updatedAt:new Date().toISOString(),model_version:'bedtime-questionnaire-v1',evidenceLabel:'STRENGTHSIDE-DESIGNED',questionEvidenceLabel:'HISTORICAL',questionSource:'Morpheus-App-User-Guide-2019-p23'};bedtimeDraft={date,account:S.accountId||'device',values:{...values},editing:false,open:false};save();render();},
dailyToggle(date,open){const draft=dailyState(date);draft.open=open;},
dailyAnswer(date,key,value){if(date!==today()||!dailyQuestions.some(q=>q[0]===key))return;const n=Number(value);if(Number.isInteger(n)&&n>=1&&n<=5)dailyState(date).values[key]=n;},
editDaily(date){if(date!==today())return;const draft=dailyState(date);draft.values={...(S.checkin[date]?.subjectiveRecovery||{})};draft.editing=true;draft.open=true;render();},
skipDaily(date){if(date!==today())return;const c=S.checkin[date]||(S.checkin[date]={});if(!c.subjectiveRecovery)c.subjectiveRecoveryDeferredAt=new Date().toISOString();delete c.subjectiveRecoverySkippedAt;const draft=dailyState(date);draft.values={...(c.subjectiveRecovery||{})};draft.editing=false;draft.open=false;save();render();},
saveDaily(event,date){event.preventDefault();if(date!==today())return;const form=new FormData(event.target),values={};for(const [key] of dailyQuestions){const n=Number(form.get(key));if(!Number.isInteger(n)||n<1||n>5){document.getElementById('dailyCheckinError').textContent='Answer all three questions using 1–5.';return;}values[key]=n;}const c=S.checkin[date]||(S.checkin[date]={});c.subjectiveRecovery={...values,completedAt:c.subjectiveRecovery?.completedAt||new Date().toISOString(),updatedAt:new Date().toISOString(),model_version:'subjective-recovery-v1',evidenceLabel:'STRENGTHSIDE-DESIGNED'};delete c.subjectiveRecoverySkippedAt;delete c.subjectiveRecoveryDeferredAt;S.dailyProgressCheckins=S.dailyProgressCheckins||{};S.dailyProgressCheckins[date]={at:new Date().toISOString()};dailyDraft={date,account:S.accountId||'device',values:{...values},editing:false,open:false};save();render();},

homeDate(d){if(day(d)&&d<=today()){S.selectedDate=d;save();render();}},
async refresh(){try{await root.Whoop.syncAll();}catch{}},
async importAll(){try{await root.Whoop.sync({backfill:true,full:true});}catch{}},
};
})(typeof window!=='undefined'?window:globalThis);
