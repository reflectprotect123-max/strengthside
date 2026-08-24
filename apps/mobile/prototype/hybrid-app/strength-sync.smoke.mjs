/**
 * Smoke: strength cloud sync module.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const syncSrc = readFileSync(join(dir, 'strength-sync.js'), 'utf8');
const html = readFileSync(join(dir, 'index.html'), 'utf8');

function must(cond, msg) {
  if (!cond) throw new Error(msg);
}

must(syncSrc.includes('athlete_domain_snapshots'), 'pull from athlete_domain_snapshots');
must(syncSrc.includes('upsert_athlete_domain_snapshot'), 'push via ecosystem RPC');
must(syncSrc.includes('Whoop.client'), 'reuse WHOOP supabase session');
must(syncSrc.includes('schedulePush'), 'debounced push');
must(syncSrc.includes("DOMAIN = 'strength'"), 'strength domain');
must(html.includes('strength-sync.js'), 'index loads strength-sync.js');
must(html.includes('StrengthSync.cardHtml'), 'settings shows strength sync card');

console.log('strength-sync.smoke: ok');
