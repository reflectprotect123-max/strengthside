import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const html = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'index.html'), 'utf8');
function must(c, m) { if (!c) throw new Error(m); }
must(html.includes('src="./adaptive-bundle.js"'), 'loads adaptive-bundle.js');
must(html.includes('HybridAdaptive.decideNextLift'), 'Log calls decideNextLift');
must(html.includes("if(isHoldRow(r)){startHoldCountdown"), 'holds still start countdown, not Next');
must(!html.includes('HybridAdaptive.decideNextCond') || html.includes('function advanceInterval'), 'cond Next is not on the lift Log path');
console.log('adaptive-logger.smoke: ok');
