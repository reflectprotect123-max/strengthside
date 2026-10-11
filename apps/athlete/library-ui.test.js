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

require(join(dir, 'training-core.js'));
require(join(dir, 'strength-targets.js'));
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

test('exercise builder accepts authored reps without exposing engine controls', () => {
  const tid=S.library.templates[0].id;
  S.library=HybridLibrary.addExercise(S.library,tid,{title:'Squat'});
  const bid=S.library.templates[0].blocks.at(-1).id;
  LibraryView.open(tid);LibraryView.editBlock(bid);
  assert.match(LibraryView.html(),/>Reps</);
  LibraryView.setCols('reps_range','weight_kg');
  assert.doesNotMatch(LibraryView.html(),/Target difficulty|Smallest weight/);
  LibraryView.setRepTarget('6–8');assert.equal(HybridLibrary.template(S.library,tid).blocks.at(-1).repTarget,'6-8');
  LibraryView.setRepTarget('8-6');assert.equal(HybridLibrary.template(S.library,tid).blocks.at(-1).repTarget,'6-8');assert.match(LibraryView.html(),/lower number first/);
});

test('new exercise and circuit forms render without editor-only block references', () => {
 LibraryView.newEx();assert.match(LibraryView.html(),/New Exercise/);assert.doesNotMatch(LibraryView.html(),/libRepTarget/);
 LibraryView.newCirc();assert.match(LibraryView.html(),/New Circuit/);assert.doesNotMatch(LibraryView.html(),/libRepTarget/);
});


test('photo keypad edits one set in place and keeps a dash key', () => {
 const tid=S.library.templates[0].id;const bid=S.library.templates[0].blocks.at(-1).id;
 LibraryView.open(tid);LibraryView.editBlock(bid);LibraryView.setCols('reps','weight_kg');
 LibraryView.openNumberPad('set:0');
 assert.match(LibraryView.html(),/class="photo-key"/);
 assert.match(LibraryView.html(),/numberKey\('–'\)/);
 assert.doesNotMatch(LibraryView.html(),/class="blue"/);
 LibraryView.numberKey('9');assert.equal(HybridLibrary.template(S.library,tid).blocks.at(-1).repTarget,'9');
 LibraryView.closeNumberPad();
 LibraryView.setRepTarget('10-12');assert.equal(HybridLibrary.template(S.library,tid).blocks.at(-1).repTarget,'9');
 LibraryView.setCols('reps_range','weight_kg');LibraryView.openNumberPad('set:0');
 for(const key of ['1','2','–','2','0']) LibraryView.numberKey(key);
 assert.equal(HybridLibrary.template(S.library,tid).blocks.at(-1).repTarget,'12-20');
 LibraryView.setCols('reps','weight_kg');assert.equal(HybridLibrary.template(S.library,tid).blocks.at(-1).repTarget,'12');
});

test('per-set editor accepts unequal reps and authors final AMRAP automatically',()=>{
 const tid=S.library.templates[0].id,bid=S.library.templates[0].blocks.at(-1).id;
 LibraryView.open(tid);LibraryView.editBlock(bid);
 assert.match(LibraryView.html(),/Set 1 reps/);assert.match(LibraryView.html(),/Add final AMRAP/);
 LibraryView.setTargetReps(0,'10');LibraryView.setTargetReps(1,'8');LibraryView.setTargetReps(2,'6');LibraryView.toggleAmrap();
 const block=HybridLibrary.template(S.library,tid).blocks.at(-1);
 assert.deepEqual(block.setTargets.map(t=>t.reps?.min??null),[10,8,6,null]);
 assert.equal(block.setTargets[3].loadRule.kind,'first_working_set');
 assert.doesNotMatch(LibraryView.html(),/Target difficulty|Smallest weight|Starting weight/);
});
