/**
 * Smoke: Warm-up and Cool-down text boxes on strength + Engine builders.
 * Filled notes become session text tasks (warm first, cool last); empty notes stay off the floor.
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

must(html.includes('function applyAthleteShellTexts'), 'applyAthleteShellTexts helper');
must(html.includes('function setDraftShellText'), 'strength builder setter');
must(html.includes('function setCondBuilderShellText'), 'engine builder setter');
must(html.includes('function athleteShellFieldHtml'), 'shared Warm-up/Cool-down field');
must(html.includes("athleteShellFieldHtml('Warm-up'"), 'Warm-up field on builders');
must(html.includes("athleteShellFieldHtml('Cool-down'"), 'Cool-down field on builders');
must(html.includes("'setDraftShellText'"), 'strength Warm-up/Cool-down wired');
must(html.includes("'setCondBuilderShellText'"), 'engine Warm-up/Cool-down wired');
must(html.includes("if(b.type==='text'){if(!String(b.notes||'').trim())continue;"), 'flatten skips empty text');

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
  condFormatMeta: () => ({ key: 'steady', name: 'Steady-state', type: 'easy' }),
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

must(typeof sandbox.applyAthleteShellTexts === 'function', 'helper loaded');
must(typeof sandbox.athleteShellTextNotes === 'function', 'notes helper loaded');

const assembled = sandbox.applyAthleteShellTexts(
  [{ id: 'core', type: 'strength', heading: 'Strength', exercises: [{ name: 'Front Squat' }] }],
  '5 min easy bike',
  'Walk + nasal breaths',
);
must(assembled[0].heading === 'Warm-up', 'warm first');
must(assembled[0].type === 'text' && assembled[0].notes === '5 min easy bike', 'warm notes');
must(assembled[assembled.length - 1].heading === 'Cool-down', 'cool last');
must(assembled.some((b) => b.type === 'strength'), 'keeps strength core');

const emptied = sandbox.applyAthleteShellTexts(assembled, '', '');
must(!(emptied || []).some((b) => b.type === 'text' && /warm-up|cool-down/i.test(b.heading)), 'empty shells removed');

const keptBreath = sandbox.applyAthleteShellTexts(
  [
    { id: 'rb', type: 'text', heading: 'Recovery Breathing', notes: '10 nasal' },
    { id: 'core', type: 'strength', heading: 'Strength', exercises: [{ name: 'GHR' }] },
  ],
  'spin',
  'stretch',
);
must(
  (keptBreath || []).some((b) => b.heading === 'Recovery Breathing'),
  'other text blocks stay',
);

const ordered = sandbox.normalizeAthleteStrengthBlocks(keptBreath);
must(ordered[0].heading === 'Warm-up', 'normalize puts warm first');
must(ordered[ordered.length - 1].heading === 'Cool-down', 'normalize puts cool last');

const aerobic = {
  name: 'Aerobic Conditioning',
  source: 'THE-starter',
  templateKind: 'conditioning',
  blocks: [
    { type: 'text', heading: 'Warm-up', notes: 'easy pedal' },
    { type: 'conditioning', heading: 'Easy aerobic', modality: 'Bike', condFmt: 'steady', effort: 'easy', targetDurationMin: 20 },
    { type: 'text', heading: 'Cool-down', notes: 'walk' },
  ],
};
must(sandbox.starterAerobicNeedsRefresh(aerobic) === false, 'shell texts do not force aerobic starter rewrite');

const condBlocks = sandbox.applyAthleteShellTexts(
  [{ id: 'c1', type: 'conditioning', heading: 'Intervals', modality: 'Bike', condFmt: 'intervals' }],
  'ramp 3 min',
  'easy spin 2 min',
);
must(condBlocks[0].heading === 'Warm-up', 'engine warm first');
must(condBlocks[1].type === 'conditioning', 'engine work in the middle');
must(condBlocks[2].heading === 'Cool-down', 'engine cool last');

console.log('warmup-cooldown-boxes.smoke: ok');
