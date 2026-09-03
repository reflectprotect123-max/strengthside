/**
 * Smoke: Library keeps Full Body A + Aerobic Conditioning + Recovery starters on athlete builders.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(dir, 'index.html'), 'utf8');

function must(cond, msg) {
  if (!cond) throw new Error(msg);
}

must(html.includes("STARTER_STRENGTH_NAMES=['Full Body A']"), 'strength starter list');
must(html.includes("STARTER_CONDITIONING_NAMES=['Aerobic Conditioning']"), 'conditioning starter list');
must(html.includes("STARTER_RECOVERY_NAMES=['Recovery']"), 'recovery starter list');
must(html.includes('function buildStarterAerobicCondTemplate'), 'aerobic starter factory');
must(html.includes('function buildStarterRecoveryTemplate'), 'recovery starter factory');
must(html.includes('function isRecoveryTemplate'), 'recovery template helper');
must(html.includes("groupedTemplates('Recovery','cond-recovery'"), 'Engine tab recovery section');
must(html.includes('isRecovery:false'), 'cond builder tracks recovery mode');
must(html.includes('block.recoverySession=true'), 'cond builder saves recovery flag');
must(!html.includes('restoreHiddenTemplates'), 'no restore-hidden library UX');
must(html.includes("touchRecord(copy,'templates',state)"), 'starter touchRecord passes boot state');
must(html.includes('function buildStarterFullBodyATemplate'), 'Full Body A starter factory');
must(html.includes('function starterStrengthNeedsRefresh'), 'Full Body A starter refresh guard');
must(html.includes('upsertNamedStarter(state,name,buildStarterFullBodyATemplate'), 'Full Body A upsert on boot');
must(html.includes('repairProgramText(state,false)'), 'starters repair warm/cool text');

const start = html.indexOf('const seed=');
let i = html.indexOf('=', start) + 1;
while (html[i] === ' ') i += 1;
let depth = 0;
let inStr = false;
let esc = false;
let quote = '';
let seed = null;
for (let j = i; j < html.length; j++) {
  const c = html[j];
  if (inStr) {
    if (esc) {
      esc = false;
      continue;
    }
    if (c === '\\') {
      esc = true;
      continue;
    }
    if (c === quote) inStr = false;
    continue;
  }
  if (c === '"' || c === "'") {
    inStr = true;
    quote = c;
    continue;
  }
  if (c === '{') depth++;
  else if (c === '}') {
    depth--;
    if (depth === 0) {
      seed = JSON.parse(html.slice(i, j + 1));
      break;
    }
  }
}
must(seed, 'seed parse failed');
must((seed.templates || []).some((t) => t && t.name === 'Full Body A'), 'seed still has Full Body A');

console.log('starter-templates.smoke: ok');
