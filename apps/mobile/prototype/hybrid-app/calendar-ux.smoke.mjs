import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(__dirname, 'service-worker.js'), 'utf8');

function must(cond, msg) {
  if (!cond) throw new Error(msg);
}

must(html.includes("LOCAL_BUILD='the-hybrid-athlete-engine-v110'"), 'LOCAL_BUILD v110');
must(sw.includes("const CACHE = 'the-hybrid-athlete-engine-v110'"), 'SW v110');
must(html.includes('function schedulableTemplates'), 'schedulableTemplates');
must(html.includes('function clearAllPlannedSessions'), 'clearAllPlannedSessions');
must(html.includes('function moveSessionToDate'), 'moveSessionToDate');
must(html.includes('cal-drop-target'), 'calendar drag-drop targets');
must(html.includes('function athleteStrengthBuilder'), 'athleteStrengthBuilder');
must(html.includes('function athleteLiftEditor'), 'inline athlete lift editor');
must(html.includes('athleteLiftEditor(y,strengthIdx,j)'), 'builder uses inline lift editor');
must(html.includes('function applyAthleteBuilderPatch'), 'applyAthleteBuilderPatch');
must(html.includes("ATHLETE_BUILDER_VERSION='athlete-builder-v3'"), 'athlete builder migration version');

console.log('calendar-ux.smoke: ok');
