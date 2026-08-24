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

console.log('recovery-engine.smoke: ok', cases.length, 'cases');
