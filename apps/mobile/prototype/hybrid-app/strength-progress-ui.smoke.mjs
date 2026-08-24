/**
 * Smoke: strength progress UI wiring + progressSummary.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

function must(cond, msg) {
  if (!cond) throw new Error(msg);
}

const dir = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(dir, 'index.html'), 'utf8');
const bundle = readFileSync(join(dir, 'strength-bundle.js'), 'utf8');
const adapter = readFileSync(join(dir, 'strength-adapter.js'), 'utf8');
const recovery = readFileSync(join(dir, 'recovery-engine.js'), 'utf8') + readFileSync(join(dir, 'recovery-signals.js'), 'utf8');

must(html.includes('openStrengthProgress'), 'index must expose Progress screen');
must(html.includes('strengthProgressHtml'), 'index must render progress summary');
must(adapter.includes('progressSummary'), 'adapter must export progressSummary');

const sandbox = { window: {}, console };
vm.createContext(sandbox);
vm.runInContext(`${bundle}; window.HybridStrength = HybridStrength; ${recovery}; ${adapter}`, sandbox);

const { StrengthAdapter } = sandbox.window;
const state = {
  meta: { progressionAudit: [] },
  exercises: [{ id: 'bp', name: 'Bench' }],
  strengthState: { workingMaxEvents: [], prEvents: [], loadHints: {} },
  sessions: [],
};
const summary = sandbox.window.StrengthAdapter.progressSummary(state);
must(summary.ok === true, 'progressSummary should ok');
must(Array.isArray(summary.prs), 'prs array');

console.log('strength-progress-ui.smoke: ok');
