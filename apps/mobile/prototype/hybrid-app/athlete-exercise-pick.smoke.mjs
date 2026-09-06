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

must(html.includes("LOCAL_BUILD='the-hybrid-athlete-blank-v191'"), 'LOCAL_BUILD v191');
must(html.includes('function athExerciseSuggestBtn'), 'athExerciseSuggestBtn helper');
must(html.includes('class="searchpick ath-ex-pick"'), 'delegated athlete pick buttons');
must(html.includes('class="searchpick ex-sheet-pick"'), 'delegated sheet pick buttons');
must(html.includes('hybridExercisePickEvent'), 'pointerdown+click pick handler');
must(!html.includes('hybridExercisePickPointer'), 'legacy pick handler removed');
must(html.includes('.ath-suggest-host{position:relative;z-index:20}'), 'suggest host CSS stacks above hero');
must(html.includes('function refreshAthleteLiftCard'), 'in-place lift card refresh');
must(html.includes('function refreshAthleteLiftMetricsOnly'), 'metrics-only lift refresh');
must(html.includes('function restoreAthLiftNameFocus'), 'name focus restore on card refresh');
must(!html.includes("onclick='pickAthleteLiftSuggest("), 'no fragile inline athlete pick onclick');
must(html.includes('overflow:visible;background:var(--panel)'), 'lift card does not clip suggest list');
must(logColumns.includes('id="athLiftName_${bi}_${ei}"'), 'stable lift name input ids');
must(logColumns.includes('class="ath-suggest-host"'), 'suggest host in log-columns');
must(html.includes('exercise-load-profiles.js'), 'exercise load profiles script');
must(
  html.includes('ExerciseLoadProfiles.defaultLogColumns(exerciseId)'),
  'pick applies profile defaults',
);
must(html.includes('athSuggestPickLockUntil'), 'pick lock keeps dropdown closed after select');
must(html.includes('inp.blur()') || html.includes('inp.blur('), 'pick blurs name field after apply');
must(
  /function athleteLiftEditor\([^)]*\)\{[^}]*!y\.exerciseId/.test(html.replace(/\n/g, ' ')),
  'lift editor does not reopen suggest once exerciseId is applied',
);
must(
  html.includes("refreshAthleteLiftCard(bi,ei,{restoreFocus:false})") ||
    html.includes('refreshAthleteLiftCard(bi,ei,{restoreFocus:!1})'),
  'pick must not restore focus (which reopens suggest via onfocus)',
);
must(html.includes('function commitAthleteLiftName'), 'blur commits typed custom name');
must(
  logColumns.includes('onblur="commitAthleteLiftName(') ||
    logColumns.includes("onblur='commitAthleteLiftName("),
  'name input blurs into commitAthleteLiftName',
);
must(
  html.includes('ath-ex-custom') || html.includes('Use “') || html.includes("Use '") || html.includes('as custom'),
  'custom-name affordance in suggest empty/list',
);

const sandbox = {
  window: {},
  console,
  setTimeout,
  Date,
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
            openVolume: true,
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

let blurCount = 0;
let lastSuggestHtml = 'OPEN';
let cardOpts = null;
const nameInput = {
  value: '',
  blur() {
    blurCount += 1;
  },
};
const suggestBox = {
  set innerHTML(v) {
    lastSuggestHtml = v;
  },
  get innerHTML() {
    return lastSuggestHtml;
  },
};
sandbox.$ = (id) => {
  if (id === 'athLiftName_0_0') return nameInput;
  if (id === 'athSuggest_0_0') return suggestBox;
  return null;
};
sandbox.refreshAthleteLiftCard = (bi, ei, opts) => {
  cardOpts = opts || null;
};
sandbox.athleteLiftRepOnly = (() => {
  let n = 0;
  return () => {
    n += 1;
    // first call (was) false, second (after plank profile) true → forces card refresh path
    return n > 1;
  };
})();

const refreshSrc = extractFunction(html, 'refreshAthleteLiftSuggest');
const pickSrc = extractFunction(html, 'pickAthleteLiftSuggest');
must(pickSrc, 'pickAthleteLiftSuggest function');
must(refreshSrc, 'refreshAthleteLiftSuggest function');
// lock var is declared near pick helpers — seed if present in html as assignment target
if (html.includes('athSuggestPickLockUntil')) {
  vm.runInContext('var athSuggestPickLockUntil=0;', sandbox);
}
vm.runInContext(refreshSrc, sandbox);
vm.runInContext(pickSrc, sandbox);
// real refresh must be used (not the no-op stub)
must(typeof sandbox.refreshAthleteLiftSuggest === 'function', 'refresh helper live');

sandbox.pickAthleteLiftSuggest(0, 0, 'core-plank', 'Plank', 'Core');
const ex = sandbox.draft.blocks[0].exercises[0];
must(ex.exerciseId === 'core-plank', 'exerciseId set');
must(ex.logColumns && ex.logColumns.length === 1, 'plank single column');
must(ex.logColumns[0].kind === 'time_sec', 'plank → time_sec');
must(nameInput.value === 'Plank', 'name input updated');
must(blurCount >= 1, 'name field blurred after pick');
must(lastSuggestHtml === '', 'suggest list cleared after pick');
must(cardOpts && cardOpts.restoreFocus === false, 'card refresh does not restore focus');

// onfocus-style reopen must stay suppressed while pick lock is hot
sandbox.refreshAthleteLiftSuggest(0, 0, 'Plank');
must(lastSuggestHtml === '', 'pick lock blocks immediate suggest reopen');

const twin = sandbox.LogColumns.builderAthleteTwinHtml(ex, { bi: 0, ei: 0 });
must(twin.includes('Time (seconds)'), 'plank twin shows Time (seconds)');

// Custom typed name: blur/commit keeps name, registers custom id, clears suggest, logger cols work
sandbox.registerExercise = (state, lift) => {
  if (!lift.exerciseId) lift.exerciseId = 'custom-test-lift';
  return lift;
};
sandbox.ensureAthleteLiftShape = (lift) => {
  if (!lift.logColumns || !lift.logColumns.length) {
    lift.logColumns = [
      { id: 'w', kind: 'weight_kg', value: '', values: [] },
      { id: 'r', kind: 'reps', value: '', values: [] },
    ];
  }
  return lift;
};
sandbox.refreshAthleteLiftMetricsOnly = () => {};
sandbox.persistDraft = () => {};
lastSuggestHtml = 'STILL_OPEN';
sandbox.draft.blocks[0].exercises[0] = {
  id: 'ex2',
  name: 'Banded Nordic Hold',
  category: 'Custom',
  restSec: 90,
  openVolume: true,
  logColumns: [],
};
const commitSrc = extractFunction(html, 'commitAthleteLiftName');
must(commitSrc, 'commitAthleteLiftName function body');
vm.runInContext(commitSrc, sandbox);
sandbox.athSuggestPickLockUntil = 0;
sandbox.commitAthleteLiftName(0, 0);
// allow blur debounce
await new Promise((r) => setTimeout(r, 220));
const custom = sandbox.draft.blocks[0].exercises[0];
must(!!custom.exerciseId, 'custom name gets an exerciseId on commit');
must(String(custom.name) === 'Banded Nordic Hold', 'typed custom name preserved');
must(lastSuggestHtml === '', 'suggest cleared after custom commit');
must(
  custom.logColumns &&
    custom.logColumns.some((c) => c.kind === 'weight_kg') &&
    custom.logColumns.some((c) => c.kind === 'reps'),
  'custom commit seeds weight_kg + reps for logger',
);

console.log('athlete-exercise-pick.smoke: ok');
