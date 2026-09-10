/**
 * Brain owner deploy bundle must ship real WHOOP handlers (not athlete proxies).
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fnDir = join(root, 'netlify/functions');

const required = [
  'brain-coach.mjs',
  'whoop-connect.mjs',
  'whoop-callback.mjs',
  'whoop-sync.mjs',
  'integrations-status.mjs',
  '_lib/whoop.mjs',
  '_lib/store.mjs',
];

for (const rel of required) {
  const p = join(fnDir, rel);
  if (!existsSync(p)) throw new Error(`Brain owner bundle missing ${rel}`);
}

if (existsSync(join(fnDir, '_hybrid-proxy.mjs'))) {
  throw new Error('_hybrid-proxy must not ship on Brain owner — athlete site only');
}

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const blobs = pkg?.dependencies?.['@netlify/blobs'] || '';
if (!/^7\./.test(String(blobs))) {
  throw new Error(`@netlify/blobs must stay on 7.x for Lambda (got ${blobs})`);
}

const store = readFileSync(join(fnDir, '_lib/store.mjs'), 'utf8');
if (!store.includes('@netlify/blobs')) {
  throw new Error('_lib/store.mjs must use @netlify/blobs on Brain owner');
}

console.log('owner-bundle.smoke: ok');
