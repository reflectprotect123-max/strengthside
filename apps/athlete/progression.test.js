import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
require(join(dirname(fileURLToPath(import.meta.url)), 'progression.js'));
const P = globalThis.HybridProgression;

test('base season starts Continuous Easy at 30 minutes for 8 weeks', () => {
  const block = P.startSeason('base', '2026-09-29');
  const dose = P.dose(block);
  assert.equal(dose.szn.weeks, 8);
  assert.equal(dose.method.id, 1);
  assert.equal(dose.label, '30:00 Easy continuous');
  assert.equal(dose.rungCount, 7);
});

test('two clean finishes climb one rung', () => {
  let block = P.startSeason('base', '2026-09-29');
  block = P.recordFinish(block, { qualified: true });
  assert.equal(block.rung, 1);
  assert.equal(block.last, 'qualify');
  block = P.recordFinish(block, { qualified: true });
  assert.equal(block.rung, 2);
  assert.equal(block.streak, 0);
  assert.equal(P.dose(block).label, '35:00 Easy continuous');
});

test('a short finish resets the streak and does not climb', () => {
  let block = P.startSeason('base', '2026-09-29');
  block = P.recordFinish(block, { qualified: true });
  block = P.recordFinish(block, { completedMin: 20, plannedMin: 30 });
  assert.equal(block.rung, 1);
  assert.equal(block.streak, 0);
  assert.equal(block.last, 'repeat');
});

test('a failed session drops one rung', () => {
  let block = P.startSeason('base', '2026-09-29');
  block.rung = 3;
  block = P.recordFinish(block, { failed: true });
  assert.equal(block.rung, 2);
  assert.equal(block.last, 'regress');
});

test('continuous easy stops auto-adding at 60', () => {
  let block = P.startSeason('base', '2026-09-29');
  block.rung = 7;
  block = P.recordFinish(block, { qualified: true });
  block = P.recordFinish(block, { qualified: true });
  assert.equal(block.rung, 7);
  assert.equal(block.last, 'ceiling');
});

test('red recovery shortens an easy continuous dose', () => {
  const block = P.startSeason('base', '2026-09-29');
  const dose = P.dose(block, { recovery: 'red' });
  assert.equal(dose.minutes, 23);
  assert.equal(dose.softened, true);
});

test('a season only allows its methods', () => {
  const block = P.setMethod(P.startSeason('base', '2026-09-29'), 9);
  assert.equal(block.methodId, 1);
  const build = P.setMethod(P.startSeason('build', '2026-09-29'), 4);
  assert.equal(build.methodId, 4);
  assert.equal(build.rung, 1);
});

test('week index follows the block start', () => {
  const block = P.startSeason('base', '2026-09-01');
  assert.equal(P.weekOf(block, '2026-09-01'), 1);
  assert.equal(P.weekOf(block, '2026-09-14'), 2);
  assert.equal(P.weekOf(block, '2026-12-01'), 8);
});

test('every method has a ladder', () => {
  assert.equal(P.METHODS.length, 12);
  for (const method of P.METHODS) {
    assert.ok(method.rungs.length >= 5, method.name);
  }
});

test('a finished continuous session is done without an effort prompt', () => {
  require(join(dirname(fileURLToPath(import.meta.url)), 'engine.js'));
  const started = globalThis.HybridEngine.startWork({
    engine: {
      structure: 'continuous',
      phase: 'ready',
      workSec: 1800,
      restSec: 0,
      rounds: 1,
      roundIndex: 0,
      target: {},
      bouts: [],
    },
  }, 1000);
  const done = globalThis.HybridEngine.endWork(started, 1000 + 1800 * 1000, false);
  assert.equal(done.engine.phase, 'done');
  assert.equal(done.completed, true);
  assert.equal(done.engine.workComplete, true);
  const early = globalThis.HybridEngine.endWork(started, 1000 + 10 * 60 * 1000, true);
  assert.equal(early.engine.workComplete, false);
  assert.equal(early.engine.phase, 'done');
});
