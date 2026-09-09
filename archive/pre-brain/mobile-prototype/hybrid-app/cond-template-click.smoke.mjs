#!/usr/bin/env node
/**
 * Engine library templates must open the builder on tap, sections must
 * actually collapse, and Library re-renders must keep scroll so a tap
 * does not look like a no-op.
 * Run: node apps/mobile/prototype/hybrid-app/cond-template-click.smoke.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
const failures = [];
function must(cond, msg) {
  if (!cond) failures.push(msg);
}

const card = html.match(/function templateCard\(t\)\{[\s\S]*?\nfunction /)?.[0] || '';
must(card.includes('oled-lib-row'), 'templateCard still emits oled-lib-row');
must(
  /isConditioningTemplate\(t\)\s*\?\s*`editTemplate\('\$\{t\.id\}'\)`/.test(card) ||
    card.includes("isConditioningTemplate(t)?`editTemplate('${t.id}')`"),
  'Engine/Recovery template row tap opens editTemplate, not only overview toggle',
);

const grouped = html.match(/function groupedTemplates\([\s\S]*?\nfunction /)?.[0] || '';
must(
  grouped.includes('libraryOpen[key]!==false') || grouped.includes('libraryOpen[key] !== false'),
  'groupedTemplates must honour libraryOpen so Conditioning section taps collapse',
);
must(
  !/groupedTemplates\('Conditioning','cond-starter',condStarters,true\)/.test(html),
  'Conditioning section must not hard-code open=true (first tap is a no-op)',
);

const toggle = html.match(/function toggleLibrarySection\([\s\S]*?\nfunction /)?.[0] || '';
must(
  toggle.includes('libraryOpen[key]=!(libraryOpen[key]!==false)') ||
    toggle.includes("libraryOpen[key] = !(libraryOpen[key] !== false)"),
  'toggleLibrarySection must treat undefined as currently open',
);

const shell = html.match(/function shell\([\s\S]*?\nfunction /)?.[0] || html.slice(html.indexOf('function shell('), html.indexOf('function shell(') + 900);
must(
  /keepScroll[\s\S]{0,180}Library/.test(shell) || shell.includes("title==='Library'"),
  'shell() must keep Library scroll so template taps do not jump to the hero',
);

const fmtFn = html.match(/function fmtNeedsIntervalFields\([\s\S]*?\nfunction /)?.[0] || '';
must(
  /fmt\.key==='threshold'/.test(fmtFn) || fmtFn.includes("'threshold'"),
  'Threshold format must show interval fields (rounds/work/rest)',
);

const clockFn = html.match(/function taskNeedsIntervalClock\([\s\S]*?\nfunction /)?.[0] || '';
must(
  clockFn.includes("fmt==='threshold'") || clockFn.includes("'threshold'"),
  'Threshold sessions must run the interval clock',
);

if (failures.length) {
  console.error('cond-template-click.smoke FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('cond-template-click.smoke OK');
