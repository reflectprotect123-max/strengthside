import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
require(join(dirname(fileURLToPath(import.meta.url)), 'engine.js'));
const HybridEngine = globalThis.HybridEngine;

const piece = {
  machine: 'bike',
  structure: 'intervals',
  effort: 'medium',
  workSec: 10,
  restSec: 20,
  rounds: 3,
  typedWatts: 220,
};

test('work end gates on tapRest until athlete opens rest overlay', () => {
  let log = HybridEngine.readyLog(piece, null, null, null);
  assert.equal(log.engine.phase, 'ready');

  const t0 = 1_000_000;
  log = HybridEngine.startWork(log, t0);
  assert.equal(log.engine.phase, 'work');
  assert.equal(log.engine.workEndsAt, t0 + 10_000);

  log = HybridEngine.tick(log, t0 + 9_999);
  assert.equal(log.engine.phase, 'work');

  log = HybridEngine.tick(log, t0 + 10_000);
  assert.equal(log.engine.phase, 'tapRest');
  assert.equal(log.engine.restEndsAt, null);
  assert.equal(log.engine.needsEffort, true);

  log = HybridEngine.openRest(log, t0 + 10_500);
  assert.equal(log.engine.phase, 'rest');
  assert.equal(log.engine.restEndsAt, t0 + 10_500 + 20_000);

  log = HybridEngine.recordEffort(log, 'medium', null, t0 + 11_000);
  assert.equal(log.engine.needsEffort, false);
  assert.equal(log.engine.roundIndex, 1);
  assert.equal(log.engine.phase, 'rest');

  log = HybridEngine.tick(log, log.engine.restEndsAt);
  assert.equal(log.engine.phase, 'ready');
});

test('early end also waits for mid-screen Rest tap', () => {
  let log = HybridEngine.readyLog(piece, null, null, null);
  const t0 = 2_000_000;
  log = HybridEngine.startWork(log, t0);
  log = HybridEngine.endWork(log, t0 + 1_000, true);
  assert.equal(log.engine.phase, 'tapRest');
  assert.equal(log.engine.workComplete, false);
  assert.equal(HybridEngine.openRest(log, t0 + 2_000).engine.phase, 'rest');
});
