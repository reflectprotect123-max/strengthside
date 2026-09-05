import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

function must(cond, msg) {
  if (!cond) throw new Error(msg);
}

must(html.includes('--oled-bg:#000000'), 'OLED page black token');
must(html.includes('--oled-surface:#121212'), 'OLED surface token');
must(html.includes('--oled-raised:#1C1C1E'), 'OLED raised surface token');
must(html.includes('--oled-text:#FFFFFF'), 'OLED text token');
must(html.includes('--oled-muted:#8E8E93'), 'OLED muted token');
must(/#9[Dd][Bb]4[Cc]8/.test(html), 'sleep dial color preserved');
must(/#16[Ff]26[Bb]/.test(html), 'recovery dial color preserved');
must(/#1[Bb][Aa]3[Ff][Ff]/.test(html), 'strain dial color preserved');
const homeBriefingBlock = html.match(/function homeBriefingHtml[\s\S]*?\nfunction home\(/)[0];
const homeBlock = html.match(/function home\(\)[\s\S]*?\nfunction openAthleteStrengthBuilder/)[0];
must(homeBlock.includes('shell-screen--oled'), 'shell-screen--oled in home()');
must(homeBriefingBlock.includes('oled-cta'), 'oled-cta in homeBriefingHtml');
must(html.includes('var(--oled-bg)'), 'Home uses --oled-bg');
must(html.includes('var(--oled-surface)'), 'Home uses --oled-surface');
must(!/Training load below/.test(html), 'no stale Training load below copy');
must(!/btn primary block/.test(homeBriefingBlock), 'homeBriefingHtml has no gold primary brick');
must(html.includes("LOCAL_BUILD='the-hybrid-athlete-blank-v182'"), 'LOCAL_BUILD v182');

must(!/radial-gradient\([^\)]*rgba\(212,\s*165,\s*116/.test(html.match(/body\{[\s\S]*?\n\}/)?.[0] || ''), 'body has no copper radial wash');
must(html.includes('.nav') && html.includes('var(--oled-bg)'), 'nav uses OLED tokens OR body background uses --oled-bg');
must(html.includes('background:var(--oled-bg)') || html.includes('background: var(--oled-bg)'), 'page uses --oled-bg');
must(!/\.btn\.primary[^{]*\{[^}]*linear-gradient\(180deg,\s*#e8c49a/i.test(html), 'global .btn.primary is not gold gradient brick');
must(html.includes('--oled-bg:#000000'), 'OLED tokens still present');

must(html.includes('.logger-screen') || html.includes('logger-active'), 'logger surface hooks exist');
must(!/\.logger-screen\s+\.btn\.primary\{[^}]*linear-gradient\(180deg,\s*#e8c49a/i.test(html), 'logger strength primary not gold brick');
must(
  !/\.logger-screen\.dial-engine\s+\.btn\.primary\{[^}]*linear-gradient\(180deg,\s*#6ed4c4/i.test(html) ||
    (html.includes('.logger-screen.dial-engine .btn.primary') && html.includes('var(--oled-raised)')),
  'logger engine primary not teal fill brick',
);
must(!html.includes('.logger-screen .btn.primary{background:linear-gradient(180deg,#e8c49a,#c9955f)'), 'no gold logger CTA brick');
must(html.includes('.logger-screen') && (html.includes('var(--oled-bg)') || html.includes('var(--oled-surface)')), 'logger OLED surfaces');
must(html.includes('Room 2') || html.includes('.app.logger-active, .logger-screen'), 'Room 2 logger OLED block');

must((html.match(/shell-screen--oled/g) || []).length >= 2, 'OLED shell used beyond Home alone');
const calendarBlock = html.match(/function calendar\(\)[\s\S]*?\nfunction sessionStatusLabel/)?.[0] || '';
must(calendarBlock.includes('shell-screen--oled'), 'shell-screen--oled in calendar()');
const programsBlock = html.match(/function programs\(\)[\s\S]*?\nfunction libraryProgressTab/)?.[0] || '';
must(programsBlock.includes('shell-screen--oled'), 'shell-screen--oled in programs()');
const settingsBlock = html.match(/function settings\(\)[\s\S]*?function downloadJson/)?.[0] || '';
must(settingsBlock.includes('shell-screen--oled'), 'shell-screen--oled in settings()');
const progressBlock = html.match(/function libraryProgressTab\(\)[\s\S]*?\nfunction libraryStrengthTab/)?.[0] || '';
must(progressBlock.includes('shell-screen--oled'), 'shell-screen--oled in libraryProgressTab()');
must(html.includes('.shell-screen--oled .ath-cal-day'), 'calendar days OLED-scoped');
must(html.includes('.shell-screen--oled .library-tab'), 'library tabs OLED-scoped');
must(html.includes('.shell-screen--oled .settings-group'), 'settings OLED-scoped');

must(html.includes('<small>Athlete</small>'), 'brand subtitle is Athlete (not Track Dawn)');
must(!/<small>[^<]*Track Dawn[^<]*<\/small>/.test(html), 'Track Dawn brand line removed');
must(html.includes('size:92'), 'Home dials enlarged for OLED hierarchy');
must(html.includes('background:#fff') && html.includes('.btn.oled-cta'), 'Home CTA is high-contrast white');
must(html.includes('.shell-screen--oled .ath-module-whoop') && /ath-module-whoop\{[^}]*background:transparent/.test(html), 'WHOOP dials float on true black');

console.log('oled-home.smoke: ok');
