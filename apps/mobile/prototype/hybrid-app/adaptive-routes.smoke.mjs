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
must(!html.includes('HybridAdaptive.decideNextLift'), 'lift Next must be absent from HTML');
must(!html.includes('HybridAdaptive.openLift'), 'lift Open must be absent from HTML');
must(!html.includes('HybridAdaptive.closeLift'), 'lift Close must be absent from HTML');
must(!overlay.includes('HybridAdaptive'), 'WorkOverlay never calls the package');
const adv = slice('advanceInterval');
must(adv.includes('decideNextCond'), 'advanceInterval is the cond Next door');
must(!adv.includes('decideNextLift'), 'advanceInterval must not call lift Next');
must(!adv.includes('rir'), 'advanceInterval must not see RIR');
must(html.includes('persistCloseForCond') && html.includes('HybridAdaptive.closeCond'), 'Finish persists cond Close');
must(html.includes('HybridAdaptive.openCond'), 'session Open calls openCond');
console.log('adaptive-routes.smoke: ok');
