#!/usr/bin/env node
/**
 * Library conditioning tab: Engine lives under Library tabs, not Home.
 * Save / Publish helpers present; Home CONDITIONING module gone.
 * Run: node apps/mobile/prototype/hybrid-app/library-conditioning.smoke.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = __dirname;
const failures = [];
function must(cond, msg) {
  if (!cond) failures.push(msg);
}

const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(dir, 'service-worker.js'), 'utf8');

must(html.includes("LOCAL_BUILD='the-hybrid-athlete-engine-v93'"), 'LOCAL_BUILD v92');
must(sw.includes('the-hybrid-athlete-engine-v93'), 'service worker cache v92');

must(html.includes('library-tabs'), 'library tabs CSS/markup');
must(html.includes("setLibraryTab('conditioning')"), 'Engine library tab switch');
must(html.includes('function libraryConditioningTab('), 'libraryConditioningTab');
must(html.includes('function libraryStrengthTab('), 'libraryStrengthTab');
must(html.includes('function saveCondTemplate('), 'saveCondTemplate');
must(html.includes('function publishCondTemplate('), 'publishCondTemplate');
must(html.includes('function openAthleteConditioningLibrary('), 'openAthleteConditioningLibrary');
must(html.includes('Publish to day'), 'Publish to day CTA');
must(html.includes('Save to Library'), 'Save to Library CTA');

must(!html.includes('ath-label>CONDITIONING'), 'Home CONDITIONING module removed');
must(!html.includes('Conditioning lives on Home'), 'Library no longer points conditioning to Home');
must(!html.includes("onclick=\"startCondFromBuilder()\""), 'builder no longer Start-only from Home path');

must(html.includes("want=new Set(['Full Body A','Aerobic Conditioning'])"), 'Aerobic Conditioning seeded into Library');

if (failures.length) {
  console.error('library-conditioning.smoke FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('library-conditioning.smoke OK');
