/**
 * Smoke: session chrome — brand bar apply + fallback render.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const dir = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(dir, 'index.html'), 'utf8');
const src = readFileSync(join(dir, 'session-chrome.js'), 'utf8');

if (!html.includes('session-chrome.js')) throw new Error('index.html missing session-chrome.js');
if (!html.includes('.logger-screen{')) throw new Error('index.html missing logger-screen CSS');
if (!src.includes('applyBrand')) throw new Error('applyBrand missing');

const sandbox = { window: {}, console, esc: (s) => String(s), document: { querySelector: () => null, getElementById: () => null } };
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(src, sandbox);

const strengthHtml = sandbox.SessionChrome.render({
  product: 'strength',
  weekLabel: 'Strength · Week 2',
  elapsedSec: 1934,
});
if (!strengthHtml.includes('HYBRID')) throw new Error('strength brand missing');
if (!strengthHtml.includes('Strength · Week 2')) throw new Error('week label missing');
if (!strengthHtml.includes('32:14')) throw new Error('elapsed formatting wrong');

const engineHtml = sandbox.SessionChrome.render({
  product: 'engine',
  weekLabel: 'Intervals · Row',
  elapsedSec: 125,
});
if (!engineHtml.includes('ENGINE')) throw new Error('engine brand missing');
if (!engineHtml.includes('dial-engine')) throw new Error('engine dial class missing');
if (sandbox.SessionChrome.fmtElapsed(65) !== '01:05') throw new Error('fmtElapsed wrong');

console.log('session-chrome.smoke: ok');
