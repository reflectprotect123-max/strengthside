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
    if(row?.purpose==='ramp'||row?.purpose==='warmup')return 'easy';
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
    try {
      const t=T.forRow(args.page,args.nextRow,args.index);
      if(t?.loadRule?.kind==='first_working_set')return Core.suggest(args);
    } catch {}
    if(root.StrengthWeights) {
      return root.StrengthWeights.nextSet({...args,athlete:root.StrengthWeights.current()});
    }
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
  function displayEstimate(row,page) {
    if(['very_easy','easy'].includes(row?.effort))return null;
    const direct=Core.estimate(row,page);
    if(Number.isFinite(direct)&&direct>0)return direct;
    const kg=Number(row?.kg),reps=Number(row?.reps);
    if(!(kg>0)||!Number.isInteger(reps)||reps<1||reps>12)return null;
    return kg*(1+reps/30);
  }
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
  function titleKey(page) {
    return String(page?.title||page?.name||'').trim().toLowerCase();
  }
  function sameLift(a,b) {
    const idA=a?.exerciseId,idB=b?.exerciseId;
    if(idA&&idB&&String(idA)===String(idB))return true;
    const tA=titleKey(a),tB=titleKey(b);
    return !!(tA&&tB&&tA===tB);
  }
  function plausibleKg(page,kg) {
    return E.plausibleWorking?E.plausibleWorking(page,kg):Number(kg)>0;
  }
  // Weight selection (locked):
  // (a) coach % prescription + coach 1RM wins on percent days
  // (b) else newest plausible completed session for the EXACT same lift
  //     (shared exerciseId, or exact title when identity is missing)
  // (c) else conservative starter for that equipment
  // Never apply another lift's load. Never use oneRm*70% without a percent plan.
  // Ramps aim at the first working set from this pick, not another lift or range bottom.
  function pickWorking(page,records,h) {
    const rx=root.StrengthPercent?.normalize?.(page);
    const orm=root.StrengthPercent?.oneRm?.({page,history:h,records});
    if(rx&&orm) {
      const plan=root.StrengthPercent.workingKgs({page,rx,oneRm:orm});
      const working=plan.find(n=>n!=null)??plan[0];
      return {working,plan,confidence:'prescription',rx,orm};
    }
    const last=h?.latest;
    const kg=Number(last?.nextKg??last?.row?.kg);
    if(last&&sameLift(last.page,page)&&Number.isFinite(kg)&&plausibleKg(page,kg)) {
      return {working:E.floor(kg,page)??kg,plan:null,confidence:'history',rx:null,orm};
    }
    const starter=E.starter(page);
    return {working:starter.kg,plan:null,confidence:starter.confidence||'provisional',rx:null,orm};
  }
  function lastLoggedWorking(records,page,excludeSession) {
    if(!titleKey(page)&&!page?.exerciseId)return null;
    const tempoOf=p=>root.StrengthContext?.tempo?.(p?.tempo)??p?.tempo??null;
    const wantTempo=tempoOf(page);
    const wantEq=(page.equipmentId||'').toLowerCase();
    const sessions=new Map();
    for(const rec of Object.values(records||{})) {
      const prior=rec?.payload?.page,row=rec?.payload?.row;
      if(!rec||rec.deleted||!prior||!row||row.logged!==true||row.deleted||row.skipped)continue;
      if(row.purpose==='ramp'||row.purpose==='warmup')continue;
      if(!sameLift(prior,page))continue;
      if(excludeSession&&rec.sessionId===excludeSession)continue;
      const priorEq=(prior.equipmentId||'').toLowerCase();
      if(wantEq&&priorEq&&wantEq!==priorEq)continue;
      if(tempoOf(prior)!==wantTempo)continue;
      const kg=Number(row.kg);
      if(!Number.isFinite(kg)||!(plausibleKg(page,kg)||plausibleKg(prior,kg)))continue;
      const at=Number(rec.payload?.sessionStartedAt)||0;
      const sid=rec.sessionId||rec.id;
      const bucket=sessions.get(sid)||{rows:[],page:prior,at,record:rec,completed:false};
      bucket.rows.push(row);
      if(at>=bucket.at) {
        bucket.at=at;bucket.page=prior;bucket.record=rec;bucket.completed=rec.payload?.completed===true;
      }
      sessions.set(sid,bucket);
    }
    const found=[...sessions.values()];
    found.sort((a,b)=>{
      if(a.at!==b.at)return b.at-a.at;
      if(a.completed!==b.completed)return a.completed?-1:1;
      return (Number(b.rows.at(-1)?.kg)||0)-(Number(a.rows.at(-1)?.kg)||0);
    });
    const hit=found[0];
    if(!hit)return null;
    hit.rows.sort((a,b)=>(a.ordinal??a.workingIndex??0)-(b.ordinal??b.workingIndex??0));
    hit.row=hit.rows[0];
    hit.kg=Number(hit.rows.at(-1)?.kg);
    return hit;
  }
  function reviewedNextKg(page,rows,learning) {
    const result=Core.review(page,rows);
    const first=rows[0];
    let nextKg=result.nextKg??Number(first?.kg);
    let targets=[];try{targets=T.normalize(page);}catch{targets=[];}
    const laterStruggle=rows.some((row,i)=>{
      if(i===0)return false;
      const target=targets.find(t=>t.id===row.targetId);
      return (!target||target.purpose==='working')&&row.logged&&!row.deleted&&!row.skipped&&
        (row.miss||['hard','max_effort'].includes(row.effort)||(target&&Number(row.reps)<target.reps.min));
    });
    if(result.earned)nextKg=E.next(first.kg,page)??first.kg;
    else if(!laterStruggle&&!result.loadReduced&&!first?.miss&&['very_easy','easy'].includes(first?.effort)) {
      nextKg=E.next(first.kg,page)??first.kg;
    } else if(!laterStruggle&&(first?.miss||['hard','max_effort'].includes(first?.effort))) {
      const firstT=targets.find(t=>t.purpose==='working');
      const reduced=Core.suggest({page,row:first,nextRow:{targetId:firstT?.id},index:0,state:{learning,rows}}).kg;
      if(reduced!=null)nextKg=reduced;
    } else nextKg=result.nextKg??first?.kg;
    return {...result,nextKg};
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
    const cacheKey=JSON.stringify([ownerId,titleKey(filled),filled.equipmentId||null,contextKey,excludeSession??null,VERSION]);
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
    const last=lastLoggedWorking(records,filled,excludeSession);
    const coachOrm=Number(filled.oneRm||filled.e1rm)||0;
    const scaleOk=n=>Number.isFinite(n)&&n>0&&!(filled.equipmentId==='barbell'&&n<40)&&!(coachOrm>0&&n<coachOrm*0.5);
    const lastAt=Number(last?.at)||0;
    const firstAt=Number(r.latestFirst?.observation?.sessionStartedAt??r.latestFirst?.payload?.sessionStartedAt)||0;
    const replayLift=r.latestFirst?.page||r.latestFirst?.observation?.page;
    const replayLiftOk=r.latestFirst&&sameLift(replayLift||filled,filled);
    if(r.latestFirst&&!r.conflicted&&replayLiftOk&&(!last||firstAt>=lastAt)){
      const e=r.latestFirst,rows=r.ledger.filter(x=>x.sessionId===e.observation.sessionId&&!x.deleted&&x.payload?.row).map(x=>x.payload.row).sort((a,b)=>(a.ordinal??0)-(b.ordinal??0));
      const result=reviewedNextKg(e.page,rows.length?rows:[e.row],r);
      if((plausibleKg(filled,result.nextKg)||plausibleKg(filled,e.row.kg)||plausibleKg(e.page,e.row.kg))&&sameLift(e.page,filled)) {
        latest={...e,...result,rows:rows.length?rows:[e.row]};
      }
    }
    if(!latest&&last) {
      const rows=last.rows||[last.row];
      const result=reviewedNextKg(last.page,rows,r);
      const first=rows[0]||last.row;
      const observation={id:last.record.id,revision:last.record.localRevision,sessionId:last.record.sessionId,weight:Number(first.kg),reps:Number(first.reps)||0,rir:3,purpose:'working',workingIndex:0,miss:!!first.miss,completed:true};
      latest={observation,effort:first.effort,page:last.page,row:first,...result,rows,fromName:true,displayKg:Number(last.kg??rows.at(-1)?.kg)};
    }
    if(latest&&(r.startingScale==null||!scaleOk(r.startingScale))) {
      const evidenceRow=(latest.rows||[]).filter(row=>row&&!['very_easy','easy'].includes(row.effort)).at(-1)||latest.row;
      const est=displayEstimate(evidenceRow,latest.page||last?.page);
      if(Number.isFinite(est)&&est>0&&scaleOk(est))r.startingScale=est;
      else if(r.startingScale!=null&&!scaleOk(r.startingScale))r.startingScale=null;
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
      const h=history(records,page,s.id),first=targets.find(t=>t.purpose==='working');
      const planned=root.StrengthWeights.plan({page,history:h,records,athlete:root.StrengthWeights.current()});
      const working=planned.workingKgs.find(n=>n!=null);
      page.workingKg=working;
      page.percentPlan=planned.workingKgs;
      page.startConfidence=planned.confidence;
      page.weightFlags=planned.flags;
      const known=typeof working==='number'&&Number.isFinite(working)&&working>=0;
      const warmups=(planned.warmupKgs||[]).map((kg,i)=>({id:root.crypto.randomUUID(),targetId:`${page.id}:bw:${i}`,purpose:'warmup',reps:first?.reps.min??page.targetReps,kg,cells:{},logged:false,miss:false}));
      const ramps=(planned.rampKgs||[]).map((kg,i)=>({id:root.crypto.randomUUID(),targetId:`${page.id}:warmup:${i}`,purpose:'ramp',reps:first?.reps.min??page.targetReps,kg,cells:{},logged:false,miss:false}));
      const authored=log.sets.map((row,i)=>{
        const target=targets[i];
        const kg=Array.isArray(planned.workingKgs)?planned.workingKgs[i]:known?working:row.kg;
        return {...row,id:row.id||root.crypto.randomUUID(),targetId:row.targetId||target?.id,purpose:target?.purpose||'working',workingIndex:i,kg,setRole:target?.setRole||null};
      });
      log.sets=warmups.concat(ramps,authored);
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
