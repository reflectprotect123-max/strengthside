/**
 * Smoke: rest overlay module (Phase 0 logger changeover).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const dir = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(dir, 'index.html'), 'utf8');
const src = readFileSync(join(dir, 'rest-overlay.js'), 'utf8');

if (!html.includes('rest-overlay.js')) throw new Error('index.html missing rest-overlay.js');
if (!html.includes('.rest-overlay{')) throw new Error('index.html missing rest-overlay CSS');
if (!html.includes('.rest-ring-progress')) throw new Error('index.html missing rest ring CSS');

const sandbox = {
  window: {},
  document: {
    getElementById: () => null,
  },
  console,
  esc: (s) => String(s),
  fmt: (n) => String(n) + 's',
  setInterval: () => 1,
  clearInterval: () => {},
};
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(src, sandbox);

const hidden = sandbox.RestOverlay.render({
  mode: 'strength',
  visible: false,
  remainingSec: 84,
  totalSec: 90,
  summaryHtml: 'Set 2 logged · 100 kg × 5',
  upNextHtml: '<b>Up next: Set 3 / 4</b><span>100 kg × 5 · RIR 2</span>',
});
if (!hidden.includes('hidden')) throw new Error('overlay should be hidden by default');
if (!hidden.includes('restOverlayClock')) throw new Error('clock id missing');
if (!hidden.includes('Skip rest')) throw new Error('skip button missing');
if (!hidden.includes('rest-up-next')) throw new Error('up-next block missing');
if (!hidden.includes('rest-ring-progress')) throw new Error('ring svg missing');

const visible = sandbox.RestOverlay.render({
  mode: 'engine',
  visible: true,
  remainingSec: 161,
  phaseLabel: 'REST',
});
if (visible.includes(' hidden')) throw new Error('visible overlay should not have hidden class');
if (!visible.includes('dial-engine')) throw new Error('engine dial missing');

console.log('rest-overlay.smoke: ok');
