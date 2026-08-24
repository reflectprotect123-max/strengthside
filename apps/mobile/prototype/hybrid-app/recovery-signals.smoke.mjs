/**
 * Smoke: recovery gate mapping (via recovery-engine delegation).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const dir = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(dir, 'recovery-engine.js'), 'utf8') + readFileSync(join(dir, 'recovery-signals.js'), 'utf8');

const sandbox = { window: {}, console };
vm.createContext(sandbox);
vm.runInContext(src, sandbox);

const { RecoverySignals } = sandbox.window;
if (!RecoverySignals?.recoverySignal) throw new Error('RecoverySignals.recoverySignal missing');

const noCheckin = RecoverySignals.recoverySignal({ checkinComplete: false });
if (noCheckin.gate !== 'hold') throw new Error('Missing check-in must hold bumps');

const yellowSubj = RecoverySignals.recoverySignal({
  checkinComplete: true,
  checkin: { readinessColor: 'yellow' },
  whoopRecovery: 80,
});
if (yellowSubj.gate !== 'caution') throw new Error('Subjective yellow must block bumps');

console.log('recovery-signals.smoke: ok');
