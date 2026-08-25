/**
 * Smoke: unified Whoop.syncAll + one-step check-in helpers exist in HTML/JS.
 * Settings shows Account + Concept2 only — no separate Strength/Nutrition sync cards.
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

if (strength.includes('function cardHtml')) throw new Error('StrengthSync.cardHtml should be removed');
if (nutrition.includes('function cardHtml')) throw new Error('NutritionSync.cardHtml should be removed');
if (html.includes('NutritionSync.cardHtml')) throw new Error('Settings still mounts NutritionSync.cardHtml');
if (html.includes('StrengthSync.cardHtml')) throw new Error('Settings still mounts StrengthSync.cardHtml');

if (!html.includes('ATH_CHECKIN_STEPS')) throw new Error('ATH_CHECKIN_STEPS missing');
if (!html.includes('function athCheckinAnswer')) throw new Error('athCheckinAnswer missing');
if (!html.includes('checkin-choice')) throw new Error('checkin-choice UI missing');
if (html.includes("athSleepSlider('sleepQuality'")) throw new Error('old sleepQuality slider still in check-in card');
if (!html.includes("LOCAL_BUILD='the-hybrid-athlete-engine-v68'")) throw new Error('expected cache v68');

console.log('account-sync-checkin.smoke: ok');
