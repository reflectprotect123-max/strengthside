#!/usr/bin/env node
/**
 * TrainHeroic export → THE Hybrid backup JSON (history only).
 *
 *   node tools/trainheroic-import/import-trainheroic.mjs <export-dir> [--out FILE] [--audit-only]
 *
 * Emits completed sessions, an exercise catalog, and seeded working maxes and
 * PR events. It deliberately does NOT emit templates: programme structure stays
 * in the builder, which this import never touches.
 *
 * e1RM, PR detection and working-max selection all run through
 * `strength-bundle.js` rather than re-deriving the formulas here. A second
 * implementation of Epley in a one-off importer is a second thing to keep in
 * step with the engine, and it would drift.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { buildSessions, canonicalNames, exerciseIdFor } from './parse.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const BUNDLE = join(HERE, '../../apps/mobile/prototype/hybrid-app/strength-bundle.js');

/** Only seed a working max once a lift has this many separate logged days.
 * One heavy day is an anecdote; the engine treats a thin history as
 * uncalibrated anyway, so seeding from it would assert more than is known. */
const MIN_DAYS_FOR_WORKING_MAX = 3;

/** The anchor is drawn from this many of the most recent logged days for the
 * lift, rather than from a fixed calendar window. A fixed window silently
 * drops any lift trained hard last year and only touched once since — the
 * athlete still has a real max there, it is just old, and an unseeded lift
 * tells them nothing while a dated one tells them exactly how stale it is. */
const WORKING_MAX_RECENT_DAYS = 6;

/** Anchors older than this are reported separately: still imported, but not
 * something to prescribe against without a re-test. */
const STALE_AFTER_DAYS = 180;

/** RFC4180 enough for this export: the notes columns contain embedded newlines
 * and quotes, so a line-split parser silently mangles roughly two rows in three. */
function parseCsv(text) {
  const src = text.replace(/^\uFEFF/, '');
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; } else quoted = false;
      } else field += c;
      continue;
    }
    if (c === '"') { quoted = true; continue; }
    if (c === ',') { row.push(field); field = ''; continue; }
    if (c === '\r') continue;
    if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; continue; }
    field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  if (!rows.length) return [];
  const header = rows.shift().map((h) => h.trim());
  return rows
    .filter((r) => r.length && r.some((v) => String(v).trim() !== ''))
    .map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])));
}

function loadEngine() {
  if (!existsSync(BUNDLE)) {
    throw new Error(`strength-bundle.js missing — run: bash apps/mobile/prototype/hybrid-app/build-strength.sh`);
  }
  const sandbox = { console };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(readFileSync(BUNDLE, 'utf8'), sandbox);
  if (!sandbox.HybridStrength) throw new Error('strength-bundle.js did not expose HybridStrength');
  return sandbox.HybridStrength;
}

function daysBetween(a, b) {
  return Math.abs(new Date(a) - new Date(b)) / 86400000;
}

/**
 * Working max per lift: the best estimated 1RM inside the recency window,
 * rounded DOWN to a 2.5 kg step. Down rather than nearest because the working
 * max is what future percentages resolve against — rounding up prescribes a
 * load the athlete has never actually hit.
 */
function seedWorkingMaxes(engine, sessions, latestDate) {
  const byExercise = new Map();
  for (const s of sessions) {
    for (const t of s.tasks) {
      if (!byExercise.has(t.exerciseId)) byExercise.set(t.exerciseId, new Map());
      const days = byExercise.get(t.exerciseId);
      if (!days.has(s.date)) days.set(s.date, []);
      const bucket = days.get(s.date);
      for (const r of t.rows) if (r.reps > 0 && r.weight > 0) bucket.push(r);
    }
  }

  const events = [];
  const skipped = [];
  const stale = [];
  for (const [exerciseId, days] of byExercise) {
    const dates = [...days.keys()].sort();
    if (dates.length < MIN_DAYS_FOR_WORKING_MAX) {
      skipped.push({ exerciseId, days: dates.length });
      continue;
    }
    const recent = dates.slice(-WORKING_MAX_RECENT_DAYS);
    let best = 0;
    let at = '';
    for (const d of recent) {
      for (const r of days.get(d)) {
        const est = engine.E1rm.e1rm(r.weight, r.reps);
        if (est > best) { best = est; at = d; }
      }
    }
    if (!(best > 0)) { skipped.push({ exerciseId, days: dates.length }); continue; }

    const valueKg = Math.floor(best / 2.5) * 2.5;
    if (!(valueKg > 0)) continue;
    const lastLogged = dates[dates.length - 1];
    const ageDays = Math.round(daysBetween(lastLogged, latestDate));
    if (ageDays > STALE_AFTER_DAYS) stale.push({ exerciseId, ageDays, valueKg });
    events.push({
      id: `thwm-${exerciseId}`,
      athleteId: 'local',
      exerciseId,
      valueKg,
      source: 'auto_estimate',
      formula: 'epley',
      fromSetId: null,
      effectiveAt: `${at}T12:00:00.000Z`,
    });
  }
  events.sort((a, b) => b.valueKg - a.valueKg);
  return { events, skipped, stale };
}

