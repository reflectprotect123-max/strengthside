import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const logColumns = fs.readFileSync(path.join(__dirname, 'log-columns.js'), 'utf8');

function must(cond, msg) {
  if (!cond) throw new Error(msg);
}

must(html.includes("LOCAL_BUILD='the-hybrid-athlete-engine-v158'"), 'LOCAL_BUILD v153');
must(html.includes('function athExerciseSuggestBtn'), 'athExerciseSuggestBtn helper');
must(html.includes('class="searchpick ath-ex-pick"'), 'delegated athlete pick buttons');
must(html.includes('class="searchpick ex-sheet-pick"'), 'delegated sheet pick buttons');
must(html.includes('hybridExercisePickPointer'), 'pointerdown pick handler');
must(html.includes('function refreshAthleteLiftCard'), 'in-place lift card refresh');
must(html.includes('function refreshAthleteLiftMetricsOnly'), 'metrics-only lift refresh');
must(html.includes('function restoreAthLiftNameFocus'), 'name focus restore on card refresh');
must(!html.includes("onclick='pickAthleteLiftSuggest("), 'no fragile inline athlete pick onclick');
must(html.includes('overflow:visible;background:var(--panel)'), 'lift card does not clip suggest list');
must(logColumns.includes('id="athLiftName_${bi}_${ei}"'), 'stable lift name input ids');
must(html.includes('exercise-load-profiles.js'), 'exercise load profiles script');
must(
  html.includes('ExerciseLoadProfiles.defaultLogColumns(exerciseId)'),
  'pick applies profile defaults',
);

const sandbox = {
  window: {},
  console,
  document: {
    querySelector: () => null,
    createElement: () => ({ innerHTML: '', querySelector: () => null }),
  },
  draft: {
    blocks: [
      {
        type: 'strength',
        exercises: [
          {
            id: 'ex1',
            name: '',
            category: '',
            restSec: 120,
            autopilotVolume: true,
            logColumns: [
              { id: 'a', kind: 'weight_pct_wm', value: '', values: [] },
              { id: 'b', kind: 'reps', value: '', values: [] },
            ],
          },
        ],
      },
    ],
  },
  S: { exercises: [] },
  persistDraft: () => {},
  registerExercise: () => {},
  category: () => 'Core',
  athleteLiftRepOnly: () => false,
  ensureAthleteLiftShape: (ex) => ex,
  refreshAthleteLiftSuggest: () => {},
  refreshAthleteLiftMetricsOnly: () => {},
  refreshAthleteLiftCard: () => {},
  $: () => null,
};
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(logColumns, sandbox);
vm.runInContext(fs.readFileSync(path.join(__dirname, 'exercise-load-profiles.js'), 'utf8'), sandbox);

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

const pickSrc = extractFunction(html, 'pickAthleteLiftSuggest');
must(pickSrc, 'pickAthleteLiftSuggest function');
vm.runInContext(pickSrc, sandbox);

sandbox.pickAthleteLiftSuggest(0, 0, 'core-plank', 'Plank', 'Core');
const ex = sandbox.draft.blocks[0].exercises[0];
must(ex.exerciseId === 'core-plank', 'exerciseId set');
must(ex.logColumns && ex.logColumns.length === 1, 'plank single column');
must(ex.logColumns[0].kind === 'time_sec', 'plank → time_sec');

const twin = sandbox.LogColumns.builderAthleteTwinHtml(ex, { bi: 0, ei: 0 });
must(twin.includes('Time (seconds)'), 'plank twin shows Time (seconds)');

console.log('athlete-exercise-pick.smoke: ok');
