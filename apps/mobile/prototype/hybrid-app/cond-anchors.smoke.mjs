import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(dir, 'index.html'), 'utf8');

function must(c, m) {
  if (!c) throw new Error(m);
}

function slice(name) {
  const i = html.indexOf('function ' + name);
  if (i < 0) throw new Error('missing ' + name);
  return html.slice(i, i + 2400);
}

must(html.includes('Pace anchors'), 'Settings Pace anchors card missing');
must(html.includes('race2kSec'), 'profile race2kSec field missing');
must(html.includes('bikeWattsAnchor'), 'profile bikeWattsAnchor field missing');
must(html.includes('bikeRpmAnchor'), 'profile bikeRpmAnchor field missing');
must(
  html.includes('Logging hard intervals does not change these'),
  'Pace anchors meta line missing',
);

const open = slice('applyOpenCondToTask');
must(
  open.includes('paintOpenCondFromAnchors'),
  'Open must call paintOpenCondFromAnchors when typed target empty',
);

const paint = slice('paintOpenCondFromAnchors');
must(paint.includes('mapBandFrom2k'), 'paintOpenCondFromAnchors must use mapBandFrom2k');
must(paint.includes('softenOpen'), 'paintOpenCondFromAnchors must soften via WHOOP recovery');
must(paint.includes('whoopRecoveryForOpen'), 'paint must read daily check-in WHOOP recovery');

const band = slice('condOpenBand');
must(band.includes("fmt==='threshold'") && band.includes("return'threshold'"), 'condOpenBand must return threshold band');

const complete = slice('completeConditioning');
must(!complete.includes('race2kSec'), 'completeConditioning must not write race2kSec');
must(!complete.includes('bikeWattsAnchor'), 'completeConditioning must not write bikeWattsAnchor');
must(!complete.includes('bikeRpmAnchor'), 'completeConditioning must not write bikeRpmAnchor');

const advance = slice('advanceInterval');
must(!advance.includes('race2kSec'), 'advanceInterval must not write race2kSec');

const endIv = slice('endIntervals');
must(!endIv.includes('race2kSec'), 'endIntervals must not write race2kSec');

if (html.includes('function condAnalytics')) {
  const analytics = slice('condAnalytics');
  must(!analytics.includes('race2kSec='), 'condAnalytics must not write race2kSec');
}
if (html.includes('function renderCondAnalytics')) {
  const render = slice('renderCondAnalytics');
  must(!render.includes('race2kSec='), 'renderCondAnalytics must not write race2kSec');
}

console.log('cond-anchors.smoke: ok');
