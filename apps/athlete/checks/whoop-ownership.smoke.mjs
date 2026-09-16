/**
 * WHOOP ownership — official Allow on shared Supabase Edge (not typed numbers).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = join(appRoot, '../..');
const failures = [];
function must(cond, msg) {
  if (!cond) failures.push(msg);
}

const whoopJs = readFileSync(join(appRoot, 'connectors/whoop.js'), 'utf8');
const cfg = readFileSync(join(appRoot, 'strength-config.js'), 'utf8');
const html = readFileSync(join(appRoot, 'index.html'), 'utf8');
const app = readFileSync(join(appRoot, 'app.js'), 'utf8');
const engineApp = readFileSync(join(appRoot, 'engine/app.js'), 'utf8');
const authTs = readFileSync(join(repoRoot, 'supabase/functions/_shared/auth.ts'), 'utf8');
const whoopTs = readFileSync(join(repoRoot, 'supabase/functions/_shared/whoop.ts'), 'utf8');
const bridge = readFileSync(join(appRoot, 'native-bridge.js'), 'utf8');

must(cfg.includes("functionsProvider: 'supabase'"), 'STRENGTH_CONFIG uses supabase');
must(html.includes('strength-config.js'), 'index loads strength-config');
must(html.includes('connectors/whoop.js'), 'index loads WHOOP bridge');
must(whoopJs.includes('authorizeUrl'), 'whoop opens official Allow URL');
must(whoopJs.includes("client: 'native'"), 'whoop requests native Allow');
must(whoopJs.includes('CapacitorHttp'), 'whoop skips WebView CORS via CapacitorHttp');
must(whoopJs.includes('functions/v1'), 'whoop routes to Edge functions/v1');
must(whoopJs.includes('x-hybrid-product') && whoopJs.includes('hybridProduct()'), 'whoop sends hybrid product header');
must(!whoopJs.includes('applyManual'), 'whoop does not take typed WHOOP numbers');
must(!whoopJs.includes('thehybridsystem.netlify.app'), 'whoop must not call dead athlete Netlify WHOOP');
must(app.includes('Whoop.connect()'), 'Me Connect WHOOP');
must(engineApp.includes('Whoop.connect()'), 'Engine Me Connect WHOOP');
must(!app.includes('Whoop.applyManual'), 'Me has no Save WHOOP numbers');
must(!engineApp.includes('Whoop.applyManual'), 'Engine Me has no Save WHOOP numbers');
must(app.includes("Whoop.fnUrl('brain-coach')"), 'coach uses Edge via Whoop.fnUrl');
must(authTs.includes('export function whoopCallbackUrl'), 'auth exports whoopCallbackUrl — missing export BOOT_ERRORs connect/sync/callback');
must(whoopTs.includes('whoopCallbackUrl'), 'whoop.ts uses whoopCallbackUrl');
must(bridge.includes('setChannel'), 'OTA pins Capgo channel');

if (failures.length) {
  console.error('brain whoop-ownership FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('brain whoop-ownership: ok');
