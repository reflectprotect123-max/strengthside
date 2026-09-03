/**
 * Smoke: V3 session-end anchors (no decideProgression bumps).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const dir = dirname(fileURLToPath(import.meta.url));
const bundle = readFileSync(join(dir, 'strength-bundle.js'), 'utf8');
const adapterSrc = readFileSync(join(dir, 'strength-adapter.js'), 'utf8');
const recoverySrc =
  readFileSync(join(dir, 'recovery-engine.js'), 'utf8') +
  readFileSync(join(dir, 'recovery-signals.js'), 'utf8');

const sandbox = { window: {}, console };
vm.createContext(sandbox);
vm.runInContext(`${bundle}; window.HybridStrength = HybridStrength; ${recoverySrc}; ${adapterSrc}`, sandbox);

const { StrengthAdapter } = sandbox.window;

const state = {
  meta: { ownerId: 'athlete-1', progressionAudit: [] },
  strengthState: { workingMaxEvents: [], prEvents: [], loadHints: {}, volumeHints: {} },
  sessions: [],
};

function completedSession(id, exerciseId, rows) {
  return {
    id,
    status: 'completed',
    completedAt: Date.now(),
    sessionPain: 'none',
    sessionPainRecorded: true,
    tasks: [
      {
        id: 't1',
        kind: 'strength',
        exerciseId,
        name: 'Bench',
        rows,
      },
    ],
  };
}

const benchRows = (load, reps) => [
  { id: 'r1', n: 1, weight: load, reps, rir: 2, done: true, extra: false },
  { id: 'r2', n: 2, weight: load, reps, rir: 2, done: true, extra: false },
];

const session = completedSession('s1', 'bench', benchRows(62.5, 8));
state.sessions.push(session);

const result = StrengthAdapter.saveSessionAnchors(state, session);
if (result.applied !== 1) throw new Error('Expected one anchor save, got ' + JSON.stringify(result));

const hint = state.strengthState.loadHints.bench;
if (!hint || hint.loadKg !== 62.5) {
  throw new Error('Load hint should mirror last session load 62.5kg, got ' + (hint && hint.loadKg));
}
if (hint.source !== 'session_anchor') {
  throw new Error('Expected session_anchor source, got ' + hint.source);
}

// Second session at same load — anchor stays (no silent bump)
const session2 = completedSession('s2', 'bench', benchRows(62.5, 8));
state.sessions.push(session2);
StrengthAdapter.saveSessionAnchors(state, session2);
if (state.strengthState.loadHints.bench.loadKg !== 62.5) {
  throw new Error('Anchor should not bump without in-session autoreg');
}

// WM gate removed — missingWorkingMaxExerciseIds always empty
const missing = StrengthAdapter.missingWorkingMaxExerciseIds(state, ['bench'], '2026-09-03');
if (missing.length !== 0) throw new Error('WM gate should be disabled');

console.log('strength-progression.smoke: ok', { anchorKg: hint.loadKg });
