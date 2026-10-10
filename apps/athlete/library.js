(function (root) {
  const TRACK = root.TrainingCore.definitions;

  const SEED_EXERCISES = [
    'Bench Press',
    'Lat Pull Downs',
    'Back Squat',
    'Front Squat',
    'Snatch Grip Rack Deadlift',
    'Barbell Lateral Squat',
    'Goblet Box Squat',
    'Reverse Hypers',
    'Double Leg Banded Leg Curls',
    'Garhammer Raises',
    'Farmer Carry',
    'Backwards Sled Drag',
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

  function seedCatalog() {
    return {
      exercises: SEED_EXERCISES.map((title) => ({
        id: nid('ex'),
        title,
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
        return reps && reps.min !== reps.max && (b.columns || []).includes('reps') && !(b.columns || []).includes('meters')
          ? { ...b, columns: b.columns.map(c => c === 'reps' ? 'reps_range' : c) } : b;
      }) })) : [],
      catalog: state.catalog && Array.isArray(state.catalog.exercises)
        ? state.catalog
        : seedCatalog(),
      assignments: state.assignments && typeof state.assignments === 'object' ? state.assignments : {},
    };
    const templateIds = new Set(next.templates.map(t => t.id));
    next.assignments = Object.fromEntries(Object.entries(next.assignments).filter(([, id]) => templateIds.has(id)));
    if (!next.catalog.exercises.length && !next.catalog.circuits.length) next.catalog = seedCatalog();
    return next;
  }

  function template(state, tid) {
    return (state.templates || []).find((t) => t.id === tid) || null;
  }

  function createTemplate(state, { title, instructions } = {}) {
    const st = clone(ensure(state));
    st.templates.unshift({
      id: nid('tpl'),
      title: String(title || 'Session Template').trim() || 'Session Template',
      instructions: String(instructions || ''),
      blocks: [],
    });
    return st;
  }

  function patchTemplate(state, tid, patch) {
    const st = clone(ensure(state));
    const t = st.templates.find((x) => x.id === tid);
    if (!t) return st;
    Object.assign(t, patch);
    return st;
  }

  function addCircuit(state, tid, { title, instructions, catalogId } = {}) {
    const st = clone(ensure(state));
    const t = st.templates.find((x) => x.id === tid);
    if (!t) return st;
    let instr = instructions || '';
    let name = title || 'Circuit';
    if (catalogId) {
      const hit = st.catalog.circuits.find((c) => c.id === catalogId);
      if (hit) {
        name = hit.title;
        instr = hit.instructions || instr;
      }
    }
    t.blocks.push({
      id: nid('blk'),
      kind: 'circuit',
      title: name,
      instructions: instr,
      track: 'for_completion',
    });
    return st;
  }

  function addExercise(state, tid, { title, setCount, columns, notes, catalogId, restSec } = {}) {
    const st = clone(ensure(state));
    const t = st.templates.find((x) => x.id === tid);
    if (!t) return st;
    let cols = Array.isArray(columns) && columns.length ? columns.slice() : ['reps', 'weight_kg'];
    let name = title || 'Exercise';
    if (catalogId) {
      const hit = st.catalog.exercises.find((c) => c.id === catalogId);
      if (hit) {
        name = hit.title;
        cols = (hit.columns || cols).slice();
      }
    }
    cols = cols.filter((k) => k && k !== 'none');
    if (!cols.length) cols = ['reps'];
    t.blocks.push({
      id: nid('blk'),
      kind: 'lift',
      title: name,
      setCount: Math.max(1, Number(setCount) || 3),
      repTarget: cols.includes('reps_range') ? '8-12' : '8',
      columns: cols,
      notes: Array.isArray(notes) ? notes : [],
      restSec: restSec == null ? 120 : Number(restSec) || 0,
      groupId: null,
    });
    return st;
  }

  function removeBlock(state, tid, bid) {
    const st = clone(ensure(state));
    const t = st.templates.find((x) => x.id === tid);
    if (!t) return st;
    t.blocks = t.blocks.filter((b) => b.id !== bid);
    return st;
  }

  function moveBlock(state, tid, bid, dir) {
    const st = clone(ensure(state));
    const t = st.templates.find((x) => x.id === tid);
    if (!t) return st;
    const i = t.blocks.findIndex((b) => b.id === bid);
    const j = i + (dir < 0 ? -1 : 1);
    if (i < 0 || j < 0 || j >= t.blocks.length) return st;
    const tmp = t.blocks[i];
    t.blocks[i] = t.blocks[j];
    t.blocks[j] = tmp;
    return st;
  }

  function patchBlock(state, tid, bid, patch) {
    const st = clone(ensure(state));
    const t = st.templates.find((x) => x.id === tid);
    if (!t) return st;
    const b = t.blocks.find((x) => x.id === bid);
    if (!b) return st;
    Object.assign(b, patch);
    if (Array.isArray(b.columns)) b.columns = b.columns.filter((k) => k && k !== 'none');
    if (Array.isArray(patch.setTargets)) {
      const targets=root.StrengthTargets.normalize({...b,setTargets:patch.setTargets});
      b.setTargets=targets;b.setCount=targets.length;
      const first=targets.find(x=>x.purpose==='working');
      if(first?.reps)b.repTarget=first.reps.min===first.reps.max?String(first.reps.min):`${first.reps.min}-${first.reps.max}`;
    } else if ((patch.setCount!=null||patch.repTarget!=null) && Array.isArray(b.setTargets)) {
      delete b.setTargets;
    }
    return st;
  }

  function linkSuperset(state, tid, aId, bId) {
    const st = clone(ensure(state));
    const t = st.templates.find((x) => x.id === tid);
    if (!t) return st;
    const a = t.blocks.find((x) => x.id === aId);
    const b = t.blocks.find((x) => x.id === bId);
    if (!a || !b || a.kind !== 'lift' || b.kind !== 'lift') return st;
    const gid = a.groupId || b.groupId || nid('ss');
    a.groupId = gid;
    b.groupId = gid;
    return st;
  }

  function unlinkSuperset(state, tid, bid) {
    const st = clone(ensure(state));
    const t = st.templates.find((x) => x.id === tid);
    if (!t) return st;
    const b = t.blocks.find((x) => x.id === bid);
    if (b) b.groupId = null;
    return st;
  }

  function lettered(tpl) {
    const blocks = (tpl.blocks || []).map((b) => ({ ...b }));
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
    if(Array.isArray(block.setTargets)&&!(block.columns||[]).includes('meters'))return block.setTargets.map(t=>t.purpose==='amrap'?'AMRAP':t.reps.min===t.reps.max?String(t.reps.min):`${t.reps.min}-${t.reps.max}`).join(' / ');
    const sets = Math.max(1, Number(block.setCount) || 3);
    const cols = block.columns || ['reps'];
    const hasReps = cols.some(c => c === 'reps' || c === 'reps_range');
    const repBit = hasReps ? (parseRepTarget(block.repTarget)?.text || (cols.includes('reps_range') ? '8-12' : '8')) : '';
    if (cols.includes('meters')) return repBit ? `${sets} x ${repBit} m` : `${sets} x m`;
    if (hasReps) return `${sets} x ${repBit}`;
    if (cols[0] === 'seconds' || cols[0] === 'time_mmss') return `${sets} x time`;
    return `${sets} sets`;
  }

  function sectionFor(block) {
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
        const hasReps=(b.columns||[]).some(c=>c==='reps'||c==='reps_range');
        const targetInput={...b,repTarget:b.repTarget||((b.columns||[]).includes('reps_range')?'8-12':'8')};
        const setTargets=hasReps?root.StrengthTargets.normalize(targetInput):null;
        const first=setTargets?.find(t=>t.purpose==='working');
        blocks.push({
          kind: 'lift',
          letter: b.letter,
          title: b.title,
          prescription: rxFor(Array.isArray(b.setTargets)?{...b,setTargets}:b),
          repMin: first?.reps?.min,
          repMax: first?.reps?.max,
          setTargets: setTargets?clone(setTargets):null,
          notes: b.notes || [],
          columns: (b.columns || ['reps']).slice(),
          setCount: setTargets?.length||b.setCount,
          restSec: b.restSec,
          exerciseId: b.exerciseId,
          equipmentId: b.equipmentId,
          equipmentStepKg: b.equipmentStepKg,
          availableLoads: b.availableLoads,
          minimumKg: b.minimumKg,
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
      blocks,
      dots: {},
    };
  }

  function assignDate(state, tid, date) {
    const st = clone(ensure(state));
    if (!st.templates.some((t) => t.id === tid)) return st;
    st.assignments[date] = tid;
    return st;
  }

  function unassignDate(state, date) {
    const st = clone(ensure(state));
    delete st.assignments[date];
    return st;
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

  function createCatalogExercise(state, { title, columns } = {}) {
    const st = clone(ensure(state));
    const cols = (columns || ['reps']).filter((k) => k && k !== 'none');
    st.catalog.exercises.unshift({
      id: nid('ex'),
      title: String(title || 'Exercise').trim() || 'Exercise',
      columns: cols.length ? cols : ['reps'],
    });
    return st;
  }

  function createCatalogCircuit(state, { title, instructions } = {}) {
    const st = clone(ensure(state));
    st.catalog.circuits.unshift({
      id: nid('ci'),
      title: String(title || 'Circuit').trim() || 'Circuit',
      track: 'for_completion',
      instructions: instructions || '',
    });
    return st;
  }

  function searchCatalog(state, tab, q) {
    const st = ensure(state);
    const needle = String(q || '').trim().toLowerCase();
    const list = tab === 'circuits' ? st.catalog.circuits : st.catalog.exercises;
    if (!needle) return list.slice();
    return list.filter((x) => x.title.toLowerCase().includes(needle));
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
    createTemplate,
    patchTemplate,
    deleteTemplate,
    addCircuit,
    addExercise,
    removeBlock,
    moveBlock,
    patchBlock,
    linkSuperset,
    unlinkSuperset,
    lettered,
    compile,
    parseRepTarget,
    rxFor,
    assignDate,
    unassignDate,
    planForDate,
    createCatalogExercise,
    createCatalogCircuit,
    searchCatalog,
    trackLabel,
  };

  root.HybridLibrary = HybridLibrary;
})(typeof window !== 'undefined' ? window : globalThis);
