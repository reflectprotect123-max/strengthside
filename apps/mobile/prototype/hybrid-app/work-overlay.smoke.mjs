/**
 * Smoke: work overlay — countdown ring for time-primary holds.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const dir = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(dir, 'index.html'), 'utf8');
const src = readFileSync(join(dir, 'work-overlay.js'), 'utf8');

if (!html.includes('work-overlay.js')) throw new Error('index.html missing work-overlay.js');
if (!html.includes('.rest-ring{')) throw new Error('index.html missing rest ring CSS (reused for work)');

const sandbox = {
  window: {},
  document: { getElementById: () => null },
  console,
  esc: (s) => String(s),
  formatMmSs: (n) => {
    const sec = Math.max(0, Math.floor(+n || 0));
    return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
  },
  setInterval: () => 1,
  clearInterval: () => {},
};
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(src, sandbox);

const htmlOut = sandbox.WorkOverlay.render({
  mode: 'strength',
  remainingSec: 25,
  totalSec: 30,
  label: 'remaining',
});
if (!htmlOut.includes('workOverlay')) throw new Error('work overlay root missing');
if (!htmlOut.includes('workOverlayClock')) throw new Error('clock id missing');
if (!htmlOut.includes('Done early')) throw new Error('done early button missing');
if (!htmlOut.includes('rest-ring')) throw new Error('rest ring missing (reused CSS)');
if (!htmlOut.includes('0:25')) throw new Error('formatted time missing (mockup m:ss)');

let completed = null;
sandbox.WorkOverlay.startWork(30, (sec) => {
  completed = sec;
});
if (!sandbox.WorkOverlay.isRunning()) throw new Error('startWork should mark running');
sandbox.WorkOverlay.finishEarly();
if (completed == null || completed < 1) throw new Error('finishEarly should invoke onComplete with elapsed seconds');

console.log('work-overlay.smoke: ok');
