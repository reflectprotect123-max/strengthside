#!/usr/bin/env node
/**
 * Build bundled AU food catalog from Open Food Facts for offline APK search.
 * Run: node scripts/build-au-food-catalog.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '../apps/mobile/prototype/hybrid-app/food-catalog-au.json');
const PAGES = 30;
const PAGE_SIZE = 100;
const AT = new Date().toISOString();

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function toFood(p) {
  const n = p.nutriments || {};
  const kcal = num(n['energy-kcal_100g']) ?? (num(n.energy_100g) != null ? num(n.energy_100g) / 4.184 : null);
  const proteinG = num(n.proteins_100g);
  const carbsG = num(n.carbohydrates_100g);
  const fatG = num(n.fat_100g);
  if (kcal == null && proteinG == null && carbsG == null && fatG == null) return null;
  const name = String(p.product_name || p.product_name_en || '').trim();
  if (!name) return null;
  const code = String(p.code || p._id || '').trim();
  if (!code) return null;
  const brand = String(p.brands || p.brand_owner || '').split(',')[0].trim() || null;
  const serving = String(p.serving_size || '').trim() || null;
  return {
    id: `off-${code}`,
    name,
    brand,
    barcode: code,
    servingQty: 100,
    servingUnit: 'g',
    calories: kcal ?? 0,
    proteinG: proteinG ?? 0,
    carbsG: carbsG ?? 0,
    fatG: fatG ?? 0,
    nutritionBasisQty: 100,
    nutritionBasisUnit: 'g',
    servingSizeText: serving,
    source: 'openfoodfacts',
    externalId: code,
    nutrients: {},
    servings: [],
    cachedAt: AT,
  };
}

async function fetchPage(page) {
  const url =
    `https://world.openfoodfacts.org/cgi/search.pl?action=process` +
    `&tagtype_0=countries&tag_contains_0=contains&tag_0=australia` +
    `&json=1&page_size=${PAGE_SIZE}&page=${page}` +
    `&fields=code,product_name,product_name_en,brands,brand_owner,serving_size,nutriments`;
  const res = await fetch(url, { headers: { 'User-Agent': 'TheStrengthEngine/1.0 (dogfood catalog build)' } });
  if (!res.ok) throw new Error(`OFF page ${page}: HTTP ${res.status}`);
  const data = await res.json();
  return (data.products || []).map(toFood).filter(Boolean);
}

const byId = new Map();
for (let page = 1; page <= PAGES; page += 1) {
  process.stderr.write(`Fetching OFF AU page ${page}/${PAGES}…\n`);
  try {
    const foods = await fetchPage(page);
    for (const f of foods) byId.set(f.id, f);
    if (foods.length < PAGE_SIZE) break;
    await new Promise((r) => setTimeout(r, 350));
  } catch (e) {
    process.stderr.write(`WARN page ${page}: ${e.message}\n`);
    if (page === 1) throw e;
    break;
  }
}

const foods = [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(
  OUT,
  JSON.stringify({
    version: 1,
    source: 'openfoodfacts-australia',
    builtAt: AT,
    count: foods.length,
    foods,
  }),
);
process.stderr.write(`Wrote ${foods.length} foods → ${OUT}\n`);
