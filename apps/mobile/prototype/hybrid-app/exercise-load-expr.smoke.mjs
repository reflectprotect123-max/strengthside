/**
 * Smoke: lift sheet %WM via log columns (weight_pct_wm) → loadExpr on save.
 * Run: node apps/mobile/prototype/hybrid-app/exercise-load-expr.smoke.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const dir = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(dir, 'index.html'), 'utf8');
const logSrc = readFileSync(join(dir, 'log-columns.js'), 'utf8');

if (!html.includes('LogColumns.builderColumnsHtml')) {
  throw new Error('exerciseSheet missing log columns builder UI');
}
if (!html.includes('LogColumns.syncLegacyFromColumns')) {
  throw new Error('saveExercise missing LogColumns.syncLegacyFromColumns');
}

const saveMatch = html.match(/function saveExercise\([\s\S]*?(?=function [a-zA-Z])/);
if (!saveMatch) throw new Error('saveExercise not found in index.html');

const dom = {
  exName: { value: 'Back Squat' },
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
  $: (id) => dom[id],
  S: { exercises: [{ id: 'squat', name: 'Back Squat', category: 'Squat', builtIn: true }] },
  draft,
  num: (v) => Number(v) || 0,
  id: () => 'ex-new',
  slugExercise: (n) => n.toLowerCase().replace(/\s+/g, '-'),
  normExercise: (n) => n.toLowerCase().trim(),
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
sandbox.LogColumns = sandbox.window.LogColumns || sandbox.LogColumns;
if (!sandbox.LogColumns) throw new Error('LogColumns failed to load');

sandbox.LogColumns.beginSheet({ reps: '8' });
// mutate sheet columns to pct + reps
const cols = sandbox.LogColumns.getSheetColumns();
cols[0].kind = 'weight_pct_wm';
cols[0].value = '70';
cols[1].kind = 'reps';
cols[1].value = '8';
sandbox.LogColumns.getSheetColumns = () => cols.map((c) => ({ ...c }));

vm.runInContext(saveMatch[0], sandbox);
sandbox.saveExercise(0, -1);

const saved = draft.blocks[0].exercises[0];
if (!saved?.loadExpr || saved.loadExpr.exprKind !== 'pct_of_max') {
  throw new Error('Expected loadExpr.exprKind pct_of_max');
}
if (saved.loadExpr.exprArg !== 0.7) {
  throw new Error(`Expected exprArg 0.7, got ${saved.loadExpr.exprArg}`);
}
if (!saved.logColumns || saved.logColumns[0].kind !== 'weight_pct_wm') {
  throw new Error('Expected logColumns weight_pct_wm');
}

cols[0].kind = 'weight_kg';
cols[0].value = '';
draft.blocks[0].exercises = [];
sandbox.saveExercise(0, -1);
const cleared = draft.blocks[0].exercises[0];
if (cleared?.loadExpr) {
  throw new Error('weight_kg empty should omit loadExpr');
}

console.log('exercise-load-expr.smoke: ok');
