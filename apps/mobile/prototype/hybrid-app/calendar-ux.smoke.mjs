import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(__dirname, 'service-worker.js'), 'utf8');

function must(cond, msg) {
  if (!cond) throw new Error(msg);
}

must(html.includes("LOCAL_BUILD='the-hybrid-athlete-engine-v146'"), 'LOCAL_BUILD v119');
must(sw.includes("const CACHE = 'the-hybrid-athlete-engine-v146'"), 'SW v119');
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
must(html.includes("ATHLETE_BUILDER_VERSION='athlete-builder-v8'"), 'athlete builder migration version');
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


must(html.includes('function athleteHasActiveCoachStrength'), 'athleteHasActiveCoachStrength');
must(html.includes('function coachControlsStrength(){return false}'), 'builder always available with coach rx');
must(!html.includes('settings.showStrengthBuilder=this.checked'), 'no builder settings toggle');
must(!html.includes('function dailyCheckinCard('), 'legacy slider check-in removed');
must(!html.includes('function openProgram('), 'ER program UI removed from athlete app');
must(!html.includes('Check for updates'), 'no manual coach pull in settings');
must(!html.includes('Minimal screen'), 'no minimal screen toggle');
must(!html.includes('pullCoachBridge'), 'pullCoachBridge removed');
must(!html.includes('onclick=exportData()>Export backup</button><button class=btn onclick="go(\'calendar\')">Return to calendar'), 'session summary export backup removed');
must(html.includes("setLibraryTab('progress')"), 'Progress lives in Library tabs');
must(!html.includes('home-links'), 'home footer links removed');
must(html.includes('ath-lift-logger'), 'ath-lift-logger markup');
must(!html.includes("coach-strength-hidden .ath-strength-build{display:none"), 'coach gate no longer hides athlete builder CSS');


must(html.includes('function toggleAthleteSupersetLock'), 'superset lock toggle');
must(html.includes('ath-ss-lock'), 'superset lock control');
must(html.includes('supersetWithNext'), 'supersetWithNext exercise flag');

console.log('calendar-ux.smoke: ok');
