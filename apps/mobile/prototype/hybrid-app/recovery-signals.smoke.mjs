/**
 * Smoke: recovery gate mapping for silent progression.
 * Run: node apps/mobile/prototype/hybrid-app/recovery-signals.smoke.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const dir = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(dir, 'recovery-signals.js'), 'utf8');

const sandbox = { window: {}, console };
vm.createContext(sandbox);
vm.runInContext(src, sandbox);

const { RecoverySignals } = sandbox.window;
if (!RecoverySignals?.recoverySignal) throw new Error('RecoverySignals.recoverySignal missing');

const noCheckin = RecoverySignals.recoverySignal({ checkinComplete: false });
if (noCheckin.gate !== 'hold' || !noCheckin.reasonCodes.includes('no_checkin_today')) {
  throw new Error('Missing check-in must hold bumps');
}

const greenOnly = RecoverySignals.recoverySignal({
  checkinComplete: true,
  checkin: { readinessColor: 'green' },
});
if (greenOnly.gate !== 'ok') throw new Error('Green check-in alone should be ok');

const greenWhoopLow = RecoverySignals.recoverySignal({
  checkinComplete: true,
  checkin: { readinessColor: 'green', whoopRecovery: 20 },
});
if (greenWhoopLow.gate !== 'hold') {
  throw new Error('WHOOP low must worst-of against green subjective');
}

const yellowSubj = RecoverySignals.recoverySignal({
  checkinComplete: true,
  checkin: { readinessColor: 'yellow' },
  whoopRecovery: 80,
});
if (yellowSubj.gate !== 'caution') {
  throw new Error('Subjective yellow must block bumps even with high WHOOP');
}

if (!RecoverySignals.blocksProgressionBumps(yellowSubj)) {
  throw new Error('Caution must block progression bumps');
}

console.log('recovery-signals.smoke: ok');
