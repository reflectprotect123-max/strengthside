/* STRENGTHSIDE-DESIGNED: opt-in, one-question-at-a-time fitness setup. */
(function(){
const M=EngineOnboardingModel;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={low:'Low',moderate:'Moderate',high:'High',maintain:'Maintain cardio',improve:'Improve cardio'};
let opened=false,index=0,draft=null,flow=[],message='',owner=null;
function input(key,label,min,max,value){return '<label>'+label+'<input autofocus aria-label="'+label+'" type="number" min="'+min+'" max="'+max+'" step="'+(key==='restingHR'?'any':'1')+'" value="'+esc(value??'')+'" oninput="EngineOnboarding.value(\''+key+'\',this.value)"></label>';}
function choices(key,items){return '<div class="onboarding-choices">'+items.map(([value,title,description])=>'<button type="button" aria-pressed="'+(draft[key]===value)+'" onclick="EngineOnboarding.pick(\''+key+'\',\''+value+'\')"><b>'+title+'</b><span>'+description+'</span></button>').join('')+'</div>';}
function question(){
  const step=flow[index],observed=EngineZones.restingBaseline(S,today());
  switch(step){
    case 'age':return '<h2>How old are you?</h2><p>Your age helps estimate maximum heart rate.</p>'+input('age','Age in years',18,100,draft.age);
    case 'fitness':return '<h2>How is your cardio fitness?</h2>'+choices('fitness',[
      ['low','Low · Building a base','I’m starting or returning to cardio. Sustained aerobic exercise is challenging.'],
      ['moderate','Moderate · Training regularly','I do cardio regularly and can sustain a comfortable pace. Harder efforts challenge me.'],
      ['high','High · Well conditioned','I have a consistent cardio training history, can sustain longer sessions and tolerate harder efforts well.']]);
    case 'goal':return '<h2>What’s your cardio goal?</h2>'+choices('goal',[
      ['maintain','Maintain cardio','Keep my conditioning while focusing on other training.'],
      ['improve','Improve cardio','Build my aerobic fitness and conditioning.']]);
    case 'maximum':return '<h2>Do you know your maximum HR?</h2>'+choices('maximumMode',[
      ['estimated','Estimate it for me','Use my age to estimate a starting point.'],
      ['known','I know my maximum','Use a maximum heart rate I’ve measured or already know.']])+
      (draft.maximumMode==='known'?input('knownMaximum','Maximum HR',1,300,draft.knownMaximum):'<p class="onboarding-estimate">Estimated maximum: <b>'+M.estimatedMaximum(draft.age)+' bpm</b></p>');
    case 'resting':return '<h2>What’s your resting heart rate?</h2>'+
      (observed.resting!=null?choices('restingMode',[
        ['whoop','Use WHOOP','Resting HR average: '+observed.resting.toFixed(1)+' bpm.'],
        ['manual','Enter it myself','Use my own resting heart rate.']]):'<p>WHOOP hasn’t supplied resting HR yet. Enter a resting measurement to calculate your zones.</p>')+
      (draft.restingMode==='manual'?input('restingHR','Resting HR',1,299,draft.restingHR):'');
    case 'review':{
      const value=M.result(draft,S,today());if(value.error)return '<h2>Check your answers</h2><p>'+esc(value.error)+'</p>';
      const z=value.baseline;
      return '<h2>You’re ready to train</h2><dl><div><dt>Cardio fitness</dt><dd>'+labels[draft.fitness]+'</dd></div><div><dt>Goal</dt><dd>'+labels[draft.goal]+'</dd></div><div><dt>Maximum HR</dt><dd>'+z.max+' bpm · '+(draft.maximumMode==='known'?'Entered':'Estimated')+'</dd></div><div><dt>Resting HR</dt><dd>'+z.resting.toFixed(1)+' bpm · '+(draft.restingMode==='whoop'?'WHOOP':'Entered')+'</dd></div></dl><div class="onboarding-zone-summary">'+[['Blue',z.blue,z.green-1],['Green',z.green,z.red-1],['Red',z.red,z.max]].map(([name,lo,hi])=>'<p style="color:'+({Blue:'var(--trn-blue)',Green:'var(--recovery-high)',Red:'var(--recovery-low)'}[name])+'">'+name+' <b>'+lo+'–'+hi+' bpm</b></p>').join('')+'</div><p>Estimated baseline zones. Today’s recovery adjusts your cardio guidance.</p>';
    }
  }
}
function dialogHtml(){return '<dialog id="engineOnboarding" class="engine-onboarding" aria-labelledby="onboardingTitle"><header><span id="onboardingTitle">'+(S.settings.onboarding?.completed?'Edit fitness setup':'Onboarding')+'</span><button type="button" aria-label="Close onboarding" onclick="EngineOnboarding.close()">×</button></header><p class="onboarding-step">'+(index+1)+' of '+flow.length+'</p><form onsubmit="EngineOnboarding.next(event)">'+question()+'<p class="live-warning" role="status">'+esc(message)+'</p><footer>'+(index?'<button type="button" class="method-secondary" onclick="EngineOnboarding.back()">Back</button>':'')+'<button class="method-load" type="submit">'+(flow[index]==='review'?'Finish':'Next')+'</button></footer></form></dialog>';}
function settingsHtml(){
  const done=S.settings.onboarding?.completed,p=S.settings.fitnessProfile;
  return '<section class="pg-card onboarding-card"><h2>Onboarding</h2>'+
    '<button id="onboardingStart" class="method-secondary" '+(done?'disabled aria-label="Onboarding completed"':'onclick="EngineOnboarding.open()"')+'>'+(done?'Completed':'Start onboarding')+'</button>'+
    (done?'<p class="pg-muted">'+esc(labels[p?.cardioFitness]||'Fitness setup saved')+' · '+esc(labels[p?.goal]||'')+'</p><button id="editFitnessProfile" class="method-secondary" onclick="EngineOnboarding.open(true)">Edit fitness setup</button>':'<p class="pg-muted">Answer a few questions to set up your cardio zones.</p>')+'</section>';
}
function close(){opened=false;draft=null;message='';render();document.getElementById(S.settings.onboarding?.completed?'editFitnessProfile':'onboardingStart')?.focus();}
window.EngineOnboarding={settingsHtml,close,
  open(edit=false){if(S.settings.onboarding?.completed&&!edit)return;owner=S.accountId||null;draft=M.draft(S,today());index=0;message='';flow=['age','fitness','goal','maximum'];if(draft.restingMode==='manual')flow.push('resting');flow.push('review');opened=true;render();},
  value(key,value){if(['age','knownMaximum','restingHR'].includes(key))draft[key]=value.trim()===''?null:Number(value);},
  pick(key,value){draft[key]=value;message='';render();document.querySelector('#engineOnboarding [aria-pressed="true"]')?.focus();},
  back(){if(index){index--;message='';render();}},
  next(event){
    event.preventDefault();if(!opened)return;
    if((S.accountId||null)!==owner){close();return;}
    if(flow[index]==='review'){
      const value=M.complete(S,draft,today(),new Date().toISOString());
      if(value.error){message=value.error;render();return;}
      S.settings.fitnessProfile=value.profile;S.settings.liveZones=value.zones;S.settings.onboarding=value.onboarding;
      // A running/paused workout keeps its previously recorded zone snapshot.
      save();close();return;
    }
    message=M.error(flow[index],draft,S,today());if(message){render();return;}
    // A WHOOP baseline may disappear while the dialog is open; request a value.
    if(flow[index]==='maximum'&&EngineZones.restingBaseline(S,today()).resting==null&&!flow.includes('resting')){draft.restingMode='manual';flow.splice(flow.length-1,0,'resting');}
    index++;render();
  }
};
const style=document.createElement('style');style.textContent=`
.engine-onboarding{width:min(440px,calc(100% - 32px));max-height:calc(100dvh - 40px);overflow:auto;padding:24px;border:1px solid var(--oled-line,#282828);border-radius:18px;background:var(--oled-surface,#101010);color:var(--oled-text,#fff);box-sizing:border-box}
.engine-onboarding::backdrop{background:#000c}.engine-onboarding header{display:flex;justify-content:space-between;align-items:center;color:var(--oled-muted);font-size:13px}.engine-onboarding header button{border:0;background:none;color:inherit;font-size:28px;min-width:44px;min-height:44px}
.engine-onboarding h2{font-size:24px;line-height:1.2;margin:20px 0}.engine-onboarding p{font-size:13px;line-height:1.6;color:var(--oled-muted)}.engine-onboarding label{display:block;font-size:14px;margin:20px 0}.engine-onboarding input{display:block;width:100%;box-sizing:border-box;margin-top:10px;padding:14px;border:1px solid var(--oled-line);border-radius:9px;background:#080808;color:inherit;font-size:20px;color-scheme:dark}
.onboarding-choices{display:grid;gap:12px}.onboarding-choices button{display:block;width:100%;text-align:left;padding:16px;border:1px solid var(--oled-line);border-radius:12px;background:#080808;color:inherit}.onboarding-choices button[aria-pressed=true]{border-color:var(--engine);box-shadow:inset 0 0 0 1px var(--engine)}.onboarding-choices b{font-size:15px}.onboarding-choices span{display:block;font-size:13px;line-height:1.5;color:var(--oled-muted);margin-top:8px}
.engine-onboarding footer{display:flex;gap:12px;margin-top:24px}.engine-onboarding footer button{flex:1}.engine-onboarding dl div{display:flex;justify-content:space-between;gap:16px;margin:14px 0;font-size:13px}.engine-onboarding dt{color:var(--oled-muted)}.engine-onboarding dd{margin:0;text-align:right}.onboarding-zone-summary{border-top:1px solid var(--oled-line);padding-top:12px}.onboarding-zone-summary p{display:flex;justify-content:space-between}.onboarding-card button:disabled{opacity:.4;cursor:default}.engine-onboarding button:focus-visible,.engine-onboarding input:focus-visible{outline:2px solid var(--engine);outline-offset:3px}
`;
document.head.append(style);
const baseRender=window.render;window.render=function(){
  document.getElementById('engineOnboarding')?.remove();baseRender();
  if(!opened)return;
  document.body.insertAdjacentHTML('beforeend',dialogHtml());const dialog=document.getElementById('engineOnboarding');
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});dialog.showModal();
  (dialog.querySelector('[autofocus]')||dialog.querySelector('[aria-pressed=true]')||dialog.querySelector('.onboarding-choices button')||dialog.querySelector('button[type=submit]'))?.focus();
};
render();
})();
