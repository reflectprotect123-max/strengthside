/**
 * Smoke: unified Whoop.syncAll + one-step check-in helpers exist in HTML/JS.
 * Settings Connections = Account only (no Concept2 / Strength / Nutrition sync cards,
 * no Strength schedule).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const whoop = readFileSync(join(dir, 'whoop.js'), 'utf8');
const html = readFileSync(join(dir, 'index.html'), 'utf8');
const strength = readFileSync(join(dir, 'strength-sync.js'), 'utf8');
const nutrition = readFileSync(join(dir, 'nutrition-sync.js'), 'utf8');

if (!whoop.includes('async function syncAll')) throw new Error('Whoop.syncAll missing');
if (!whoop.includes('Sign in & sync')) throw new Error('Sign in & sync CTA missing');
if (!whoop.includes('syncAll,')) throw new Error('Whoop export missing syncAll');
if (!whoop.includes('cloudStatusLines')) throw new Error('Account cloud status lines missing');
if (!whoop.includes('Concept2.syncIfLinked')) throw new Error('syncAll missing Concept2.syncIfLinked');
if (!whoop.includes('Syncing Concept2')) throw new Error('syncAll missing Concept2 progress message');
if (whoop.includes('global.S = global.S || {}')) throw new Error('Whoop.st must not invent stub window.S');
if (!whoop.includes('whoopFallback')) throw new Error('Whoop.st missing whoopFallback (no stub)');
if (!whoop.includes('CoachSync.schedulePull')) throw new Error('syncAll missing CoachSync.schedulePull');
if (!whoop.includes('StrengthSync.getStatus')) throw new Error('syncAll should surface StrengthSync.getStatus errors');
if (!html.includes("Object.defineProperty(window,'S'")) throw new Error('index.html must bridge window.S to let S');

const concept2 = readFileSync(join(dir, 'concept2.js'), 'utf8');
if (!concept2.includes('async function syncIfLinked')) throw new Error('Concept2.syncIfLinked missing');
if (!concept2.includes('syncIfLinked,')) throw new Error('Concept2 export missing syncIfLinked');

if (strength.includes('function cardHtml')) throw new Error('StrengthSync.cardHtml should be removed');
if (nutrition.includes('function cardHtml')) throw new Error('NutritionSync.cardHtml should be removed');
if (html.includes('NutritionSync.cardHtml')) throw new Error('Settings still mounts NutritionSync.cardHtml');
if (html.includes('StrengthSync.cardHtml')) throw new Error('Settings still mounts StrengthSync.cardHtml');
if (html.includes('Concept2.cardHtml')) throw new Error('UI still mounts Concept2.cardHtml');
if (html.includes('Strength schedule')) throw new Error('Strength schedule Settings card still present');
if (html.includes('function strengthVolumeBudgetHtml')) throw new Error('volume guide HTML helper still present');
if (html.includes('schSessions')) throw new Error('schedule inputs still present');

if (!html.includes('ATH_CHECKIN_STEPS')) throw new Error('ATH_CHECKIN_STEPS missing');
if (!html.includes('function athCheckinAnswer')) throw new Error('athCheckinAnswer missing');
if (!html.includes('checkin-choice')) throw new Error('checkin-choice UI missing');
if (html.includes("athSleepSlider('sleepQuality'")) throw new Error('old sleepQuality slider still in check-in card');
if (!html.includes("LOCAL_BUILD='the-hybrid-athlete-engine-v147'")) throw new Error('expected cache v96');
if (!html.includes("keepScroll=S&&S.tab==='settings'")) throw new Error('shell() must preserve settings scroll');
if (html.includes("loadStarter('Full Body B')")) throw new Error('Full Body B starter button still present');
if (html.includes("loadStarter('Full Body C')")) throw new Error('Full Body C starter button still present');
if (html.includes("loadStarter('Full Body A')")) throw new Error('Full Body A starter button should be removed for blank slate');
if (!html.includes('Concept2 Logbook when already linked')) throw new Error('Settings copy missing Concept2-in-sync note');

// Settings scroll: WHOOP/Concept2 must NOT rebuild settings() on status refresh (scroll jump).
if (/tab === 'settings'[\s\S]{0,160}global\.settings\(\)/.test(whoop)) {
  throw new Error('whoop refreshVisibleUi must not call settings() (scroll jump)');
}
if (/tab === 'settings'[\s\S]{0,160}global\.settings\(\)/.test(concept2)) {
  throw new Error('concept2 refreshVisibleUi must not call settings() (scroll jump)');
}
if (!whoop.includes("if (tab === 'settings') return")) {
  throw new Error('whoop refreshVisibleUi must early-return on settings tab');
}

const coachSync = readFileSync(join(dir, 'coach-sync.js'), 'utf8');
if (!coachSync.includes("global.S.tab === 'settings'")) {
  throw new Error('coach-sync must not render() on settings tab');
}

console.log('account-sync-checkin.smoke: ok');
