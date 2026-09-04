#!/usr/bin/env node
/**
 * Athlete strength handler wiring — buttons/inputs must call functions that exist.
 * Catches orphaned onclick/onchange in builder twins + logger modules.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const proto = join(root, 'apps/mobile/prototype/hybrid-app');
const indexHtml = readFileSync(join(proto, 'index.html'), 'utf8');
const logColumnsSrc = readFileSync(join(proto, 'log-columns.js'), 'utf8');
const loggerSrc = readFileSync(join(proto, 'strength-one-set-logger.js'), 'utf8');
const workSrc = readFileSync(join(proto, 'work-overlay.js'), 'utf8');
const restSrc = readFileSync(join(proto, 'rest-overlay.js'), 'utf8');

const failures = [];
const must = (c, m) => {
  if (!c) failures.push(m);
};

/** Globals defined inline in index.html */
const indexGlobals = new Set();
for (const m of indexHtml.matchAll(/\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/g)) {
  indexGlobals.add(m[1]);
}

/** LogColumns export keys */
const lcExport = logColumnsSrc.match(/global\.LogColumns\s*=\s*\{([\s\S]*?)\n\s*\};/);
const logColumnsKeys = new Set();
if (lcExport) {
  for (const m of lcExport[1].matchAll(/^\s*([A-Za-z_$][\w$]*)\s*,?\s*$/gm)) {
    if (m[1]) logColumnsKeys.add(m[1]);
  }
}

/** StrengthOneSetLogger + overlay exports */
function moduleExportKeys(src, globalName) {
  const keys = new Set();
  const block = src.match(new RegExp(`global\\.${globalName}\\s*=\\s*\\{([\\s\\S]*?)\\n\\s*\\};`));
  if (!block) return keys;
  for (const m of block[1].matchAll(/^\s*([A-Za-z_$][\w$]*)\s*:/gm)) {
    keys.add(m[1]);
  }
  return keys;
}

function moduleGlobalAssignments(src) {
  const keys = new Set();
  for (const m of src.matchAll(/global\.([A-Za-z_$][\w$]*)\s*=/g)) {
    keys.add(m[1]);
  }
  return keys;
}

const loggerKeys = moduleExportKeys(loggerSrc, 'StrengthOneSetLogger');
const loggerGlobals = moduleGlobalAssignments(loggerSrc);
const workKeys = moduleExportKeys(workSrc, 'WorkOverlay');
const restKeys = moduleExportKeys(restSrc, 'RestOverlay');

/** Required index.html globals for athlete builder + session (curated — extend when adding controls) */
const requiredIndexHandlers = [
  'setAthleteLiftTargetRir',
  'setAthleteLiftName',
  'setAthleteLiftRest',
  'setAthleteLiftColumnKind',
  'setAthleteLiftColumnCount',
  'setAthleteLiftSideMode',
  'setAthleteLiftEffort',
  'setAthleteLiftSets',
  'refreshAthleteLiftSuggest',
  'refreshAthleteLiftMetricsOnly',
  'refreshAthleteLiftCard',
  'pickAthleteLiftSuggest',
  'completeStrength',
  'addExtra',
  'updateSet',
  'setSupersetValue',
  'addSupersetRound',
  'supersetEditSheet',
  'editSupersetValue',
  'toggleSupersetDone',
  'logSupersetSet',
  'supersetMetricInputs',
  'editCompletedRow',
  'toggleCompletedDone',
  'addCompletedRow',
  'startSession',
  'startSessionNow',
];

for (const name of requiredIndexHandlers) {
  must(indexGlobals.has(name), `index.html missing function ${name}() — control is unwired`);
}

/** Parse handler calls from HTML template strings in JS modules */
function extractHandlerCalls(src) {
  const calls = [];
  for (const m of src.matchAll(/(?:onclick|onchange|oninput|onsubmit)=["']([^"']+)["']/g)) {
    calls.push(m[1]);
  }
  return calls;
}

function resolveCall(expr) {
  expr = expr.trim();
  const ns = expr.match(/^([A-Za-z_$][\w$]*)\.([A-Za-z_$][\w$]*)\(/);
  if (ns) return { kind: 'module', ns: ns[1], method: ns[2] };
  const fn = expr.match(/^([A-Za-z_$][\w$]*)\(/);
  if (fn) return { kind: 'global', name: fn[1] };
  return null;
}

function assertHandler(call, context) {
  const r = resolveCall(call.split(';')[0].trim());
  if (!r) return;
  if (r.kind === 'global') {
    must(
      indexGlobals.has(r.name) || loggerGlobals.has(r.name),
      `${context}: handler ${r.name}() not defined in index.html or strength modules`,
    );
    return;
  }
  if (r.ns === 'LogColumns') {
    must(logColumnsKeys.has(r.method), `${context}: LogColumns.${r.method} not exported`);
  } else if (r.ns === 'StrengthOneSetLogger') {
    must(loggerKeys.has(r.method), `${context}: StrengthOneSetLogger.${r.method} not exported`);
  } else if (r.ns === 'WorkOverlay') {
    must(workKeys.has(r.method), `${context}: WorkOverlay.${r.method} not exported`);
  } else if (r.ns === 'RestOverlay') {
    must(restKeys.has(r.method), `${context}: RestOverlay.${r.method} not exported`);
  }
}

for (const call of extractHandlerCalls(logColumnsSrc)) {
  assertHandler(call, 'log-columns.js');
}
for (const call of extractHandlerCalls(loggerSrc)) {
  assertHandler(call, 'strength-one-set-logger.js');
}

/** Render builder twin + assert handlers in output */
const sandbox = {
  window: {},
  console,
  document: {
    getElementById: () => null,
    querySelector: () => null,
    createElement: () => ({ innerHTML: '', firstChild: null, replaceWith() {} }),
  },
  S: {},
  StrengthAdapter: { repProgressionLift: () => false },
  formatMmSs: (sec) => String(sec),
};
sandbox.window = sandbox;
vm.runInNewContext(logColumnsSrc, sandbox);
const LC = sandbox.LogColumns;
must(LC, 'LogColumns failed to load in wiring smoke');

const twin = LC.builderAthleteTwinHtml(
  {
    name: 'Plank',
    restSec: 60,
    sideMode: 'both_per_round',
    logColumns: [{ id: 't', kind: 'time_sec', value: '', values: [''] }],
  },
  { bi: 0, ei: 0 },
);
for (const call of extractHandlerCalls(twin)) {
  assertHandler(call, 'builderAthleteTwinHtml(plank)');
}
must(twin.includes('setAthleteLiftSideMode'), 'builder twin missing side mode select');
must(twin.includes('setAthleteLiftColumnKind'), 'builder twin missing metric kind select');
must(twin.includes('setAthleteLiftTargetRir'), 'builder twin missing calibration slider');

if (failures.length) {
  console.error('hybrid-handler-wiring FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('hybrid-handler-wiring: ok', {
  indexHandlers: requiredIndexHandlers.length,
  logColumnsExports: logColumnsKeys.size,
  loggerExports: loggerKeys.size,
});
