/**
 * Smoke: nutrition log persistence via @hybrid/nutrition-core (no DOM).
 * Mirrors NutritionUI.saveQuickAdd — proves entries round-trip through sanitize.
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

console.log('nutrition-ui.smoke: ok');
