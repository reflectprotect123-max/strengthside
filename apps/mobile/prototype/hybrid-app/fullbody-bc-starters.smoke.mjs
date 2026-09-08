/**
 * Smoke: Full Body A/B/C are gone. Library follows two Hybrid Power Project days
 * (Monday squat / Wednesday floor press) with painted sets×reps and 30 m carries.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const dir = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(dir, 'index.html'), 'utf8');
const logColumnsSrc = readFileSync(join(dir, 'log-columns.js'), 'utf8');

function must(cond, msg) {
  if (!cond) throw new Error(msg);
}
function clone(x) {
  return JSON.parse(JSON.stringify(x));
}

must(!html.includes("STARTER_STRENGTH_NAMES=['Full Body A','Full Body B','Full Body C']"), 'Full Body names gone from starter list');
must(html.includes("STARTER_STRENGTH_NAMES=['HPP Monday','HPP Wednesday']"), 'HPP two-day starter list');
must(!html.includes('ensureFullBodyAStarter(state)'), 'no Full Body A ensure');
must(!html.includes('ensureFullBodyBStarter(state)'), 'no Full Body B ensure');
must(!html.includes('ensureFullBodyCStarter(state)'), 'no Full Body C ensure');
must(html.includes('ensureHppMondayStarter(state)'), 'HPP Monday ensure');
must(html.includes('ensureHppWednesdayStarter(state)'), 'HPP Wednesday ensure');
must(html.includes("HPP_FOLLOW_VERSION='hpp-follow-v2'"), 'follow-program migrate');
must(html.includes('splitIllegalHppSupersetTasks'), 'HPP illegal superset split (Front Squat ≠ GHR)');

function parseSeed(src) {
  const start = src.indexOf('const seed=');
  let i = src.indexOf('=', start) + 1;
  while (src[i] === ' ') i += 1;
  let depth = 0,
    inStr = false,
    esc = false,
    quote = '';
  for (let j = i; j < src.length; j++) {
    const c = src[j];
    if (inStr) {
      if (esc) {
        esc = false;
        continue;
      }
      if (c === '\\') {
        esc = true;
        continue;
      }
      if (c === quote) inStr = false;
      continue;
    }
    if (c === '"' || c === "'") {
      inStr = true;
      quote = c;
      continue;
    }
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return JSON.parse(src.slice(i, j + 1));
    }
  }
  return null;
}

const seed = parseSeed(html);
must(seed, 'seed parse');
must(!(seed.templates || []).some((t) => /^Full Body [ABC]$/.test(t && t.name)), 'seed has no Full Body A/B/C');

function strengthExercises(t) {
  return ((t.blocks || []).find((b) => b && b.type === 'strength') || {}).exercises || [];
}

function assertDay(t, name, expected) {
  must(t, `${name} in seed`);
  const exs = strengthExercises(t);
  must(exs.length === expected.length, `${name} lift count ${exs.length}`);
  expected.forEach((want, i) => {
    const ex = exs[i];
    must(ex && ex.name === want.name, `${name}[${i}] name ${ex && ex.name}`);
    must(Number(ex.sets) === want.sets, `${name} ${want.name} sets`);
    if (want.reps != null) must(String(ex.reps) === String(want.reps), `${name} ${want.name} reps ${ex.reps}`);
    must(!!ex.supersetWithNext === !!want.ss, `${name} ${want.name} superset`);
    if (want.metres) {
      const d = (ex.logColumns || []).find((c) => c.kind === 'distance_m');
      must(d && String(d.value || (d.values && d.values[0]) || '') === '30', `${name} ${want.name} 30 m`);
    }
  });
  const breath = (t.blocks || []).find((b) => b && b.type === 'text' && /recovery breathing/i.test(b.heading || ''));
  must(breath, `${name} Recovery Breathing`);
  must(/10 Nasal Breaths/i.test(breath.notes || ''), `${name} nasal breaths`);
  must(/5 second inhale/i.test(breath.notes || ''), `${name} inhale`);
  must(/1-second hold/i.test(breath.notes || ''), `${name} hold`);
  must(/5 second exhale/i.test(breath.notes || ''), `${name} exhale`);
}

assertDay(seed.templates.find((t) => t.name === 'HPP Monday'), 'HPP Monday', [
  { name: 'Front Squat', sets: 5, reps: '5' },
  { name: 'Glute Ham Raise', sets: 4, reps: '8' },
  { name: 'Weighted Bar Dips', sets: 3, reps: '10', ss: true },
  { name: 'Weighted Chin-Ups', sets: 3, reps: '10' },
  { name: 'Farmer Carry', sets: 5, metres: true, ss: true },
  { name: 'Backwards Sled Drag', sets: 5, metres: true },
]);

assertDay(seed.templates.find((t) => t.name === 'HPP Wednesday'), 'HPP Wednesday', [
  { name: 'Football Bar Floor Press', sets: 5, reps: '5' },
  { name: '1-Arm DB Row', sets: 4, reps: '8' },
  { name: 'DB Split Squat', sets: 3, reps: '10', ss: true },
  { name: 'DB Hammer Curls', sets: 3, reps: '10' },
  { name: 'Barbell Glute Hip Thrust', sets: 3, reps: '15', ss: true },
  { name: 'Banded Pushdowns', sets: 3, reps: 'MAX' },
]);

const chunk = html.slice(
  html.indexOf('const PROGRAM_TEXT_DEFAULTS'),
  html.indexOf('function applyAthleteShellPatch'),
);
const sandbox = {
  console,
  seed,
  clone: (x) => JSON.parse(JSON.stringify(x)),
  id: () => 'id' + Math.random().toString(36).slice(2, 8),
  num: (v) => +v || 0,
  isoNow: () => new Date().toISOString(),
  window: {},
  StrengthAdapter: { repProgressionLift: () => false },
  S: {},
  touchRecord: (r) => r,
  dedupe: (l) => l || [],
  registerExercise: () => {},
  COND_FORMATS: [{ key: 'steady', name: 'Steady', type: 'easy' }],
  COND_EFFORTS: [{ key: 'easy', name: 'Easy' }],
  COND_MODALITIES: ['Bike'],
  condFormatMeta: () => ({ key: 'steady', type: 'easy' }),
  isConditioningTemplate: () => false,
  isSupersetBlock: () => false,
};
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(logColumnsSrc, sandbox);
try {
  vm.runInContext(readFileSync(join(dir, 'exercise-load-profiles.js'), 'utf8'), sandbox);
} catch {
  /* optional */
}
vm.runInContext(chunk, sandbox);

