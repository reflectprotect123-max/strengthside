import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const root = join(dir, '..');
const css = readFileSync(join(root, 'home.css'), 'utf8');
const js = readFileSync(join(root, 'app.js'), 'utf8');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const failures = [];
function must(c, m) {
  if (!c) failures.push(m);
}

const repo = join(root, '..', '..');
must(existsSync(join(root, 'index.html')), 'index.html');
must(!existsSync(join(root, 'brain-bundle.js')), 'hub brain bundle is gone');
must(!existsSync(join(repo, 'packages/brain/package.json')), 'hub brain package is gone');
must(!existsSync(join(repo, 'scripts/bundle-brain.mjs')), 'hub brain bundler is gone');
must(existsSync(join(root, 'brain-kernel.js')), 'engine zone kernel remains');
must(existsSync(join(repo, 'packages/adaptive/src/decide-next-cond.ts')), 'adaptive engine next remains');
must(existsSync(join(root, 'engine.js')), 'engine.js');
must(existsSync(join(root, 'home.css')), 'home.css');
must(!html.includes('THE-builder-clean'), 'old storage/build id in index');
must(html.includes('hybrid-product" content="engine"'), 'index hybrid-product engine');
must(js.includes('THE-hybrid-engine-v1'), 'engine storage key');
must(js.includes('ath-whoop-dials'), 'OLED WHOOP dial row');
must(js.includes('${calendarHtml()}') && js.indexOf('${calendarHtml()}') < js.indexOf('${gaugeRowHtml()}'), 'calendar week above WHOOP dials');
must(existsSync(join(root, 'vendor/supabase.min.js')), 'vendor/supabase.min.js');
must(html.includes('vendor/supabase.min.js'), 'local Supabase bundle');
must(js.includes('whoopDialSvg'), 'SVG arc dials');
must(js.includes('function whoopRecoveryColor'), 'WHOOP recovery zone colors');
must(css.includes('--oled-bg'), 'OLED tokens in home.css');
must(css.includes('Barlow Condensed'), 'display typography');
must(css.includes('Space Grotesk'), 'OLED Home body face');
must(html.includes('native-bridge.js'), 'Capgo native bridge');
must(js.includes('function otaBannerHtml'), 'settings OTA banner');
must(!html.includes('Talk to coach'), 'athlete has no coach chat');
must(!html.includes('id="coachSheet"'), 'athlete has no coach sheet');
must(!html.includes('data-tab="chat"'), 'no Chat tab');
must(!js.includes("Whoop.fnUrl('brain-coach')"), 'athlete does not call the coach edge');
must(!js.includes('function askCoach'), 'athlete has no askCoach');
must(!/\bHybridBrain\b/.test(js), 'athlete does not call the hub brain');
must(!js.includes('function todayCallHtml'), 'home has no hub today-call');
must(js.includes('function render()'), 'engine shell still paints the home screen');
must(!html.includes('brain-bundle.js'), 'index does not load the hub brain');
must(js.includes('function trainingTabHtml'), 'training tab screen');
must(!js.includes('TRAINING_DEMO'), 'no strength demo plan');
must(css.includes('.shell-screen--training'), 'training screen styles');
must(css.includes('.trn-scroll'), 'training scroll container');
must(html.includes('id="logger"'), 'logger overlay host');
must(html.includes('logger.css'), 'logger stylesheet');
must(html.includes('session.js'), 'session model script');
must(html.includes('library.js'), 'library model script');
must(html.includes('library-ui.js'), 'library view script');
must(html.includes('plan-sync.js'), 'plan sync script');
must(html.includes('library.css'), 'library stylesheet');
must(html.includes('engine-config.js'), 'index loads engine-config');
must(html.includes('engine.js'), 'index loads engine.js');
must(!html.includes('strength-config.js'), 'index does not load strength-config');
must(readFileSync(join(root, 'library.css'), 'utf8').includes('margin: 8px 16px calc(var(--fab-size) + 24px)'), 'library Add Circuit row clears the FAB');
must(js.includes('function openLibraryForDay'), 'library calendar door');
must(readFileSync(join(root, 'service-worker.js'), 'utf8').includes('./library.js'), 'library.js in SW cache');
must(readFileSync(join(root, 'service-worker.js'), 'utf8').includes('./plan-sync.js'), 'plan-sync.js in SW cache');
must(readFileSync(join(root, 'service-worker.js'), 'utf8').includes('./engine.js'), 'engine.js in SW cache');
must(readFileSync(join(root, 'service-worker.js'), 'utf8').includes("CACHE = 'the-engine-v26'"), 'SW cache bump v26');
must(!readFileSync(join(root, 'service-worker.js'), 'utf8').includes('brain-bundle.js'), 'SW cache has no hub brain bundle');
must(readFileSync(join(root, 'service-worker.js'), 'utf8').includes('./th.css'), 'th.css in SW cache');
must(readFileSync(join(root, 'th.css'), 'utf8').includes('--rx: #ff7a1a'), 'rx orange token');
must(readFileSync(join(root, 'th.css'), 'utf8').includes('--cta: #ffffff'), 'white Start Session CTA');
must(readFileSync(join(root, 'th.css'), 'utf8').includes('--font-session'), 'session face is Barlow, not Home');
must(!/html,\s*body,\s*\.shell \{[^}]*Barlow/.test(readFileSync(join(root, 'th.css'), 'utf8')), 'th.css does not Barlow the OLED shell');
must(!readFileSync(join(root, 'th.css'), 'utf8').includes('.btn.oled-cta'), 'Home OLED CTA stays outline, not TH brick');
must(!css.includes('--engine: #5ec4b7'), 'home.css engine token is not Track Dawn mint');
must(css.includes('--engine: #8e8e93'), 'home.css engine token is mute gray');
must(!css.includes('--trn-blue: #1ba3ff'), 'training chrome is not WHOOP strain blue');
must(css.includes('--strain: #1ba3ff'), 'WHOOP strain token stays on Home dials');
must(css.includes('--recovery-high: #16ec06'), 'WHOOP recovery lime stays on Home dials');
{
  const loggerJs = readFileSync(join(root, 'logger.js'), 'utf8');
  must(loggerJs.includes('stroke="#ffffff"'), 'rest ring progress stroke is white');
  must(!loggerJs.includes('stroke="#16ec06"'), 'rest ring is not WHOOP lime');
  must(!loggerJs.includes('stroke="#1ba3ff"'), 'timer switch icon is not WHOOP blue');
  must(loggerJs.includes('rotate(135 50 50)'), 'logger horseshoe opens at the bottom');
  must(loggerJs.includes('const span = 0.75'), 'logger horseshoe is a 270 degree arc');
  must(loggerJs.includes('id="engFaceHr"'), 'logger horseshoe face shows heart rate');
  must(!loggerJs.includes("if (effort === 'easy') return 'blue'"), 'easy effort does not paint the heart-rate ring blue');
  must(loggerJs.includes('hr-shoe'), 'work and rest render the heart-rate horseshoe');
}
must(js.includes('class="hr-shoe"'), 'home zones card renders the heart-rate horseshoe');
must(css.includes('.hr-shoe'), 'home.css styles the heart-rate horseshoe');
{
  const loggerCss = readFileSync(join(root, 'logger.css'), 'utf8');
  must(!loggerCss.includes('#1ba3ff'), 'logger.css has no WHOOP-blue chrome');
  must(!loggerCss.includes('var(--engine, #5ec4b7)'), 'engine clock does not fall back to mint');
}
must(readFileSync(join(root, 'th.css'), 'utf8').includes('.trn-icon-btn'), 'training icon buttons in overlay');
must(/\.trn-icon-btn[\s\S]{0,120}min-height:\s*44px/.test(readFileSync(join(root, 'th.css'), 'utf8')), 'training icon buttons meet 44px');
must(!readFileSync(join(root, 'library.css'), 'utf8').includes('background: var(--trn-blue)'), 'library primary is not WHOOP-blue');
must(!readFileSync(join(root, 'brain-kernel.js'), 'utf8').includes('decideNextStrength'), 'kernel has no lift next');
must(!readFileSync(join(root, 'brain-kernel.js'), 'utf8').includes('rememberLift'), 'kernel has no lift memory');
must(!readFileSync(join(root, 'app.js'), 'utf8').includes('liftMemory'), 'athlete state has no liftMemory');
must(!readFileSync(join(root, 'plan-sync.js'), 'utf8').includes('lift_memory'), 'plan sync does not pack lift_memory');
must(!readFileSync(join(root, 'adaptive-bundle.js'), 'utf8').includes('decideNextLift'), 'adaptive bundle has no lift next');
must(!readFileSync(join(root, 'service-worker.js'), 'utf8').includes('whoop-ios.js'), 'whoop-ios.js not in SW cache');
must(!html.includes('whoop-ios.js'), 'index does not load whoop-ios');
must(!js.includes("label: 'Steps'"), 'Home has no Steps dial');
must(readFileSync(join(root, 'service-worker.js'), 'utf8').includes("url.origin !== self.location.origin"), 'SW does not intercept WHOOP Edge');
must(readFileSync(join(root, 'plan-sync.js'), 'utf8').includes("DOMAIN_FALLBACK = 'conditioning'"), 'plan sync falls back to hosted conditioning domain');
must(html.includes('hybrid-sc.js'), 'hybrid-sc.js in index.html');
must(html.includes('hybrid-integrations.js'), 'hybrid-integrations.js in index.html');
must(readFileSync(join(root, 'service-worker.js'), 'utf8').includes('./hybrid-sc.js'), 'hybrid-sc.js in SW cache');
must(readFileSync(join(root, 'service-worker.js'), 'utf8').includes('./hybrid-integrations.js'), 'hybrid-integrations.js in SW cache');
must(js.includes('HybridIntegrations.bootSync'), 'boot runs full sync on open');
must(js.includes('HybridIntegrations.mergeIntoState'), 'shared WHOOP merges on load');
must(html.includes('The Engine'), 'The Engine title');
must(js.includes('HybridSc.brandHtml'), 'Home brand uses HybridSc');
must(!js.includes("HybridSc.brandHtml('strength')"), 'Home brand is not Strength locker');
must(js.includes('HybridSc.dotsHtml') && js.includes('S.hybridOccupancy'), 'calendar dots from hybrid occupancy');
must(!js.includes('switchHybridLocker'), 'no locker switch handler');
must(!js.includes('peekStrengthOccupancy'), 'does not peek strength occupancy');
must(!js.includes('strength_side'), 'does not peek strength_side snapshots');
must(readFileSync(join(root, 'timer.js'), 'utf8').includes('Rest Timer'), 'rest timer picker');
must(readFileSync(join(root, 'logger.js'), 'utf8').includes('Select Timer'), 'Select Timer chrome');
must(readFileSync(join(root, 'plan-sync.js'), 'utf8').includes('engine_side'), 'plan domain engine_side');
must(readFileSync(join(root, 'plan-sync.js'), 'utf8').includes('upsert_athlete_domain_snapshot'), 'plan uses snapshot RPC not a new table');
must(readFileSync(join(root, 'plan-sync.js'), 'utf8').includes('STALE_REV'), 'stale revision handling');
must(!readFileSync(join(root, 'plan-sync.js'), 'utf8').includes('whoop-sync'), 'plan sync is not the WHOOP proxy');
must(!js.includes('copyTraining'), 'Me has no Copy training button — plan sync is silent when signed in');
must(!html.includes('Copy training'), 'no Copy training chrome');
{
  const meStart = js.indexOf('function meHtml()');
  const meEnd = js.indexOf('\nfunction setTab(', meStart);
  const meFn = meStart >= 0 && meEnd > meStart ? js.slice(meStart, meEnd) : '';
  must(meFn.includes('Whoop.connect'), 'Me has Connect WHOOP');
  must(!meFn.includes('Whoop.connectTotem'), 'Me has no Totem steps login');
  must(!meFn.includes('locker-card'), 'Me has no Strength/Engine locker card');
  must(!meFn.includes('switchHybridLocker'), 'Me has no locker switch');
}
must(js.includes('PlanSync.schedulePush'), 'plan sync still runs on save');
must(readFileSync(join(root, 'hybrid-integrations.js'), 'utf8').includes('PlanSync.syncNow'), 'plan sync runs on boot');
must(js.includes('function startTrainingSession'), 'Start Session entry');
must(js.includes('trnEngineHtml'), 'training paints Engine blocks');
must(!js.includes('trnLiftHtml'), 'training does not paint lift cards');

{
  const engineIndex = readFileSync(join(root, 'engine/index.html'), 'utf8');
  must(existsSync(join(root, 'engine/index.html')), 'apps/athlete/engine/index.html');
  must(/location\.replace\('\.\.\/'\)/.test(engineIndex) || engineIndex.includes('url=../'), 'old /engine/ house redirects to athlete root');
}

if (failures.length) {
  console.error('athlete-app.smoke FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('athlete-app.smoke: ok');
