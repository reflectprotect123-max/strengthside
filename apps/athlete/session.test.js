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

const demoPlan = {
  title: 'Engine day',
  blocks: [
    { kind: 'warmup', letter: 'A', title: 'Easy spin', items: [{ n: 1, text: '3 min easy' }] },
    { kind: 'section', label: 'THE ENGINE' },
    {
      kind: 'engine',
      letter: 'B',
      title: 'Echo',
      machine: 'echo',
      structure: 'intervals',
      effort: 'hard',
      workSec: 15,
      restSec: 45,
      rounds: 8,
      prescription: '8 x 15s / 45s',
    },
    { kind: 'recovery', letter: 'C', title: 'Recovery breathing', bullets: ['Nasal breaths'] },
  ],
};

test('pagesFromPlan walks warmup, engine, recovery, done and skips sections', () => {
  const pages = HybridSession.pagesFromPlan(demoPlan);
  assert.equal(pages.length, 4);
  assert.deepEqual(pages.map((p) => p.id), ['A', 'B', 'C', 'done']);
  assert.equal(pages[0].logMode, 'complete');
  assert.equal(pages[1].logMode, 'engine');
  assert.equal(pages[1].kind, 'engine');
  assert.equal(pages[2].logMode, 'complete');
  assert.equal(pages[3].logMode, 'doneHub');
});

test('pagesFromPlan drops leftover lift blocks', () => {
  const pages = HybridSession.pagesFromPlan({
    blocks: [
      { kind: 'engine', letter: 'A', title: 'Row' },
      { kind: 'lift', letter: 'B', title: 'Back Squat', prescription: '3 x 8' },
    ],
  });
  assert.deepEqual(pages.map((p) => p.kind), ['engine', 'doneHub']);
});

test('startSession opens on quote then coach then first block', () => {
  let s = HybridSession.startSession({ date: '2026-09-07', plan: demoPlan });
  assert.equal(s.phase, 'quote');
  s = HybridSession.ackQuote(s);
  assert.equal(s.phase, 'coach');
  s = HybridSession.ackCoach(s);
  assert.equal(s.phase, 'block');
  assert.equal(s.pages[s.blockIndex].id, 'A');
});

test('goToLetter tap-in skips quote and lands on engine piece', () => {
  const s = HybridSession.startSession({ date: '2026-09-07', plan: demoPlan, letter: 'B' });
  assert.equal(s.phase, 'block');
  assert.equal(s.pages[s.blockIndex].id, 'B');
  assert.equal(s.pages[s.blockIndex].logMode, 'engine');
});

test('next and prev walk including done hub', () => {
  let s = HybridSession.startSession({ date: '2026-09-07', plan: demoPlan, letter: 'A' });
  s = HybridSession.nextPage(s);
  s = HybridSession.nextPage(s);
  s = HybridSession.nextPage(s);
  assert.equal(s.pages[s.blockIndex].id, 'done');
  s = HybridSession.prevPage(s);
  assert.equal(s.pages[s.blockIndex].id, 'C');
});

test('completeCurrent marks warmup done', () => {
  let s = HybridSession.startSession({ date: '2026-09-07', plan: demoPlan, letter: 'A' });
  s = HybridSession.completeCurrent(s);
  assert.equal(s.logs.A.completed, true);
});

test('doneTraining skips feel phase', () => {
  let s = HybridSession.startSession({ date: '2026-09-07', plan: demoPlan, letter: 'done' });
  s = HybridSession.openFeel(s);
  assert.equal(s.phase, 'summary');
});
