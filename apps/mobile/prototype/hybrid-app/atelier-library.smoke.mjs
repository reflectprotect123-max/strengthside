#!/usr/bin/env node
/**
 * Atelier Library: Engine + Recovery tabs only (strength cut 2026-09-06).
 * Run: node apps/mobile/prototype/hybrid-app/atelier-library.smoke.mjs
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

must(html.includes('function libraryTabsHtml'), 'libraryTabsHtml missing');

const tabsFn = extractFn(html, 'libraryTabsHtml');

must(!/Strength|Hybrid Strength/.test(tabsFn), 'Strength tab must be absent after cut');
must(/Engine|The Engine/.test(tabsFn), 'Engine tab label in libraryTabsHtml');
must(tabsFn.includes('Recovery'), 'Recovery tab in libraryTabsHtml');
must(tabsFn.includes("setLibraryTab('recovery')"), "libraryTabsHtml must switch via setLibraryTab('recovery')");
must(tabsFn.includes("setLibraryTab('conditioning')"), "libraryTabsHtml must switch via setLibraryTab('conditioning')");
must(!tabsFn.includes('>Progress<'), 'Progress must not be a primary library tab label');
must(!tabsFn.includes("setLibraryTab('progress')"), "Progress tab switch setLibraryTab('progress') must be gone");
must(!tabsFn.includes("setLibraryTab('strength')"), "Strength tab switch must be gone");

console.log('atelier-library.smoke: ok');
