(function (root) {
  const TRACK = root.TrainingCore.definitions;

  const SEED_EXERCISES = [
    ['bench_press','Bench Press','barbell','total','main',20,2.5],
    ['lat_pull_downs','Lat Pull Downs','machine','total','main'],
    ['back_squat','Back Squat','barbell','total','main',20,2.5],
    ['front_squat','Front Squat','barbell','total','main',20,2.5],
    ['snatch_grip_rack_deadlift','Snatch Grip Rack Deadlift','barbell','total','main',20,2.5],
    ['barbell_lateral_squat','Barbell Lateral Squat','barbell','total','main',20,2.5],
    ['goblet_box_squat','Goblet Box Squat','dumbbell','single','accessory',1],
    ['reverse_hypers','Reverse Hypers','machine','total','accessory'],
    ['double_leg_banded_leg_curls','Double Leg Banded Leg Curls','band','total','accessory'],
    ['garhammer_raises','Garhammer Raises','bodyweight','bodyweight','accessory'],
    ['farmer_carry','Farmer Carry','dumbbell','per_hand','carry',1],
    ['backwards_sled_drag','Backwards Sled Drag','sled','total','carry'],
  ];

  const SEED_CIRCUITS = [
    { title: 'Deadlift Warm-Up', instructions: 'Foam roll hamstrings\nActive straight leg raises' },
    { title: 'Bench Press Warm-Up', instructions: 'Foam roll pecs\nBiphasic pec stretch' },
    { title: 'Recovery Breathing', instructions: '10 nasal breaths\n5s inhale · 1s hold · 5s exhale' },
    { title: 'Cooldown', instructions: 'Worlds Greatest Stretch\nRecovery breathing' },
  ];

  function nid(prefix) {
    return prefix + '_' + Math.random().toString(36).slice(2, 9);
  }

  function clone(v) {
    return JSON.parse(JSON.stringify(v));
  }

  function inferredMetadata(title='') {
    if(root.StrengthEquipment?.infer) {
      const meta=root.StrengthEquipment.infer({title});
      const out={};
      for(const key of ['equipmentId','loadConvention','exerciseType','minimumKg','equipmentStepKg','barWeightKg']) {
        if(meta[key]!=null)out[key]=meta[key];
      }
      if(/farmer|suitcase|carry/i.test(title))out.exerciseType='carry';
      return out;
    }
    const value=String(title);
    if(/farmer|suitcase|carry/i.test(value))return {equipmentId:/dumbbell|\bdb\b/i.test(value)?'dumbbell':null,loadConvention:'per_hand',exerciseType:'carry'};
    if(/plank|\bhold\b/i.test(value))return {equipmentId:'bodyweight',loadConvention:'bodyweight',exerciseType:'hold'};
    if(/goblet/i.test(value))return {equipmentId:'dumbbell',loadConvention:'single',exerciseType:'accessory',minimumKg:1};
    if(/dumbbell|\bdb\b/i.test(value))return {equipmentId:'dumbbell',loadConvention:'per_hand',exerciseType:/curl|extension|raise|fly|flye|calf|kickback/i.test(value)?'accessory':null,minimumKg:1};
    if(/barbell/i.test(value))return {equipmentId:'barbell',loadConvention:'total',minimumKg:20,equipmentStepKg:2.5};
    if(/^(?:back squat|front squat|bench press|snatch grip rack deadlift)$/i.test(value.trim()))return {equipmentId:'barbell',loadConvention:'total',exerciseType:'main',minimumKg:20,equipmentStepKg:2.5};
    return {};
  }

  const LOAD_METADATA=['equipmentId','loadConvention','exerciseType','minimumKg','barWeightKg','equipmentStepKg','availableLoads'];

  function canonicalBlock(block) {
    const b={...block};
    for(const key of ['repMin','repMax','targetReps','targetRepMax','targetEffort','restSec','demoStartingKg'])delete b[key];
    return b;
  }

  function exerciseRecord(exercise) {
    const inferred=inferredMetadata(exercise.title),merged={...inferred,...exercise};
    return Object.fromEntries(Object.entries(merged).filter(([,value])=>value!=null));
  }

  function seedCatalog() {
    return {
      exercises: SEED_EXERCISES.map(([id,title,equipmentId,loadConvention,exerciseType,minimumKg,equipmentStepKg]) => exerciseRecord({
        id:`ex_${id}`,title,equipmentId,loadConvention,exerciseType,minimumKg,equipmentStepKg,
        columns: title === 'Garhammer Raises' ? ['reps'] : ['reps', 'weight_kg'],
      })),
      circuits: SEED_CIRCUITS.map((c) => ({
        id: nid('ci'),
        title: c.title,
        track: 'for_completion',
        instructions: c.instructions,
      })),
    };
  }

  function emptyState() {
    return {
      templates: [],
      catalog: seedCatalog(),
      assignments: {},
    };
  }

  function ensure(state) {
    if (!state || typeof state !== 'object') return emptyState();
    const next = {
      templates: Array.isArray(state.templates) ? state.templates.filter((t) => !root.StrengthOnly?.isConditioning(t)).map((t) => ({ ...t, blocks: (t.blocks || []).filter((b) => ['lift', 'circuit'].includes(b.kind)).map(b => {
        const reps = parseRepTarget(b.repTarget);
        // Preserve ranges saved before Reps and Rep Range had separate entry rules.
        return canonicalBlock(reps && reps.min !== reps.max && (b.columns || []).includes('reps') && !(b.columns || []).includes('meters')
          ? { ...b, columns: b.columns.map(c => c === 'reps' ? 'reps_range' : c) } : b);
      }) })) : [],
      catalog: state.catalog && Array.isArray(state.catalog.exercises)
        ? {...state.catalog,exercises:state.catalog.exercises.map(exerciseRecord)}
        : seedCatalog(),
      assignments: state.assignments && typeof state.assignments === 'object' ? state.assignments : {},
    };
    const templateIds = new Set(next.templates.map(t => t.id));
    next.assignments = Object.fromEntries(Object.entries(next.assignments).filter(([, id]) => templateIds.has(id)));
    if (!next.catalog.exercises.length && !next.catalog.circuits.length) next.catalog = seedCatalog();
    const byId=new Map(next.catalog.exercises.map(x=>[x.id,x])),byTitle=new Map(next.catalog.exercises.map(x=>[String(x.title||'').trim().toLowerCase(),x]));
    for(const template of next.templates)for(const block of template.blocks||[])if(block.kind==='lift'){
      const hit=block.exerciseId?byId.get(block.exerciseId):byTitle.get(String(block.title||'').trim().toLowerCase());
      if(hit){block.exerciseId=hit.id;for(const key of LOAD_METADATA)if(block[key]==null&&hit[key]!=null)block[key]=clone(hit[key]);}
      else Object.assign(block,{...inferredMetadata(block.title),...block});
    }
    return next;
  }

  function template(state, tid) {
    return (state.templates || []).find((t) => t.id === tid) || null;
  }

  function tempoText(value) {
    const chars = String(value || '').toUpperCase().replace(/[^0-9X]/g, '').slice(0, 4);
    return chars.length === 4 ? chars : '';
  }

  function lettered(tpl) {
    const rank = b => b.role === 'warmup' ? 0 : b.role === 'cooldown' ? 2 : 1;
    const blocks = (tpl.blocks || []).map((b) => ({ ...b })).sort((a,b) => rank(a)-rank(b));
    let code = 65;
    let i = 0;
    while (i < blocks.length) {
      const b = blocks[i];
      if (b.kind !== 'lift') {
        b.letter = String.fromCharCode(code++);
        i += 1;
        continue;
      }
      const run = [b];
      let j = i + 1;
      if (b.groupId) {
        while (j < blocks.length && blocks[j].kind === 'lift' && blocks[j].groupId === b.groupId) {
          run.push(blocks[j]);
          j += 1;
        }
      }
      const L = String.fromCharCode(code++);
      if (run.length === 1) run[0].letter = L;
      else run.forEach((x, n) => { x.letter = L + String(n + 1); });
      i = j;
    }
    return blocks;
  }

  function itemsFromInstructions(text) {
    const lines = String(text || '')
      .split(/\n+/)
      .map((s) => s.replace(/^\s*\d+[.)]\s*/, '').trim())
      .filter(Boolean);
    return lines.map((text, i) => ({ n: i + 1, text }));
  }

  const parseRepTarget = root.TrainingCore.repTarget;

  function rxFor(block) {
    if(Array.isArray(block.setTargets)&&!(block.columns||[]).includes('meters')){
      const text=t=>t.purpose==='amrap'?'AMRAP':t.reps.min===t.reps.max?String(t.reps.min):`${t.reps.min}-${t.reps.max}`;
      const work=block.setTargets.filter(t=>t.purpose!=='amrap').map(text);
      const same=work.length>0&&work.every(t=>t===work[0]);
      const body=same?`${work.length} x ${work[0]}`:work.join(' / ');
      return block.setTargets.some(t=>t.purpose==='amrap')?`${body} / AMRAP`:body;
    }
    const sets = Math.max(1, Number(block.setCount) || 3);
    const cols = block.columns || ['reps'];
    const hasReps = cols.some(c => c === 'reps' || c === 'reps_range');
    const repBit = hasReps ? (parseRepTarget(block.repTarget)?.text || (cols.includes('reps_range') ? '8-12' : '8')) : '';
    const prescribed = String(block.prescribed || '').trim();
    if (cols.includes('meters')) return prescribed ? `${sets} x ${prescribed} m` : (repBit ? `${sets} x ${repBit} m` : `${sets} x m`);
    if (hasReps) return `${sets} x ${repBit}`;
    if (cols[0] === 'seconds' || cols[0] === 'time_mmss') return prescribed ? `${sets} x ${prescribed} sec` : `${sets} x time`;
    return `${sets} sets`;
  }

  function sectionFor(block) {
    if (block.role === 'warmup') return 'Warm-Up';
    if (block.role === 'cooldown') return 'Cool-Down';
    if (block.kind === 'circuit') {
      if (/recover|cool/i.test(block.title || '')) return 'Recovery';
      return 'Warm-Up';
    }
    return 'Strength/Power';
  }

  function compile(tpl) {
    const blocks = [];
    let lastSection = '';
    for (const b of lettered({ ...tpl, blocks: (tpl.blocks || []).filter((b) => ['lift', 'circuit'].includes(b.kind)) })) {
      const section = sectionFor(b);
      if (section !== lastSection) {
        blocks.push({ kind: 'section', label: section.toUpperCase() });
        lastSection = section;
      }
      if (b.kind === 'circuit') {
        const recovery = /recover|cool/i.test(b.title || '');
        blocks.push({
          kind: recovery ? 'recovery' : 'warmup',
          letter: b.letter,
          title: b.title,
          items: itemsFromInstructions(b.instructions),
          bullets: recovery ? itemsFromInstructions(b.instructions).map((x) => x.text) : [],
          footer: 'For Completion',
          section,
        });
      } else {
        let columns = (b.columns || ['reps']).slice();
        const hasReps=columns.some(c=>c==='reps'||c==='reps_range');
        const targetInput={...b,columns,repTarget:b.repTarget||(columns.includes('reps_range')?'8-12':'8')};
        const setTargets=hasReps?root.StrengthTargets.normalize(targetInput):null;
        const rx = rxFor(Array.isArray(b.setTargets)?{...b,setTargets}:b);
        const tempo = tempoText(b.tempo);
        blocks.push({
          kind: 'lift',
          targetContractVersion: 2,
          letter: b.letter,
          title: b.title,
          prescription: tempo ? `${rx} · ${tempo}` : rx,
          tempo: tempo || undefined,
          prescribed: b.prescribed || '',
          countIn: Number(b.countIn) || 0,
          role: b.role || null,
          setTargets: setTargets?clone(setTargets):null,
          notes: b.notes || [],
          columns,
          setCount: setTargets?.length||b.setCount,
          exerciseId: b.exerciseId,
          coachAssignmentId: b.coachAssignmentId,
          coachExerciseId: b.coachExerciseId,
          coachBlockId: b.coachBlockId,
          equipmentId: b.equipmentId,
          equipmentStepKg: b.equipmentStepKg,
          availableLoads: b.availableLoads,
          minimumKg: b.minimumKg,
          barWeightKg: b.barWeightKg,
          loadConvention: b.loadConvention,
          exerciseType: b.exerciseType,
          rampCount: b.rampCount,
          section,
        });
      }
    }
    return {
      id: tpl.id,
      title: tpl.title || 'Session Template',
      instructions: tpl.instructions || '',
      coachAssignedIds: tpl.coachAssignedIds || [],
      blocks,
      dots: {},
    };
  }

  function planForDate(state, date, fallback) {
    const st = ensure(state);
    const tid = st.assignments[date];
    const tpl = tid && st.templates.find((t) => t.id === tid);
    if (!tpl) return fallback || null;
    const plan = compile(tpl);
    plan.dots = Object.fromEntries(Object.keys(st.assignments).map((d) => [d, true]));
    return plan;
  }

  function deleteTemplate(state, tid) {
    const st = clone(ensure(state));
    st.templates = st.templates.filter((t) => t.id !== tid);
    for (const [d, id] of Object.entries(st.assignments)) {
      if (id === tid) delete st.assignments[d];
    }
    return st;
  }

  function trackLabel(key) {
    const hit = TRACK.find((t) => t.key === key);
    return hit ? hit.label : key;
  }

  const HybridLibrary = {
    TRACK,
    emptyState,
    ensure,
    template,
    deleteTemplate,
    tempoText,
    lettered,
    compile,
    parseRepTarget,
    rxFor,
    planForDate,
    trackLabel,
  };

  root.HybridLibrary = HybridLibrary;
})(typeof window !== 'undefined' ? window : globalThis);
