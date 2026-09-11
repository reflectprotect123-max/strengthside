#!/usr/bin/env node
/**
 * Deploy athlete HTML app + proxy functions to thehybridsystem.
 * Stages a flat bundle so index.html is served at / not /apps/athlete/.
 */
import { cpSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { resolveAthleteSiteId } from './brain-owner-site.mjs';

const API = 'https://api.netlify.com/api/v1';
const repo = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(repo, 'apps/athlete');
const token = process.env.NETLIFY_AUTH_TOKEN;

function fail(msg) {
  console.error(`deploy-athlete: ${msg}`);
  process.exit(1);
}

if (!token) fail('NETLIFY_AUTH_TOKEN required');
if (!existsSync(join(source, 'index.html'))) fail('missing apps/athlete/index.html');

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
const siteId = resolveAthleteSiteId(sites);
if (!siteId) fail('Could not resolve athlete site id (thehybridsystem)');

const stage = mkdtempSync(join(tmpdir(), 'athlete-deploy-'));
console.log(`Staging flat athlete bundle at ${stage}`);
for (const rel of [
  'index.html', 'app.js', 'home.css', 'logger.css', 'library.css',
  'brain-bundle.js', 'adaptive-bundle.js', 'engine.js', 'session.js',
  'library.js', 'library-ui.js', 'logger.js', 'timer.js', 'plan-sync.js',
  'native-bridge.js', 'service-worker.js', 'netlify.toml', 'package.json',
  'connectors', 'vendor', 'netlify', 'assets',
]) {
  const from = join(source, rel);
  if (existsSync(from)) cpSync(from, join(stage, rel), { recursive: true });
}

console.log(`Deploying athlete site=${siteId}`);
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
    `athlete app flat deploy (${process.env.GITHUB_SHA?.slice(0, 7) || 'local'})`,
  ],
  { cwd: stage, stdio: 'inherit', env: { ...process.env, NETLIFY_AUTH_TOKEN: token } },
);

try {
  rmSync(stage, { recursive: true, force: true });
} catch (_) {}

if (deploy.status !== 0) process.exit(deploy.status ?? 1);
console.log('deploy-athlete: ok');
