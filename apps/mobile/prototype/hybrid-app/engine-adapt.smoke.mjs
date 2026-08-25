/**
 * Smoke: EngineAdapter.applyConAdapt + prescription reads conProgLevel.
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

if (!Adapter.applyConAdapt) throw new Error('applyConAdapt missing');
if (!Adapter.condResultFromTask) throw new Error('condResultFromTask missing');
if (!Adapter.zoneKeyForBpm) throw new Error('zoneKeyForBpm missing');
if (!Cond.conAdapt || !Cond.conProgLevel) throw new Error('engine Conditioning exports missing');

const state = { settings: {}, meta: {} };
const rec = {
  fmt: 'steady',
  modality: undefined,
  zsec: { low: 600, mod: 400, high: 0 },
  dur: 1000,
  rec: 70,
  sim: false,
};
Adapter.applyConAdapt(state, rec);
if (!state.settings.conProgress) throw new Error('conProgress not persisted');
const levelAfter = Cond.conProgLevel('steady', state.settings);
if (levelAfter < 1) throw new Error(`expected level bump, got ${levelAfter}`);
if (!state.meta.lastConAdapt || state.meta.lastConAdapt.delta !== 1) {
  throw new Error('lastConAdapt delta missing');
}

// E3: prescription without builder minutes uses level-adjusted duration.
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

// HTML zone seconds → engine zsec
const zsec = Adapter.htmlZonesToEngineZsec({ recovery: 10, aerobic: 20, anaerobic: 5, peak: 2 });
if (zsec.low !== 10 || zsec.mod !== 20 || zsec.high !== 7) throw new Error('htmlZonesToEngineZsec');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
if (!html.includes('applyConAdapt')) throw new Error('index.html missing applyConAdapt wiring');
if (!html.includes('settings:S.settings')) throw new Error('index.html missing settings pass-through');
if (!html.includes('zoneKeyForBpm')) throw new Error('index.html missing zoneKeyForBpm');

console.log('engine-adapt.smoke: ok', {
  levelAfter,
  mins0: p0.targetDurationMin,
  mins2: p2.targetDurationMin,
});
