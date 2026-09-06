/**
 * Smoke: Chassis Phase H honest-sync copy.
 * Sync must honestly describe scope: WHOOP recovery + Concept2 Logbook only —
 * sessions/templates stay on-device. Must NOT claim calendar/templates cloud sync.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const whoop = readFileSync(join(dir, 'whoop.js'), 'utf8');
const html = readFileSync(join(dir, 'index.html'), 'utf8');
const combined = whoop + '\n' + html;

const onDeviceRe = /sessions and templates stay on this device/i;
if (!onDeviceRe.test(combined)) {
  throw new Error('whoop.js/index.html missing on-device sessions/templates honesty copy');
}

if (!combined.includes('Sync WHOOP & Concept2')) {
  throw new Error('Sync WHOOP & Concept2 button label missing');
}

const dishonestPhrases = [
  /templates sync/i,
  /sessions sync to cloud/i,
  /calendar templates sync/i,
  /calendar sync/i,
];
for (const re of dishonestPhrases) {
  if (re.test(combined)) {
    throw new Error(`Dishonest sync claim found matching ${re}`);
  }
}

console.log('chassis-honest-sync.smoke: ok');
