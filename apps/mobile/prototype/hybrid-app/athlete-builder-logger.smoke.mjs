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
must(html.includes('builderSupersetTwinHtml'), 'builderSupersetTwinHtml wired');
must(html.includes('ath-lift-superset'), 'merged superset card CSS');
must(html.includes('athleteSupersetEditor'), 'merged superset editor');
must(html.includes('removeSupersetPair'), 'delete superset pair');
must(!html.includes('data-rest-line'), 'builder no longer shows logger rest countdown line');
must(logColumnsSrc.includes('Rest (seconds)'), 'builder keeps rest seconds input');
must(html.includes('function setAthleteLiftTargetRir'), 'target RIR calibration handler');
must(html.includes('function setAthleteLiftSideMode'), 'sideMode handler');
must(html.includes('function athleteLiftRepOnly'), 'rep-only layout helper');
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
must(twin.includes('How should this feel'), 'builder target-effort calibration slider');
must(twin.includes('setAthleteLiftTargetRir'), 'calibration slider handler');
must(!twin.includes('How hard was that set'), 'no post-set logger slider in builder');
must(twin.includes('Rest (seconds)'), 'rest row');
must(twin.includes('L+R per round'), 'side mode select');
must(!twin.includes('Rest · between sets'), 'no rest timer preview in builder');
must(!twin.includes('builder-phase-preview'), 'no rest phase preview stack');
must(!twin.includes('builder-phase-stack'), 'single builder card only');
must(!twin.includes('autopilot-strip'), 'no coach autopilot strip');

const ssTwin = LC.builderSupersetTwinHtml(
  {
    name: 'Bench Press',
    restSec: 120,
    logColumns: [
      { id: 'a', kind: 'weight_pct_wm', value: '', values: [''] },
      { id: 'b', kind: 'reps', value: '', values: [''] },
    ],
  },
  {
    name: 'Barbell Row',
    restSec: 90,
    logColumns: [
      { id: 'c', kind: 'weight_pct_wm', value: '', values: [''] },
      { id: 'd', kind: 'reps', value: '', values: [''] },
    ],
  },
  { bi: 0, eiA: 0, eiB: 1 },
);
must(ssTwin.includes('ath-builder-superset'), 'superset builder class');
must(ssTwin.includes('Superset · builder'), 'superset eyebrow');
must(!ssTwin.includes('Round 1 / 3'), 'no logger round progress in builder');
must(!ssTwin.includes('A1 → B1'), 'no superset pill in builder');
must(!ssTwin.includes('Rest · between partners'), 'no partner rest timer preview');
must(!ssTwin.includes('Rest · between rounds'), 'no round rest timer preview');
must(ssTwin.includes('ath-ss-lift-a'), 'lift A panel');
must(ssTwin.includes('ath-ss-lift-b'), 'lift B panel');

const repOnly = LC.builderAthleteTwinHtml(
  { name: 'Pull-up', restSec: 90, logColumns: [{ id: 'c', kind: 'reps', value: '', values: [''] }] },
  { bi: 0, ei: 1 },
);
must(repOnly.includes('metric-col-single'), 'rep-only single column layout');
must(!repOnly.includes('metric-sep'), 'rep-only has no load × effort sep');

console.log('athlete-builder-logger.smoke: ok');
