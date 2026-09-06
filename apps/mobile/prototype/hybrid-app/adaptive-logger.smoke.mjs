import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const html = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'index.html'), 'utf8');
function must(c, m) { if (!c) throw new Error(m); }
must(html.includes('src="./adaptive-bundle.js"'), 'loads adaptive-bundle.js');
must(!html.includes('HybridAdaptive.decideNextLift'), 'lift Next must be absent');
must(!html.includes('HybridAdaptive.closeLift'), 'lift Close must be absent');
must(!html.includes('HybridAdaptive.openLift'), 'lift Open must be absent');
must(html.includes('HybridAdaptive.decideNextCond'), 'cond Next');
must(html.includes('actualRpe'), 'passes actual RPE');
must(html.includes('modality'), 'watts vs split');
must(html.includes('HybridAdaptive.closeCond'), 'Finish calls closeCond');
must(html.includes('HybridAdaptive.openCond'), 'session start calls openCond');
must(html.includes('adaptiveCondClose'), 'stores cond Close locally');
console.log('adaptive-logger.smoke: ok');
