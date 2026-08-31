/**
 * Smoke: strength progress UI wiring + progressSummary.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

function must(cond, msg) {
  if (!cond) throw new Error(msg);
}

const dir = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(dir, 'index.html'), 'utf8');
const bundle = readFileSync(join(dir, 'strength-bundle.js'), 'utf8');
const adapter = readFileSync(join(dir, 'strength-adapter.js'), 'utf8');
const recovery = readFileSync(join(dir, 'recovery-engine.js'), 'utf8') + readFileSync(join(dir, 'recovery-signals.js'), 'utf8');

must(html.includes('openStrengthProgress'), 'index must expose Progress screen');
must(html.includes('strengthProgressHtml'), 'index must render progress summary');
must(adapter.includes('progressSummary'), 'adapter must export progressSummary');

const sandbox = { window: {}, console };
vm.createContext(sandbox);
vm.runInContext(`${bundle}; window.HybridStrength = HybridStrength; ${recovery}; ${adapter}`, sandbox);

const { StrengthAdapter } = sandbox.window;
must(html.includes('openStrengthExerciseDetail'), 'index must open exercise detail');
must(html.includes('saveExerciseWorkingMax'), 'index must save WM from Progress');
must(adapter.includes('setWorkingMax'), 'adapter must export setWorkingMax');

const state = {
  meta: { progressionAudit: [] },
  exercises: [{ id: 'bp', name: 'Bench Press' }],
  strengthState: {
    workingMaxEvents: [{ exerciseId: 'bp', valueKg: 100, effectiveAt: '2026-08-24T10:00:00.000Z' }],
    prEvents: [],
    loadHints: { bp: { loadKg: 102.5, updatedAt: '2026-08-24T11:00:00.000Z', source: 'auto_estimate' } },
  },
  sessions: [{
    id: 's1',
    name: 'Full Body A',
    date: '2026-08-24',
    status: 'completed',
    completedAt: Date.now(),
    sessionPain: 'none',
    tasks: [{
      id: 't1',
      kind: 'strength',
      exerciseId: 'bp',
      rows: [
        { id: 'r1', n: 1, weight: 100, reps: 5, done: true },
        { id: 'r2', n: 2, weight: 102.5, reps: 5, done: true },
      ],
    }],
  }],
};
const detail = sandbox.window.StrengthAdapter.progressExerciseDetail(state, 'bp');
must(detail.ok && detail.history.length === 1, 'exercise detail history groups sets by session');
must(detail.history[0].sessionName === 'Full Body A', 'history includes session name');
must(detail.history[0].loadKg === 102.5 && detail.history[0].setCount === 2, 'history shows top load per session');
must(detail.loadHint && detail.loadHint.loadKg === 102.5, 'load hint');
must(html.includes('No logged sessions yet'), 'empty history copy is session-honest');
const summary = sandbox.window.StrengthAdapter.progressSummary(state);
must(summary.ok === true, 'progressSummary should ok');

console.log('strength-progress-ui.smoke: ok');
