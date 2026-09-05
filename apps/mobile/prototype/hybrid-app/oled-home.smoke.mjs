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

console.log('oled-home.smoke: tokens ok');
