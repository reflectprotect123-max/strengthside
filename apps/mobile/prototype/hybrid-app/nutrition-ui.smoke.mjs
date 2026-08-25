/**
 * Smoke: nutrition log persistence via @hybrid/nutrition-core (no DOM).
 * Mirrors NutritionUI.saveQuickAdd — proves entries round-trip through sanitize.
 * Phase 2: day-status hooks + dayStatus → weeklyCheckIn countable gate.
 * Run: node apps/mobile/prototype/hybrid-app/nutrition-ui.smoke.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const dir = dirname(fileURLToPath(import.meta.url));
const bundle = readFileSync(join(dir, 'nutrition-bundle.js'), 'utf8');

const sandbox = { console, setTimeout, clearTimeout, localStorage: new Map() };
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
sandbox.localStorage.getItem = (k) => (sandbox.localStorage.has(k) ? sandbox.localStorage.get(k) : null);
sandbox.localStorage.setItem = (k, v) => {
  sandbox.localStorage.set(k, v);
};
sandbox.localStorage.removeItem = (k) => {
  sandbox.localStorage.delete(k);
};
vm.createContext(sandbox);
vm.runInContext(bundle, sandbox);

const C = sandbox.HybridNutrition.Core;
const E = sandbox.HybridNutrition.Engine;
const KEY = 'hybrid-nutrition-v1';
const date = '2026-08-24';

function loadN() {
  const raw = sandbox.localStorage.getItem(KEY);
  if (!raw) return C.emptyNutritionDB();
  return C.sanitizeNutritionDB(JSON.parse(raw));
}

function saveN(db) {
  sandbox.localStorage.setItem(KEY, JSON.stringify(db));
}

function saveQuickAdd(db, fields) {
  const entry = C.quickAddEntry(
    { id: 'e1', logDate: date, meal: fields.meal, at: `${date}T12:00:00.000Z` },
    fields,
  );
  db.logEntries.push(entry);
  saveN(db);
  return entry;
}

let db = loadN();
saveQuickAdd(db, {
  displayName: 'Test oats',
  meal: 'breakfast',
  calories: 124,
  proteinG: 3.2,
  carbsG: 15.6,
  fatG: 2.1,
});

db = loadN();
const entries = C.entriesForDay(db, date);
if (entries.length !== 1) throw new Error(`expected 1 entry, got ${entries.length}`);
if (entries[0].displayName !== 'Test oats') throw new Error('name');
if (Math.round(entries[0].calories) !== 124) throw new Error('calories');

const totals = C.macroTotals(entries);
if (Math.round(totals.calories) !== 124) throw new Error('totals calories');
if (Math.abs(totals.carbsG - 15.6) > 0.01) throw new Error('totals carbs');

const ui = readFileSync(join(dir, 'nutrition-ui.js'), 'utf8');
if (!ui.includes('nut-day-summary')) throw new Error('day summary class missing');
if (!ui.includes('nut-kcal-hero')) throw new Error('kcal hero class missing');
if (!ui.includes('nut-home-summary')) throw new Error('home summary class missing');
if (!ui.includes('nut-sheet')) throw new Error('nut-sheet class missing');
if (!ui.includes('openWeeklyReview')) throw new Error('weekly review hook missing');
if (!ui.includes('checkInUiState')) throw new Error('check-in state missing');
if (!ui.includes('nut-checkin-banner')) throw new Error('check-in banner class missing');
if (!ui.includes('nut-day-status')) throw new Error('day status markup hook missing');
if (!ui.includes('setDayStatus')) throw new Error('setDayStatus setter missing');
if (!ui.includes('buildDailyRecords')) throw new Error('buildDailyRecords missing');

// Load NutritionUI with minimal host stubs so we can call the real builder.
sandbox.$ = () => null;
sandbox.esc = (s) => String(s ?? '');
sandbox.today = () => date;
sandbox.id = () => 'id1';
sandbox.sheet = () => {};
sandbox.closeSheet = () => {};
sandbox.go = () => {};
sandbox.shell = () => {};
sandbox.nav = () => {};
sandbox.clock = () => {};
sandbox.alert = () => {};
vm.runInContext(ui, sandbox);
const NutritionUI = sandbox.NutritionUI || sandbox.window.NutritionUI;
if (!NutritionUI || typeof NutritionUI.buildDailyRecords !== 'function') {
  throw new Error('NutritionUI.buildDailyRecords not exported');
}

// N3: real buildDailyRecords → nutritionIsCountable (not a duplicated mapper).
if (!E || !E.nutritionIsCountable) throw new Error('Engine.nutritionIsCountable missing');

const fixtureDb = C.emptyNutritionDB();
fixtureDb.dayStatus = [
  { userId: '', logDate: '2026-08-18', status: 'fasted', note: null, updatedAt: `${date}T00:00:00.000Z` },
  { userId: '', logDate: '2026-08-19', status: 'partial', note: null, updatedAt: `${date}T00:00:00.000Z` },
  { userId: '', logDate: '2026-08-20', status: 'complete', note: null, updatedAt: `${date}T00:00:00.000Z` },
];
fixtureDb.logEntries.push(
  C.quickAddEntry(
    { id: 'e-partial', logDate: '2026-08-19', meal: 'lunch', at: '2026-08-19T12:00:00.000Z' },
    { displayName: 'Partial meal', calories: 400, proteinG: 20, carbsG: 40, fatG: 10 },
  ),
  C.quickAddEntry(
    { id: 'e-complete', logDate: '2026-08-20', meal: 'dinner', at: '2026-08-20T18:00:00.000Z' },
    { displayName: 'Complete meal', calories: 600, proteinG: 40, carbsG: 50, fatG: 20 },
  ),
);

const records = NutritionUI.buildDailyRecords(fixtureDb, '2026-08-20', 7);
const byDay = Object.fromEntries(records.map((r) => [r.day, r]));
if (byDay['2026-08-18']?.nutritionStatus !== 'fasted') throw new Error('fasted status not mapped');
if (byDay['2026-08-18']?.calories !== 0) throw new Error('fasted calories should be 0');
if (!E.nutritionIsCountable(byDay['2026-08-18'])) throw new Error('fasted@0 must be countable');
if (byDay['2026-08-19']?.nutritionStatus !== 'partial') throw new Error('partial status not mapped');
if (E.nutritionIsCountable(byDay['2026-08-19'])) throw new Error('partial must not be countable');
if (byDay['2026-08-20']?.nutritionStatus !== 'complete') throw new Error('complete status not mapped');
if (!E.nutritionIsCountable(byDay['2026-08-20'])) throw new Error('complete day must be countable');

console.log('nutrition-ui.smoke: ok');
