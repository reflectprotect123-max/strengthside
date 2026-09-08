/**
 * Smoke: Full Body A/B/C are gone. Library follows two Hybrid Power Project days
 * (Monday squat / Wednesday floor press) with painted sets×reps and 30 m carries.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const dir = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(dir, 'index.html'), 'utf8');
const logColumnsSrc = readFileSync(join(dir, 'log-columns.js'), 'utf8');

function must(cond, msg) {
  if (!cond) throw new Error(msg);
}

must(!html.includes("STARTER_STRENGTH_NAMES=['Full Body A','Full Body B','Full Body C']"), 'Full Body names gone from starter list');
must(html.includes("STARTER_STRENGTH_NAMES=['HPP Monday','HPP Wednesday']"), 'HPP two-day starter list');
must(!html.includes('ensureFullBodyAStarter(state)'), 'no Full Body A ensure');
must(!html.includes('ensureFullBodyBStarter(state)'), 'no Full Body B ensure');
must(!html.includes('ensureFullBodyCStarter(state)'), 'no Full Body C ensure');
must(html.includes('ensureHppMondayStarter(state)'), 'HPP Monday ensure');
must(html.includes('ensureHppWednesdayStarter(state)'), 'HPP Wednesday ensure');
must(html.includes("HPP_FOLLOW_VERSION='hpp-follow-v1'"), 'follow-program migrate');

function parseSeed(src) {
  const start = src.indexOf('const seed=');
  let i = src.indexOf('=', start) + 1;
  while (src[i] === ' ') i += 1;
  let depth = 0,
    inStr = false,
    esc = false,
    quote = '';
  for (let j = i; j < src.length; j++) {
    const c = src[j];
    if (inStr) {
      if (esc) {
        esc = false;
        continue;
      }
      if (c === '\\') {
        esc = true;
        continue;
      }
      if (c === quote) inStr = false;
      continue;
    }
    if (c === '"' || c === "'") {
      inStr = true;
      quote = c;
      continue;
    }
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return JSON.parse(src.slice(i, j + 1));
    }
  }
  return null;
}

const seed = parseSeed(html);
must(seed, 'seed parse');
must(!(seed.templates || []).some((t) => /^Full Body [ABC]$/.test(t && t.name)), 'seed has no Full Body A/B/C');

function strengthExercises(t) {
  return ((t.blocks || []).find((b) => b && b.type === 'strength') || {}).exercises || [];
}

function assertDay(t, name, expected) {
  must(t, `${name} in seed`);
  const exs = strengthExercises(t);
  must(exs.length === expected.length, `${name} lift count ${exs.length}`);
  expected.forEach((want, i) => {
    const ex = exs[i];
    must(ex && ex.name === want.name, `${name}[${i}] name ${ex && ex.name}`);
    must(Number(ex.sets) === want.sets, `${name} ${want.name} sets`);
    if (want.reps != null) must(String(ex.reps) === String(want.reps), `${name} ${want.name} reps ${ex.reps}`);
    must(!!ex.supersetWithNext === !!want.ss, `${name} ${want.name} superset`);
    if (want.metres) {
      const d = (ex.logColumns || []).find((c) => c.kind === 'distance_m');
      must(d && String(d.value || (d.values && d.values[0]) || '') === '30', `${name} ${want.name} 30 m`);
    }
  });
  const breath = (t.blocks || []).find((b) => b && b.type === 'text' && /recovery breathing/i.test(b.heading || ''));
  must(breath, `${name} Recovery Breathing`);
  must(/10 Nasal Breaths/i.test(breath.notes || ''), `${name} nasal breaths`);
  must(/5 second inhale/i.test(breath.notes || ''), `${name} inhale`);
  must(/1-second hold/i.test(breath.notes || ''), `${name} hold`);
  must(/5 second exhale/i.test(breath.notes || ''), `${name} exhale`);
}

assertDay(seed.templates.find((t) => t.name === 'HPP Monday'), 'HPP Monday', [
  { name: 'Front Squat', sets: 5, reps: '5' },
  { name: 'Glute Ham Raise', sets: 4, reps: '8' },
  { name: 'Weighted Bar Dips', sets: 3, reps: '10', ss: true },
  { name: 'Weighted Chin-Ups', sets: 3, reps: '10' },
  { name: 'Farmer Carry', sets: 5, metres: true, ss: true },
  { name: 'Backwards Sled Drag', sets: 5, metres: true },
]);

assertDay(seed.templates.find((t) => t.name === 'HPP Wednesday'), 'HPP Wednesday', [
  { name: 'Football Bar Floor Press', sets: 5, reps: '5' },
  { name: '1-Arm DB Row', sets: 4, reps: '8' },
  { name: 'DB Split Squat', sets: 3, reps: '10', ss: true },
  { name: 'DB Hammer Curls', sets: 3, reps: '10' },
  { name: 'Barbell Glute Hip Thrust', sets: 3, reps: '15', ss: true },
  { name: 'Banded Pushdowns', sets: 3, reps: 'MAX' },
]);

const chunk = html.slice(
  html.indexOf('const PROGRAM_TEXT_DEFAULTS'),
  html.indexOf('function applyAthleteShellPatch'),
);
const sandbox = {
  console,
  seed,
  clone: (x) => JSON.parse(JSON.stringify(x)),
  id: () => 'id' + Math.random().toString(36).slice(2, 8),
  num: (v) => +v || 0,
  isoNow: () => new Date().toISOString(),
  window: {},
  StrengthAdapter: { repProgressionLift: () => false },
  S: {},
  touchRecord: (r) => r,
  dedupe: (l) => l || [],
  registerExercise: () => {},
  COND_FORMATS: [{ key: 'steady', name: 'Steady', type: 'easy' }],
  COND_EFFORTS: [{ key: 'easy', name: 'Easy' }],
  COND_MODALITIES: ['Bike'],
  condFormatMeta: () => ({ key: 'steady', type: 'easy' }),
  isConditioningTemplate: () => false,
  isSupersetBlock: () => false,
};
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(logColumnsSrc, sandbox);
try {
  vm.runInContext(readFileSync(join(dir, 'exercise-load-profiles.js'), 'utf8'), sandbox);
} catch {
  /* optional */
}
vm.runInContext(chunk, sandbox);

