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

must(existsSync(join(root, 'index.html')), 'index.html');
must(existsSync(join(root, 'brain-bundle.js')), 'brain-bundle.js — run pnpm run build:brain');
must(existsSync(join(root, 'home.css')), 'home.css');
must(!html.includes('THE-builder-clean'), 'old storage/build id in index');
must(js.includes('THE-brain-v1'), 'brain storage key');
must(js.includes('ath-whoop-dials'), 'OLED WHOOP dial row');
must(js.includes('whoopDialSvg'), 'SVG arc dials');
must(css.includes('--oled-bg'), 'OLED tokens in home.css');
must(css.includes('Barlow Condensed'), 'display typography');
must(html.includes('Talk to coach'), 'fab coach action');

if (failures.length) {
  console.error('athlete-app.smoke FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('athlete-app.smoke: ok');
