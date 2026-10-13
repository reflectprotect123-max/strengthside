import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const src = readFileSync(new URL('./hallway.js', import.meta.url), 'utf8');

function house({ tab = 'me', live = null, flush } = {}) {
  const calls = [];
  const inserted = [];
  const h1 = { insertAdjacentHTML: (where, html) => inserted.push([where, html]) };
  const win = {
    S: { tab, liveWorkout: live ? { status: live } : null },
    render() { calls.push('render'); },
    switchHybridLocker() { calls.push('standalone alert'); },
    EngineApp: { flushStorage: flush || (async () => { calls.push('flush'); }) },
    alert: (msg) => calls.push(`alert:${msg}`),
    location: { assign: (to) => calls.push(`assign:${to}`) },
    document: { querySelector: (sel) => (sel === '.pg-page h1' ? h1 : null) },
  };
  win.window = win;
  vm.runInNewContext(src, win);
  return { win, calls, inserted };
}

test('Engine Settings gains the Strength | Engine switch with Engine pressed', () => {
  const { win, calls, inserted } = house({ tab: 'me' });
  win.render();
  assert.deepEqual(calls, ['render']);
  assert.equal(inserted.length, 1);
  const [where, html] = inserted[0];
  assert.equal(where, 'afterend');
  assert.match(html, /aria-label="Locker"/);
  assert.match(html, /aria-pressed="false" onclick="switchHybridLocker\('strength'\)">Strength</);
  assert.match(html, /aria-pressed="true" onclick="switchHybridLocker\('engine'\)">Engine</);
});

test('other Engine tabs are left alone', () => {
  const { win, inserted } = house({ tab: 'training' });
  win.render();
  assert.equal(inserted.length, 0);
});

test('walking to Strength saves Engine first, then leaves', async () => {
  const { win, calls } = house();
  await win.switchHybridLocker('strength');
  assert.deepEqual(calls, ['flush', 'assign:../index.html']);
});

test('a failed save does not trap the athlete in Engine', async () => {
  const { win, calls } = house({ flush: async () => { throw new Error('disk'); } });
  await win.switchHybridLocker('strength');
  assert.deepEqual(calls, ['assign:../index.html']);
});

test('a running or paused workout blocks the walk', async () => {
  for (const live of ['running', 'paused']) {
    const { win, calls } = house({ live });
    await win.switchHybridLocker('strength');
    assert.equal(calls.length, 1);
    assert.match(calls[0], /^alert:Finish or end/);
  }
});

test('Engine button stays put', async () => {
  const { win, calls } = house();
  await win.switchHybridLocker('engine');
  assert.deepEqual(calls, []);
});
