import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const dir = dirname(fileURLToPath(import.meta.url));

let paints = 0;
const results = { innerHTML: '' };
globalThis.document = {
  getElementById(id) {
    return id === 'libResults' ? results : null;
  },
};
globalThis.S = {
  library: null,
  libUi: { screen: 'list', q: '', selected: [], tid: null, tab: 'exercises' },
};
globalThis.save = () => {};
globalThis.render = () => {
  paints += 1;
};

require(join(dir, 'engine.js'));
require(join(dir, 'library.js'));
globalThis.S.library = globalThis.HybridLibrary.emptyState();
globalThis.S.library = globalThis.HybridLibrary.createTemplate(globalThis.S.library, { title: 'Row VO2' });
require(join(dir, 'library-ui.js'));

test('search does not full-render the shell (keeps the input focused)', () => {
  paints = 0;
  results.innerHTML = '';
  globalThis.LibraryView.search('Row');
  assert.equal(paints, 0, 'search must not call render()');
  assert.equal(globalThis.S.libUi.q, 'Row');
  assert.match(results.innerHTML, /Row VO2/);
});

test('list search does not invent lift cards', () => {
  paints = 0;
  results.innerHTML = '';
  globalThis.LibraryView.search('Squat');
  assert.equal(paints, 0);
  assert.ok(!/Squat/.test(results.innerHTML));
});
