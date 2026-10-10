import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {createHash} from 'node:crypto';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const sandbox={};
for(const name of ['training-core','strength-targets','strength-equipment','strength-rts','strength-policy','strength-brain-core'])
  vm.runInNewContext(readFileSync(join(ROOT,'apps/shared',`${name}.js`),'utf8'),{window:sandbox});
const B=sandbox.StrengthBrainCore,E=sandbox.StrengthEquipment,RTS=sandbox.StrengthRTS;

export const BASELINE={version:'strength-v2-conservative',upCap:.05,warmupUpCap:.10,downCap:.10,observationBlend:.15,learningBlend:.10};
export const CANDIDATES=[
  BASELINE,
  {...BASELINE,version:'strength-v2-u10-b15',upCap:.10},
  {...BASELINE,version:'strength-v2-u10-b25',upCap:.10,observationBlend:.25},
  {...BASELINE,version:'strength-v2-u15-b25-l20',upCap:.15,warmupUpCap:.15,observationBlend:.25,learningBlend:.20}
];
const COHORTS={
  db_beginner:{equipmentId:'dumbbell',loadConvention:'per_hand',loadUnit:'kg',exercise:'Dumbbell Bench Press',min1rm:14,max1rm:42,endurance:.031,stepFatigue:.025},
  db_trained:{equipmentId:'dumbbell',loadConvention:'per_hand',loadUnit:'kg',exercise:'DB Row',min1rm:28,max1rm:70,endurance:.027,stepFatigue:.03},
  bar_trained:{equipmentId:'barbell',loadConvention:'total',loadUnit:'kg',minimumKg:20,equipmentStepKg:2.5,exercise:'Back Squat',min1rm:70,max1rm:210,endurance:.029,stepFatigue:.035},
  machine_coarse:{equipmentId:'machine',loadConvention:'total',loadUnit:'kg',availableLoads:[10,20,30,40,50,60,70,80,90,100,120,140,160,180,200],exercise:'Leg Press',min1rm:60,max1rm:220,endurance:.025,stepFatigue:.02}
};
const PROGRAMS=[[10,8,6],[5,3,1],[{min:6,max:8},{min:6,max:8},{min:6,max:8}],[20,25]];
function rng(seed){let x=seed>>>0;return()=>((x=(1664525*x+1013904223)>>>0)/4294967296);}
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const avg=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:0;
function normal(random){return (random()+random()+random()+random()+random()+random()-3)/3;}
function targetList(id,program,withAmrap){
  const out=program.map((r,i)=>({id:`${id}:set:${i}`,purpose:'working',reps:typeof r==='number'?{min:r,max:r}:r,loadRule:{kind:'adaptive'},toFailure:false}));
  if(withAmrap)out.push({id:`${id}:set:${out.length}`,purpose:'amrap',reps:null,loadRule:{kind:'first_working_set'},toFailure:false});
  return out;
}
function pageFor(cohort,program,withAmrap){
  const id=`${cohort.exercise.toLowerCase().replace(/\W+/g,'-')}-${program.map(x=>typeof x==='number'?x:x.min+'-'+x.max).join('-')}`;
  return {id,title:cohort.exercise,kind:'lift',logMode:'kg',columns:['reps','weight_kg'],...cohort,setTargets:targetList(id,program,withAmrap)};
}
function startingLoad(page,fresh1rm){
  const first=page.setTargets[0].reps.min,pct=1/(1+first*.033),raw=fresh1rm*pct*.72;
  return E.floor(raw,page)??E.starter(page).kg??(E.profile(page).min||null);
}
function performance({load,capacity,target,cohort,fatigue,rirBias,noise,model}){
  const effective=capacity*(1-fatigue),ratio=load/effective;
  const predicted=model==='brzycki'?37-36*ratio:(1/Math.max(ratio,.01)-1)/(model==='epley'?.033:cohort.endurance);
  const maxReps=Math.max(0,Math.floor(predicted));
  const prescribed=target.reps.min,actual=Math.min(target.reps.max,Math.max(0,maxReps));
  const reserve=maxReps-actual+rirBias+noise;
  const effort=reserve>=7?'very_easy':reserve>=5?'easy':reserve>=3?'average':reserve>=1?'hard':'max_effort';
  return {actual,effort,miss:actual<prescribed,maxReps};
}
function stratum(cohortName,cohort,policy,seed,exposures){
  const random=rng(seed+cohortName.length*997);
  const athletes=36,metrics={sets:0,misses:0,underloaded:0,invalid:0,capViolations:0,equipmentViolations:0,actualMutations:0,wrongReferences:0,duplicateLearning:0,accountLeaks:0};
  const endErrors=[];
  for(let a=0;a<athletes;a++){
    const base=cohort.min1rm+(cohort.max1rm-cohort.min1rm)*random();
    const rirBias=Math.round(normal(random)*2),growth=random()<.2?0:(.0005+random()*.002),model=['epley','brzycki','perturbed'][a%3];
    let memory={};const prescriptionLoads=new Map();
    for(let exposure=0;exposure<exposures;exposure++){
      const program=PROGRAMS[exposure%PROGRAMS.length],withAmrap=exposure%5===4,page=pageFor(cohort,program,withAmrap);
      const day=base*(1+growth*exposure)*(1+normal(random)*.035);
      const signature=page.setTargets.filter(x=>x.purpose==='working').map(x=>`${x.reps.min}-${x.reps.max}`).join('/');
      let load=prescriptionLoads.get(signature);
      if(load==null&&memory.freshE1rm&&RTS.percent(page.setTargets[0].reps.min,7))load=E.floor(memory.freshE1rm*RTS.percent(page.setTargets[0].reps.min,7),page);
      load=load??startingLoad(page,day);if(!Number.isFinite(load)||load<0){metrics.invalid++;continue;}
      const restStress=exposure%7===3?.025:0,supersetStress=exposure%11===6?.02:0;
      const rows=[];
      // Two warmups affect simulated fatigue, while production does not convert rest into e1RM.
      let fatigue=.012+.012+restStress+supersetStress;
      for(let i=0;i<page.setTargets.length;i++){
        const target=page.setTargets[i];
        if(target.purpose==='amrap'){
          const referenced=rows[0]?.logged&&!rows[0]?.miss?rows[0].kg:null,before=rows[0]?.kg;
          const result=B.suggest({page,row:rows.at(-1),nextRow:{targetId:target.id,purpose:'amrap'},index:i,state:{rows,policy}});
          if(result.kg!==referenced)metrics.wrongReferences++;
          if(rows[0]?.kg!==before)metrics.actualMutations++;
          if(result.kg!=null){const max=Math.max(0,Math.floor((day*(1-fatigue)/result.kg-1)/cohort.endurance));rows.push({id:`${seed}-${a}-${exposure}-amrap`,targetId:target.id,purpose:'amrap',logged:true,reps:max,kg:result.kg,effort:'max_effort'});}
          continue;
        }
        const ideal=day*(1-fatigue)/(1+target.reps.min*cohort.endurance)*.94;
        if(load<ideal*.90)metrics.underloaded++;
        const outcome=performance({load,capacity:day,target,cohort,fatigue,rirBias,noise:Math.round(normal(random)),model});
        const row={id:`${seed}-${a}-${exposure}-${i}`,targetId:target.id,purpose:'working',logged:true,reps:outcome.actual,kg:load,effort:outcome.effort,miss:outcome.miss};
        rows.push(row);metrics.sets++;if(outcome.miss)metrics.misses++;
        if(i<page.setTargets.filter(x=>x.purpose==='working').length-1){
          const next=page.setTargets[i+1],decision=B.suggest({page,row,nextRow:{targetId:next.id,purpose:next.purpose},index:i+1,state:{freshE1rm:memory.freshE1rm,rows,policy}});
          if(!Number.isFinite(decision.kg)||decision.kg<0)metrics.invalid++;
          const p=E.profile(page);if(p.loads.length&&p.step===0&&!p.loads.includes(decision.kg))metrics.equipmentViolations++;
          if(decision.kg>load*(1+policy.upCap)+1e-8)metrics.capViolations++;
          load=decision.kg??load;
        }
        fatigue+=cohort.stepFatigue;
      }
      const first=rows.find(r=>r.purpose==='working'),estimate=B.estimate(first,page),sourceSignature=first?`${first.id}:${first.reps}:${first.kg}:${first.effort}`:null;
      const once=B.learn(memory,{estimate,sourceSignature,learningBlend:policy.learningBlend,modelVersion:policy.version});
      const twice=B.learn(once,{estimate,sourceSignature,learningBlend:policy.learningBlend,modelVersion:policy.version});
      if(twice.exposures!==once.exposures)metrics.duplicateLearning++;
      memory=once;
      const review=B.review(page,rows);if(review.nextKg!=null)prescriptionLoads.set(signature,review.nextKg);
    }
    if(memory.freshE1rm)endErrors.push(Math.abs(memory.freshE1rm-base*(1+growth*(exposures-1)))/(base*(1+growth*(exposures-1))));
  }
  return {...metrics,athletes,missRate:metrics.sets?metrics.misses/metrics.sets:0,underloadRate:metrics.sets?metrics.underloaded/metrics.sets:0,meanEndError:avg(endErrors)};
}
export function simulate({seed=1101,exposures=12,policy=BASELINE,cohort='all'}={}){
  const names=cohort==='all'?Object.keys(COHORTS):[cohort],strata={};
  for(const name of names)strata[name]=stratum(name,COHORTS[name],policy,seed,exposures);
  const values=Object.values(strata),sets=values.reduce((s,x)=>s+x.sets,0);
  const sum=k=>values.reduce((s,x)=>s+x[k],0);
  return {seed,exposures,policyVersion:policy.version,strata,aggregate:{athletes:sum('athletes'),sets,misses:sum('misses'),underloaded:sum('underloaded'),missRate:sets?sum('misses')/sets:0,underloadRate:sets?sum('underloaded')/sets:0,meanEndError:avg(values.map(x=>x.meanEndError)),invariants:{invalid:sum('invalid'),capViolations:sum('capViolations'),equipmentViolations:sum('equipmentViolations'),actualMutations:sum('actualMutations'),wrongReferences:sum('wrongReferences'),duplicateLearning:sum('duplicateLearning'),accountLeaks:sum('accountLeaks')}}};
}
export function gate(baseline,candidate){
  const reasons=[];
  const baseStrata=baseline.strata||{all:baseline},candidateStrata=candidate.strata||{all:candidate};
  for(const [name,b] of Object.entries(baseStrata)){
    const c=candidateStrata[name];if(!c||c.missRate>b.missRate+.01+1e-12)reasons.push(`${name}:miss_rate`);
  }
  const bAgg=baseline.aggregate||baseline,cAgg=candidate.aggregate||candidate;
  if(cAgg.underloadRate>bAgg.underloadRate+1e-12)reasons.push('aggregate:underloading');
  if(Object.values(cAgg.invariants||{}).some(Number))reasons.push('software_invariant');
  return {pass:reasons.length===0,reasons};
}
export function selectPolicy(tuningReports){
  const baseline=tuningReports.find(x=>x.policyVersion===BASELINE.version);if(!baseline)throw new Error('baseline report required');
  const eligible=tuningReports.map(report=>({report,result:gate(baseline,report)})).filter(x=>x.result.pass);
  eligible.sort((a,b)=>a.report.aggregate.underloadRate-b.report.aggregate.underloadRate||a.report.aggregate.missRate-b.report.aggregate.missRate||CANDIDATES.findIndex(x=>x.version===a.report.policyVersion)-CANDIDATES.findIndex(x=>x.version===b.report.policyVersion));
  return CANDIDATES.find(x=>x.version===eligible[0]?.report.policyVersion)||BASELINE;
}
function combine(reports){
  const strata={};for(const report of reports)for(const [name,value] of Object.entries(report.strata)){
    const x=strata[name]||{athletes:0,sets:0,misses:0,underloaded:0,invalid:0,capViolations:0,equipmentViolations:0,actualMutations:0,wrongReferences:0,duplicateLearning:0,accountLeaks:0,end:[]};
    for(const k of ['athletes','sets','misses','underloaded','invalid','capViolations','equipmentViolations','actualMutations','wrongReferences','duplicateLearning','accountLeaks'])x[k]+=value[k];x.end.push(value.meanEndError);strata[name]=x;
  }
  for(const x of Object.values(strata)){x.missRate=x.misses/x.sets;x.underloadRate=x.underloaded/x.sets;x.meanEndError=avg(x.end);delete x.end;}
  const vals=Object.values(strata),sets=vals.reduce((s,x)=>s+x.sets,0),sum=k=>vals.reduce((s,x)=>s+x[k],0);
  return {policyVersion:reports[0].policyVersion,seeds:reports.map(x=>x.seed),strata,aggregate:{athletes:sum('athletes'),sets,misses:sum('misses'),underloaded:sum('underloaded'),missRate:sum('misses')/sets,underloadRate:sum('underloaded')/sets,meanEndError:avg(vals.map(x=>x.meanEndError)),invariants:{invalid:sum('invalid'),capViolations:sum('capViolations'),equipmentViolations:sum('equipmentViolations'),actualMutations:sum('actualMutations'),wrongReferences:sum('wrongReferences'),duplicateLearning:sum('duplicateLearning'),accountLeaks:sum('accountLeaks')}}};
}
export function runMatrix(){
  const tuneSeeds=[1101,1102,1103,1104],holdoutSeeds=[2201,2202,2203,2204];
  const tuning=CANDIDATES.map(policy=>combine(tuneSeeds.map(seed=>simulate({seed,exposures:12,policy}))));
  const selected=selectPolicy(tuning);
  const holdoutBase=combine(holdoutSeeds.map(seed=>simulate({seed,exposures:50,policy:BASELINE})));
  const holdoutCandidate=combine(holdoutSeeds.map(seed=>simulate({seed,exposures:50,policy:selected})));
  const holdoutGate=gate(holdoutBase,holdoutCandidate),frozen=holdoutGate.pass?selected:BASELINE;
  const policyHash=createHash('sha256').update(JSON.stringify(frozen)).digest('hex');
  return {schemaVersion:1,assumptions:{capacityModels:['Epley inverse','Brzycki inverse','.025-.031 perturbed endurance'],effortBias:'integer -2..2 RIR plus noise',dayVariation:'approximately 3.5%',warmups:2,restAndSupersetFatigue:'0..4.5%',programs:['10/8/6','5/3/1','3x6-8','20/25','periodic final AMRAP'],exposures:[12,50]},tuneSeeds,holdoutSeeds,tuning,selectedBeforeHoldout:selected,holdout:{baseline:holdoutBase,candidate:holdoutCandidate,gate:holdoutGate},frozenPolicy:frozen,frozenPolicyHash:policyHash,rejectedAfterHoldout:holdoutGate.pass?null:selected.version};
}
function markdown(report){
  const h=report.holdout;return `# Strength brain v2 simulation\n\nThis is synthetic product testing, not clinical safety or proof of real-athlete accuracy. Candidate selection used tuning seeds only. Holdout failure falls back to the conservative policy without retuning.\n\n- Selected on tuning: ${report.selectedBeforeHoldout.version}\n- Holdout gate: ${h.gate.pass?'PASS':'FAIL'}${h.gate.reasons.length?` (${h.gate.reasons.join(', ')})`:''}\n- Frozen policy: ${report.frozenPolicy.version}\n- Frozen parameter SHA-256: ${report.frozenPolicyHash}\n- Holdout sets: ${h.candidate.aggregate.sets}\n- Baseline miss rate: ${(h.baseline.aggregate.missRate*100).toFixed(2)}%\n- Candidate miss rate: ${(h.candidate.aggregate.missRate*100).toFixed(2)}%\n- Baseline underloading: ${(h.baseline.aggregate.underloadRate*100).toFixed(2)}%\n- Candidate underloading: ${(h.candidate.aggregate.underloadRate*100).toFixed(2)}%\n- Software invariant violations: ${Object.values(h.candidate.aggregate.invariants).reduce((a,b)=>a+b,0)}\n\nThe aggressive tuning winner was rejected because it increased holdout underloading. The app therefore keeps the conservative policy. Assumptions and per-stratum denominators are recorded in the adjacent JSON. Real athlete observations are still required.\n`;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
  const arg=process.argv.indexOf('--report-dir'),dir=resolve(arg>=0?process.argv[arg+1]:join(ROOT,'docs/research'));
  mkdirSync(dir,{recursive:true});const report=runMatrix();
  writeFileSync(join(dir,'strength-brain-v2-simulation.json'),JSON.stringify(report,null,2)+'\n');
  writeFileSync(join(dir,'strength-brain-v2-simulation.md'),markdown(report));
  console.log(`frozen=${report.frozenPolicy.version} holdout=${report.holdout.gate.pass?'PASS':'FAIL'} sets=${report.holdout.candidate.aggregate.sets}`);
}
