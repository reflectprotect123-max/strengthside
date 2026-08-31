/**
 * Smoke: autopilot volume at session start via decideInitialPrescription.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const dir = dirname(fileURLToPath(import.meta.url));
const bundle = readFileSync(join(dir, 'strength-bundle.js'), 'utf8');
const adapterSrc = readFileSync(join(dir, 'strength-adapter.js'), 'utf8');

const sandbox = { window: {}, console };
vm.createContext(sandbox);
vm.runInContext(`${bundle}; window.HybridStrength = HybridStrength; ${adapterSrc}`, sandbox);
const { StrengthAdapter } = sandbox.window;

const state = {
  meta: { ownerId: 'athlete-1' },
  sessions: [{
    id: 's1',
    name: 'Lower',
    date: '2026-08-25',
    completedAt: '2026-08-25T12:00:00Z',
    status: 'completed',
    tasks: [{
      kind: 'strength',
      exerciseId: 'bench',
      name: 'Bench',
      sets: 4,
      reps: '5',
      rows: [
        { n: 1, weight: 80, reps: 5, done: true, extra: false },
        { n: 2, weight: 80, reps: 5, done: true, extra: false },
        { n: 3, weight: 80, reps: 5, done: true, extra: false },
        { n: 4, weight: 80, reps: 5, done: true, extra: false },
      ],
    }],
  }],
  strengthState: { workingMaxEvents: [], prEvents: [], loadHints: {} },
};

const tasks = [{
  id: 't1',
  kind: 'strength',
  exerciseId: 'bench',
  autopilotVolume: true,
  sets: null,
  reps: null,
  rows: [],
}];

StrengthAdapter.applyAutopilotToTasks(state, tasks, '2026-08-30');
const t = tasks[0];
if (t.sets !== 4) throw new Error('expected history set count 4, got ' + t.sets);
if (t.reps !== '5') throw new Error('expected history reps 5, got ' + t.reps);
if (!t.rows || t.rows.length !== 4) throw new Error('expected 4 rows, got ' + (t.rows?.length));

console.log('strength-autopilot-volume.smoke: ok');
