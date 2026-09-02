/**
 * Smoke: session preview + start path must not reference missing helpers.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

function must(cond, msg) {
  if (!cond) throw new Error(msg);
}

const dir = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(dir, 'index.html'), 'utf8');

must(html.includes("LOCAL_BUILD='the-hybrid-athlete-engine-v155'"), 'LOCAL_BUILD v135');
must(html.includes('function blockHelpDropdown('), 'blockHelpDropdown helper present');
must(html.includes('function strengthBlockDropdown('), 'strengthBlockDropdown helper present');
must(html.includes('function previewSession('), 'previewSession present');
must(html.includes("return sheet(`<h2>Session already in progress</h2>"), 'active-session conflict sheet');
must(html.includes('function startSession(i){'), 'startSession present');
must(html.includes('startSessionNow(i)}function startSessionNow(i){') || html.includes('</div>`);startSessionNow(i)}function startSessionNow'), 'startSession calls startSessionNow on normal path');
must(html.includes("onclick=\"startSession('${i}')\""), 'preview Start session button wired');

console.log('session-preview.smoke: ok');
