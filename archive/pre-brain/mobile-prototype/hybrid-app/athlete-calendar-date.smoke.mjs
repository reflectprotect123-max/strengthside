import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

function must(cond, msg) {
  if (!cond) throw new Error(msg);
}

const num = (x) => +x || 0;
const localDate = (d = new Date()) => {
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
};

function sessionCalendarDate(x) {
  if (!x) return '';
  if ((x.status === 'completed' || x.status === 'abandoned') && x.completedAt) {
    const d = localDate(new Date(num(x.completedAt)));
    if (d) return d;
  }
  return x.date || '';
}

function calDaySessions(k, sessions) {
  return sessions.filter(
    (x) => sessionCalendarDate(x) === k && !x.coachWithdrawn && !x.ephemeral,
  );
}

const sessions = [
  { id: 'scheduled-wed', date: '2026-09-03', status: 'scheduled' },
  {
    id: 'done-tuesday',
    date: '2026-09-03',
    status: 'completed',
    completedAt: new Date('2026-09-01T18:30:00').getTime(),
  },
  {
    id: 'withdrawn',
    date: '2026-09-01',
    status: 'completed',
    coachWithdrawn: true,
    completedAt: new Date('2026-09-01T12:00:00').getTime(),
  },
];

must(sessionCalendarDate(sessions[0]) === '2026-09-03', 'scheduled uses plan date');
must(sessionCalendarDate(sessions[1]) === '2026-09-01', 'completed uses completion day');

const tuesdayRows = calDaySessions('2026-09-01', sessions);
must(tuesdayRows.length === 1 && tuesdayRows[0].id === 'done-tuesday', 'Tuesday workout visible');

const wedRows = calDaySessions('2026-09-03', sessions);
must(wedRows.length === 1 && wedRows[0].id === 'scheduled-wed', 'Wednesday planned session');

const helpers = [];
for (const name of ['weekStartKey', 'weekDayKeys', 'addDaysKey']) {
  const start = html.indexOf(`function ${name}`);
  must(start >= 0, `missing ${name}`);
  const end = html.indexOf('\nfunction ', start + 1);
  helpers.push(html.slice(start, end));
}
const sandbox = {
  today: () => '2026-09-05',
  localDate,
};
vm.createContext(sandbox);
vm.runInContext(helpers.join('\n'), sandbox);
const week = sandbox.weekDayKeys('2026-09-05');
must(week[0] === '2026-08-31' && week[6] === '2026-09-06', 'week of Sat 5 Sep is Mon–Sun');

must(html.includes('ath-cal-weeks'), 'week scroller markup');
must(html.includes('shiftCalWeek'), 'week navigation');
must(html.includes('x.date=today()'), 'finishSession pins completion date');

console.log('athlete-calendar-date.smoke: ok');
