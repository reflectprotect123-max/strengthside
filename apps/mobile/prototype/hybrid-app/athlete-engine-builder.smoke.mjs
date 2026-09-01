/**
 * Smoke: athlete Engine builder uses logger 1:1 card with inline fields.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const dir = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(dir, 'index.html'), 'utf8');
const loggerSrc = readFileSync(join(dir, 'cond-session-logger.js'), 'utf8');

function must(cond, msg) {
  if (!cond) throw new Error(msg);
}

must(html.includes('CondSessionLogger.builderAthleteHtml'), 'builderAthleteHtml wired');
must(html.includes('eng-builder-shell'), 'engine builder shell');
must(html.includes('eng-builder-stack'), 'engine builder stack CSS');
must(html.includes('eng-builder-phase'), 'engine builder phase preview CSS');
must(!html.includes('Athlete logger preview'), 'old preview-only twin copy removed from builder path');

const sandbox = {
  window: {},
  console,
  formatMmSs: (sec) => {
    sec = Math.max(0, Math.round(Number(sec) || 0));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m + ':' + String(s).padStart(2, '0');
  },
  condPlanLineFromParts: (o) =>
    `${o.modality || 'Bike'} · ${o.rounds || 1}×4:00 / 3:00 · Medium`,
  COND_FORMATS: [{ key: 'intervals', name: 'Intervals' }],
  COND_MODALITIES: ['Bike'],
  COND_EFFORTS: [{ key: 'medium', name: 'Medium', zoneKey: 'aerobic', cue: 'short' }],
  athHomeMetrics: () => ({ recovery: 71 }),
  athZonesForReadiness: () => [{ key: 'aerobic', name: 'Medium', lo: 142, hi: 158 }],
  RestOverlay: {
    render(o) {
      return '<div class="logger-rest dial-engine"><div class=rest-time>' + (o.remainingSec || 0) + '</div></div>';
    },
  },
};
sandbox.window = sandbox;
vm.runInNewContext(loggerSrc, sandbox);
const CSL = sandbox.CondSessionLogger;
must(CSL && CSL.builderAthleteHtml, 'builderAthleteHtml export');

const interval = CSL.builderAthleteHtml({
  name: 'Row ERG',
  condFmt: 'intervals',
  modality: 'Rower',
  effort: 'medium',
  rounds: 8,
  workSec: 240,
  restSec: 180,
  targetWatts: 152,
});
must(interval.includes('eng-builder-twin'), 'interval builder twin class');
must(interval.includes('eng-builder-fields'), 'inline builder fields');
must(interval.includes('setCondFmt'), 'format handler');
must(interval.includes('setCondEffort'), 'effort handler');
must(interval.includes('disabled>End interval'), 'static End interval');
must(interval.includes('eng-builder-stack'), 'interval stack wrapper');
must(interval.includes('Recover · between work'), 'rest preview eyebrow');
must(interval.includes('Session recap'), 'recap preview eyebrow');
must(interval.includes('logger-rest'), 'rest ring preview');
must(interval.includes('recap-grid'), 'recap grid preview');
must(interval.includes('The Engine · builder'), 'builder eyebrow');
must(!interval.includes('Athlete logger preview'), 'not old preview card');

const steady = CSL.builderAthleteHtml({
  name: 'Easy bike',
  condFmt: 'steady',
  modality: 'Bike',
  effort: 'easy',
  minutes: 20,
});
must(steady.includes('nudgeCondMinutes'), 'minutes nudge');
must(steady.includes('Session recap'), 'steady recap preview');
must(steady.includes('disabled>Finish · rate session'), 'static finish CTA');
must(!steady.includes('Recover · between work'), 'steady has no rest preview');

const recovery = CSL.builderAthleteHtml({
  name: 'Recovery',
  isRecovery: true,
  condFmt: 'steady',
  modality: 'Mixed',
  effort: 'easy',
  minutes: 20,
});
must(recovery.includes('Session recap'), 'recovery recap preview');
must(recovery.includes('disabled>Finish recovery'), 'recovery finish CTA');

console.log('athlete-engine-builder.smoke: ok');
