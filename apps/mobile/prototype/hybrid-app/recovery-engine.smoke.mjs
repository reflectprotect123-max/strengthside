/**
 * Smoke: recovery-engine posture + recovery-signals delegation.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const dir = dirname(fileURLToPath(import.meta.url));
const engine = readFileSync(join(dir, 'recovery-engine.js'), 'utf8');
const signals = readFileSync(join(dir, 'recovery-signals.js'), 'utf8');

const sandbox = { window: {}, console };
vm.createContext(sandbox);
vm.runInContext(engine + '\n' + signals, sandbox);

const { RecoveryEngine, RecoverySignals } = sandbox.window;

const p = RecoveryEngine.recoveryPosture({ checkinComplete: false });
if (p.band !== 'insufficient_data' || p.gate !== 'hold') throw new Error('no check-in posture');

const sig = RecoverySignals.recoverySignal({ checkinComplete: true, checkin: { readinessColor: 'yellow' }, whoopRecovery: 80 });
if (sig.gate !== 'caution') throw new Error('signals must delegate yellow to caution');

console.log('recovery-engine.smoke: ok');