/** PRs are per rep-count, matching `pr_event`'s key: a 3RM and a 5RM are
 * different records. Replays sets in date order through the engine's own
 * detector so the imported list is the list the app would have produced. */
function seedPrEvents(engine, sessions) {
  const events = [];
  for (const s of sessions) {
    for (const t of s.tasks) {
      for (const r of t.rows) {
        if (!(r.reps > 0) || !(r.weight > 0)) continue;
        const candidate = { exerciseId: t.exerciseId, reps: r.reps, loadKg: r.weight };
        if (!engine.Pr.detectPr(candidate, events)) continue;
        events.push({
          exerciseId: t.exerciseId,
          repCount: r.reps,
          valueKg: r.weight,
          achievedAt: `${s.date}T12:00:00.000Z`,
          performedSetId: `th-${s.date}-${t.exerciseId}-${r.n}`,
        });
      }
    }
  }
  return events;
}

function toAppSessions(sessions, names) {
  return sessions.map((s, i) => {
    const id = `th-${s.date}-${i + 1}`;
    const completedAt = new Date(`${s.date}T12:00:00.000Z`).getTime();
    return {
      id,
      status: 'completed',
      date: s.date,
      name: s.name,
      completedAt,
      source: 'trainheroic-import',
      notes: s.notes || '',
      tasks: s.tasks.map((t, j) => ({
        id: `${id}-t${j + 1}`,
        kind: 'strength',
        exerciseId: t.exerciseId,
        name: (names.get(t.exerciseId) || {}).name || t.name,
        rows: t.rows.map((r) => ({
          id: `${id}-t${j + 1}-r${r.n}`,
          n: r.n,
          weight: r.weight,
          reps: r.reps,
          done: true,
        })),
      })),
    };
  });
}

