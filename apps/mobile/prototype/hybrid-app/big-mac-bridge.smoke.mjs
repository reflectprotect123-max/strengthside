#!/usr/bin/env node
/**
 * BIG MAC five-engine bridge smoke — product engines + Python abstain parity.
 */
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../../..');
const require = createRequire(import.meta.url);

function loadScript(relPath, globalName) {
  delete global[globalName];
  require(path.join(here, relPath));
  return global[globalName];
}

function loadSandbox(extraScripts) {
  const bundle = readFileSync(path.join(here, 'strength-bundle.js'), 'utf8');
  const engineBundle = readFileSync(path.join(here, 'engine-bundle.js'), 'utf8');
  const sandbox = { window: {}, globalThis: {}, console, S: null };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  const scripts = [
    bundle,
    'window.HybridStrength = HybridStrength;',
    readFileSync(path.join(here, 'recovery-engine.js'), 'utf8'),
    readFileSync(path.join(here, 'recovery-signals.js'), 'utf8'),
    readFileSync(path.join(here, 'strength-adapter.js'), 'utf8'),
    engineBundle,
    'window.HybridEngine = HybridEngine;',
    readFileSync(path.join(here, 'engine-adapter.js'), 'utf8'),
    readFileSync(path.join(here, 'coordinator-adapter.js'), 'utf8'),
    readFileSync(path.join(here, 'big-mac-contract.js'), 'utf8'),
    readFileSync(path.join(here, 'big-mac-product-engines.js'), 'utf8'),
    readFileSync(path.join(here, 'big-mac-decide-shim.js'), 'utf8'),
    readFileSync(path.join(here, 'big-mac-bridge.js'), 'utf8'),
    ...(extraScripts || []),
  ].join('\n');
  vm.runInContext(scripts, sandbox);
  return sandbox.window;
}

function must(cond, msg) {
  if (!cond) throw new Error(msg);
}

const BigMacContract = loadScript('./big-mac-contract.js', 'BigMacContract');
const BigMacDecideShim = loadScript('./big-mac-decide-shim.js', 'BigMacDecideShim');
loadScript('./big-mac-product-engines.js', 'BigMacProductEngines');

const researchSnapshot = {
  athlete_id: 'REAL-ATHLETE-SMOKE',
  as_of: '2026-08-30T12:00:00Z',
  strength_domain: { session_pain: 'none' },
  product_engines: false,
};

const jsReceipt = BigMacDecideShim.decideShim(researchSnapshot);
const jsFacing = BigMacContract.toAthleteFacingUpdate(jsReceipt);
must(jsReceipt.action === 'abstain', 'Research path should abstain');
must(jsFacing.has_update === false && jsFacing.action === null, 'Research facing should be no update');

const pythonScript = `
import json, sys
from pathlib import Path
root = Path(${JSON.stringify(path.join(repoRoot, 'evidence-platform'))})
sys.path.insert(0, str(root))
from platform_core.db import connect, migrate
from platform_core.auto_promote import ensure_auto_promoted
from platform_core.decision import decide
from platform_core.engines import run_all
from platform_core.athlete_facing_contract import to_athlete_facing_update

snapshot = json.loads(sys.stdin.read())
db = connect(':memory:')
migrate(db)
ensure_auto_promoted(db, root / 'runtime')
outputs = run_all(snapshot, db)
receipt = decide(db, snapshot, outputs)
facing = to_athlete_facing_update(receipt)
print(json.dumps({
  'action': receipt['action'],
  'has_update': facing['has_update'],
  'reason_codes': receipt.get('reason_codes', []),
}))
`;

const py = spawnSync('python3', ['-c', pythonScript], {
  cwd: path.join(repoRoot, 'evidence-platform'),
  input: JSON.stringify(researchSnapshot),
  encoding: 'utf8',
});

if (py.status !== 0) {
  console.error(py.stderr || py.stdout);
  throw new Error('python decide failed');
}

const pyResult = JSON.parse(py.stdout.trim());
must(pyResult.action !== 'abstain', 'Python auto-promoted path should decide, got ' + pyResult.action);
must(Array.isArray(pyResult.reason_codes), 'Python should return reason_codes');
must(
  pyResult.reason_codes.includes('ENGINE_CANDIDATE_APPLIED') ||
  pyResult.reason_codes.some((c) => String(c).includes('AUTO_PROMOTED') || String(c).includes('PRODUCT_ENGINE')),
  'Python should cite auto-promoted engine path',
);

