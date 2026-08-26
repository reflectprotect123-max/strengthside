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

must(html.includes("LOCAL_BUILD='the-hybrid-athlete-engine-v81'"), 'LOCAL_BUILD v81');
must(html.includes("TRAINHEROIC_SEED_URL='./seeds/trainheroic-import.json'"), 'seed URL constant');
must(html.includes("TRAINHEROIC_SEED_JS='./seeds/trainheroic-import.js'"), 'seed JS constant');
must(html.includes('function mergeStrengthState('), 'strengthState merge helper');
must(html.includes('async function maybeApplyTrainHeroicOtaSeed('), 'OTA boot hook');
must(html.includes('loadTrainHeroicSeedScript'), 'script-tag seed loader');
must(html.includes('retryTrainHeroicOtaSeed'), 'Settings retry button');
must(html.includes('S.meta.trainheroicSeedId=seedId'), 'seed id tracked in meta');
must(html.includes('openLatestTrainHeroicDay'), 'calendar jump helper');
must(html.includes('trainheroicSeedError'), 'seed error surfaced');
must(html.includes('maybeApplyTrainHeroicOtaSeed()'), 'boot hook invoked');
must(sw.includes("const CACHE = 'the-hybrid-athlete-engine-v81'"), 'SW cache v81');
must(sw.includes("'./seeds/trainheroic-import.js'"), 'SW caches seed JS');
must(sw.includes("'./seeds/trainheroic-import.json'"), 'SW caches seed file');
must(sync.includes('preview-site/seeds'), 'sync copies seeds dir');
must(upload.includes('TRAINHEROIC_SEED_FILE'), 'upload accepts seed file env');
must(upload.includes('__TRAINHEROIC_SEED__'), 'upload emits JS wrapper');
must(upload.includes('trainheroic-import.json'), 'upload copies seed into bundle');
must(importer.includes("seedId: 'trainheroic-2026-08-25-v3'"), 'importer emits seedId');

if (failures.length) {
  console.error('trainheroic-ota-seed.smoke FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('trainheroic-ota-seed.smoke: ok');
