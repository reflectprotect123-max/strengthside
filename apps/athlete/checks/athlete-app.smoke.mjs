import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const root = join(dir, '..');
const failures = [];
function must(c, m) {
  if (!c) failures.push(m);
}

must(existsSync(join(root, 'index.html')), 'index.html');
must(existsSync(join(root, 'brain-bundle.js')), 'brain-bundle.js — run pnpm run build:brain');
must(existsSync(join(root, 'home.css')), 'home.css');
must(!readFileSync(join(root, 'index.html'), 'utf8').includes('THE-builder-clean'), 'old storage/build id in index');
must(readFileSync(join(root, 'app.js'), 'utf8').includes('THE-brain-v1'), 'brain storage key');
must(readFileSync(join(root, 'app.js'), 'utf8').includes('gauge-row'), 'home gauge row');
must(readFileSync(join(root, 'index.html'), 'utf8').includes('Talk to coach'), 'fab coach action');

if (failures.length) {
  console.error('athlete-app.smoke FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('athlete-app.smoke: ok');
