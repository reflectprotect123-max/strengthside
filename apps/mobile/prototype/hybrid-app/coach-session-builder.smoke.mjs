/**
 * R3 session builder — markup + template round-trip.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const dir = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(dir, 'coach.html'), 'utf8');
const src = readFileSync(join(dir, 'coach-loop.js'), 'utf8');

for (const needle of [
  'Coach instructions',
  'Add Block',
  'For Weight',
  'For Completion',
  'Choose exercise',
  'New session',
  'block-card',
]) {
  if (!html.includes(needle)) throw new Error(`coach.html missing ${needle}`);
}
if (!src.includes('Uncategorized')) throw new Error('coach-loop.js missing Uncategorized category');

const sandbox = { console, module: { exports: {} }, globalThis: {} };
sandbox.globalThis = sandbox;
vm.runInNewContext(src, sandbox);
const L = sandbox.module.exports || sandbox.CoachLoop;

if (!L.BLOCK_CATEGORIES.includes('Uncategorized')) {
  throw new Error('BLOCK_CATEGORIES must include Uncategorized');
}

const t = L.makeTemplate({
  name: 'Test session',
  coachInstructions: 'Move well.',
  blocks: [
    L.makeBlock({
      type: 'strength',
      category: 'Strength/Power',
      scoring: 'weight',
      exercises: [L.makeExercise({ name: 'Bench Press', sets: 3, reps: '5', load: '80', metric: 'Weight' })],
    }),
  ],
});

if (t.blocks[0].letter !== 'A') throw new Error('expected block letter A');
if (t.blocks[0].scoring !== 'weight') throw new Error('scoring weight');
const line = L.prescriptionLine(t.blocks[0].exercises[0]);
if (!line.includes('3')) throw new Error('prescription line: ' + line);

const session = L.instantiateSession(t, { athleteId: 'ath-1', date: '2026-08-27', name: t.name });
if (!session.blocks.length) throw new Error('instantiateSession empty');
if (session.coachInstructions !== 'Move well.') throw new Error('coach instructions copy');

console.log('coach-session-builder: ok', { blocks: t.blocks.length, letter: t.blocks[0].letter });
