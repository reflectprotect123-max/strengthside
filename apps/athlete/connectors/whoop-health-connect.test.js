import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createContext, runInContext } from 'node:vm';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(dir, 'whoop.js'), 'utf8');
const ctx = createContext({
  Date, JSON, Number, String, Object, Array, Boolean, Error, Promise,
  URL, URLSearchParams, console, parseInt, Math,
  setTimeout, clearTimeout, setInterval, clearInterval,
  STRENGTH_CONFIG: { supabaseUrl: 'https://example.supabase.co' },
});
ctx.window = ctx;
ctx.globalThis = ctx;
runInContext(src, ctx);

test('formatHealthConnectPoke reports WHOOP lag when today is empty', () => {
  const msg = ctx.Whoop.formatHealthConnectPoke({
    available: true,
    granted: true,
    stepsToday: 0,
    steps3d: 9000,
    origins: [{ packageName: 'com.whoop.android', count: 9000 }],
  });
  assert.match(msg, /lags 1–2 days/);
  assert.match(msg, /com\.whoop\.android/);
});

test('formatHealthConnectPoke asks for a new APK path via missing plugin copy in pokeHealthConnect', () => {
  assert.match(src, /install dogfood 1\.0\.101/);
});
