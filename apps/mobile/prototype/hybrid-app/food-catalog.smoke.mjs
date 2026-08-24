/**
 * Smoke: bundled AU food catalog loads and search/barcode work.
 * Run: node apps/mobile/prototype/hybrid-app/food-catalog.smoke.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const dir = dirname(fileURLToPath(import.meta.url));
const catalogJs = readFileSync(join(dir, 'food-catalog.js'), 'utf8');
const catalogJson = readFileSync(join(dir, 'food-catalog-au.json'), 'utf8');

const sandbox = { console, fetch: async () => ({ ok: true, json: async () => JSON.parse(catalogJson) }) };
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(catalogJs, sandbox);

await sandbox.FoodCatalogAU.loadCatalog();
const meta = sandbox.FoodCatalogAU.catalogMeta();
if (!meta || meta.count < 50) throw new Error('catalog too small');
const oats = sandbox.FoodCatalogAU.searchCatalog('oats', 5);
if (!oats.some((f) => /oat/i.test(f.name))) throw new Error('oats search');
const bc = sandbox.FoodCatalogAU.lookupBarcode('9310140100108');
if (!bc || !/oat/i.test(bc.name)) throw new Error('barcode lookup');
console.log('food-catalog.smoke: ok', meta.count, 'foods');
