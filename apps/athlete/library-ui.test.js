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

require(join(dir, 'library.js'));
globalThis.S.library = globalThis.HybridLibrary.emptyState();
globalThis.S.library = globalThis.HybridLibrary.createTemplate(globalThis.S.library, { title: 'Upper Day' });
require(join(dir, 'library-ui.js'));

test('search does not full-render the shell (keeps the input focused)', () => {
  paints = 0;
  results.innerHTML = '';
  globalThis.LibraryView.search('Upper');
  assert.equal(paints, 0, 'search must not call render()');
  assert.equal(globalThis.S.libUi.q, 'Upper');
  assert.match(results.innerHTML, /Upper Day/);
});

test('picker search also patches #libResults without render()', () => {
  paints = 0;
  results.innerHTML = '';
  globalThis.S.library = globalThis.HybridLibrary.createCatalogExercise(
    globalThis.HybridLibrary.emptyState(),
    { title: 'My Sled', columns: ['reps', 'meters'] },
  );
  globalThis.S.libUi.screen = 'picker';
  globalThis.S.libUi.tab = 'exercises';
  globalThis.LibraryView.search('Sled');
  assert.equal(paints, 0);
  assert.match(results.innerHTML, /My Sled/);
});

test('sessions heading is blank without seeded templates', () => {
  globalThis.S.library = globalThis.HybridLibrary.emptyState();
  globalThis.S.libUi = { screen: 'list', heading: 'sessions', q: '', selected: [], tid: null };
  const html = globalThis.LibraryView.html();
  assert.match(html, /class="lib-headings"/);
  assert.match(html, />Sessions</);
  assert.match(html, />Exercises</);
  assert.match(html, />Circuits</);
  assert.match(html, /No session templates yet/);
  assert.doesNotMatch(html, /Bench Press/);
  assert.doesNotMatch(html, /HPP Lower/);
});

test('exercises heading is a blank catalog', () => {
  globalThis.S.library = globalThis.HybridLibrary.emptyState();
  globalThis.S.libUi = { screen: 'list', heading: 'exercises', q: '', selected: [], tid: null };
  const html = globalThis.LibraryView.html();
  assert.match(html, /class="lib-title">Exercises/);
  assert.match(html, /Create New Exercise/);
  assert.match(html, /No exercises yet/);
  assert.doesNotMatch(html, /Back Squat/);
});

test('circuits heading shows warmup and cooldown subheads and starts blank', () => {
  globalThis.S.library = globalThis.HybridLibrary.emptyState();
  globalThis.S.libUi = { screen: 'list', heading: 'circuits', circuitKind: 'warmup', q: '', selected: [], tid: null };
  const html = globalThis.LibraryView.html();
  assert.match(html, /class="lib-title">Circuits/);
  assert.match(html, /class="lib-subheads"/);
  assert.match(html, /Warm up/);
  assert.match(html, /Cool down/);
  assert.match(html, /No warm up yet/);
  assert.doesNotMatch(html, /Deadlift Warm-Up/);
});