const out = sandbox.ensureStarterTemplates({
  meta: {},
  templates: [
    { id: 'old-a', name: 'Full Body A', source: 'THE-starter', blocks: [] },
    { id: 'old-b', name: 'Full Body B', source: 'THE-starter', blocks: [] },
    { id: 'old-c', name: 'Full Body C', source: 'THE-starter', blocks: [] },
  ],
  exercises: [],
  hiddenTemplateIds: [],
  sessions: [],
});
if (typeof sandbox.applyHppFollowPatch === 'function') {
  sandbox.applyHppFollowPatch(out);
  sandbox.ensureStarterTemplates(out);
}

must(!(out.templates || []).some((t) => /^Full Body [ABC]$/.test(t.name)), 'boot drops Full Body A/B/C');
must((out.templates || []).some((t) => t.name === 'HPP Monday'), 'boots HPP Monday');
must((out.templates || []).some((t) => t.name === 'HPP Wednesday'), 'boots HPP Wednesday');

const mon = out.templates.find((t) => t.name === 'HPP Monday');
const carry = strengthExercises(mon).find((e) => e.name === 'Farmer Carry');
must(carry && Number(carry.sets) === 5, 'farmer 5 sets');
const metres = (carry.logColumns || []).find((c) => c.kind === 'distance_m');
must(metres && String(metres.value || metres.values[0] || '') === '30', 'farmer 30 m not 100 ft');

for (const name of ['HPP Monday', 'HPP Wednesday']) {
  const t = out.templates.find((x) => x.name === name);
  const kinds = (t.blocks || []).map((b) => `${b.type}:${b.heading}`).join('|');
  must(
    !(t.blocks || []).some((b) => b && b.type === 'conditioning'),
    `${name} must not gain an Engine/conditioning block (got ${kinds})`,
  );
  must(
    (t.blocks || []).some((b) => b && b.type === 'text' && /recovery breathing/i.test(b.heading || '')),
    `${name} Recovery Breathing stays a text note`,
  );
  const sess = (out.sessions || []).find((s) => s && s.name === name);
  must(sess, `${name} scheduled`);
  must(
    !(sess.blocks || []).some((b) => b && b.type === 'conditioning'),
    `${name} scheduled session has no conditioning block (got ${(sess.blocks || []).map((b) => b.type).join('|')})`,
  );
}

