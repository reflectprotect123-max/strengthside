/** Sole writer of set weights. UI layers only render this output. */
(function (root) {
  const STEP = 2.5;
  const BAR_DELTA = {very_easy: 5, easy: 2.5, average: 0, hard: -2.5, max_effort: -5};
  const LAST_RAMP = {very_easy: 0, easy: 0, average: 0, hard: -2.5, max_effort: -5};
  const DB_LADDER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 12.5, 14, 15, 16, 17.5, 18, 20];
  const LEVELS = {
    dan: {
      key: 'dan',
      barKg: 20,
      startingLevels: {
        'db rdl': {perHandKg: 16},
        'dumbbell rdl': {perHandKg: 16},
        rdl: {perHandKg: 16},
        'db lunge': {bodyweightWarmup: true, averageKg: 8, easyKg: 10, veryEasyKg: 12},
        'dumbbell lunge': {bodyweightWarmup: true, averageKg: 8, easyKg: 10, veryEasyKg: 12},
        lunge: {kg: 20},
        'deficit back rack lunge': {kg: 20},
      },
    },
    partner: {
      key: 'partner',
      barKg: 15,
      startingLevels: {
        'db rdl': {perHandKg: 8},
        'dumbbell rdl': {perHandKg: 8},
        rdl: {perHandKg: 8},
        'db lunge': {bodyweightWarmup: true, averageKg: 4, easyKg: 5, veryEasyKg: 6},
        'dumbbell lunge': {bodyweightWarmup: true, averageKg: 4, easyKg: 5, veryEasyKg: 6},
        lunge: {kg: 15},
        'deficit back rack lunge': {kg: 15},
      },
    },
  };
  const FIXTURES = {
    'golden-dan': {accountId: 'golden-dan', startingLevel: 'dan', barKg: 20, startingLevels: LEVELS.dan.startingLevels},
    'golden-partner': {accountId: 'golden-partner', startingLevel: 'partner', barKg: 15, startingLevels: LEVELS.partner.startingLevels},
  };
  function levelKey(value) {
    const k = String(value || '').toLowerCase();
    return k === 'partner' || k === 'golden-partner' ? 'partner' : 'dan';
  }
  function fromLevel(accountId, key) {
    const spec = LEVELS[levelKey(key)];
    return {
      accountId: String(accountId || spec.key),
      startingLevel: spec.key,
      barKg: spec.barKg,
      startingLevels: {...spec.startingLevels},
    };
  }

  function num(value) {
    if (!['number', 'string'].includes(typeof value) || String(value).trim() === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  function liftKey(page) {
    return String(page?.title || page?.name || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }
  function sameLift(a, b) {
    const idA = a?.exerciseId, idB = b?.exerciseId;
    if (idA && idB && String(idA) === String(idB)) return true;
    const tA = liftKey(a), tB = liftKey(b);
    return !!(tA && tB && tA === tB);
  }
  function barbellRound(value, {down = false, barKg = 0} = {}) {
    if (value == null || !Number.isFinite(value)) return null;
    const stepped = down ? Math.floor((value + 1e-9) / STEP) * STEP : Math.round(value / STEP) * STEP;
    return Math.max(barKg || 0, Number(stepped.toFixed(4)));
  }
  function dbLoads(from = 0) {
    const extra = [];
    for (let n = 22.5; n <= Math.max(from, 40) + 10; n += 2.5) extra.push(n);
    return DB_LADDER.concat(extra).filter((n, i, all) => all.indexOf(n) === i).sort((a, b) => a - b);
  }
  function dbFloor(value, page) {
    if (value == null) return null;
    if (page && root.StrengthEquipment?.floor) return root.StrengthEquipment.floor(value, page);
    return dbLoads(value).filter((n) => n <= value + 1e-8).at(-1) ?? null;
  }
  function dbNext(value, page) {
    if (value == null) return null;
    if (page && root.StrengthEquipment?.next) return root.StrengthEquipment.next(value, page);
    return dbLoads(value).find((n) => n > value + 1e-8) ?? null;
  }
  function dbPrev(value, page) {
    if (value == null) return null;
    if (page && root.StrengthEquipment?.floor) {
      const fl = root.StrengthEquipment.floor(value - 1e-8, page);
      return fl != null && fl < value - 1e-8 ? fl : null;
    }
    return dbLoads(value).filter((n) => n < value - 1e-8).at(-1) ?? null;
  }
  function normalizeAthlete(raw) {
    if (!raw || typeof raw !== 'object') return fromLevel('golden-unknown', 'dan');
    if (raw.startingLevels && Object.keys(raw.startingLevels).length) {
      return {
        accountId: String(raw.accountId || 'golden-unknown'),
        startingLevel: levelKey(raw.startingLevel),
        barKg: num(raw.barKg) ?? LEVELS[levelKey(raw.startingLevel)].barKg,
        startingLevels: {...raw.startingLevels},
      };
    }
    return fromLevel(raw.accountId, raw.startingLevel);
  }
  function profile(idOrObj) {
    if (idOrObj && typeof idOrObj === 'object') return normalizeAthlete(idOrObj);
    if (FIXTURES[idOrObj]) return normalizeAthlete(FIXTURES[idOrObj]);
    const fromState = root.S?.athleteLevels;
    if (fromState && (!idOrObj || fromState.accountId === idOrObj)) return normalizeAthlete(fromState);
    return fromLevel(idOrObj || 'golden-unknown', 'dan');
  }
  function current() {
    const id = root.S?.athleteLevels?.accountId || root.S?.accountId;
    if (id && FIXTURES[id]) return profile(id);
    if (root.S?.athleteLevels) return profile(root.S.athleteLevels);
    return fromLevel(id, root.S?.startingLevel || 'dan');
  }
  function use(athlete) {
    const next = profile(athlete);
    if (root.S) {
      root.S.athleteLevels = next;
      root.S.startingLevel = next.startingLevel;
    }
    return next;
  }
  function clientOf(io) {
    if (io && typeof io.from === 'function') return io;
    return root.Whoop?.client?.() || null;
  }
  async function loadAccount(uid, io) {
    let key = 'dan';
    try {
      const sb = clientOf(io);
      if (sb && uid) {
        const {data} = await sb.from('athlete_starting_level').select('level').eq('athlete_id', uid).maybeSingle();
        if (data?.level) key = levelKey(data.level);
      }
    } catch { /* offline / unsigned: stay on dan */ }
    return use(fromLevel(uid, key));
  }
  async function saveLevel(athleteId, key, io) {
    const level = levelKey(key);
    const sb = clientOf(io);
    if (!sb) throw new Error('Sign in required');
    const {error} = await sb.from('athlete_starting_level').upsert({athlete_id: athleteId, level});
    if (error) throw error;
    if (!root.S || root.S.accountId === athleteId || root.S.coachAthleteId === athleteId) use(fromLevel(athleteId, level));
    return level;
  }
  function selectHtml(athleteId, selected) {
    const cur = levelKey(selected);
    const id = String(athleteId || '').replace(/[^a-zA-Z0-9-]/g, '');
    return `<label class="stub">Starting level<select class="log-cell" aria-label="Starting level" onchange="StrengthWeights.saveLevel('${id}',this.value).then(()=>{if(typeof save==='function')save();if(typeof render==='function')render();})"><option value="dan"${cur === 'dan' ? ' selected' : ''}>Dan</option><option value="partner"${cur === 'partner' ? ' selected' : ''}>Partner</option></select></label>`;
  }
  function startingFor(page, athlete) {
    const key = liftKey(page);
    const levels = athlete?.startingLevels || {};
    if (levels[key]) return levels[key];
    const keys = Object.keys(levels);
    const hit = keys.find((k) => key === k || key.endsWith(' ' + k) || key.includes(k));
    return hit ? levels[hit] : null;
  }
  function isDumbbell(page) {
    return page?.equipmentId === 'dumbbell' || /\bdumbbell\b|\bdb\b/i.test(page?.title || '');
  }
  function isBarbell(page) {
    if (page?.equipmentId && page.equipmentId !== 'barbell') return false;
    return page?.equipmentId === 'barbell' || /bench|press|squat|deadlift|rdl|row|lunge/i.test(page?.title || '');
  }
  function barKgOf(page, athlete) {
    return num(page?.barWeightKg) ?? num(athlete?.barKg) ?? 20;
  }
  function percentRx(page) {
    return root.StrengthPercent?.normalize?.(page) || null;
  }
  function coachOneRm(page) {
    const n = num(page?.oneRm ?? page?.e1rm);
    if (n > 0) return n;
    const notes = root.StrengthNotes?.parse?.([page?.notes, page?.prescription, page?.prescribed]);
    return num(notes?.oneRm);
  }
  function lastExact(history, records, page) {
    const fromHist = history?.latest;
    if (fromHist && sameLift(fromHist.page || page, page)) {
      const rows = (fromHist.rows || []).filter((r) => r.purpose !== 'ramp' && r.purpose !== 'warmup' && num(r.kg) != null);
      const last = rows.at(-1);
      if (last && num(last.kg) > 0) return {kg: Number(last.kg), rows};
    }
    if (!records) return null;
    const sessions = new Map();
    for (const rec of Object.values(records)) {
      const prior = rec?.payload?.page, row = rec?.payload?.row;
      if (!rec || rec.deleted || !prior || !row || row.logged !== true || row.deleted || row.skipped) continue;
      if (row.purpose === 'ramp' || row.purpose === 'warmup') continue;
      if (!sameLift(prior, page)) continue;
      const kg = num(row.kg);
      if (!(kg > 0)) continue;
      const sid = rec.sessionId || rec.id;
      const at = Number(rec.payload?.sessionStartedAt) || 0;
      const bucket = sessions.get(sid) || {rows: [], at};
      bucket.rows.push(row);
      if (at >= bucket.at) bucket.at = at;
      sessions.set(sid, bucket);
    }
    const found = [...sessions.values()].sort((a, b) => b.at - a.at)[0];
    if (!found) return null;
    found.rows.sort((a, b) => (a.ordinal ?? a.workingIndex ?? 0) - (b.ordinal ?? b.workingIndex ?? 0));
    return {kg: Number(found.rows.at(-1).kg), rows: found.rows};
  }
  function roundLoad(value, page, athlete, {down = false} = {}) {
    if (value == null || !Number.isFinite(value)) return null;
    if (isBarbell(page)) return barbellRound(value, {down, barKg: barKgOf(page, athlete)});
    if (isDumbbell(page)) return down ? dbFloor(value, page) : (dbFloor(value + 1e-8, page) ?? dbNext(value - 1e-8, page));
    const E = root.StrengthEquipment;
    if (!E) return down ? Math.floor(value) : Math.round(value);
    return down ? (E.floor(value, page) ?? value) : (E.floor(value + ((E.profile(page).step || 1) / 2) - 1e-9, page) ?? value);
  }
  function rangeKgs(page, rx, orm, athlete) {
    const bar = isBarbell(page) ? barKgOf(page, athlete) : 0;
    const low = roundLoad(orm * (rx.pctLow / 100), page, athlete, {down: isBarbell(page)});
    const high = roundLoad(orm * ((rx.pctHigh ?? rx.pctLow) / 100), page, athlete);
    return {lowKg: Math.max(bar, low ?? 0), highKg: Math.max(bar, high ?? 0), bar};
  }
  function buildWorking(page, rx, orm, athlete) {
    const n = Math.max(rx.sets?.length || 0, Number(page.setCount) || 0, 1);
    const lastN = Math.min(2, n);
    const climbEnd = n - lastN;
    const startPct = rx.startPct ?? Math.max(40, (rx.pctLow || 60) - 20);
    const {lowKg, highKg, bar} = rangeKgs(page, rx, orm, athlete);
    const kgs = [];
    for (let i = 0; i < n; i++) {
      const spec = rx.sets?.[i] || {};
      if (spec.setRole === 'drop' || spec.setRole === 'backoff') {
        kgs.push(null);
        continue;
      }
      if (i >= climbEnd) {
        const slot = i - climbEnd, span = Math.max(1, lastN - 1);
        const pct = lastN <= 1 || slot === 0 ? rx.pctLow : rx.pctLow + ((rx.pctHigh - rx.pctLow) * (slot / span));
        kgs.push(roundLoad(orm * (pct / 100), page, athlete));
        continue;
      }
      const t = climbEnd <= 1 ? 0 : i / climbEnd;
      kgs.push(roundLoad(orm * ((startPct + (rx.pctLow - startPct) * t) / 100), page, athlete));
    }
    const top = kgs.find((kg) => kg != null);
    return kgs.map((kg, i) => {
      if (kg != null) return kg;
      const spec = rx.sets?.[i];
      if (!spec || top == null) return kg;
      return roundLoad(top * 0.875, page, athlete, {down: true});
    }).map((kg, i) => {
      if (rx.mode !== 'build' || i < climbEnd) return kg;
      if (kg < lowKg) return lowKg;
      if (kg > highKg) return highKg;
      return kg;
    });
  }
  function straightWorking(page, rx, orm, athlete, count) {
    const {lowKg, bar} = rangeKgs(page, rx, orm, athlete);
    const n = Math.max(count, rx.sets?.length || 0, 1);
    const kgs = Array.from({length: n}, (_, i) => {
      const spec = rx.sets?.[i];
      if (spec?.setRole === 'drop' || spec?.setRole === 'backoff') return null;
      return lowKg;
    });
    const top = kgs.find((kg) => kg != null);
    return kgs.map((kg, i) => {
      if (kg != null) return kg;
      return barbellRound((top ?? lowKg) * 0.875, {down: true, barKg: bar});
    });
  }
  function rampToward(working, count, page, athlete) {
    if (!(count > 0) || !(working > 0)) return [];
    const bar = isBarbell(page) ? barKgOf(page, athlete) : 0;
    const fracs = count === 1 ? [0.5] : count === 2 ? [0.5, 0.75] : [0.4, 0.6, 0.8];
    const out = [];
    for (let i = 0; i < count; i++) {
      let kg = isDumbbell(page) ? dbFloor(working * fracs[i], page) : barbellRound(working * fracs[i], {down: true, barKg: bar});
      if (kg == null) continue;
      if (kg < bar) kg = bar;
      if (kg >= working) {
        kg = isDumbbell(page) ? dbPrev(working, page) : barbellRound(working - STEP, {down: true, barKg: bar});
      }
      if (kg == null || kg >= working) continue;
      if (out.length && kg <= out.at(-1)) {
        const up = isDumbbell(page) ? dbNext(out.at(-1), page) : barbellRound(out.at(-1) + STEP, {barKg: bar});
        if (up == null || up >= working) continue;
        kg = up;
      }
      if (kg < working) out.push(kg);
    }
    return out;
  }
  function workingCount(page, rx) {
    if (Array.isArray(page.setTargets) && page.setTargets.length) return page.setTargets.length;
    if (rx?.sets?.length) return rx.sets.length;
    return Math.max(1, Number(page.setCount) || 1);
  }
  function plan({page = {}, history = null, records = {}, athlete} = {}) {
    athlete = profile(athlete || current());
    const timed = describeTimed(page);
    if (timed.timer || (timed.columns || []).includes('seconds')) {
      return {rampKgs: [], warmupKgs: [], workingKgs: [], confidence: 'timed', flags: {}, columns: timed.columns, kg: 0};
    }
    const rx = percentRx(page);
    const orm = coachOneRm(page);
    const count = workingCount(page, rx);
    const start = startingFor(page, athlete);
    let workingKgs = [];
    let confidence = 'starting_level';
    let warmupKgs = [];
    if (rx && orm > 0) {
      workingKgs = rx.mode === 'build' ? buildWorking(page, rx, orm, athlete) : straightWorking(page, rx, orm, athlete, count);
      confidence = 'prescription';
    } else {
      const last = lastExact(history, records, page);
      if (last?.kg > 0) {
        workingKgs = Array.from({length: count}, () => last.kg);
        confidence = 'history';
      } else if (start?.bodyweightWarmup) {
        warmupKgs = [0];
        const opened = start.averageKg ?? 0;
        workingKgs = Array.from({length: count}, () => opened);
        confidence = 'starting_level';
      } else if (start?.perHandKg != null) {
        workingKgs = Array.from({length: count}, () => start.perHandKg);
        confidence = 'starting_level';
      } else if (start?.kg != null) {
        workingKgs = Array.from({length: count}, () => start.kg);
        confidence = 'starting_level';
      } else if (isBarbell(page)) {
        const bar = barKgOf(page, athlete);
        workingKgs = Array.from({length: count}, () => bar);
        confidence = 'provisional';
      } else {
        const fallback = root.StrengthEquipment?.starter?.(page)?.kg;
        workingKgs = Array.from({length: count}, () => fallback ?? 0);
        confidence = 'provisional';
      }
    }
    if (rx && workingKgs.some((kg) => kg == null)) {
      const top = workingKgs.find((kg) => kg != null);
      workingKgs = workingKgs.map((kg, i) => kg ?? barbellRound((top || 0) * 0.875, {down: true}));
    }
    const requested = Number(page.rampCount);
    const wantRamps = Number.isSafeInteger(requested) ? Math.max(0, Math.min(3, requested)) : (page.exerciseType === 'accessory' ? 0 : 2);
    const firstWork = workingKgs.find((kg) => kg != null) ?? 0;
    const rampKgs = start?.bodyweightWarmup ? [] : rampToward(firstWork, wantRamps, page, athlete);
    return {rampKgs, warmupKgs, workingKgs, confidence, flags: {}, firstWorking: firstWork};
  }
  function clampWorking(kg, page, athlete, {allowBelow = false, down = false} = {}) {
    const rx = percentRx(page);
    const orm = coachOneRm(page);
    if (!rx || !(orm > 0) || rx.mode === 'build') return {kg, belowRange: false, clamped: false};
    const {lowKg, highKg, bar} = rangeKgs(page, rx, orm, athlete);
    let next = kg, belowRange = false, clamped = false;
    if (next > highKg + 1e-8) {
      next = barbellRound(highKg, {down: true, barKg: bar});
      clamped = true;
    }
    if (next < lowKg - 1e-8) {
      const floorKg = barbellRound(lowKg - STEP, {down: true, barKg: bar});
      if (allowBelow) {
        belowRange = true;
        next = Math.max(floorKg, barbellRound(next, {down: true, barKg: 0}));
      } else {
        next = barbellRound(lowKg, {down, barKg: bar});
        clamped = true;
      }
    }
    return {kg: next, belowRange, clamped};
  }
  function barbellStep(current, effort, page, athlete) {
    const delta = BAR_DELTA[effort] ?? 0;
    const now = num(current) ?? 0;
    if (delta === 0) {
      const rx = percentRx(page);
      const orm = coachOneRm(page);
      let belowRange = false;
      if (rx && orm > 0 && rx.mode !== 'build') {
        const {lowKg} = rangeKgs(page, rx, orm, athlete);
        belowRange = now < lowKg - 1e-8;
      }
      return {kg: now, belowRange, clamped: false};
    }
    const down = delta < 0;
    const bar = barKgOf(page, athlete);
    const rounded = barbellRound(now + delta, {down, barKg: bar});
    const allowBelow = down && now > bar + 1e-8;
    return clampWorking(rounded, page, athlete, {allowBelow, down});
  }
  function dumbbellStep(current, effort, reps, page) {
    const dir = BAR_DELTA[effort] ?? 0;
    if (dir === 0) return {kg: current, reps, stepped: false};
    const nxt = dir > 0 ? dbNext(current, page) : dbPrev(current, page);
    if (nxt == null) return {kg: current, reps, stepped: false};
    const change = Math.abs(nxt - current);
    if (current > 0 && change / current > 0.10) {
      return {kg: current, reps: Math.max(1, (num(reps) || 8) + (dir > 0 ? 2 : -2)), stepped: false};
    }
    return {kg: nxt, reps, stepped: true};
  }
  function applyRating({page = {}, rows = [], ratedIndex = 0, athlete} = {}) {
    athlete = profile(athlete || current());
    const next = rows.map((r) => ({...r}));
    const rated = next[ratedIndex];
    const flags = {};
    if (!rated) return {rows: next, reason: 'no_rated_set', flags};
    if (rated.miss && !rated.effort) rated.effort = 'hard';
    const upcoming = [];
    for (let i = ratedIndex + 1; i < next.length; i++) {
      if (!next[i].logged && !next[i].skipped) upcoming.push(i);
    }
    const nextI = upcoming[0];
    const effort = rated.effort || 'average';
    const isRamp = rated.purpose === 'ramp' || rated.purpose === 'warmup';
    const laterRamps = upcoming.filter((i) => next[i].purpose === 'ramp' || next[i].purpose === 'warmup');
    const lastRamp = isRamp && laterRamps.length === 0;

    if (rated.purpose === 'warmup' && startingFor(page, athlete)?.bodyweightWarmup && nextI != null) {
      const lvl = startingFor(page, athlete);
      if (effort === 'hard' || effort === 'max_effort') next[nextI].kg = 0;
      else if (effort === 'very_easy') next[nextI].kg = lvl.veryEasyKg;
      else if (effort === 'easy') next[nextI].kg = lvl.easyKg;
      else next[nextI].kg = lvl.averageKg;
      return {rows: next, reason: 'bodyweight_warmup', flags};
    }

    if (isRamp && !lastRamp) {
      if (effort === 'max_effort') {
        for (const i of laterRamps) next[i].skipped = true;
        return {rows: next, reason: 'stop_ramp', flags};
      }
      if (effort === 'hard' && nextI != null && (next[nextI].purpose === 'ramp' || next[nextI].purpose === 'warmup')) {
        next[nextI].kg = rated.kg;
        return {rows: next, reason: 'repeat_ramp', flags};
      }
      return {rows: next, reason: 'hold_ramp', flags};
    }

    if (isRamp && lastRamp) {
      const cut = LAST_RAMP[effort] ?? 0;
      if (cut < 0) {
        const firstWork = upcoming.find((i) => next[i].purpose === 'working');
        const planned = num(next[firstWork]?.kg) ?? num(page.workingKg);
        const raw = barbellRound((planned ?? 0) + cut, {down: true});
        const stepped = clampWorking(raw, page, athlete, {allowBelow: true, down: true});
        for (const i of upcoming) {
          if (next[i].purpose === 'working') next[i].kg = stepped.kg;
        }
        if (stepped.belowRange) flags.belowRange = true;
        if (stepped.clamped) flags.clamped = true;
        return {rows: next, reason: 'last_ramp_cut', flags};
      }
      return {rows: next, reason: 'last_ramp_hold', flags};
    }

    function finish(reason) {
      const first = next.find((r) => r.purpose === 'working' && num(r.kg) != null);
      let targets = [];
      try { targets = root.StrengthTargets?.normalize?.(page) || page.setTargets || []; } catch { targets = page.setTargets || []; }
      for (const row of next) {
        if (row.logged || row.skipped) continue;
        const target = targets.find((t) => t.id === row.targetId);
        if ((row.purpose === 'amrap' || target?.loadRule?.kind === 'first_working_set') && first) row.kg = first.kg;
      }
      return {rows: next, reason, flags};
    }
    if (nextI == null) return finish('complete');
    const follow = next[nextI];
    if (follow.setRole === 'drop' || follow.setRole === 'backoff') {
      const top = Math.max(...next.filter((r) => r.logged && r.purpose === 'working' && r.setRole !== 'drop').map((r) => num(r.kg) || 0), num(rated.kg) || 0);
      follow.kg = barbellRound(top * 0.875, {down: true});
      return finish('drop_of_top');
    }

    if (isDumbbell(page)) {
      const stepped = dumbbellStep(num(rated.kg), effort, follow.reps, page);
      follow.kg = stepped.kg;
      follow.reps = stepped.reps;
      return finish(stepped.stepped ? 'db_step' : (BAR_DELTA[effort] ? 'db_reps' : 'hold'));
    }

    const rx = percentRx(page);
    if (rx?.mode === 'build' && effort === 'average') {
      return finish('build_hold');
    }
    const veryEasyAtTop = effort === 'very_easy' && rx && coachOneRm(page);
    const stepped = barbellStep(num(rated.kg), effort, page, athlete);
    follow.kg = stepped.kg;
    if (stepped.belowRange) flags.belowRange = true;
    if (stepped.clamped) flags.clamped = true;
    if (veryEasyAtTop) {
      const {highKg} = rangeKgs(page, rx, coachOneRm(page), athlete);
      const atTop = Math.abs((num(rated.kg) ?? 0) - highKg) < 1e-6 || (num(rated.kg) ?? 0) >= highKg - STEP + 1e-6;
      const prev = next.slice(0, ratedIndex).filter((r) => r.logged && r.purpose === 'working' && r.effort === 'very_easy');
      if (atTop && prev.length >= 1) flags.staleOneRm = true;
    }
    return finish(BAR_DELTA[effort] < 0 ? 'working_down' : BAR_DELTA[effort] > 0 ? 'working_up' : 'working_hold');
  }
  function nextSet(args = {}) {
    const rows = (args.state?.rows || []).map((r) => ({...r}));
    const rated = args.row ? {...args.row, logged: true} : rows.filter((r) => r.logged).at(-1);
    if (!rated) return {kg: num(args.nextRow?.kg), reason: 'no_source', target: 'average', flags: {}};
    let ratedIndex = rows.findIndex((r) => r === args.row);
    if (ratedIndex < 0) {
      rows.push(rated);
      ratedIndex = rows.length - 1;
    } else rows[ratedIndex] = rated;
    if (args.nextRow && !rows.includes(args.nextRow)) rows.push({...args.nextRow});
    const out = applyRating({page: args.page, rows, ratedIndex, athlete: args.athlete});
    const nxt = out.rows.find((r, i) => i > ratedIndex && !r.logged && !r.skipped) || out.rows[args.index] || args.nextRow;
    return {kg: nxt?.kg, reps: nxt?.reps, skipped: nxt?.skipped, reason: out.reason, target: nxt?.purpose === 'ramp' || nxt?.purpose === 'warmup' ? 'easy' : 'average', flags: out.flags};
  }
  function describeTimed(page = {}) {
    const title = String(page.title || '');
    const notes = [].concat(page.notes || [], page.prescription || [], page.prescribed || [], page.instructions || []);
    const parsed = root.StrengthNotes?.parse?.(notes) || {};
    const clock = String(notes.flat().join(' ')).match(/\b(\d+):(\d{2})\b/);
    const jump = /\bjump\b/i.test(title) && !/\bdumbbell\b|\bdb\b|\bbarbell\b|\bweighted\b/i.test(title);
    const sit = /wall\s*sit|\bhold\b|plank/i.test(title);
    const cardio = /^(row|ski|run|jog|bike|cycle|erg|assault|echo|jump\s*rope|rower)(\b|$|\s|\d)/i.test(title);
    const warmup = page.section === 'Warm-Up' || page.role === 'warmup' || page.kind === 'warmup';
    let seconds = parsed.seconds;
    if (seconds == null && clock) seconds = Number(clock[1]) * 60 + Number(clock[2]);
    if (seconds == null && jump) seconds = 20;
    if (seconds == null && sit) seconds = 45;
    if (seconds == null && cardio && warmup) seconds = 180;
    const timed = jump || sit || cardio || warmup && (seconds != null || parsed.seconds);
    if (!timed && !jump) return {columns: page.columns || [], kg: null, timer: false, weighted: page.weighted};
    return {
      columns: ['seconds'],
      kg: 0,
      timer: !!(cardio || warmup),
      weighted: false,
      prescribed: seconds != null ? String(seconds) : '',
      seconds,
    };
  }
  function cardPrescription(page = {}) {
    const parsed = root.StrengthNotes?.parse?.([].concat(page.notes || [], page.prescription || [], page.prescribed || [])) || {};
    if (parsed.percentSets?.length) {
      const tops = parsed.percentSets.filter((s) => s.setRole !== 'drop' && s.setRole !== 'backoff');
      const reps = tops[0]?.reps;
      const count = tops.length || parsed.percentSets[0]?.setCount || page.setCount;
      if (reps) return `${count} x ${reps}`;
    }
    if (parsed.schemeReps && (parsed.setCount || page.setCount)) return `${parsed.setCount || page.setCount} x ${parsed.schemeReps}`;
    return page.prescription || '';
  }

  root.StrengthWeights = {
    FIXTURES,
    LEVELS,
    levelKey,
    fromLevel,
    loadAccount,
    saveLevel,
    selectHtml,
    profile,
    current,
    use,
    plan,
    applyRating,
    nextSet,
    describeTimed,
    cardPrescription,
    barbellRound,
    sameLift,
  };
})(typeof window !== 'undefined' ? window : globalThis);
