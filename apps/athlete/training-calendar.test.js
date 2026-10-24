import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
require(join(here, 'training-core.js'));
require(join(here, 'strength-targets.js'));
require(join(here, 'session.js'));
require(join(here, 'library.js'));
require(join(here, 'training-calendar.js'));
const Cal = globalThis.TrainingCalendar;
const HS = globalThis.HybridSession;

test('month grid is Monday-start and contains the selected day', () => {
  const weeks = Cal.monthDays('2026-10-24');
  assert.ok(weeks.length >= 5);
  assert.equal(weeks[0].length, 7);
  const monday = new Date(weeks[0][0] + 'T12:00:00');
  assert.equal(monday.getDay(), 1);
  assert.ok(weeks.flat().includes('2026-10-24'));
  assert.ok(weeks.flat().includes('2026-10-01'));
  assert.ok(weeks.flat().includes('2026-10-31'));
});

test('own session plan starts a loggable empty lift when nothing is scheduled', () => {
  const plan = Cal.ownPlan('2026-10-24');
  assert.equal(plan.title, 'Own session');
  assert.equal(plan.blocks[0].kind, 'lift');
  const s = HS.startSession({date: '2026-10-24', plan, letter: 'A'});
  assert.equal(s.phase, 'block');
  assert.equal(s.pages[0].title, 'Open work');
  assert.ok(s.logs[s.pages[0].id].sets.length >= 1);
});

test('picker lists saved library templates plus an empty session', () => {
  const library = globalThis.HybridLibrary.emptyState();
  library.templates = [{id: 'saved', title: 'Travel lift', source: 'library', blocks: []}];
  const items = Cal.pickerItems(library);
  assert.deepEqual(items.map((x) => x.id), ['own', 'saved']);
  assert.equal(items[0].title, 'Empty session');
});
