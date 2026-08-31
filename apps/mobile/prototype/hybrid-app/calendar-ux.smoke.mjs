import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(__dirname, 'service-worker.js'), 'utf8');

function must(cond, msg) {
  if (!cond) throw new Error(msg);
}

must(html.includes("LOCAL_BUILD='the-hybrid-athlete-engine-v118'"), 'LOCAL_BUILD v118');
must(sw.includes("const CACHE = 'the-hybrid-athlete-engine-v118'"), 'SW v118');
must(html.includes('function schedulableTemplates'), 'schedulableTemplates');
must(html.includes('function clearAllPlannedSessions'), 'clearAllPlannedSessions');
must(html.includes('function moveSessionToDate'), 'moveSessionToDate');
must(html.includes('cal-drop-target'), 'calendar drag-drop targets');
must(html.includes('function athleteStrengthBuilder'), 'athleteStrengthBuilder');
must(html.includes('function athleteLiftEditor'), 'inline athlete lift editor');
must(html.includes('athleteLiftEditor(y,strengthIdx,j)'), 'builder uses inline lift editor');
must(html.includes('function usesAthleteStrengthBuilder'), 'usesAthleteStrengthBuilder');
must(html.includes('function ensureAthleteStrengthDraft'), 'ensureAthleteStrengthDraft');
must(html.includes('function applyAthleteBuilderPatch'), 'applyAthleteBuilderPatch');
must(html.includes("ATHLETE_BUILDER_VERSION='athlete-builder-v6'"), 'athlete builder migration version');
must(html.includes('function duplicateTemplate'), 'duplicateTemplate');
must(html.includes('function cloneTemplateAsUser'), 'cloneTemplateAsUser');
must(html.includes('function uniqueTemplateName'), 'uniqueTemplateName');
must(html.includes('function templateActionsHtml'), 'templateActionsHtml');
must(html.includes('ath-tpl-actions'), 'always-visible template actions');
must(html.includes('ath-tpl-schedule'), 'Schedule is primary template CTA');
must(html.includes('function saveTemplateAsCopy'), 'saveTemplateAsCopy');
must(html.includes('function saveStrengthWorkoutAsCopy'), 'saveStrengthWorkoutAsCopy');
must(html.includes('function saveCondTemplateAsCopy'), 'saveCondTemplateAsCopy');
must(html.includes("onclick=\"duplicateTemplate('"), 'Library Duplicate button');
must(html.includes('Save as copy'), 'Save as copy controls');
must(html.includes('touch-action:manipulation'), 'touch-action manipulation');
must(/\.btn\.small\{[^}]*min-height:var\(--tap-min\)/.test(html), 'btn.small uses tap-min');

console.log('calendar-ux.smoke: ok');
