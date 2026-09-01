/**
 * Smoke: athlete strength builder uses logger 1:1 cards per lift.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const dir = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(dir, 'index.html'), 'utf8');
const logColumnsSrc = readFileSync(join(dir, 'log-columns.js'), 'utf8');

function must(cond, msg) {
  if (!cond) throw new Error(msg);
}

must(html.includes('LogColumns.builderAthleteTwinHtml'), 'builderAthleteTwinHtml wired in index');
must(html.includes('ath-lift-logger'), 'ath-lift-logger card class');
must(html.includes('ath-builder-twin-static'), 'static slider/next chrome');
must(html.includes('builder-phase-stack'), 'builder phase stack CSS');
must(html.includes('builder-phase-preview'), 'rest preview CSS');
must(html.includes('ath-builder-twin-static .btn.primary'), 'disabled-looking builder buttons');
must(html.includes('function athleteLiftRepOnly'), 'rep-only layout helper');
must(html.includes('data-rest-line'), 'live rest progress line');
must(html.includes('builder-metric-select'), 'metric dropdown class in CSS or twin');

const sandbox = {
  window: {},
  console,
  document: { getElementById: () => null, querySelector: () => null, createElement: () => ({ innerHTML: '', firstChild: null, replaceWith() {} }) },
  S: {},
  StrengthAdapter: { repProgressionLift: () => false },
  formatMmSs: (sec) => {
    sec = Math.max(0, Math.round(Number(sec) || 0));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  },
  RestOverlay: {
    render(o) {
      return '<div class="logger-rest dial-strength"><div class=rest-time>' + (o.remainingSec || 0) + '</div></div>';
    },
  },
};
sandbox.window = sandbox;
vm.runInNewContext(logColumnsSrc, sandbox);
const LC = sandbox.LogColumns;
must(LC && LC.builderAthleteTwinHtml, 'LogColumns.builderAthleteTwinHtml export');

const twin = LC.builderAthleteTwinHtml(
  {
    name: 'Bench Press',
    restSec: 150,
    logColumns: [
      { id: 'a', kind: 'weight_pct_wm', value: '', values: [''] },
      { id: 'b', kind: 'reps', value: '', values: [''] },
    ],
  },
  { bi: 0, ei: 0 },
);
must(twin.includes('Hybrid Strength · builder'), 'builder eyebrow');
must(twin.includes('disabled>Next set'), 'Next set disabled');
must(twin.includes('disabled>+ Extra set'), 'Extra set disabled');
must(twin.includes('Rest (seconds)'), 'rest row');
must(twin.includes('setAthleteLiftColumnKind'), 'metric dropdown handlers');
must(twin.includes('setAthleteLiftRest'), 'rest input handler');
must(twin.includes('builder-phase-stack'), 'phase stack wrapper');
must(twin.includes('Rest · between sets'), 'rest preview eyebrow');
must(twin.includes('Set 1 logged'), 'rest progress line');
must(twin.includes('logger-rest'), 'rest ring preview');
must(!twin.includes('autopilot-strip'), 'no coach autopilot strip');

const repOnly = LC.builderAthleteTwinHtml(
  { name: 'Pull-up', restSec: 90, logColumns: [{ id: 'c', kind: 'reps', value: '', values: [''] }] },
  { bi: 0, ei: 1 },
);
must(repOnly.includes('metric-col-single'), 'rep-only single column layout');
must(!repOnly.includes('metric-sep'), 'rep-only has no load × effort sep');

console.log('athlete-builder-logger.smoke: ok');
