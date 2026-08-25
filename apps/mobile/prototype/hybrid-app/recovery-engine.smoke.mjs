/**
 * Smoke: recovery-engine posture + recovery-signals delegation (≥12 worst-of cases).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

function must(cond, msg) {
  if (!cond) throw new Error(msg);
}

const dir = dirname(fileURLToPath(import.meta.url));
const engine = readFileSync(join(dir, 'recovery-engine.js'), 'utf8');
const signals = readFileSync(join(dir, 'recovery-signals.js'), 'utf8');

const sandbox = { window: {}, console };
vm.createContext(sandbox);
vm.runInContext(engine + '\n' + signals, sandbox);

const { RecoveryEngine, RecoverySignals } = sandbox.window;

/** @type {Array<{ name: string, input: object, expect: { band?: string, gate: string } }>} */
const cases = [
  { name: 'no check-in', input: { checkinComplete: false }, expect: { band: 'insufficient_data', gate: 'hold' } },
  { name: 'green subjective only', input: { checkinComplete: true, checkin: { readinessColor: 'green' } }, expect: { band: 'build', gate: 'ok' } },
  { name: 'yellow subjective', input: { checkinComplete: true, checkin: { readinessColor: 'yellow' } }, expect: { band: 'control', gate: 'caution' } },
  { name: 'red subjective', input: { checkinComplete: true, checkin: { readinessColor: 'red' } }, expect: { band: 'minimum', gate: 'hold' } },
  { name: 'green + green WHOOP', input: { checkinComplete: true, checkin: { readinessColor: 'green' }, whoopRecovery: 80 }, expect: { band: 'build', gate: 'ok' } },
  { name: 'green + yellow WHOOP', input: { checkinComplete: true, checkin: { readinessColor: 'green' }, whoopRecovery: 50 }, expect: { gate: 'caution' } },
  { name: 'green + red WHOOP', input: { checkinComplete: true, checkin: { readinessColor: 'green' }, whoopRecovery: 20 }, expect: { gate: 'hold' } },
  { name: 'yellow + green WHOOP', input: { checkinComplete: true, checkin: { readinessColor: 'yellow' }, whoopRecovery: 80 }, expect: { gate: 'caution' } },
  { name: 'green subjective + no WHOOP', input: { checkinComplete: true, checkin: { readinessColor: 'green' }, whoopRecovery: 0 }, expect: { gate: 'ok' } },
  { name: 'no check-in + green WHOOP cannot unlock', input: { checkinComplete: false, whoopRecovery: 90 }, expect: { band: 'insufficient_data', gate: 'hold' } },
  { name: 'session pain yes forces hold', input: { checkinComplete: true, checkin: { readinessColor: 'green' }, whoopRecovery: 90, sessionPain: 'yes' }, expect: { gate: 'hold' } },
  { name: 'session pain mild advisory only', input: { checkinComplete: true, checkin: { readinessColor: 'green' }, sessionPain: 'mild' }, expect: { gate: 'ok' } },
];

for (const c of cases) {
  const p = RecoveryEngine.recoveryPosture(c.input);
  must(p.gate === c.expect.gate, `${c.name}: gate ${p.gate} !== ${c.expect.gate}`);
  if (c.expect.band) must(p.band === c.expect.band, `${c.name}: band ${p.band} !== ${c.expect.band}`);
  const sig = RecoverySignals.recoverySignal(c.input);
  must(sig.gate === p.gate, `${c.name}: signals gate must delegate`);
}

must(RecoveryEngine.blocksProgressionBumps({ gate: 'hold' }), 'hold blocks bumps');
must(!RecoveryEngine.blocksProgressionBumps({ gate: 'ok' }), 'ok does not block bumps');
must(RecoveryEngine.postureCopy({ band: 'insufficient_data', gate: 'hold' }).includes('Check in'), 'copy for no check-in');

const heatPosture = RecoveryEngine.recoveryPosture({
  checkinComplete: true,
  checkin: { readinessColor: 'green', sleepQuality: 3, heatLoad: 4, steps: 12000 },
  recentCheckins: [
    { heatLoad: 4 }, { heatLoad: 5 }, { heatLoad: 4 },
  ],
});
must(heatPosture.gate === 'caution', 'elevated heat ledger downgrades green day');
must(heatPosture.reasonCodes.includes('heat_ledger_elevated'), 'heat ledger reason');
must(heatPosture.domains.heatLoad === 4, 'domains.heatLoad from check-in');
must(heatPosture.domains.steps === 12000, 'domains.steps from check-in');
must(heatPosture.domains.backgroundLoad > 0, 'domains.backgroundLoad step-derived');
must(typeof heatPosture.capacityHint === 'number', 'capacityHint populated when data sufficient');

