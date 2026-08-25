/**
 * TrainHeroic export → THE Hybrid history. Pure parsing only: no file I/O,
 * no engine calls, no clock. The CLI (`import-trainheroic.mjs`) owns those.
 *
 * The export is a prescription log that sometimes has performance in it. Most
 * rows are an assigned set with nothing typed into it; the minority that carry
 * numbers are the only thing worth importing. Three defects in the real export
 * shape the parsing and are each handled explicitly below:
 *
 *   1. Every load is pound-encoded regardless of the unit word printed next to
 *      it. Rows labelled `kilogram` divide by 2.20462 into whole kilos just as
 *      `pound` rows do, so the label is provenance, not instruction. Some rows
 *      are even labelled `percent` while holding a pound-encoded load
 *      (`8 rep x 220.46 percent` is 100 kg, not 220% of anything).
 *   2. A handful of rows have reps and load transposed (`90, 90, 90 rep x
 *      13.23, 17.64, 17.64 pound` is 90 kg for 6/8/8, not 90 reps at 6 kg).
 *   3. Exercise names collide on punctuation and case, so the same lift lands
 *      under several ids unless names are normalised before grouping.
 *   4. Some names are abbreviations or redundant prefixes for the same lift
 *      (`Trap Bar DL`, `Barbell Deadlift`). Those are folded via aliases.mjs;
 *      training variants (`Pause Back Squat`, `Deficit Deadlift`) are not.
 */

import { exerciseIdFromRaw, resolveExerciseName } from './aliases.mjs';

/** TrainHeroic writes lb with float noise; kg is the app's storage unit. */
const LB_PER_KG = 2.20462;

/** Below this the "load" column cannot be a barbell load, and above the rep
 * threshold the "rep" column cannot be a rep count. Both must hold before a
 * row is treated as transposed — either alone is a normal heavy or light set. */
const SWAP_MIN_REPS_AS_LOAD = 40;
const SWAP_MAX_LOAD_AS_REPS = 30;

/** A set this heavy or this high-rep is a data-entry artifact, not a lift. */
const MAX_PLAUSIBLE_LOAD_KG = 500;
const MAX_PLAUSIBLE_REPS = 200;

/** Units that always denote a load in this export. */
const LOAD_UNITS = new Set(['pound', 'kilogram']);

/** A `percent`-labelled value above this cannot be a training percentage, so
 * it is the same pound-encoded load every other row carries. At or below it the
 * row is genuinely ambiguous — a real 80% and an 80 lb load look identical —
 * and it is left out rather than guessed at. */
const PERCENT_AS_LOAD_MIN = 100;

const DATA_RE = /^\s*([^x]*?)\s*x\s*(.*?)\s*$/;
const NUM_RE = /[0-9]+(?:\.[0-9]+)?/g;

/** Trailing word of each half of `<values> <unit> x <values> <unit>`. */
function unitOf(half) {
  const m = String(half || '').trim().match(/([A-Za-z][A-Za-z ]*)$/);
  return m ? m[1].trim().toLowerCase() : '';
}

function numbersIn(half) {
  const m = String(half || '').match(NUM_RE);
  return m ? m.map(Number) : [];
}

/**
 * A trailing plural on the last word is a spelling choice, not a different
 * lift: "Pendlay Rows" and "Pendlay Row" are one exercise, and left unfolded
 * they split one history into two too-thin ones. `-ss` is preserved because
 * "Press" and "Cross" are not plurals.
 */
function singularise(word) {
  if (word.length <= 3) return word;
  if (word.endsWith('ss') || word.endsWith('us')) return word;
  return word.endsWith('s') ? word.slice(0, -1) : word;
}

/**
 * Names differ only by case, curly vs straight apostrophe, spacing or plural
 * far more often than they differ by meaning. Collapsing those is what keeps
 * "World’s Greatest Stretch" and "Worlds Greatest Stretch" from becoming two
 * lifts. Nothing beyond those is folded: "Pause Back Squat" and "Back Squat"
 * are genuinely different lifts and merging them would invent a history.
 */
export function normaliseExerciseName(raw) {
  const words = String(raw || '')
    .replace(/[\u2018\u2019\u02BC]/g, "'")
    .replace(/[\u2013\u2014]/g, '-')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
  if (!words.length) return '';
  words[words.length - 1] = singularise(words[words.length - 1]);
  return words.join(' ');
}

export function exerciseIdFor(raw) {
  return exerciseIdFromRaw(raw);
}

/** Pound-encoded regardless of label (defect 1). Snapped to 0.5 kg because the
 * athlete loaded real plates; 59.9997 is float noise, not a 59.9997 kg lift. */
export function loadToKg(value) {
  const kg = Number(value) / LB_PER_KG;
  if (!Number.isFinite(kg)) return null;
  const snapped = Math.round(kg * 2) / 2;
  return Math.abs(kg - snapped) <= 0.05 ? snapped : Math.round(kg * 100) / 100;
}

/**
 * `"5, 5, 3 rep x 100, 110, 120 pound"` → typed halves. Returns null when the
 * row is not a rep-by-load pair, which is the common case: the export is
 * mostly `rep x  pound` with nothing logged, plus conditioning shapes
 * (`time x calorie`, `meter x time`) that carry no strength signal.
 */
export function parseExerciseData(raw) {
  const text = String(raw || '').trim();
  if (!text || text === 'x') return null;
  const m = DATA_RE.exec(text);
  if (!m) return null;

  const [, left, right] = m;
  const repUnit = unitOf(left);
  const loadUnit = unitOf(right);
  if (repUnit !== 'rep') return null;

  const reps = numbersIn(left);
  const loads = numbersIn(right);
  if (!reps.length || !loads.length) return null;

  if (!LOAD_UNITS.has(loadUnit)) {
    if (loadUnit !== 'percent') return null;
    if (Math.max(...loads) <= PERCENT_AS_LOAD_MIN) return null;
  }

  return { reps, loads, loadUnit };
}

