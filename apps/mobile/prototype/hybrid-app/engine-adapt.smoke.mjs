/**
 * Smoke: EngineAdapter V3 cond anchors + legacy adapter helpers.
 * Run: node apps/mobile/prototype/hybrid-app/engine-adapt.smoke.mjs
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
    Uint8Array,
    DataView,
    ArrayBuffer,
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
const Cond = app.HybridEngine.Conditioning;

if (!Adapter.saveCondAnchors) throw new Error('saveCondAnchors missing');
if (!Adapter.applyConAdapt) throw new Error('applyConAdapt missing (legacy no-op)');
if (!Adapter.condResultFromTask) throw new Error('condResultFromTask missing');
if (!Adapter.zoneKeyForBpm) throw new Error('zoneKeyForBpm missing');
if (!Cond.conAdapt || !Cond.conProgLevel) throw new Error('engine Conditioning exports missing');

// V3: athlete path saves watts anchors — not conAdapt level progression.
const state = { settings: { condBenchmarkMaxW: 250 }, meta: {} };
const task = {
  kind: 'conditioning',
  condFmt: 'intervals',
  effort: 'medium',
  modality: 'Bike',
  targetWatts: 200,
  result: { avgWatts: 195 },
};
Adapter.saveCondAnchors(state, task);
const key = Adapter.condAnchorKey(task);
if (!state.settings.condAnchors || !state.settings.condAnchors[key]) {
  throw new Error('condAnchors not persisted');
}
if (state.settings.condAnchors[key].lastTargetWatts !== 200) {
  throw new Error('lastTargetWatts missing');
}

// applyConAdapt is intentionally a no-op on the athlete path now.
const before = JSON.stringify(state.settings);
Adapter.applyConAdapt(state, { fmt: 'steady', zsec: { low: 1, mod: 0, high: 0 }, dur: 60 });
if (JSON.stringify(state.settings) !== before) throw new Error('applyConAdapt should not mutate settings');

// Prescription builder still reads conProgress when explicitly passed (coach/legacy).
const p0 = Adapter.sessionPatchFromBuilder({
  fmt: 'steady',
  effort: 'easy',
  settings: { conProgress: {} },
  zones: [{ key: 'recovery', lo: 100, hi: 130, color: '#0f0', name: 'R' }],
});
const p2 = Adapter.sessionPatchFromBuilder({
  fmt: 'steady',
  effort: 'easy',
  settings: { conProgress: { steady: { level: 2, miss: 0 } } },
  zones: [{ key: 'recovery', lo: 100, hi: 130, color: '#0f0', name: 'R' }],
});
if (p0.condRxLevel !== 0) throw new Error(`level0 stamp ${p0.condRxLevel}`);
if (p2.condRxLevel !== 2) throw new Error(`level2 stamp ${p2.condRxLevel}`);
if (!(p2.targetDurationMin > p0.targetDurationMin)) {
  throw new Error(`level2 minutes ${p2.targetDurationMin} should exceed level0 ${p0.targetDurationMin}`);
}

const zsec = Adapter.htmlZonesToEngineZsec({ recovery: 10, aerobic: 20, anaerobic: 5, peak: 2 });
if (zsec.low !== 10 || zsec.mod !== 20 || zsec.high !== 7) throw new Error('htmlZonesToEngineZsec');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
if (!html.includes('saveCondAnchors')) throw new Error('index.html missing saveCondAnchors wiring');
const cc = html.slice(html.indexOf('function completeConditioning'), html.indexOf('function completeConditioning') + 500);
if (!cc.includes('saveCondAnchors')) throw new Error('completeConditioning missing saveCondAnchors');

if (!html.includes('settings:S.settings')) throw new Error('index.html missing settings pass-through');
if (!html.includes('zoneKeyForBpm')) throw new Error('index.html missing zoneKeyForBpm');

const rpeLoad = Adapter.condLoad({ minutes: 30, rpe: 6, effort: 'medium' });
if (!rpeLoad.scored || rpeLoad.load <= 0) throw new Error(`condLoad RPE fallback expected load, got ${JSON.stringify(rpeLoad)}`);
const zoneLoad = Adapter.condLoad({
  minutes: 30,
  zoneSeconds: { recovery: 0, aerobic: 1800, anaerobic: 0, peak: 0 },
});
if (!zoneLoad.scored || zoneLoad.load <= 0) throw new Error(`condLoad zone fallback expected load, got ${JSON.stringify(zoneLoad)}`);

console.log('engine-adapt.smoke: ok', {
  anchorKey: key,
  mins0: p0.targetDurationMin,
  mins2: p2.targetDurationMin,
});
