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
  function target(page,row,index){
    let t=null;try{t=T.forRow(page,row,index);}catch{}
    if(t?.effort)return t.effort;
    if(t?.rpe!=null) {
      const fromRpe=root.StrengthNotes?.rpeToEffort?.(Number(t.rpe));
      if(fromRpe)return fromRpe;
    }
    const efforts=page?.targetEfforts||[];
    const workIndex=row?.purpose==='ramp'?-1:(row?.workingIndex??index);
    if(workIndex>=0&&efforts[workIndex])return efforts[workIndex];
    if(page?.rpe!=null) {
      const fromPage=root.StrengthNotes?.rpeToEffort?.(Number(page.rpe));
      if(fromPage)return fromPage;
    }
    return t?.purpose==='warmup'?'easy':'average';
  }
  function next(args){
    const h=history(args.state?.records||{},args.page,args.state?.excludeSession,args.state?.ownerId);
    const state={...(args.state||{}),learning:args.state?.learning||h,rows:args.state?.rows||[]};
    const percentRow=args.row?.purpose!=='ramp'&&args.row?.purpose!=='warmup'&&args.nextRow?.purpose!=='ramp'&&args.nextRow?.purpose!=='warmup';
    const percent=percentRow?root.StrengthPercent?.adjust?.({...args,history:h,state}):null;
    if(percent)return percent;
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
  function aliasPage(records,page) {
    const want=E.nameKey?.(page);
    if(!want)return null;
    for(const rec of Object.values(records||{})) {
      const prior=rec?.payload?.page;
      if(!rec||rec.deleted||!prior)continue;
      if(E.nameKey(prior)!==want)continue;
      const eq=(page.equipmentId||'').toLowerCase(),priorEq=(prior.equipmentId||'').toLowerCase();
      if(eq&&priorEq&&eq!==priorEq)continue;
      return prior;
    }
    return null;
  }
  function lastLoggedWorking(records,page) {
    const want=E.nameKey?.(page);
    if(!want)return null;
    const tempoOf=p=>root.StrengthContext?.tempo?.(p?.tempo)??p?.tempo??null;
    const wantTempo=tempoOf(page);
    let best=null;
    for(const rec of Object.values(records||{})) {
      const prior=rec?.payload?.page,row=rec?.payload?.row;
      if(!rec||rec.deleted||!prior||!row||row.logged!==true||row.deleted||row.skipped)continue;
      if(row.purpose==='ramp'||row.purpose==='warmup')continue;
      if(E.nameKey(prior)!==want)continue;
      if(tempoOf(prior)!==wantTempo)continue;
      if(!Number.isFinite(Number(row.kg)))continue;
      const at=Number(rec.payload?.sessionStartedAt)||0;
      if(!best||at>=best.at)best={row,page:prior,at,record:rec};
    }
    return best;
  }
  function conventionOf(page,load) {
    const c=load?.convention||page?.loadConvention;
    if(['barbell_plates','barbell_total'].includes(c))return 'barbell_total';
    if(c==='total'&&page?.equipmentId==='barbell')return 'barbell_total';
    return c;
  }
  function history(records,page,excludeSession,ownerId) {
    ownerId=ownerId??root.StrengthMemory?.ownerId?.()??root.S?.accountId??null;
    const filled=E.apply?E.apply(page):page;
    let load=Core.normalized(0,filled);
    let contextKey=learningContext({athleteId:ownerId,page:filled,load});
    if(!contextKey) {
      const alias=aliasPage(records,filled);
      if(alias) {
        const bridged={...filled,exerciseId:alias.exerciseId||filled.exerciseId};
        load=Core.normalized(0,bridged)||load;
        contextKey=learningContext({athleteId:ownerId,page:bridged,load});
      }
    }
    const cacheable=root.StrengthMemory?.isSnapshot?.(records);
    const cacheKey=JSON.stringify([ownerId,contextKey,excludeSession??null,VERSION]);
    let cached=cacheable?replayCache.get(records):null;
    if(cached?.has(cacheKey))return cached.get(cacheKey);
    const fallback={version:'online-v1',k:root.StrengthLearning?.initial().k??.0333/1.0333,rows:[],accepted:0,updates:0,startingScale:null,evidenceFingerprint:'unavailable',conflicted:false,ledger:[],diagnostics:[],evidence:[],latestFirst:null};
    let r=fallback;
    try{
      if(contextKey&&root.StrengthReplay&&root.StrengthContext&&root.StrengthLearning)r=root.StrengthReplay.replay(Object.values(records||{}),{ownerId,contextKey,excludeSessionId:excludeSession});
      if((!r||r.accepted===0)&&root.StrengthReplay) {
        const alias=aliasPage(records,filled);
        if(alias?.exerciseId&&alias.exerciseId!==filled.exerciseId) {
          const bridged={...filled,exerciseId:alias.exerciseId};
          const altKey=learningContext({athleteId:ownerId,page:bridged,load:Core.normalized(0,bridged)||load});
          if(altKey) {
            contextKey=altKey;
            r=root.StrengthReplay.replay(Object.values(records||{}),{ownerId,contextKey:altKey,excludeSessionId:excludeSession});
          }
        }
      }
    }catch{/* Facts remain loggable while the optional learner is unavailable. */}
    const evidence=r.evidence.map(e=>({...e,sessionId:e.observation.sessionId,
      sourceSignature:'source-v3:'+JSON.stringify([e.observation.id,e.observation.revision,e.observation.weight,e.observation.reps,e.observation.rir,e.observation.miss]),
      sourceSetIds:[e.observation.id]}));
    let latest=null;
    if((!r||r.accepted===0)&&!r.latestFirst) {
      const last=lastLoggedWorking(records,filled);
      if(last) {
        const est=Core.estimate(last.row,last.page);
        let nextKg=Number(last.row.kg);
        if(!last.row.miss&&['very_easy','easy'].includes(last.row.effort))nextKg=E.next(nextKg,last.page)??nextKg;
        const observation={id:last.record.id,revision:last.record.localRevision,sessionId:last.record.sessionId,weight:Number(last.row.kg),reps:Number(last.row.reps)||0,rir:3,purpose:'working',workingIndex:0,miss:!!last.row.miss,completed:true};
        latest={observation,effort:last.row.effort,page:last.page,row:last.row,nextKg,rows:[last.row],earned:false,loadReduced:false,fromName:true,displayKg:Number(last.row.kg)};
        if(Number.isFinite(est)&&est>0)r.startingScale=r.startingScale??est;
      }
    }
    if(r.latestFirst&&!r.conflicted){
      const e=r.latestFirst,rows=r.ledger.filter(x=>x.sessionId===e.observation.sessionId&&!x.deleted&&x.payload?.row).map(x=>x.payload.row).sort((a,b)=>a.ordinal-b.ordinal);
      const result=Core.review(e.page,rows);let nextKg=e.row.kg;
      // Later work cannot fit the fresh curve, but a struggle must veto an
      // increase earned solely from the first set feeling Easy.
      const targets=T.normalize(e.page);
      const laterStruggle=rows.some(row=>{
        const target=targets.find(t=>t.id===row.targetId);
        return target?.purpose==='working'&&row.logged&&!row.deleted&&!row.skipped&&
          (row.miss||['hard','max_effort'].includes(row.effort)||Number(row.reps)<target.reps.min);
      });
      if(result.earned)nextKg=E.next(e.row.kg,e.page)??e.row.kg;
      else if(!laterStruggle&&!result.loadReduced&&!e.observation.miss&&['very_easy','easy'].includes(e.effort))nextKg=E.next(e.row.kg,e.page)??e.row.kg;
      else if(e.observation.miss||['hard','max_effort'].includes(e.effort)){
        const first=T.normalize(e.page).find(t=>t.purpose==='working');
        nextKg=Core.suggest({page:e.page,row:e.row,nextRow:{targetId:first?.id},index:0,state:{learning:r,rows}}).kg;
      }
      latest={...e,...result,nextKg,rows};
    }
    const freshE1rm=r.startingScale;
    const result={...r,evidence,contextKey,rolling:freshE1rm,freshE1rm,latest,sessions:r.accepted,exposures:r.accepted,
      confidence:r.accepted===0?'unknown':r.updates>0?'personal':'provisional',modelVersion:VERSION};
    if(cacheable){
      if(!cached){cached=new Map();replayCache.set(records,cached);}
      if(cached.size>=32)cached.delete(cached.keys().next().value);
      cached.set(cacheKey,freeze(result));
    }
    return result;
  }
  function seed(session,records) {
    const s=clone(session);if(s.brainSeeded)return s;
    let mainSeen=false;
    for(const outer of s.pages||[])for(const page of outer.members||[outer]) {
      const filled=E.apply?E.apply(page):page;
      for(const key of ['equipmentId','loadConvention','loadUnit','minimumKg','barWeightKg','equipmentStepKg','exerciseType']) {
        if((page[key]==null||page[key]==='')&&filled[key]!=null)page[key]=filled[key];
      }
      if(filled.weighted===false)continue;
      if(!page.loadUnit)page.loadUnit='kg';
      if(!eligible(page))continue;
      const log=s.logs?.[page.id];if(!log||log.sets.some(r=>r.logged))continue;
      let targets=[];try{targets=T.normalize(page);}catch{continue;}
      page.setTargets=targets;
      const h=history(records,page,s.id),first=targets.find(t=>t.purpose==='working'),prior=h.latest;
      let working=null,confidence='unknown';
      const samePrescription=prior&&JSON.stringify(T.normalize(prior.page).map(({id,...t})=>t))===JSON.stringify(targets.map(({id,...t})=>t));
      if(prior&&(samePrescription||prior.observation.miss||prior.effort==='max_effort'||prior.fromName)&&Number.isFinite(prior.nextKg)){
        if(prior.fromName){working=E.floor(prior.nextKg,page)??prior.nextKg;confidence='history';}
        else {
          const mass=Core.normalized(prior.nextKg,prior.page)?.externalKg;
          working=mass==null?null:E.floor(Core.display(mass,page),page);confidence='history';
        }
      } else if(prior&&first){
        const o=prior.observation,k=root.StrengthPolicy.learningMode==='online'?h.k:root.StrengthLearning.initial().k;
        const mass=root.StrengthLearning.project({weight:o.weight,fromReps:o.reps,fromRir:o.rir,toReps:first.reps.min,targetRir:3,k});
        const current=Core.display(o.weight,page);
        const directional=['very_easy','easy'].includes(prior.effort)&&first.reps.min<=o.reps;
        const nextMass=directional?Core.normalized(prior.nextKg,prior.page)?.externalKg:null;
        working=mass==null?(nextMass!=null?E.floor(Core.display(nextMass,page),page):current):Core.guard(mass,current,page,{transition:o.reps!==first.reps.min,planned:current});confidence='history';
      } else {
        const rx=root.StrengthPercent?.normalize?.(page);
        const orm=root.StrengthPercent?.oneRm?.({page,history:h,records});
        if(rx&&orm) {
          const plan=root.StrengthPercent.workingKgs({page,rx,oneRm:orm,history:h});
          working=plan.find(n=>n!=null)??plan[0];confidence='prescription';
          page.percentPlan=plan;
        } else {
          const notes=root.StrengthNotes?.parse?.(page.notes);
          const oneRm=Number(page.oneRm||page.e1rm||notes?.oneRm);
          const pct=Number(page.percent||notes?.percent)||70;
          if(Number.isFinite(oneRm)&&oneRm>0) {
            working=E.floor(oneRm*(pct/100),page);confidence='prescription';
          } else {
            const starter=E.starter(page);working=starter.kg;confidence=starter.confidence;
          }
        }
      }
      page.workingKg=working;page.startConfidence=confidence;
      const accessory=page.exerciseType==='accessory'||/curl|extension|raise|fly|flye|calf|kickback/i.test(page.title||'');
      const main=!accessory&&(page.exerciseType==='main'||/squat|deadlift|bench|overhead|press|row|lunge|rdl|pull.?up/i.test(page.title||'')||!mainSeen);if(main)mainSeen=true;
      const requested=Number(page.rampCount);
      const count=Number.isSafeInteger(requested)?Math.max(0,Math.min(3,requested)):(main?2:0);
      const bar=page.equipmentId==='barbell'||/\bbarbell\b/i.test(page.title||'');
      const known=typeof working==='number'&&Number.isFinite(working)&&working>=0;
      const rx=root.StrengthPercent?.normalize?.(page);
      const orm=root.StrengthPercent?.oneRm?.({page,history:h,records});
      const rangeBottom=rx?root.StrengthPercent.rampTargetKg({page,rx,oneRm:orm,firstWorkingKg:working}):null;
      const rampGoal=rangeBottom??working;
      const rampLoad=(()=>{
        if(!count||!known)return Array.from({length:count},()=>null);
        if(!(rampGoal>0))return Array.from({length:count},()=>bar?0:null);
        const fracs=bar
          ?(count===1?[0]:count===2?[0,.5]:[0,.5,.75])
          :(count===1?[.5]:count===2?[.5,.75]:[.4,.55,.75]);
        return fracs.slice(0,count).map((frac,i)=>{
          if(frac===0)return 0;
          let kg=E.floor(rampGoal*frac,page);
          if(kg==null)kg=E.next(0,page);
          return kg;
        }).map((kg,i,all)=>{
          if(kg==null)return kg;
          if(i>0&&all[i-1]!=null&&kg<=all[i-1]&&all[i-1]!==0) {
            const up=E.next(all[i-1],page);return up!=null&&up<rampGoal?up:kg;
          }
          if(kg>=rampGoal) {
            const lower=E.floor(rampGoal-1e-7,page);
            return lower!=null&&(i===0||lower>all[i-1])?lower:kg;
          }
          return kg;
        });
      })();
      const ramps=Array.from({length:count},(_,i)=>({id:root.crypto.randomUUID(),targetId:`${page.id}:warmup:${i}`,purpose:'ramp',reps:first?.reps.min??page.targetReps,kg:i<rampLoad.length?rampLoad[i]:null,cells:{},logged:false,miss:false}));
      const authored=log.sets.map((row,i)=>{
        const target=targets[i],reps=Number(target?.reps?.min),from=Number(first?.reps?.min);
        const planned=Array.isArray(page.percentPlan)?page.percentPlan[i]:null;
        const drop=target?.setRole==='drop'||target?.setRole==='backoff'||target?.percentBasis==='top_set';
        const matched=known&&target?.purpose==='working'&&Number.isInteger(reps)&&Number.isInteger(from)&&planned==null&&!drop?Core.matchLoad(working,from,reps,page):null;
        const kg=planned!=null?planned:drop&&known?E.floor(working*0.875,page):matched!=null?matched:known?working:i===0?working??row.kg:row.kg;
        return {...row,id:row.id||root.crypto.randomUUID(),targetId:row.targetId||target?.id,purpose:target?.purpose||'working',workingIndex:i,kg};
      });
      log.sets=ramps.concat(authored);
    }
    s.brainSeeded=true;return s;
  }
  function learningContext({athleteId,page,load}={}) {
    const context=root.StrengthContext,normalized=context?.normalizeLoad(load);
    if(!normalized?.eligible)return null;
    const convention=conventionOf(page,normalized);
    try{return context.key({athleteId,exerciseId:page?.exerciseId,equipmentId:page?.equipmentId,convention,tempo:page?.tempo});}
    catch{return null;}
  }
  root.StrengthBrain={VERSION,RIR,key,learningContext,eligible,equipment,round,stepUp,target,next,estimate,review,history,seed,clearCache(){replayCache=new WeakMap();diagnosticEvents.length=0;},diagnostics:()=>diagnosticEvents.map(e=>({...e}))};
})(typeof window!=='undefined'?window:globalThis);
