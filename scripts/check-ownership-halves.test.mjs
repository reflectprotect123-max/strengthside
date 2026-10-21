import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { presentEngineRoots } from './check-engine-half.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');

test('engine rule names the live engine app and its verify command', () => {
  const engine = read('.cursor/rules/engine-half.mdc');
  assert.match(engine, /cursor\/engine-</);
  assert.match(engine, /pnpm run verify:engine/);
  assert.match(engine, /apps\/athlete\/engine/);
  assert.equal(existsSync(join(root, '.cursor/rules/strength-half.mdc')), false);
  assert.equal(existsSync(join(root, 'park/strength-app')), false);
  assert.equal(existsSync(join(root, 'evidence-platform')), false);
});

test('package scripts verify the engine app', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.scripts['verify:engine'], 'node scripts/check-engine-half.mjs');
  assert.equal(pkg.scripts['verify:strength'], undefined);
  assert.match(pkg.scripts.verify, /verify:engine/);
  assert.doesNotMatch(JSON.stringify(pkg.scripts), /park\/strength-app/);
  assert.doesNotMatch(JSON.stringify(pkg.scripts), /evidence-platform/);
});

test('the shipped engine page is the engine root', () => {
  assert.deepEqual(presentEngineRoots(root), ['apps/athlete/engine/index.html']);
});