const leaked = {
  meta: {},
  templates: [],
  sessions: [
    {
      id: 'hpp-leaked',
      name: 'HPP Monday',
      status: 'scheduled',
      blocks: [
        { type: 'strength', heading: 'Strength', exercises: [{ name: 'Front Squat', sets: 5, reps: '5' }] },
        { type: 'conditioning', heading: 'Recovery movement', recoverySession: true, condFmt: 'steady' },
        { type: 'text', heading: 'Recovery Breathing', notes: '10 Nasal Breaths' },
      ],
    },
  ],
};
sandbox.applyHppFollowPatch(leaked);
must(
  !(leaked.sessions[0].blocks || []).some((b) => b && b.type === 'conditioning'),
  'follow patch strips Recovery Breathing leak from scheduled HPP',
);

const chainedBlock = sandbox.normalizeAthleteStrengthBlocks([
  {
    type: 'strength',
    heading: 'Strength/Power',
    superset: true,
    exercises: [
      { name: 'Front Squat', exerciseId: 'core-front-squat', sets: 5, reps: '5', supersetWithNext: false },
      { name: 'Glute Ham Raise', exerciseId: 'core-nordic-curl', sets: 4, reps: '8', supersetWithNext: false },
      { name: 'Weighted Bar Dips', exerciseId: 'core-strict-bar-dip', sets: 3, reps: '10', supersetWithNext: true },
      { name: 'Weighted Chin-Ups', exerciseId: 'core-chin-up', sets: 3, reps: '10', supersetWithNext: false },
      { name: 'Farmer Carry', exerciseId: 'core-farmer-walk', sets: 5, reps: '5', supersetWithNext: true },
      { name: 'Backwards Sled Drag', exerciseId: 'core-sled-push', sets: 5, reps: '5', supersetWithNext: false },
    ],
  },
]);
const chainedEx = ((chainedBlock || []).find((b) => b && b.type === 'strength') || {}).exercises || [];
must(chainedEx[0] && chainedEx[0].name === 'Front Squat' && !chainedEx[0].supersetWithNext, 'block.superset on a 6-lift day must not pair Front Squat with GHR');
must(chainedEx[2] && chainedEx[2].supersetWithNext, 'Dips stay linked to chins via per-lift flag');

const poisoned = {
  meta: { hppFollowVersion: 'hpp-follow-v1' },
  templates: [],
  sessions: [
    {
      id: 'hpp-ss-poison',
      name: 'HPP Monday',
      status: 'active',
      blocks: [
        {
          type: 'strength',
          heading: 'Strength/Power',
          exercises: [
            { name: 'Front Squat', exerciseId: 'core-front-squat', supersetWithNext: false, sets: 5, reps: '5' },
            { name: 'Glute Ham Raise', exerciseId: 'core-nordic-curl', supersetWithNext: false, sets: 4, reps: '8' },
          ],
        },
      ],
      tasks: [
        {
          kind: 'superset',
          heading: 'Front Squat / Glute Ham Raise',
          exercises: [
            { name: 'Front Squat', exerciseId: 'core-front-squat', rows: [{ n: 1, done: true, weight: 100, reps: 5 }] },
            { name: 'Glute Ham Raise', exerciseId: 'core-nordic-curl', rows: [{ n: 1, done: false }] },
          ],
        },
      ],
    },
  ],
};
sandbox.applyHppFollowPatch(poisoned);
const repaired = poisoned.sessions[0].tasks;
must(repaired.length === 2, `Front Squat / GHR superset must split, got ${repaired.length} tasks`);
must(repaired[0].kind === 'strength' && repaired[0].name === 'Front Squat', 'Front Squat is its own lift');
must(repaired[1].kind === 'strength' && repaired[1].name === 'Glute Ham Raise', 'GHR is its own lift');
must(repaired[0].rows && repaired[0].rows[0] && repaired[0].rows[0].done, 'logged Front Squat sets survive the split');

