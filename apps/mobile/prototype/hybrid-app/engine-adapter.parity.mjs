#!/usr/bin/env node
/**
 * Stage 1 parity: engine-bundle + EngineAdapter vs @hybrid/engine goldens.
 * Run: node apps/mobile/prototype/hybrid-app/engine-adapter.parity.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../../..');

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
vm.runInContext(fs.readFileSync(path.join(__dirname, 'echo-ftms.js'), 'utf8'), app);

const Hr = app.HybridEngine.Hr;
const Adapter = app.EngineAdapter;
const failures = [];

function assert(cond, msg) {
  if (!cond) failures.push(msg);
}

// --- conMaxHr goldens (sample) ---
const maxHrGold = JSON.parse(
  fs.readFileSync(path.join(root, 'packages/engine/test/golden/conMaxHr.json'), 'utf8'),
);
for (const row of maxHrGold.slice(0, 5)) {
  const got = Hr.conMaxHr(row.profile);
  assert(got === row.out, `conMaxHr(${JSON.stringify(row.profile)}) → ${got}, want ${row.out}`);
}

// --- conZones goldens: engine list edges must match ---
const zonesGold = JSON.parse(
  fs.readFileSync(path.join(root, 'packages/engine/test/golden/conZones.json'), 'utf8'),
);
const picks = [
  zonesGold[0],
  zonesGold.find((x) => x.rest > 0 && x.rec == null),
  zonesGold.find((x) => x.rec === 25),
  zonesGold.find((x) => x.rec != null && x.rec >= 67),
].filter(Boolean);

for (const row of picks) {
  const whoop = row.rec != null ? { recoveryScore: row.rec } : null;
  const profile = { maxHr: row.maxHr, restingHr: row.rest || undefined };
  const z = Hr.conZones({ profile, whoop });
  assert(z.method === row.out.method, `method ${z.method} vs ${row.out.method}`);
  assert(z.list.length === 3, 'engine bands length 3');
  row.out.bands.forEach((b, i) => {
    assert(z.list[i].lo === b.lo && z.list[i].hi === b.hi, `band ${b.key} ${z.list[i].lo}-${z.list[i].hi} vs ${b.lo}-${b.hi}`);
  });

  const html = Adapter.zonesForProfile({
    maxHr: row.maxHr,
    restingHr: row.rest || undefined,
    whoop,
  });
  assert(html.length === 4, 'adapter returns 4 bands');
  assert(html[0].lo === z.list[0].lo && html[0].hi === z.list[0].hi, 'recovery matches low');
  assert(html[1].lo === z.list[0].hi + 1 && html[1].hi === z.list[1].hi, 'aerobic maps mod');
  assert(html[3].hi === z.list[2].hi, 'peak ends at max');
  assert(html.every((b) => b.lo < b.hi), 'HTML bands non-empty');
}

// --- effort / format surface ---
const hard = Adapter.effortMeta('hard');
assert(hard.zoneKey === 'anaerobic' && hard.engineZone === 'high', 'hard → anaerobic/high');
const fmt = Adapter.formatMeta('intervals');
assert(fmt.key === 'intervals' && fmt.rounds === 8, 'intervals base rounds');


// --- weekly zone aggregate ---
{
  const sessions = [
    { status: 'completed', date: '2026-08-23', tasks: [{ kind: 'conditioning', result: { zoneSeconds: { recovery: 60, aerobic: 120, anaerobic: 0, peak: 0 } } }] },
    { status: 'completed', date: '2026-08-20', tasks: [{ kind: 'conditioning', result: { zoneSeconds: { recovery: 0, aerobic: 300, anaerobic: 30, peak: 0 } } }] },
    { status: 'completed', date: '2026-08-10', tasks: [{ kind: 'conditioning', result: { zoneSeconds: { aerobic: 999 } } }] },
  ];
  const w = Adapter.weeklyZoneSeconds(sessions, '2026-08-23', 7);
  assert(w.recovery === 60 && w.aerobic === 420 && w.anaerobic === 30 && w.peak === 0, 'weeklyZoneSeconds window sum');
}


// --- Echo FTMS golden + Concept2 import guard ---
{
  const full = Uint8Array.from([0x54, 0x0b, 0xc4, 0x09, 0xa0, 0x00, 0xd2, 0x04, 0x00, 0x2c, 0x01, 0x19, 0x00, 0xf4, 0x01, 0x0a, 0x96, 0x58, 0x02]);
  const d = app.EchoFtms.parseIndoorBikeData(full);
  assert(d.power_w === 300 && d.cadence_rpm === 80 && d.calories_total === 25, 'Echo FTMS golden parse');
  const tagged = Adapter.tagEchoDeviceMetrics(d);
  assert(tagged.deviceCalories === 25 && tagged.device.id === 'echo_ftms', 'Echo calories device-tagged');

  const state = { sessions: [], settings: {} };
  const counts = Adapter.applyConcept2Results(state, [
    {
      provider: 'concept2',
      externalId: 'parity-rower-1',
      modality: 'rower',
      startedAt: '2026-08-20T10:00:00.000Z',
      durationRaw: 12000,
      distanceRaw: 5000,
    },
  ]);
  assert(counts.standalone === 1, 'concept2 standalone import');
  assert(state.sessions[0].tasks.every((t) => t.kind === 'conditioning'), 'concept2 never creates strength');
}

if (failures.length) {
  console.error('FAIL engine-adapter parity');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log(`PASS engine-adapter parity (${picks.length} zone vectors, ${Math.min(5, maxHrGold.length)} maxHr)`);
