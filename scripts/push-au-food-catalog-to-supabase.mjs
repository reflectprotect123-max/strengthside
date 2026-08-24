#!/usr/bin/env node
/**
 * Push bundled AU food catalog (food-catalog-au.json) into Supabase public.foods.
 *
 * Requires service role — foods is read-only for authenticated clients (RLS).
 *
 *   SUPABASE_URL=https://orysjncrksmdfabpuftd.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=... \
 *   node scripts/push-au-food-catalog-to-supabase.mjs
 *
 * Options:
 *   --dry-run     Print row count and sample only
 *   --verify BC   After upsert, fetch one barcode and print result
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CATALOG = join(ROOT, 'apps/mobile/prototype/hybrid-app/food-catalog-au.json');
const DEFAULT_URL = 'https://orysjncrksmdfabpuftd.supabase.co';
const BATCH = 50;

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const verifyArg = process.argv.find((a, i) => process.argv[i - 1] === '--verify');
const url = process.env.SUPABASE_URL || DEFAULT_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

function toRow(f) {
  return {
    name: f.name,
    brand: f.brand || null,
    barcode: f.barcode || null,
    serving_qty: Number(f.servingQty) || 100,
    serving_unit: f.servingUnit || 'g',
    calories: Number(f.calories) || 0,
    protein_g: Number(f.proteinG) || 0,
    carbs_g: Number(f.carbsG) || 0,
    fat_g: Number(f.fatG) || 0,
    source: f.source || 'au-seed',
    external_id: f.externalId || f.id,
    nutrition_basis_qty: Number(f.nutritionBasisQty) || 100,
    nutrition_basis_unit: f.nutritionBasisUnit || 'g',
    serving_size_text: f.servingSizeText || null,
    nutrients: f.nutrients && typeof f.nutrients === 'object' ? f.nutrients : {},
  };
}

async function upsertBatch(rows) {
  const res = await fetch(`${url.replace(/\/$/, '')}/rest/v1/foods`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Insert failed HTTP ${res.status}: ${body.slice(0, 500)}`);
  }
}

/** Idempotent re-run: replace prior au-seed rows (partial unique index blocks PostgREST on_conflict). */
async function clearAuSeed() {
  const res = await fetch(`${url.replace(/\/$/, '')}/rest/v1/foods?source=eq.au-seed`, {
    method: 'DELETE',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: 'return=minimal',
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Clear au-seed failed HTTP ${res.status}: ${body.slice(0, 500)}`);
  }
}

async function countFoods() {
  const res = await fetch(`${url.replace(/\/$/, '')}/rest/v1/foods?select=id&source=eq.au-seed`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: 'count=exact',
      Range: '0-0',
    },
  });
  if (!res.ok) throw new Error(`Count failed HTTP ${res.status}`);
  const range = res.headers.get('content-range') || '';
  const m = range.match(/\/(\d+)/);
  return m ? Number(m[1]) : 0;
}

async function fetchBarcode(bc) {
  const res = await fetch(
    `${url.replace(/\/$/, '')}/rest/v1/foods?select=name,brand,barcode,source,external_id&barcode=eq.${encodeURIComponent(bc)}&limit=1`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } },
  );
  if (!res.ok) throw new Error(`Fetch failed HTTP ${res.status}`);
  const data = await res.json();
  return data[0] || null;
}

async function main() {
  const catalog = JSON.parse(readFileSync(CATALOG, 'utf8'));
  const foods = Array.isArray(catalog.foods) ? catalog.foods : [];
  const rows = foods.map(toRow);
  const withBarcode = rows.filter((r) => r.barcode).length;

  console.log(`Catalog: ${rows.length} foods (${withBarcode} with barcodes) from ${CATALOG}`);

  if (dryRun) {
    console.log('Dry run — sample row:', JSON.stringify(rows[0], null, 2));
    return;
  }

  if (!key) {
    console.error('Missing SUPABASE_SERVICE_ROLE_KEY (foods table is read-only for anon/auth).');
    process.exit(1);
  }

  await clearAuSeed();

  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    await upsertBatch(chunk);
    process.stderr.write(`Upserted ${Math.min(i + BATCH, rows.length)}/${rows.length}\n`);
  }

  const seeded = await countFoods();
  console.log(`Done. au-seed rows in foods: ${seeded}`);

  const probe = verifyArg || '9310140100108';
  const hit = await fetchBarcode(probe);
  if (hit) {
    console.log(`Verify barcode ${probe}: ${hit.name}${hit.brand ? ` (${hit.brand})` : ''}`);
  } else {
    console.warn(`Verify barcode ${probe}: NOT FOUND`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