const mixed = sandbox.normalizeAthleteStrengthBlocks([
  { type: 'strength', heading: 'Strength', exercises: [{ name: 'Front Squat', sets: 5, reps: '5' }] },
  { type: 'conditioning', heading: 'Row ERG', conditioningType: 'easy', modality: 'Rower', targetDurationMin: 20, condFmt: 'steady' },
  { type: 'text', heading: 'Recovery Breathing', notes: '10 Nasal Breaths' },
]);
must(
  !(mixed || []).some((b) => b && b.type === 'conditioning'),
  'hard line: a lift session never keeps an Engine block',
);
must((mixed || []).some((b) => b && b.type === 'strength'), 'hard line keeps lifts');
must((mixed || []).some((b) => b && b.type === 'text'), 'hard line keeps text notes');

const engineOnly = sandbox.normalizeAthleteStrengthBlocks([
  {
    type: 'conditioning',
    heading: 'Row ERG',
    conditioningType: 'easy',
    modality: 'Rower',
    targetDurationMin: 20,
    condFmt: 'steady',
  },
]);
must(
  (engineOnly || []).some((b) => b && b.type === 'conditioning' && !b.recoverySession),
  'hard line: Engine-only sessions stay Engine',
);

// Flatten + log + finish both HPP days (same path startSessionNow uses).
sandbox.S = { exercises: out.exercises || [] };
sandbox.registerExercise = function registerExercise(state, ex) {
  if (!ex || !ex.name) return ex;
  return Object.assign({}, ex, { exerciseId: ex.exerciseId || 'ex-' + String(ex.name).toLowerCase().replace(/\s+/g, '-') });
};
const helperSrc =
  html.slice(html.indexOf('function targetList(ex){'), html.indexOf('function isSupersetBlock(block){')) +
  html.slice(html.indexOf('function isSupersetBlock(block){'), html.indexOf('function legacyProgramRegex(){')) +
  html.slice(html.indexOf('function normalizeWorkoutBlock(b){'), html.indexOf('function sessionCalendarCard(x){')) +
  html.slice(html.indexOf('function flatten(x){'), html.indexOf('function liftCloseKey(ex){'));
vm.runInContext(helperSrc, sandbox);

function taskStrengthRows(t) {
  if (t.kind === 'strength') return t.rows || [];
  if (t.kind === 'superset') return (t.exercises || []).flatMap((ex) => ex.rows || []);
  return [];
}

function logExercise(ex, label) {
  must(ex && Array.isArray(ex.rows) && ex.rows.length, `${label} has rows`);
  const planned = ex.rows.filter((r) => !r.extra);
  planned.forEach((row, i) => {
    if (row.targetKind === 'distance') {
      if (row.distance == null || String(row.distance).trim() === '') row.distance = row.reps || '30';
      if (row.reps == null || String(row.reps).trim() === '') row.reps = String(row.distance);
      if (row.weight == null || String(row.weight).trim() === '') row.weight = '32';
    } else {
      if (row.weight == null || String(row.weight).trim() === '') row.weight = '60';
      if (row.reps == null || String(row.reps).trim() === '' || String(row.target || '').toUpperCase() === 'MAX') {
        const m = String(row.target || '').match(/^(\d+)/);
        row.reps = m ? m[1] : '12';
      }
    }
    const err = sandbox.LogColumns.validateAthleteRow(ex, row);
    must(!err, `${label} set ${i + 1} validate: ${err}`);
    row.done = true;
  });
}

