import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

function athMonthGridCells(monthKey) {
  const parts = String(monthKey).split('-').map(Number);
  let y = parts[0];
  let m = parts[1];
  const pad = (n) => String(n).padStart(2, '0');
  const first = new Date(y, m - 1, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const last = new Date(y, m, 0).getDate();
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= last; d++) cells.push(`${y}-${pad(m)}-${pad(d)}`);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
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

const sepCells = athMonthGridCells('2026-09-01');
must(sepCells.length === 35, 'September 2026 month grid length');
must(sepCells[1] === '2026-09-01', 'Sep 1 lands on Tuesday column');

must(html.includes('ath-cal-grid'), 'month grid markup');
must(html.includes('shiftCalMonth'), 'month navigation');
must(html.includes('x.date=today()'), 'finishSession pins completion date');

console.log('athlete-calendar-date.smoke: ok');
