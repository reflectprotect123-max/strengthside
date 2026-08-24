/**
 * Smoke: strength bundle progression surface + adapter silent apply.
 * Run: bash apps/mobile/prototype/hybrid-app/build-strength.sh && node apps/mobile/prototype/hybrid-app/strength-progression.smoke.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const dir = dirname(fileURLToPath(import.meta.url));
const bundle = readFileSync(join(dir, 'strength-bundle.js'), 'utf8');
const adapterSrc = readFileSync(join(dir, 'strength-adapter.js'), 'utf8');
const recoverySrc = readFileSync(join(dir, 'recovery-engine.js'), 'utf8') + readFileSync(join(dir, 'recovery-signals.js'), 'utf8');

const sandbox = { window: {}, console };
vm.createContext(sandbox);
vm.runInContext(`${bundle}; window.HybridStrength = HybridStrength; ${recoverySrc}; ${adapterSrc}`, sandbox);

const { HybridStrength, StrengthAdapter, RecoverySignals } = sandbox.window;

for (const ns of ['Progression', 'Exposure', 'Performed', 'Pr', 'WorkingMax']) {
  if (!HybridStrength[ns]) throw new Error('HybridStrength.' + ns + ' missing from bundle');
}

const state = {
  meta: { ownerId: 'athlete-1', progressionAudit: [] },
  strengthState: { workingMaxEvents: [], prEvents: [], loadHints: {} },
  sessions: [],
};

function completedSession(id, exerciseId, rows, extra) {
  return {
    id,
    status: 'completed',
    completedAt: Date.now(),
    sessionPain: extra && extra.sessionPain,
    sessionPainRecorded: true,
    tasks: [{
      id: 't1',
      kind: 'strength',
      exerciseId,
      name: 'Bench',
      rows,
    }],
  };
}

// Three on-target rated sessions → progress when check-in ok
const benchRows = (load, reps) => [
  { id: 'r1', n: 1, weight: load, reps, rir: 2, done: true, extra: false },
];
state.sessions.push(
  completedSession('s1', 'bench', benchRows(60, 8)),
  completedSession('s2', 'bench', benchRows(60, 8)),
  completedSession('s3', 'bench', benchRows(60, 8)),
);

const session4 = completedSession('s4', 'bench', benchRows(60, 8));
state.sessions.push(session4);

const okRecovery = RecoverySignals.recoverySignal({
  checkinComplete: true,
  checkin: { readinessColor: 'green' },
});

const result = StrengthAdapter.applySilentProgression(state, session4, {
  recoverySignal: okRecovery,
});

if (result.applied !== 1) throw new Error('Expected one silent progress apply, got ' + JSON.stringify(result));
const hint = state.strengthState.loadHints.bench;
if (!hint || hint.loadKg <= 60) throw new Error('Load hint should bump above 60kg, got ' + (hint && hint.loadKg));

const audit = state.meta.progressionAudit.at(-1);
if (!audit || audit.action !== 'progress') throw new Error('Audit should record progress');

// Red check-in blocks bump unless performance override (PR)
const state2 = {
  meta: { ownerId: 'a', progressionAudit: [] },
  strengthState: { workingMaxEvents: [], prEvents: [], loadHints: {} },
  sessions: [
    completedSession('s1', 'sq', benchRows(100, 5)),
    completedSession('s2', 'sq', benchRows(100, 5)),
    completedSession('s3', 'sq', benchRows(100, 5)),
  ],
};
const sessionHold = completedSession('s4', 'sq', benchRows(100, 5));
state2.sessions.push(sessionHold);

const holdRecovery = RecoverySignals.recoverySignal({
  checkinComplete: true,
  checkin: { readinessColor: 'red' },
});

StrengthAdapter.applySilentProgression(state2, sessionHold, { recoverySignal: holdRecovery });
const holdAudit = state2.meta.progressionAudit.at(-1);
if (holdAudit.action !== 'hold') throw new Error('Red day should hold without PR override');

// PR override on red day
const state3 = {
  meta: { ownerId: 'a', progressionAudit: [] },
  strengthState: {
    workingMaxEvents: [],
    prEvents: [{ exerciseId: 'dl', repCount: 5, valueKg: 140, achievedAt: '2026-01-01', performedSetId: 'old' }],
    loadHints: {},
  },
  sessions: [
    completedSession('s1', 'dl', benchRows(140, 5)),
    completedSession('s2', 'dl', benchRows(140, 5)),
    completedSession('s3', 'dl', benchRows(140, 5)),
  ],
};
const sessionPr = completedSession('s4', 'dl', benchRows(145, 5));
state3.sessions.push(sessionPr);

StrengthAdapter.applySilentProgression(state3, sessionPr, { recoverySignal: holdRecovery });
const prAudit = state3.meta.progressionAudit.at(-1);
if (prAudit.action !== 'progress' || !prAudit.reasonCodes.includes('performance_overrides_subjective_gate')) {
  throw new Error('PR should override subjective gate');
}

// Session pain yes blocks even with PR pattern
const state4 = {
  meta: { ownerId: 'a', progressionAudit: [] },
  strengthState: { workingMaxEvents: [], prEvents: [], loadHints: {} },
  sessions: [
    completedSession('s1', 'ohp', benchRows(40, 8)),
    completedSession('s2', 'ohp', benchRows(40, 8)),
    completedSession('s3', 'ohp', benchRows(40, 8)),
  ],
};
const sessionPain = completedSession('s4', 'ohp', benchRows(42, 8), { sessionPain: 'yes' });
state4.sessions.push(sessionPain);

StrengthAdapter.applySilentProgression(state4, sessionPain, { recoverySignal: okRecovery });
const painAudit = state4.meta.progressionAudit.at(-1);
if (painAudit.action !== 'hold' || !painAudit.reasonCodes.includes('session_pain_yes')) {
  throw new Error('Session pain yes must hold despite good performance');
}

console.log('strength-progression.smoke: ok', { bumpedTo: hint.loadKg });
