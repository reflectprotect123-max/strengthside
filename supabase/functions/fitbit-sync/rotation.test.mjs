import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

const result = await build({
  stdin: { contents: "import './index.ts'; export { saveToken, loadToken, loadData } from '../_shared/oauth.ts';", resolveDir: import.meta.dirname },
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
  plugins: [{
    name: 'test-boundaries',
    setup(builder) {
      builder.onResolve({ filter: /^https:\/\/esm\.sh\// }, () => ({ path: 'supabase', namespace: 'test' }));
      builder.onLoad({ filter: /.*/, namespace: 'test' }, () => ({ contents: `export const createClient = () => ({ auth: { getUser: async jwt => jwt === 'test-user-session' ? { data: { user: { id: 'test-user' } }, error: null } : { data: { user: null }, error: 'invalid' } } });` }));
      builder.onLoad({ filter: /_shared\/store\.ts$/ }, () => ({ contents: `const store = new Map(); export const getJson = async key => store.get(key) ?? null; export const setJson = async (key, value) => store.set(key, value); export const deleteKey = async key => store.delete(key);` }));
    },
  }],
});

let handler;
globalThis.Deno = {
  serve: (fn) => { handler = fn; },
  env: { get: (key) => ({
    SUPABASE_URL: 'https://example.test',
    SUPABASE_SERVICE_ROLE_KEY: 'synthetic-service-key',
    INTEGRATION_ENCRYPT_KEY: 'synthetic-encryption-key',
    GOOGLE_HEALTH_CLIENT_ID: 'client',
    GOOGLE_HEALTH_CLIENT_SECRET: 'secret',
  })[key] },
};
const api = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
const request = () => new Request('https://example.test/fitbit-sync?product=strength', {
  headers: { authorization: 'Bearer test-user-session', 'x-hybrid-product': 'strength' },
});

test('a second refresh that loses the rotation keeps the token the first sync saved', async () => {
  let refreshCalls = 0;
  let releaseFirst;
  const firstEntered = new Promise((resolve) => { releaseFirst = resolve; });
  globalThis.fetch = async (url) => {
    if (String(url).includes('oauth2.googleapis.com/token')) {
      refreshCalls += 1;
      if (refreshCalls === 1) {
        await firstEntered;
        return Response.json({ access_token: 'rotated-access', refresh_token: 'rotated-refresh', expires_in: 3600 });
      }
      releaseFirst();
      return new Response(JSON.stringify({ error: 'invalid_grant' }), { status: 400, headers: { 'content-type': 'application/json' } });
    }
    return Response.json({ dataPoints: [], rollupDataPoints: [] });
  };
  await api.saveToken('fitbit', 's:test-user', { access_token: 'old-access', refresh_token: 'old-refresh', expires_at: Date.now() - 5000 });
  const [first, second] = await Promise.all([handler(request()), handler(request())]);
  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  const stored = await api.loadToken('fitbit', 's:test-user');
  assert.equal(stored.access_token, 'rotated-access');
  assert.notEqual((await api.loadData('fitbit', 's:test-user'))?.reconnectRequired, true);
});
