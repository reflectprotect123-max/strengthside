/**
 * Smoke: blank-slate boot — Engine + Recovery only after strength cut; cache pin.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

function must(cond, msg) {
  if (!cond) throw new Error(msg);
}

const dir = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(dir, 'index.html'), 'utf8');
const sw = readFileSync(join(dir, 'service-worker.js'), 'utf8');

must(html.includes("LOCAL_BUILD='the-hybrid-athlete-blank-v191'"), 'LOCAL_BUILD v191');
must(sw.includes("const CACHE = 'the-hybrid-athlete-blank-v191'"), 'SW v191');
must(!/trainheroic|TrainHeroic|TRAINHEROIC/i.test(html), 'athlete app has no TrainHeroic code');
must(!html.includes('for(const core of seed.exercises)'), 'no auto core exercise seed on boot');
must(!html.includes('function libraryExercisesTab'), 'no Library Exercises tab');
must(html.includes('function defaultState()'), 'defaultState present');
must(html.includes('x.templates=[];x.sessions=[]'), 'defaultState starts blank');
must(html.includes('x.exercises=[]'), 'defaultState starts with empty exercises');
must(html.includes('BLANK_SLATE_VERSION='), 'blank slate migration version');
must(html.includes('function ensureStarterTemplates'), 'ensure starter templates');
must(html.includes('strengthCutV1'), 'strength cut migrate marker');
const ensureBlock = html.slice(
  html.indexOf('function ensureStarterTemplates'),
  html.indexOf('function applyCalendarCleanPatch'),
);
must(!ensureBlock.includes('ensureFullBodyAStarter(state)'), 'no Full Body A seed in ensureStarterTemplates');
must(!html.includes('StrengthAdapter'), 'no StrengthAdapter');
must(!html.includes('EngineAdapter'), 'no EngineAdapter');
must(!html.includes('BigMacBridge'), 'no BigMacBridge');
must(!html.includes("['StrengthAdapter'"), 'no Proxy name list');
must(!/\bAutopilot\b/.test(html), 'no Autopilot label');
must(html.includes('openVolume'), 'openVolume field present');

console.log('blank-slate-wm.smoke: ok');
