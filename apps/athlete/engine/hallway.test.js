import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const src = readFileSync(new URL('./hallway.js', import.meta.url), 'utf8');

function house({ tab = 'me' } = {}) {
  const calls = [];
  const inserted = [];
  const h1 = { insertAdjacentHTML: (where, html) => inserted.push([where, html]) };
  const win = {
    S: { tab, liveWorkout: null },
    render() { calls.push('render'); },
    switchHybridLocker() { calls.push('standalone alert'); },
    alert: (msg) => calls.push(`alert:${msg}`),
    location: { assign: (to) => calls.push(`assign:${to}`) },
    document: { querySelector: (sel) => (sel === '.pg-page h1' ? h1 : null) },
  };
  win.window = win;
  vm.runInNewContext(src, win);
  return { win, calls, inserted };
}

test('Engine settings do not offer a walk back to the parked strength app', () => {
  const { win, calls, inserted } = house({ tab: 'me' });
  win.render();
  assert.deepEqual(calls, ['render']);
  assert.equal(inserted.length, 0);
  assert.doesNotMatch(src, /switchHybridLocker\('strength'\)/);
});

test('asking for Strength does not leave the Engine', async () => {
  const { win, calls } = house();
  await win.switchHybridLocker('strength');
  assert.deepEqual(calls, []);
});
