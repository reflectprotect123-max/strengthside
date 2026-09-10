(function (root) {
  function parseRx(prescription) {
    const raw = String(prescription || '');
    const m = raw.match(/(\d+)\s*[x×]\s*(\d+|MAX)/i);
    if (!m) return { setCount: 3, targetReps: 8, isMax: false };
    const isMax = String(m[2]).toUpperCase() === 'MAX';
    return {
      setCount: Number(m[1]),
      targetReps: isMax ? null : Number(m[2]),
      isMax,
    };
  }

  function logModeFor(block, rx) {
    if (block.kind === 'warmup' || block.kind === 'recovery') return 'complete';
    if (rx.isMax) return 'max';
    if (/^F\d/i.test(block.letter || '')) return 'reps';
    return 'kg';
  }

  function emptySets(page) {
    if (page.logMode === 'complete' || page.logMode === 'doneHub') return [];
    const rows = [];
    for (let i = 0; i < page.setCount; i++) {
      rows.push({
        reps: page.logMode === 'max' ? null : page.targetReps,
        kg: null,
        logged: false,
        miss: false,
      });
    }
    return rows;
  }

  function ensureLog(session, page) {
    session.logs = session.logs || {};
    if (!session.logs[page.id]) {
      session.logs[page.id] = {
        completed: false,
        sets: emptySets(page),
        note: '',
      };
    }
    return session.logs[page.id];
  }

  function clone(session) {
    return JSON.parse(JSON.stringify(session));
  }

  function pagesFromPlan(plan) {
    const pages = [];
    for (const block of (plan && plan.blocks) || []) {
      if (!block || block.kind === 'section') continue;
      const rx = parseRx(block.prescription);
      const mode = logModeFor(block, rx);
      pages.push({
        id: block.letter || block.title,
        letter: block.letter || '',
        title: block.title || '',
        kind: block.kind,
        logMode: mode,
        prescription: block.prescription || '',
        notes: block.notes || [],
        items: block.items || [],
        bullets: block.bullets || [],
        note: block.note || '',
        goal: block.goal || '',
        footer: block.footer || '',
        section: block.section || (block.kind === 'recovery' ? 'Recovery' : block.kind === 'warmup' ? 'Prep' : 'Strength/Power'),
        setCount: mode === 'complete' ? 0 : rx.setCount,
        targetReps: rx.targetReps,
      });
    }
    pages.push({
      id: 'done',
      letter: '',
      title: 'Done Training',
      kind: 'doneHub',
      logMode: 'doneHub',
      setCount: 0,
      targetReps: null,
    });
    return pages;
  }

  function attachLogs(session) {
    for (const page of session.pages) ensureLog(session, page);
    return session;
  }

  function startSession({ date, plan, letter, existing } = {}) {
    const pages = pagesFromPlan(plan);
    if (existing && existing.date === date && existing.phase !== 'summary' && !letter) {
      const s = clone(existing);
      s.pages = pages;
      return attachLogs(s);
    }
    const session = attachLogs({
      date,
      phase: letter ? 'block' : 'quote',
      blockIndex: 0,
      startedAt: Date.now(),
      pages,
      logs: {},
      workingMax: {},
      feel: { intensity: null, durationMin: 0, note: '' },
      unit: 'kg',
    });
    if (letter) {
      const idx = pages.findIndex((p) => p.id === letter || p.letter === letter);
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
    s.phase = 'block';
    s.blockIndex = s.blockIndex || 0;
    return s;
  }

  function currentPage(session) {
    return session.pages[session.blockIndex] || session.pages[0];
  }

  function nextPage(session) {
    const s = clone(session);
    s.phase = 'block';
    s.blockIndex = Math.min(s.pages.length - 1, (s.blockIndex || 0) + 1);
    return s;
  }

  function prevPage(session) {
    const s = clone(session);
    s.phase = 'block';
    s.blockIndex = Math.max(0, (s.blockIndex || 0) - 1);
    return s;
  }

  function goToLetter(session, letter) {
    const s = clone(session);
    const idx = s.pages.findIndex((p) => p.id === letter || p.letter === letter);
    if (idx >= 0) s.blockIndex = idx;
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

  function logSet(session, setIndex, patch) {
    const s = clone(session);
    const page = currentPage(s);
    const log = ensureLog(s, page);
    const row = log.sets[setIndex];
    if (!row) return s;
    if (patch.reps != null) row.reps = Number(patch.reps);
    if (patch.kg != null) row.kg = Number(patch.kg);
    if (patch.miss != null) row.miss = !!patch.miss;
    row.logged = true;
    return s;
  }

  function toggleLogged(session, setIndex) {
    const s = clone(session);
    const page = currentPage(s);
    const log = ensureLog(s, page);
    const row = log.sets[setIndex];
    if (!row) return s;
    row.logged = !row.logged;
    return s;
  }

  function autofillFrom(session, setIndex) {
    const s = clone(session);
    const page = currentPage(s);
    const log = ensureLog(s, page);
    const src = log.sets[setIndex];
    if (!src) return s;
    for (let i = setIndex + 1; i < log.sets.length; i++) {
      if (log.sets[i].logged) continue;
      log.sets[i].kg = src.kg;
      if (src.reps != null) log.sets[i].reps = src.reps;
    }
    return s;
  }

  function totals(session) {
    let reps = 0;
    let kg = 0;
    for (const page of session.pages) {
      const log = (session.logs || {})[page.id];
      if (!log) continue;
      for (const row of log.sets || []) {
        if (!row.logged) continue;
        reps += Number(row.reps) || 0;
        kg += Number(row.kg) || 0;
      }
    }
    return { reps, kg };
  }

  function setWorkingMax(session, exerciseId, value) {
    const s = clone(session);
    s.workingMax = s.workingMax || {};
    s.workingMax[exerciseId] = Number(value);
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
    return s;
  }

  function summaryStats(session) {
    const t = totals(session);
    let exercises = 0;
    let sets = 0;
    let blocksDone = 0;
    const workPages = session.pages.filter((p) => p.logMode !== 'doneHub');
    for (const page of workPages) {
      const log = (session.logs || {})[page.id];
      if (!log) continue;
      if (page.logMode === 'complete') {
        if (log.completed) {
          exercises += 1;
          blocksDone += 1;
        }
      } else {
        const logged = (log.sets || []).filter((r) => r.logged).length;
        if (logged) {
          exercises += 1;
          sets += logged;
          blocksDone += 1;
        }
      }
    }
    return {
      exercises,
      sets,
      reps: t.reps,
      kg: t.kg,
      blocksDone,
      blocksTotal: workPages.length,
      minutes: (session.feel && session.feel.durationMin) || 0,
    };
  }

  const HybridSession = {
    parseRx,
    pagesFromPlan,
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
    totals,
    setWorkingMax,
    openFeel,
    setFeel,
    finishToSummary,
    summaryStats,
  };

  root.HybridSession = HybridSession;
  if (typeof module !== 'undefined' && module.exports) module.exports = HybridSession;
})(typeof globalThis !== 'undefined' ? globalThis : this);
