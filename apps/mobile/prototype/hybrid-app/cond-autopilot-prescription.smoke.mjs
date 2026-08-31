/**
 * Smoke: conditioning session-start autopilot (decideInitialCondPrescription).
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
if (!Adapter.applyAutopilotCondToTasks) throw new Error('applyAutopilotCondToTasks missing');
if (!app.HybridEngine.DecideInitialCondPrescription) {
  throw new Error('DecideInitialCondPrescription not exported from engine bundle');
}

const state = { settings: {}, sessions: [] };
const task = {
  kind: 'conditioning',
  condFmt: 'intervals',
  effort: 'medium',
  modality: 'Bike',
  rounds: 4,
  workSec: 240,
  restSec: 180,
  targetDurationMin: 28,
};
Adapter.applyAutopilotCondToTasks(state, [task]);
if (!task.autopilotCond) throw new Error('expected autopilotCond true');
if (!(task.rounds >= 8)) throw new Error('engine should fill progression rounds, got ' + task.rounds);
if (!Array.isArray(task.autopilotCondReasons)) throw new Error('missing autopilotCondReasons');

const pinned = Adapter.sessionPatchFromBuilder({
  fmt: 'intervals',
  effort: 'medium',
  modality: 'Bike',
  rounds: 5,
  workSec: 60,
  restSec: 90,
  autopilotCond: false,
  zones: [{ key: 'aerobic', lo: 130, hi: 150 }],
  settings: {},
});
if (pinned.rounds !== 5) throw new Error('pinned rounds should win');
if (pinned.autopilotCond !== false) throw new Error('pinned patch should not be autopilot');

console.log('cond-autopilot-prescription.smoke: ok');
