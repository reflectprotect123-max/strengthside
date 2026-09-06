#!/usr/bin/env node
/**
 * Builder <-> logger 1:1 parity: strengthTask must render its metric cells
 * through the same LogColumns renderer the builder already uses
 * (builderLiftMetricsHtml / builderMetricColHtml), not a hardcoded
 * Weight / Reps / RIR mini-label layout.
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

// The renderer index.html must reference for the logger row path.
must(html.includes('LogColumns.loggerCellsHtml'), 'index.html references LogColumns.loggerCellsHtml');

const strengthTaskFn = extractFn(html, 'strengthTask');
must(strengthTaskFn.includes('LogColumns.loggerCellsHtml'), 'strengthTask body must call LogColumns.loggerCellsHtml for its set-row metric cells');

// Builder already wires the same shared renderer — lock the wiring stays in place.
must(html.includes('LogColumns.builderLiftMetricsHtml'), 'builder still uses LogColumns.builderLiftMetricsHtml');

// Logger must not hardcode a Weight/Reps-only mini-label pair as the *sole*
// source of set-row metric cells any more — that path now flows through the
// shared columns renderer, which can render 1, 2, or 3 metric cells per kind.
must(
  !/<span class=mini>Weight<\/span><input type=number value="\$\{r\.weight\}"/.test(strengthTaskFn),
  'strengthTask must no longer hardcode a bare Weight mini-label input for its set rows',
);

console.log('builder-logger-parity.smoke: ok');
