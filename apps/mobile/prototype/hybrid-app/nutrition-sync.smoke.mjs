/**
 * Smoke: nutrition cloud sync module exists and targets ecosystem RPC.
 * Run: node apps/mobile/prototype/hybrid-app/nutrition-sync.smoke.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(dir, 'nutrition-sync.js'), 'utf8');

function must(cond, msg) {
  if (!cond) throw new Error(msg);
}

must(src.includes('athlete_domain_snapshots'), 'pull from athlete_domain_snapshots');
must(src.includes('upsert_athlete_domain_snapshot'), 'push via ecosystem RPC');
must(src.includes("p_domain: DOMAIN") || /p_domain:\s*DOMAIN/.test(src), 'nutrition domain');
must(src.includes('mergeNutrition'), 'merge remote with local');
must(src.includes('Whoop.client'), 'reuse WHOOP supabase session');
must(src.includes('schedulePush'), 'debounced push after save');

console.log('nutrition-sync.smoke: ok');
