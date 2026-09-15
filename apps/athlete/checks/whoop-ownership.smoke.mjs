/**
 * WHOOP ownership — TRACK talks to shared Supabase Edge (not Netlify).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
function must(cond, msg) {
  if (!cond) failures.push(msg);
}

const whoopJs = readFileSync(join(appRoot, 'connectors/whoop.js'), 'utf8');
const whoopIos = readFileSync(join(appRoot, 'connectors/whoop-ios.js'), 'utf8');
const cfg = readFileSync(join(appRoot, 'strength-config.js'), 'utf8');
const html = readFileSync(join(appRoot, 'index.html'), 'utf8');
const app = readFileSync(join(appRoot, 'app.js'), 'utf8');
const bridge = readFileSync(join(appRoot, 'native-bridge.js'), 'utf8');

must(cfg.includes("functionsProvider: 'supabase'"), 'STRENGTH_CONFIG uses supabase');
must(html.includes('strength-config.js'), 'index loads strength-config');
must(html.includes('connectors/whoop-ios.js'), 'index loads Totem-lite WHOOP client');
must(whoopIos.includes('api.prod.whoop.com'), 'ios client talks to WHOOP iOS API');
must(whoopIos.includes('CONTRIBUTORS_TILE_STEPS') || whoopIos.includes('STEPS'), 'ios client reads steps');
must(whoopJs.includes('WhoopIos'), 'whoop bridge uses WhoopIos');
must(whoopJs.includes('syncIos'), 'whoop syncs via iOS API not broken Edge');
must(whoopJs.includes("functions/v1"), 'whoop keeps Edge helper for coach');
must(whoopJs.includes('x-hybrid-product') && whoopJs.includes('hybridProduct()'), 'whoop sends hybrid product header');
must(!whoopJs.includes('thehybridsystem.netlify.app'), 'whoop must not call dead athlete Netlify WHOOP');
must(app.includes("Whoop.fnUrl('brain-coach')"), 'coach uses Edge via Whoop.fnUrl');
must(bridge.includes('setChannel'), 'OTA pins Capgo channel');

if (failures.length) {
  console.error('brain whoop-ownership FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('brain whoop-ownership: ok');
