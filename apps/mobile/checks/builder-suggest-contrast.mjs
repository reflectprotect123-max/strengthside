#!/usr/bin/env node
/**
 * Builder suggest contrast: no native datalist; solid mini-select options.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(dir, '../prototype/hybrid-app/index.html'), 'utf8');
const fails = [];
const must = (c, m) => { if (!c) fails.push(m); };

must(html.includes('function exerciseSuggestHtml'), 'exerciseSuggestHtml');
must(html.includes('function onExerciseNameInput'), 'onExerciseNameInput');
must(html.includes('id=exSuggest'), 'exSuggest mount');
must(html.includes('class=ex-suggest') || html.includes('class=ex-suggest '), 'ex-suggest class in CSS or html');
must(html.includes('.ex-suggest{') || html.includes('.ex-suggest\n') || html.includes('.ex-suggest{'), 'ex-suggest CSS');
must(html.includes('background:var(--panel2)'), 'panel2 backgrounds');
must(html.includes('.mini-select option'), 'option CSS');
must(!/\blist=exNameOptions\b/.test(html), 'datalist list attr gone');
must(!/<datalist id=exNameOptions/.test(html), 'datalist element gone');
must(/color-scheme:\s*dark/.test(html), 'color-scheme dark');

if (fails.length) {
  console.error('builder-suggest-contrast FAIL');
  fails.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('builder-suggest-contrast: ok');
