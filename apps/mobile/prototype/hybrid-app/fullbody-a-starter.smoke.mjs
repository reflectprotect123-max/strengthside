/**
 * Smoke: Full Body A starter refreshes onto athlete builder v8 + metric logColumns.
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

const chunk = html.substring(
  html.indexOf('const PROGRAM_TEXT_DEFAULTS'),
  html.indexOf('function applyAthleteShellPatch'),
);
const COND_FORMATS = [
  { key: 'steady', name: 'Steady-state', type: 'easy' },
  { key: 'intervals', name: 'Intervals', type: 'intervals', rounds: 4, workSec: 240, restSec: 180 },
];
const COND_EFFORTS = [
  { key: 'easy', name: 'Easy' },
  { key: 'medium', name: 'Medium' },
  { key: 'hard', name: 'Hard' },
];
const COND_MODALITIES = ['Run', 'Walk', 'Bike', 'Rower', 'Ski erg', 'Circuit', 'Other'];

const sandbox = {
  console,
  clone: (x) => JSON.parse(JSON.stringify(x)),
  id: () => 'gen-id',
  num: (v) => Number(v) || 0,
  isoNow: () => new Date().toISOString(),
  window: {},
  StrengthAdapter: { repProgressionLift: () => false },
  S: {},
  touchRecord: (record) => record,
  dedupe: (list) => list,
  registerExercise: () => {},
  COND_FORMATS,
  COND_EFFORTS,
  COND_MODALITIES,
  condFormatMeta: (key) => COND_FORMATS.find((f) => f.key === key) || COND_FORMATS[0],
  isConditioningTemplate: (t) => {
    if (!t) return false;
    if (String(t.templateKind || '').toLowerCase() === 'conditioning') return true;
    const blocks = t.blocks || [];
    const hasC = blocks.some((b) => b && b.type === 'conditioning');
    const hasS = blocks.some((b) => b && b.type === 'strength');
    return hasC && !hasS;
  },
  isSupersetBlock: (block) =>
    !!block?.superset ||
    (/superset|pair/i.test(String(block?.heading || '')) && (block.exercises || []).length > 1),
};
sandbox.window = sandbox;

const start = html.indexOf('const seed=');
let i = html.indexOf('=', start) + 1;
while (html[i] === ' ') i += 1;
let depth = 0;
let inStr = false;
let esc = false;
let quote = '';
for (let j = i; j < html.length; j++) {
  const c = html[j];
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
    if (depth === 0) {
      sandbox.seed = JSON.parse(html.slice(i, j + 1));
      break;
    }
  }
}
must(sandbox.seed, 'seed parse failed');

vm.createContext(sandbox);
vm.runInContext(logColumnsSrc, sandbox);
vm.runInContext(readFileSync(join(dir, 'exercise-load-profiles.js'), 'utf8'), sandbox);
vm.runInContext(readFileSync(join(dir, 'strength-adapter.js'), 'utf8'), sandbox);
vm.runInContext(chunk, sandbox);

const legacy = {
  meta: {},
  templates: [
    {
      id: '39aa9693-b109-4da3-b66e-89c78d45058b',
      name: 'Full Body A',
      source: 'THE-program-core',
      blocks: [
        { id: 'w', type: 'text', heading: 'Warm-up', notes: '' },
        {
          id: 's1',
          type: 'strength',
          heading: 'Strength',
          exercises: [
            { name: 'Bench Press', exerciseId: 'core-bench-press', sets: 4, reps: '10', restSec: 150 },
          ],
        },
        {
          id: 'ss1',
          type: 'strength',
          heading: 'D1 / D2 Superset',
          superset: true,
          exercises: [
            { name: 'Strict Bar Dip', exerciseId: 'program-strict-bar-dip', sets: 3, reps: '7', restSec: 75 },
            { name: 'Nordic Curl', exerciseId: 'program-nordic-curl', sets: 3, reps: '7', restSec: 75 },
          ],
        },
        { id: 'c', type: 'text', heading: 'Cool-down', notes: '' },
      ],
    },
  ],
  exercises: [],
  hiddenTemplateIds: [],
};

const out = sandbox.ensureStarterTemplates(legacy);
const fba = out.templates.find((t) => t.name === 'Full Body A');
must(fba, 'Full Body A kept');
must(fba.source === 'THE-starter', 'starter source tag');
must(fba.blocks.length === 3, 'warm + strength + cool-down');
must(/warm/i.test(fba.blocks[0].heading), 'warm-up block');
must(fba.blocks[1].type === 'strength', 'single strength block');
must(/cool/i.test(fba.blocks[2].heading), 'cool-down block');
const exs = fba.blocks[1].exercises;
must(exs.length === 6, 'six lifts');
must(
  exs.every((ex) => ex.autopilotVolume === true && ex.sets == null && ex.reps == null),
  'autopilot volume shape',
);
must(
  exs.every((ex) => Array.isArray(ex.logColumns) && ex.logColumns.length > 0),
  'metric logColumns on every lift',
);
const curl = exs.find((e) => e.exerciseId === 'program-barbell-curl');
const push = exs.find((e) => e.exerciseId === 'program-cable-tricep-pushdown');
must(curl && curl.logColumns.length === 2, 'curl has load + reps');
must(push && push.logColumns.length === 2, 'pushdown has load + reps');
must(curl.logColumns.some((c) => c.kind === 'weight_kg'), 'curl load column');
must(push.logColumns.some((c) => c.kind === 'weight_kg'), 'pushdown load column');
must(exs[2].supersetWithNext === true && exs[3].supersetWithNext === false, 'dip/nordic link');
must(exs[4].supersetWithNext === true && exs[5].supersetWithNext === false, 'curl/pushdown link');
must(sandbox.starterStrengthNeedsRefresh(fba) === false, 'refreshed starter stable');

const versionStale = sandbox.ensureStarterTemplates({
  meta: {},
  templates: [
    {
      id: '39aa9693-b109-4da3-b66e-89c78d45058b',
      name: 'Full Body A',
      source: 'THE-starter',
      starterVersion: 'fullbody-a-legacy',
      blocks: fba.blocks,
    },
  ],
  exercises: [],
  hiddenTemplateIds: [],
});
const bumped = versionStale.templates.find((t) => t.name === 'Full Body A');
must(bumped.starterVersion === 'fullbody-a-metric-v2', 'version bump rebuilds canonical Full Body A');
must(versionStale.meta.starterFullBodyAVersion === 'fullbody-a-metric-v2', 'meta records starter version');

console.log('fullbody-a-starter.smoke: ok');
