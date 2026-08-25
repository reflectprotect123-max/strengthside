/**
 * Smoke: training load headline split + sessionLoadFromRows (tonnageKg, not /50).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const dir = dirname(fileURLToPath(import.meta.url));

const bundle = readFileSync(join(dir, 'strength-bundle.js'), 'utf8');
const adapter = readFileSync(join(dir, 'strength-adapter.js'), 'utf8');
const adapterSandbox = { window: {}, console };
vm.createContext(adapterSandbox);
vm.runInContext(`${bundle}\nwindow.HybridStrength = HybridStrength;\n${adapter}`, adapterSandbox);
const { StrengthAdapter } = adapterSandbox.window;
const sampleRows = [{ done: true, weight: 100, reps: 5, targetKind: 'reps' }];
const sessionLoad = StrengthAdapter.sessionLoadFromRows(sampleRows);
if (sessionLoad !== 500) throw new Error(`sessionLoadFromRows expected 500, got ${sessionLoad}`);
if (sessionLoad === 10) throw new Error('sessionLoadFromRows still using tonnage/50 stub');

const noBundleSandbox = { window: {}, console };
vm.createContext(noBundleSandbox);
vm.runInContext(adapter, noBundleSandbox);
const bodyweightRows = [{ done: true, weight: '', reps: 10, targetKind: 'reps' }];
const bodyweightLoad = noBundleSandbox.window.StrengthAdapter.sessionLoadFromRows(bodyweightRows);
if (bodyweightLoad !== 0) {
  throw new Error(`bodyweight fallback expected 0 (engine tonnageKg), got ${bodyweightLoad}`);
}
if (bodyweightLoad === 10 / 50) throw new Error('bodyweight fallback still using workReps/50 stub');

const src = readFileSync(join(dir, 'load-headline.js'), 'utf8');

const sandbox = { window: {}, console };
vm.createContext(sandbox);
vm.runInContext(src, sandbox);

const { LoadHeadline } = sandbox.window;
const now = Date.now();
const sessions = [
  { status: 'completed', completedAt: now - 86400000, summary: { strengthLoad: 4, conditioningLoad: 2, totalLoad: 6 } },
  { status: 'completed', completedAt: now - 172800000, summary: { strengthLoad: 3, conditioningLoad: 5, totalLoad: 8 } },
];

const r = LoadHeadline.computeLoadHeadline(sessions, { days: 7, now });
if (r.headline == null) throw new Error('expected headline with sessions');
if (r.strengthDisplay == null || r.conditioningDisplay == null) throw new Error('missing split');

const damp = LoadHeadline.computeLoadHeadline(sessions, { days: 7, now, recoveryGate: 'caution' });
if (!damp.reasonCodes.includes('recovery_dampened')) throw new Error('recovery dampener reason missing');
if (!damp.recoveryDampened) throw new Error('recoveryDampened flag missing');
const dampHtml = LoadHeadline.loadHeadlineHtml(damp);
if (!dampHtml.includes('autopilot stays conservative')) throw new Error('dampener copy missing from html');
const okHtml = LoadHeadline.loadHeadlineHtml(r);
if (okHtml.includes('autopilot stays conservative')) throw new Error('ok gate should not dampen copy');

console.log('load-headline.smoke: ok', r);
