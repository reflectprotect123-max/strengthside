import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const dir = dirname(fileURLToPath(import.meta.url));
require(join(dir, 'engine.js'));
require(join(dir, 'library.js'));
const Lib = globalThis.HybridLibrary;

test('create Engine session then add an interval piece', () => {
  let st = Lib.emptyState();
  st = Lib.createTemplate(st, { title: 'Row VO2' });
  const tid = st.templates[0].id;
  assert.equal(st.templates[0].lane, 'engine');
  st = Lib.addEnginePiece(st, tid, {
    machine: 'row',
    structure: 'intervals',
    effort: 'hard',
    workSec: 15,
    restSec: 45,
    rounds: 8,
  });
  const letters = Lib.lettered(st.templates[0]).map((b) => b.letter);
  assert.deepEqual(letters, ['A']);
  assert.equal(st.templates[0].blocks[0].kind, 'engine');
});

test('compile plan maps engine piece and skips lifts', () => {
  let st = Lib.emptyState();
  st = Lib.createTemplate(st, { title: 'Bike tempo', instructions: 'Nasal' });
  const tid = st.templates[0].id;
  st = Lib.addCircuit(st, tid, { title: 'Easy spin', instructions: '3 min easy' });
  st = Lib.addEnginePiece(st, tid, { machine: 'echo', structure: 'tempo', effort: 'easy', workSec: 10, restSec: 60, rounds: 10 });
  st.templates[0].blocks.push({
    id: 'lift_x',
    kind: 'lift',
    title: 'Back Squat',
    setCount: 3,
    columns: ['reps', 'weight_kg'],
  });
  const plan = Lib.compile(st.templates[0]);
  const kinds = plan.blocks.map((b) => b.kind);
  assert.ok(kinds.includes('engine'));
  assert.ok(!kinds.includes('lift'));
  assert.equal(plan.title, 'Bike tempo');
});

test('addExercise is a no-op on Engine templates', () => {
  let st = Lib.emptyState();
  st = Lib.createTemplate(st, { title: 'Engine session' });
  const tid = st.templates[0].id;
  const next = Lib.addExercise(st, tid, { title: 'Bench Press' });
  assert.equal(next.templates[0].blocks.length, 0);
});
