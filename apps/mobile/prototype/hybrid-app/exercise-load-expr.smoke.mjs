/**
 * Smoke: optional pin load (%WM) via advanced coach API → loadExpr on save.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const dir = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(dir, 'index.html'), 'utf8');
const coachHtml = readFileSync(join(dir, 'coach.html'), 'utf8');
const logSrc = readFileSync(join(dir, 'log-columns.js'), 'utf8');

if (!coachHtml.includes('LogColumns.builderPrescriptionHtml')) {
  throw new Error('coach session builder missing prescription UI');
}
if (html.includes('LogColumns.builderPrescriptionHtml({compact:false})')) {
  throw new Error('athlete exerciseSheet must not show Prescription card');
}
if (!html.includes('LogColumns.syncLegacyFromColumns')) {
  throw new Error('saveExercise missing LogColumns.syncLegacyFromColumns');
}

const saveMatch = html.match(/function saveExercise\([\s\S]*?(?=const modalities|function [a-zA-Z])/);
if (!saveMatch) throw new Error('saveExercise not found in index.html');

const dom = {
  exName: { value: 'Back Squat' },
  exNameVisible: { value: 'Back Squat' },
  exExerciseId: { value: '' },
  exCat: { value: 'Squat' },
  exSets: { value: '3' },
  exRest: { value: '120' },
  exNote: { value: '' },
  exGuidePurpose: { value: '' },
  exGuideHow: { value: '' },
  exGuideWarmup: { value: '' },
  exGuideEffort: { value: '' },
  exGuideMistakes: { value: '' },
  exGuideAlternatives: { value: '' },
};

const draft = { blocks: [{ exercises: [] }] };

const sandbox = {
  console,
  window: {},
  document: { getElementById: () => null, querySelector: () => null, createElement: () => ({ innerHTML: '', firstChild: null, replaceWith() {} }) },
  $: (id) => dom[id],
  S: { exercises: [{ id: 'squat', name: 'Back Squat', category: 'Squat', builtIn: true }] },
  draft,
  num: (v) => Number(v) || 0,
  id: () => 'ex-new',
  slugExercise: (n) => n.toLowerCase().replace(/\s+/g, '-'),
  normExercise: (n) => n.toLowerCase().trim(),
  findLibraryExerciseById: (state, eid) => (state.exercises || []).find((x) => x.id === eid) || null,
  resolveCanonicalExercise: (exerciseId, name) => {
    const byId = sandbox.S.exercises.find((x) => x.id === exerciseId);
    if (byId) return byId;
    return sandbox.S.exercises.find((x) => sandbox.normExercise(x.name) === sandbox.normExercise(name)) || null;
  },
  percentLiftCandidate: () => false,
  dedupe: (a) => a,
  ensureExerciseTrackingFlags: (s) => s,
  persistDraft: () => {},
  closeSheet: () => {},
  builder: () => {},
  alert: (m) => {
    throw new Error('alert: ' + m);
  },
};
sandbox.window = sandbox;

vm.createContext(sandbox);
vm.runInContext(logSrc, sandbox);
sandbox.LogColumns = sandbox.LogColumns || sandbox.window.LogColumns;
sandbox.LogColumns.beginSheet({ sets: 3, reps: '8', restSec: 120 });
sandbox.LogColumns.onSimpleReps('8');
sandbox.LogColumns.onPinLoadKind('weight_pct_wm');
sandbox.LogColumns.onPinLoadValue('70');

vm.runInContext(saveMatch[0], sandbox);
sandbox.saveExercise(0, -1);

const saved = draft.blocks[0].exercises[0];
if (!saved?.loadExpr || saved.loadExpr.exprKind !== 'pct_of_max') {
  throw new Error('Expected loadExpr.exprKind pct_of_max got ' + JSON.stringify(saved?.loadExpr));
}
if (saved.loadExpr.exprArg !== 0.7) {
  throw new Error(`Expected exprArg 0.7, got ${saved.loadExpr.exprArg}`);
}
if (!saved.logColumns || saved.logColumns[0].kind !== 'weight_pct_wm') {
  throw new Error('Expected logColumns weight_pct_wm');
}

sandbox.LogColumns.clearPinnedLoad();
draft.blocks[0].exercises = [];
sandbox.saveExercise(0, -1);
const cleared = draft.blocks[0].exercises[0];
if (cleared?.loadExpr) {
  throw new Error('autopilot default should omit loadExpr');
}
if (cleared?.load) {
  throw new Error('autopilot default should omit load');
}

console.log('exercise-load-expr.smoke: ok');
