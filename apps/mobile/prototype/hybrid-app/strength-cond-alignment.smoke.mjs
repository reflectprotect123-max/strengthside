#!/usr/bin/env node
/**
 * Umbrella guard-rail smoke — spec §7 (strength ↔ cond adaptive alignment).
 * Delegates to focused smokes, then asserts cross-cutting contract markers.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const dir = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(dir, 'index.html'), 'utf8');

function must(c, m) {
  if (!c) throw new Error(m);
}

function slice(name, len = 2400) {
  const i = html.indexOf('function ' + name);
  if (i < 0) throw new Error('missing ' + name);
  return html.slice(i, i + len);
}

const childSmokes = [
  'cond-next-actual.smoke.mjs',
  'cond-anchors.smoke.mjs',
  'cond-modality-xor.smoke.mjs',
  'cond-analytics.smoke.mjs',
];

for (const file of childSmokes) {
  const proc = spawnSync('node', [join(dir, file)], { encoding: 'utf8' });
  if (proc.status !== 0) {
    console.error(proc.stdout || proc.stderr);
    throw new Error('child smoke failed: ' + file);
  }
  console.log('child ok:', file);
}

// Cond Next: actual modality values + RPE door (not plan-only baseline)
const next = slice('runDecideNextCond', 1200);
must(next.includes('actualSplitSec'), 'Next door must pass actualSplitSec');
must(next.includes('actualWatts'), 'Next door must pass actualWatts');
must(next.includes('actualRpm'), 'Next door must pass actualRpm');
must(next.includes('actualRpe'), 'Next door must pass actualRpe');
must(next.includes('isRecoveryCondTask'), 'Next door must skip recovery sessions');

must(html.includes('promptCondWorkRpe'), 'RPE sheet door missing');
must(html.includes('submitCondWorkRpe'), 'RPE submit handler missing');

const advance = slice('advanceInterval', 1600);
must(advance.includes('promptCondWorkRpe'), 'interval advance must open RPE door');
must(advance.includes('runDecideNextCond'), 'interval advance must call Next after RPE');

const complete = slice('completeConditioning', 1200);
must(complete.includes('promptCondWorkRpe'), 'complete must open RPE door');
must(complete.includes('runDecideNextCond'), 'complete must call Next after RPE');
must(!complete.includes('race2kSec'), 'complete must not write race2kSec anchor');

// Open → log → feel → Next → Close (cond-only after strength cut)
must(!html.includes('HybridAdaptive.openLift'), 'lift Open must be absent');
must(!html.includes('HybridAdaptive.closeLift'), 'lift Close must be absent');
must(!html.includes('HybridAdaptive.decideNextLift'), 'lift Next must be absent');
must(html.includes('HybridAdaptive.openCond'), 'cond Open door');
must(html.includes('HybridAdaptive.closeCond'), 'cond Close door');
must(html.includes('HybridAdaptive.decideNextCond'), 'cond Next door');
must(html.includes('loggedSplitSec') && html.includes('loggedWatts') && html.includes('loggedRpm'), 'cond log actual fields');

// Modality XOR — no silent RPM↔watts conversion sold as adaptive truth
must(!html.includes('wattsToRpm'), 'no wattsToRpm conversion helper');
must(!html.includes('rpmToWatts'), 'no rpmToWatts conversion helper');
must(!html.includes('wattsFromRpm'), 'no wattsFromRpm conversion helper');

// Analytics read-only under Engine (no Next / no anchor writes)
must(html.includes('setEngineLibrarySubTab'), 'Engine sub-nav missing');
must(html.includes('>Analytics<'), 'Analytics tab under Engine missing');
must(html.includes('function renderCondAnalytics('), 'renderCondAnalytics missing');

const renderAnalytics = slice('renderCondAnalytics', 3200);
must(!renderAnalytics.includes('decideNextCond'), 'Analytics must not call Next');
must(!/race2kSec\s*=/.test(renderAnalytics), 'Analytics must not write race2kSec');

console.log('strength-cond-alignment.smoke: ok');
