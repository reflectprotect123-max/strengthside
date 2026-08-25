#!/usr/bin/env node
/**
 * Integration: verify bundled seed JSON is valid for OTA import.
 * Run after copying seed to preview-site/seeds/.
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const seedPath = join(dir, '../../preview-site/seeds/trainheroic-import.json');

if (!existsSync(seedPath)) {
  console.error('trainheroic-ota-seed.integration: skip (no seed file at preview-site/seeds/)');
  process.exit(0);
}

const raw = JSON.parse(readFileSync(seedPath, 'utf8'));
const state = raw.state || raw;
const sessions = state.sessions || [];
const wm = state.strengthState?.workingMaxEvents || [];
const pr = state.strengthState?.prEvents || [];
const exercises = state.exercises || [];

const failures = [];
if (!raw.seedId) failures.push('missing seedId');
if (sessions.length < 300) failures.push(`expected >=300 sessions, got ${sessions.length}`);
if (wm.length < 80) failures.push(`expected >=80 working maxes, got ${wm.length}`);
if (pr.length < 500) failures.push(`expected >=500 PR events, got ${pr.length}`);
if (exercises.length < 200) failures.push(`expected >=200 exercises, got ${exercises.length}`);

if (failures.length) {
  console.error('trainheroic-ota-seed.integration FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}

console.log('trainheroic-ota-seed.integration: ok', {
  seedId: raw.seedId,
  sessions: sessions.length,
  wm: wm.length,
  pr: pr.length,
  exercises: exercises.length,
});
