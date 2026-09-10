#!/usr/bin/env node
/**
 * Deploy WHOOP/Concept2/coach functions to The Brain owner site (thehybridengine1).
 */
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { resolveBrainOwnerSiteId } from './brain-owner-site.mjs';

const API = 'https://api.netlify.com/api/v1';
const repo = join(dirname(fileURLToPath(import.meta.url)), '..');
const bundle = join(repo, 'scripts/brain-owner-coach');
const token = process.env.NETLIFY_AUTH_TOKEN;

function fail(msg) {
  console.error(`deploy-brain-owner: ${msg}`);
  process.exit(1);
}

if (!token) fail('NETLIFY_AUTH_TOKEN required');

const requiredFns = [
  'brain-coach.mjs',
  'whoop-connect.mjs',
  'whoop-callback.mjs',
  'whoop-sync.mjs',
  'integrations-status.mjs',
];

for (const name of requiredFns) {
  if (!existsSync(join(bundle, 'netlify/functions', name))) {
    fail(`missing netlify/functions/${name}`);
  }
}

async function listSites() {
  const out = [];
  let page = 1;
  for (;;) {
    const res = await fetch(`${API}/sites?page=${page}&per_page=100`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`listSites ${res.status}: ${text.slice(0, 200)}`);
    const chunk = JSON.parse(text);
    if (!Array.isArray(chunk) || chunk.length === 0) break;
    out.push(...chunk);
    if (chunk.length < 100) break;
    page += 1;
  }
  return out;
}

const sites = await listSites();
const siteId = resolveBrainOwnerSiteId(sites);
if (!siteId) fail('Could not resolve Brain owner site id (thehybridengine1)');

console.log(`Deploying Brain owner bundle to site=${siteId}`);

const npm = spawnSync('npm', ['install', '--omit=dev', '--no-fund', '--no-audit'], {
  cwd: bundle,
  stdio: 'inherit',
});
if (npm.status !== 0) process.exit(npm.status ?? 1);

const deploy = spawnSync(
  'npx',
  [
    '--yes',
    'netlify-cli@26.2.0',
    'deploy',
    '--prod',
    '--auth',
    token,
    '--site',
    siteId,
    '--dir',
    '.',
    '--functions',
    'netlify/functions',
    '--no-build',
    '--message',
    `Brain owner WHOOP + coach (${process.env.GITHUB_SHA?.slice(0, 7) || 'local'})`,
  ],
  { cwd: bundle, stdio: 'inherit', env: { ...process.env, NETLIFY_AUTH_TOKEN: token } },
);
if (deploy.status !== 0) process.exit(deploy.status ?? 1);

console.log('deploy-brain-owner: ok');
