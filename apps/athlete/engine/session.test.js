import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
require(join(here, 'brain-kernel.js'));
require(join(here, 'engine.js'));
require(join(here, 'session.js'));
const HybridSession = globalThis.HybridSession;

const mixedPlan = {
  blocks: [
    { kind: 'warmup', letter: 'A', title: 'Prep' },
    { kind: 'section', label: 'STRENGTH/POWER' },
    { kind: 'lift', letter: 'B', title: 'Back Squat', prescription: '5 x 5', columns: ['reps', 'weight_kg'] },
    { kind: 'lift', letter: 'C1', title: 'Split Squat', prescription: '3 x 8', columns: ['reps', 'weight_kg'] },
    { kind: 'lift', letter: 'C2', title: 'Curl', prescription: '3 x 10', columns: ['reps', 'weight_kg'] },
    { kind: 'engine', letter: 'D', title: 'Bike', machine: 'bike', structure: 'intervals', effort: 'medium', workSec: 30, restSec: 30, rounds: 4 },
    { kind: 'engine', letter: 'E1', title: 'Row A', machine: 'row', structure: 'intervals', effort: 'medium', workSec: 20, restSec: 40, rounds: 3 },
    { kind: 'engine', letter: 'E2', title: 'Row B', machine: 'ski', structure: 'intervals', effort: 'hard', workSec: 20, restSec: 40, rounds: 3 },
    { kind: 'recovery', letter: 'F', title: 'Breathing' },
  ],
};

test('engine pagesFromPlan drops lifts and never puts HR on them', () => {
  const pages = HybridSession.pagesFromPlan(mixedPlan);
  assert.deepEqual(pages.map((p) => p.id), ['A', 'D', 'E1', 'E2', 'F', 'done']);
  assert.equal(pages.some((p) => p.kind === 'lift'), false);
  assert.equal(pages.some((p) => p.logMode === 'superset'), false);
  const enginePages = pages.filter((p) => p.kind === 'engine');
  assert.equal(enginePages.length, 3);
  for (const page of enginePages) {
    assert.equal(page.logMode, 'engine');
    assert.equal(HybridSession.isEngineHrPage(page), true);
  }
  assert.equal(HybridSession.isEngineHrPage({ kind: 'lift', logMode: 'kg' }), false);
  assert.equal(HybridSession.isEngineHrPage({ kind: 'lift', logMode: 'engine' }), false);
  assert.equal(HybridSession.isEngineHrPage({ kind: 'warmup', logMode: 'complete' }), false);
});

test('engine session logs have no liveHr on any page', () => {
  const s = HybridSession.startSession({ date: '2026-09-19', plan: mixedPlan });
  for (const page of s.pages) {
    const ids = HybridSession.logIdsForPage(page);
    for (const id of ids) {
      const log = s.logs[id];
      assert.ok(log);
      assert.equal('liveHr' in log, false);
      if (page.kind === 'engine') assert.ok(log.engine);
      else assert.equal(log.engine, undefined);
    }
  }
});
