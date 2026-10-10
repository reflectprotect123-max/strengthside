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
  globalThis.S.libUi.screen = 'picker';
  globalThis.S.libUi.tab = 'exercises';
  globalThis.LibraryView.search('Bench');
  assert.equal(paints, 0);
  assert.match(results.innerHTML, /Bench Press/);
});

test('builder posts selected date and preserves existing workout days', () => {
 const tid = S.library.templates[0].id;
 LibraryView.open(tid);
 assert.match(LibraryView.html(), /Post to calendar/);
 LibraryView.calendar(tid,true);LibraryView.setDate('2026-11-15');
 LibraryView.confirmDate();assert.equal(S.library.assignments['2026-11-15'],tid);assert.equal(S.tab,'training');
 S.sessions={'2026-11-16':{phase:'summary'}};let warned=false;
 globalThis.alert=()=>{warned=true;};LibraryView.calendar(tid,true);LibraryView.setDate('2026-11-16');LibraryView.confirmDate();
 assert.equal(warned,true);assert.equal(S.library.assignments['2026-11-16'],undefined);
});
