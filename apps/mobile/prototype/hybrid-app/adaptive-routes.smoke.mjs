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
const adv = slice('advanceInterval');
must(adv.includes('decideNextCond'), 'advanceInterval is the cond Next door');
must(!adv.includes('decideNextLift'), 'advanceInterval must not call lift Next');
must(!adv.includes('rir'), 'advanceInterval must not see RIR');
must(html.includes('persistCloseForCond') && html.includes('HybridAdaptive.closeCond'), 'Finish persists cond Close');
must(html.includes('HybridAdaptive.openCond'), 'session Open calls openCond');
must(!hold.includes('openCond'), 'hold must not openCond');
must(!hold.includes('closeCond'), 'hold must not closeCond');
console.log('adaptive-routes.smoke: ok');
