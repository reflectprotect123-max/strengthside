import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ENGINE_ROOTS, engineAbsenceMessage, presentEngineRoots } from './check-engine-half.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');

test('strength and engine rules name their branch prefix, verify command, and the other half', () => {
  const strength = read('.cursor/rules/strength-half.mdc');
  const engine = read('.cursor/rules/engine-half.mdc');
  assert.match(strength, /cursor\/strength-</);
  assert.match(strength, /pnpm run verify:strength/);
  assert.match(strength, /packages\/adaptive\/\*\*/);
  assert.match(engine, /cursor\/engine-</);
  assert.match(engine, /pnpm run verify:engine/);
  assert.match(engine, /apps\/athlete\/release\.json/);
  for (const rel of ENGINE_ROOTS) assert.match(engine, new RegExp(rel.split('/')[0]));
});

test('package scripts expose both lane gates and the ownership check stays on the full verify list', () => {
  const pkg = JSON.parse(read('package.json'));
  for (const name of ['verify:strength', 'verify:engine', 'check:ownership-halves']) {
    assert.equal(typeof pkg.scripts[name], 'string', name);
  }
  assert.match(pkg.scripts.verify, /check:ownership-halves/);
  assert.equal(pkg.scripts['verify:engine'], 'node scripts/check-engine-half.mjs');
  const referenced = [...pkg.scripts['verify:strength'].matchAll(/pnpm run ([\w:-]+)/g)].map((match) => match[1]);
  assert.ok(referenced.includes('check:ownership-halves'));
  assert.ok(referenced.includes('check:strength-brain'));
  for (const name of referenced) assert.equal(typeof pkg.scripts[name], 'string', name);
});

test('engine verify fails closed while this checkout has no engine root', () => {
  assert.deepEqual(presentEngineRoots(root), []);
  const result = spawnSync(process.execPath, ['scripts/check-engine-half.mjs'], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Engine half is not in this checkout/);
  assert.match(engineAbsenceMessage(), /origin\/codex\/engine-web-cloudflare/);
});
