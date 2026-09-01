/**
 * Smoke: rest overlay — in-flow mockup ring.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const dir = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(dir, 'index.html'), 'utf8');
const src = readFileSync(join(dir, 'rest-overlay.js'), 'utf8');

if (!html.includes('rest-overlay.js')) throw new Error('index.html missing rest-overlay.js');
if (!html.includes('.logger-rest{')) throw new Error('index.html missing logger-rest CSS');
if (!html.includes('.rest-ring{')) throw new Error('index.html missing rest ring CSS');
if (!html.includes('.rest-time{')) throw new Error('index.html missing rest-time CSS');

const sandbox = {
  window: {},
  document: { getElementById: () => null },
  console,
  esc: (s) => String(s),
  fmt: (n) => {
    const sec = Math.max(0, Math.round(+n || 0));
    return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
  },
  setInterval: () => 1,
  clearInterval: () => {},
};
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(src, sandbox);

const htmlOut = sandbox.RestOverlay.render({
  mode: 'strength',
  remainingSec: 84,
  upNextHtml: '<b>100 kg × 5 · RIR 2</b>',
});
if (!htmlOut.includes('logger-rest')) throw new Error('logger-rest missing');
if (!htmlOut.includes('restOverlayClock')) throw new Error('clock id missing');
if (!htmlOut.includes('Skip rest')) throw new Error('skip button missing');
if (!htmlOut.includes('rest-ring')) throw new Error('rest ring missing');
if (!htmlOut.includes('rest-time')) throw new Error('rest-time missing');
if (!htmlOut.includes('01:24')) throw new Error('formatted time missing');

const engine = sandbox.RestOverlay.render({
  mode: 'engine',
  remainingSec: 161,
  skipLabel: 'Next interval',
});
if (!engine.includes('dial-engine')) throw new Error('engine dial missing');
if (!engine.includes('Next interval')) throw new Error('engine skip label missing');

console.log('rest-overlay.smoke: ok');
