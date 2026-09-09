/**
 * Smoke: timed holds start WorkOverlay from the one-set logger.
 * No engine Next — card seconds stay card seconds.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(dir, 'index.html'), 'utf8');
const logger = readFileSync(join(dir, 'strength-one-set-logger.js'), 'utf8');

function must(cond, msg) {
  if (!cond) throw new Error(msg);
}

must(html.includes('src="./work-overlay.js"'), 'work-overlay script');
must(html.includes('src="./strength-one-set-logger.js"'), 'one-set logger script');
must(html.includes('function strengthTask(t){return StrengthOneSetLogger.renderTask(t)}'), 'strengthTask is one-set logger');
must(logger.includes('function startHold()'), 'StrengthOneSetLogger.startHold');
must(logger.includes('isTimePrimaryHold'), 'time-primary hold flow');
must(logger.includes('StrengthOneSetLogger.startHold()'), 'Start hold button');
must(logger.includes('WorkOverlay.startWork'), 'startWork uses prescribed seconds');
must(logger.includes("mode: 'strength'") || logger.includes('mode:"strength"') || logger.includes("mode:'strength'"), 'work overlay strength mode');
must(!html.includes('decideNextSet'), 'hold path must not call decideNextSet');
must(!logger.includes('decideNextSet'), 'one-set hold path must not call decideNextSet');

console.log('hold-countdown.smoke: ok');
