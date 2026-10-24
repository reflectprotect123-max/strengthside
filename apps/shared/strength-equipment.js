/** Shared equipment loads and provisional product defaults. Edit this canonical source. */
(function(root) {
  const VERSION='equipment-starters-v1';
  const EPS=1e-8;
  function number(value) {
    if(!['number','string'].includes(typeof value)||String(value).trim()==='')return null;
    const n=Number(value);return Number.isFinite(n)&&n>=0?n:null;
  }
  function identity(page) {
    if(typeof page.equipmentId==='string'&&page.equipmentId.trim())return page.equipmentId.trim().toLowerCase();
    const title=page.title||'';
    if(/\bdumbbell\b|\bdb\b/i.test(title))return 'dumbbell';
    if(/\bbarbell\b/i.test(title))return 'barbell';
    return '';
  }
  function unique(loads) {return [...new Set(loads)].sort((a,b)=>a-b);}
  function explicitLoads(page) {
    return Array.isArray(page.availableLoads)?unique(page.availableLoads.map(number).filter(n=>n!=null)):[];
  }
  function metadata(page) {
    const unit=page.loadUnit||'',convention=page.loadConvention||'',equipment=identity(page);
    const canonicalBar=['barbell_plates','barbell_total'].includes(convention);
    const declared=canonicalBar?number(page.barWeightKg??page.minimumKg):(number(page.minimumKg)??number(page.barWeightKg));
    const db=equipment==='dumbbell'&&unit==='kg'&&['per_hand','single'].includes(convention);
    const bar=equipment==='barbell'&&unit==='kg'&&(canonicalBar?declared>0:convention==='total'&&declared!=null);
    // Legacy `total` is the existing plates keypad convention, never a persisted-load inference.
    const plates=convention==='total'||convention==='barbell_plates';
    const grid=(number(page.equipmentStepKg)??0)>0&&declared!=null&&(!canonicalBar||bar);
    return {unit,convention,declared,db,bar,plates,grid};
  }
  function profile(page={}) {
    const m=metadata(page);
    const explicit=explicitLoads(page);
    if(explicit.length) {
      const loads=explicit;
      return {loads,step:0,min:loads[0]??0,convention:m.convention,unit:m.unit};
    }
    const step=m.db?2.5:m.bar?(number(page.equipmentStepKg)||2.5):m.grid?number(page.equipmentStepKg):0;
    // Grids remain in display units: plates start at 0; explicit totals include the bar.
    const min=m.db?Math.max(1,m.declared??1):m.bar?(m.plates?0:m.declared):m.grid?m.declared:0;
    const loads=m.db?[1,2,3,4,5,6,7,8,9,10,12.5,15,17.5,20].filter(n=>n>=min):m.bar||m.grid?[min,min+step]:[];
    return {loads,step,min,convention:m.convention,unit:m.unit};
  }
  // Seed profiles stay compact; supply neighboring rungs around every queried value.
  // This covers high loads without allocating a ladder with an arbitrary upper limit.
  function rack(page,values) {
    const p=profile(page),m=metadata(page);
    if(explicitLoads(page).length||!p.step)return p.loads;
    const loads=[...p.loads];
    for(const value of [...values,p.min]) {
      const base=m.db?10:p.min;
      const index=Math.floor((value-base)/p.step);
      for(const offset of [-1,0,1,2]) {
        const n=base+(index+offset)*p.step;
        if(n>=p.min&&(!m.db||n>=12.5)&&Number.isFinite(n))loads.push(n);
      }
    }
    return unique(loads);
  }
  function floor(value,page={}) {
    value=number(value);if(value==null)return null;
    return rack(page,[value]).filter(n=>n<=value+EPS).at(-1)??null;
  }
  function next(value,page={}) {
    value=number(value);if(value==null)return null;
    return rack(page,[value]).find(n=>n>value+EPS)??null;
  }
  function round(value,current,page={},options={}) {
    value=number(value);current=number(current);
    if(value==null||current==null)return null;
    const upCap=number(options.upCap)??.05,downCap=number(options.downCap)??.05;
    if(Math.abs(value-current)<=EPS)return current;
    const up=value>current,low=up?current:Math.max(0,current*(1-downCap)),high=up?current*(1+upCap):current;
    const loads=rack(page,[value,current,low,high]);
    const candidates=loads.filter(n=>n>=low-EPS&&n<=high+EPS);
    if(!up&&!candidates.some(n=>n<current-EPS)) {
      // A miss may require one coarse reduction beyond the percentage cap.
      return loads.filter(n=>n<current-EPS).at(-1)??current;
    }
    candidates.push(current); // A manually logged actual always remains a hold option.
    candidates.sort((a,b)=>Math.abs(a-value)-Math.abs(b-value)||a-b);
    return candidates[0];
  }
  function loadedName(title) {
    return /\bdumbbell\b|\bdb\b|\bbarbell\b|\bkettlebell\b|\bkb\b|\bweighted\b|\bband\b/i.test(title);
  }
  function cardioName(title) {
    return /^(row|ski|run|jog|bike|cycle|erg|assault|echo|jump\s*rope|rower)(\b|$|\s|\d)/i.test(title)
      &&!loadedName(title)
      &&!/bench|press|squat|deadlift|lunge|rdl|seated|bent|chest|pendlay|meadow/i.test(title);
  }
  function guessedEquipment(title) {
    if(/bodyweight/i.test(title)&&!loadedName(title))return 'bodyweight';
    if(cardioName(title))return 'bodyweight';
    if((/plank|rollout|foam roller|\bhold\b|isometric|hollow|dead bug|bird.?dog|stretch|mobility/i.test(title)&&!loadedName(title))
      ||(/\bjump\b/i.test(title)&&!loadedName(title)))return 'bodyweight';
    if(/\bdumbbell\b|\bdb\b/i.test(title))return 'dumbbell';
    if(/kettlebell|\bkb\b/i.test(title))return 'kettlebell';
    if(/cable/i.test(title))return 'cable';
    if(/machine|lat pull|leg press|hack squat|pec deck|smith/i.test(title))return 'machine';
    if(/bench|press|squat|deadlift|rdl|row|lunge|hinge|good morning|thruster|clean|snatch|rack/i.test(title))return 'barbell';
    return '';
  }
  function infer(page={}) {
    const title=String(page.title||page.name||'');
    const declared=typeof page.equipmentId==='string'&&page.equipmentId.trim()?page.equipmentId.trim().toLowerCase():'';
    const equipment=declared||guessedEquipment(title);
    const out={equipmentId:equipment||null,loadUnit:page.loadUnit||'kg',weighted:false};
    if(page.loadConvention)out.loadConvention=page.loadConvention;
    else if(equipment==='dumbbell')out.loadConvention=/goblet/i.test(title)?'single':'per_hand';
    else if(equipment==='kettlebell')out.loadConvention=/double|pair/i.test(title)?'per_hand':'single';
    else if(equipment==='bodyweight')out.loadConvention='added_bodyweight';
    else if(equipment)out.loadConvention='total';
    if(equipment==='bodyweight') {
      out.exerciseType=/hold|plank|isometric/i.test(title)?'hold':'bodyweight';
      out.weighted=false;
    } else if(equipment==='dumbbell') {
      if(page.minimumKg==null)out.minimumKg=1;
      out.exerciseType=/curl|extension|raise|fly|flye|calf|kickback/i.test(title)?'accessory':null;
      out.weighted=true;
    } else if(equipment==='kettlebell') {
      if(page.minimumKg==null)out.minimumKg=4;
      out.weighted=true;
    } else if(equipment==='machine'||equipment==='cable') {
      if(page.minimumKg==null)out.minimumKg=0;
      if(page.equipmentStepKg==null)out.equipmentStepKg=1;
      out.weighted=true;
    } else if(equipment==='barbell') {
      if(page.minimumKg==null&&out.loadConvention!=='barbell_plates')out.minimumKg=20;
      if(page.equipmentStepKg==null)out.equipmentStepKg=2.5;
      if(page.barWeightKg==null&&out.loadConvention!=='barbell_plates')out.barWeightKg=20;
      out.exerciseType=/curl|extension|raise|fly|calf/i.test(title)?'accessory':'main';
      out.weighted=true;
    }
    for(const key of ['minimumKg','barWeightKg','equipmentStepKg','exerciseType','loadUnit']) {
      if(page[key]!=null&&page[key]!=='')out[key]=page[key];
    }
    if(page.equipmentId!=null&&page.equipmentId!=='')out.equipmentId=typeof page.equipmentId==='string'?page.equipmentId.trim().toLowerCase()||page.equipmentId:page.equipmentId;
    if(/\bjump\b/i.test(title)&&!loadedName(title)) {
      out.equipmentId='bodyweight';
      out.loadConvention='added_bodyweight';
      out.exerciseType='bodyweight';
      out.weighted=false;
    }
    return out;
  }
  function apply(page={}) {
    const meta=infer(page);
    const next={...page};
    for(const key of ['equipmentId','loadConvention','loadUnit','minimumKg','barWeightKg','equipmentStepKg','exerciseType']) {
      if((next[key]==null||next[key]==='')&&meta[key]!=null)next[key]=meta[key];
    }
    next.weighted=meta.weighted;
    return next;
  }
  function namedDesired(page,title) {
    const m=metadata(page);
    if(m.bar)return m.plates?0:(m.declared??20);
    if(m.db&&m.convention==='single')return /\bgoblet squat\b/i.test(title)?6:6;
    if(m.db&&m.convention==='per_hand') {
      if(/\blateral raise\b/i.test(title))return 2;
      if(/\bcurl\b/i.test(title))return 4;
      if(/\bbench press\b/i.test(title))return 5;
      if(/\boverhead press\b/i.test(title))return 4;
      if(/\brow\b/i.test(title))return 6;
      if(/deadlift|rdl|lunge|squat/i.test(title))return 6;
      return 4;
    }
    const eq=identity(page);
    if(eq==='kettlebell')return 8;
    if(eq==='cable')return 5;
    if(eq==='machine')return 10;
    if(eq==='barbell') {
      if(page.loadConvention==='barbell_plates'&&number(page.barWeightKg)==null&&number(page.minimumKg)==null)return null;
      return m.plates?0:(m.declared??20);
    }
    if(eq==='dumbbell')return 4;
    if(page.loadUnit==='kg'&&(m.grid||m.convention==='total'))return m.declared??10;
    return null;
  }
  function gridPage(page) {
    const m=metadata(page);
    if(m.db||m.bar||m.grid||explicitLoads(page).length)return page;
    const eq=identity(page);
    if(eq==='dumbbell')return {...page,loadConvention:'per_hand',loadUnit:'kg',minimumKg:page.minimumKg??1};
    if(eq==='barbell')return {...page,loadConvention:page.loadConvention||'total',loadUnit:'kg',minimumKg:page.minimumKg??20,equipmentStepKg:page.equipmentStepKg??2.5};
    return {...page,loadConvention:page.loadConvention||'total',loadUnit:'kg',minimumKg:page.minimumKg??0,equipmentStepKg:page.equipmentStepKg??1};
  }
  function starter(page={}) {
    const filled=apply(page),unknown=reason=>({kg:null,confidence:'unknown',reason});
    if(filled.loadUnit&&filled.loadUnit!=='kg')return unknown('unsupported_unit');
    if(filled.equipmentId==='bodyweight'||filled.exerciseType==='hold'||filled.weighted===false)return unknown('bodyweight');
    const title=String(filled.title||'').trim();
    const desired=namedDesired(filled,title);
    if(desired==null)return unknown('unsupported_equipment_convention_or_exercise');
    const usable=gridPage(filled);
    const p=profile(usable),kg=floor(Math.max(desired,p.min),usable);
    if(kg==null)return unknown('no_available_load');
    return {kg,confidence:'provisional',reason:VERSION+':provisional_exercise_default'};
  }
  function label(page={},kg) {
    if(kg==null||kg==='')return '';
    const n=number(kg);if(n==null)return '';
    const m=metadata(page);
    return m.bar&&n===(m.plates?0:m.declared)?'empty bar':String(n);
  }
  function nameKey(page={}) {
    return String(page.title||page.name||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  }
  function emptyBarKg(page={}) {
    const filled=apply(page),m=metadata(filled);
    if(!(m.bar||filled.equipmentId==='barbell'))return 0;
    if(filled.loadConvention==='barbell_plates')return 0;
    return number(filled.barWeightKg)||20;
  }
  function plausibleWorking(page={},kg) {
    const n=number(kg);
    if(n==null||n<=0)return false;
    const filled=apply(page);
    if(filled.equipmentId==='barbell'||metadata(filled).bar) {
      if(n<=emptyBarKg(filled)+EPS)return false;
      if(n<20-EPS)return false;
    }
    return true;
  }
  root.StrengthEquipment={profile,floor,next,round,starter,label,infer,apply,nameKey,emptyBarKg,plausibleWorking};
})(typeof window!=='undefined'?window:globalThis);
