/** Athlete compatibility and seeding adapter for the canonical v2 strength core. */
(function(root) {
  const VERSION=root.StrengthPolicy.version,RIR=root.TrainingCore.rir,Core=root.StrengthBrainCore,E=root.StrengthEquipment,T=root.StrengthTargets,RTS=root.StrengthRTS;
  const positive=n=>Number.isFinite(Number(n))&&Number(n)>0;
  const clone=x=>JSON.parse(JSON.stringify(x));
  function key(page) {
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
      const samePrescription=prior&&JSON.stringify(prior.page.setTargets||[prior.page.targetReps,prior.page.targetRepMax])===JSON.stringify(page.setTargets||[page.targetReps,page.targetRepMax]);
      if(samePrescription&&positive(prior.nextKg)){working=prior.nextKg;confidence='history';}
      else if(positive(h.rolling)&&first&&RTS.percent(first.reps.min,7)){working=E.floor(h.rolling*RTS.percent(first.reps.min,7),page);confidence='history';}
      else {const starter=E.starter(page);working=starter.kg;confidence=starter.confidence;}
      page.workingKg=working;page.startConfidence=confidence;
      const accessory=page.exerciseType==='accessory'||/curl|extension|raise|fly|flye|calf|kickback/i.test(page.title||'');
      const main=!accessory&&(page.exerciseType==='main'||/squat|deadlift|bench|overhead|press|row|pull.?up/i.test(page.title||'')||!mainSeen);if(main)mainSeen=true;
      const count=page.rampCount===0?0:main?2:page.rampCount===2?2:0;
      const firstRamp=positive(working)?E.floor(working*.5,page):null;
      const ramps=Array.from({length:count},(_,i)=>({id:root.crypto.randomUUID(),targetId:`${page.id}:warmup:${i}`,purpose:'ramp',reps:first?.reps.min??page.targetReps,kg:i===0?firstRamp:null,cells:{},logged:false,miss:false}));
      const authored=log.sets.map((row,i)=>({...row,id:row.id||root.crypto.randomUUID(),targetId:row.targetId||targets[i]?.id,purpose:targets[i]?.purpose||'working',workingIndex:i,kg:count?null:i===0?working??row.kg:row.kg}));
      log.sets=ramps.concat(authored);
    }
    s.brainSeeded=true;return s;
  }
  root.StrengthBrain={VERSION,RIR,key,eligible,equipment,round,stepUp,target,next,estimate,review,history,seed};
})(typeof window!=='undefined'?window:globalThis);
