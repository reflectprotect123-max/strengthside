/**
 * Dogfood proof: strapless cond scores load; recovery session repays debt.
 * Run: node apps/mobile/prototype/hybrid-app/dogfood-debt.smoke.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

function must(cond, msg) {
  if (!cond) throw new Error(msg);
}

const dir = dirname(fileURLToPath(import.meta.url));
const sandbox = { window: {}, console, Math, Date, Number, String, Array, Object, JSON };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(readFileSync(join(dir, 'engine-bundle.js'), 'utf8'), sandbox);
vm.runInContext(readFileSync(join(dir, 'engine-adapter.js'), 'utf8'), sandbox);
vm.runInContext(readFileSync(join(dir, 'recovery-engine.js'), 'utf8'), sandbox);

const { EngineAdapter, RecoveryEngine } = sandbox.window;

// 1) Strapless conditioning: RPE fallback must score load (was 0 before audit fix).
const strapless = EngineAdapter.condLoad({
  minutes: 30,
  avgHr: 0,
  rpe: 6,
  effort: 'medium',
});
must(strapless.scored && strapless.load > 0, `strapless cond load expected >0, got ${JSON.stringify(strapless)}`);
must(strapless.method.includes('RPE') || strapless.method.includes('Effort'), 'expected RPE/effort method');

const zoneOnly = EngineAdapter.condLoad({
  minutes: 20,
  zoneSeconds: { recovery: 0, aerobic: 1200, anaerobic: 0, peak: 0 },
});
must(zoneOnly.scored && zoneOnly.load > 0, `zone cond load expected >0, got ${JSON.stringify(zoneOnly)}`);

// 2) Heavy week → debt elevated; recovery repay lowers score.
const now = Date.now();
const sessions = [];
for (let i = 0; i < 4; i++) {
  sessions.push({
    id: 's' + i,
    status: 'completed',
    date: new Date(now - i * 86400000).toISOString().slice(0, 10),
    completedAt: now - i * 86400000,
    summary: {
      tonnage: 500,
      strengthLoad: 500,
      conditioningLoad: strapless.load,
      totalLoad: 500 + strapless.load,
    },
    tasks: [{ kind: 'conditioning', result: { duration: 1800, rpe: 6 } }],
  });
}

const endDate = new Date(now).toISOString().slice(0, 10);
const snapBefore = RecoveryEngine.recoveryDebtSnapshot({
  checkinComplete: true,
  checkin: { readinessColor: 'green', sleepQuality: 8, steps: 8000 },
  allSessions: sessions,
  recentSessions: sessions,
  endDate,
});
must(snapBefore.debt.score > 15, `debt should rise after heavy week, got ${snapBefore.debt.score}`);

const repay = RecoveryEngine.recoveryRepayFromSession(
  { duration: 900 },
  { result: { duration: 900, zoneSeconds: { recovery: 900 } } },
);
must(repay > 0, 'recovery repay expected');

sessions.push({
  id: 'rec1',
  status: 'completed',
  date: endDate,
  completedAt: now - 3600000,
  summary: {
    duration: 900,
    conditioningLoad: 2,
    totalLoad: 2,
    recoveryRepayLoad: repay,
  },
  recoverySession: true,
  tasks: [{ kind: 'conditioning', recoverySession: true, result: { duration: 900, zoneSeconds: { recovery: 900 } } }],
});

const snapAfter = RecoveryEngine.recoveryDebtSnapshot({
  checkinComplete: true,
  checkin: { readinessColor: 'green', sleepQuality: 8, steps: 8000 },
  allSessions: sessions,
  recentSessions: sessions,
  endDate,
});
must(snapAfter.debt.score < snapBefore.debt.score, `repay should lower debt ${snapBefore.debt.score} → ${snapAfter.debt.score}`);
must(snapAfter.repay >= repay, 'repay total should include recovery session');

console.log('dogfood-debt.smoke: ok', {
  straplessLoad: strapless.load,
  debtBefore: snapBefore.debt.score,
  debtAfter: snapAfter.debt.score,
  repay,
});
