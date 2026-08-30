/**
 * Pre-flight checks before owner phone proof (backlog items 2–6, 13).
 * Runs release URL checks + points at the smoke suite to run locally.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const dir = dirname(fileURLToPath(import.meta.url));
const root = join(dir, '../../../..');

const handoff = readFileSync(join(root, 'handoff.md'), 'utf8');
const capgoMatch = handoff.match(/dogfood` @ `([\d.]+)`/);
if (!capgoMatch) throw new Error('handoff missing Capgo version');
console.log('Capgo channel version:', capgoMatch[1]);

const urls = [
  'https://thehybridsystem.netlify.app/',
  'https://thehybridsystem.netlify.app/coach.html',
  'https://github.com/reflectprotect123-max/strengthside/releases/tag/dogfood-latest',
  'https://github.com/reflectprotect123-max/strengthside/releases/tag/coach-desktop-latest',
];

for (const url of urls) {
  const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
  if (!res.ok) throw new Error(`URL check failed ${url}: ${res.status}`);
  console.log('OK', url);
}

const smokes = [
  'coach-v1-e2e.smoke.mjs',
  'coach-portal-athlete.smoke.mjs',
  'dogfood-debt.smoke.mjs',
  'big-mac-bridge.smoke.mjs',
];

for (const file of smokes) {
  const proc = spawnSync('node', [join(dir, file)], { encoding: 'utf8' });
  if (proc.status !== 0) {
    console.error(proc.stdout || proc.stderr);
    throw new Error(`smoke failed: ${file}`);
  }
  console.log('smoke ok:', file);
}

console.log('dogfood-proof-prep: ok — ready for phone proof (see handoff.md §2)');
