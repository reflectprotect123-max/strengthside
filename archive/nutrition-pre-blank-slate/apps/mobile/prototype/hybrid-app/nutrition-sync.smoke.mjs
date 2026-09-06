/**
 * Smoke: nutrition cloud sync module exists and targets ecosystem + log tables.
 * Run: node apps/mobile/prototype/hybrid-app/nutrition-sync.smoke.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const syncSrc = readFileSync(join(dir, 'nutrition-sync.js'), 'utf8');
const whoopSrc = readFileSync(join(dir, 'whoop.js'), 'utf8');
const catalogSrc = readFileSync(join(dir, 'food-catalog.js'), 'utf8');
const html = readFileSync(join(dir, 'index.html'), 'utf8');

function must(cond, msg) {
  if (!cond) throw new Error(msg);
}

must(syncSrc.includes('athlete_domain_snapshots'), 'pull from athlete_domain_snapshots');
must(syncSrc.includes('upsert_athlete_domain_snapshot'), 'push via ecosystem RPC');
must(syncSrc.includes('food_log_entries'), 'mirror rows to food_log_entries');
must(syncSrc.includes('lookupBarcodeCloud'), 'cloud barcode lookup');
must(syncSrc.includes('stale_revision') || syncSrc.includes('Stale'), 'stale revision recovery');
must(syncSrc.includes('Whoop.client'), 'reuse WHOOP supabase session');
must(syncSrc.includes('schedulePush'), 'debounced push after save');
must(/client,\s*token,\s*email|client, token, email/.test(whoopSrc) || whoopSrc.includes('client, token, email'), 'Whoop exports client');
must(catalogSrc.includes('lookupBarcodeCloud'), 'catalog merges cloud barcode');
must(html.includes('nutrition-sync.js'), 'index loads nutrition-sync.js');

console.log('nutrition-sync.smoke: ok');
