#!/usr/bin/env node
/**
 * Coach desktop shell smoke — validates config without launching Electron.
 * Proves the live coach URL responds; does not modify coach/athlete code.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(fs.readFileSync(path.join(here, 'package.json'), 'utf8'));
const mainPath = path.join(here, pkg.main);

function must(cond, msg) {
  if (!cond) throw new Error(msg);
}

must(fs.existsSync(mainPath), 'main process missing: ' + pkg.main);
must(pkg.build?.appId === 'com.hybrid.coach', 'appId must be com.hybrid.coach');
must(String(pkg.main).endsWith('.cjs'), 'electron main must be CommonJS .cjs');

const mainSrc = fs.readFileSync(mainPath, 'utf8');
must(mainSrc.includes('thehybridsystem.netlify.app/coach.html'), 'default coach URL missing');
must(mainSrc.includes('contextIsolation: true'), 'contextIsolation must stay enabled');
must(mainSrc.includes('nodeIntegration: false'), 'nodeIntegration must stay disabled');
must(!mainSrc.includes('preview-site'), 'desktop must not bundle local preview-site');

const coachUrl = 'https://thehybridsystem.netlify.app/coach.html';
const res = await fetch(coachUrl, { method: 'GET', redirect: 'follow' });
must(res.ok, 'live coach.html must respond 200, got ' + res.status);
const html = await res.text();
must(html.includes('coach-loop.js'), 'coach.html must load coach-loop.js');
must(html.includes('coach-views.js'), 'coach.html must load coach-views.js');

console.log('coach-desktop.smoke: ok', { coachUrl, appId: pkg.build.appId });
