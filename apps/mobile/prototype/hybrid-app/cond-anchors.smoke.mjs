/**
 * Smoke: V3 conditioning anchors + watts push cap wiring.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadBrowser(file) {
  const sandbox = {
    console,
    Math,
    Date,
    Number,
    String,
    Array,
    Object,
    JSON,
    parseInt,
    isNaN,
    undefined,
  };
  sandbox.globalThis = sandbox;
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(file, 'utf8'), sandbox);
  return sandbox;
}

const app = loadBrowser(path.join(__dirname, 'engine-bundle.js'));
vm.runInContext(fs.readFileSync(path.join(__dirname, 'engine-adapter.js'), 'utf8'), app);

const Adapter = app.EngineAdapter;
if (!Adapter.saveCondAnchors) throw new Error('saveCondAnchors missing');
if (!Adapter.applyCondAnchorsToTask) throw new Error('applyCondAnchorsToTask missing');

const state = {
  settings: { condBenchmarkMaxW: 300, condAnchors: {} },
  sessions: [],
};

const task = {
  kind: 'conditioning',
  condFmt: 'intervals',
  effort: 'medium',
  modality: 'Bike',
  targetWatts: '',
  result: {},
};

Adapter.applyCondAnchorsToTask(state, task);
if (task.targetWatts !== 240) {
  throw new Error('expected 80% of 300W = 240, got ' + task.targetWatts);
}

task.targetWatts = 210;
task.result.avgWatts = 205;
Adapter.saveCondAnchors(state, task);
const key = Adapter.condAnchorKey(task);
const rec = state.settings.condAnchors[key];
if (!rec || rec.lastTargetWatts !== 210) {
  throw new Error('saveCondAnchors should persist last target');
}
if (rec.maxWatts < 300) throw new Error('maxWatts should include benchmark max');

// Push cap via decideNextPhase (bundle must be rebuilt from packages/engine)
const cap = app.HybridEngine.DecideNextPhase.decideNextPhase({
  formatKey: 'intervals',
  effort: { rpe: [6, 7] },
  felt: 5,
  zoneCompliance: 'met',
  targetWatts: 200,
  wattsPushCount: 2,
  maxWattsPushes: 2,
});
if (cap.action !== 'hold' || !cap.reasonCodes.includes('watts_push_cap')) {
  throw new Error('expected watts push cap hold, got ' + JSON.stringify(cap));
}

console.log('cond-anchors.smoke: ok');