function buildExerciseCatalog(names, usedIds, library) {
  const out = [];
  for (const id of usedIds) {
    const entry = names.get(id);
    if (!entry) continue;
    out.push({
      id,
      name: entry.name,
      category: library.has(id) ? 'TrainHeroic' : 'Imported',
      builtIn: false,
      source: 'trainheroic-import',
      percentCalc: false,
      manual1rm: '',
    });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

function fmt(n) {
  return String(n).padStart(6);
}

function main(argv) {
  const dir = argv[0];
  if (!dir) {
    console.error('usage: import-trainheroic.mjs <export-dir> [--out FILE] [--audit-only]');
    process.exit(2);
  }
  const auditOnly = argv.includes('--audit-only');
  const outIdx = argv.indexOf('--out');
  const outFile = outIdx >= 0 ? argv[outIdx + 1] : join(process.cwd(), 'THE-trainheroic-import.json');

  const trainingPath = join(dir, 'training_data.csv');
  if (!existsSync(trainingPath)) {
    console.error(`FAIL — ${trainingPath} not found. Point this at the unzipped export directory.`);
    process.exit(1);
  }

  const engine = loadEngine();
  const rows = parseCsv(readFileSync(trainingPath, 'utf8'));

  const libraryPath = join(dir, 'exercise_library.csv');
  const library = new Set(
    existsSync(libraryPath)
      ? parseCsv(readFileSync(libraryPath, 'utf8')).map((r) => exerciseIdFor(r.CustomExercise)).filter(Boolean)
      : [],
  );

  const { sessions, stats } = buildSessions(rows);
  const names = canonicalNames(rows);

  if (!sessions.length) {
    console.error('FAIL — no performed sets found. Nothing to import.');
    process.exit(1);
  }

  const latestDate = sessions[sessions.length - 1].date;
  const appSessions = toAppSessions(sessions, names);
  const usedIds = [...new Set(sessions.flatMap((s) => s.tasks.map((t) => t.exerciseId)))];
  const exercises = buildExerciseCatalog(names, usedIds, library);
  const { events: workingMaxEvents, skipped, stale } = seedWorkingMaxes(engine, sessions, latestDate);
  const prEvents = seedPrEvents(engine, sessions);

  const merged = [...names.values()].filter((v) => v.variants.length > 1);

  console.log('TrainHeroic import audit');
  console.log('========================');
  console.log(`  ${fmt(stats.rowsTotal)}  rows in training_data.csv`);
  console.log(`  ${fmt(stats.rowsWithSets)}  rows carrying performed sets`);
  console.log(`  ${fmt(stats.rowsTotal - stats.rowsWithSets)}  rows with no performance (prescription only — skipped)`);
  console.log(`  ${fmt(stats.setsKept)}  sets imported`);
  console.log(`  ${fmt(stats.setsDropped)}  sets dropped (zero/implausible values)`);
  console.log(`  ${fmt(stats.rowsSwapped)}  rows had reps/load transposed (corrected)`);
  console.log(`  ${fmt(stats.rowsNoDate)}  rows had no usable date (skipped)`);
  console.log('');
  console.log(`  ${fmt(appSessions.length)}  sessions  ${sessions[0].date} → ${latestDate}`);
  console.log(`  ${fmt(exercises.length)}  exercises`);
  console.log(`  ${fmt(merged.length)}  exercise names merged from spelling variants`);
  console.log(`  ${fmt(stats.aliasesApplied)}  rows folded via naming rules + aliases`);
  console.log(`  ${fmt(workingMaxEvents.length)}  working maxes seeded (>=${MIN_DAYS_FOR_WORKING_MAX} logged days)`);
  console.log(`  ${fmt(stale.length)}  of those are stale (>${STALE_AFTER_DAYS}d since last logged — re-test before trusting)`);
  console.log(`  ${fmt(skipped.length)}  lifts left unseeded (too little history)`);
  console.log(`  ${fmt(prEvents.length)}  PR events`);
  console.log('');
  console.log('  unit labels seen: ' + (Object.entries(stats.unitLabels).map(([k, v]) => `${k}=${v}`).join(', ') || 'none'));
  console.log('  NOTE: every load was pound-encoded regardless of label; all converted to kg.');
  console.log('');
  console.log('Top seeded working maxes');
  console.log('------------------------');
  const staleIds = new Set(stale.map((s) => s.exerciseId));
  for (const e of workingMaxEvents.slice(0, 15)) {
    const nm = (names.get(e.exerciseId) || {}).name || e.exerciseId;
    const flag = staleIds.has(e.exerciseId) ? '  [stale]' : '';
    console.log(`  ${String(Math.round(e.valueKg)).padStart(5)} kg  ${nm}  (${e.effectiveAt.slice(0, 10)})${flag}`);
  }
  if (merged.length) {
    console.log('');
    console.log('Merged name variants');
    console.log('--------------------');
    for (const m of merged.slice(0, 10)) console.log(`  ${m.name}  ←  ${m.variants.join(' | ')}`);
  }

  if (auditOnly) return;

  const payload = {
    seedId: 'trainheroic-2026-08-25-v2',
    backupVersion: 13,
    exportedAt: new Date().toISOString(),
    app: 'THE — The Hybrid Engine',
    build: 'trainheroic-import',
    state: {
      sessions: appSessions,
      exercises,
      templates: [],
      dailyCheckins: [],
      strengthState: { workingMaxEvents, prEvents, loadHints: {} },
    },
  };
  writeFileSync(outFile, JSON.stringify(payload, null, 2));
  console.log('');
  console.log(`Wrote ${outFile}`);
  console.log('Import it in the app: Settings → import backup.');
}

main(process.argv.slice(2));