/** Defect 2. Reported rather than silently corrected: a transposed row that
 * imports as 90 reps of 6 kg poisons e1RM, and one that is silently swapped
 * gives no way to check the guess. */
export function detectSwap(reps, loadsKg) {
  const maxRep = Math.max(...reps);
  const minRep = Math.min(...reps);
  const maxLoad = Math.max(...loadsKg);
  return maxRep > SWAP_MIN_REPS_AS_LOAD && minRep >= 20 && maxLoad < SWAP_MAX_LOAD_AS_REPS;
}

/**
 * One CSV row → performed sets. Sets are positional: the nth rep count belongs
 * to the nth load. Ragged rows keep the pairs that exist rather than dropping
 * the row, since a 5-set row with 3 loads logged is three real sets.
 */
export function setsFromRow(row) {
  const parsed = parseExerciseData(row.ExerciseData);
  if (!parsed) return { sets: [], skipped: parsed === null ? 'no_performance' : 'unparsed' };

  let reps = parsed.reps;
  let loadsKg = parsed.loads.map(loadToKg).filter((v) => v != null);
  if (!loadsKg.length) return { sets: [], skipped: 'no_load' };

  let swapped = false;
  if (detectSwap(reps, loadsKg)) {
    swapped = true;
    const trueLoads = reps.map((v) => Math.round(v * 2) / 2);
    const trueReps = parsed.loads.map((v) => Math.round(v / LB_PER_KG));
    reps = trueReps;
    loadsKg = trueLoads;
  }

  const sets = [];
  const pairs = Math.min(reps.length, loadsKg.length);
  let dropped = 0;
  for (let i = 0; i < pairs; i++) {
    const r = reps[i];
    const kg = loadsKg[i];
    if (!(r > 0) || !(kg > 0)) { dropped++; continue; }
    if (r > MAX_PLAUSIBLE_REPS || kg > MAX_PLAUSIBLE_LOAD_KG) { dropped++; continue; }
    sets.push({ n: sets.length + 1, reps: r, weight: kg });
  }
  return { sets, swapped, dropped, unit: parsed.loadUnit };
}

/** TrainHeroic writes `0000-00-00` for rows that never had a real date. */
export function normaliseDate(raw) {
  const s = String(raw || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return '';
  if (s.startsWith('0000')) return '';
  return s;
}

/**
 * Rows → sessions grouped by the day they were performed. RescheduledDate wins
 * when present: it is the day the work actually happened, and grouping by the
 * originally scheduled day would file it under a session the athlete skipped.
 */
export function buildSessions(rows) {
  const byDay = new Map();
  const stats = {
    rowsTotal: rows.length,
    rowsWithSets: 0,
    setsKept: 0,
    setsDropped: 0,
    rowsSwapped: 0,
    rowsNoDate: 0,
    unitLabels: {},
    aliasesApplied: 0,
  };

  for (const row of rows) {
    const { sets, swapped, dropped, unit } = setsFromRow(row);
    if (dropped) stats.setsDropped += dropped;
    if (!sets.length) continue;

    const date = normaliseDate(row.RescheduledDate) || normaliseDate(row.ScheduledDate);
    if (!date) { stats.rowsNoDate++; continue; }

    stats.rowsWithSets++;
    stats.setsKept += sets.length;
    if (swapped) stats.rowsSwapped++;
    if (unit) stats.unitLabels[unit] = (stats.unitLabels[unit] || 0) + 1;

    const name = String(row.WorkoutTitle || '').trim() || 'Training';
    const key = `${date}::${name}`;
    if (!byDay.has(key)) byDay.set(key, { date, name, notes: String(row.WorkoutNotes || '').trim(), tasks: new Map() });
    const session = byDay.get(key);

    const exTitle = String(row.ExerciseTitle || '').trim();
    const resolved = resolveExerciseName(exTitle);
    if (resolved.aliased) stats.aliasesApplied++;
    const exerciseId = exerciseIdFromRaw(exTitle);
    if (!exerciseId) continue;

    if (!session.tasks.has(exerciseId)) {
      session.tasks.set(exerciseId, { exerciseId, name: exTitle, rows: [], note: String(row.ExerciseNotes || '').trim() });
    }
    const task = session.tasks.get(exerciseId);
    for (const s of sets) task.rows.push(s);
  }

  const sessions = [...byDay.values()]
    .map((s) => ({
      date: s.date,
      name: s.name,
      notes: s.notes,
      tasks: [...s.tasks.values()].map((t) => ({
        ...t,
        rows: t.rows.map((r, i) => ({ ...r, n: i + 1 })),
      })),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return { sessions, stats };
}

/** Canonical display name per id — the most frequent spelling wins, so the
 * catalog shows the one the athlete actually used most. */
export function canonicalNames(rows) {
  const counts = new Map();
  for (const row of rows) {
    const title = String(row.ExerciseTitle || '').trim();
    const id = exerciseIdFromRaw(title);
    if (!id) continue;
    if (!counts.has(id)) counts.set(id, new Map());
    const m = counts.get(id);
    m.set(title, (m.get(title) || 0) + 1);
  }
  const out = new Map();
  for (const [id, spellings] of counts) {
    let best = null;
    let bestN = -1;
    for (const [name, n] of spellings) if (n > bestN) { best = name; bestN = n; }
    out.set(id, { name: best, variants: [...spellings.keys()] });
  }
  return out;
}
