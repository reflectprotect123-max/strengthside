#!/usr/bin/env node
/**
 * Runtime debug: builder columns → flatten/upgradeRows → logger HTML →
 * validate → Open/Close. Loads the real modules, not greps.
 */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = dirname(fileURLToPath(import.meta.url));
const findings = [];
function fail(id, msg, extra) {
  findings.push({ id, ok: false, msg, extra });
}
function pass(id, msg, extra) {
  findings.push({ id, ok: true, msg, extra });
}

function loadIife(file) {
  return readFileSync(join(appDir, file), 'utf8');
}

const sandbox = {
  window: {},
  console,
  document: {
    getElementById: () => null,
    querySelector: () => null,
    createElement: () => ({ innerHTML: '', firstChild: null, replaceWith() {} }),
  },
};
sandbox.global = sandbox;
sandbox.globalThis = sandbox;
sandbox.window = sandbox;
vm.runInNewContext(loadIife('exercise-load-profiles.js'), sandbox);
vm.runInNewContext(loadIife('log-columns.js'), sandbox);
vm.runInNewContext(loadIife('adaptive-bundle.js'), sandbox);
const LC = sandbox.LogColumns;
const ELP = sandbox.ExerciseLoadProfiles;
const HA = sandbox.HybridAdaptive;
if (!LC || !ELP || !HA) {
  console.error('missing globals', { LC: !!LC, ELP: !!ELP, HA: !!HA });
  process.exit(2);
}

const html = readFileSync(join(appDir, 'index.html'), 'utf8');
function extractFn(src, name) {
  const start = src.indexOf('function ' + name);
  if (start < 0) throw new Error('missing ' + name);
  let i = start;
  let depth = 0;
  let started = false;
  for (; i < src.length; i++) {
    const ch = src[i];
    if (ch === '{') {
      depth++;
      started = true;
    } else if (ch === '}') {
      depth--;
      if (started && depth === 0) {
        i++;
        break;
      }
    }
  }
  return src.slice(start, i);
}

const boot = `
S = { exercises: [], adaptiveClose: {} };
function num(x){return +x||0}
function id(){return 'id_'+Math.random().toString(36).slice(2,8)}
function clone(x){return JSON.parse(JSON.stringify(x))}
function slugExercise(n){return String(n||'').toLowerCase().replace(/[^a-z0-9]+/g,'-')}
function resolveCanonicalExercise(state, exerciseId, name){
  if(exerciseId) return {id:exerciseId,name:name||exerciseId,category:'Strength'};
  return null;
}
${extractFn(html, 'registerExercise')}
${extractFn(html, 'targetList')}
${extractFn(html, 'targetKind')}
${extractFn(html, 'seedRepsFromTarget')}
${extractFn(html, 'makeRows')}
${extractFn(html, 'upgradeRows')}
${extractFn(html, 'routeBuilderLiftToLogger')}
${extractFn(html, 'isHoldRow')}
${extractFn(html, 'isCarryRow')}
${extractFn(html, 'isSealedEffortRow')}
${extractFn(html, 'isCarryExercise')}
${extractFn(html, 'validateStrengthRow')}
${extractFn(html, 'applyOpenLiftToEx')}
${extractFn(html, 'persistCloseForEx')}
${extractFn(html, 'flatten')}
${extractFn(html, 'isSupersetBlock')}
${extractFn(html, 'normalizeWorkoutBlock')}
function liftCloseKey(ex){return String(ex.exerciseId||ex.name||'lift')}
`;
vm.runInNewContext(boot, sandbox);

function route(ex) {
  return sandbox.routeBuilderLiftToLogger(ex, { kind: 'strength' });
}

