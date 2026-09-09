/**
 * Calendar is a one-week strip (Mon–Sun) with horizontal scroll to adjacent weeks.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const dir = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(dir, 'index.html'), 'utf8');

function must(cond, msg) {
  if (!cond) throw new Error(msg);
}

must(html.includes('function weekStartKey'), 'weekStartKey helper');
must(html.includes('function weekDayKeys'), 'weekDayKeys helper');
must(html.includes('function shiftCalWeek'), 'shiftCalWeek navigation');
must(html.includes('function calendar()'), 'calendar renderer');
must(html.includes('ath-cal-weeks'), 'horizontal weeks scroller');
must(html.includes('scroll-snap'), 'scroll-snap CSS for week paging');
must(!/shiftCalMonth\(/.test(html.match(/function calendar\(\)\{[\s\S]*?\nfunction /)?.[0] || ''), 'calendar() no longer uses month Prev/Next');
must(html.includes('jumpToday()'), 'Today jump kept');

// Extract + run week helpers in a sandbox
const helpers = [];
for (const name of ['weekStartKey', 'weekDayKeys', 'addDaysKey']) {
  const start = html.indexOf(`function ${name}`);
  must(start >= 0, `missing ${name}`);
  const end = html.indexOf('\nfunction ', start + 1);
  helpers.push(html.slice(start, end));
}

const sandbox = {
  today: () => '2026-09-05',
  localDate: (d = new Date()) => {
    const tz = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tz).toISOString().slice(0, 10);
  },
};
vm.createContext(sandbox);
vm.runInContext(helpers.join('\n'), sandbox);

const start = sandbox.weekStartKey('2026-09-05');
must(start === '2026-08-31', `week of Sat 5 Sep starts Mon 31 Aug, got ${start}`);

const days = sandbox.weekDayKeys('2026-09-05');
must(Array.isArray(days) && days.length === 7, 'week has 7 days');
must(days[0] === '2026-08-31', 'first day Mon 31 Aug');
must(days[6] === '2026-09-06', 'last day Sun 6 Sep');

const next = sandbox.weekDayKeys(sandbox.addDaysKey(start, 7));
must(next[0] === '2026-09-07', 'next week starts Mon 7 Sep');
must(next[6] === '2026-09-13', 'next week ends Sun 13 Sep');

const calFn = html.slice(html.indexOf('function calendar()'), html.indexOf('\nfunction ', html.indexOf('function calendar()') + 1));
must(calFn.includes('ath-cal-weeks'), 'calendar renders weeks scroller');
must(calFn.includes('weekDayKeys') || calFn.includes('weekStartKey'), 'calendar uses week helpers');
must(!calFn.includes('athMonthGridCells') && !calFn.includes('ath-cal-month'), 'calendar no longer renders full month grid');

console.log('calendar-week-scroll.smoke: ok');
