/**
 * Smoke: bundled exercise history seed applies hints + aliases only (no sessions).
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
const applyJs = readFileSync(join(dir, 'exercise-history-seed-apply.js'), 'utf8');
const seedJs = readFileSync(join(dir, 'exercise-history-seed.js'), 'utf8');

must(html.includes('./exercise-history-seed.js'), 'index.html loads exercise-history-seed.js');
must(html.includes('./exercise-history-seed-apply.js'), 'index.html loads exercise-history-seed-apply.js');
must(html.includes('applyBundledExerciseHistorySeed'), 'boot applies bundled seed');
must(!/trainheroic|TrainHeroic|TRAINHEROIC/i.test(html), 'athlete html has no TrainHeroic strings');

const sandbox = { window: {}, console };
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(`${applyJs}\n${seedJs}`, sandbox);

const seed = sandbox.window.EXERCISE_HISTORY_SEED;
must(seed && seed.version, 'seed has version');
must(Object.keys(seed.loadHints || {}).length > 0, 'seed has load hints');
must(Object.keys(seed.titleAliases || {}).length > 0, 'seed has title aliases');
must(seed.sessions === undefined, 'seed must not include sessions');

const state = {
  meta: {},
  sessions: [],
  strengthState: { workingMaxEvents: [], prEvents: [], loadHints: {} },
};
const first = sandbox.applyExerciseHistorySeed(state, seed);
must(first.applied, 'first apply runs');
must(first.addedHints > 0, 'hints added on first apply');
must(Object.keys(sandbox.exerciseTitleAliasMap(state)).length > 0, 'title aliases merged');
must(state.sessions.length === 0, 'sessions untouched');

const second = sandbox.applyExerciseHistorySeed(state, seed);
must(!second.applied, 'second apply is idempotent');
must(state.meta.exerciseHistorySeedVersion === seed.version, 'seed version recorded');

console.log('exercise-history-seed.smoke: ok');