// --- A. Painted kg×reps ---
{
  const t = route({
    name: 'Bench Press',
    exerciseId: 'core-bench-press',
    sets: 3,
    reps: '5',
    logColumns: [
      { id: 'a', kind: 'weight_kg', value: '80', values: ['80', '80', '80'] },
      { id: 'b', kind: 'reps', value: '5', values: ['5', '5', '5'] },
    ],
  });
  const cells = LC.loggerCellsHtml(t.rows[0], 0, t.logColumns, true, t);
  const err = sandbox.validateStrengthRow({ weight: 80, reps: 5, rir: '' }, t);
  if (String(t.rows[0].weight) !== '80' || String(t.rows[0].reps) !== '5') {
    fail('A-seed', 'painted kg×reps did not seed', t.rows[0]);
  } else pass('A-seed', 'painted 80×5 seeded');
  if (err) fail('A-validate', err);
  else pass('A-validate', '80×5 logs');
  if (!cells.includes('RIR')) fail('A-rir', 'live kg should show RIR', cells);
  else pass('A-rir', 'RIR on live kg');
  const before = String(t.rows[0].weight);
  sandbox.applyOpenLiftToEx(t);
  if (String(t.rows[0].weight) !== before) fail('A-open', 'Open overwrote painted kg', t.rows[0]);
  else pass('A-open', 'Open left painted kg');
}

// --- B. Optional kg, live reps ---
{
  const cols = LC.toggleColumnOptional(
    [
      { id: 'a', kind: 'weight_kg', value: '80', values: ['80'] },
      { id: 'b', kind: 'reps', value: '8', values: ['8'] },
    ],
    0,
  );
  const t = route({ name: 'Bench', exerciseId: 'core-bench-press', sets: 3, logColumns: cols });
  const err = sandbox.validateStrengthRow({ weight: '', reps: 8 }, t);
  const cells = LC.loggerCellsHtml(t.rows[0], 0, t.logColumns, true, t);
  if (err) fail('B-validate', 'optional kg must log: ' + err);
  else pass('B-validate', 'blank optional kg ok');
  if (LC.liveTracksKg(t)) fail('B-live', 'optional kg still tracks kg');
  else pass('B-live', 'kg not live');
  if (cells.includes('RIR')) fail('B-rir', 'RIR shown while kg optional', cells);
  else pass('B-rir', 'RIR hidden');
  t.rows[0].done = true;
  t.rows[0].reps = 8;
  sandbox.S.adaptiveClose = {};
  sandbox.persistCloseForEx(t);
  const closed = sandbox.S.adaptiveClose[sandbox.liftCloseKey(t)];
  if (!closed || closed.loadKg !== null) fail('B-close', 'expected stub close without kg', closed);
  else pass('B-close', 'Close stubbed without kg');
}

// --- C. 90s live time ---
{
  const t = route({
    name: 'Plank',
    exerciseId: 'core-plank',
    sets: 3,
    logColumns: [{ id: 't', kind: 'time_sec', value: '90', values: ['90'] }],
  });
  const err = sandbox.validateStrengthRow({ weight: '', reps: 90 }, t);
  if (err) fail('C-validate', err);
  else pass('C-validate', '90s logs');
  if (t.rows[0].targetKind !== 'seconds') fail('C-kind', 'plank not seconds', t.rows[0]);
  else pass('C-kind', 'targetKind seconds → Hold');
  if (sandbox.isHoldRow(t.rows[0]) !== true) fail('C-hold', 'isHoldRow false');
  else pass('C-hold', 'Hold path');
}

// --- D. 100m carry ---
{
  const t = route({
    name: 'Farmer Carry',
    exerciseId: 'core-farmer-carry',
    sets: 3,
    logColumns: [
      { id: 'a', kind: 'weight_kg', value: '24', values: ['24'] },
      { id: 'b', kind: 'distance_m', value: '100', values: ['100'] },
    ],
  });
  const err = sandbox.validateStrengthRow({ weight: 24, reps: 100 }, t);
  if (err) fail('D-validate', err);
  else pass('D-validate', '24kg × 100m logs');
  if (t.rows[0].targetKind !== 'distance') fail('D-kind', t.rows[0].targetKind);
  else pass('D-kind', 'distance seals Adaptive');
  if (!sandbox.isCarryExercise(t)) fail('D-carry', 'not classified carry');
  else pass('D-carry', 'isCarryExercise');
}

