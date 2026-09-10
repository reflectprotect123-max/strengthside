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

const netlifyignore = join(root, '.netlifyignore');
if (!existsSync(netlifyignore) || !readFileSync(netlifyignore, 'utf8').includes('node_modules')) {
  throw new Error('.netlifyignore must exclude node_modules (external @netlify/blobs at runtime)');
}

const store = readFileSync(join(fnDir, '_lib/store.mjs'), 'utf8');
if (!store.includes('@netlify/blobs')) {
  throw new Error('_lib/store.mjs must use @netlify/blobs on Brain owner');
}

console.log('owner-bundle.smoke: ok');