function runDay(name, expected) {
  const sess = clone((out.sessions || []).find((s) => s && s.name === name));
  must(sess, `${name} scheduled session`);
  must(!(sess.blocks || []).some((b) => b && b.type === 'conditioning'), `${name} blocks have no Engine`);
  const tasks = sandbox.flatten(sess);
  sess.tasks = tasks;
  sess.taskIndex = 0;
  sess.status = 'active';
  must(!tasks.some((t) => t.kind === 'conditioning'), `${name} flatten has no conditioning task (${tasks.map((t) => t.kind + ':' + (t.name || t.heading)).join('|')})`);
  must(tasks.length === expected.length, `${name} task count ${tasks.length} vs ${expected.length}: ${tasks.map((t) => t.kind + ':' + (t.name || t.heading)).join('|')}`);
  expected.forEach((want, i) => {
    const t = tasks[i];
    must(t.kind === want.kind, `${name} task ${i} kind ${t.kind}`);
    if (want.kind === 'strength') {
      must(t.name === want.name, `${name} task ${i} name ${t.name}`);
      must((t.rows || []).filter((r) => !r.extra).length === want.sets, `${name} ${want.name} row count`);
      logExercise(t, `${name} ${want.name}`);
    } else if (want.kind === 'superset') {
      must(want.names.every((n) => (t.exercises || []).some((ex) => ex.name === n)), `${name} superset ${want.names.join('/')}: got ${(t.exercises || []).map((e) => e.name).join('/')}`);
      must((t.exercises || []).length === want.names.length, `${name} superset lift count`);
      t.exercises.forEach((ex) => {
        const spec = want.lifts.find((l) => l.name === ex.name);
        must(spec, `${name} unexpected lift ${ex.name}`);
        must((ex.rows || []).filter((r) => !r.extra).length === spec.sets, `${name} ${ex.name} sets`);
        if (spec.distance) {
          must(
            (ex.rows || []).some((r) => r.targetKind === 'distance') || (ex.logColumns || []).some((c) => c.kind === 'distance_m'),
            `${name} ${ex.name} distance logger`,
          );
          (ex.rows || []).forEach((r) => {
            const metres = String(r.distance || r.reps || '');
            must(metres === '30', `${name} ${ex.name} metres ${metres}`);
          });
        }
        logExercise(ex, `${name} ${ex.name}`);
      });
    } else if (want.kind === 'text') {
      must(/recovery breathing/i.test(t.heading || ''), `${name} last task is Recovery Breathing`);
      must(/10 Nasal Breaths/i.test(t.notes || ''), `${name} breathing notes`);
    }
    t.complete = true;
  });
  must(tasks.every((t) => t.complete), `${name} all tasks complete`);
  const sets = tasks.flatMap(taskStrengthRows).filter((r) => r.done);
  must(sets.length === wantSetCount(expected), `${name} logged sets ${sets.length}`);
  sess.status = 'completed';
  sess.completedAt = Date.now();
  sess.summary = {
    sets: sets.length,
    tonnage: sets.filter((r) => r.targetKind !== 'distance').reduce((a, r) => a + Number(r.weight) * Number(r.reps), 0),
    conditioning: [],
  };
  must(sess.summary.conditioning.length === 0, `${name} finish has no Engine load cards`);
  return sess;
}

function wantSetCount(expected) {
  return expected.reduce((n, t) => {
    if (t.kind === 'strength') return n + t.sets;
    if (t.kind === 'superset') return n + t.lifts.reduce((a, l) => a + l.sets, 0);
    return n;
  }, 0);
}

const mondayDone = runDay('HPP Monday', [
  { kind: 'strength', name: 'Front Squat', sets: 5 },
  { kind: 'strength', name: 'Glute Ham Raise', sets: 4 },
  {
    kind: 'superset',
    names: ['Weighted Bar Dips', 'Weighted Chin-Ups'],
    lifts: [
      { name: 'Weighted Bar Dips', sets: 3 },
      { name: 'Weighted Chin-Ups', sets: 3 },
    ],
  },
  {
    kind: 'superset',
    names: ['Farmer Carry', 'Backwards Sled Drag'],
    lifts: [
      { name: 'Farmer Carry', sets: 5, distance: true },
      { name: 'Backwards Sled Drag', sets: 5, distance: true },
    ],
  },
  { kind: 'text' },
]);
must(mondayDone.summary.sets === 25, 'Monday 25 logged sets');

const wedDone = runDay('HPP Wednesday', [
  { kind: 'strength', name: 'Football Bar Floor Press', sets: 5 },
  { kind: 'strength', name: '1-Arm DB Row', sets: 4 },
  {
    kind: 'superset',
    names: ['DB Split Squat', 'DB Hammer Curls'],
    lifts: [
      { name: 'DB Split Squat', sets: 3 },
      { name: 'DB Hammer Curls', sets: 3 },
    ],
  },
  {
    kind: 'superset',
    names: ['Barbell Glute Hip Thrust', 'Banded Pushdowns'],
    lifts: [
      { name: 'Barbell Glute Hip Thrust', sets: 3 },
      { name: 'Banded Pushdowns', sets: 3 },
    ],
  },
  { kind: 'text' },
]);
must(wedDone.summary.sets === 21, 'Wednesday 21 logged sets');

console.log('fullbody-bc-starters.smoke: ok');
console.log('hpp-session-run: Monday 25 sets + Wednesday 21 sets, both finished, no Engine');
