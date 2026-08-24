import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const dir = dirname(fileURLToPath(import.meta.url));
const bundle = readFileSync(join(dir, 'strength-bundle.js'), 'utf8');

const sandbox = { window: {}, console };
vm.createContext(sandbox);
vm.runInContext(`${bundle}; window.HybridStrength = HybridStrength;`, sandbox);

const { Volume } = sandbox.window.HybridStrength;
if (!Volume?.computeVolumeBudget) {
  throw new Error('HybridStrength.Volume.computeVolumeBudget missing from bundle');
}

const budget = Volume.computeVolumeBudget({
  sessionsPerWeek: 3,
  minutesPerSession: 60,
  splitType: 'full_body',
});

if (budget.sessionWorkingSetCap !== 12) {
  throw new Error(`Expected session cap 12, got ${budget.sessionWorkingSetCap}`);
}
if (budget.perMuscleWeeklyCap.emphasize > 12) {
  throw new Error(`Emphasize cap too high for 3×60 full body: ${budget.perMuscleWeeklyCap.emphasize}`);
}

const audit = Volume.auditSessionWorkingSets(15, budget);
if (!audit.overSessionCap) {
  throw new Error('Expected over-session audit for 15 sets');
}

console.log('strength-volume.smoke: ok', {
  sessionCap: budget.sessionWorkingSetCap,
  emphasize: budget.perMuscleWeeklyCap.emphasize,
});
