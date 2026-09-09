#!/usr/bin/env node
/**
 * Set OPENROUTER env on Netlify via REST API — no netlify link / monorepo cwd.
 *
 * Default target is The Brain owner site (Netlify: thehybridengine1).
 * Athlete site (thehybridsystem) proxies brain-coach to the owner site.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import {
  resolveAthleteSiteId,
  resolveBrainOwnerSiteId,
} from './brain-owner-site.mjs';

const API = 'https://api.netlify.com/api/v1';
const repo = join(dirname(fileURLToPath(import.meta.url)), '..');
const token = process.env.NETLIFY_AUTH_TOKEN;

function fail(msg) {
  console.error(`set-openrouter-netlify: ${msg}`);
  process.exit(1);
}

if (!token) fail('NETLIFY_AUTH_TOKEN required');

function readKey() {
  if (process.env.OPENROUTER_API_KEY?.trim()) return process.env.OPENROUTER_API_KEY.trim();
  const p = join(repo, '.openrouter');
  if (existsSync(p) && readFileSync(p, 'utf8').trim()) return readFileSync(p, 'utf8').trim();
  fail('No key — run bash scripts/rematerialize-openrouter-from-vault.sh');
}

async function api(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
      ...opts.headers,
    },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${opts.method || 'GET'} ${path} ${res.status}: ${text.slice(0, 300)}`);
  }
  return text ? JSON.parse(text) : null;
}

async function listSites() {
  const out = [];
  let page = 1;
  for (;;) {
    const chunk = await api(`/sites?page=${page}&per_page=100`);
    if (!Array.isArray(chunk) || chunk.length === 0) break;
    out.push(...chunk);
    if (chunk.length < 100) break;
    page += 1;
  }
  return out;
}

async function upsertEnv(accountId, siteId, key, value, context = 'production') {
  await api(`/accounts/${accountId}/env/${encodeURIComponent(key)}?site_id=${siteId}`, {
    method: 'PATCH',
    body: JSON.stringify({ context, value }),
  });
}

async function verifyKeys(accountId, siteId) {
  const envs = await api(`/accounts/${accountId}/env?site_id=${siteId}`);
  const keys = (Array.isArray(envs) ? envs : []).map((e) => e.key).sort();
  for (const need of ['OPENROUTER_API_KEY', 'OPENROUTER_MODEL']) {
    console.log(`${need}:`, keys.includes(need) ? 'present' : 'MISSING');
    if (!keys.includes(need)) process.exit(1);
  }
}

function deployBrainOwnerCoach(siteId) {
  const bundle = join(repo, 'scripts/brain-owner-coach');
  const fnDir = join(bundle, 'netlify/functions');
  if (!existsSync(join(fnDir, 'brain-coach.mjs'))) {
    fail('missing scripts/brain-owner-coach/netlify/functions/brain-coach.mjs');
  }
  console.log(`Deploying brain-coach function to Brain owner site=${siteId}`);
  const r = spawnSync(
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
      bundle,
      '--functions',
      'netlify/functions',
      '--no-build',
      '--message',
      'brain-coach OpenRouter owner (Brain repo site)',
    ],
    { cwd: bundle, stdio: 'inherit', env: { ...process.env, NETLIFY_AUTH_TOKEN: token } },
  );
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const args = process.argv.slice(2);
const target = args.includes('--site=athlete') ? 'athlete' : 'brain-owner';
const deployCoach = args.includes('--deploy-coach');

const key = readKey();
const sites = await listSites();
const siteId =
  target === 'athlete' ? resolveAthleteSiteId(sites) : resolveBrainOwnerSiteId(sites);
if (!siteId) fail(`Could not resolve site id for ${target}`);

const site = sites.find((s) => s.id === siteId);
const accountId = site?.account_id;
if (!accountId) fail(`No account_id for site ${siteId}`);

console.log(`Target=${target} site=${siteId} account=${accountId}`);
await upsertEnv(accountId, siteId, 'OPENROUTER_API_KEY', key);
await upsertEnv(accountId, siteId, 'OPENROUTER_MODEL', 'openrouter/free');
await verifyKeys(accountId, siteId);

if (deployCoach && target === 'brain-owner') {
  deployBrainOwnerCoach(siteId);
}

console.log('set-openrouter-netlify: ok');
