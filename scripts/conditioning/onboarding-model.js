/* STRENGTHSIDE-DESIGNED: explicit fitness setup, independent of daily recovery.
 * Age estimates use Tanaka (2001); fitness/goal are stored without invented
 * zone offsets or automatic weekly progression. */
(function(){
const VERSION='fitness-onboarding-v1';
const FITNESS=['low','moderate','high'],GOALS=['maintain','improve'];
function estimatedMaximum(age){return Number.isInteger(age)&&age>=18&&age<=100?Math.round(208-.7*age):null;}
function draft(state,date){
  const p=state.settings.fitnessProfile||{},z=state.settings.liveZones||{};
  const observed=EngineZones.restingBaseline(state,date);
  return {age:p.age??null,fitness:p.cardioFitness??null,goal:p.goal??null,
    maximumMode:z.maxSource==='age-estimated'||!z.max?'estimated':'known',knownMaximum:z.max??null,
    restingMode:observed.resting==null||z.restingMode==='manual'?'manual':'whoop',restingHR:z.resting??null};
}
function error(step,d,state,date){
  if(step==='age'&&estimatedMaximum(d.age)==null)return 'Enter your age, from 18 to 100.';
  if(step==='fitness'&&!FITNESS.includes(d.fitness))return 'Choose your current cardio fitness.';
  if(step==='goal'&&!GOALS.includes(d.goal))return 'Choose your cardio goal.';
  if(step==='maximum'&&(!['estimated','known'].includes(d.maximumMode)||(d.maximumMode==='known'&&(!Number.isInteger(d.knownMaximum)||d.knownMaximum<1||d.knownMaximum>300))))return 'Enter your known maximum heart rate, or choose an age estimate.';
  if(step==='resting'){
    if(!['whoop','manual'].includes(d.restingMode))return 'Choose WHOOP or enter your resting heart rate.';
    const r=d.restingMode==='whoop'?EngineZones.restingBaseline(state,date).resting:d.restingHR;
    if(typeof r!=='number'||!Number.isFinite(r)||r<=0||r>=300)return 'Enter your resting heart rate or use available WHOOP data.';
  }
  return '';
}
function result(d,state,date){
  for(const step of ['age','fitness','goal','maximum','resting']){const message=error(step,d,state,date);if(message)return {error:message};}
  const max=d.maximumMode==='known'?d.knownMaximum:estimatedMaximum(d.age);
  const zones=EngineZones.settings(max,d.restingMode==='manual'?d.restingHR:null,state,date);
  if(!zones)return {error:'Maximum HR must be higher than resting HR. Check both answers.'};
  zones.maxSource=d.maximumMode==='known'?'entered':'age-estimated';
  if(d.maximumMode==='estimated')zones.maxEstimate={age:d.age,equation:'208 - 0.7 × age',unrounded:208-.7*d.age,version:'tanaka-2001'};
  const profile={version:VERSION,age:d.age,cardioFitness:d.fitness,goal:d.goal,
    maximumMode:d.maximumMode,maxHR:max,maximumSource:zones.maxSource,
    restingMode:d.restingMode,restingHR:d.restingMode==='manual'?d.restingHR:null,
    evidenceLabel:'STRENGTHSIDE-DESIGNED'};
  return {profile,zones,baseline:EngineZones.profile({settings:{liveZones:zones},whoopHistory:state.whoopHistory,checkin:state.checkin},date)};
}
function complete(state,d,date,now){
  const value=result(d,state,date);if(value.error)return value;
  return {...value,onboarding:{version:VERSION,completed:true,
    completedAt:state.settings.onboarding?.completedAt||now,updatedAt:now}};
}
window.EngineOnboardingModel={VERSION,estimatedMaximum,draft,error,result,complete};
})();
