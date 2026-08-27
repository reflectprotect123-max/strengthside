/**
 * Smoke: recovery-prescription % progressive dosing.
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
const rx = readFileSync(join(dir, 'recovery-prescription.js'), 'utf8');

const sandbox = { window: {}, console };
vm.createContext(sandbox);
vm.runInContext(engine + '\n' + rx, sandbox);

const { RecoveryEngine, RecoveryPrescription } = sandbox.window;

const green = RecoveryEngine.recoveryPosture({
  checkinComplete: true,
  checkin: { readinessColor: 'green', sleepQuality: 8, heatLoad: 1 },
  recentCheckins: [{ heatLoad: 1 }],
});
const rxGreen = RecoveryPrescription.prescribe(30, green);
must(rxGreen.minutes <= 30 && rxGreen.minutes >= 20, `green 30 baseline sane, got ${rxGreen.minutes}`);
must(rxGreen.pct >= 80, `green pct high, got ${rxGreen.pct}`);

const red = RecoveryEngine.recoveryPosture({
  checkinComplete: true,
  checkin: { readinessColor: 'red', sleepQuality: 4, heatLoad: 2 },
});
const rxRed = RecoveryPrescription.prescribe(30, red);
must(rxRed.minutes < 30, `red day shortens dose, got ${rxRed.minutes}`);
must(rxRed.pct < rxGreen.pct, 'red pct below green');

const heavy = [];
const now = Date.now();
for (let i = 0; i < 5; i++) {
  heavy.push({
    status: 'completed',
    completedAt: now - i * 86400000,
    summary: { strengthLoad: 500, conditioningLoad: 3, tonnage: 500, totalLoad: 503 },
  });
}
const heavyPosture = RecoveryEngine.recoveryPosture({
  checkinComplete: true,
  checkin: { readinessColor: 'green', sleepQuality: 8 },
  recentSessions: heavy,
  allSessions: heavy,
  endDate: new Date(now).toISOString().slice(0, 10),
});
const rxHeavy = RecoveryPrescription.prescribe(30, heavyPosture);
must(rxHeavy.minutes <= rxGreen.minutes, 'heavy delivery week trims minutes');

const bonus = RecoveryPrescription.progressBonusFromSessions(
  [
    {
      status: 'completed',
      templateId: 'tpl-recovery',
      completedAt: now - 86400000,
      summary: { recoveryPct: 85 },
    },
    {
      status: 'completed',
      templateId: 'tpl-recovery',
      completedAt: now - 2 * 86400000,
      summary: { recoveryPct: 90 },
    },
  ],
  { endDate: new Date(now).toISOString().slice(0, 10) }
);
must(bonus === 4, `progress bonus 4, got ${bonus}`);

const withBonus = RecoveryPrescription.prescribe(30, red, { progressBonus: bonus });
must(withBonus.pct >= rxRed.pct, 'progress bonus never lowers pct');

must(
  RecoveryPrescription.isRecoverySession({ templateId: 'tpl-recovery' }),
  'tpl-recovery is recovery session'
);
must(
  RecoveryPrescription.isRecoveryTask({ category: 'Recovery', kind: 'conditioning' }),
  'recovery category task'
);
must(
  RecoveryPrescription.copyLine(rxRed, red).includes(String(rxRed.pct)),
  'copy mentions pct'
);

console.log('recovery-prescription.smoke: ok');
