(function (root) {
  function parseRx(prescription) {
    const raw = String(prescription || '').replace(/\s·\s[0-9X]{4}(?=\s|$)/gi, '');
    const m = raw.match(/(\d+)\s*[x×]\s*(\d+|MAX)(?:\s*[-–—]\s*(\d+))?/i);
    if (!m) return { setCount: 3, targetReps: 8, targetRepMax: 8, isMax: false };
    const isMax = String(m[2]).toUpperCase() === 'MAX';
    return {
      setCount: Number(m[1]),
      targetReps: isMax ? null : Number(m[2]),
      targetRepMax: isMax ? null : Math.max(Number(m[2]), Number(m[3] || m[2])),
      isMax,
    };
  }

  function logModeFor(block, rx) {
    if (block.kind === 'warmup' || block.kind === 'recovery') return 'complete';
    if (rx.isMax) return 'max';
    // Legacy plans used letter F for bodyweight finishers; a block that
    // declares a weight column is a loaded lift whatever its letter.
    const weighted = (block.columns || []).some((c) => ['weight_kg', 'weight_lb', 'weight_pct', 'lwp'].includes(c));
    if (!weighted && /^F\d/i.test(block.letter || '')) return 'reps';
    return 'kg';
  }

  function emptySets(page) {
    if (page.logMode === 'complete' || page.logMode === 'doneHub' || page.logMode === 'superset') return [];
    const rows = [];
    const targets=Array.isArray(page.setTargets)?page.setTargets:[];
    for (let i = 0; i < page.setCount; i++) {
      const target=targets[i];
      const cells = {};
      const strengthHold = page.section !== 'Warm-Up' && page.section !== 'Cool-Down' && /plank|hang|\bhold\b/i.test(page.title || '') && (page.columns || []).includes('seconds');
      if (page.prescribed && (page.columns || []).includes('seconds') && !strengthHold) cells.seconds = String(page.prescribed);
      if (page.prescribed && (page.columns || []).includes('time_mmss')) cells.time_mmss = String(page.prescribed);
      if (page.prescribed && (page.columns || []).includes('meters')) cells.meters = String(page.prescribed);
      rows.push({
        targetId:target?.id||null,
        purpose:page.section === 'Cool-Down' ? 'cooldown' : page.section === 'Warm-Up' ? 'warmup' : (target?.purpose||'working'),
        workingIndex:targets.slice(0,i).filter(t=>t.purpose!=='warmup').length,
        reps: target?.purpose==='amrap'||page.logMode === 'max' ? null : target?.reps?.min??page.targetReps,
        kg: null,
        cells,
        logged: false,
        miss: false,
      });
    }
    return rows;
  }

  function letterParts(letter) {
    const m = String(letter || '').match(/^([A-Za-z]+)(\d+)$/);
    if (!m) return null;
    return { base: m[1].toUpperCase(), n: Number(m[2]) };
  }

  function logIdsForPage(page) {
    if (page && page.logMode === 'superset') return (page.members || []).map((m) => m.id);
    return page ? [page.id] : [];
  }

  function memberOf(page, memberId) {
    if (!page || page.logMode !== 'superset') return page;
    return (page.members || []).find((m) => m.id === memberId || m.letter === memberId) || page.members[0];
  }

  function ensureLog(session, page) {
    session.logs = session.logs || {};
    if (page.logMode === 'superset') {
      for (const m of page.members || []) {
        if (!session.logs[m.id]) {
          session.logs[m.id] = {
            completed: false,
            sets: emptySets(m),
            note: '',
          };
        }
      }
      return session.logs[(page.members && page.members[0] && page.members[0].id) || page.id];
    }
    if (!session.logs[page.id]) {
      session.logs[page.id] = {
        completed: false,
        sets: emptySets(page),
        note: '',
      };
    }
    return session.logs[page.id];
  }

  function getLog(session, page, memberId) {
    ensureLog(session, page);
    if (page.logMode === 'superset') {
      const m = memberOf(page, memberId);
      return session.logs[m.id];
    }
    return session.logs[page.id];
  }

  function clone(session) {
    return JSON.parse(JSON.stringify(session));
  }

  function restSeconds(block) {
    const direct = Number(block && block.restSec);
    if (Number.isFinite(direct) && direct > 0) return Math.round(direct);
    const text = [block && block.prescription, block && block.note, ...((block && block.notes) || [])].filter(Boolean).join(' ');
    const named = String(text).match(/\brest\s+(\d+)\s*(?:s|sec|secs|seconds)?\b/i);
    if (named) return Number(named[1]);
    const trailing = String(text).match(/\b(\d+)\s*(?:s|sec|seconds)\s+rest\b/i);
    return trailing ? Number(trailing[1]) : 0;
  }

  function pageFromBlock(block) {
    const cols = Array.isArray(block.columns) ? block.columns.filter(Boolean).map(root.TrainingCore.canonical) : [];
    let prescribed = block.prescribed || '';
    if (!prescribed && cols.includes('meters')) {
      const meters = String(block.prescription || '').match(/(\d+)\s*m\b/i);
      if (meters) prescribed = meters[1];
    }
    let setTargets=Array.isArray(block.setTargets)?JSON.parse(JSON.stringify(block.setTargets)):null;
    if(!setTargets&&cols.some(c=>c==='reps'||c==='reps_range')){
      try{setTargets=JSON.parse(JSON.stringify(root.StrengthTargets.normalize(block)));}catch{}
    }
    const rx=setTargets?{setCount:setTargets.length,targetReps:null,targetRepMax:null,isMax:false}
      :block.targetContractVersion===2?{setCount:Math.max(1,Number(block.setCount)||1),targetReps:null,targetRepMax:null,isMax:false}
      :parseRx(block.prescription);
    const mode = cols.length && !cols.includes('weight_kg') && !cols.includes('weight_lb') && !cols.includes('weight_pct') && !cols.includes('lwp')
      ? (rx.isMax ? 'max' : 'reps')
      : logModeFor(block, rx);
    return {
      id: block.letter || block.title,
      letter: block.letter || '',
      title: block.title || '',
      kind: block.kind,
      logMode: mode,
      prescription: block.prescription || '',
      tempo: block.tempo || null,
      barWeightKg: block.barWeightKg ?? null,
      notes: block.notes || [],
      items: block.items || [],
      bullets: block.bullets || [],
      note: block.note || '',
      goal: block.goal || '',
      footer: block.footer || '',
      section: block.section || (block.kind === 'recovery' ? 'Recovery' : block.kind === 'warmup' ? 'Prep' : 'Strength/Power'),
      setCount: mode === 'complete' ? 0 : (setTargets?.length||Number(block.setCount) || rx.setCount),
      setTargets,
      ...(setTargets||block.targetContractVersion===2?{}:{targetReps:rx.targetReps,targetRepMax:rx.targetRepMax}),
      exerciseId: block.exerciseId || block.libraryExerciseId || null,
      coachAssignmentId: block.coachAssignmentId || null,
      coachExerciseId: block.coachExerciseId || null,
      coachBlockId: block.coachBlockId || null,
      equipmentId: block.equipmentId || null,
      equipmentStepKg: Number(block.equipmentStepKg) > 0 ? Number(block.equipmentStepKg) : null,
      availableLoads: Array.isArray(block.availableLoads) ? block.availableLoads : [],
      minimumKg: block.minimumKg==null?null:Number(block.minimumKg),
      loadConvention: block.loadConvention || null,
      loadUnit: cols.includes('weight_lb') ? 'lb' : 'kg',
      exerciseType: block.exerciseType || null,
      rampCount: block.rampCount,
      bodyRegion: block.bodyRegion || null,
      startingKg: Number(block.startingKg) > 0 ? Number(block.startingKg) : null,
      columns: cols,
      prescribed,
      restSec: restSeconds(block),
      countIn: Number(block.countIn) || 0,
      eachSide: block.eachSide === true,
      askEffort: block.section !== 'Warm-Up' && block.section !== 'Cool-Down',
    };
  }

  function expandWarmupRounds(members) {
    const out = [];
    for (const member of members) {
      const roundSection = member.section === 'Warm-Up' || member.section === 'Cool-Down';
      if (!roundSection || member.logMode === 'complete') {
        out.push(member);
        continue;
      }
      const rounds = Math.max(1, member.setCount || 1);
      for (let r = 0; r < rounds; r++) {
        const one = JSON.parse(JSON.stringify(member));
        one.setCount = 1;
        one.round = r + 1;
        one.rounds = rounds;
        one.id = member.id + '-r' + (r + 1);
        if (Array.isArray(one.setTargets)) one.setTargets = one.setTargets[r] ? [one.setTargets[r]] : null;
        out.push(one);
      }
    }
    return out;
  }

  function pagesFromPlan(plan) {
    const members = [];
    for (const block of (plan && plan.blocks) || []) {
      if (!block || !['lift', 'warmup', 'recovery'].includes(block.kind)) continue;
      members.push(pageFromBlock(block));
    }
    const ordered = expandWarmupRounds(members);
    const pages = [];
    members.length = 0;
    ordered.forEach((member) => members.push(member));
    for (let i = 0; i < members.length; i++) {
      const a = members[i];
      const pa = letterParts(a.letter);
      if (!pa) {
        pages.push(a);
        continue;
      }
      const group = [a];
      let j = i + 1;
      while (j < members.length) {
        const pb = letterParts(members[j].letter);
        if (!pb || pb.base !== pa.base || pb.n !== pa.n + (j - i)) break;
        group.push(members[j]);
        j += 1;
      }
      if (group.length >= 2) {
        pages.push({
          id: pa.base,
          letter: pa.base,
          title: group.map((m) => m.title).join(' / '),
          kind: 'lift',
          logMode: 'superset',
          prescription: '',
          notes: [],
          items: [],
          bullets: [],
          note: '',
          goal: '',
          footer: '',
          section: a.section,
          setCount: 0,
          restSec: Math.max(0, ...group.map((member) => Number(member.restSec) || 0)),
          members: group,
        });
        i = j - 1;
      } else {
        pages.push(a);
      }
    }
    pages.push({
      id: 'done',
      letter: '',
      title: 'Done Training',
      kind: 'doneHub',
      logMode: 'doneHub',
      setCount: 0,
    });
    return pages;
  }

  function attachLogs(session) {
    for (const page of session.pages) ensureLog(session, page);
    return session;
  }

  function startSession({ date, plan, letter, existing } = {}) {
    const pages = pagesFromPlan(plan);
    const slotKey = (plan && plan.slotKey) || date;
    if (existing && existing.date === date && (existing.slotKey || existing.date) === slotKey && existing.phase !== 'summary' && !letter) {
      const s = root.TrainingCore.migrateSession(clone(existing));
      s.pages = s.pages?.length ? s.pages : pages;
      for(const log of Object.values(s.logs||{}))for(const row of log.sets||[])
        if(row.logged&&row.context?.inputVersion!==3&&!root.StrengthContext?.normalizeLoad(row.context?.normalizedLoad)?.eligible)
          row.context={...(row.context||{}),loadAmbiguous:true};
      return attachLogs(s);
    }
    const session = attachLogs({
      id: root.crypto?.randomUUID?.() || String(Date.now()),
      date,
      slotKey,
      title: (plan && plan.title) || '',
      instructions: (plan && plan.instructions) || '',
      coachAssignedIds: (plan && plan.coachAssignedIds) || [],
      phase: letter ? 'block' : 'quote',
      inputContractVersion:3,
      completedAt:null,
      blockIndex: 0,
      startedAt: Date.now(),
      pages,
      logs: {},
      liftMemory: {},
      feel: { intensity: null, durationMin: 0, note: '' },
      unit: 'kg',
    });
    if (letter) {
      const idx = pages.findIndex((p) => pageMatchesLetter(p, letter));
      session.blockIndex = idx >= 0 ? idx : 0;
    }
    return session;
  }

  function ackQuote(session) {
    const s = clone(session);
    s.phase = 'coach';
    return s;
  }

  function ackCoach(session) {
    const s = clone(session);
    if(s.phase==='summary')s.completedAt=null;
    s.phase = 'block';
    s.blockIndex = s.blockIndex || 0;
    return s;
  }

  function currentPage(session) {
    return session.pages[session.blockIndex] || session.pages[0];
  }

  function nextPage(session) {
    const s = clone(session);
    if(s.phase==='summary')s.completedAt=null;
    s.phase = 'block';
    s.blockIndex = Math.min(s.pages.length - 1, (s.blockIndex || 0) + 1);
    return s;
  }

  function prevPage(session) {
    const s = clone(session);
    if(s.phase==='summary')s.completedAt=null;
    s.phase = 'block';
    s.blockIndex = Math.max(0, (s.blockIndex || 0) - 1);
    return s;
  }

  function pageMatchesLetter(page, letter) {
    if (!page) return false;
    if (page.id === letter || page.letter === letter) return true;
    return (page.members || []).some((m) => m.id === letter || m.letter === letter);
  }

  function goToLetter(session, letter) {
    const s = clone(session);
    const idx = s.pages.findIndex((p) => pageMatchesLetter(p, letter));
    if (idx >= 0) s.blockIndex = idx;
    if(s.phase==='summary')s.completedAt=null;
    s.phase = 'block';
    return s;
  }

  function completeCurrent(session) {
    const s = clone(session);
    const page = currentPage(s);
    const log = ensureLog(s, page);
    log.completed = true;
    return s;
  }

  function canLogRow(row,page) { return root.TrainingCore.validateRow(row,page).ok; }

  function logSet(session, setIndex, patch, memberId, options = {}) {
    const s = clone(session);
    const page = currentPage(s);
    const log = getLog(s, page, memberId);
    const row = log.sets[setIndex];
    if (!row) return s;
    const liftPage = page.logMode === 'superset' ? memberOf(page, memberId) : page;
    const wasLogged=row.logged,previousKg=row.kg;
    if (patch.reps != null) row.reps = Number(patch.reps);
    if (Object.prototype.hasOwnProperty.call(patch, 'kg')) row.kg = patch.kg == null ? null : Number(patch.kg);
    if (patch.cells && typeof patch.cells === 'object') {
      row.cells = { ...(row.cells || {}), ...patch.cells };
    }
    if (patch.miss != null) row.miss = !!patch.miss;
    if (patch.effort !== undefined) row.effort = patch.effort;
    if (patch.context && typeof patch.context === 'object') row.context = { ...(row.context || {}), ...patch.context };
    if(root.StrengthLoad&&((!wasLogged&&!row.context?.loadAmbiguous)||row.context?.inputVersion===3||(patch.kg!=null&&Number(patch.kg)!==previousKg))) {
      row.context={...(row.context||{}),inputVersion:3,normalizedLoad:root.StrengthLoad.fromPage({page:liftPage,value:row.kg,provenance:'explicit'})};
    } else if(wasLogged&&!row.context?.normalizedLoad) row.context={...(row.context||{}),loadAmbiguous:true};
    row.logged = options.commit === false ? false : canLogRow(row, liftPage);
    if (row.logged) s.lastLoggedAt = Date.now();
    return s;
  }

  function toggleLogged(session, setIndex, memberId) {
    const s = clone(session);
    const page = currentPage(s);
    const log = getLog(s, page, memberId);
    const row = log.sets[setIndex];
    if (!row) return s;
    if(row.logged&&row.context?.inputVersion!==3&&!root.StrengthContext?.normalizeLoad(row.context?.normalizedLoad)?.eligible)row.context={...(row.context||{}),loadAmbiguous:true};
    row.logged = row.logged ? false : canLogRow(row, page.logMode === 'superset' ? memberOf(page, memberId) : page);
    return s;
  }

  function autofillFrom(session, setIndex, memberId) {
    const s = clone(session);
    const page = currentPage(s);
    const log = getLog(s, page, memberId);
    const src = log.sets[setIndex];
    if (!src) return s;
    for (let i = setIndex + 1; i < log.sets.length; i++) {
      if (log.sets[i].logged) continue;
      log.sets[i].kg = src.kg;
      if (src.reps != null) log.sets[i].reps = src.reps;
      if (src.cells && src.cells.meters != null) log.sets[i].cells = { ...(log.sets[i].cells || {}), meters: src.cells.meters };
    }
    return s;
  }

  function rowSeconds(row) {
    const cells = (row && row.cells) || {};
    if (cells.seconds != null && cells.seconds !== '') {
      const n = Number(cells.seconds);
      if (Number.isFinite(n)) return n;
    }
    const clock = String(cells.time_mmss || '');
    const match = clock.match(/^(\d+):(\d{2})$/);
    return match ? Number(match[1]) * 60 + Number(match[2]) : 0;
  }

  function totals(session) {
    let reps = 0;
    let kg = 0;
    let sets = 0;
    let meters = 0;
    let seconds = 0;
    for (const page of session.pages || []) {
      const members = page.logMode === 'superset' ? (page.members || []) : [page];
      for (const member of members) {
        const log = (session.logs || {})[member.id];
        if (!log) continue;
        const columns = member.columns || [];
        const countsReps = !columns.length || columns.some((column) => column === 'reps' || column === 'reps_range');
        for (const row of log.sets || []) {
          if (!row.logged) continue;
          sets += 1;
          const count = Number(row.reps) || 0;
          // Plate-loaded barbells log plates only; volume uses the real load (bar included) when known.
          const ext = row.context?.normalizedLoad?.externalKg;
          const weight = typeof ext === 'number' && Number.isFinite(ext) ? ext : (Number(row.kg) || 0);
          // Each-side sets are saved per side; count both sides in every total.
          const sides = member.eachSide === true || /\(each side\)/i.test(member.title || '') ? 2 : 1;
          if (countsReps) reps += count * sides;
          const hands=row.context?.normalizedLoad?.convention==='per_hand'?2:1;
          if (countsReps && count > 0) kg += weight * count * hands * sides;
          meters += (Number(row.cells && row.cells.meters) || 0) * sides;
          seconds += rowSeconds(row) * sides;
        }
      }
    }
    return { reps, kg, volumeKg: kg, sets, meters, seconds };
  }

  function rowsOf(session, member) {
    return (((session.logs || {})[member.id] || {}).sets) || [];
  }

  function supersetSteps(session, page) {
    if (!page || page.logMode !== 'superset') return [];
    const members = page.members || [];
    const indexed = members.map((member) => rowsOf(session, member).map((row, index) => ({ row, index })));
    const steps = [];
    const maxRamp = Math.max(0, ...indexed.map((rows) => rows.filter((item) => item.row.purpose === 'ramp').length));
    for (let round = 0; round < maxRamp; round++) {
      members.forEach((member, memberIndex) => {
        const ramp = indexed[memberIndex].filter((item) => item.row.purpose === 'ramp')[round];
        if (!ramp) return;
        steps.push({ memberId: member.id, letter: member.letter, setIndex: ramp.index, purpose: 'ramp', round: round + 1 });
      });
    }
    const maxWork = Math.max(0, ...indexed.map((rows) => rows.filter((item) => item.row.purpose !== 'ramp').length));
    for (let round = 0; round < maxWork; round++) {
      members.forEach((member, memberIndex) => {
        const work = indexed[memberIndex].filter((item) => item.row.purpose !== 'ramp')[round];
        if (!work) return;
        steps.push({ memberId: member.id, letter: member.letter, setIndex: work.index, purpose: 'working', round: round + 1 });
      });
    }
    return steps;
  }

  function currentSupersetRound(session, page) {
    const steps = supersetSteps(session, page);
    const pending = steps.find((step) => !rowsOf(session, { id: step.memberId })[step.setIndex]?.logged);
    if (!pending) return { steps, round: null, purpose: null, members: [] };
    const members = steps.filter((step) => step.purpose === pending.purpose && step.round === pending.round && !rowsOf(session, { id: step.memberId })[step.setIndex]?.logged);
    return { steps, round: pending.round, purpose: pending.purpose, members };
  }

  function recordPrep(session, phase, items) {
    const s = clone(session);
    const name = phase === 'cooldown' ? 'cooldown' : 'warmup';
    s.prep = {
      ...(s.prep || {}),
      [name]: (Array.isArray(items) ? items : []).map((item) => ({
        id: item.id,
        title: item.title || '',
        status: item.status === 'skipped' ? 'skipped' : 'completed',
      })),
    };
    return s;
  }

  function openFeel(session) {
    const s = clone(session);
    s.phase = 'feel';
    const started = s.startedAt || Date.now();
    const mins = Math.max(1, Math.round((Date.now() - started) / 60000));
    s.feel = s.feel || {};
    if (!s.feel.durationMin) s.feel.durationMin = mins;
    return s;
  }

  function setFeel(session, feel) {
    const s = clone(session);
    s.feel = { ...(s.feel || {}), ...feel };
    return s;
  }

  function finishToSummary(session) {
    const s = clone(session);
    s.phase = 'summary';
    s.completedAt=new Date().toISOString();
    // Finished from history (no feel step): minutes run from the start to the last logged set.
    s.feel = s.feel || {};
    if (!s.feel.durationMin && s.startedAt) {
      const end = s.lastLoggedAt || Date.now();
      s.feel.durationMin = Math.max(1, Math.round((end - s.startedAt) / 60000));
    }
    return s;
  }

  function summaryStats(session) {
    const t = totals(session);
    let exercises = 0;
    let sets = 0;
    let blocksDone = 0;
    const workPages = session.pages.filter((p) => p.logMode !== 'doneHub');
    for (const page of workPages) {
      if (page.logMode === 'complete') {
        const log = (session.logs || {})[page.id];
        if (log && log.completed) {
          exercises += 1;
          blocksDone += 1;
        }
        continue;
      }
      let pageSets = 0;
      let pageExercises = 0;
      for (const id of logIdsForPage(page)) {
        const log = (session.logs || {})[id];
        if (!log) continue;
        const logged = (log.sets || []).filter((r) => r.logged).length;
        if (logged) {
          pageExercises += 1;
          pageSets += logged;
        }
      }
      if (pageExercises) {
        exercises += pageExercises;
        sets += pageSets;
        blocksDone += 1;
      }
    }
    return {
      exercises,
      sets: t.sets,
      reps: t.reps,
      kg: t.kg,
      meters: t.meters,
      seconds: t.seconds,
      blocksDone,
      blocksTotal: workPages.length,
      minutes: (session.feel && session.feel.durationMin) || 0,
      prep: session.prep || {},
    };
  }

  const HybridSession = {
    parseRx,
    pagesFromPlan,
    seedOpeningLoads: (session) => session,
    startSession,
    ackQuote,
    ackCoach,
    currentPage,
    nextPage,
    prevPage,
    goToLetter,
    completeCurrent,
    logSet,
    toggleLogged,
    autofillFrom,
    logIdsForPage,
    memberOf,
    totals,
    supersetSteps,
    currentSupersetRound,
    recordPrep,
    openFeel,
    setFeel,
    finishToSummary,
    summaryStats,
  };

  root.HybridSession = HybridSession;
  if (typeof module !== 'undefined' && module.exports) module.exports = HybridSession;
})(typeof globalThis !== 'undefined' ? globalThis : this);
