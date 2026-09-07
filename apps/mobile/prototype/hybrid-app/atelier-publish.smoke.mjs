#!/usr/bin/env node
/**
 * Atelier Publish: Save · Save as template · Publish + day-picker sheet.
 * TDD red until Task 6 wires openPublishDaySheet and unified builder actions.
 * Run: node apps/mobile/prototype/hybrid-app/atelier-publish.smoke.mjs
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

must(html.includes('openPublishDaySheet'), 'openPublishDaySheet missing');

const strengthBuilder = extractFn(html, 'athleteStrengthBuilder');
const condBuilder = extractFn(html, 'renderCondBuilder');

for (const [label, src] of [
  ['strength builder', strengthBuilder],
  ['cond builder', condBuilder],
]) {
  must(src.includes('Save'), `${label}: Save action missing`);
  must(src.includes('Save as template'), `${label}: Save as template action missing`);
  must(/Publish( to day)?/.test(src), `${label}: Publish action missing`);
  must(
    src.includes('openPublishDaySheet'),
    `${label}: must call openPublishDaySheet for Publish`,
  );
}

console.log('atelier-publish.smoke: ok');
