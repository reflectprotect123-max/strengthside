import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const root = join(dir, '..');
const css = readFileSync(join(root, 'home.css'), 'utf8');
const js = readFileSync(join(root, 'app.js'), 'utf8');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const worker = readFileSync(join(root, 'service-worker.js'), 'utf8');
const failures = [];
function must(c, m) {
  if (!c) failures.push(m);
}

must(existsSync(join(root, 'index.html')), 'index.html');
for (const name of ['brain-bundle.js', 'brain-kernel.js', 'adaptive-bundle.js']) {
  must(!html.includes(name), `index.html must not load ${name}`);
  must(!worker.includes(name), `service worker must not cache ${name}`);
}
must(existsSync(join(root, 'home.css')), 'home.css');
must(!html.includes('THE-builder-clean'), 'old storage/build id in index');
must(js.includes('THE-brain-v1'), 'brain storage key');
must(js.includes('ath-whoop-dials'), 'OLED WHOOP dial row');
must(js.includes('${calendarHtml()}') && js.indexOf('${calendarHtml()}') < js.indexOf('${gaugeRowHtml()}'), 'calendar week above WHOOP dials');
must(existsSync(join(root, 'vendor/supabase.min.js')), 'vendor/supabase.min.js');
must(html.includes('vendor/supabase.min.js'), 'local Supabase bundle');
must(js.includes('whoopDialSvg'), 'SVG arc dials');
must(js.includes('function whoopRecoveryColor'), 'WHOOP recovery zone colors');
must(css.includes('--oled-bg'), 'OLED tokens in home.css');
must(css.includes('Barlow Condensed'), 'display typography');
must(html.includes('native-bridge.js'), 'Capgo native bridge');
must(js.includes('function otaBannerHtml'), 'settings OTA banner');
must(html.includes('Talk to coach'), 'fab coach action');
must(html.includes('id="coachSheet"'), 'coach lives in + sheet');
must(!html.includes('data-tab="chat"'), 'no Chat tab — coach is + only');
must(js.includes("Whoop.fnUrl('brain-coach')"), 'coach uses Edge brain-coach on native');
must(js.includes('function trainingTabHtml'), 'training tab screen');
must(js.includes('TRAINING_DEMO'), 'HPP training demo plan');
must(css.includes('.shell-screen--training'), 'training screen styles');
must(css.includes('.trn-scroll'), 'training scroll container');
must(html.includes('id="logger"'), 'logger overlay host');
must(html.includes('logger.css'), 'logger stylesheet');
must(html.includes('session.js'), 'session model script');
must(html.includes('library.js'), 'library model script');
must(html.includes('library-ui.js'), 'library view script');
must(html.includes('plan-sync.js'), 'plan sync script');
must(html.includes('library.css'), 'library stylesheet');
must(readFileSync(join(root, 'library.css'), 'utf8').includes('margin: 8px 16px calc(var(--fab-size) + 24px)'), 'library Add Circuit row clears the FAB');
must(js.includes('function openLibraryForDay'), 'library calendar door');
must(readFileSync(join(root, 'service-worker.js'), 'utf8').includes('./library.js'), 'library.js in SW cache');
must(readFileSync(join(root, 'service-worker.js'), 'utf8').includes('./plan-sync.js'), 'plan-sync.js in SW cache');
must(worker.includes("CACHE = 'the-brain-v20'"), 'SW cache bump v20');
must(readFileSync(join(root, 'service-worker.js'), 'utf8').includes("url.origin !== self.location.origin"), 'SW does not intercept WHOOP Edge');
must(readFileSync(join(root, 'plan-sync.js'), 'utf8').includes("DOMAIN_FALLBACK = 'strength'"), 'plan sync falls back to hosted strength domain');
must(html.includes('hybrid-sc.js'), 'hybrid-sc.js in index.html');
must(html.includes('hybrid-integrations.js'), 'hybrid-integrations.js in index.html');
must(readFileSync(join(root, 'service-worker.js'), 'utf8').includes('./hybrid-sc.js'), 'hybrid-sc.js in SW cache');
must(readFileSync(join(root, 'service-worker.js'), 'utf8').includes('./hybrid-integrations.js'), 'hybrid-integrations.js in SW cache');
must(js.includes('HybridIntegrations.bootSync'), 'boot runs full sync on open');
must(js.includes('HybridIntegrations.mergeIntoState'), 'shared WHOOP merges on load');
must(html.includes('Hybrid Strength'), 'Hybrid Strength title');
must(js.includes('HybridSc.brandHtml()'), 'Home brand uses the Strength-only brand');
must(js.includes('HybridSc.dotsHtml') && js.includes('S.hybridOccupancy'), 'calendar dots from hybrid occupancy');
must(js.includes('HybridSc.lockerCardHtml()'), 'Me shows the Strength product card');
must(!js.includes('switchHybridLocker'), 'no conditioning locker switch');
must(!js.includes('engine_side') && !js.includes('peekEngineOccupancy'), 'no conditioning calendar sync');
must(readFileSync(join(root, 'timer.js'), 'utf8').includes('Rest Timer'), 'rest timer picker');
must(readFileSync(join(root, 'logger.js'), 'utf8').includes('Select Timer'), 'Select Timer chrome');
must(readFileSync(join(root, 'session.js'), 'utf8').includes("logMode: 'superset'"), 'F1/F2 same-page pairing');
must(readFileSync(join(root, 'logger.js'), 'utf8').includes('log-ss-member'), 'stacked superset paint');
must(readFileSync(join(root, 'plan-sync.js'), 'utf8').includes('strength_side'), 'plan domain strength_side');
must(readFileSync(join(root, 'plan-sync.js'), 'utf8').includes('upsert_athlete_domain_snapshot'), 'plan uses snapshot RPC not a new table');
must(readFileSync(join(root, 'plan-sync.js'), 'utf8').includes('STALE_REV'), 'stale revision handling');
must(!readFileSync(join(root, 'plan-sync.js'), 'utf8').includes('whoop-sync'), 'plan sync is not the WHOOP proxy');
must(!js.includes('copyTraining'), 'Me has no Copy training button — plan sync is silent when signed in');
must(!html.includes('Copy training'), 'no Copy training chrome');
{
  const meStart = js.indexOf('function meHtml()');
  const meEnd = js.indexOf('\nfunction setTab(', meStart);
  const meFn = meStart >= 0 && meEnd > meStart ? js.slice(meStart, meEnd) : '';
  must(meFn.includes('Whoop.syncAll') || meFn.includes('Whoop.connect'), 'Me still has WHOOP actions');
  must(!/Copy training|PlanSync|statusLine|last copied|Library \+ sessions/i.test(meFn), 'Me HTML does not mention plan sync');
}
must(js.includes('PlanSync.schedulePush'), 'plan sync still runs on save');
must(readFileSync(join(root, 'hybrid-integrations.js'), 'utf8').includes('PlanSync.syncNow'), 'plan sync runs on boot');
must(js.includes('function startTrainingSession'), 'Start Session entry');
must(js.includes('const plan = trainingPlanForDate(S.selectedDate);'), 'Home and Training use the same scheduled plan');
must(js.includes('function historyHtml') && js.includes('function openHistory'), 'Me provides a Training history route');
must(html.includes('data-tab="progress"') && html.includes('<span>Progress</span>'), 'Progress is a bottom navigation tab');
must(js.includes('function progressHtml') && js.includes('function completeDailyProgressCheckin'), 'Progress has a daily record-only check-in');
must(js.includes("'Progress — daily check-in needed'"), 'Progress exposes the daily check-in reminder accessibly');
must(css.includes('needs-checkin::before') && css.includes('rgba(22, 236, 6'), 'Progress check-in reminder has a green halo');
must(readFileSync(join(root, 'logger.js'), 'utf8').includes("const title = s.title || 'Completed session';"), 'completion summary uses the actual session title');
must(!readFileSync(join(root, 'logger.js'), 'utf8').includes('<h2 class="log-title">Heavy Lower</h2>'), 'completion summary has no hardcoded workout title');

if (failures.length) {
  console.error('athlete-app.smoke FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('athlete-app.smoke: ok');
