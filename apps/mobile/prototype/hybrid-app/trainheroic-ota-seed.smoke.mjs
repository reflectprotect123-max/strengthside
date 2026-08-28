#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const dir = dirname(fileURLToPath(import.meta.url));
const failures = [];
function must(cond, msg) { if (!cond) failures.push(msg); }
const html = readFileSync(join(dir, 'index.html'), 'utf8');
const sw = readFileSync(join(dir, 'service-worker.js'), 'utf8');
const importer = readFileSync(join(dir, '../../../../tools/trainheroic-import/import-trainheroic.mjs'), 'utf8');
must(html.includes("LOCAL_BUILD='the-hybrid-athlete-engine-v94'"), 'v90');
must(html.includes('function purgeTrainHeroicCalendarSessions'), 'purge helper');
must(html.includes('function clearTrainHeroicCalendar'), 'Settings clear button');
must(html.includes('bootTrainHeroicSeed'), 'boot purges then seeds');
must(html.includes('isTrainHeroicSession'), 'session detector');
must(html.includes('Working maxes ready'), 'quiet Settings when clean');
must(html.includes('function exerciseSuggestHtml'), 'custom exercise suggest');
must(html.includes('function pickExerciseSuggest'), 'pick suggest');
must(html.includes('color-scheme:dark'), 'dark color-scheme for native controls');
must(!html.includes('list=exNameOptions'), 'native datalist removed');
must(html.includes('.mini-select option'), 'select option contrast CSS');
must(sw.includes("const CACHE = 'the-hybrid-athlete-engine-v94'"), 'SW v90');
must(importer.includes('v6-anchors'), 'seedId v6');
if (failures.length) { console.error('FAIL'); failures.forEach(f=>console.error(f)); process.exit(1); }
console.log('trainheroic-ota-seed.smoke: ok');
