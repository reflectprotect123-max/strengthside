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

test('WHOOP keeps official Allow and drops Totem + Health Connect', () => {
  assert.equal(typeof ctx.Whoop.connect, 'function');
  assert.equal(typeof ctx.Whoop.sync, 'function');
  assert.equal(ctx.Whoop.connectTotem, undefined);
  assert.equal(ctx.Whoop.pokeHealthConnect, undefined);
  assert.equal(ctx.Whoop.formatHealthConnectPoke, undefined);
  assert.match(src, /authorizeUrl/);
  assert.doesNotMatch(src, /HealthConnectSteps/);
  assert.doesNotMatch(src, /WhoopIos/);
  assert.doesNotMatch(src, /whoopIosEmail/);
  const form = ctx.Whoop.connectFormHtml();
  assert.doesNotMatch(form, /WHOOP app password/);
  assert.doesNotMatch(form, /Pull steps/);
  assert.match(form, /Connect WHOOP/);
});
