#!/usr/bin/env node
/**
 * Instrument Home: today peek, start confirm, cond HR zones; no readiness check-in on Home.
 * TDD red until Task 3 implements locked helper names.
 * Run: node apps/mobile/prototype/hybrid-app/instrument-home.smoke.mjs
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

must(html.includes('homeTodayPeekHtml'), 'homeTodayPeekHtml helper missing');
must(html.includes('confirmStartSession'), 'confirmStartSession helper missing');
must(html.includes('homeCondHrZonesHtml'), 'homeCondHrZonesHtml helper missing');

must(html.includes('athWhoopDialSvg') || html.includes('WHOOP'), 'WHOOP dials missing');

const athModules = extractFn(html, 'athModulesHtml');
const homeFn = extractFn(html, 'home');

must(!/Check-in inside/i.test(athModules), 'Home WHOOP module still exposes check-in entry');
must(!/readiness check-?in/i.test(athModules), 'athModulesHtml still exposes readiness check-in');
must(!athModules.includes("openAthleteSleepOverview('checkin')"), 'athModulesHtml must not route to check-in tab');
must(homeFn.includes('homeTodayPeekHtml'), 'home() must render homeTodayPeekHtml');

console.log('instrument-home.smoke: ok');
