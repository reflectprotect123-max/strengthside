#!/usr/bin/env node
/**
 * Close old multi-block Workout builder doors; Engine form must be real.
 * Run: node apps/mobile/prototype/hybrid-app/close-old-builder-doors.smoke.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const failures = [];
function must(cond, msg) {
  if (!cond) failures.push(msg);
}

must(!html.includes('Workout builder'), 'old Workout builder eyebrow must be gone');
must(!html.includes('addBlockSheet('), 'addBlockSheet door must be gone');
must(!html.includes('function addBlockSheet'), 'addBlockSheet helper must be scrubbed');
must(!html.includes('function startCondFromBuilder'), 'startCondFromBuilder must be scrubbed');
must(!/builderAdvanced\s*=\s*!builderAdvanced/.test(html), 'advanced toggle on old builder must be gone');

const builderIdx = html.indexOf('function builder()');
must(builderIdx >= 0, 'builder() exists');
const builderEnd = html.indexOf('\nfunction ', builderIdx + 10);
const builderFn = html.slice(builderIdx, builderEnd);
must(!builderFn.includes('usesAthleteStrengthBuilder'), 'builder must not route strength');
must(!builderFn.includes('athleteStrengthBuilder'), 'builder must not call strength workshop');
must(builderFn.includes('openAthleteConditioningBuilder()'), 'builder routes conditioning to Engine');
must(builderFn.includes('openAthleteConditioningLibrary()'), 'builder unknown draft returns to Library');
must(!builderFn.includes('Add block'), 'builder no longer renders Add block UI');
must(!builderFn.includes('proofcard'), 'builder no longer renders old proof card');

const renderIdx = html.indexOf('function renderCondBuilder()');
must(renderIdx >= 0, 'renderCondBuilder exists');
const renderEnd = html.indexOf('\nfunction ', renderIdx + 10);
const renderFn = html.slice(renderIdx, renderEnd);
must(!/let card\s*=\s*''/.test(renderFn), 'Engine card must not be empty string');
must(renderFn.includes('eng-builder-twin') || renderFn.includes('eng-builder-fields'), 'Engine card uses builder twin/fields');
must(renderFn.includes('condEffortChipsHtml()'), 'effort chips in Engine form');
must(renderFn.includes('condBuilderSelectHtml') || renderFn.includes('setCondFmt'), 'format control present');
must(renderFn.includes('nudgeCondMinutes') || renderFn.includes('Minutes'), 'minutes control present');
must(renderFn.includes('eng-builder-name') || renderFn.includes('condBuilder.name'), 'name field present');

must(html.includes("LOCAL_BUILD='the-hybrid-athlete-blank-v191'"), 'LOCAL_BUILD bumped to blank-v191');

if (failures.length) {
  console.error('close-old-builder-doors.smoke FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('close-old-builder-doors.smoke OK');
