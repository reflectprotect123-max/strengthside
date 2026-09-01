/**
 * Smoke: session chrome module (Phase 0 logger changeover).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const dir = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(dir, 'index.html'), 'utf8');
const src = readFileSync(join(dir, 'session-chrome.js'), 'utf8');

if (!html.includes('session-chrome.js')) throw new Error('index.html missing session-chrome.js');
if (!html.includes('.session-chrome{')) throw new Error('index.html missing session-chrome CSS');
if (!html.includes('.dial-strength .session-chrome-eyebrow')) {
  throw new Error('index.html missing dial-strength chrome variant');
}

const sandbox = { window: {}, console, esc: (s) => String(s) };
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(src, sandbox);

const strengthHtml = sandbox.SessionChrome.render({
  product: 'strength',
  title: 'Barbell Back Squat',
  subtitle: 'Set 2 / 4',
  weekLabel: 'STRENGTH · WEEK 2',
  elapsedSec: 1934,
});
if (!strengthHtml.includes('THE HYBRID')) throw new Error('strength eyebrow missing');
if (!strengthHtml.includes('STRENGTH · WEEK 2')) throw new Error('week label missing');
if (!strengthHtml.includes('Set 2 / 4')) throw new Error('subtitle missing');
if (!strengthHtml.includes('32:14')) throw new Error('elapsed formatting wrong');

const engineHtml = sandbox.SessionChrome.render({
  product: 'engine',
  title: 'Row ERG',
  subtitle: 'WORK 3/8',
  weekLabel: 'INTERVALS · ROW',
  elapsedSec: 125,
});
if (!engineHtml.includes('THE ENGINE')) throw new Error('engine eyebrow missing');
if (!engineHtml.includes('dial-engine')) throw new Error('engine dial class missing');

console.log('session-chrome.smoke: ok');
