/**
 * Smoke: athlete exercise catalog starts empty and only grows from names you type.
 * The bundled THE-core / ExerciseSearch catalog must not suggest Lateral Raise for GHR.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const dir = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(dir, 'index.html'), 'utf8');

function must(cond, msg) {
  if (!cond) throw new Error(msg);
}

must(html.includes("EMPTY_LIBRARY_VERSION='athlete-empty-library-v1'"), 'empty-library migrate');
must(html.includes('function applyEmptyLibraryPatch'), 'empty-library patch');
must(html.includes('x.exercises=[]'), 'defaultState starts with empty exercises');
must(!/ExerciseSearch\.search/.test(html.slice(html.indexOf('function exerciseSuggestHits'), html.indexOf('function exerciseSuggestHtml'))), 'suggest does not search the bundled catalog');

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
must(Array.isArray(seed.exercises) && seed.exercises.length === 0, `bundled exercise catalog must be empty, got ${seed.exercises && seed.exercises.length}`);
must((seed.templates || []).every((t) => t && t.name !== 'HPP Monday'), 'seed has no HPP Monday');

const emptyChunk = html.slice(
  html.indexOf('const EMPTY_LIBRARY_VERSION'),
  html.indexOf("const STARTER_STRENGTH_NAMES"),
);

const sandbox = {
  console,
  seed,
  clone: (x) => JSON.parse(JSON.stringify(x)),
  id: () => 'id' + Math.random().toString(36).slice(2, 8),
  num: (v) => +v || 0,
  isoNow: () => new Date().toISOString(),
  window: {
    ExerciseSearch: {
      byId: (id) => ({ id, name: 'Lateral Raise', category: 'Shoulders / Isolation' }),
      search: () => [{ exerciseId: 'core-lateral-raise', name: 'Lateral Raise', category: 'Shoulders / Isolation' }],
      resolveTitleAlias: () => ({ id: 'core-lateral-raise', name: 'Lateral Raise', category: 'Shoulders / Isolation' }),
    },
  },
  S: { exercises: [] },
  touchRecord: (r) => r,
  dedupe: (l) => {
    const seen = new Set();
    return (l || []).filter((e) => {
      const k = String(e && (e.id || e.name) || '');
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  },
  findLibraryExercise(state, name) {
    return (state.exercises || []).find((x) => String(x.name || '').toLowerCase() === String(name || '').toLowerCase());
  },
  findLibraryExerciseById(state, exerciseId) {
    return exerciseId ? (state.exercises || []).find((x) => x.id === exerciseId) : null;
  },
  slugExercise: (name) => String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  normExercise: (name) => String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, ''),
  ensureExerciseTrackingFlags: (s) => s,
  registerExercise: null,
};
sandbox.window = Object.assign(sandbox.window, { ExerciseSearch: sandbox.window.ExerciseSearch });
vm.createContext(sandbox);

function extractFunction(src, name) {
  const start = src.indexOf(`function ${name}`);
  if (start < 0) throw new Error(name + ' missing');
  let i = src.indexOf('{', start);
  let depth = 0;
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }
  throw new Error(name + ' unclosed');
}

vm.runInContext(extractFunction(html, 'findLibraryExercise'), sandbox);
vm.runInContext(extractFunction(html, 'findLibraryExerciseById'), sandbox);
vm.runInContext(extractFunction(html, 'slugExercise'), sandbox);
vm.runInContext(extractFunction(html, 'resolveCanonicalExercise'), sandbox);
vm.runInContext(extractFunction(html, 'registerExercise'), sandbox);
vm.runInContext(extractFunction(html, 'exerciseSuggestHits'), sandbox);
vm.runInContext(emptyChunk, sandbox);

const poisoned = {
  meta: {},
  exercises: [
    { id: 'core-lateral-raise', name: 'Lateral Raise', builtIn: true, source: 'THE-core-100' },
    { id: 'core-nordic-curl', name: 'Nordic Curl', builtIn: true, source: 'THE-core-100' },
  ],
  templates: [],
  sessions: [],
};
sandbox.applyEmptyLibraryPatch(poisoned);
must((poisoned.exercises || []).length === 0, 'empty-library migrate wipes the bundled catalog');
must(poisoned.meta.emptyLibraryVersion === 'athlete-empty-library-v1', 'empty-library version stamped');

sandbox.S = { exercises: [] };
const ghrHits = sandbox.exerciseSuggestHits('Glute Ham Raise');
must(!ghrHits.some((h) => /lateral raise/i.test(h.name || '')), 'GHR must not suggest Lateral Raise: ' + JSON.stringify(ghrHits));
must(ghrHits.length === 0, 'empty catalog: typing a new name has no catalog hits');

const lift = { name: 'Glute Ham Raise', category: '' };
sandbox.registerExercise(sandbox.S, lift);
must((sandbox.S.exercises || []).length === 1, 'typing a new lift adds one library entry');
must(sandbox.S.exercises[0].name === 'Glute Ham Raise', 'library keeps the typed name');
must(sandbox.S.exercises[0].source === 'THE-user', 'new lifts are user library, not THE-core');
must(lift.name === 'Glute Ham Raise', 'programmed/typed name is not rewritten to a catalog name');
must(!/lateral raise/i.test(lift.name), 'GHR is not rewritten to Lateral Raise');

const afterHits = sandbox.exerciseSuggestHits('Glute Ham Raise');
must(afterHits.length === 1 && afterHits[0].name === 'Glute Ham Raise', 'suggest only returns lifts you added');
must(!afterHits.some((h) => /lateral raise/i.test(h.name || '')), 'user library suggest still excludes Lateral Raise');

const starters = sandbox.ensureStarterTemplates
  ? null
  : html.includes('for(const b of cur.blocks||[]){if(b&&b.type===\'strength\')for(const ex of b.exercises||[])registerExercise(state,ex)}');
must(!starters, 'HPP starters must not dump programmed lifts into the catalog');

console.log('empty-exercise-library.smoke: ok');
