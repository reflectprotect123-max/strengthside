#!/usr/bin/env node
/**
 * Apply HYBRID S&C ecosystem domain migration to shared hosted Supabase.
 *
 * Admits strength_side / engine_side and hardens ecosystem table grants.
 * Canonical SQL: scripts/hosted-ecosystem-hybrid-sc-domains.sql
 *
 * Auth (one of):
 *   SUPABASE_ACCESS_TOKEN  — Dashboard → Account → Access Tokens (preferred)
 *   SUPABASE_DB_PASSWORD   — project database password (psql via pooler)
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=sbp_… node scripts/apply-hosted-ecosystem-hybrid-sc-domains.mjs
 *   SUPABASE_DB_PASSWORD=…   node scripts/apply-hosted-ecosystem-hybrid-sc-domains.mjs
 */
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'orysjncrksmdfabpuftd';
const REGION = process.env.SUPABASE_DB_REGION || 'ap-southeast-2';
const SQL_PATH = join(ROOT, 'scripts/hosted-ecosystem-hybrid-sc-domains.sql');
const query = readFileSync(SQL_PATH, 'utf8');

async function applyViaManagementApi(token) {
  const base = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database`;
  process.stdout.write('→ hosted-ecosystem-hybrid-sc-domains.sql (Management API) … ');
  let res = await fetch(`${base}/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });
  const text = await res.text();
  if (!res.ok) {
    console.log('FAIL');
    console.error(res.status, text.slice(0, 2000));
    process.exit(1);
  }
  console.log('ok');
}

function applyViaPsql(password) {
  const url =
    process.env.SUPABASE_DB_URL ||
    `postgresql://postgres.${PROJECT_REF}:${encodeURIComponent(password)}@aws-0-${REGION}.pooler.supabase.com:6543/postgres`;
  process.stdout.write('→ hosted-ecosystem-hybrid-sc-domains.sql (psql) … ');
  try {
    execFileSync('psql', [url, '-v', 'ON_ERROR_STOP=1', '-f', SQL_PATH], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    console.log('ok');
  } catch (err) {
    console.log('FAIL');
    const msg = (err.stderr || err.stdout || err.message || '').toString();
    console.error(msg.slice(0, 2000));
    process.exit(1);
  }
}

async function verifyDomains() {
  const anon =
    process.env.SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yeXNqbmNya3NtZGZhYnB1ZnRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0MTE4NzksImV4cCI6MjA5OTk4Nzg3OX0.GTMBfFtH5O6SikzHo75sXGIZoEhmuJ7TvXiACd7T078';
  const url = `https://${PROJECT_REF}.supabase.co/rest/v1/rpc/upsert_athlete_domain_snapshot`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: anon,
      Authorization: `Bearer ${anon}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      p_domain: 'strength_side',
      p_schema_version: 1,
      p_revision: 1,
      p_writer: 'verify',
      p_client_updated_at: new Date().toISOString(),
      p_snapshot: {},
    }),
  });
  const body = await res.text();
  if (body.includes('invalid domain')) {
    console.error('VERIFY FAIL: strength_side still rejected by RPC');
    process.exit(1);
  }
  if (body.includes('not authenticated')) {
    console.log('VERIFY ok: RPC accepts strength_side (auth required as expected)');
    return;
  }
  console.log('VERIFY status', res.status, body.slice(0, 300));
}

const token = process.env.SUPABASE_ACCESS_TOKEN || '';
const dbPass = process.env.SUPABASE_DB_PASSWORD || process.env.POSTGRES_PASSWORD || '';

console.log('Project', PROJECT_REF);
console.log('SQL', SQL_PATH);

if (token) {
  await applyViaManagementApi(token);
} else if (dbPass) {
  applyViaPsql(dbPass);
} else {
  console.error(`
Missing credentials.

Provide ONE of:
  SUPABASE_ACCESS_TOKEN  — https://supabase.com/dashboard/account/tokens
  SUPABASE_DB_PASSWORD   — Project Settings → Database → Database password

Or paste scripts/hosted-ecosystem-hybrid-sc-domains.sql into the SQL editor.
`);
  process.exit(2);
}

await verifyDomains();
console.log('Done.');
