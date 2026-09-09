/**
 * Split-product Capacitor / Netlify / Capgo identities.
 * Mixed com.hybrid.athlete is unchanged.
 * Run: node apps/mobile/prototype/hybrid-app/product-shells.smoke.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, '../../../..');
const failures = [];
function must(cond, msg) {
  if (!cond) failures.push(msg);
}

const products = JSON.parse(fs.readFileSync(path.join(root, 'scripts/hybrid-products.json'), 'utf8'));
must(products.strength.appId === 'com.hybrid.strength', 'strength appId');
must(products.engine.appId === 'com.hybrid.engine', 'engine appId');
must(products.combined.appId === 'com.hybrid.athlete', 'mixed appId stays com.hybrid.athlete');
must(products.strength.netlifySlug !== products.combined.netlifySlug, 'strength Netlify is not thehybridsystem');
must(products.engine.netlifySlug !== products.combined.netlifySlug, 'engine Netlify is not thehybridsystem');
must(products.engine.netlifySlug === 'hybrid-engine-athlete', 'engine slug avoids occupied hybrid-engine.netlify.app');
must(products.strength.netlifySlug === 'hybrid-strength', 'strength slug matches nutrition-style hybrid-<product>');

const whoop = fs.readFileSync(path.join(dir, 'whoop.js'), 'utf8');
const c2 = fs.readFileSync(path.join(dir, 'concept2.js'), 'utf8');
for (const src of [whoop, c2]) {
  must(src.includes("appId: 'com.hybrid.strength'"), 'client knows strength appId');
  must(src.includes("appId: 'com.hybrid.engine'"), 'client knows engine appId');
  must(src.includes('hybrid-strength.netlify.app'), 'client knows strength Netlify');
  must(src.includes('hybrid-engine-athlete.netlify.app'), 'client knows engine Netlify (not occupied hybrid-engine.netlify.app)');
  must(src.includes('thehybridsystem.netlify.app'), 'combined still routes to thehybridsystem');
  must(src.includes("client: 'native', appId: nativeAppId()"), 'native connect forwards product appId');
}

function checkShell(key) {
  const meta = products[key];
  const base = path.join(root, meta.dir);
  const cfgPath = path.join(base, 'capacitor/capacitor.config.json');
  const strings = path.join(base, 'capacitor/android/app/src/main/res/values/strings.xml');
  const gradle = path.join(base, 'capacitor/android/app/build.gradle');
  const manifest = path.join(base, 'capacitor/android/app/src/main/AndroidManifest.xml');
  const java = path.join(base, 'capacitor/android/app/src/main/java', ...meta.appId.split('.'), 'MainActivity.java');
  must(fs.existsSync(cfgPath), `${key} capacitor.config.json`);
  if (!fs.existsSync(cfgPath)) return;
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  must(cfg.appId === meta.appId, `${key} capacitor appId`);
  must(cfg.webDir === '..', `${key} webDir is product HTML`);
  must(cfg.plugins?.CapacitorUpdater?.appId === meta.appId, `${key} Capgo plugin appId`);
  const str = fs.existsSync(strings) ? fs.readFileSync(strings, 'utf8') : '';
  must(str.includes(meta.appId), `${key} custom_url_scheme`);
  must(!str.includes('com.hybrid.athlete'), `${key} must not keep mixed scheme`);
  const g = fs.existsSync(gradle) ? fs.readFileSync(gradle, 'utf8') : '';
  must(g.includes(`applicationId "${meta.appId}"`), `${key} gradle applicationId`);
  const xml = fs.existsSync(manifest) ? fs.readFileSync(manifest, 'utf8') : '';
  must(/android.intent.action.VIEW/.test(xml), `${key} VIEW intent`);
  must(/android.intent.category.BROWSABLE/.test(xml), `${key} BROWSABLE`);
  must(!/android:scheme="hybridengine"/.test(xml), `${key} must not steal mixed hybridengine:// WHOOP return`);
  must(fs.existsSync(java), `${key} MainActivity package ${meta.appId}`);
  const html = fs.readFileSync(path.join(base, 'index.html'), 'utf8');
  must(html.includes(`content="${key}"`), `${key} html stamp`);
  const fn = path.join(base, 'netlify/functions/_hybrid-proxy.mjs');
  must(fs.existsSync(fn), `${key} proxy functions`);
  const proxy = fs.readFileSync(fn, 'utf8');
  must(proxy.includes('thehybridengine1.netlify.app'), `${key} proxy → hybrid1`);
  must(!fs.existsSync(path.join(base, 'netlify/functions/whoop-callback.mjs')), `${key} no whoop-callback`);
  must(!fs.existsSync(path.join(base, 'coach.html')), `${key} no parked coach page`);
}

checkShell('strength');
checkShell('engine');

must(fs.existsSync(path.join(root, 'scripts/ship-product-capgo.sh')), 'ship-product-capgo.sh');
must(fs.existsSync(path.join(root, 'scripts/build-product-apk.sh')), 'build-product-apk.sh');
must(fs.existsSync(path.join(root, '.github/workflows/deploy-hybrid-strength-netlify.yml')), 'strength netlify workflow');
must(fs.existsSync(path.join(root, '.github/workflows/deploy-hybrid-engine-netlify.yml')), 'engine netlify workflow');
must(fs.existsSync(path.join(root, '.github/workflows/capgo-ship-products.yml')), 'product capgo workflow');

const mixedCfg = JSON.parse(fs.readFileSync(path.join(root, 'apps/mobile/capacitor/capacitor.config.json'), 'utf8'));
must(mixedCfg.appId === 'com.hybrid.athlete', 'mixed Capacitor appId unchanged');

if (failures.length) {
  console.error('product-shells.smoke FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('product-shells.smoke OK');
