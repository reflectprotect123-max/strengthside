/** Athlete seeding adapter for the canonical strength policy and evidence replay. */
(function(root) {
  const VERSION=root.StrengthPolicy.version,RIR=root.TrainingCore.rir,Core=root.StrengthBrainCore,E=root.StrengthEquipment,T=root.StrengthTargets;
  let replayCache=new WeakMap();
  const diagnosticEvents=[];
  function freeze(value){if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
  const clone=x=>JSON.parse(JSON.stringify(x));
  function key(page) {
    // Preserve the historical namespace only for records that predate catalogue metadata.
    return [page.exerciseId||String(page.title||'').trim().toLowerCase().replace(/\s+/g,' '),page.equipmentId||'default',page.loadConvention||'total',page.loadUnit||'kg'].join('|');
  }
  function eligible(page){return Core.supported(page);}
  const equipment=page=>E.profile(page);
  const round=(value,current,page,upCap=.05,downCap=.05)=>E.round(value,current,page,{upCap,downCap});
  function stepUp(kg,page,cap=.1){const n=E.next(kg,page);return n==null?kg:E.round(n,kg,page,{upCap:cap,downCap:cap});}
  function target(page,row,index){let t=null;try{t=T.forRow(page,row,index);}catch{}return t?.purpose==='warmup'?'easy':'average';}
  function next(args){
    const h=history(args.state?.records||{},args.page,args.state?.excludeSession,args.state?.ownerId);
    const state={...(args.state||{}),learning:args.state?.learning||h,rows:args.state?.rows||[]};
    const mode=state.policy?.learningMode??root.StrengthPolicy.learningMode;
    const run=learningMode=>Core.suggest({...args,state:{...state,policy:{...state.policy,learningMode}}});
    const baseline=run('default');
    if(mode!=='online'&&mode!=='shadow')return baseline;
    let candidate;try{candidate=run('online');}catch{return baseline;}
    if(!Number.isFinite(candidate.kg)&&baseline.kg!=null)return baseline;
    if(mode==='online')return candidate;
    let hash=2166136261;for(const c of h.contextKey||'unknown'){hash^=c.charCodeAt(0);hash=Math.imul(hash,16777619);}
    diagnosticEvents.push({contextHash:(hash>>>0).toString(16),model:VERSION,reason:candidate.reason,delta:candidate.kg!=null&&baseline.kg!=null?candidate.kg-baseline.kg:null});
    if(diagnosticEvents.length>64)diagnosticEvents.shift();return baseline;
  }
  const estimate=(row,page)=>Core.estimate(row,page);
  const review=(page,rows)=>Core.review(page,rows);
  function history(records,page,excludeSession,ownerId) {
    ownerId=ownerId??root.StrengthMemory?.ownerId?.()??root.S?.accountId??null;
    const load=Core.normalized(0,page),contextKey=learningContext({athleteId:ownerId,page,load});
    const cacheable=root.StrengthMemory?.isSnapshot?.(records);
    const cacheKey=JSON.stringify([ownerId,contextKey,excludeSession??null,VERSION]);
    let cached=cacheable?replayCache.get(records):null;
    if(cached?.has(cacheKey))return cached.get(cacheKey);
    const fallback={version:'online-v1',k:root.StrengthLearning?.initial().k??.0333/1.0333,rows:[],accepted:0,updates:0,startingScale:null,evidenceFingerprint:'unavailable',conflicted:false,ledger:[],diagnostics:[],evidence:[],latestFirst:null};
    let r=fallback;
    const facts=Object.values(records||{}).filter(record=>{
      const row=record?.payload?.row,section=record?.payload?.page?.section;
      if(row?.skipped)return false;
      return section!=='Warm-Up'&&section!=='Cool-Down';
    });
    try{if(contextKey&&root.StrengthReplay&&root.StrengthContext&&root.StrengthLearning)r=root.StrengthReplay.replay(facts,{ownerId,contextKey,excludeSessionId:excludeSession});}catch{/* Facts remain loggable while the optional learner is unavailable. */}
    const evidence=r.evidence.map(e=>({...e,sessionId:e.observation.sessionId,
      sourceSignature:'source-v3:'+JSON.stringify([e.observation.id,e.observation.revision,e.observation.weight,e.observation.reps,e.observation.rir,e.observation.miss]),
      sourceSetIds:[e.observation.id]}));
    let latest=null;
    // A conflicted fact is skipped; the newest clean session still sets the load.
    if(r.latestFirst){
      const e=r.latestFirst,rows=r.ledger.filter(x=>x.sessionId===e.observation.sessionId&&!x.deleted&&x.payload?.row).map(x=>x.payload.row).sort((a,b)=>a.ordinal-b.ordinal);
      const result=Core.review(e.page,rows);
      const decision=Core.sessionNext(e.page,rows,{partial:!!e.partial});
      const nextKg=decision.nextKg??e.row.kg;result.reason=decision.reason;
      latest={...e,...result,nextKg,rows};
    }
    const freshE1rm=r.startingScale;
    const result={...r,evidence,contextKey,rolling:freshE1rm,freshE1rm,latest,sessions:r.accepted,exposures:r.accepted,
      confidence:r.accepted===0?(latest?.partial?'partial':'unknown'):r.updates>0?'personal':'provisional',modelVersion:VERSION};
    if(cacheable){
      if(!cached){cached=new Map();replayCache.set(records,cached);}
      if(cached.size>=32)cached.delete(cached.keys().next().value);
      cached.set(cacheKey,freeze(result));
    }
    return result;
  }
  function isCarry(page){return /carry|farmer|suitcase/i.test(page.title||'')||(page.columns||[]).includes('meters');}
  // Carries: Easy at full distance adds 2 kg per hand next time; anything else holds.
  function carryHistory(records,page,excludeSession){
    const id=root.StrengthContext?.exerciseKey?.(page);let best=null;
    for(const r of Object.values(records||{})){
      const p=r?.payload,row=p?.row;
      if(!p||r.deleted||r.kind!=='set'||r.sessionId===excludeSession||!row?.logged||row.skipped||row.purpose==='ramp')continue;
      if(root.StrengthContext.exerciseKey(p.page)!==id)continue;
      const t=String(p.sessionStartedAt??p.date??''),o=Number(row.ordinal)||0;
      if(!best||t>best.t||(t===best.t&&o<best.o))best={t,o,row,page:p.page};
    }
    if(!best||finiteKg(best.row.kg)==null)return null;
    const goal=Number(best.page?.prescribed||best.row.cells?.meters),done=Number(best.row.cells?.meters);
    const full=!Number.isFinite(goal)||!(goal>0)||done>=goal;
    const easy=['very_easy','easy'].includes(Core.effortOf(best.row.effort));
    return easy&&full&&!best.row.miss?finiteKg(best.row.kg)+2:finiteKg(best.row.kg);
  }
  function finiteKg(v){const n=Number(v);return v!=null&&v!==''&&Number.isFinite(n)&&n>=0?n:null;}
  function seedCarry(page,log,records,sessionId){
    if(!page.loadUnit)page.loadUnit='kg';
    if(!['dumbbell','kettlebell'].includes(page.equipmentId))page.equipmentId=/kettlebell|\bkb\b/i.test(page.title||'')?'kettlebell':'dumbbell';
    if(/suitcase/i.test(page.title||''))page.loadConvention='single';
    else if(!page.loadConvention||page.loadConvention==='total')page.loadConvention='per_hand';
    const past=carryHistory(records,page,sessionId);
    const starter=past!=null?{kg:past,confidence:'history'}:E.starter(page);
    if(starter.kg==null)return;
    page.workingKg=starter.kg;page.startConfidence=starter.confidence;
    for(const row of log.sets||[])if(row.kg==null||past!=null)row.kg=starter.kg;
  }
  function seed(session,records) {
    const s=clone(session);
    let mainSeen=false;
    for(const outer of s.pages||[])for(const page of outer.members||[outer]) {
      const log=s.logs?.[page.id];
      // Seed per page: blocks added or swapped mid-session get weights; a page that was
      // already seeded (or has ramps/logged sets) is never reseeded.
      const done=page.brainSeeded||page.startConfidence!==undefined||!log||log.sets.some(r=>r.logged||r.purpose==='ramp');
      if(page.exerciseType==='main'||(eligible(page)&&page.startConfidence!==undefined&&!/curl|extension|raise|fly|flye|calf|kickback/i.test(page.title||'')))mainSeen=true;
      if(done)continue;
      if(!eligible(page)){
        if(isCarry(page)){seedCarry(page,log,records,s.id);page.brainSeeded=true;}
        continue;
      }
      let targets=[];try{targets=T.normalize(page);}catch{continue;}
      page.setTargets=targets;
      const h=history(records,page,s.id),first=targets.find(t=>t.purpose==='working'),prior=h.latest;
      let working=null,confidence='unknown';
      const samePrescription=prior&&JSON.stringify(T.normalize(prior.page).map(({id,...t})=>t))===JSON.stringify(targets.map(({id,...t})=>t));
      if(prior&&Number.isFinite(prior.nextKg)){
        // ibex owns the prescription; the brain carries the load, lighter if ibex asks for more reps.
        const mass=Core.normalized(prior.nextKg,prior.page)?.externalKg,here=mass==null?null:Core.display(mass,page);
        const was=T.normalize(prior.page).find(t=>t.purpose==='working')?.reps.min;
        const matched=!samePrescription&&first&&Number.isInteger(was)&&first.reps.min>was&&here!=null?Core.matchLoad(here,was,first.reps.min,page):null;
        working=here==null?null:matched??E.nearest(here,page)??E.floor(here,page);confidence='history';
      } else {const starter=E.starter(page);working=starter.kg;confidence=starter.confidence;}
      page.workingKg=working;page.startConfidence=confidence;
      const accessory=page.exerciseType==='accessory'||/curl|extension|raise|fly|flye|calf|kickback/i.test(page.title||'');
      const main=!accessory&&(page.exerciseType==='main'||/squat|deadlift|bench|overhead|press|row|pull.?up/i.test(page.title||'')||!mainSeen);if(main)mainSeen=true;
      const count=page.rampCount===0?0:main?2:page.rampCount===2?2:0;
      const bar=page.equipmentId==='barbell'||/\bbarbell\b/i.test(page.title||'');
      const known=typeof working==='number'&&Number.isFinite(working)&&working>=0;
      const belowWork=known&&working>0?E.floor(working*.5,page):null;
      const step=E.next(0,page);
      const second=belowWork>0&&belowWork<working?belowWork:step!=null&&step<working?step:0;
      const rampLoad=bar&&known?[0,second]:known&&working>0?E.ramps(working,page):[null,null];
      const ramps=Array.from({length:count},(_,i)=>{const kg=i<rampLoad.length?rampLoad[i]:null;return {id:root.crypto.randomUUID(),targetId:`${page.id}:warmup:${i}`,purpose:'ramp',reps:first?.reps.min??page.targetReps,kg,plannedKg:kg,cells:{},logged:false,miss:false};});
      const authored=log.sets.map((row,i)=>{
        const target=targets[i],reps=Number(target?.reps?.min),from=Number(first?.reps?.min);
        const matched=known&&target?.purpose==='working'&&Number.isInteger(reps)&&Number.isInteger(from)?Core.matchLoad(working,from,reps,page):null;
        const kg=matched!=null?matched:known?working:i===0?working??row.kg:row.kg;
        return {...row,id:row.id||root.crypto.randomUUID(),targetId:row.targetId||target?.id,purpose:target?.purpose||'working',workingIndex:i,kg,plannedKg:kg};
      });
      log.sets=ramps.concat(authored);page.brainSeeded=true;
    }
    s.brainSeeded=true;return s;
  }
  function learningContext({athleteId,page,load}={}) {
    const context=root.StrengthContext,normalized=context?.normalizeLoad(load);
    if(!normalized?.eligible)return null;
    const convention=['barbell_plates','barbell_total'].includes(normalized.convention)?'barbell_total':normalized.convention;
    try{return context.key({athleteId,exerciseId:context.exerciseKey(page),equipmentId:page?.equipmentId,convention,tempo:page?.tempo});}
    catch{return null;}
  }
  root.StrengthBrain={VERSION,RIR,key,learningContext,eligible,equipment,round,stepUp,target,next,estimate,review,history,seed,clearCache(){replayCache=new WeakMap();diagnosticEvents.length=0;},diagnostics:()=>diagnosticEvents.map(e=>({...e}))};
})(typeof window!=='undefined'?window:globalThis);
