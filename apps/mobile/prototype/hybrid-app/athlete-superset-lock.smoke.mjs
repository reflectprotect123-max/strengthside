import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
function must(cond, msg){ if(!cond) throw new Error(msg); }

must(html.includes('function toggleAthleteSupersetLock'), 'toggleAthleteSupersetLock');
must(html.includes('ath-ss-lock'), 'lock CSS/control');
must(html.includes('supersetWithNext'), 'supersetWithNext');
must(!html.includes("coach-strength-hidden .ath-strength-build{display:none"), 'builder still visible');

// Extract flatten + helpers into a sandbox
const sandbox = {
  console, Math, Number, String, Array, Object, JSON, Date, Map, Set, RegExp, Error,
  undefined, parseInt, parseFloat, isFinite, isNaN,
  window: {},
  S: { exercises: [] },
  id: () => 'id',
  clone: (x) => JSON.parse(JSON.stringify(x)),
  num: (v) => Number(v) || 0,
  normalizeWorkoutBlock: (b) => b,
  isSupersetBlock: (b) => !!b?.superset,
  registerExercise: (_S, y) => ({ ...y, exerciseId: y.exerciseId || 'ex' }),
  upgradeRows: (ex) => ({ ...ex, rows: [{ id: 'r1', n: 1, target: '', weight: '', reps: '', done: false }] }),
  StrengthAdapter: null,
  EngineAdapter: null,
};
sandbox.window = sandbox;

const flattenSrc = html.slice(html.indexOf('function flatten(x){'), html.indexOf('function startSession(i){'));
vm.runInNewContext(flattenSrc, sandbox);

const session = {
  date: '2026-08-31',
  blocks: [{
    type: 'strength',
    heading: 'Strength',
    exercises: [
      { name: 'Bench Press', restSec: 90, supersetWithNext: true },
      { name: 'Row', restSec: 90, supersetWithNext: false },
      { name: 'Squat', restSec: 120 },
    ],
  }],
};
const tasks = sandbox.flatten(session);
must(tasks.length === 2, 'expect superset + solo strength, got ' + tasks.length);
must(tasks[0].kind === 'superset', 'first task is superset');
must(tasks[0].exercises.length === 2, 'superset has 2 lifts');
must(tasks[0].heading.includes('Bench') && tasks[0].heading.includes('Row'), 'superset heading');
must(tasks[1].kind === 'strength' && tasks[1].name === 'Squat', 'solo squat after');

console.log('athlete-superset-lock.smoke: ok');
