/**
 * THE Hybrid System — coaching loop (local-first).
 *
 * Same session / block / exercise / set-row shape as the Hybrid HTML athlete
 * app. Adds roster, teams, week×day programs, assignment, feed metrics, and
 * session notes. Zero network. Inject storage in tests.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.CoachLoop = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const STORAGE = 'THE-coach-loop-v1';
  const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const BLOCK_CATEGORIES = [
    'Prep',
    'Speed/Agility',
    'Skill/Tech',
    'Strength/Power',
    'Conditioning',
    'Recovery',
  ];
  const SCORING = ['completion', 'weight'];
  const METRICS = ['Reps', 'Weight', 'Time', 'Distance', 'RPE', 'Watts'];

  const IDS = {
    coachAccount: 'acct-dan',
    coach: 'coach-dan',
    athleteDan: 'ath-dan-veldman',
    athleteAlex: 'ath-alex-chen',
    athleteJordan: 'ath-jordan-hale',
    team: 'team-hybrid-sc',
    program: 'prog-hybrid-base',
    tplStrength: 'tpl-full-body-strength',
    tplCond: 'tpl-aerobic-cond',
    tplRecovery: 'tpl-recovery',
    logged: 'ses-logged-w1d1',
  };

  function uid(prefix) {
    return (prefix || 'id') + '_' + Math.random().toString(36).slice(2, 10);
  }

  function clone(x) {
    return JSON.parse(JSON.stringify(x));
  }

  function num(x) {
    const n = Number(x);
    return Number.isFinite(n) ? n : 0;
  }

  function localDate(d) {
    const x = d instanceof Date ? d : new Date(d);
    const tz = x.getTimezoneOffset() * 60000;
    return new Date(x.getTime() - tz).toISOString().slice(0, 10);
  }

  function today(clock) {
    return localDate(clock ? clock() : new Date());
  }

  function addDays(key, n) {
    const d = new Date(key + 'T00:00:00');
    d.setDate(d.getDate() + n);
    return localDate(d);
  }

  function mondayOf(key) {
    const d = new Date(key + 'T00:00:00');
    const m = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - m);
    return localDate(d);
  }

  function dayIndex(key) {
    return (new Date(key + 'T00:00:00').getDay() + 6) % 7; // 0=Mon
  }

  function dateLabel(key) {
    return new Date(key + 'T00:00:00').toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function cellKey(week, day) {
    return week + '-' + day;
  }

  function parseCellKey(k) {
    const [w, d] = String(k).split('-').map(Number);
    return { week: w, day: d };
  }

  function splitList(raw) {
    return String(raw == null ? '' : raw)
      .split(',')
      .map((x) => x.trim())
      .filter((x, i, a) => a.length > 1 || x !== '' || i === 0);
  }

  function parseFirstNumber(raw) {
    const m = String(raw || '').match(/(\d+(?:\.\d+)?)/);
    return m ? Number(m[1]) : 0;
  }

  function targetList(ex) {
    const count = Math.max(1, num(ex.sets) || 1);
    let parts = splitList(ex.reps);
    if (!parts.length || (parts.length === 1 && parts[0] === '')) parts = [''];
    if (parts.length === 1) parts = Array.from({ length: count }, () => parts[0]);
    while (parts.length < count) parts.push(parts[parts.length - 1]);
    return parts.slice(0, count);
  }

  function loadList(ex) {
    const count = Math.max(1, num(ex.sets) || 1);
    let parts = splitList(ex.load);
    if (!parts.length) parts = [''];
    if (parts.length === 1) parts = Array.from({ length: count }, () => parts[0]);
    while (parts.length < count) parts.push(parts[parts.length - 1] || '');
    return parts.slice(0, count);
  }

  function makeRows(ex) {
    const targets = targetList(ex);
    const loads = loadList(ex);
    return targets.map((target, i) => ({
      id: uid('row'),
      n: i + 1,
      target,
      targetKind: /s(ec(onds?)?)?$/i.test(String(target)) ? 'seconds' : 'reps',
      weight: '',
      reps: '',
      prescribedLoad: loads[i] || '',
      done: false,
      extra: false,
    }));
  }

  function ensureRows(ex) {
    if (!Array.isArray(ex.rows) || !ex.rows.length) ex.rows = makeRows(ex);
    return ex;
  }

  function isWorkBlock(block) {
    if (!block) return false;
    if (block.type === 'strength' || block.type === 'conditioning') return true;
    if (block.type === 'text') return String(block.notes || '').trim().length > 0;
    return false;
  }

  function letterBlocks(blocks) {
    let next = 0;
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    return (blocks || []).map((b) => {
      const block = clone(b);
      if (!isWorkBlock(block) && block.type === 'text') {
        block.letter = '';
        return block;
      }
      const ch = letters[next] || String(next + 1);
      next += 1;
      if (block.superset && (block.exercises || []).length > 1) {
        block.letters = (block.exercises || []).map((_, i) => ch + (i + 1));
        block.letter = block.letters.join('/');
      } else {
        block.letter = ch;
        block.letters = [ch];
      }
      return block;
    });
  }

  function categoryForBlock(block) {
    if (block.category && BLOCK_CATEGORIES.includes(block.category)) return block.category;
    if (block.type === 'conditioning') return 'Conditioning';
    if (block.type === 'text') {
      const h = String(block.heading || '').toLowerCase();
      if (/cool|recover|breath/.test(h)) return 'Recovery';
      return 'Prep';
    }
    if (/speed|agility/.test(String(block.heading || '').toLowerCase())) return 'Speed/Agility';
    return 'Strength/Power';
  }

  function scoringForBlock(block) {
    if (block.scoring === 'weight' || block.scoring === 'completion') return block.scoring;
    return block.type === 'strength' ? 'weight' : 'completion';
  }

  function decorateBlocks(blocks) {
    return letterBlocks(blocks).map((b) => {
      b.category = categoryForBlock(b);
      b.scoring = scoringForBlock(b);
      b.complete = !!b.complete;
      (b.exercises || []).forEach(ensureRows);
      return b;
    });
  }

  function volumeFromRows(rows) {
    return (rows || [])
      .filter((r) => r.done && r.targetKind !== 'seconds')
      .reduce((a, r) => a + num(r.weight) * num(r.reps), 0);
  }

  function sessionRows(session) {
    const out = [];
    for (const b of session.blocks || []) {
      for (const ex of b.exercises || []) {
        ensureRows(ex);
        for (const row of ex.rows || []) out.push(row);
      }
    }
    return out;
  }

  function volumeKg(session) {
    return Math.round(volumeFromRows(sessionRows(session)));
  }

  function prescribedTonnage(session) {
    let t = 0;
    for (const b of session.blocks || []) {
      for (const ex of b.exercises || []) {
        const reps = targetList(ex);
        const loads = loadList(ex);
        reps.forEach((rep, i) => {
          t += parseFirstNumber(rep) * parseFirstNumber(loads[i] || loads[0]);
        });
      }
    }
    return t;
  }

  function intensityPct(session) {
    if (session.intensity != null && session.intensity !== '') return num(session.intensity);
    const actual = volumeKg(session);
    const prescribed = prescribedTonnage(session);
    if (!actual || !prescribed) return null;
    return Math.round((100 * actual) / prescribed);
  }

  function blockProgress(session) {
    const blocks = (session.blocks || []).filter(isWorkBlock);
    const done = blocks.filter((b) => blockIsComplete(b)).length;
    return { done, total: blocks.length };
  }

  function blockIsComplete(block) {
    if (block.complete) return true;
    if (block.type === 'text') return !!block.complete;
    if (block.type === 'conditioning') return !!block.complete;
    const exercises = block.exercises || [];
    if (!exercises.length) return false;
    return exercises.every((ex) => {
      ensureRows(ex);
      const rows = ex.rows || [];
      return rows.length && rows.every((r) => r.done);
    });
  }

  function remainingSummary(session) {
    const blocks = (session.blocks || []).filter(isWorkBlock);
    const left = blocks.filter((b) => !blockIsComplete(b));
    return {
      blocksLeft: left.length,
      setsLeft: sessionRows(session).filter((r) => !r.done).length,
    };
  }

  function feedMetrics(session) {
    const prog = blockProgress(session);
    const intensity = intensityPct(session);
    const minutes = session.minutes == null || session.minutes === '' ? null : num(session.minutes);
    const readiness = session.readiness == null || session.readiness === '' ? null : num(session.readiness);
    return {
      blocksDone: prog.done,
      blocksTotal: prog.total,
      readiness,
      minutes,
      intensity,
      volumeKg: volumeKg(session),
    };
  }

  function groupFeed(sessions, athletes) {
    const byDate = {};
    for (const s of sessions || []) {
      if (s.status !== 'completed' && s.status !== 'active' && !sessionHasLog(s)) continue;
      const k = s.date;
      if (!byDate[k]) byDate[k] = [];
      const athlete = (athletes || []).find((a) => a.id === s.athleteId);
      byDate[k].push({
        session: s,
        athlete,
        metrics: feedMetrics(s),
      });
    }
    return Object.keys(byDate)
      .sort((a, b) => (a < b ? 1 : -1))
      .map((date) => ({ date, label: dateLabel(date), cards: byDate[date] }));
  }

  function sessionHasLog(session) {
    if (session.status === 'completed' || session.status === 'active') return true;
    return sessionRows(session).some((r) => r.done || num(r.weight) || num(r.reps));
  }

  function makeExercise(partial) {
    const ex = {
      id: partial.id || uid('ex'),
      name: partial.name,
      exerciseId: partial.exerciseId || '',
      category: partial.category || '',
      sets: partial.sets == null ? 3 : partial.sets,
      reps: partial.reps == null ? '8' : String(partial.reps),
      load: partial.load == null ? '' : String(partial.load),
      metric: partial.metric || 'Weight',
      restSec: partial.restSec == null ? 90 : partial.restSec,
      coachNote: partial.coachNote || '',
      athleteNote: partial.athleteNote || '',
      swappedFrom: partial.swappedFrom || null,
    };
    ensureRows(ex);
    return ex;
  }

  function makeBlock(partial) {
    const block = {
      id: partial.id || uid('blk'),
      type: partial.type || 'strength',
      heading: partial.heading || 'Block',
      notes: partial.notes || '',
      superset: !!partial.superset,
      category: partial.category || '',
      scoring: partial.scoring || '',
      complete: !!partial.complete,
      exercises: (partial.exercises || []).map(makeExercise),
      conditioningType: partial.conditioningType || '',
      modality: partial.modality || '',
      targetDurationMin: partial.targetDurationMin || 0,
    };
    return block;
  }

  function makeTemplate(partial) {
    return {
      id: partial.id || uid('tpl'),
      name: partial.name || 'Untitled session',
      coachInstructions: partial.coachInstructions || '',
      blocks: decorateBlocks((partial.blocks || []).map(makeBlock)),
    };
  }

  function instantiateSession(template, opts) {
    const blocks = decorateBlocks(clone(template.blocks || []));
    blocks.forEach((b) => {
      b.complete = false;
      (b.exercises || []).forEach((ex) => {
        ex.rows = makeRows(ex);
        ex.athleteNote = '';
      });
    });
    return {
      id: opts.id || uid('ses'),
      athleteId: opts.athleteId,
      date: opts.date,
      name: opts.name || template.name,
      templateId: template.id,
      programId: opts.programId || null,
      week: opts.week || null,
      day: opts.day || null,
      status: opts.status || 'scheduled',
      coachInstructions: template.coachInstructions || '',
      blocks,
      notes: '',
      comment: null,
      readiness: null,
      minutes: null,
      intensity: null,
      completedAt: null,
    };
  }

  function logSet(session, blockId, exerciseId, rowIndex, patch) {
    const block = (session.blocks || []).find((b) => b.id === blockId);
    if (!block) throw new Error('block not found');
    const ex = (block.exercises || []).find((e) => e.id === exerciseId);
    if (!ex) throw new Error('exercise not found');
    ensureRows(ex);
    const row = ex.rows[rowIndex];
    if (!row) throw new Error('set not found');
    if (patch.reps != null) row.reps = String(patch.reps);
    if (patch.weight != null) row.weight = String(patch.weight);
    if (patch.done != null) row.done = !!patch.done;
    if (row.reps !== '' || row.weight !== '') {
      if (patch.done === undefined) row.done = true;
    }
    if (session.status === 'scheduled') session.status = 'active';
    return session;
  }

  function logSetArrays(session, blockId, exerciseId, repsCsv, loadCsv) {
    const block = (session.blocks || []).find((b) => b.id === blockId);
    const ex = (block.exercises || []).find((e) => e.id === exerciseId);
    ensureRows(ex);
    const reps = splitList(repsCsv);
    const loads = splitList(loadCsv);
    ex.rows.forEach((row, i) => {
      if (reps[i] != null && reps[i] !== '') row.reps = reps[i];
      if (loads[i] != null && loads[i] !== '') row.weight = loads[i];
      if (row.reps !== '' || row.weight !== '') row.done = true;
    });
    if (session.status === 'scheduled') session.status = 'active';
    return session;
  }

  function completeBlock(session, blockId, done) {
    const block = (session.blocks || []).find((b) => b.id === blockId);
    if (!block) throw new Error('block not found');
    block.complete = done !== false;
    if (block.complete && block.exercises) {
      block.exercises.forEach((ex) => {
        ensureRows(ex);
        ex.rows.forEach((row) => {
          if (!row.done) {
            if (row.reps === '') row.reps = String(parseFirstNumber(row.target) || '');
            if (row.weight === '') row.weight = String(parseFirstNumber(row.prescribedLoad) || '');
            row.done = true;
          }
        });
      });
    }
    if (session.status === 'scheduled') session.status = 'active';
    const prog = blockProgress(session);
    if (prog.total && prog.done === prog.total) {
      session.status = 'completed';
      session.completedAt = session.completedAt || new Date().toISOString();
    }
    return session;
  }

  function swapExercise(session, blockId, exerciseId, next, note) {
    const block = (session.blocks || []).find((b) => b.id === blockId);
    const ex = (block.exercises || []).find((e) => e.id === exerciseId);
    if (!ex) throw new Error('exercise not found');
    ex.swappedFrom = { name: ex.name, exerciseId: ex.exerciseId };
    ex.name = next.name;
    ex.exerciseId = next.exerciseId || next.id || '';
    ex.category = next.category || ex.category;
    if (note) ex.athleteNote = note;
    return session;
  }

  function setSessionComment(session, text, coachId) {
    session.comment = {
      text: String(text || '').trim(),
      at: new Date().toISOString(),
      coachId: coachId || IDS.coach,
    };
    return session;
  }

  function emptyProgram(name, weeks) {
    return {
      id: uid('prog'),
      name: name || 'New program',
      weeks: Math.max(1, weeks || 4),
      cells: {},
    };
  }

  function setProgramCell(program, week, day, templateId) {
    const key = cellKey(week, day);
    if (!templateId) delete program.cells[key];
    else program.cells[key] = templateId;
    return program;
  }

  function addProgramWeek(program) {
    program.weeks = num(program.weeks) + 1;
    return program;
  }

  function assignProgram(state, opts) {
    const program = (state.programs || []).find((p) => p.id === opts.programId);
    if (!program) throw new Error('program not found');
    let athleteIds = opts.athleteIds ? opts.athleteIds.slice() : [];
    if (opts.teamId) {
      const team = (state.teams || []).find((t) => t.id === opts.teamId);
      if (!team) throw new Error('team not found');
      athleteIds = athleteIds.concat(team.athleteIds || []);
    }
    athleteIds = [...new Set(athleteIds)];
    const start = mondayOf(opts.startDate || today());
    const created = [];
    for (const [key, templateId] of Object.entries(program.cells || {})) {
      const { week, day } = parseCellKey(key);
      const template = (state.templates || []).find((t) => t.id === templateId);
      if (!template) continue;
      const date = addDays(start, (week - 1) * 7 + (day - 1));
      for (const athleteId of athleteIds) {
        const exists = (state.sessions || []).some(
          (s) => s.athleteId === athleteId && s.date === date && s.templateId === templateId,
        );
        if (exists) continue;
        const session = instantiateSession(template, {
          athleteId,
          date,
          programId: program.id,
          week,
          day,
          name: week && day ? `Week ${week} Day ${day}` : template.name,
        });
        session.sessionTitle = template.name;
        state.sessions.push(session);
        created.push(session);
      }
    }
    state.assignments = state.assignments || [];
    state.assignments.push({
      id: uid('asg'),
      programId: program.id,
      teamId: opts.teamId || null,
      athleteIds,
      startDate: start,
      createdAt: new Date().toISOString(),
    });
    return { state, created, start };
  }

  function needsProgramming(state) {
    const assigned = new Set();
    for (const a of state.assignments || []) {
      (a.athleteIds || []).forEach((id) => assigned.add(id));
    }
    const missingAthletes = (state.athletes || []).filter((a) => !assigned.has(a.id));
    const missingTeams = (state.teams || []).filter((t) =>
      (t.athleteIds || []).some((id) => !assigned.has(id)),
    );
    return { athletes: missingAthletes, teams: missingTeams };
  }

  function calendarFor(state, athleteId, monthKey) {
    const prefix = monthKey || today().slice(0, 7);
    return (state.sessions || [])
      .filter((s) => s.athleteId === athleteId && String(s.date).startsWith(prefix))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  function teamCalendar(state, teamId, monthKey) {
    const team = (state.teams || []).find((t) => t.id === teamId);
    const ids = new Set(team ? team.athleteIds : []);
    const prefix = monthKey || today().slice(0, 7);
    return (state.sessions || [])
      .filter((s) => ids.has(s.athleteId) && String(s.date).startsWith(prefix))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  function todaySession(state, athleteId, date) {
    const d = date || today();
    const list = (state.sessions || []).filter((s) => s.athleteId === athleteId && s.date === d);
    return list.find((s) => s.status === 'active') || list[0] || null;
  }

  function login(state, email, password) {
    const e = String(email || '').trim().toLowerCase();
    const p = String(password || '');
    const account = (state.accounts || []).find(
      (a) => a.email.toLowerCase() === e && a.password === p,
    );
    if (!account) return { ok: false, error: 'Unknown email or password' };
    state.currentUserId = account.id;
    return { ok: true, account };
  }

  function logout(state) {
    state.currentUserId = null;
    return state;
  }

  function currentAccount(state) {
    return (state.accounts || []).find((a) => a.id === state.currentUserId) || null;
  }

  /* ---------- seed (this product's own sessions, not a third-party program) ---------- */

  function coreExercises() {
    return [
      { id: 'core-back-squat', name: 'Back Squat', category: 'Strength — Squat' },
      { id: 'core-bench-press', name: 'Bench Press', category: 'Strength — Push' },
      { id: 'core-deadlift', name: 'Deadlift', category: 'Strength — Hinge' },
      { id: 'core-overhead-press', name: 'Overhead Press', category: 'Strength — Push' },
      { id: 'core-barbell-row', name: 'Barbell Row', category: 'Strength — Pull' },
      { id: 'core-bulgarian-split-squat', name: 'Bulgarian Split Squat', category: 'Accessories — Legs' },
      { id: 'core-romanian-deadlift', name: 'Romanian Deadlift', category: 'Strength — Hinge' },
      { id: 'core-pull-up', name: 'Pull-up', category: 'Strength — Pull' },
      { id: 'core-dip', name: 'Dip', category: 'Strength — Push' },
      { id: 'core-hip-thrust', name: 'Hip Thrust', category: 'Strength — Hinge' },
      { id: 'core-biceps-curl', name: 'Biceps Curl', category: 'Accessories — Upper' },
      { id: 'core-triceps-pushdown', name: 'Triceps Pushdown', category: 'Accessories — Upper' },
      { id: 'core-nordic-hamstring-curl', name: 'Nordic Hamstring Curl', category: 'Accessories — Legs' },
      { id: 'core-row-erg', name: 'Row Erg', category: 'Work Capacity' },
      { id: 'core-assault-bike', name: 'Assault Bike', category: 'Work Capacity' },
      { id: 'core-plank', name: 'Plank', category: 'Trunk' },
      { id: 'core-box-jump', name: 'Box Jump', category: 'Power & Olympic' },
      { id: 'core-kettlebell-swing', name: 'Kettlebell Swing', category: 'Strength — Hinge' },
      { id: 'core-face-pull', name: 'Face Pull', category: 'Accessories — Upper' },
      { id: 'core-farmer-carry', name: 'Farmer Carry', category: 'Carries' },
    ].map((e) => ({ ...e, builtIn: true, source: 'THE-core-100' }));
  }

  function seedTemplates() {
    const strength = makeTemplate({
      id: IDS.tplStrength,
      name: 'Full Body Strength',
      coachInstructions: 'Work sets only. Leave 2–3 reps in reserve. No max attempts on squats or hinges.',
      blocks: [
        makeBlock({
          type: 'text',
          heading: 'Warm-up',
          category: 'Prep',
          scoring: 'completion',
          notes: '5 min easy bike or row. Then 2 rounds: world\'s greatest stretch, hip airplanes, empty-bar back squat × 8.',
        }),
        makeBlock({
          type: 'strength',
          heading: 'Strength',
          category: 'Strength/Power',
          scoring: 'weight',
          exercises: [
            makeExercise({
              name: 'Back Squat',
              exerciseId: 'core-back-squat',
              category: 'Strength — Squat',
              sets: 3,
              reps: '5',
              load: '100',
              metric: 'Weight',
              restSec: 150,
            }),
          ],
        }),
        makeBlock({
          type: 'strength',
          heading: 'Push',
          category: 'Strength/Power',
          scoring: 'weight',
          exercises: [
            makeExercise({
              name: 'Bench Press',
              exerciseId: 'core-bench-press',
              category: 'Strength — Push',
              sets: 3,
              reps: '8,8,6',
              load: '80,80,70',
              metric: 'Weight',
              restSec: 120,
            }),
          ],
        }),
        makeBlock({
          type: 'strength',
          heading: 'D1 / D2 Superset',
          category: 'Strength/Power',
          scoring: 'weight',
          superset: true,
          exercises: [
            makeExercise({
              name: 'Pull-up',
              exerciseId: 'core-pull-up',
              category: 'Strength — Pull',
              sets: 3,
              reps: '6-8',
              load: '',
              metric: 'Reps',
              restSec: 75,
            }),
            makeExercise({
              name: 'Dip',
              exerciseId: 'core-dip',
              category: 'Strength — Push',
              sets: 3,
              reps: '8-10',
              load: '',
              metric: 'Reps',
              restSec: 75,
            }),
          ],
        }),
        makeBlock({
          type: 'text',
          heading: 'Cool-down',
          category: 'Recovery',
          scoring: 'completion',
          notes: 'Walk 3 min. Nasal breathing. Note anything that felt off.',
        }),
      ],
    });

    const cond = makeTemplate({
      id: IDS.tplCond,
      name: 'Aerobic Conditioning',
      coachInstructions: 'Keep RPE 3–4. Finish feeling better, not cooked.',
      blocks: [
        makeBlock({
          type: 'conditioning',
          heading: 'Row Erg',
          category: 'Conditioning',
          scoring: 'completion',
          conditioningType: 'easy',
          modality: 'Rower',
          targetDurationMin: 20,
          notes: '20:00 easy aerobic row. Smooth first 2 minutes, then a pace you could hold while talking. Log duration, metres, and average watts.',
        }),
        makeBlock({
          type: 'conditioning',
          heading: 'Fan Bike',
          category: 'Conditioning',
          scoring: 'completion',
          conditioningType: 'easy',
          modality: 'Bike',
          targetDurationMin: 10,
          notes: '10:00 easy fan bike to flush. Nasal breathing if possible.',
        }),
      ],
    });

    const recovery = makeTemplate({
      id: IDS.tplRecovery,
      name: 'Recovery Session',
      coachInstructions: 'Optional movement. Skip any drill that aggravates something.',
      blocks: [
        makeBlock({
          type: 'text',
          heading: 'Recovery circuit',
          category: 'Recovery',
          scoring: 'completion',
          notes: '20–30 min: walk, easy bike, or mobility. Box breathing 4-4-4-4 × 5. Log how you felt, not output.',
        }),
      ],
    });

    return [strength, cond, recovery];
  }

  function applyLoggedActuals(session) {
    const squat = session.blocks.find((b) => (b.exercises || []).some((e) => e.exerciseId === 'core-back-squat'));
    const squatEx = squat && squat.exercises.find((e) => e.exerciseId === 'core-back-squat');
    if (squatEx) {
      logSetArrays(session, squat.id, squatEx.id, '5,5,5', '100,100,105');
      completeBlock(session, squat.id, true);
    }
    const bench = session.blocks.find((b) => (b.exercises || []).some((e) => e.exerciseId === 'core-bench-press'));
    const benchEx = bench && bench.exercises.find((e) => e.exerciseId === 'core-bench-press');
    if (benchEx) {
      logSetArrays(session, bench.id, benchEx.id, '8,8,6', '80,80,70');
      completeBlock(session, bench.id, true);
    }
    const superB = session.blocks.find((b) => b.superset);
    if (superB) completeBlock(session, superB.id, true);
    session.status = 'completed';
    session.completedAt = '2026-08-24T18:40:00.000Z';
    session.minutes = 54;
    session.readiness = null;
    session.intensity = null;
    session.name = 'Week 1 Day 1';
    session.sessionTitle = 'Full Body Strength';
    return session;
  }

  function buildSeed(opts) {
    opts = opts || {};
    const startMonday = opts.startMonday || '2026-08-24';
    const templates = seedTemplates();
    const athletes = [
      { id: IDS.athleteDan, name: 'Dan Veldman', initials: 'DV' },
      { id: IDS.athleteAlex, name: 'Alex Chen', initials: 'AC' },
      { id: IDS.athleteJordan, name: 'Jordan Hale', initials: 'JH' },
    ];
    const state = {
      version: 1,
      currentUserId: null,
      accounts: [
        {
          id: IDS.coachAccount,
          email: 'dan@thehybrid.local',
          password: 'demo',
          role: 'coach',
          name: 'Dan',
          athleteId: null,
        },
        {
          id: 'acct-veldman',
          email: 'veldman@thehybrid.local',
          password: 'demo',
          role: 'athlete',
          name: 'Dan Veldman',
          athleteId: IDS.athleteDan,
        },
        {
          id: 'acct-alex',
          email: 'alex@thehybrid.local',
          password: 'demo',
          role: 'athlete',
          name: 'Alex Chen',
          athleteId: IDS.athleteAlex,
        },
        {
          id: 'acct-jordan',
          email: 'jordan@thehybrid.local',
          password: 'demo',
          role: 'athlete',
          name: 'Jordan Hale',
          athleteId: IDS.athleteJordan,
        },
      ],
      coach: { id: IDS.coach, name: 'Dan' },
      athletes,
      teams: [
        {
          id: IDS.team,
          name: 'hybrid S&C',
          athleteIds: [IDS.athleteDan, IDS.athleteAlex, IDS.athleteJordan],
        },
      ],
      exercises: coreExercises(),
      templates,
      programs: [
        {
          id: IDS.program,
          name: 'Hybrid Strength Base',
          weeks: 2,
          cells: {
            '1-1': IDS.tplStrength,
            '1-3': IDS.tplCond,
            '1-5': IDS.tplStrength,
            '1-7': IDS.tplRecovery,
            '2-1': IDS.tplStrength,
            '2-3': IDS.tplCond,
            '2-5': IDS.tplStrength,
          },
        },
      ],
      assignments: [],
      sessions: [],
    };

    assignProgram(state, {
      programId: IDS.program,
      teamId: IDS.team,
      startDate: startMonday,
    });

    const logged = (state.sessions || []).find(
      (s) => s.athleteId === IDS.athleteDan && s.date === startMonday && s.templateId === IDS.tplStrength,
    );
    if (logged) {
      logged.id = IDS.logged;
      applyLoggedActuals(logged);
    }

    return state;
  }

  function memoryStorage() {
    const map = {};
    return {
      getItem(k) {
        return Object.prototype.hasOwnProperty.call(map, k) ? map[k] : null;
      },
      setItem(k, v) {
        map[k] = String(v);
      },
      removeItem(k) {
        delete map[k];
      },
    };
  }

  function loadState(storage, opts) {
    storage = storage || defaultStorage();
    try {
      const raw = storage.getItem(STORAGE);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.version === 1 && Array.isArray(parsed.accounts)) return parsed;
      }
    } catch (e) {
      /* fall through to seed */
    }
    const state = buildSeed(opts);
    saveState(storage, state);
    return state;
  }

  function saveState(storage, state) {
    storage = storage || defaultStorage();
    storage.setItem(STORAGE, JSON.stringify(state));
    return state;
  }

  function resetState(storage, opts) {
    storage = storage || defaultStorage();
    const state = buildSeed(opts);
    saveState(storage, state);
    return state;
  }

  function defaultStorage() {
    try {
      if (typeof localStorage !== 'undefined') return localStorage;
    } catch (e) {
      /* ignore */
    }
    return memoryStorage();
  }

  function prescriptionLine(ex) {
    const load = String(ex.load || '').trim();
    const metric = ex.metric || 'Weight';
    const rest = ex.restSec ? ` · rest ${ex.restSec}s` : '';
    const loadBit = load ? ` @ ${load}${metric === 'Weight' ? 'kg' : ''}` : '';
    return `${ex.sets} × ${ex.reps}${loadBit}${rest}`;
  }

  function actualLine(ex) {
    ensureRows(ex);
    const done = (ex.rows || []).filter((r) => r.done);
    if (!done.length) return '';
    const reps = done.map((r) => r.reps || '–').join(',');
    const loads = done.map((r) => r.weight || '–').join(',');
    const hasLoad = done.some((r) => String(r.weight || '').trim() !== '');
    return hasLoad ? `${reps} @ ${loads}kg` : reps;
  }

  return {
    STORAGE,
    DAY_NAMES,
    BLOCK_CATEGORIES,
    SCORING,
    METRICS,
    IDS,
    uid,
    clone,
    num,
    localDate,
    today,
    addDays,
    mondayOf,
    dayIndex,
    dateLabel,
    cellKey,
    parseCellKey,
    targetList,
    loadList,
    makeRows,
    ensureRows,
    isWorkBlock,
    letterBlocks,
    decorateBlocks,
    volumeKg,
    volumeFromRows,
    prescribedTonnage,
    intensityPct,
    blockProgress,
    blockIsComplete,
    remainingSummary,
    feedMetrics,
    groupFeed,
    sessionHasLog,
    makeExercise,
    makeBlock,
    makeTemplate,
    instantiateSession,
    logSet,
    logSetArrays,
    completeBlock,
    swapExercise,
    setSessionComment,
    emptyProgram,
    setProgramCell,
    addProgramWeek,
    assignProgram,
    needsProgramming,
    calendarFor,
    teamCalendar,
    todaySession,
    login,
    logout,
    currentAccount,
    coreExercises,
    seedTemplates,
    buildSeed,
    memoryStorage,
    loadState,
    saveState,
    resetState,
    prescriptionLine,
    actualLine,
    sessionRows,
  };
});
