/** Synthetic engineering evaluation of actual app boundaries; no clinical accuracy claim. */
import vm from 'node:vm';
import {Worker,isMainThread,parentPort,workerData} from 'node:worker_threads';
import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const fixture=JSON.parse(readFileSync(new URL('../checks/fixtures/strength-learning-cases.json',import.meta.url)));
export const registered={training:fixture.trainingSeeds,evaluation:fixture.evaluationSeeds};
const sources=['training-core','strength-targets','strength-equipment','strength-rts','strength-policy','strength-load','strength-context','strength-learning','strength-replay','strength-brain-core','strength-brain','strength-memory','session'].map(n=>[n,readFileSync(new URL('../apps/athlete/'+n+'.js',import.meta.url),'utf8')]);
const digest=x=>createHash('sha256').update(x).digest('hex');
function rng(seed){let x=seed>>>0;return()=>((x=(Math.imul(1664525,x)+1013904223)>>>0)/4294967296);}
const mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;
export function runtime(seed=1,mode='default'){
 let id=seed*10000;const store=new Map();
 const ctx=vm.createContext({crypto:{randomUUID:()=>`00000000-0000-4000-8000-${(++id).toString(16).padStart(12,'0')}`},console,setTimeout:()=>1,clearTimeout(){},addEventListener(){},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)}});
 for(const [n,s] of sources)vm.runInContext(s,ctx,{filename:n+'.js'});
 ctx.StrengthPolicy={...ctx.StrengthPolicy,learningMode:mode};ctx.StrengthMemory.bind('sim-athlete');return {ctx,store};
}
export function runScenario({seed=912731,policy='default',scenario='cold-start',sessions=32,athlete=0}={}){
 const config=fixture.scenarios[scenario];if(!config)throw Error('Unknown scenario');
 const random=rng(seed+athlete*997),{ctx}=runtime(seed+athlete,policy),B=ctx.StrengthBrain,C=ctx.StrengthBrainCore,M=ctx.StrengthMemory,H=ctx.HybridSession,E=ctx.StrengthEquipment;
 // Truth remains in this test driver, never in a page, record or policy argument.
 const trueK=.015+random()*.045,base=config.dumbbell?18+random()*35:65+random()*110;
 const truthSchedule=[],decisions=[],metrics={sets:0,hits:0,misses:0,error:0,invalid:0,equipmentViolations:0,excessiveJumps:0,actualMutations:0,wrongReferences:0,accepted:0,updates:0,firstUpdate:null};
 for(let session=0;session<sessions;session++){
  const nums=config.highReps?[20,25,20]:config.range?[6,6,6]:session%2?[5,3,1]:[10,8,6];
  const tempo=config.alternateTempo?(session%2?'33X1':'20X1'):'20X1';
  const targets=nums.map((n,i)=>({id:`A:set:${i}`,purpose:'working',reps:{min:n,max:config.range?8:n},loadRule:{kind:'adaptive'},toFailure:false}));
  targets.push({id:'A:set:3',purpose:'amrap',reps:null,loadRule:{kind:'first_working_set'},toFailure:false});
  const p={kind:'lift',letter:'A',title:config.dumbbell?'Dumbbell Bench Press':'Back Squat',exerciseId:'test-lift',equipmentId:config.dumbbell?'dumbbell':'barbell',loadConvention:config.dumbbell?'per_hand':'total',loadUnit:'kg',minimumKg:config.dumbbell?1:(config.barKg||20),barWeightKg:config.dumbbell?undefined:(config.barKg||20),equipmentStepKg:config.dumbbell?undefined:2.5,columns:['reps','weight_kg'],tempo,setCount:4,setTargets:targets};
  let s=B.seed(H.startSession({date:'2026-10-16',plan:{blocks:[p]},letter:'A'}),M.records());s.startedAt=session*86400000+1000;s.id=`10000000-0000-4000-8000-${session.toString(16).padStart(12,'0')}`;
  const page=s.pages[0];let rows=s.logs.A.sets;
  const day=base*(1+session*.001)*(1+(random()-.5)*.035)*(config.alternateTempo&&session%2?.88:1)*(config.layoff&&session>=16?.9:1);
  // Draw feedback before any policy-dependent skipped AMRAP. Both policies
  // must receive the same exogenous noise on subsequent sets and days.
  const feedbackNoise=Array.from({length:rows.length},()=>config.noise?Math.round((random()-.5)*config.noise*2):0);
  truthSchedule.push([day,feedbackNoise]);
  for(let i=0;i<rows.length;i++){
   let row=rows[i],kg=row.kg;
   if(config.manual&&session===1&&row.purpose==='working'&&row.workingIndex===0)kg=config.manual;
   if(row.purpose==='amrap'){
    const ref=rows.find(r=>r.purpose==='working');if(kg!==(!ref.miss?ref.kg:null))metrics.wrongReferences++;
    if(kg==null)continue;
   }
   const mass=C.normalized(kg,page)?.externalKg;
   if(!Number.isFinite(mass)||mass<=0){metrics.invalid++;continue;}
   const reps=row.purpose==='ramp'?(row.reps||5):row.purpose==='amrap'?1:page.setTargets.find(t=>t.id===row.targetId).reps.min;
   const fatigue=1-(i<2?0:(i-2)*(config.shortRest?.045:.015));
   const capacity=day*fatigue;
   // Use independent bounded power/rational perturbations across athletes.
   const exponent=athlete%3===1?1.06:athlete%3===2?.96:1;
   const max=Math.max(0,Math.floor(1+((capacity/mass)**(1/exponent)-1)/trueK));
   const actual=row.purpose==='amrap'?max:Math.min(reps,max),rir=max-actual;
   const perceived=rir+(config.bias||0)+feedbackNoise[i];
   const effort=row.purpose==='amrap'?'max_effort':perceived>=7?'very_easy':perceived>=5?'easy':perceived>=3?'average':perceived>=1?'hard':'max_effort';
   if(row.purpose==='working'){
    metrics.sets++;metrics.hits+=rir>=2&&rir<=4?1:0;metrics.misses+=actual<reps?1:0;
    const ideal=capacity/(1+trueK*(reps+3-1))**exponent;metrics.error+=Math.abs(mass-ideal)/ideal;
   }
   const hist=B.history(M.records(),page,s.id),before=JSON.stringify(rows.filter(r=>r.logged));
   decisions.push({session,targetId:row.targetId,purpose:row.purpose,displayKg:kg,physicalKg:mass,context:hist.contextKey,fingerprint:digest(hist.evidenceFingerprint),model:hist.modelVersion,k:hist.k,reason:row.loadDecision?.reason||'seed',eligible:hist.accepted});
   s=H.logSet(s,i,{kg,reps:actual,effort,miss:actual<reps});rows=s.logs.A.sets;
   if(JSON.stringify(rows.slice(0,i).filter(r=>r.logged))!==before)metrics.actualMutations++;
   if(i+1<rows.length){
    const next=rows[i+1],planned=next.kg,decision=B.next({page,row:rows[i],nextRow:next,index:i+1,state:{rows,records:M.records(),excludeSession:s.id,policy:{...ctx.StrengthPolicy,learningMode:policy}}});
    next.kg=decision.kg;next.loadDecision=decision;
    if(decision.kg!=null&&next.purpose!=='amrap'){
     const profile=E.profile(page),hold=Math.abs(decision.kg-kg)<1e-8;
     if(!hold&&Math.abs((E.floor(decision.kg,page)??NaN)-decision.kg)>1e-8)metrics.equipmentViolations++;
     if(rows[i].purpose==='working'&&decision.kg>kg){
      const source=C.normalized(kg,page).externalKg,out=C.normalized(decision.kg,page).externalKg;
      const changing=rows[i].reps!==page.setTargets.find(t=>t.id===next.targetId)?.reps?.min;
      const minimum=C.normalized(profile.min,page).externalKg;
      const escape=Math.abs(source-minimum)<1e-8&&decision.kg===E.next(kg,page);
      const rung=E.next(planned??kg,page);
      if(!escape&&(out>source*(changing?1.1:1.05)+1e-8||rung!=null&&decision.kg>rung+1e-8))metrics.excessiveJumps++;
     }
    }
   }
   M.capture(s);
  }
  s=H.finishToSummary(s);M.capture(s);const state=M.replay(B.key(page),page);
  metrics.accepted=state.accepted;metrics.updates=state.updates;if(state.updates&&metrics.firstUpdate==null)metrics.firstUpdate=session+1;
 }
 metrics.exogenousFingerprint=digest(JSON.stringify(truthSchedule));
 metrics.targetHit=metrics.hits/(metrics.sets||1);metrics.missRate=metrics.misses/(metrics.sets||1);metrics.meanLoadError=metrics.error/(metrics.sets||1);
 return {seed,policy,scenario,athlete,decisions,metrics};
}
export function bootstrap(values,resamples=10000){
 if(!values.length)return {mean:null,low:null,high:null};
 const random=rng(772091),samples=[];
 for(let b=0;b<resamples;b++){let sum=0;for(let i=0;i<values.length;i++)sum+=values[Math.floor(random()*values.length)];samples.push(sum/values.length);}
 samples.sort((a,b)=>a-b);return {mean:mean(values),low:samples[Math.floor(resamples*.025)],high:samples[Math.floor(resamples*.975)]};
}
export function summarizePairs(rows){
 const clusters=new Map();
 for(const row of rows){const key=JSON.stringify([row.seed,row.athlete]);const bucket=clusters.get(key)||[];bucket.push(row);clusters.set(key,bucket);}
 const independent=[...clusters.values()],fitted=rows.filter(r=>r.candidate.firstUpdate!=null);
 return {athletes:independent.length,scenarioPairs:rows.length,sets:rows.reduce((s,r)=>s+r.candidate.sets,0),
  targetHitDifference:bootstrap(independent.map(bucket=>mean(bucket.map(r=>r.candidate.targetHit-r.baseline.targetHit)))),
  missRateDifference:bootstrap(independent.map(bucket=>mean(bucket.map(r=>r.candidate.missRate-r.baseline.missRate)))),
  baselineTargetHit:mean(rows.map(r=>r.baseline.targetHit)),onlineTargetHit:mean(rows.map(r=>r.candidate.targetHit)),
  baselineMiss:mean(rows.map(r=>r.baseline.missRate)),onlineMiss:mean(rows.map(r=>r.candidate.missRate)),
  onlineFirstUpdate:fitted.length?mean(fitted.map(r=>r.candidate.firstUpdate)):null,neverFitted:rows.length-fitted.length};
}
export function summarizeReport(report){
 const results=report.results,overall=summarizePairs(results),groups=Object.fromEntries([...new Set(results.map(r=>r.scenario))].map(g=>[g,summarizePairs(results.filter(r=>r.scenario===g))]));
 const keys=['invalid','actualMutations','wrongReferences','equipmentViolations','excessiveJumps'];
 const violations=results.reduce((n,r)=>n+keys.reduce((s,k)=>s+r.candidate[k]+r.baseline[k],0),0);
 const pass=violations===0&&overall.targetHitDifference.mean>=0&&overall.targetHitDifference.low>-.01&&overall.missRateDifference.high<=.005&&Object.values(groups).every(g=>g.targetHitDifference.low>-.03&&g.missRateDifference.high<=.01);
 return {...report,overall,groups,violations,bootstrapUnit:'seed + athlete, with all repeated scenarios kept together',analysisSha256:digest(readFileSync(fileURLToPath(import.meta.url))),gate:{pass,shippingMode:'default',candidateMode:'shadow-only pending staging and outcome gates'}};
}
export async function evaluate({athletesPerSeed=6,sessions=32,scenarios=['cold-start','alternating-tempo-10-8-6','noisy-feedback','coarse-equipment','short-rest','recovery-drift']}={}){
 const tasks=[];
 for(const scenario of scenarios)for(const seed of registered.evaluation)for(let athlete=0;athlete<athletesPerSeed;athlete++){
  tasks.push({seed,scenario,athlete,sessions,index:tasks.length});
 }
 const batches=Array.from({length:4},(_,i)=>tasks.filter((_,j)=>j%4===i));
 const results=(await Promise.all(batches.map(batch=>new Promise((resolve,reject)=>{
  const w=new Worker(new URL(import.meta.url),{workerData:{batch}});let received=false;
  w.once('message',rows=>{received=true;resolve(rows);});w.once('error',reject);w.once('exit',code=>{if(code!==0||!received)reject(Error('Simulation worker failed: '+code));});
 })))).flat().sort((a,b)=>a.index-b.index).map(({index,...r})=>r);
 return summarizeReport({schemaVersion:1,fixtureSha256:digest(JSON.stringify(fixture)),sourceSha256:Object.fromEntries(sources.map(([n,s])=>[n,digest(s)])),registered,sealedEvaluation:true,athletesPerSeed,sessions,protocol:'cold acquisition through actual session/seed/capture/next/replay; paired athlete-cluster 10000-resample bootstrap',limitations:['Scores all ordinary working sets including the first; the old prototype excluded the first.','Synthetic truth only; no native R/Dart execution.','The 66.62% established-history prototype uses a different protocol and is not numerically comparable.','No real prospective effort outcomes supplied; no clinical or real-athlete superiority claim.','Rest effects are hidden simulator fatigue only; no rest weight correction is enabled.'],results});
}
if(!isMainThread){
 const results=[];
 for(const {index,sessions,...input} of workerData.batch){
  results.push({index,...input,baseline:runScenario({...input,sessions,policy:'default'}).metrics,candidate:runScenario({...input,sessions,policy:'online'}).metrics});
  // Let completed native-restore promises settle between independent VM runs.
  await new Promise(resolve=>setImmediate(resolve));
 }
 parentPort.postMessage(results);
}
if(isMainThread&&process.argv[1]===fileURLToPath(import.meta.url)&&process.argv.includes('--check-report')){
 const report=JSON.parse(readFileSync(new URL('../docs/research/strength-online-learning/production-results.json',import.meta.url),'utf8'));
 for(const [name,source] of sources)if(report.sourceSha256?.[name]!==digest(source))throw Error('Stale production evaluation: '+name);
 if(report.analysisSha256!==digest(readFileSync(fileURLToPath(import.meta.url)))||report.fixtureSha256!==digest(JSON.stringify(fixture))||JSON.stringify(report.registered)!==JSON.stringify(registered)||report.violations!==0||report.gate.shippingMode!=='default'||!report.bootstrapUnit)throw Error('Invalid production evaluation evidence');
 console.log('Production evaluation source hashes, registered seeds, clustered analysis and conservative rollout verified.');
}
if(isMainThread&&process.argv[1]===fileURLToPath(import.meta.url)&&!process.argv.includes('--check-report')){
 const dir=new URL('../docs/research/strength-online-learning/',import.meta.url);
 let report;
 if(process.argv.includes('--repair-noisy-pairing')){
  const saved=JSON.parse(readFileSync(new URL('production-results.json',dir),'utf8'));
  const repaired=await evaluate({athletesPerSeed:saved.athletesPerSeed,sessions:saved.sessions,scenarios:['noisy-feedback']});
  const replacements=new Map(repaired.results.map(r=>[JSON.stringify([r.seed,r.athlete]),r]));
  report=summarizeReport({...saved,fixtureSha256:saved.fixtureSha256??digest(JSON.stringify(fixture)),results:saved.results.map(r=>r.scenario==='noisy-feedback'?replacements.get(JSON.stringify([r.seed,r.athlete])):r),pairingCorrection:'Noisy feedback re-evaluated with a fixed per-session draw schedule before inspecting outcomes. Other scenarios draw no per-set noise and their trajectories are unchanged.'});
 }else report=process.argv.includes('--summarize-existing')?summarizeReport(JSON.parse(readFileSync(new URL('production-results.json',dir),'utf8'))):await evaluate();
 writeFileSync(new URL('production-results.json',dir),JSON.stringify(report,null,2)+'\n');
 writeFileSync(new URL('production-evaluation.md',dir),`# Production-path synthetic evaluation\n\n${report.protocol}. Evaluation seeds were registered before implementation and were not tuned.\n\nIndependent paired athletes: ${report.overall.athletes}; repeated scenario pairs: ${report.overall.scenarioPairs}; ordinary sets per policy: ${report.overall.sets}. Software invariant violations: ${report.violations}.\n\n|Metric|Default|Online|Paired difference (95% CI)|\n|---|---|---|---|\n|Target hit|${report.overall.baselineTargetHit}|${report.overall.onlineTargetHit}|${JSON.stringify(report.overall.targetHitDifference)}|\n|Miss|${report.overall.baselineMiss}|${report.overall.onlineMiss}|${JSON.stringify(report.overall.missRateDifference)}|\n\nStatistical gate: **${report.gate.pass?'PASS':'FAIL'}**. Shipping policy stays default. No release is authorized by these simulations.\n\n${report.limitations.map(s=>'- '+s).join('\n')}\n\nSee adjacent JSON for subgroup denominators, seed/athlete pairs, acquisition delays, load errors and all invariants.\n`);
 console.log(JSON.stringify({overall:report.overall,violations:report.violations,gate:report.gate}));
}