const coolCap = RecoveryEngine.recoveryPosture({
  checkinComplete: true,
  checkin: { readinessColor: 'green', sleepQuality: 8, heatLoad: 1 },
  recentCheckins: [{ heatLoad: 1 }, { heatLoad: 1 }],
});
const hotCap = RecoveryEngine.recoveryPosture({
  checkinComplete: true,
  checkin: { readinessColor: 'green', sleepQuality: 8, heatLoad: 5 },
  recentCheckins: [{ heatLoad: 5 }, { heatLoad: 5 }, { heatLoad: 4 }],
});
must(hotCap.capacityHint < coolCap.capacityHint, 'heat high lowers capacityHint');
must(hotCap.reasonCodes.includes('heat_ledger_elevated'), 'heat elevated reason without poor sleep');
must(coolCap.capacityHint != null && hotCap.capacityHint != null, 'capacityHint numeric when band known');

const noData = RecoveryEngine.recoveryPosture({ checkinComplete: false });
must(noData.capacityHint === null, 'insufficient_data capacityHint null');
must(noData.band === 'insufficient_data', 'insufficient_data band');

const heavySessions = [];
const now = Date.now();
for (let i = 0; i < 5; i++) {
  heavySessions.push({
    status: 'completed',
    completedAt: now - i * 86400000,
    // Post Phase 1: strengthLoad is tonnage kg; ledger prefers summary.tonnage /50.
    summary: { strengthLoad: 500, conditioningLoad: 3, tonnage: 500, totalLoad: 503 },
  });
}
const deliveryLedger = RecoveryEngine.deliveryLoadLedger(heavySessions, [], {
  allSessions: heavySessions,
  endDate: new Date(now).toISOString().slice(0, 10),
});
must(deliveryLedger.delivered >= 12, 'delivery ledger sums sessions');
must(deliveryLedger.elevated, 'heavy week elevated without budget history');
// Scaled strength (500/50=10) + cond 3 → ~13 per session; not raw 503.
must(deliveryLedger.training < 200, 'strength channel scaled for delivery (not raw kg)');

// Mixed-scale history: legacy strengthLoad already /50; new rows have tonnage kg.
const mixed = [];
const endIso = new Date(now).toISOString().slice(0, 10);
for (let i = 0; i < 3; i++) {
  mixed.push({
    status: 'completed',
    completedAt: now - (8 + i) * 86400000,
    summary: { strengthLoad: 10, conditioningLoad: 3, tonnage: 500, totalLoad: 13 },
  });
}
for (let i = 0; i < 3; i++) {
  mixed.push({
    status: 'completed',
    completedAt: now - i * 86400000,
    summary: { strengthLoad: 500, conditioningLoad: 3, tonnage: 500, totalLoad: 503 },
  });
}
const mixedLedger = RecoveryEngine.deliveryLoadLedger(mixed, [], {
  allSessions: mixed,
  endDate: endIso,
});
must(mixedLedger.ratio < 5, `mixed history ratio should stay sane, got ${mixedLedger.ratio}`);
const mixedPosture = RecoveryEngine.recoveryPosture({
  checkinComplete: true,
  checkin: { readinessColor: 'green', sleepQuality: 8 },
  recentSessions: mixed,
  allSessions: mixed,
  endDate: endIso,
});
must(mixedPosture.gate === 'ok', `mixed history must not freeze green day (gate=${mixedPosture.gate})`);

const deliveryPosture = RecoveryEngine.recoveryPosture({
  checkinComplete: true,
  checkin: { readinessColor: 'green' },
  recentSessions: heavySessions,
  allSessions: heavySessions,
  endDate: new Date(now).toISOString().slice(0, 10),
});
must(deliveryPosture.gate === 'caution', 'elevated delivery downgrades green day');
must(deliveryPosture.reasonCodes.includes('delivery_load_elevated'), 'delivery reason');

const illnessPosture = RecoveryEngine.recoveryPosture({
  checkinComplete: true,
  checkin: { readinessColor: 'green', illness: 'yes' },
});
must(illnessPosture.reasonCodes.includes('illness_flag_active'), 'illness advisory');
must(illnessPosture.gate === 'ok', 'illness does not block training');

console.log('recovery-engine.smoke: ok', cases.length, 'cases');
