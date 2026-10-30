/** Canonical strength policy. Physical load maths is separate from display/rack units. */
(function(root) {
  const T=root.StrengthTargets,E=root.StrengthEquipment,DEFAULT=root.StrengthPolicy;
  const effortRpe={average:7,medium:7,hard:9};
  const effortRank={very_easy:0,easy:1,average:2,medium:2,hard:3,max_effort:4};
  const positive=n=>typeof n==='number'&&Number.isFinite(n)&&n>0;
  const ordinary=t=>t&&t.purpose==='working';
  // Normalise stored effort spellings ('Hard', 'medium', 'rpe9') to the five canonical ratings.
  function effortOf(raw) {
    if(typeof raw!=='string')return null;
    let e=raw.trim().toLowerCase().replace(/[\s-]+/g,'_');
    if(e==='medium')e='average';else if(e==='max'||e==='max_effort'||e==='failure')e='max_effort';else if(e==='veryeasy')e='very_easy';
    const rpe=e.match(/^rpe_?(\d+(?:\.\d+)?)$/);
    if(rpe){const n=Number(rpe[1]);e=n>=10?'max_effort':n>=8.5?'hard':n>=6.5?'average':n>=5?'easy':'very_easy';}
    return Object.prototype.hasOwnProperty.call(effortRank,e)&&e!=='medium'?e:null;
  }
  function finiteLoad(n){if(!['number','string'].includes(typeof n)||String(n).trim()==='')return null;const x=Number(n);return Number.isFinite(x)&&x>=0?x:null;}
  function policy(state){return {...DEFAULT,...(state?.policy||{})};}
  function normalized(kg,page) {return root.StrengthLoad?.fromPage({page,value:kg,provenance:'explicit'})??null;}
  function display(physical,page){const n=normalized(0,page);return n?root.StrengthLoad.displayKg({...n,externalKg:physical},n.convention,n.barKg):null;}
  function supported(page) {
    if(['Warm-Up','Cool-Down'].includes(page?.section)||['warmup','cooldown'].includes(page?.role))return false;
    const columns=page?.columns||[];
    if(!Array.isArray(columns))return false;
    const n=normalized(0,page);
    return !!n&&page.kind==='lift'&&page.loadUnit==='kg'&&
      columns.some(c=>c==='reps'||c==='reps_range')&&columns.includes('weight_kg')&&
      !/carry|farmer|suitcase|\bhold\b|plank|\bclean\b|\bsnatch\b|\bjump\b/i.test(page.title||'')&&
      !columns.some(c=>!['reps','reps_range','weight_kg'].includes(c));
  }
  function targetFor(page,row,index){try{return T.forRow(page,row,index);}catch{return null;}}
  function intended(target){return target?.purpose==='warmup'?'easy':'average';}
  function estimate(row,page) {
    if(!supported(page)||page.equipmentId==='bodyweight'||page.loadConvention==='added_bodyweight'||!row?.logged||row.deleted||row.skipped||row.miss||row.context?.loadAmbiguous||['ramp','warmup','amrap'].includes(row.purpose))return null;
    const reps=finiteLoad(row.reps),rpe=effortRpe[effortOf(row.effort)],n=normalized(row.kg,page);
    if(!Number.isInteger(reps)||reps<1||reps>12||rpe==null||!positive(n?.externalKg))return null;
    const pct=root.StrengthLearning?.fraction(reps+10-rpe,root.StrengthLearning.initial().k);
    return pct?n.externalKg/pct:null;
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
  function guard(physical,current,page,{transition=false,planned=null,p=DEFAULT}={}) {
    const source=normalized(current,page);if(!source||!Number.isFinite(physical)||physical<0)return finiteLoad(current);
    const raw=display(physical,page);if(raw==null)return finiteLoad(current);
    const mass=source.externalKg,profile=E.profile(page),minimum=normalized(profile.min,page)?.externalKg;
    if(Math.abs(physical-mass)<1e-8)return finiteLoad(current);
    const up=physical>mass,next=E.next(current,page);
    let low=Math.max(minimum??0,mass*(1-p.downCap)),high=mass;
    if(up){
      const plan=finiteLoad(planned),rung=E.next(plan??current,page);
      const stepLimit=normalized(rung,page)?.externalKg??mass;
      high=Math.max(mass,Math.min(mass*(1+(transition ? .1 : p.upCap)),stepLimit));
      if(!transition&&minimum!=null&&Math.abs(mass-minimum)<1e-8&&next!=null)high=normalized(next,page).externalKg;
      low=mass;
    }
    const values=[current,raw,display(low,page),display(high,page)];
    const loads=[current];
    for(const value of values){if(value==null)continue;const f=E.floor(value,page);if(f!=null){loads.push(f);const n=E.next(f,page);if(n!=null)loads.push(n);}}
    let allowed=[...new Set(loads)].filter(kg=>{const m=normalized(kg,page)?.externalKg;return m!=null&&m>=low-1e-8&&m<=high+1e-8;});
    if(!up&&!allowed.some(kg=>kg<current-1e-8)) {
      const lower=E.floor(current-1e-7,page);return lower??finiteLoad(current);
    }
    allowed.sort((a,b)=>Math.abs(a-raw)-Math.abs(b-raw)||a-b);
    return allowed[0]??finiteLoad(current);
  }
  function matchLoad(kg,fromReps,toReps,page,fromRpe=7,toRpe=7,k=root.StrengthLearning?.initial().k){
    const source=normalized(kg,page);if(!source)return null;
    const physical=root.StrengthLearning?.project({weight:source.externalKg,fromReps:Number(fromReps),fromRir:10-fromRpe,toReps:Number(toReps),targetRir:10-toRpe,k});
    const raw=physical==null?null:display(physical,page);return raw==null?null:E.floor(raw,page);
  }
  // Fixed steps, never percentages: +2.5 kg upper / +5 kg lower barbell, one rung on a DB/KB/machine ladder.
  const LOWER=/squat|deadlift|\brdl\b|romanian|hip thrust|glute bridge|lunge|split squat|step.?up|leg press|good morning|swing|calf/i;
  function lowerBody(page){return page?.bodyRegion?page.bodyRegion==='lower':LOWER.test(page?.title||'');}
  function barbell(page){return !(Array.isArray(page?.availableLoads)&&page.availableLoads.length)&&(page?.equipmentId==='barbell'||(!page?.equipmentId&&/\bbarbell\b/i.test(page?.title||'')))&&normalized(0,page)?.barKg>0;}
  function nearest(kg,page){const n=finiteLoad(kg);return n==null?null:(E.nearest?E.nearest(n,page):E.floor(n,page))??n;}
  function stepUp(kg,page,count=1){
    let out=finiteLoad(kg);if(out==null)return null;
    for(let i=0;i<count;i++){const next=barbell(page)?out+(lowerBody(page)?5:2.5):E.next(out,page);if(next==null)break;out=next;}
    return out;
  }
  // A missed set drops about 5% (at least one rung), never below 90% of the session's planned load.
  function dropFrom(kg,page,anchor){
    const cur=finiteLoad(kg);if(cur==null)return null;
    const below=E.floor(cur-1e-6,page);if(below==null)return cur;
    let out=barbell(page)||E.profile(page).step>0?Math.min(below,E.floor(cur*.95,page)??below):below;
    const base=finiteLoad(anchor)??cur,limit=base*(1-DEFAULT.downCap);
    if(out<limit-1e-8){const f=E.floor(limit,page);out=f!=null&&f>=limit-1e-8?f:E.next(f??0,page)??cur;}
    // A coarse DB/KB rung may exceed 10%; the first drop from plan is still allowed.
    if(out>=cur-1e-8&&cur>=base-1e-8)out=below;
    return out<cur-1e-8?out:cur;
  }
  // An unlogged row's current weight is its plan (coach or athlete may have typed it in).
  function planOf(row){return finiteLoad(row?.kg)??finiteLoad(row?.plannedKg);}
  function suggest({page,row,nextRow,index=0,state={}}) {
    const p=policy(state),nextTarget=targetFor(page,nextRow,index),label=intended(nextTarget),kg=finiteLoad(row?.kg);
    if(nextRow?.logged)return response(finiteLoad(nextRow.kg),label,'logged_actual','exact_reference',p);
    if(nextTarget?.loadRule?.kind==='first_working_set') {
      const ref=T.resolveReference(nextTarget,state.rows||[]);return response(ref,label,ref==null?'reference_unresolved':'first_working_set','exact_reference',p);
    }
    if(!supported(page)||!E||kg==null||!nextTarget||row?.context?.loadAmbiguous)return response(kg,label,'unsupported_or_unknown','unknown',p);
    const mass=normalized(kg,page).externalKg,currentTarget=targetFor(page,row,Math.max(0,index-1));
    const effort=effortOf(row.effort),planned=planOf(nextRow);
    // A 0 kg entry carries no load signal; keep the planned load rather than locking at 0.
    if(!(mass>0)&&!(page.loadConvention==='added_bodyweight'||page.equipmentId==='bodyweight')&&planned!=null&&planned>0)return response(planned,label,'no_load_reference','unknown',p);
    const reps=finiteLoad(row.reps),miss=!!row.miss||!Number.isInteger(reps)||reps<1||(ordinary(currentTarget)&&reps<currentTarget.reps.min);
    const ramp=['warmup','ramp'].includes(row.purpose)||currentTarget?.purpose==='warmup';
    if(ramp){
      // A ramp never projects onto work: working sets keep ibex's planned load.
      if(planned==null)return response(kg,label,'warmup_hold','directional',p);
      if(nextTarget.purpose==='warmup'||['ramp','warmup'].includes(nextRow?.purpose))return response(planned,label,'warmup_hold','directional',p);
      // No real working plan yet (cold placeholder): the athlete's calibrated ramp is the load.
      if(!(planned>0)&&kg>0){
        if(miss||effort==='hard'||effort==='max_effort'){const out=dropFrom(kg,page,kg);return response(out,label,out<kg?'ramp_struggle_reduce':'minimum_reached','low',p);}
        return response(kg,label,'ramp_calibrated','directional',p);
      }
      if(miss||effort==='hard'||effort==='max_effort'){const out=dropFrom(planned,page,planned);return response(out,label,out<planned?'ramp_struggle_reduce':'minimum_reached','low',p);}
      return response(planned,label,'working_load','directional',p);
    }
    const anchor=[row.plannedKg,page.workingKg,kg].map(finiteLoad).find(n=>n!=null&&n>0)??kg;
    if(miss){const out=dropFrom(kg,page,anchor);return response(out,label,out<kg?'reduce_after_incomplete':'minimum_reached','low',p);}
    if(row.effort!=null&&effort==null){const out=response(planned??kg,label,'unknown_effort','unknown',p);out.warning='unrecognised_effort';return out;}
    const cold=page.startConfidence!=null&&page.startConfidence!=='history';
    if(cold&&(effort==='very_easy'||effort==='easy')){
      const out=stepUp(kg,page,effort==='very_easy'?2:1);return response(out,label,out>kg?'cold_start_step':'easy_hold','directional',p);
    }
    // Everything else holds the load actually lifted: the athlete's change to this set
    // (lighter or heavier) carries to the next set in proportion to ibex's planned jumps.
    const own=finiteLoad(row.plannedKg);
    let out=planned??kg;
    if(own!=null&&own>0&&planned!=null&&Math.abs(kg-own)>1e-8)out=planned*kg/own;
    else if((own===0||planned===0)&&kg>0)out=kg; // an empty-bar placeholder is not a plan
    if(planned==null)out=kg;
    if(Math.abs(out-kg)>1e-8)out=nearest(out,page)??out; // the load actually used is always a valid hold
    return response(out,label,'hold_planned','directional',p);
  }
  // Next session's starting load from a whole session (ibex owns sets/reps).
  function sessionNext(page,rows=[],{partial=false}={}){
    let targets=[];try{targets=T.normalize(page);}catch{}
    const work=targets.filter(ordinary),linked=rows.some(r=>r?.targetId);
    const workRows=rows.filter(r=>r&&!['ramp','warmup','amrap'].includes(r.purpose));
    const matched=work.map((t,i)=>linked?workRows.find(r=>r.targetId===t.id)||null:workRows[i]||null);
    const done=matched.map((r,i)=>r?.logged&&!r.deleted&&!r.skipped?{r,t:work[i]}:null).filter(Boolean);
    const first=done[0]?.r,firstKg=finiteLoad(first?.kg);
    if(firstKg==null)return {nextKg:null,reason:'no_working_set'};
    const missed=done.some(({r,t})=>r.miss||!Number.isInteger(finiteLoad(r.reps))||finiteLoad(r.reps)<t.reps.min);
    if(missed)return {nextKg:dropFrom(firstKg,page,firstKg),reason:'missed_reps'};
    let ranks=done.map(({r})=>effortRank[effortOf(r.effort)]).filter(n=>n!=null);
    // The last set feeling one level harder is ordinary fatigue.
    if(ranks.length>1&&ranks.at(-1)===Math.max(...ranks.slice(0,-1))+1)ranks=ranks.slice(0,-1);
    // Only equal/fewer-rep targets compare: higher-rep sets may be lighter.
    const loadReduced=done.some(({r,t})=>t.reps.max<=done[0].t.reps.max&&finiteLoad(r.kg)!=null&&finiteLoad(r.kg)<firstKg-1e-8);
    if(!ranks.length||partial||loadReduced)return {nextKg:firstKg,reason:partial?'partial_session_hold':'hold'};
    const worst=Math.max(...ranks);
    if(worst===effortRank.very_easy)return {nextKg:stepUp(firstKg,page,2),reason:'very_easy_two_steps'};
    if(worst===effortRank.easy)return {nextKg:stepUp(firstKg,page,1),reason:'easy_one_step'};
    return {nextKg:firstKg,reason:'hold'};
  }
  function review(page,rows=[]) {
    let targets=[];try{targets=T.normalize(page);}catch{}
    const ordinaryTargets=targets.filter(ordinary),matched=[],workRows=rows.filter(r=>r?.purpose!=='ramp'&&r?.purpose!=='warmup'&&r?.purpose!=='amrap');
    const linked=workRows.some(r=>r?.targetId);
    for(let i=0;i<ordinaryTargets.length;i++)matched.push(linked?workRows.find(r=>r?.targetId===ordinaryTargets[i].id)||null:workRows[i]||null);
    const complete=ordinaryTargets.length>0&&matched.every(r=>r?.logged&&!r.deleted&&!r.skipped);
    const first=matched[0],e1rm=first?estimate(first,page):null;
    const firstKg=finiteLoad(first?.kg);
    // Finishing reps after backing off the load is not the same achievement.
    // Only compare equal/fewer-rep targets: higher-rep sets may be lighter.
    const loadReduced=firstKg!=null&&matched.some((r,i)=>r?.logged&&!r.deleted&&!r.skipped&&
      ordinaryTargets[i].reps.max<=ordinaryTargets[0].reps.max&&
      (finiteLoad(r.kg)==null||finiteLoad(r.kg)<firstKg-1e-8));
    const nextKg=sessionNext(page,rows).nextKg,earned=nextKg!=null&&firstKg!=null&&nextKg>firstKg+1e-8;
    return {e1rm,nextKg,earned,loadReduced,calibrated:positive(e1rm),complete,ruleVersion:DEFAULT.version,sourceSetIds:positive(e1rm)&&first?.id?[first.id]:[]};
  }
  root.StrengthBrainCore={effortOf,suggest,sessionNext,stepUp,dropFrom,lowerBody,estimate,review,learn,supported,matchLoad,guard,normalized,display};
})(typeof window!=='undefined'?window:globalThis);
