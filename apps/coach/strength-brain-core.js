/** Pure strength calculations. UI/session compatibility lives in athlete/strength-brain.js. */
(function(root) {
  const T=root.StrengthTargets,E=root.StrengthEquipment,RTS=root.StrengthRTS,DEFAULT=root.StrengthPolicy;
  const effortRpe={average:7,medium:7,hard:9,max_effort:10};
  const effortRank={very_easy:0,easy:1,average:2,medium:2,hard:3,max_effort:4};
  const positive=n=>Number.isFinite(Number(n))&&Number(n)>0;
  const ordinary=t=>t&&t.purpose==='working';
  function policy(state){return {...DEFAULT,...(state?.policy||{})};}
  function supported(page) {
    const columns=page?.columns||[];
    return page?.kind==='lift'&&page?.loadUnit!=='lb'&&(page?.logMode==='kg'||columns.includes('weight_kg'))&&
      !/carry|farmer|suitcase|\bhold\b|plank|\bclean\b|\bsnatch\b|\bjump\b/i.test(page.title||'')&&
      !columns.some(c=>!['reps','reps_range','weight_kg'].includes(c));
  }
  function targetFor(page,row,index){try{return T.forRow(page,row,index);}catch{return null;}}
  function intended(target){return target?.purpose==='warmup'?'easy':'average';}
  function estimate(row,page) {
    if(!supported(page)||!row?.logged||row.deleted||row.skipped||row.miss||row.purpose==='ramp'||row.purpose==='warmup'||row.purpose==='amrap'||!positive(row.kg))return null;
    const reps=Number(row.reps),rpe=effortRpe[row.effort];
    if(!Number.isInteger(reps)||rpe==null)return null;
    const pct=RTS.percent(reps,rpe);
    return pct?Number(row.kg)/pct:null;
  }
  function sameSource(previous,evidence){return previous?.lastSourceSignature&&previous.lastSourceSignature===evidence?.sourceSignature;}
  function learn(previous={},evidence={}) {
    const base={freshE1rm:positive(previous.freshE1rm)?Number(previous.freshE1rm):null,exposures:Number(previous.exposures)||0,confidence:previous.confidence||'unknown',modelVersion:DEFAULT.version,lastSourceSignature:previous.lastSourceSignature||null};
    if(!positive(evidence.estimate)||!evidence.sourceSignature||sameSource(base,evidence))return base;
    const blend=Number(evidence.learningBlend??DEFAULT.learningBlend);
    base.freshE1rm=positive(base.freshE1rm)?base.freshE1rm*(1-blend)+Number(evidence.estimate)*blend:Number(evidence.estimate);
    base.exposures+=1;base.confidence=base.exposures>=3?'personal':'provisional';base.modelVersion=evidence.modelVersion||DEFAULT.version;base.lastSourceSignature=evidence.sourceSignature;
    return base;
  }
  function response(kg,target,reason,confidence,p){return {kg,target,ruleVersion:p.version,reason,confidence};}
  function suggest({page,row,nextRow,index=0,state={}}) {
    const p=policy(state),nextTarget=targetFor(page,nextRow,index),label=intended(nextTarget),kg=Number(row?.kg);
    if(nextTarget?.loadRule?.kind==='first_working_set') {
      const ref=T.resolveReference(nextTarget,state.rows||[]);
      return response(ref,label,ref==null?'reference_unresolved':'first_working_set','exact_reference',p);
    }
    if(!supported(page)||finiteLoad(kg)==null||!nextTarget)return response(finiteLoad(kg)!=null?kg:row?.kg??null,label,'unsupported_or_unknown','unknown',p);
    const currentTarget=targetFor(page,row,Math.max(0,index-1));
    const reps=Number(row.reps),miss=!!row.miss||!Number.isInteger(reps)||reps<1||(ordinary(currentTarget)&&reps<currentTarget.reps.min);
    if(miss||row.effort==='max_effort') {
      const reduced=E.round(kg*(1-p.downCap),kg,page,{upCap:p.upCap,downCap:p.downCap});
      const atMin=reduced===kg&&E.floor(kg-EPSILON,page)==null;
      return response(reduced,label,atMin?'minimum_reached':'reduce_after_incomplete','low',p);
    }
    if(nextTarget.purpose==='warmup'||currentTarget?.purpose==='warmup'||row.purpose==='ramp') {
      // A lighter warm-up leaves the plan alone. A heavier one is converted onto each work-set's own reps.
      const lifted=finiteLoad(kg);
      if(nextTarget.purpose==='working') {
        const held=finiteLoad(nextRow?.kg),planned=finiteLoad(page?.workingKg);
        let keep=planLoad(page,nextTarget,held,planned);
        const candidate=provenLoad(page,row,nextTarget);
        if(candidate!=null&&(keep==null||candidate>keep))keep=candidate;
        return response(keep,label,'working_load',keep==null?'unknown':'exact_reference',p);
      }
      const seeded=finiteLoad(nextRow?.kg);
      let next=['very_easy','easy'].includes(row.effort)?E.next(kg,page)??kg:kg;
      if(seeded!=null&&seeded>=next)next=seeded;
      if(lifted!=null&&lifted>next)next=lifted;
      let ceiling=finiteLoad(page?.workingKg);
      if(ceiling!=null&&lifted!=null&&lifted>ceiling)ceiling=lifted;
      if(ceiling!=null&&next>ceiling)next=ceiling;
      return response(next,label,next>kg?'warmup_step':'warmup_hold','directional',p);
    }
    if(['very_easy','easy'].includes(row.effort)) {
      const next=E.next(kg,page),moved=next==null?kg:E.round(next,kg,page,{upCap:p.upCap,downCap:p.downCap});
      return response(moved,label,moved>kg?'easy_directional_step':'easy_hold','directional',p);
    }
    const targetReps=nextTarget.reps?.min,observed=estimate(row,page);
    const today=positive(state.todayE1rm)?Number(state.todayE1rm):positive(state.freshE1rm)?Number(state.freshE1rm):observed;
    const pct=RTS.percent(targetReps,7);
    if(!positive(today)||!pct)return response(kg,label,'outside_chart_hold','low',p);
    const blended=positive(observed)&&positive(state.freshE1rm)?Number(state.freshE1rm)*(1-p.observationBlend)+observed*p.observationBlend:today;
    const raw=blended*pct;
    let result=E.round(raw,kg,page,{upCap:p.upCap,downCap:p.downCap});
    const fromReps=Number(currentTarget?.reps?.min),toReps=Number(nextTarget.reps?.min);
    const converted=matchLoad(kg,row.reps,toReps,page,effortRpe[row.effort]||7,7);
    const repsChanged=Number.isInteger(fromReps)&&Number.isInteger(toReps)&&fromReps!==toReps;
    // The visible plan already names a load for these reps. Move that load with the chart.
    // Callers that omit it, including the session simulator, keep the capped blend.
    if(repsChanged&&finiteLoad(nextRow?.kg)!=null&&converted!=null)result=converted;
    else {
      const warmed=sessionFloor(page,state.rows,nextTarget);
      if(warmed!=null&&result!=null&&result<warmed)result=warmed;
    }
    return response(result,label,result>kg?'combined_projection_up':result<kg?'combined_projection_down':'combined_projection_hold','broad',p);
  }
  function finiteLoad(n){const x=Number(n);return Number.isFinite(x)&&x>=0?x:null;}
  function matchLoad(kg,fromReps,toReps,page,fromRpe=7,toRpe=7){
    const lifted=finiteLoad(kg);
    if(lifted==null)return null;
    const from=Number(fromReps),to=Number(toReps);
    if(!Number.isInteger(from)||!Number.isInteger(to)||from<1||to<1)return null;
    const source=RTS.percent(from,fromRpe),target=RTS.percent(to,toRpe);
    if(!source||!target)return null;
    return E.floor(lifted*target/source,page);
  }
  function firstWorkReps(page){
    try{const reps=Number(T.normalize(page).find(t=>t.purpose==='working')?.reps?.min);return Number.isInteger(reps)?reps:null;}catch{return null;}
  }
  function planLoad(page,nextTarget,held,planned){
    if(held!=null)return held;
    if(planned==null)return null;
    const from=firstWorkReps(page),to=Number(nextTarget?.reps?.min);
    if(!Number.isInteger(from)||!Number.isInteger(to)||from===to)return planned;
    return matchLoad(planned,from,to,page)??planned;
  }
  function provenLoad(page,row,nextTarget){
    const lifted=finiteLoad(row?.kg);
    if(lifted==null)return null;
    const matched=matchLoad(lifted,row?.reps,nextTarget?.reps?.min,page,effortRpe[row?.effort]||7,7);
    return matched!=null?matched:lifted;
  }
  function sessionFloor(page,rows,nextTarget){
    let best=null;
    for(const row of rows||[]){
      if(!row?.logged||row.deleted||row.skipped||(row.purpose!=='ramp'&&row.purpose!=='warmup'))continue;
      const kg=provenLoad(page,row,nextTarget);
      if(kg!=null&&(best==null||kg>best))best=kg;
    }
    return best;
  }
  const EPSILON=1e-7;
  function review(page,rows=[]) {
    let targets=[];try{targets=T.normalize(page);}catch{}
    const ordinaryTargets=targets.filter(ordinary),matched=[],workRows=rows.filter(r=>r?.purpose!=='ramp'&&r?.purpose!=='warmup'&&r?.purpose!=='amrap');
    const linked=workRows.some(r=>r?.targetId);
    for(let i=0;i<ordinaryTargets.length;i++)matched.push(linked?workRows.find(r=>r?.targetId===ordinaryTargets[i].id)||null:workRows[i]||null);
    const complete=ordinaryTargets.length>0&&matched.every(r=>r?.logged&&!r.deleted&&!r.skipped);
    const earned=complete&&matched.every((r,i)=>!r.miss&&Number(r.reps)>=ordinaryTargets[i].reps.max&&effortRank[r.effort]!=null&&effortRank[r.effort]<=effortRank.average);
    const first=matched[0],e1rm=first?estimate(first,page):null;
    const firstKg=positive(first?.kg)?Number(first.kg):null;
    const nextKg=firstKg==null?null:earned?(E.next(firstKg,page)??firstKg):firstKg;
    return {e1rm,nextKg,earned,calibrated:positive(e1rm),complete,ruleVersion:DEFAULT.version,sourceSetIds:positive(e1rm)&&first?.id?[first.id]:[]};
  }
  root.StrengthBrainCore={suggest,estimate,review,learn,supported,matchLoad};
})(typeof window!=='undefined'?window:globalThis);