const syntheticSnapshot = {
  fixture: 'synthetic_test_only',
  athlete_id: 'SYNTH-SMOKE',
  as_of: '2026-01-01T00:00:00Z',
  synthetic_directives: { strength: { action: 'trim' } },
  product_engines: false,
};
const synReceipt = BigMacDecideShim.decideShim(syntheticSnapshot);
must(synReceipt.action === 'trim', 'synthetic strength trim should apply');

const win = loadSandbox();
const state = {
  meta: { ownerId: 'athlete-smoke', progressionAudit: [] },
  strengthState: { workingMaxEvents: [], prEvents: [], loadHints: {} },
  dailyCheckins: [{
    date: '2026-08-30',
    steps: 8000,
    energy: 7,
    sleepQuality: 7,
    muscleSoreness: 3,
    fuel: 'good',
  }],
  sessions: [],
  settings: { conProgress: {} },
};

const session = {
  id: 'sess-smoke',
  status: 'completed',
  date: '2026-08-30',
  sessionPain: 'none',
  tasks: [{
    id: 't1',
    kind: 'strength',
    exerciseId: 'bench',
    rows: [{ id: 'r1', n: 1, weight: 60, reps: 8, rir: 2, done: true, extra: false }],
  }],
};

must(typeof win.BigMacBridge.normalizeBigMacAction === 'function', 'normalizeBigMacAction missing');
must(win.BigMacBridge.normalizeBigMacAction('bounded_increase') === 'proceed', 'LLM action normalize');

const strengthResult = await win.BigMacBridge.afterStrengthSessionSync(state, session, { apply: true, localOnly: true });
must(strengthResult.ok === true, 'strength BIG MAC sync should succeed');
must((state.meta.bigMacReceipts || []).length >= 1, 'strength receipt recorded');
must(state.meta.bigMacReceipts.at(-1).trigger === 'strength', 'strength receipt trigger');

const condTask = {
  id: 'c1',
  kind: 'conditioning',
  condFmt: 'steady',
  modality: 'Run',
  effort: 'easy',
  result: { duration: 1200, zoneSeconds: { recovery: 600, aerobic: 400, anaerobic: 200 } },
};
state.meta.lastConAdapt = { delta: 1, at: '2026-08-30T12:00:00Z' };
const condResult = await win.BigMacBridge.afterConditioningSessionSync(state, condTask, { apply: true, localOnly: true });
must(condResult.ok === true, 'conditioning BIG MAC sync should succeed');

const checkinResult = await win.BigMacBridge.afterCheckin(state, { apply: true, localOnly: true });
must(checkinResult.receipt, 'recovery check-in decide should return receipt');
must(checkinResult.receipt.action, 'recovery should propose an action');

const coordState = win.BigMacBridge.bootstrapCoordinator(state, '2026-08-30', 7);
must(coordState.meta.bigMacCoordinatorAt || coordState.meta.coordinatorLastReceipt, 'coordinator bootstrap should run');

const productOutputs = win.BigMacProductEngines.runAll({
  athlete_id: 'x',
  as_of: '2026-08-30T12:00:00Z',
  product_engines: true,
  app_state: state,
  strength_domain: { session_id: session.id, session_pain: 'none' },
  conditioning_domain: { last_delta: 1, sessions_completed: 1 },
  recovery_domain: {
    illness: false,
    input: win.RecoveryEngine.recoveryPosture({
      checkinComplete: true,
      checkin: state.dailyCheckins[0],
      endDate: '2026-08-30',
    }),
  },
  nutrition_domain: { days_logged: 3, days_in_window: 7, low_energy_flag: false },
  coordinator_domain: { end_date: '2026-08-30', days: 7 },
});

for (const domain of ['strength', 'conditioning', 'nutrition', 'recovery', 'coordinator']) {
  must(productOutputs[domain], 'missing product output for ' + domain);
  must(productOutputs[domain].proposed_actions[0].action !== 'abstain', domain + ' should not abstain with product engines');
}

try {
  BigMacContract.toAthleteFacingUpdate({ action: 'hold', final_decision: { committed_change: 'false' } });
  throw new Error('contract should reject non-bool committed_change');
} catch (e) {
  must(String(e.message).includes('boolean'), 'expected boolean rejection');
}

console.log('big-mac-bridge: ok');
