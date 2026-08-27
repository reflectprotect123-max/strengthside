#!/usr/bin/env node
/**
 * Byte-level ship integrity: prototype hybrid-app must match synced copies.
 * Capgo uploads preview-site; THE-Hybrid-App.html is the single-file play copy.
 */
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const proto = join(root, 'prototype/hybrid-app');
const failures = [];

function sha(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function mustMatch(label, a, b) {
  if (!existsSync(a)) {
    failures.push(`missing ${a}`);
    return;
  }
  if (!existsSync(b)) {
    failures.push(`missing ${b}`);
    return;
  }
  const ha = sha(a);
  const hb = sha(b);
  if (ha !== hb) failures.push(`${label}: ${a} != ${b}\n  ${ha}\n  ${hb}`);
}

mustMatch('index.html → THE-Hybrid-App.html',
  join(proto, 'index.html'),
  join(root, 'THE-Hybrid-App.html'));
mustMatch('index.html → preview-site/index.html',
  join(proto, 'index.html'),
  join(root, 'preview-site/index.html'));
mustMatch('service-worker.js → preview-site',
  join(proto, 'service-worker.js'),
  join(root, 'preview-site/service-worker.js'));
mustMatch('netlify.toml → preview-site',
  join(proto, 'netlify.toml'),
  join(root, 'preview-site/netlify.toml'));
mustMatch('package.json → preview-site',
  join(proto, 'package.json'),
  join(root, 'preview-site/package.json'));

const bundles = [
  'strength-bundle.js',
  'engine-bundle.js',
  'nutrition-bundle.js',
  'coordinator-adapter.js',
  'recovery-engine.js',
  'strength-adapter.js',
  'engine-adapter.js',
  'coach-sync.js',
  'coach-cloud.js',
  'coach.html',
  'coach-loop.js',
  'coach-nutrition.js',
  'coach-bridge.js',
  'coach-views.js',
];
for (const f of bundles) {
  mustMatch(f, join(proto, f), join(root, 'preview-site', f));
}

const html = readFileSync(join(proto, 'index.html'), 'utf8');
const sw = readFileSync(join(proto, 'service-worker.js'), 'utf8');
const build = (html.match(/LOCAL_BUILD='([^']+)'/) || [])[1];
const cache = (sw.match(/CACHE = '([^']+)'/) || [])[1];
if (!build) failures.push('LOCAL_BUILD missing in index.html');
if (!cache) failures.push('CACHE missing in service-worker.js');
if (build && cache && build !== cache) {
  failures.push(`LOCAL_BUILD (${build}) != SW CACHE (${cache})`);
}

if (failures.length) {
  console.error('hybrid-html-sync FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}

console.log('hybrid-html-sync: ok', { build, files: 3 + bundles.length });
