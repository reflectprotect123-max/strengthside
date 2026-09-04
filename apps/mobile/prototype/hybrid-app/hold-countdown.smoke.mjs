/**
 * Smoke: timed holds start WorkOverlay countdown from the strength logger.
 * No engine Next — card seconds stay card seconds.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(dir, 'index.html'), 'utf8');

function must(cond, msg) {
  if (!cond) throw new Error(msg);
}

must(html.includes('src="./work-overlay.js"'), 'work-overlay script');
must(html.includes('function startHoldCountdown'), 'startHoldCountdown');
must(html.includes('function finishHoldCountdown'), 'finishHoldCountdown');
must(html.includes('function cancelHoldCountdown'), 'cancelHoldCountdown');
must(html.includes('function stopHoldClock'), 'stopHoldClock');
must(html.includes('if(isHoldRow(r)){startHoldCountdown(i);return}'), 'toggleSet starts hold, does not mark done first');
must(html.includes("isHoldRow(r)?'Hold':'Log'"), 'Hold button on seconds rows');
must(html.includes('WorkOverlay.startWork(holdSeconds(r),finishHoldCountdown)'), 'startWork uses prescribed seconds');
must(html.includes("WorkOverlay.render({mode:'strength'"), 'strengthTask renders work overlay');
must(html.includes("label:'Hold'"), 'overlay label Hold');
must(html.includes("skipOnclick:'cancelHoldCountdown()'"), 'Cancel does not log');
must(!html.includes('decideNextSet'), 'hold path must not call decideNextSet');
must(html.includes('stopHoldClock()'), 'leave-task stops the clock');

console.log('hold-countdown.smoke: ok');
