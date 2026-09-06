#!/usr/bin/env node
/**
 * Engine library Analytics: work + WHOOP trend charts (read-only).
 * Run: node apps/mobile/prototype/hybrid-app/cond-analytics.smoke.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const html = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'index.html'), 'utf8');

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

must(html.includes("LOCAL_BUILD='the-hybrid-athlete-blank-v191'"), 'LOCAL_BUILD v189');
must(html.includes('the-hybrid-athlete-blank-v191'), 'service worker cache v189');

must(html.includes('setEngineLibrarySubTab'), 'Engine sub-nav switch missing');
must(html.includes('>Analytics<'), 'Analytics tab label missing');
must(html.includes('id=condAnalyticsWork') || html.includes('id="condAnalyticsWork"'), '#condAnalyticsWork container');
must(html.includes('id=condAnalyticsWhoop') || html.includes('id="condAnalyticsWhoop"'), '#condAnalyticsWhoop container');

must(html.includes('Complete an Engine session to see work trends'), 'work empty-state copy');
must(html.includes('Sync WHOOP or log recovery on check-in'), 'WHOOP empty-state copy');

must(html.includes('function renderCondAnalytics('), 'renderCondAnalytics helper missing');
must(html.includes('function condAnalyticsSvgLine('), 'condAnalyticsSvgLine helper missing');

const renderFn = extractFn(html, 'renderCondAnalytics');
const svgFn = extractFn(html, 'condAnalyticsSvgLine');
for (const [label, body] of [
  ['renderCondAnalytics', renderFn],
  ['condAnalyticsSvgLine', svgFn],
]) {
  must(!body.includes('decideNextCond'), label + ' must not call decideNextCond');
  must(!/race2kSec\s*=/.test(body), label + ' must not write race2kSec');
  must(!/bikeWattsAnchor\s*=/.test(body), label + ' must not write bikeWattsAnchor');
  must(!/bikeRpmAnchor\s*=/.test(body), label + ' must not write bikeRpmAnchor');
}

must(html.includes('cond-analytics-empty'), 'dashed empty panel class');
must(html.includes('polyline'), 'SVG polyline chart');

console.log('cond-analytics.smoke: ok');
