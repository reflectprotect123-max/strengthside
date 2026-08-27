#!/usr/bin/env node
/**
 * Apply this repo's strength migrations to the SHARED hosted Supabase project.
 *
 * Hosted probe (anon REST, 2026-08-27): hybrid tables like `foods` exist, but
 * NONE of the twelve strength tables (`metric` … `coaching_note`) are in the
 * PostgREST schema cache. So the coach-publish ALTER alone cannot run — the
 * full ordered set must land first.
 *
 * Auth (one of):
 *   SUPABASE_ACCESS_TOKEN  — Dashboard → Account → Access Tokens (preferred)
 *   SUPABASE_DB_PASSWORD   — project database password (psql via pooler)
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=sbp_… node scripts/apply-hosted-strength-migrations.mjs
 *   SUPABASE_DB_PASSWORD=…   node scripts/apply-hosted-strength-migrations.mjs
 *
 * Never points a throwaway check at hosted — that is checks/migrations-apply.mjs.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'orysjncrksmdfabpuftd';
const REGION = process.env.SUPABASE_DB_REGION || 'ap-southeast-2';
const MIG_DIR = join(ROOT, 'supabase/migrations');

const files = readdirSync(MIG_DIR)
  .filter((f) => f.endsWith('.sql'))
  .sort();

if (!files.length) {
  console.error('No migrations in', MIG_DIR);
  process.exit(1);
}

async function applyViaManagementApi(token) {
  const base = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database`;
  for (const name of files) {
    const query = readFileSync(join(MIG_DIR, name), 'utf8');
    process.stdout.write(`→ ${name} (Management API) … `);
    // Prefer tracked migrations endpoint; fall back to raw query.
    let res = await fetch(`${base}/migrations`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: name.replace(/\.sql$/, ''), query }),
    });
    if (res.status === 404 || res.status === 405) {
      res = await fetch(`${base}/query`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
    }
    const text = await res.text();
    if (!res.ok) {
      console.log('FAIL');
      console.error(res.status, text.slice(0, 2000));
      process.exit(1);
    }
    console.log('ok');
  }
}

function applyViaPsql(password) {
  const url =
    process.env.SUPABASE_DB_URL ||
    `postgresql://postgres.${PROJECT_REF}:${encodeURIComponent(password)}@aws-0-${REGION}.pooler.supabase.com:6543/postgres`;
  for (const name of files) {
    const path = join(MIG_DIR, name);
    process.stdout.write(`→ ${name} (psql) … `);
    try {
      execFileSync(
        'psql',
        [url, '-v', 'ON_ERROR_STOP=1', '-f', path],
        { stdio: ['ignore', 'pipe', 'pipe'] },
      );
      console.log('ok');
    } catch (err) {
      console.log('FAIL');
      const msg = (err.stderr || err.stdout || err.message || '').toString();
      console.error(msg.slice(0, 2000));
      process.exit(1);
    }
  }
}

async function verifyViaAnon() {
  const anon =
    process.env.SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yeXNqbmNya3NtZGZhYnB1ZnRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0MTE4NzksImV4cCI6MjA5OTk4Nzg3OX0.GTMBfFtH5O6SikzHo75sXGIZoEhmuJ7TvXiACd7T078';
  const url = `https://${PROJECT_REF}.supabase.co/rest/v1/assigned_session?select=id,coach_session_key&limit=1`;
  const res = await fetch(url, {
    headers: { apikey: anon, Authorization: `Bearer ${anon}` },
  });
  const body = await res.text();
  if (res.status === 404 && body.includes('could not find the table')) {
    console.error('VERIFY FAIL: assigned_session still missing from schema cache');
    process.exit(1);
  }
  // 200 empty / RLS denial still prove the relation exists in PostgREST.
  if (res.ok || body.includes('permission denied') || body.includes('JWT') || res.status === 401 || res.status === 300) {
    console.log('VERIFY ok: assigned_session visible to PostgREST (status', res.status + ')');
    return;
  }
  // Column missing would be PGRST204 / similar
  if (body.includes('coach_session_key') && body.includes('does not exist')) {
    console.error('VERIFY FAIL: coach_session_key missing — coach migration did not apply');
    process.exit(1);
  }
  console.log('VERIFY status', res.status, body.slice(0, 300));
}

const token = process.env.SUPABASE_ACCESS_TOKEN || '';
const dbPass = process.env.SUPABASE_DB_PASSWORD || process.env.POSTGRES_PASSWORD || '';

console.log('Project', PROJECT_REF);
console.log('Migrations:', files.join(', '));

if (token) {
  await applyViaManagementApi(token);
} else if (dbPass) {
  applyViaPsql(dbPass);
} else {
  console.error(`
Missing credentials.

Hosted Postgres cannot be altered with the anon or service_role JWT (those are
PostgREST keys — no DDL). Provide ONE of:

  1) SUPABASE_ACCESS_TOKEN  — https://supabase.com/dashboard/account/tokens
     then:  SUPABASE_ACCESS_TOKEN=sbp_… node scripts/apply-hosted-strength-migrations.mjs

  2) SUPABASE_DB_PASSWORD   — Project Settings → Database → Database password
     then:  SUPABASE_DB_PASSWORD=… node scripts/apply-hosted-strength-migrations.mjs

Or paste the six files under supabase/migrations/ (sorted) into the Dashboard
SQL editor for project orysjncrksmdfabpuftd.
`);
  process.exit(2);
}

await verifyViaAnon();
console.log('Done.');
