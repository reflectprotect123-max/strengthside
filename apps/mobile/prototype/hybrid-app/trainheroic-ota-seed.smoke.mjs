#!/usr/bin/env node
/**
 * TrainHeroic OTA auto-seed wiring. Run:
 *   node apps/mobile/prototype/hybrid-app/trainheroic-ota-seed.smoke.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const failures = [];
function must(cond, msg) {
  if (!cond) failures.push(msg);
}

const html = readFileSync(join(dir, 'index.html'), 'utf8');
const sw = readFileSync(join(dir, 'service-worker.js'), 'utf8');
const sync = readFileSync(join(dir, '../../sync-hybrid-html.sh'), 'utf8');
const upload = readFileSync(join(dir, '../../capacitor/scripts/upload-capgo-bundle.sh'), 'utf8');
const importer = readFileSync(join(dir, '../../../../tools/trainheroic-import/import-trainheroic.mjs'), 'utf8');

must(html.includes("LOCAL_BUILD='the-hybrid-athlete-engine-v82'"), 'LOCAL_BUILD v82');
must(html.includes("TRAINHEROIC_SEED_JS='./trainheroic-import.js'"), 'root seed JS');
must(html.includes('TRAINHEROIC_SEED_JS_NESTED'), 'nested seed JS');
must(html.includes('loadTrainHeroicSeedScript'), 'script-tag seed loader');
must(html.includes('retryTrainHeroicOtaSeed'), 'Settings retry button');
must(html.includes('Capgo owns OTA on device'), 'native skips service worker');
must(html.includes('serviceWorker.getRegistrations'), 'unregisters existing SW on native');
must(html.includes('maybeApplyTrainHeroicOtaSeed()'), 'boot hook invoked');
must(sw.includes("const CACHE = 'the-hybrid-athlete-engine-v82'"), 'SW cache v82');
must(sw.includes("'./trainheroic-import.js'"), 'SW caches root seed JS');
must(sync.includes('preview-site/seeds'), 'sync copies seeds dir');
must(upload.includes('TRAINHEROIC_SEED_FILE'), 'upload accepts seed file env');
must(upload.includes("site+'/trainheroic-import.js'"), 'upload writes root seed JS');
must(importer.includes("seedId: 'trainheroic-2026-08-25-v4'"), 'importer emits seedId');

if (failures.length) {
  console.error('trainheroic-ota-seed.smoke FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('trainheroic-ota-seed.smoke: ok');
