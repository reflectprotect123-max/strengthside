/**
 * Smoke: lift sheet optional %WM loadExpr (S3) — HTML field + saveExercise persistence.
 * Run: node apps/mobile/prototype/hybrid-app/exercise-load-expr.smoke.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const dir = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(dir, 'index.html'), 'utf8');

if (!html.includes('id=exPctWm')) {
  throw new Error('exerciseSheet missing #exPctWm field');
}
if (!html.includes('Load % of working max')) {
  throw new Error('exerciseSheet missing Load % of working max label');
}
if (!html.includes("exprKind:'pct_of_max'")) {
  throw new Error('saveExercise missing pct_of_max loadExpr persistence');
}

const saveMatch = html.match(/function saveExercise\([\s\S]*?(?=function [a-zA-Z])/);
if (!saveMatch) throw new Error('saveExercise not found in index.html');

const dom = {
  exName: { value: 'Back Squat' },
  exCat: { value: 'Squat' },
  exPercent: { checked: false },
  exSets: { value: '3' },
  exReps: { value: '8' },
  exRest: { value: '120' },
  exNote: { value: '' },
  exGuidePurpose: { value: '' },
  exGuideHow: { value: '' },
  exGuideWarmup: { value: '' },
  exGuideEffort: { value: '' },
  exGuideMistakes: { value: '' },
  exGuideAlternatives: { value: '' },
  exPctWm: { value: '70' },
};

const draft = {
  blocks: [{ exercises: [] }],
};

const sandbox = {
  console,
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
  alert: (m) => { throw new Error('alert: ' + m); },
};

vm.createContext(sandbox);
vm.runInContext(saveMatch[0], sandbox);
sandbox.saveExercise(0, -1);

const saved = draft.blocks[0].exercises[0];
if (!saved?.loadExpr || saved.loadExpr.exprKind !== 'pct_of_max') {
  throw new Error('Expected loadExpr.exprKind pct_of_max');
}
if (saved.loadExpr.exprArg !== 0.7) {
  throw new Error(`Expected exprArg 0.7, got ${saved.loadExpr.exprArg}`);
}

dom.exPctWm.value = '';
draft.blocks[0].exercises = [];
sandbox.saveExercise(0, -1);
const cleared = draft.blocks[0].exercises[0];
if (cleared?.loadExpr) {
  throw new Error('Empty %WM should omit loadExpr');
}

console.log('exercise-load-expr.smoke: ok');
