/**
 * WHOOP ownership contract — athlete site is PROXY-ONLY.
 *
 * Tokens + OAuth callback live on thehybridengine1.netlify.app.
 * thehybridsystem may only forward Authorization + path.
 *
 * This check exists because we once replaced working proxies with a half
 * cutover of real handlers and spent days on env/blobs hell. It must FAIL
 * the build if that shape returns — not warn.
 *
 * Run: node apps/mobile/prototype/hybrid-app/whoop-ownership.smoke.mjs
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const root = join(dir, '../../..');
const protoFn = join(dir, 'netlify/functions');
const previewFn = join(dir, '../../preview-site/netlify/functions');
const OWNER_HOST = 'thehybridengine1.netlify.app';
const ATHLETE_HOST = 'thehybridsystem.netlify.app';

const failures = [];
function must(cond, msg) {
  if (!cond) failures.push(msg);
}

const BANNED_FILES = [
  'whoop-callback.mjs',
  'whoop-webhook.mjs',
  '_lib/whoop.mjs',
  '_lib/oauth.mjs',
  '_lib/store.mjs',
  '_lib/supabase.mjs',
  '_lib/identity.mjs',
  '_lib/config.mjs',
  '_lib/crypto.mjs',
  '_lib/session.mjs',
  '_lib/concept2.mjs',
];

const PROXY_ENTRYPOINTS = [
  'whoop-connect.mjs',
  'whoop-sync.mjs',
  'concept2-connect.mjs',
  'concept2-sync.mjs',
  'concept2-callback.mjs',
  'integrations-status.mjs',
  'integrations-disconnect.mjs',
];

const BANNED_SOURCE_SNIPPETS = [
  '@netlify/blobs',
  'exchangeWhoopCode',
  'NATIVE_RETURN_URL',
  'savePending(',
  'connectNetlifyBlobs',
  'WHOOP_CLIENT_SECRET',
];

function listFiles(base, prefix = '') {
  if (!existsSync(base)) return [];
  const out = [];
  for (const name of readdirSync(base)) {
    const full = join(base, name);
    const rel = prefix ? `${prefix}/${name}` : name;
    if (statSync(full).isDirectory()) out.push(...listFiles(full, rel));
    else out.push(rel.replace(/\\/g, '/'));
  }
  return out;
}

function assertFnDir(label, fnDir) {
  must(existsSync(fnDir), `${label}: missing functions dir ${fnDir}`);
  if (!existsSync(fnDir)) return;

  for (const banned of BANNED_FILES) {
    must(!existsSync(join(fnDir, banned)), `${label}: banned file present: ${banned}`);
  }

  must(existsSync(join(fnDir, '_hybrid-proxy.mjs')), `${label}: missing _hybrid-proxy.mjs`);
  must(existsSync(join(fnDir, 'off-proxy.mjs')), `${label}: missing off-proxy.mjs (nutrition)`);
  must(existsSync(join(fnDir, '_lib/http.mjs')), `${label}: missing _lib/http.mjs (off-proxy only)`);

  const libDir = join(fnDir, '_lib');
  if (existsSync(libDir)) {
    const libFiles = readdirSync(libDir).filter((f) => f.endsWith('.mjs'));
    for (const f of libFiles) {
      must(f === 'http.mjs', `${label}: _lib may only contain http.mjs, found ${f}`);
    }
  }

  const proxySrc = readFileSync(join(fnDir, '_hybrid-proxy.mjs'), 'utf8');
  must(proxySrc.includes(OWNER_HOST), `${label}: _hybrid-proxy must forward to ${OWNER_HOST}`);
  must(
    !proxySrc.includes(`https://${ATHLETE_HOST}/.netlify/functions`),
    `${label}: _hybrid-proxy must not recurse into athlete site`,
  );
  must(proxySrc.includes('access-control-allow-origin'), `${label}: proxy must emit CORS`);

  for (const name of PROXY_ENTRYPOINTS) {
    const path = join(fnDir, name);
    must(existsSync(path), `${label}: missing proxy entry ${name}`);
    if (!existsSync(path)) continue;
    const src = readFileSync(path, 'utf8');
    must(src.includes('proxyHybrid'), `${label}: ${name} must call proxyHybrid`);
    for (const snip of BANNED_SOURCE_SNIPPETS) {
      must(!src.includes(snip), `${label}: ${name} must not contain real-handler snippet: ${snip}`);
    }
  }

  // No stray real-handler modules under any name.
  const all = listFiles(fnDir);
  for (const rel of all) {
    if (!rel.endsWith('.mjs')) continue;
    const src = readFileSync(join(fnDir, rel), 'utf8');
    if (rel === '_hybrid-proxy.mjs' || rel === 'off-proxy.mjs' || rel === '_lib/http.mjs') continue;
    for (const snip of BANNED_SOURCE_SNIPPETS) {
      must(!src.includes(snip), `${label}: ${rel} looks like a real handler (${snip})`);
    }
  }
}

assertFnDir('prototype', protoFn);
assertFnDir('preview-site', previewFn);

// package.json must not reintroduce blobs for athlete functions
for (const pkgPath of [
  join(dir, 'package.json'),
  join(dir, '../../preview-site/package.json'),
]) {
  if (!existsSync(pkgPath)) continue;
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
  must(!deps['@netlify/blobs'], `${relative(root, pkgPath)} must not depend on @netlify/blobs`);
}

for (const tomlPath of [join(dir, 'netlify.toml'), join(dir, '../../preview-site/netlify.toml'), join(root, 'netlify.toml')]) {
  if (!existsSync(tomlPath)) continue;
  const toml = readFileSync(tomlPath, 'utf8');
  must(!/external_node_modules/.test(toml), `${relative(root, tomlPath)} must not pin external_node_modules for blobs`);
}

const whoopJs = readFileSync(join(dir, 'whoop.js'), 'utf8');
must(whoopJs.includes("client: 'native'") || whoopJs.includes('client: "native"'), 'whoop.js connect must use client=native');
must(whoopJs.includes(ATHLETE_HOST), 'whoop.js must know athlete Netlify host');
must(whoopJs.includes('resolveProxyBase'), 'whoop.js must resolve Netlify base for Capacitor');

if (failures.length) {
  console.error('whoop-ownership.smoke FAIL');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}
console.log('whoop-ownership.smoke: ok — athlete site is proxy-only →', OWNER_HOST);
