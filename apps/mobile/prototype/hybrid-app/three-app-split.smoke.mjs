#!/usr/bin/env node
/**
 * Three-product split: combined live app stays mixed; extract trees are
 * stamped Hybrid Strength / Hybrid Engine with separate storage keys and
 * no Recovery product surface.
 * Run: node apps/mobile/prototype/hybrid-app/three-app-split.smoke.mjs
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

function read(p) {
  if (!fs.existsSync(p)) {
    failures.push(`missing ${p}`);
    return '';
  }
  return fs.readFileSync(p, 'utf8');
}

function productMeta(html) {
  return (html.match(/<meta name="hybrid-product" content="([^"]+)"/) || [])[1] || '';
}

function tabsFn(html) {
  return html.match(/function libraryTabsHtml\(\)\{[\s\S]*?\nfunction /)?.[0] || '';
}

const proto = read(path.join(dir, 'index.html'));
must(productMeta(proto) === 'combined', 'live prototype must stay hybrid-product=combined');
must(proto.includes("HYBRID_PRODUCT==='strength'?'THE-hybrid-strength-v1'"), 'strength storage key');
must(proto.includes("HYBRID_PRODUCT==='engine'?'THE-hybrid-engine-v1'"), 'engine storage key');
must(proto.includes("'THE-builder-clean-v1'"), 'combined storage key unchanged');
must(proto.includes('function productAllowsRecovery(){return HYBRID_PRODUCT===\'combined\'}'), 'Recovery product only in combined');
must(proto.includes('if(productAllowsRecovery())upsertNamedStarter'), 'combined still seeds Recovery starter');
must(proto.includes('if(productAllowsEngine())upsertNamedStarter(state,\'Aerobic Conditioning\''), 'Engine starter gated');

const tabs = tabsFn(proto);
must(tabs.includes("setLibraryTab('recovery')"), 'combined Library still has a Recovery tab');
must(
  /if\(HYBRID_PRODUCT==='strength'\)\{[\s\S]*Hybrid Strength[\s\S]*return /.test(tabs),
  'strength product Library is a single Hybrid Strength tab',
);
must(
  /if\(HYBRID_PRODUCT==='engine'\)\{[\s\S]*The Engine[\s\S]*return /.test(tabs),
  'engine product Library is a single Engine tab',
);
must(!/HYBRID_PRODUCT==='strength'[\s\S]{0,400}setLibraryTab\('recovery'\)/.test(tabs), 'strength tab branch must not render Recovery');
must(!/HYBRID_PRODUCT==='engine'[\s\S]{0,400}setLibraryTab\('recovery'\)/.test(tabs), 'engine tab branch must not render Recovery');

must(proto.includes('function sessionMatchesProduct'), 'sessions filtered per product');
must(proto.includes("STORAGE=HYBRID_PRODUCT==='strength'"), 'STORAGE follows product stamp');

const extractSh = path.join(root, 'scripts/extract-hybrid-apps.sh');
must(fs.existsSync(extractSh), 'scripts/extract-hybrid-apps.sh must exist');

const strengthHtml = read(path.join(root, 'apps/hybrid-strength/index.html'));
const engineHtml = read(path.join(root, 'apps/hybrid-engine/index.html'));
must(productMeta(strengthHtml) === 'strength', 'apps/hybrid-strength stamped strength');
must(productMeta(engineHtml) === 'engine', 'apps/hybrid-engine stamped engine');
must(strengthHtml.includes("HYBRID_PRODUCT==='strength'?'THE-hybrid-strength-v1'"), 'strength extract keeps split storage keys');
must(engineHtml.includes("HYBRID_PRODUCT==='engine'?'THE-hybrid-engine-v1'"), 'engine extract keeps split storage keys');
must(tabsFn(strengthHtml).includes('Hybrid Strength'), 'strength extract Library chrome');
must(tabsFn(engineHtml).includes('The Engine'), 'engine extract Library chrome');
must(tabsFn(strengthHtml).includes("HYBRID_PRODUCT==='strength'"), 'strength extract has product-gated tabs');

const splitDoc = read(path.join(root, 'SPLIT.md'));
must(splitDoc.includes('subtree-split') || splitDoc.includes('git subtree'), 'SPLIT.md documents spinning out GitHub repos');
must(splitDoc.includes('apps/mobile'), 'SPLIT.md says mixed apps/mobile stays until cutover');
must(!/delete apps\/mobile/.test(splitDoc.toLowerCase()) || splitDoc.includes('after cutover'), 'do not delete apps/mobile in this cut');

must(splitDoc.includes('com.hybrid.strength'), 'SPLIT.md documents strength applicationId');
must(splitDoc.includes('com.hybrid.engine'), 'SPLIT.md documents engine applicationId');
must(splitDoc.includes('hybrid-strength'), 'SPLIT.md documents strength Netlify slug');
must(splitDoc.includes('hybrid-engine-athlete'), 'SPLIT.md uses hybrid-engine-athlete (hybrid-engine.netlify.app is occupied)');
const productsJson = read(path.join(root, 'scripts/hybrid-products.json'));
must(productsJson.includes('hybrid-engine-athlete'), 'engine Netlify slug avoids occupied hybrid-engine.netlify.app');
must(productsJson.includes('hybrid-strength.netlify.app'), 'strength Netlify slug matches nutrition-style hybrid-<product>');

if (failures.length) {
  console.error('three-app-split.smoke FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('three-app-split.smoke OK');
