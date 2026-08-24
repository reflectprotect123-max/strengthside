/**
 * Smoke: strength cloud sync module.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const dir = dirname(fileURLToPath(import.meta.url));
const syncSrc = readFileSync(join(dir, 'strength-sync.js'), 'utf8');
const adapterSrc = readFileSync(join(dir, 'strength-adapter.js'), 'utf8');
const html = readFileSync(join(dir, 'index.html'), 'utf8');

function must(cond, msg) {
  if (!cond) throw new Error(msg);
}

must(syncSrc.includes('athlete_domain_snapshots'), 'pull from athlete_domain_snapshots');
must(syncSrc.includes('upsert_athlete_domain_snapshot'), 'push via ecosystem RPC');
must(syncSrc.includes('Whoop.client'), 'reuse WHOOP supabase session');
must(syncSrc.includes('schedulePush'), 'debounced push');
must(syncSrc.includes('bootstrap'), 'pull on app load bootstrap');
must(syncSrc.includes("save('strength-sync-pull')"), 'persist merged pull');
must(syncSrc.includes("DOMAIN = 'strength'"), 'strength domain');
must(html.includes('strength-sync.js'), 'index loads strength-sync.js');
must(syncSrc.includes('mergeSnapshots'), 'merge remote and local snapshots');
must(syncSrc.includes('performedSessions'), 'snapshot exports performed sessions');

const sandbox = { window: {}, console };
vm.createContext(sandbox);
vm.runInContext(syncSrc, sandbox);
vm.runInContext(adapterSrc, sandbox);

const { StrengthSync, StrengthAdapter } = sandbox.window;

const merged = StrengthSync.mergeSnapshots(
  {
    strengthState: {
      workingMaxEvents: [{ exerciseId: 'bp', valueKg: 100, effectiveAt: '2026-08-20T00:00:00.000Z' }],
      prEvents: [],
      loadHints: { bp: { loadKg: 100, updatedAt: '2026-08-20T00:00:00.000Z' } },
    },
    progressionAudit: [{ at: '2026-08-20', exerciseId: 'bp', action: 'hold' }],
    performedSessions: [{
      id: 's-old',
      date: '2026-08-20',
      name: 'Upper',
      completedAt: 1000,
      tasks: [{ id: 't1', kind: 'strength', exerciseId: 'bp', rows: [{ id: 'r1', n: 1, weight: 90, reps: 5, done: true }] }],
    }],
  },
  {
    strengthState: {
      workingMaxEvents: [{ exerciseId: 'bp', valueKg: 102.5, effectiveAt: '2026-08-24T00:00:00.000Z' }],
      prEvents: [{ exerciseId: 'bp', repCount: 5, valueKg: 105 }],
      loadHints: { bp: { loadKg: 102.5, updatedAt: '2026-08-24T00:00:00.000Z' } },
    },
    progressionAudit: [{ at: '2026-08-24', exerciseId: 'bp', action: 'progress' }],
    performedSessions: [{
      id: 's-old',
      date: '2026-08-24',
      name: 'Upper',
      completedAt: 2000,
      tasks: [{ id: 't1', kind: 'strength', exerciseId: 'bp', rows: [{ id: 'r1', n: 1, weight: 100, reps: 5, done: true }] }],
    }],
  }
);
must(merged.strengthState.workingMaxEvents[0].valueKg === 102.5, 'newer WM wins');
must(merged.strengthState.loadHints.bp.loadKg === 102.5, 'newer hint wins');
must(merged.progressionAudit.length === 2, 'audit merged');
must(merged.snapshotVersion === 2, 'snapshot version bumped');
must(merged.performedSessions.length === 1, 'performed sessions merged by id');
must(merged.performedSessions[0].tasks[0].rows[0].weight === 100, 'newer completedAt wins for sessions');

const fixtureState = {
  meta: { progressionAudit: [] },
  strengthState: { workingMaxEvents: [], prEvents: [], loadHints: {} },
  sessions: [
    {
      id: 's-fixture',
      status: 'completed',
      date: '2026-08-24',
      name: 'Lower',
      completedAt: 3000,
      tasks: [
        {
          id: 't1',
          kind: 'strength',
          exerciseId: 'sq',
          rows: [{ id: 'r1', n: 1, weight: 140, reps: 5, rir: 2, done: true }],
        },
        { id: 't2', kind: 'conditioning', result: { zoneSeconds: { aerobic: 600 } } },
      ],
    },
    { id: 's-scheduled', status: 'scheduled', date: '2026-08-25', tasks: [{ id: 't3', kind: 'strength', exerciseId: 'bp' }] },
  ],
};

const snap = StrengthSync.snapshotFromState(fixtureState);
must(snap.snapshotVersion === 2, 'snapshot version in export');
must(snap.performedSessions.length === 1, 'only completed sessions exported');
must(snap.performedSessions[0].tasks.length === 1, 'strength tasks only in export');
must(snap.performedSessions[0].tasks[0].rows[0].weight === 140, 'set rows preserved in snapshot');

const targetState = {
  meta: { progressionAudit: [] },
  strengthState: { workingMaxEvents: [], prEvents: [], loadHints: {} },
  sessions: [{ id: 's-scheduled', status: 'scheduled', date: '2026-08-25', tasks: [{ id: 't3', kind: 'strength', exerciseId: 'bp' }] }],
};
StrengthSync.applySnapshot(targetState, snap);
must(targetState.sessions.length === 2, 'scheduled session preserved');
must(targetState.sessions[0].status === 'scheduled', 'scheduled session untouched');
const imported = targetState.sessions.find((s) => s.id === 's-fixture');
must(imported && imported.status === 'completed', 'completed session imported');
must(imported.tasks[0].rows[0].weight === 140, 'set rows round-trip');

const performed = StrengthAdapter.performedFromSession(imported).filter((p) => p.exerciseId === 'sq');
must(performed.length === 1 && performed[0].measurements.some((m) => m.metricKey === 'load' && m.value === 140), 'performedFromState sees imported rows');

console.log('strength-sync.smoke: ok');
