#!/usr/bin/env node
/**
 * Builder <-> logger 1:1 parity: session logging uses StrengthOneSetLogger
 * (one set at a time, logColumns hero metrics). The builder twin still
 * renders the same KINDS via LogColumns. Old all-sets Log/Edit table
 * must not come back on strengthTask.
 * Run: node apps/mobile/prototype/hybrid-app/builder-logger-parity.smoke.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(dir, 'index.html'), 'utf8');
const logColumnsSrc = readFileSync(join(dir, 'log-columns.js'), 'utf8');

function must(c, m) {
  if (!c) throw new Error(m);
}

function extractFn(src, name) {
  const start = src.indexOf('function ' + name);
  must(start >= 0, name + ' missing');
  let i = start;
  let depth = 0;
  let started = false;
  for (; i < src.length; i++) {
    const ch = src[i];
    if (ch === '{') {
      depth++;
      started = true;
    } else if (ch === '}') {
      depth--;
      if (started && depth === 0) {
        i++;
        break;
      }
    }
  }
  return src.slice(start, i);
}

// Shared kind list: same enum feeds both builder and logger metric cells.
must(logColumnsSrc.includes('const KINDS ='), 'log-columns.js exports KINDS enum');
must(logColumnsSrc.includes('function kindMeta'), 'log-columns.js exports kindMeta lookup');
must(logColumnsSrc.includes('global.LogColumns = {'), 'LogColumns global export');
must(logColumnsSrc.includes('KINDS,') && logColumnsSrc.includes('kindMeta,'), 'KINDS + kindMeta exported on LogColumns');
must(logColumnsSrc.includes('loggerCellsHtml,'), 'loggerCellsHtml exported on LogColumns');
must(logColumnsSrc.includes('function loggerCellsHtml('), 'loggerCellsHtml implementation present');

must(html.includes('strength-one-set-logger.js'), 'index.html loads one-set logger');
must(html.includes('StrengthOneSetLogger.renderTask'), 'strengthTask delegates to StrengthOneSetLogger');

const strengthTaskFn = extractFn(html, 'strengthTask');
must(strengthTaskFn.includes('StrengthOneSetLogger.renderTask'), 'strengthTask body must call StrengthOneSetLogger.renderTask');
must(!strengthTaskFn.includes('setrow'), 'strengthTask must not render the old all-sets table');
must(!strengthTaskFn.includes('LogColumns.loggerCellsHtml'), 'session logger is one-set, not loggerCellsHtml table');
must(!html.includes("exerciseLinkHtml(t.name,t.exerciseId,t.category,'Exercise history')"), 'old Exercise history table title must stay gone from session logger');
must(html.includes('function routeBuilderLiftToLogger'), 'builder→logger flatten helper exists');
must(extractFn(html, 'flatten').includes('routeBuilderLiftToLogger'), 'flatten routes strength and supersets through builder columns');
must(extractFn(html, 'validateStrengthRow').includes('return LogColumns.validateAthleteRow'), 'logger validate does not re-require kg×reps');
must(extractFn(html, 'applyOpenLiftToEx').includes('if(!hasR)row.reps'), 'Open must not overwrite painted reps');
must(extractFn(html, 'supersetTask').includes('liveTracksKg'), 'superset RIR only when load is live');
must(extractFn(html, 'autofill').includes('r.target===src.target'), 'autofill keeps per-target reps');

// Builder already wires the same shared renderer — lock the wiring stays in place.
must(html.includes('LogColumns.builderLiftHeroMetricsBlockHtml'), 'builder still uses LogColumns.builderLiftHeroMetricsBlockHtml');
must(html.includes('function setAthleteLiftColumnOptional'), 'optional-column handler wired');
must(logColumnsSrc.includes('toggleColumnOptional'), 'LogColumns can mark a column optional');
must(logColumnsSrc.includes('(optional)'), 'builder renders (optional) on metric columns');

// Logger must not hardcode a Weight/Reps-only mini-label pair as the *sole*
// source of set-row metric cells any more — that path now flows through the
// shared columns renderer, which can render 1, 2, or 3 metric cells per kind.
must(
  !/<span class=mini>Weight<\/span><input type=number value="\$\{r\.weight\}"/.test(strengthTaskFn),
  'strengthTask must no longer hardcode a bare Weight mini-label input for its set rows',
);

console.log('builder-logger-parity.smoke: ok');
