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

console.log('load-headline.smoke: ok', r);
