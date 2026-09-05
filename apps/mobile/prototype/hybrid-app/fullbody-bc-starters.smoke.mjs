/**
 * Smoke: Full Body B + C starters use the new athlete open-logger pattern
 * (null sets/reps + metric logColumns), same boot path as Full Body A.
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

must(
  html.includes("STARTER_STRENGTH_NAMES=['Full Body A','Full Body B','Full Body C']"),
  'STARTER_STRENGTH_NAMES includes A/B/C',
);
must(html.includes("STARTER_FULLBODY_B_VERSION='fullbody-b-metric-v1'"), 'B version');
must(html.includes("STARTER_FULLBODY_C_VERSION='fullbody-c-metric-v1'"), 'C version');
must(html.includes('function ensureFullBodyBStarter'), 'ensure B');
must(html.includes('function ensureFullBodyCStarter'), 'ensure C');
must(html.includes('ensureFullBodyBStarter(state)'), 'B in ensureStarterTemplates');
must(html.includes('ensureFullBodyCStarter(state)'), 'C in ensureStarterTemplates');
must(html.includes("'Full Body B':{"), 'PROGRAM_TEXT_DEFAULTS B');
must(html.includes("'Full Body C':{"), 'PROGRAM_TEXT_DEFAULTS C');
must(html.includes('STARTER_STRENGTH_NAMES.includes(t.name)'), 'library uses STARTER_STRENGTH_NAMES');

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

function strengthExercises(t) {
  return ((t.blocks || []).find((b) => b && b.type === 'strength') || {}).exercises || [];
}

function assertSeedOpen(t, name, ids, links) {
  must(t, `${name} in seed`);
  const exs = strengthExercises(t);
  must(exs.length === ids.length, `${name} lift count`);
  must(
    JSON.stringify(exs.map((e) => e.exerciseId)) === JSON.stringify(ids),
    `${name} exerciseIds`,
  );
  for (const ex of exs) {
    must(ex.openVolume === true, `${name} seed openVolume`);
    must(ex.sets == null && ex.reps == null, `${name} seed null volume`);
  }
  for (const [i, on] of Object.entries(links)) {
    must(!!exs[Number(i)].supersetWithNext === on, `${name} seed link ${i}`);
  }
}

assertSeedOpen(
  seed.templates.find((t) => t.name === 'Full Body B'),
  'Full Body B',
  [
    'core-back-squat',
    'program-supinated-barbell-row',
    'program-z-press',
    'program-db-lateral-raise',
    'program-turkish-weight-plate-sit-up',
    'program-tuck-l-sit',
  ],
  { 2: true, 3: false, 4: true, 5: false },
);
assertSeedOpen(
  seed.templates.find((t) => t.name === 'Full Body C'),
  'Full Body C',
  [
    'core-sumo-deadlift',
    'program-pronated-strict-pull-up',
    'program-low-incline-11-4-dumbbell-bench-press',
    'program-weight-plate-hip-abduction',
    'program-hand-supported-suitcase-calf-raise',
  ],
  { 1: true, 2: false, 3: true, 4: false },
);

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
  templates: [],
  exercises: [],
  hiddenTemplateIds: [],
});

for (const name of ['Full Body A', 'Full Body B', 'Full Body C']) {
  const t = out.templates.find((x) => x.name === name);
  must(t, `boots ${name}`);
  must(t.source === 'THE-starter', `${name} starter source`);
  const texts = (t.blocks || []).filter((b) => b.type === 'text');
  must(texts.some((b) => /warm/i.test(b.heading || '')), `${name} warm-up`);
  must(texts.some((b) => /cool/i.test(b.heading || '')), `${name} cool-down`);
  const strength = (t.blocks || []).find((b) => b.type === 'strength');
  must(strength, `${name} strength`);
  for (const ex of strength.exercises || []) {
    must(ex.sets == null && ex.reps == null, `${name} ${ex.name} open logger (null sets/reps)`);
    must(Array.isArray(ex.logColumns) && ex.logColumns.length > 0, `${name} ${ex.name} logColumns`);
    must(!ex.loadExpr && !ex.load, `${name} ${ex.name} no legacy load`);
  }
  must(sandbox.starterStrengthNeedsRefresh(t) === false, `${name} stable after ensure`);
}

must(out.templates.filter((t) => /^Full Body [ABC]$/.test(t.name)).length === 3, 'all three present');

console.log('fullbody-bc-starters.smoke: ok');
