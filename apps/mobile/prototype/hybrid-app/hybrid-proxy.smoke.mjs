/**
 * Smoke: athlete Netlify deploy includes WHOOP/Concept2 functions + client routing.
 * Run: node apps/mobile/prototype/hybrid-app/hybrid-proxy.smoke.mjs
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const dir = dirname(fileURLToPath(import.meta.url));
const preview = join(dir, '../../preview-site');
const fnDir = join(preview, 'netlify/functions');
const requiredFns = [
  'integrations-status.mjs',
  'integrations-disconnect.mjs',
  'whoop-connect.mjs',
  'whoop-sync.mjs',
  'whoop-callback.mjs',
  'concept2-connect.mjs',
  'concept2-sync.mjs',
  '_lib/http.mjs',
  '_lib/whoop.mjs',
  '_lib/config.mjs',
];

if (!existsSync(join(preview, 'netlify.toml'))) {
  throw new Error('preview-site/netlify.toml missing — Netlify will not deploy functions');
}
const toml = readFileSync(join(preview, 'netlify.toml'), 'utf8');
if (!/directory\s*=\s*"netlify\/functions"/.test(toml)) {
  throw new Error('netlify.toml must point at netlify/functions');
}

for (const name of requiredFns) {
  if (!existsSync(join(fnDir, name))) throw new Error('missing function: ' + name);
}

const httpLib = readFileSync(join(fnDir, '_lib/http.mjs'), 'utf8');
if (!httpLib.includes('access-control-allow-origin')) {
  throw new Error('_lib/http.mjs must emit CORS for Capacitor cross-origin calls');
}
if (!httpLib.includes('function preflight')) {
  throw new Error('_lib/http.mjs must export preflight for OPTIONS');
}

// Must be real WHOOP handlers now — not thin proxies to deleted hybrid site.
const whoopSync = readFileSync(join(fnDir, 'whoop-sync.mjs'), 'utf8');
if (whoopSync.includes('proxyHybrid') || whoopSync.includes('thehybridengine1.netlify.app')) {
  throw new Error('whoop-sync must not proxy to gutted hybrid Netlify');
}
if (!whoopSync.includes('fetchWhoopSnapshot')) {
  throw new Error('whoop-sync must call real WHOOP snapshot logic');
}

const configLib = readFileSync(join(fnDir, '_lib/config.mjs'), 'utf8');
if (!configLib.includes('thehybridsystem.netlify.app')) {
  throw new Error('config.mjs must fall back to athlete Netlify production URL');
}

const whoopJs = readFileSync(join(dir, 'whoop.js'), 'utf8');
if (!whoopJs.includes('resolveProxyBase') || !whoopJs.includes('thehybridsystem.netlify.app')) {
  throw new Error('whoop.js must route native/offline clients to athlete Netlify');
}

const sandbox = {
  console,
  fetch: async (url) => {
    sandbox.lastFetch = url;
    return { ok: true, json: async () => ({ whoop: { connected: false } }) };
  },
  localStorage: { getItem: () => null, setItem: () => {} },
  supabase: {
    createClient: () => ({
      auth: {
        getSession: async () => ({ data: { session: { access_token: 'tok', user: { email: 'a@b.c' } } } }),
      },
    }),
  },
  location: { protocol: 'https:', hostname: 'localhost', pathname: '/' },
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(whoopJs, sandbox);
await sandbox.Whoop.refreshStatus();
if (!String(sandbox.lastFetch || '').startsWith('https://thehybridsystem.netlify.app/')) {
  throw new Error('expected athlete Netlify URL from localhost, got: ' + sandbox.lastFetch);
}

console.log('hybrid-proxy.smoke: ok', readdirSync(fnDir).length, 'functions');