// --- E. Optional time must not Hold ---
{
  const t = route({
    name: 'Bench',
    exerciseId: 'core-bench-press',
    sets: 3,
    logColumns: [
      { id: 'a', kind: 'weight_kg', value: '80', values: ['80'] },
      { id: 'b', kind: 'reps', value: '5', values: ['5'] },
      { id: 'c', kind: 'time_sec', value: '30', values: ['30'], optional: true },
    ],
  });
  if (t.rows[0].targetKind === 'seconds') fail('E-kind', 'optional time stole Hold');
  else pass('E-kind', 'still reps, not Hold');
  const cells = LC.loggerCellsHtml(t.rows[0], 0, t.logColumns, false, t);
  const binds = (cells.match(/updateSet\(0,'reps'/g) || []).length;
  if (binds !== 1) fail('E-bind', 'reps binds=' + binds, cells);
  else pass('E-bind', 'single reps input');
}

// --- F. %WM profile bench (Full Body A default) ---
{
  const t = route({
    name: 'Bench Press',
    exerciseId: 'core-bench-press',
    sets: 3,
    reps: '',
  });
  const kinds = (t.logColumns || []).map((c) => c.kind).join(',');
  if (kinds !== 'weight_pct_wm,reps') fail('F-profile', 'expected %WM+reps, got ' + kinds, t.logColumns);
  else pass('F-profile', 'profile %WM+reps');
  if (String(t.rows[0].weight) === '70' || String(t.rows[0].weight) === '70.0') {
    fail('F-seed', 'seeded % as kg', t.rows[0]);
  } else pass('F-seed', 'weight empty until Open or typed kg', { weight: t.rows[0].weight, reps: t.rows[0].reps });
  if (!LC.liveTracksKg(t)) fail('F-live', '%WM should still track performed kg');
  else pass('F-live', 'liveTracksKg true for %WM column');
  sandbox.S.adaptiveClose = {};
  sandbox.applyOpenLiftToEx(t);
  pass('F-open', 'Open after empty %WM', { weight: t.rows[0].weight, reps: t.rows[0].reps, adaptiveFilled: t.rows[0].adaptiveFilled });
}

// --- G. time+distance both live (rower profile) ---
{
  const t = route({
    name: 'Row Erg',
    exerciseId: 'core-rowing-erg',
    sets: 3,
  });
  const kinds = (t.logColumns || []).map((c) => c.kind).join(',');
  const cells = LC.loggerCellsHtml(t.rows[0], 0, t.logColumns, false, t);
  const hasSec = /Seconds/.test(cells);
  const hasM = /Metres/.test(cells);
  pass('G-profile', 'rower columns ' + kinds);
  if (hasSec && hasM) pass('G-cells', 'both seconds and metres shown');
  else fail('G-cells', 'rower logger dropped a metric', { hasSec, hasM, cells, kinds, targetKind: t.rows[0].targetKind });
}

// --- H. Flatten Full Body A-like block ---
{
  const session = {
    blocks: [
      {
        type: 'strength',
        heading: 'Strength',
        exercises: [
          { name: 'Bench Press', exerciseId: 'core-bench-press', restSec: 150, openVolume: true, sets: null, reps: null },
          { name: 'Plank', exerciseId: 'core-plank', restSec: 60, openVolume: true, sets: null, reps: null },
        ],
      },
    ],
  };
  const tasks = sandbox.flatten(session);
  const bench = tasks.find((t) => t.name === 'Bench Press');
  const plank = tasks.find((t) => t.name === 'Plank');
  pass('H-flatten', 'tasks=' + tasks.map((t) => t.kind + ':' + t.name).join('|'), {
    benchSets: bench && bench.rows && bench.rows.length,
    benchCols: bench && (bench.logColumns || []).map((c) => c.kind),
    plankKind: plank && plank.rows && plank.rows[0] && plank.rows[0].targetKind,
    plankSets: plank && plank.rows && plank.rows.length,
  });
  if (!bench || bench.rows.length < 3) fail('H-sets', 'openVolume null sets flattened to ' + (bench && bench.rows.length) + ' rows, expected 3');
  else pass('H-sets', '3 rows');
}

const bad = findings.filter((f) => !f.ok);
console.log('builder-logger-runtime.smoke: ' + findings.filter((f) => f.ok).length + ' passed, ' + bad.length + ' failed');
if (bad.length) {
  console.error(JSON.stringify(bad, null, 2));
  process.exit(1);
}
