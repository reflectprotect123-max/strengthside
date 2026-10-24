/** Percent-of-1RM prescriptions: straight, build, back-off and drop sets. */
(function(root) {
  const rank={very_easy:0,easy:1,average:2,medium:2,hard:3,max_effort:4};
  function num(value) {
    if(!['number','string'].includes(typeof value)||String(value).trim()==='')return null;
    const n=Number(value);return Number.isFinite(n)?n:null;
  }
  function notesOf(page) {
    return [page?.notes,page?.prescription,page?.prescribed,page?.instructions,page?.coachNote];
  }
  function parsedNotes(page) {
    return root.StrengthNotes?.parse?.(notesOf(page))||{};
  }
  function setRoleOf(value,index,basis) {
    if(value==='drop'||value==='backoff')return value;
    if(basis==='top_set'&&index>0)return 'drop';
    return null;
  }
  function fromPayload(page) {
    const sets=Array.isArray(page?.setTargets)?page.setTargets:[];
    const pctLow=num(page?.pctLow),pctHigh=num(page?.pctHigh);
    const hasSet=sets.some(t=>num(t?.pctLow)!=null);
    if(pctLow==null&&!hasSet)return null;
    const lows=sets.map(t=>num(t?.pctLow)).filter(n=>n!=null);
    const rising=lows.length>=2&&lows.at(-1)>lows[0]+1e-8;
    return {
      mode:page.percentMode||(rising?'build':'straight'),
      pctLow:pctLow??Math.min(...lows),
      pctHigh:pctHigh??(num(sets.find(t=>num(t?.pctHigh)!=null)?.pctHigh)??pctLow??Math.max(...lows)),
      startPct:num(page.startPct),
      rpe:num(page.rpe),
      basis:page.percentBasis||'1rm',
      basisLift:page.basisLift||null,
      basisReps:num(page.basisReps),
      sets:sets.map((t,i)=>({
        reps:t?.reps?.min??t?.reps??null,
        pctLow:num(t?.pctLow)??pctLow,
        pctHigh:num(t?.pctHigh)??num(t?.pctLow)??pctHigh??pctLow,
        rpe:num(t?.rpe),
        effort:t?.effort||null,
        setRole:setRoleOf(t?.setRole,i,t?.percentBasis||page.percentBasis),
        percentBasis:t?.percentBasis||page.percentBasis||'1rm',
        basisLift:t?.basisLift||page.basisLift||null,
        basisReps:num(t?.basisReps)??num(page.basisReps),
      })),
    };
  }
  function fromNotes(page) {
    const p=parsedNotes(page);
    if(p.pctLow==null&&!p.percentSets?.length)return null;
    const sets=p.percentSets||[];
    const rising=sets.length>=2&&sets.at(-1).pctLow>sets[0].pctLow+1e-8;
    return {
      mode:p.percentMode||(rising?'build':'straight'),
      pctLow:p.pctLow,
      pctHigh:p.pctHigh??p.pctLow,
      startPct:p.startPct,
      rpe:p.rpe??null,
      basis:p.percentBasis||'1rm',
      basisLift:p.basisLift||null,
      basisReps:p.basisReps??null,
      sets,
    };
  }
  function normalize(page={}) {
    const payload=fromPayload(page),notes=fromNotes(page),src=payload||notes;
    if(!src||src.pctLow==null)return null;
    const count=Math.max(src.sets.length,Number(page.setCount)||0,Array.isArray(page.setTargets)?page.setTargets.length:0,1);
    const sets=Array.from({length:count},(_,i)=>{
      const authored=src.sets[i]||src.sets.at(-1)||{};
      return {
        reps:authored.reps??null,
        pctLow:authored.pctLow??src.pctLow,
        pctHigh:authored.pctHigh??src.pctHigh??src.pctLow,
        rpe:authored.rpe??src.rpe,
        effort:authored.effort||(authored.rpe!=null?root.StrengthNotes?.rpeToEffort(Number(String(authored.rpe).split(/[-–]/)[0])):null),
        setRole:authored.setRole||null,
        percentBasis:authored.percentBasis||src.basis,
        basisLift:authored.basisLift||src.basisLift,
        basisReps:authored.basisReps??src.basisReps,
      };
    });
    return {
      mode:src.mode||'straight',
      pctLow:src.pctLow,
      pctHigh:src.pctHigh??src.pctLow,
      startPct:src.startPct??null,
      rpe:src.rpe??null,
      basis:src.basis||'1rm',
      basisLift:src.basisLift||null,
      basisReps:src.basisReps??null,
      sets,
    };
  }
  function oneRm({page,history,records}={}) {
    const rx=normalize(page||{});
    if(rx?.basis==='other_lift'&&rx.basisLift) {
      const named=num(page?.basisOneRm);
      if(named>0)return named;
      const want=root.StrengthEquipment?.nameKey?.({title:rx.basisLift});
      for(const rec of Object.values(records||{})) {
        const prior=rec?.payload?.page;
        if(!prior||root.StrengthEquipment.nameKey(prior)!==want)continue;
        const kg=num(rec.payload?.row?.kg);
        if(prior.oneRm>0)return Number(prior.oneRm);
        if(kg>0&&rec.payload.row?.reps===1)return kg;
      }
    }
    const brain=num(history?.freshE1rm??history?.rolling??history?.startingScale);
    if(brain>0)return brain;
    const coach=num(page?.oneRm??page?.e1rm??parsedNotes(page).oneRm);
    if(coach>0)return coach;
    if(rx?.basis==='rep_weight'&&rx.basisReps>0) {
      const est=num(history?.freshE1rm??history?.rolling);
      if(est>0)return est*30/(30+rx.basisReps);
    }
    return null;
  }
  function toKg(pct,orm,page) {
    if(pct==null||!(orm>0)||!root.StrengthEquipment)return null;
    return root.StrengthEquipment.floor(orm*(pct/100),page);
  }
  function clampKg(kg,lowKg,highKg,page,{allowBelow=false}={}) {
    const E=root.StrengthEquipment;
    if(kg==null)return null;
    if(allowBelow&&lowKg!=null&&kg<lowKg-1e-8)return E.floor(kg,page);
    if(lowKg!=null&&kg<lowKg-1e-8)return E.floor(lowKg,page)??kg;
    if(highKg!=null&&kg>highKg+1e-8)return E.floor(highKg,page)??kg;
    return E.floor(kg,page)??kg;
  }
  function finishedKg(history) {
    const rows=history?.latest?.rows||[];
    const last=rows.filter(r=>r?.logged&&!r.miss&&r.purpose!=='ramp'&&r.purpose!=='warmup').at(-1);
    return num(last?.kg);
  }
  function isDrop(spec) {
    return !!spec&&(spec.setRole==='drop'||spec.setRole==='backoff');
  }
  function dropFraction(spec,rx) {
    const own=num(spec?.pctLow);
    const main=rx?.sets?.find(s=>!isDrop(s))?.pctLow??rx?.pctLow;
    if(own!=null&&(spec.percentBasis==='top_set'||spec.setRole)&&main!=null&&Math.abs(own-main)>1e-8)return own/100;
    return 0.875;
  }
  function workingKgs({page,rx,oneRm:orm,history}={}) {
    rx=rx||normalize(page);
    if(!rx||!(orm>0))return [];
    const E=root.StrengthEquipment;
    const lowKg=toKg(rx.pctLow,orm,page),highKg=toKg(rx.pctHigh??rx.pctLow,orm,page);
    const prior=finishedKg(history);
    const n=rx.sets.length,lastN=rx.mode==='build'?Math.min(2,n):0,climbEnd=n-lastN;
    const startPct=rx.startPct??(rx.mode==='build'?Math.max(40,(rx.pctLow||50)-15):rx.pctLow);
    const kgs=rx.sets.map((s,i)=>{
      if(isDrop(s))return null;
      if(s.pctLow!=null&&rx.sets.some((x,j)=>j!==i&&x.pctLow!=null&&Math.abs(x.pctLow-rx.pctLow)>1e-8)) {
        return toKg(s.pctLow,orm,page);
      }
      if(rx.mode==='build') {
        if(i>=climbEnd) {
          const slot=i-climbEnd,span=Math.max(1,lastN-1);
          const pct=lastN<=1||slot===0?rx.pctLow:rx.pctLow+((rx.pctHigh-rx.pctLow)*(slot/span));
          return clampKg(toKg(pct,orm,page),lowKg,highKg,page);
        }
        const t=climbEnd<=1?0:i/climbEnd;
        return toKg(startPct+(rx.pctLow-startPct)*t,page&&orm?orm:orm,page);
      }
      let kg=lowKg;
      if(prior!=null)kg=clampKg(E.floor(prior,page)??prior,lowKg,highKg,page);
      return kg;
    });
    const top=kgs.find(n=>n!=null);
    return kgs.map((kg,i)=>{
      if(kg!=null)return kg;
      if(top==null||!isDrop(rx.sets[i]))return kg;
      return E.floor(top*dropFraction(rx.sets[i],rx),page);
    });
  }
  function rampTargetKg({page,rx,oneRm:orm,firstWorkingKg}={}) {
    rx=rx||normalize(page);
    const bottom=orm&&rx?toKg(rx.pctLow,orm,page):null;
    return bottom??firstWorkingKg??null;
  }
  function topSetKg(rows) {
    const work=(rows||[]).filter(r=>r?.logged&&!r.miss&&r.purpose!=='ramp'&&r.purpose!=='warmup'&&num(r.kg)!=null);
    if(!work.length)return null;
    return Math.max(...work.map(r=>Number(r.kg)));
  }
  function adjust({page,row,nextRow,index,state,history}={}) {
    const rx=normalize(page);
    if(!rx)return null;
    const E=root.StrengthEquipment,orm=oneRm({page,history,records:state?.records});
    const authoredIndex=nextRow?.purpose==='working'||nextRow?.purpose==null?(Number.isInteger(nextRow?.workingIndex)?nextRow.workingIndex:Math.max(0,index-((state?.rows||[]).filter(r=>r.purpose==='ramp').length))):null;
    const nextSpec=authoredIndex==null?null:rx.sets[authoredIndex]||rx.sets.at(-1);
    const lowKg=toKg(rx.pctLow,orm,page),highKg=toKg(rx.pctHigh??rx.pctLow,orm,page);
    if(nextSpec&&isDrop(nextSpec)) {
      const top=topSetKg(state?.rows)??num(row?.kg);
      if(top==null)return {kg:null,reason:'percent_top_unresolved',target:nextSpec.effort||'average',confidence:'unknown'};
      return {kg:E.floor(top*dropFraction(nextSpec,rx),page),reason:'percent_of_top_set',target:nextSpec.effort||'average',confidence:'exact_reference'};
    }
    if(!(orm>0))return null;
    const current=num(row?.kg);
    if(current==null)return {kg:lowKg,reason:'percent_seed',target:nextSpec?.effort||'average',confidence:'provisional'};
    const targetEffort=nextSpec?.effort||row&&root.StrengthNotes?.rpeToEffort?.(rx.rpe)||'average';
    const targetRank=rank[targetEffort]??2;
    const miss=!!row?.miss;
    let kg=current;
    if(miss) {
      kg=E.floor(current*0.9,page)??current;
      return {kg,reason:'percent_miss_below',target:targetEffort,confidence:'low'};
    }
    const actualRank=rank[row?.effort];
    if(actualRank!=null&&actualRank<targetRank)kg=E.next(current,page)??current;
    else if(actualRank!=null&&actualRank>targetRank) {
      const lower=E.floor(current-1e-7,page);kg=lower??current;
    }
    kg=clampKg(kg,lowKg,highKg,page,{allowBelow:false});
    return {kg,reason:kg>current?'percent_up':kg<current?'percent_down':'percent_hold',target:targetEffort,confidence:'broad'};
  }
  root.StrengthPercent={normalize,oneRm,toKg,clampKg,workingKgs,rampTargetKg,finishedKg,topSetKg,adjust};
})(typeof window!=='undefined'?window:globalThis);
