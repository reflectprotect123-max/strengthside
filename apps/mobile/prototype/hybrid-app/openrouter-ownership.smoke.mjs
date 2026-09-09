/**
 * OpenRouter ownership — athlete site is PROXY-ONLY for brain-coach.
 * OPENROUTER_API_KEY lives on thehybridengine1.netlify.app (hybrid1).
 *
 * Run: node apps/mobile/prototype/hybrid-app/openrouter-ownership.smoke.mjs
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const previewFn = join(dir, '../../preview-site/netlify/functions');
const protoFn = join(dir, 'netlify/functions');
const OWNER_HOST = 'thehybridengine1.netlify.app';

const failures = [];
function must(cond, msg) {
  if (!cond) failures.push(msg);
}

function read(p) {
  return readFileSync(p, 'utf8');
}

for (const label of ['prototype', 'preview-site']) {
  const fnDir = label === 'prototype' ? protoFn : previewFn;
  const coach = join(fnDir, 'brain-coach.mjs');
  must(existsSync(coach), `${label}: missing brain-coach.mjs`);
  const src = read(coach);
  must(src.includes('proxyHybrid'), `${label}: brain-coach must proxy to hybrid1`);
  must(!src.includes('OPENROUTER_API_KEY'), `${label}: brain-coach must not read OPENROUTER on athlete site`);
  must(!src.includes('openrouter.ai'), `${label}: brain-coach must not call OpenRouter on athlete site`);
}

const proxy = read(join(previewFn, '_hybrid-proxy.mjs'));
must(proxy.includes(OWNER_HOST), '_hybrid-proxy must forward to hybrid1');

const ownerCoach = join(dir, '../../../../scripts/hybrid1-coach/netlify/functions/brain-coach.mjs');
must(existsSync(ownerCoach), 'missing scripts/hybrid1-coach/netlify/functions/brain-coach.mjs');
must(read(ownerCoach).includes('OPENROUTER_API_KEY'), 'hybrid1 brain-coach must use OPENROUTER_API_KEY');

if (failures.length) {
  console.error('openrouter-ownership.smoke: FAIL');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}
console.log('openrouter-ownership.smoke: ok');
