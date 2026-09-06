#!/usr/bin/env node
/**
 * Hybrid Strength cut: nuclear strengthCutV1 migrate + Engine/Recovery-only starters.
 * Run: node apps/mobile/prototype/hybrid-app/cut-strength-migrate.smoke.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const failures = [];
function must(cond, msg) {
  if (!cond) failures.push(msg);
}

// Migrate marker + patch wired into boot
must(html.includes('strengthCutV1'), 'strengthCutV1 migrate marker');
must(html.includes('function applyStrengthCutPatch'), 'applyStrengthCutPatch');
must(
  html.includes('applyStrengthCutPatch(applyBlankSlatePatch'),
  'applyStrengthCutPatch in athlete shell boot chain',
);

// ensureStarterTemplates: Engine + Recovery only (no Full Body ensures)
const ensureBlock = html.slice(
  html.indexOf('function ensureStarterTemplates'),
  html.indexOf('function applyCalendarCleanPatch'),
);
must(!ensureBlock.includes('ensureFullBodyAStarter(state)'), 'no Full Body A seed');
must(!ensureBlock.includes('ensureFullBodyBStarter(state)'), 'no Full Body B seed');
must(!ensureBlock.includes('ensureFullBodyCStarter(state)'), 'no Full Body C seed');
must(ensureBlock.includes("'Aerobic Conditioning'"), 'Aerobic Conditioning seed remains');
must(ensureBlock.includes("'Recovery'"), 'Recovery seed remains');

// Behavioral migrate: wipe strength, preserve cond close + settings
const chunkStart = html.indexOf('function isStrengthCutTemplate');
const chunkEnd = html.indexOf('function applyAthleteShellPatch');
const chunk = html.slice(chunkStart, chunkEnd);
const sandbox = {
  console,
  clone: (x) => JSON.parse(JSON.stringify(x)),
  id: () => 'test-id',
  num: (v) => Number(v) || 0,
  isoNow: () => '2026-09-06T00:00:00.000Z',
  window: {},
  S: {},
  touchRecord: (r) => r,
  dedupe: (l) => l || [],
  registerExercise: () => {},
  COND_FORMATS: [{ key: 'steady', name: 'Steady', type: 'easy' }],
  COND_EFFORTS: [{ key: 'easy', name: 'Easy' }],
  COND_MODALITIES: ['Bike'],
  condFormatMeta: () => ({ key: 'steady', type: 'easy' }),
  isConditioningTemplate: (t) =>
    !!t &&
    (String(t.templateKind || '').toLowerCase() === 'conditioning' ||
      (t.blocks || []).some((b) => b && b.type === 'conditioning')),
  isSupersetBlock: () => false,
  templateHasStrength: (t) =>
    (t?.blocks || []).some((b) => b && b.type === 'strength' && (b.exercises || []).length),
  normalizeAthleteStrengthBlocks: (blocks) => blocks || [],
  normalizeAthleteCondTemplate: () => {},
  repairProgramText: () => {},
  isStarterTemplate: (t) => String(t?.source || '') === 'THE-starter',
  PROGRAM_TEXT_DEFAULTS: {},
  repairTextBlocks: () => false,
  seed: { templates: [] },
};
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(chunk, sandbox);

const { applyStrengthCutPatch, ensureStarterTemplates } = sandbox;
must(typeof applyStrengthCutPatch === 'function', 'applyStrengthCutPatch export');
must(typeof ensureStarterTemplates === 'function', 'ensureStarterTemplates export');

if (typeof applyStrengthCutPatch === 'function') {
const clone = (x) => JSON.parse(JSON.stringify(x));
const pre = {
  meta: { starterFullBodyAVersion: 'old' },
  sessions: [{ id: 's1', name: 'Full Body A', status: 'completed' }],
  active: 's1',
  draft: { templateKind: 'strength', name: 'Draft lift', blocks: [] },
  templates: [
    { id: 'fb-a', name: 'Full Body A', templateKind: 'strength', blocks: [{ type: 'strength', exercises: [{}] }] },
    { id: 'cond', name: 'My intervals', templateKind: 'conditioning', blocks: [{ type: 'conditioning' }] },
  ],
  strengthState: { workingMaxEvents: [{ id: 'wm1' }], prEvents: [], loadHints: {} },
  adaptiveClose: { squat: { loadKg: 100 } },
  adaptiveCondClose: { bike: { watts: 180 } },
  settings: {
    whoop: { email: 'a@b.com' },
    strengthSchedule: { sessionsPerWeek: 4 },
    condPaceAnchors: { run: '5:00' },
  },
};

const once = applyStrengthCutPatch(clone(pre));
must(once.sessions.length === 0, 'migrate clears all sessions');
must(once.active == null, 'migrate clears active pointer');
must(once.draft == null, 'migrate clears strength draft');
must((once.strengthState?.workingMaxEvents || []).length === 0, 'migrate clears strengthState WM');
must(once.adaptiveClose == null, 'migrate clears lift adaptiveClose');
must(once.adaptiveCondClose?.bike?.watts === 180, 'migrate preserves adaptiveCondClose');
must(once.settings?.whoop?.email === 'a@b.com', 'migrate preserves WHOOP settings');
must(once.settings?.condPaceAnchors?.run === '5:00', 'migrate preserves pace anchors');
must(once.settings?.strengthSchedule == null, 'migrate clears strengthSchedule');
must(once.meta.starterFullBodyAVersion == null, 'migrate clears starterFullBody meta');
must(once.meta.strengthCutV1, 'migrate sets strengthCutV1 marker');
must(!once.templates.some((t) => t.name === 'Full Body A'), 'migrate drops strength templates');
must(once.templates.some((t) => t.name === 'My intervals'), 'migrate keeps cond templates');

const twice = applyStrengthCutPatch(clone(once));
must(twice.meta.strengthCutV1 === once.meta.strengthCutV1, 'migrate idempotent when marker set');

const seeded = ensureStarterTemplates(clone(once));
must(seeded.templates.some((t) => t.name === 'Aerobic Conditioning'), 'post-migrate Aerobic starter');
must(seeded.templates.some((t) => t.name === 'Recovery'), 'post-migrate Recovery starter');
must(
  !seeded.templates.some((t) => /^Full Body [ABC]$/.test(t.name)),
  'post-migrate no Full Body starters',
);
}

if (failures.length) {
  console.error('cut-strength-migrate.smoke FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}

must(html.includes('function applyStrengthCutImportScrub'), 'import scrub after strength cut');
must(/function ensureStrengthSchedule\(state\)\{[^}]*delete state\.settings\.strengthSchedule/.test(html.replace(/\n/g,' ')), 'ensureStrengthSchedule deletes schedule');
must(/function mergeStrengthState\([^)]*\)\{return\{workingMaxEvents:\[\]/.test(html.replace(/\n/g,' ')), 'mergeStrengthState is no-op empty');

console.log('cut-strength-migrate.smoke OK');
