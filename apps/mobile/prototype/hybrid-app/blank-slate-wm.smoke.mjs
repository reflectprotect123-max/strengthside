/**
 * Smoke: blank-slate boot + athlete-set working max anchor.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

function must(cond, msg) {
  if (!cond) throw new Error(msg);
}

const dir = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(dir, 'index.html'), 'utf8');
const sw = readFileSync(join(dir, 'service-worker.js'), 'utf8');
const bundle = readFileSync(join(dir, 'strength-bundle.js'), 'utf8');
const adapter = readFileSync(join(dir, 'strength-adapter.js'), 'utf8');

must(html.includes("LOCAL_BUILD='the-hybrid-athlete-engine-v132'"), 'LOCAL_BUILD v104');
must(sw.includes("const CACHE = 'the-hybrid-athlete-engine-v132'"), 'SW v104');
must(!/trainheroic|TrainHeroic|TRAINHEROIC/i.test(html), 'athlete app has no TrainHeroic code');
must(!/trainheroic|TrainHeroic|TRAINHEROIC/i.test(sw), 'service worker has no TrainHeroic seed cache');
must(!html.includes('for(const core of seed.exercises)'), 'no auto core exercise seed on boot');
must(!html.includes('function libraryExercisesTab'), 'no Library Exercises tab');
must(!html.includes('function exerciseLibrary('), 'no exercise library sheet');
must(html.includes('function saveExerciseWorkingMax'), 'Progress WM save handler');
must(html.includes('function openWorkingMaxGate'), 'pre-session WM gate');
must(html.includes('function saveWorkingMaxGate'), 'pre-session WM save');
must(html.includes('Start blank'), 'library progress blank-slate copy');
must(!html.includes("const want=new Set(['Full Body A','Aerobic Conditioning'])"), 'no auto starter templates');
must(html.includes('function defaultState(){let x=clone(seed);x.tab='), 'defaultState present');
must(html.includes('x.templates=[];x.sessions=[]'), 'defaultState starts blank (no seed templates/sessions)');
must(html.includes('x.exercises=[]'), 'defaultState starts with empty exercises');
must(html.includes("BLANK_SLATE_VERSION='athlete-blank-slate-v1'"), 'blank slate migration version');
must(html.includes('function ensureStarterTemplates'), 'ensure Full Body A starter template');
must(html.includes("STARTER_STRENGTH_NAMES=['Full Body A']"), 'Full Body A in starter list');
must(html.includes("STARTER_RECOVERY_NAMES=['Recovery']"), 'Recovery starter');
must(html.includes('function applyBlankSlatePatch'), 'strip seed templates from persisted state');
must(html.includes("x.status==='completed'))return"), 'coordinator waits for completed sessions');
must(adapter.includes('setWorkingMax'), 'adapter exports setWorkingMax');
must(adapter.includes('missingWorkingMaxExerciseIds'), 'adapter exports missingWorkingMaxExerciseIds');

const sandbox = { window: {}, console };
vm.createContext(sandbox);
vm.runInContext(`${bundle}; window.HybridStrength = HybridStrength; ${adapter}`, sandbox);

const { StrengthAdapter } = sandbox.window;
const today = new Date().toISOString().slice(0, 10);
const state = {
  meta: { ownerId: 'athlete-1', progressionAudit: [] },
  exercises: [{ id: 'squat', name: 'Back Squat' }],
  strengthState: { workingMaxEvents: [], prEvents: [], loadHints: {} },
  sessions: [],
};

must(StrengthAdapter.missingWorkingMaxExerciseIds(state, ['squat'], today).length === 1, 'missing WM before set');
const setResult = StrengthAdapter.setWorkingMax(state, 'squat', 140);
must(setResult.ok && setResult.valueKg === 140, 'setWorkingMax ok');
must(StrengthAdapter.hasWorkingMax(state, 'squat', today), 'hasWorkingMax after set');
must(StrengthAdapter.missingWorkingMaxExerciseIds(state, ['squat'], today).length === 0, 'no missing after set');

const exercise = {
  exerciseId: 'squat',
  loadExpr: { exprKind: 'pct_of_max', exprArg: 0.7 },
};
const resolved = StrengthAdapter.resolveExerciseLoad(state, exercise, today);
must(resolved && resolved.loadKg === 97.5, '70% of entered WM resolves to session load (rounded)');

console.log('blank-slate-wm.smoke: ok');
