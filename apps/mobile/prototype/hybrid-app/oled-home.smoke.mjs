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
must(html.includes("LOCAL_BUILD='the-hybrid-athlete-blank-v180'"), 'LOCAL_BUILD v180');

console.log('oled-home.smoke: ok');
