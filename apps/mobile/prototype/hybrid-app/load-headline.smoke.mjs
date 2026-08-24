/**
 * Smoke: training load headline split.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const dir = dirname(fileURLToPath(import.meta.url));
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
