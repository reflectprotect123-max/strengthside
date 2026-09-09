/**
 * Smoke: strength days are unseeded. Library starts empty of HPP Monday/Wednesday
 * so the athlete rebuilds them. Aerobic + Recovery starters remain.
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

must(!html.includes("STARTER_STRENGTH_NAMES=['Full Body A','Full Body B','Full Body C']"), 'Full Body names gone');
must(html.includes("STARTER_STRENGTH_NAMES=[]"), 'no seeded strength days');
must(!html.includes('ensureHppMondayStarter(state)'), 'no HPP Monday ensure');
must(!html.includes('ensureHppWednesdayStarter(state)'), 'no HPP Wednesday ensure');
must(html.includes("UNSEED_STRENGTH_DAYS_VERSION='unseed-strength-days-v2'"), 'unseed migrate');
must(html.includes('function applyUnseedStrengthDaysPatch'), 'unseed patch');
must(!html.includes("scheduleFollowSession(state,state.templates.find(t=>t&&t.name==='HPP Monday')"), 'no auto-schedule HPP Monday');

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
must(!(seed.templates || []).some((t) => t && /^HPP (Monday|Wednesday)$/.test(t.name)), 'seed has no HPP days');
must((seed.templates || []).some((t) => t && t.name === 'Aerobic Conditioning'), 'Aerobic Conditioning stays in seed');

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
  HYBRID_PRODUCT: 'combined',
  productAllowsStrength: () => true,
  productAllowsEngine: () => true,
  productAllowsRecovery: () => true,
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
    { id: 'hpp-mon', name: 'HPP Monday', source: 'THE-starter', templateKind: 'strength', blocks: [] },
    { id: 'hpp-wed', name: 'HPP Wednesday', source: 'THE-program-core', templateKind: 'strength', blocks: [] },
  ],
  exercises: [],
  hiddenTemplateIds: [],
  sessions: [
    { id: 's1', name: 'HPP Monday', status: 'scheduled', templateId: 'hpp-mon', blocks: [] },
    { id: 's2', name: 'HPP Wednesday', status: 'completed', templateId: 'hpp-wed', blocks: [] },
  ],
});
must(!(out.templates || []).some((t) => /^HPP (Monday|Wednesday)$/.test(t.name)), 'boot does not install HPP days');
must(!(out.templates || []).some((t) => /^Full Body [ABC]$/.test(t.name)), 'boot drops Full Body A/B/C');
must((out.templates || []).some((t) => t.name === 'Aerobic Conditioning'), 'boots Aerobic Conditioning');
must((out.templates || []).some((t) => t.name === 'Recovery'), 'boots Recovery');
must(!(out.sessions || []).some((s) => s.status === 'scheduled' && /^HPP /.test(s.name)), 'does not schedule HPP days');
must((out.sessions || []).some((s) => s.status === 'completed' && s.name === 'HPP Wednesday'), 'keeps completed HPP history');

const keptUser = sandbox.applyUnseedStrengthDaysPatch({
  meta: { unseedStrengthDaysVersion: 'unseed-strength-days-v1' },
  templates: [
    {
      id: 'mine',
      name: 'HPP Monday',
      source: 'THE-user',
      templateKind: 'strength',
      blocks: [{ type: 'strength', exercises: [{ name: 'Front Squat' }] }],
    },
    {
      id: 'copy',
      name: 'Full Body A (2)',
      source: 'THE-user',
      templateKind: 'strength',
      blocks: [],
    },
    {
      id: 'custom',
      name: 'Lower A',
      source: 'THE-user',
      templateKind: 'strength',
      blocks: [],
    },
  ],
  sessions: [
    { id: 'live', name: 'HPP Monday', status: 'active', templateId: 'mine', blocks: [] },
  ],
});
must(!(keptUser.templates || []).some((t) => t.id === 'mine'), 'seeded HPP Monday is deleted even if marked THE-user');
must(!(keptUser.templates || []).some((t) => t.id === 'copy'), 'Full Body copies are deleted');
must((keptUser.templates || []).some((t) => t.id === 'custom'), 'custom rebuilt days are kept');
must(!(keptUser.sessions || []).some((s) => s.id === 'live'), 'active seeded HPP session is dropped');

const mixed = sandbox.normalizeAthleteStrengthBlocks([
  { type: 'strength', heading: 'Strength', exercises: [{ name: 'Front Squat', sets: 5, reps: '5' }] },
  { type: 'conditioning', heading: 'Row ERG', conditioningType: 'easy', modality: 'Rower', targetDurationMin: 20, condFmt: 'steady' },
  { type: 'text', heading: 'Recovery Breathing', notes: '10 Nasal Breaths' },
]);
must(
  !(mixed || []).some((b) => b && b.type === 'conditioning'),
  'hard line: a lift session never keeps an Engine block',
);
must((mixed || []).some((b) => b && b.type === 'strength'), 'hard line keeps lifts');
must((mixed || []).some((b) => b && b.type === 'text'), 'hard line keeps text notes');

console.log('fullbody-bc-starters.smoke: ok');
console.log('unseed-strength-days: HPP Monday/Wednesday not installed; Aerobic + Recovery remain');
