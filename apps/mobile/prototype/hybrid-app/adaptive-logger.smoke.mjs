import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const html = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'index.html'), 'utf8');
function must(c, m) { if (!c) throw new Error(m); }
must(html.includes('src="./adaptive-bundle.js"'), 'loads adaptive-bundle.js');
must(html.includes('HybridAdaptive.decideNextLift'), 'Log calls decideNextLift');
must(html.includes("if(isHoldRow(r)){startHoldCountdown"), 'holds still start countdown, not Next');
must(!html.includes('HybridAdaptive.decideNextCond') || html.includes('function advanceInterval'), 'cond Next is not on the lift Log path');
must(html.includes('HybridAdaptive.closeLift'), 'Finish calls closeLift');
must(html.includes('HybridAdaptive.openLift'), 'session start calls openLift');
must(html.includes('adaptiveClose') || html.includes('lastClose'), 'stores Close locally');
must(html.includes('HybridAdaptive.decideNextCond'), 'cond Next');
must(html.includes('actualRpe'), 'passes actual RPE');
must(html.includes('modality'), 'watts vs split');
const ss = html.slice(html.indexOf('function toggleSupersetDone'), html.indexOf('function toggleSupersetDone') + 500);
must(ss.includes('clearNextLiftFill'), 'superset un-log clears Next fill');
must(ss.includes('decideNextLift'), 'superset edit Log fills Next');
must(html.includes('HybridAdaptive.closeCond'), 'Finish calls closeCond');
must(html.includes('HybridAdaptive.openCond'), 'session start calls openCond');
must(html.includes('adaptiveCondClose'), 'stores cond Close locally');
console.log('adaptive-logger.smoke: ok');
