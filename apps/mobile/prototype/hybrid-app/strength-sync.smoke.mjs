/**
 * Smoke: strength cloud sync module (v3 calendar + templates).
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
must(html.includes('StrengthSync.schedulePush'), 'save() schedules strength push');
must(syncSrc.includes('mergeSnapshots'), 'merge remote and local snapshots');
must(syncSrc.includes('performedSessions'), 'snapshot exports performed sessions');
must(syncSrc.includes('calendarSessions'), 'snapshot exports calendar sessions');
must(syncSrc.includes('templates'), 'snapshot exports templates');
must(syncSrc.includes('SNAPSHOT_VERSION = 3'), 'snapshot version 3');

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
    calendarSessions: [{
      id: 's-sched-local',
      status: 'scheduled',
      date: '2026-08-26',
      name: 'Web session',
      _meta: { updatedAt: '2026-08-25T10:00:00.000Z' },
      tasks: [],
    }],
    templates: [{
      id: 'tpl-local',
      name: 'Local Upper',
      blocks: [],
      _meta: { updatedAt: '2026-08-25T09:00:00.000Z' },
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
    calendarSessions: [
      {
        id: 's-sched-local',
        status: 'scheduled',
        date: '2026-08-27',
        name: 'Phone renamed',
        _meta: { updatedAt: '2026-08-25T12:00:00.000Z' },
        tasks: [],
      },
      {
        id: 's-phone-only',
        status: 'scheduled',
        date: '2026-08-28',
        name: 'Phone only',
        _meta: { updatedAt: '2026-08-25T11:00:00.000Z' },
        tasks: [],
      },
    ],
    templates: [{
      id: 'tpl-local',
      name: 'Phone Upper',
      blocks: [{ id: 'b1', type: 'strength', exercises: [] }],
      _meta: { updatedAt: '2026-08-25T11:00:00.000Z' },
    }],
  }
);
must(merged.strengthState.workingMaxEvents[0].valueKg === 102.5, 'newer WM wins');
must(merged.strengthState.loadHints.bp.loadKg === 102.5, 'newer hint wins');
must(merged.progressionAudit.length === 2, 'audit merged');
must(merged.snapshotVersion === 3, 'snapshot version bumped');
must(merged.performedSessions.length === 1, 'performed sessions merged by id');
must(merged.performedSessions[0].tasks[0].rows[0].weight === 100, 'newer completedAt wins for sessions');
must(merged.calendarSessions.length === 2, 'calendar sessions union by id');
const renamed = merged.calendarSessions.find((s) => s.id === 's-sched-local');
must(renamed && renamed.name === 'Phone renamed' && renamed.date === '2026-08-27', 'newer calendar session wins');
must(merged.templates.length === 1 && merged.templates[0].name === 'Phone Upper', 'newer template wins');

const fixtureState = {
  meta: { progressionAudit: [] },
  strengthState: { workingMaxEvents: [], prEvents: [], loadHints: {} },
  templates: [{ id: 'tpl-a', name: 'A', blocks: [], _meta: { updatedAt: '2026-08-24T00:00:00.000Z' } }],
  sessions: [
    {
      id: 's-fixture',
      status: 'completed',
      date: '2026-08-24',
      name: 'Lower',
      completedAt: 3000,
      _meta: { updatedAt: '2026-08-24T12:00:00.000Z' },
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
    {
      id: 's-scheduled',
      status: 'scheduled',
      date: '2026-08-25',
      name: 'Upcoming',
      _meta: { updatedAt: '2026-08-24T08:00:00.000Z' },
      tasks: [{ id: 't3', kind: 'strength', exerciseId: 'bp' }],
      blocks: [{ id: 'b1', type: 'strength', exercises: [{ name: 'Bench' }] }],
    },
  ],
};

const snap = StrengthSync.snapshotFromState(fixtureState);
must(snap.snapshotVersion === 3, 'snapshot version in export');
must(snap.performedSessions.length === 1, 'only completed sessions in performed export');
must(snap.performedSessions[0].tasks.length === 1, 'strength tasks only in performed export');
must(snap.calendarSessions.length === 2, 'scheduled + completed in calendar export');
must(snap.calendarSessions.some((s) => s.id === 's-scheduled' && s.blocks && s.blocks.length === 1), 'scheduled keeps blocks');
must(snap.templates.length === 1 && snap.templates[0].id === 'tpl-a', 'templates exported');

const targetState = {
  meta: { progressionAudit: [] },
  strengthState: { workingMaxEvents: [], prEvents: [], loadHints: {} },
  templates: [],
  sessions: [{ id: 's-local-only', status: 'scheduled', date: '2026-08-26', name: 'Keep me', _meta: { updatedAt: '2026-08-20T00:00:00.000Z' } }],
};
StrengthSync.applySnapshot(targetState, snap);
must(targetState.sessions.some((s) => s.id === 's-local-only'), 'local-only session preserved');
must(targetState.sessions.some((s) => s.id === 's-scheduled'), 'scheduled session imported');
must(targetState.sessions.some((s) => s.id === 's-fixture' && s.status === 'completed'), 'completed session imported');
must(targetState.templates.some((t) => t.id === 'tpl-a'), 'template imported');

const imported = targetState.sessions.find((s) => s.id === 's-fixture');
must(imported.tasks[0].rows[0].weight === 140, 'set rows round-trip');

const performed = StrengthAdapter.performedFromSession(imported).filter((p) => p.exerciseId === 'sq');
must(performed.length === 1 && performed[0].measurements.some((m) => m.metricKey === 'load' && m.value === 140), 'performedFromState sees imported rows');

// v2 remote (no calendarSessions) still applies performed
const v2Target = {
  meta: {},
  strengthState: { workingMaxEvents: [], prEvents: [], loadHints: {} },
  sessions: [],
  templates: [],
};
StrengthSync.applySnapshot(v2Target, {
  snapshotVersion: 2,
  strengthState: { workingMaxEvents: [], prEvents: [], loadHints: {} },
  progressionAudit: [],
  performedSessions: [{
    id: 's-v2',
    date: '2026-08-20',
    name: 'Legacy',
    completedAt: 5000,
    tasks: [{ id: 't1', kind: 'strength', exerciseId: 'bp', rows: [] }],
  }],
});
must(v2Target.sessions.some((s) => s.id === 's-v2' && s.status === 'completed'), 'v2 performed still imports');

console.log('strength-sync.smoke: ok');
