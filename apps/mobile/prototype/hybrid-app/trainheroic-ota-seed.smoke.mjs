#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const failures = [];
function must(cond, msg) { if (!cond) failures.push(msg); }

const html = readFileSync(join(dir, 'index.html'), 'utf8');
const sw = readFileSync(join(dir, 'service-worker.js'), 'utf8');
const upload = readFileSync(join(dir, '../../capacitor/scripts/upload-capgo-bundle.sh'), 'utf8');
const importer = readFileSync(join(dir, '../../../../tools/trainheroic-import/import-trainheroic.mjs'), 'utf8');

must(html.includes("LOCAL_BUILD='the-hybrid-athlete-engine-v83'"), 'LOCAL_BUILD v83');
must(html.includes("TRAINHEROIC_SEED_JS='./trainheroic-import.js'"), 'root seed JS');
must(html.includes("anchorsOnly"), 'anchors-only purge path');
must(html.includes("source==='trainheroic-import'"), 'strips prior TH sessions');
must(html.includes('retryTrainHeroicOtaSeed'), 'Settings retry');
must(html.includes('Capgo owns OTA on device'), 'native skips SW');
must(sw.includes("const CACHE = 'the-hybrid-athlete-engine-v83'"), 'SW v83');
must(upload.includes("site+'/trainheroic-import.js'"), 'upload writes root seed');
must(importer.includes("--with-sessions"), 'importer has with-sessions flag');
must(importer.includes("anchors-only"), 'importer default anchors-only');
must(importer.includes("seedId: withSessions"), 'seedId switches with mode');

if (failures.length) {
  console.error('trainheroic-ota-seed.smoke FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('trainheroic-ota-seed.smoke: ok');
