/** Per-exercise records and New PR detection from replayable set evidence. */
(function (root) {
  function num(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  function titleOf(page) {
    return String(page && page.title || '').trim() || 'Exercise';
  }

  function keyOf(page) {
    if (root.StrengthBrain && typeof root.StrengthBrain.key === 'function') return root.StrengthBrain.key(page);
    return titleOf(page).toLowerCase();
  }

  function scoredSet(row) {
    return !!(row && row.logged && !row.miss && !row.deleted && !row.skipped && row.purpose !== 'ramp' && row.purpose !== 'warmup');
  }

  function estimate(row, page) {
    if (!root.StrengthBrain || typeof root.StrengthBrain.estimate !== 'function') return null;
    const n = root.StrengthBrain.estimate(row, page);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  function setEntries(records) {
    return Object.values(records || {}).filter((r) => r && r.kind === 'set' && !r.deleted && r.payload && r.payload.page && r.payload.row);
  }

  function ensure(map, page) {
    const key = keyOf(page);
    if (!map.has(key)) {
      map.set(key, {
        key,
        title: titleOf(page),
        e1rm: null,
        repMax: {},
        conditioning: {calories: 0, meters: 0, watts: 0, pace500: null},
      });
    }
    return map.get(key);
  }

  function applyRow(entry, page, row) {
    if (!scoredSet(row)) return;
    const reps = Number(row.reps);
    const kg = num(row.kg);
    if (Number.isInteger(reps) && reps > 0 && kg > 0) {
      entry.repMax[String(reps)] = Math.max(entry.repMax[String(reps)] || 0, kg);
    }
    const e1 = estimate(row, page);
    if (e1) entry.e1rm = entry.e1rm == null ? e1 : Math.max(entry.e1rm, e1);
    if (!root.ConditioningScore) return;
    const score = root.ConditioningScore.forPage(page, [row]);
    if (!score.kind || !score.rounds) return;
    entry.conditioning.calories = Math.max(entry.conditioning.calories, score.totals.calories);
    entry.conditioning.meters = Math.max(entry.conditioning.meters, score.totals.meters);
    entry.conditioning.watts = Math.max(entry.conditioning.watts, score.totals.watts);
    if (score.pace500 && (!entry.conditioning.pace500 || score.pace500 < entry.conditioning.pace500)) {
      entry.conditioning.pace500 = score.pace500;
    }
  }

  function table(records) {
    const map = new Map();
    for (const rec of setEntries(records)) applyRow(ensure(map, rec.payload.page), rec.payload.page, rec.payload.row);
    return [...map.values()].filter((row) => row.e1rm || Object.keys(row.repMax).length || row.conditioning.calories || row.conditioning.meters);
  }

  function sessionRows(session) {
    const out = [];
    for (const page of session && session.pages || []) {
      for (const member of page.members || [page]) {
        const sets = session.logs && session.logs[member.id] && session.logs[member.id].sets || [];
        for (const row of sets) out.push({page: member, row});
      }
    }
    return out;
  }

  function detect(session, priorRecords) {
    const prior = new Map(table(priorRecords).map((row) => [row.key, row]));
    const prs = [];
    const seenRep = new Set();
    const seenCond = new Set();
    let e1rmPosted = false;
    for (const {page, row} of sessionRows(session)) {
      if (!scoredSet(row)) continue;
      const entry = {key: keyOf(page), title: titleOf(page), e1rm: null, repMax: {}, conditioning: {calories: 0, meters: 0, watts: 0, pace500: null}};
      applyRow(entry, page, row);
      const was = prior.get(entry.key);
      const reps = Number(row.reps);
      if (Number.isInteger(reps) && entry.repMax[String(reps)]) {
        const mark = `${entry.key}:${reps}`;
        const prev = was && was.repMax[String(reps)] || 0;
        if (!seenRep.has(mark) && entry.repMax[String(reps)] > prev) {
          seenRep.add(mark);
          prs.push({kind: 'rep_max', title: entry.title, reps, kg: entry.repMax[String(reps)]});
        }
      }
      if (!e1rmPosted && entry.e1rm && entry.e1rm > (was && was.e1rm || 0)) {
        e1rmPosted = true;
        prs.push({kind: 'e1rm', title: entry.title, kg: Math.round(entry.e1rm * 10) / 10});
      }
      if (entry.conditioning.calories > (was && was.conditioning.calories || 0) && !seenCond.has(entry.key + ':cal')) {
        seenCond.add(entry.key + ':cal');
        prs.push({kind: 'calories', title: entry.title, value: entry.conditioning.calories});
      }
      if (entry.conditioning.meters > (was && was.conditioning.meters || 0) && !seenCond.has(entry.key + ':m')) {
        seenCond.add(entry.key + ':m');
        prs.push({kind: 'meters', title: entry.title, value: entry.conditioning.meters});
      }
      if (entry.conditioning.watts > (was && was.conditioning.watts || 0) && !seenCond.has(entry.key + ':w')) {
        seenCond.add(entry.key + ':w');
        prs.push({kind: 'watts', title: entry.title, value: entry.conditioning.watts});
      }
      const faster = entry.conditioning.pace500 && (!was || !was.conditioning.pace500 || entry.conditioning.pace500 < was.conditioning.pace500);
      if (faster && !seenCond.has(entry.key + ':p')) {
        seenCond.add(entry.key + ':p');
        prs.push({kind: 'pace500', title: entry.title, value: entry.conditioning.pace500});
      }
    }
    return prs;
  }

  root.StrengthRecords = {table, detect};
})(typeof globalThis !== 'undefined' ? globalThis : this);
