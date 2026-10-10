/** Deterministic strength rules. No conditioning/recovery changes in this release. */
(function(root) {
  const VERSION='strength-v1.0.0';
  const RIR=root.TrainingCore.rir;
  const positive=n=>Number.isFinite(Number(n))&&Number(n)>0;
  const clone=x=>JSON.parse(JSON.stringify(x));
  function key(page) {
    return [page.exerciseId||String(page.title||'').trim().toLowerCase().replace(/\s+/g,' '),page.equipmentId||'default',page.loadConvention||'total',page.loadUnit||'kg'].join('|');
  }
  function eligible(page) {
    return page.kind==='lift'&&page.logMode==='kg'&&positive(page.targetReps)&&! /carry|farmer|suitcase|\bhold\b|plank|\bclean\b|\bsnatch\b|\bjump\b/i.test(page.title||'')&&!(page.columns||[]).some(c=>!['reps','reps_range','weight_kg'].includes(c));
  }
  function equipment(page) {
    const loads=(page.availableLoads||[]).map(Number).filter(n=>Number.isFinite(n)&&n>=0).sort((a,b)=>a-b);
    return {loads:[...new Set(loads)],step:positive(page.equipmentStepKg)?Number(page.equipmentStepKg):2.5,min:Number(page.minimumKg)||0};
  }
  function round(value,current,page,upCap=.05,downCap=.05) {
    if(!Number.isFinite(value)||!Number.isFinite(current)||current<0)return current;
    const e=equipment(page),up=value>current+1e-8,down=value<current-1e-8;
    if(!up&&!down)return current;
    const low=down?Math.max(e.min,current*(1-downCap)):current,high=up?current*(1+upCap):current;
    let candidates=e.loads.length?e.loads.filter(n=>n>=low-1e-8&&n<=high+1e-8):[];
    if(!e.loads.length) {
      const nearest=Math.round(value/e.step)*e.step;
      candidates=[nearest,Math.floor(high/e.step)*e.step,Math.ceil(low/e.step)*e.step].filter(n=>n>=low-1e-8&&n<=high+1e-8&&n>=e.min);
    }
    candidates=candidates.filter(n=>up?n>=current:n<=current);
    // Coarse equipment can require a larger reduction, but never a larger increase.
    if(down&&!candidates.some(n=>n<current)) {
      const lower=e.loads.length?e.loads.filter(n=>n<current).at(-1):Math.max(e.min,(Math.ceil(current/e.step)-1)*e.step);
      return lower==null?current:Math.min(current,lower);
    }
    candidates.push(current);
    candidates.sort((a,b)=>Math.abs(a-value)-Math.abs(b-value)||a-b);
    return Math.round(candidates[0]*1000)/1000;
  }
  function stepUp(kg,page,cap=.1) {
    const e=equipment(page),n=e.loads.length?e.loads.find(n=>n>kg+1e-8):kg+e.step;
    return n!=null&&n<=kg*(1+cap)+1e-8?Math.round(n*1000)/1000:kg;
  }
  function target(page,row,index) {
    if(row?.purpose==='ramp')return 'easy';
    return 'average'; // Max-effort testing and automatic harder-set schedules are deferred.
  }
  function next({page,row,nextRow,index=0}) {
    const kg=Number(row.kg),reps=Number(row.reps),desired=row.purpose!=='ramp'&&row.effort==='hard'&&(nextRow?.workingIndex??index)>=page.setCount-1?'hard':target(page,nextRow,index);
    if(!eligible(page)||!Number.isFinite(kg)||kg<=0)return {kg:row.kg,target:desired,ruleVersion:VERSION};
    let value=kg,up=.05,down=.05;
    if(row.miss||reps<page.targetReps){value=kg*.9;down=.1;}
    else if(row.effort==='max_effort'){value=kg*.9;down=.1;}
    else if(row.purpose==='ramp') {
      up=.1;
      if(['easy','very_easy'].includes(row.effort)) {
        if(positive(page.workingKg)&&page.startConfidence==='history')value=nextRow?.purpose==='ramp'?page.workingKg*.75:page.workingKg;
        else value=stepUp(kg,page,.1);
      }
      // Known planned ramps may advance toward the already established working load.
      if(page.startConfidence==='history'&&['easy','very_easy'].includes(row.effort)) {
        const e=equipment(page),n=nextRow?.purpose==='ramp'?page.workingKg*.75:page.workingKg;
        value=e.loads.length?e.loads.filter(x=>x<=n).at(-1)??kg:Math.max(e.min,Math.floor(n/e.step)*e.step);
        return {kg:Math.max(kg,Math.min(page.workingKg,value)),target:desired,ruleVersion:VERSION};
      }
    } else if(row.effort==='very_easy')value=stepUp(kg,page,.05);
    else if(RIR[row.effort]!=null&&row.effort!==desired) value=kg*(30+reps+RIR[row.effort])/(30+Number(page.targetReps)+RIR[desired]);
    return {kg:round(value,kg,page,up,down),target:desired,ruleVersion:VERSION};
  }
  function estimate(row,page) {
    const r=Number(row.reps),w=Number(row.kg),rir=RIR[row.effort];
    if(!eligible(page)||!row.logged||row.deleted||row.miss||row.purpose==='ramp'||!['average','medium','hard','max_effort'].includes(row.effort)||!positive(w)||!Number.isInteger(r)||r<1||r>10||r+rir>12)return null;
    return r===1&&rir===0?w:w*(1+(r+rir)/30);
  }
  function review(page,rows) {
    const work=rows.filter(r=>r.purpose!=='ramp'&&!r.deleted),logged=work.filter(r=>r.logged);
    const estimates=logged.map(r=>estimate(r,page)).filter(positive);
    const suitable=logged.filter(r=>!r.miss&&r.reps>=page.targetReps&&['average','medium','hard'].includes(r.effort));
    const last=suitable.at(-1)||logged.filter(r=>!r.miss&&r.reps>=page.targetReps&&r.effort!=='max_effort').at(-1);
    const same=logged.length&&logged.every(r=>Number(r.kg)===Number(logged[0].kg));
    const complete=work.length>=page.setCount&&work.every(r=>r.logged);
    const earned=complete&&same&&work.every(r=>r.reps>=page.targetRepMax&&!r.miss&&r.effort&&r.effort!=='max_effort');
    const kg=last?Number(last.kg):logged.length?Number(logged.at(-1).kg):null;
    return {e1rm:estimates.length?Math.max(...estimates):null,nextKg:positive(kg)?earned?stepUp(kg,page):kg:null,earned,calibrated:!!last,complete,ruleVersion:VERSION};
  }
  function history(records,page,excludeSession) {
    const sessions=new Map();
    for(const record of Object.values(records||{})) {
      if(record.kind!=='set'||record.deleted||record.sessionId===excludeSession||record.exerciseKey!==key(page))continue;
      const p=record.payload;
      if(!p?.row?.logged||!p.page)continue;
      const bucket=sessions.get(record.sessionId)||{page:p.page,rows:[],at:p.sessionStartedAt||0,sessionId:record.sessionId};
      bucket.rows.push(p.row);bucket.rows.sort((a,b)=>(a.ordinal||0)-(b.ordinal||0));sessions.set(record.sessionId,bucket);
    }
    const all=[...sessions.values()].sort((a,b)=>a.at-b.at).map(x=>({...x,...review(x.page,x.rows)}));
    const usable=all.filter(x=>positive(x.e1rm));
    // An isolated >20% jump is provisional until a second session supports it.
    const trusted=[];
    for(let i=0;i<usable.length;i++) {
      const x=usable[i],previous=trusted.at(-1);
      if(previous&&x.e1rm>previous.e1rm*1.2&&!(usable[i+1]?.e1rm>=x.e1rm*.9))continue;
      trusted.push(x);
    }
    const recent=trusted.slice(-3),rolling=recent.length?recent.reduce((s,x)=>s+x.e1rm,0)/recent.length:null;
    return {rolling,latest:all.filter(x=>positive(x.nextKg)&&x.calibrated).at(-1),sessions:recent.length};
  }
  function seed(session,records) {
    const s=clone(session);if(s.brainSeeded)return s;
    let mainSeen=false;
    for(const outer of s.pages)for(const page of outer.members||[outer]) {
      if(!eligible(page))continue;
      const log=s.logs[page.id];if(!log||log.sets.some(r=>r.logged))continue;
      const h=history(records,page,s.id),prior=h.latest;
      let working=null;
      if(prior&&prior.page.targetReps===page.targetReps&&prior.page.targetRepMax===page.targetRepMax) working=prior.nextKg;
      else if(h.rolling&&page.targetReps+3<=12) working=h.rolling/(1+(page.targetReps+3)/30);
      const e=equipment(page);
      if(positive(working))working=e.loads.length?e.loads.filter(x=>x<=working).at(-1)??null:Math.max(e.min,Math.floor(working/e.step)*e.step);
      page.workingKg=working;page.startConfidence=positive(working)?'history':'unknown';
      // First main lift ramps; explicit classification controls subsequent heavy lifts/accessories.
      const accessory=page.exerciseType==='accessory'||/curl|extension|raise|fly|flye|calf|kickback/i.test(page.title||'');
      const main=!accessory&&(page.exerciseType==='main'||/squat|deadlift|bench|overhead|press|row|pull.?up/i.test(page.title||'')||!mainSeen);if(main)mainSeen=true;
      const count=page.rampCount===0?0:main?2:page.rampCount===2?2:0;
      const start=positive(working)?Math.max(e.min,e.loads.length?e.loads.filter(x=>x<=working*.5).at(-1)??e.loads[0]:Math.floor(working*.5/e.step)*e.step):null;
      const ramps=Array.from({length:count},(_,i)=>({id:root.crypto.randomUUID(),purpose:'ramp',reps:page.targetReps,kg:i===0?start:null,cells:{},logged:false,miss:false}));
      log.sets=ramps.concat(log.sets.map((r,i)=>({...r,id:r.id||root.crypto.randomUUID(),purpose:'working',workingIndex:i,kg:count?null:i===0?working??r.kg:r.kg})));
    }
    s.brainSeeded=true;return s;
  }
  root.StrengthBrain={VERSION,RIR,key,eligible,equipment,round,stepUp,target,next,estimate,review,history,seed};
})(typeof window!=='undefined'?window:globalThis);
