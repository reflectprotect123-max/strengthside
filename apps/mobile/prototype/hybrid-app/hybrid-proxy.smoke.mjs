/**
 * Smoke: athlete Netlify deploy includes integration proxy functions + client routing.
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
  'concept2-connect.mjs',
  'concept2-sync.mjs',
  'off-proxy.mjs',
  '_hybrid-proxy.mjs',
  '_lib/http.mjs',
];
const deletedCoreModelFns = [
  'big-mac-decide.mjs',
  'ai-strength-progression.mjs',
  'ai-coach-intent.mjs',
];

if (!existsSync(join(preview, 'netlify.toml'))) {
  throw new Error('preview-site/netlify.toml missing — Netlify will not deploy functions');
}
const toml = readFileSync(join(preview, 'netlify.toml'), 'utf8');
if (!/directory\s*=\s*"netlify\/functions"/.test(toml)) {
  throw new Error('netlify.toml must point at netlify/functions');
}
if (/external_node_modules/.test(toml)) {
  throw new Error('netlify.toml should not pin @netlify/blobs — proxies do not need it');
}

for (const name of requiredFns) {
  if (!existsSync(join(fnDir, name))) throw new Error('missing function: ' + name);
}
for (const name of deletedCoreModelFns) {
  if (existsSync(join(fnDir, name))) {
    throw new Error('core-model function must stay deleted: ' + name);
  }
}
if (existsSync(join(fnDir, 'whoop-callback.mjs'))) {
  throw new Error('whoop-callback must not ship on athlete site — OAuth callback lives on hybrid1');
}
if (existsSync(join(fnDir, '_lib/whoop.mjs'))) {
  throw new Error('_lib/whoop.mjs must not ship — athlete site proxies to hybrid1');
}

const proxy = readFileSync(join(fnDir, '_hybrid-proxy.mjs'), 'utf8');
if (!proxy.includes('access-control-allow-origin')) {
  throw new Error('_hybrid-proxy.mjs must emit CORS for Capacitor cross-origin calls');
}
if (!proxy.includes('thehybridengine1.netlify.app')) {
  throw new Error('_hybrid-proxy.mjs must forward to hybrid1');
}

const whoopJs = readFileSync(join(dir, 'whoop.js'), 'utf8');
if (!whoopJs.includes('resolveProxyBase') || !whoopJs.includes('thehybridsystem.netlify.app')) {
  throw new Error('whoop.js must route native/offline clients to athlete Netlify');
}

// Capacitor WebView origin → absolute athlete Netlify URL
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