const out = sandbox.ensureStarterTemplates({
  meta: {},
  templates: [
    { id: 'old-a', name: 'Full Body A', source: 'THE-starter', blocks: [] },
    { id: 'old-b', name: 'Full Body B', source: 'THE-starter', blocks: [] },
    { id: 'old-c', name: 'Full Body C', source: 'THE-starter', blocks: [] },
  ],
  exercises: [],
  hiddenTemplateIds: [],
  sessions: [],
});
if (typeof sandbox.applyHppFollowPatch === 'function') {
  sandbox.applyHppFollowPatch(out);
  sandbox.ensureStarterTemplates(out);
}

must(!(out.templates || []).some((t) => /^Full Body [ABC]$/.test(t.name)), 'boot drops Full Body A/B/C');
must((out.templates || []).some((t) => t.name === 'HPP Monday'), 'boots HPP Monday');
must((out.templates || []).some((t) => t.name === 'HPP Wednesday'), 'boots HPP Wednesday');

const mon = out.templates.find((t) => t.name === 'HPP Monday');
const carry = strengthExercises(mon).find((e) => e.name === 'Farmer Carry');
must(carry && Number(carry.sets) === 5, 'farmer 5 sets');
const metres = (carry.logColumns || []).find((c) => c.kind === 'distance_m');
must(metres && String(metres.value || metres.values[0] || '') === '30', 'farmer 30 m not 100 ft');

console.log('fullbody-bc-starters.smoke: ok');
