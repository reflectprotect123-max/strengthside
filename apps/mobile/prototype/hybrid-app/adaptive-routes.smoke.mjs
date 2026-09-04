import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(dir, 'index.html'), 'utf8');
const overlay = readFileSync(join(dir, 'work-overlay.js'), 'utf8');
function slice(name) {
  const i = html.indexOf('function ' + name);
  if (i < 0) throw new Error('missing ' + name);
  return html.slice(i, i + 800);
}
function must(c, m) { if (!c) throw new Error(m); }
const toggle = slice('toggleSet');
must(toggle.includes('decideNextLift'), 'toggleSet is the lift door');
must(!toggle.includes('decideNextCond'), 'toggleSet must not call cond Next');
must(!toggle.includes('actualRpe'), 'toggleSet must not see RPE');
const hold = slice('startHoldCountdown');
must(!hold.includes('HybridAdaptive'), 'hold door never calls the package');
must(!overlay.includes('HybridAdaptive'), 'WorkOverlay never calls the package');
console.log('adaptive-routes.smoke: ok');
