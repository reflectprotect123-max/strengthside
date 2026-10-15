/** Athlete compatibility and seeding adapter for the canonical v2 strength core. */
(function(root) {
  const VERSION=root.StrengthPolicy.version,RIR=root.TrainingCore.rir,Core=root.StrengthBrainCore,E=root.StrengthEquipment,T=root.StrengthTargets,RTS=root.StrengthRTS;
  const positive=n=>Number.isFinite(Number(n))&&Number(n)>0;
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
    const h=args.state?.freshE1rm!=null?null:history(args.state?.records||{},args.page,args.state?.excludeSession);
    return Core.suggest({...args,state:{...(args.state||{}),freshE1rm:args.state?.freshE1rm??h?.rolling,rows:args.state?.rows||[]}});
  }
  const estimate=(row,page)=>Core.estimate(row,page);
  const review=(page,rows)=>Core.review(page,rows);
  function history(records,page,excludeSession) {
    const sessions=new Map();
    for(const record of Object.values(records||{})) {
      if(record.kind!=='set'||record.deleted||record.sessionId===excludeSession||record.exerciseKey!==key(page))continue;
      const payload=record.payload;if(!payload?.row||!payload.page)continue;
      const bucket=sessions.get(record.sessionId)||{page:payload.page,rows:[],at:payload.sessionStartedAt||0,sessionId:record.sessionId};
      bucket.rows.push(payload.row);bucket.rows.sort((a,b)=>(a.ordinal||0)-(b.ordinal||0));sessions.set(record.sessionId,bucket);
    }
    const all=[...sessions.values()].sort((a,b)=>a.at-b.at).map(x=>({...x,...Core.review(x.page,x.rows)}));
    const trusted=all.filter(x=>positive(x.e1rm)),recent=trusted.slice(-3),rolling=recent.length?recent.reduce((s,x)=>s+x.e1rm,0)/recent.length:null;
    return {rolling,latest:all.filter(x=>positive(x.nextKg)&&x.calibrated).at(-1)||null,sessions:recent.length};
  }
  function seed(session,records) {
    const s=clone(session);if(s.brainSeeded)return s;
    let mainSeen=false;
    for(const outer of s.pages||[])for(const page of outer.members||[outer]) {
      if(!eligible(page))continue;
      const log=s.logs?.[page.id];if(!log||log.sets.some(r=>r.logged))continue;
      let targets=[];try{targets=T.normalize(page);}catch{continue;}
      page.setTargets=targets;
      const h=history(records,page,s.id),first=targets.find(t=>t.purpose==='working'),prior=h.latest;
      let working=null,confidence='unknown';
      let samePrescription=false;
      if(prior)try{samePrescription=JSON.stringify(T.normalize(prior.page))===JSON.stringify(T.normalize(page));}catch{}
      if(samePrescription&&positive(prior.nextKg)){working=prior.nextKg;confidence='history';}
      else if(positive(h.rolling)&&first&&RTS.percent(first.reps.min,7)){working=E.floor(h.rolling*RTS.percent(first.reps.min,7),page);confidence='history';}
      else {const starter=E.starter(page);working=starter.kg;confidence=starter.confidence;}
      page.workingKg=working;page.startConfidence=confidence;
      const accessory=page.exerciseType==='accessory'||/curl|extension|raise|fly|flye|calf|kickback/i.test(page.title||'');
      const main=!accessory&&(page.exerciseType==='main'||/squat|deadlift|bench|overhead|press|row|pull.?up/i.test(page.title||'')||!mainSeen);if(main)mainSeen=true;
      const count=page.rampCount===0?0:main?2:page.rampCount===2?2:0;
      const bar=page.equipmentId==='barbell'||/\bbarbell\b/i.test(page.title||'');
      const known=Number.isFinite(Number(working))&&Number(working)>=0;
      const belowWork=known&&working>0?E.floor(working*.5,page):null;
      const step=E.next(0,page);
      const second=belowWork>0&&belowWork<working?belowWork:step!=null&&step<working?step:0;
      const rampLoad=bar&&known?[0,second]:[known&&working>0?belowWork:null,null];
      const ramps=Array.from({length:count},(_,i)=>({id:root.crypto.randomUUID(),targetId:`${page.id}:warmup:${i}`,purpose:'ramp',reps:first?.reps.min??page.targetReps,kg:i<rampLoad.length?rampLoad[i]:null,cells:{},logged:false,miss:false}));
      const authored=log.sets.map((row,i)=>{
        const target=targets[i],reps=Number(target?.reps?.min),from=Number(first?.reps?.min);
        const matched=known&&target?.purpose==='working'&&Number.isInteger(reps)&&Number.isInteger(from)?Core.matchLoad(working,from,reps,page):null;
        const kg=matched!=null?matched:known?working:i===0?working??row.kg:row.kg;
        return {...row,id:row.id||root.crypto.randomUUID(),targetId:row.targetId||target?.id,purpose:target?.purpose||'working',workingIndex:i,kg};
      });
      log.sets=ramps.concat(authored);
    }
    s.brainSeeded=true;return s;
  }
  function learningContext({athleteId,page,load}={}) {
    const context=root.StrengthContext,normalized=context?.normalizeLoad(load);
    if(!normalized?.eligible)return null;
    const convention=['barbell_plates','barbell_total'].includes(normalized.convention)?'barbell_total':normalized.convention;
    try{return context.key({athleteId,exerciseId:page?.exerciseId,equipmentId:page?.equipmentId,convention,tempo:page?.tempo});}
    catch{return null;}
  }
  root.StrengthBrain={VERSION,RIR,key,learningContext,eligible,equipment,round,stepUp,target,next,estimate,review,history,seed};
})(typeof window!=='undefined'?window:globalThis);
