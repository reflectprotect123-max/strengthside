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

test('create opens the warm-up circuit instead of the note wizard', () => {
  const prior = globalThis.S.library;
  globalThis.S.library = globalThis.HybridLibrary.emptyState();
  globalThis.LibraryView.create();
  assert.equal(globalThis.S.libUi.screen, 'warmup');
  const html = globalThis.LibraryView.html();
  assert.match(html, /Warm-up/);
  assert.match(html, /Bike/);
  assert.match(html, /3:00|180/);
  assert.doesNotMatch(html, /Session instructions/);
  globalThis.S.library = prior;
});

test('wizard back from warm-up and the exercise picker respects the new entry flow', () => {
  const prior = globalThis.S.library;
  globalThis.S.library = globalThis.HybridLibrary.emptyState();
  LibraryView.create();
  assert.equal(S.libUi.screen, 'warmup');
  LibraryView.wizardBack();
  assert.equal(S.libUi.screen, 'list');
  assert.equal(S.libUi.flow, null);

  LibraryView.create();
  LibraryView.wizardNext();
  assert.equal(S.libUi.screen, 'edit');
  LibraryView.picker('exercises');
  assert.equal(S.libUi.screen, 'exercises');
  LibraryView.wizardBack();
  assert.equal(S.libUi.screen, 'edit');
  assert.equal(S.libUi.flow, 'wizard');
  assert.match(LibraryView.html(), /Session instructions/);
  assert.doesNotMatch(LibraryView.html(), />Instructions</);

  globalThis.S.library = prior;
});

test('wizard edit shows Next on the lift cards and keeps tempo off warm-up blocks', () => {
  const prior = globalThis.S.library;
  globalThis.S.library = globalThis.HybridLibrary.emptyState();
  LibraryView.create();
  LibraryView.wizardNext();
  assert.equal(S.libUi.screen, 'edit');
  const tid = S.libUi.tid;
  globalThis.S.library = globalThis.HybridLibrary.addExercise(globalThis.S.library, tid, {
    title: 'Back Squat', setCount: 3, columns: ['reps']
  });
  const html = LibraryView.html();
  assert.match(html, />Next</);
  assert.doesNotMatch(html, /Post to calendar/);
  const squatAt = html.indexOf('<h3>Back Squat</h3>');
  assert.match(html.slice(squatAt), /No tempo/);
  const bikeAt = html.indexOf('<h3>Bike</h3>');
  const bike = html.slice(html.lastIndexOf('<article', bikeAt), html.indexOf('</article>', bikeAt));
  assert.doesNotMatch(bike, /No tempo/);
  globalThis.S.library = prior;
});

test('search does not full-render the shell (keeps the input focused)', () => {
  paints = 0;
  results.innerHTML = '';
  globalThis.S.libUi.screen = 'list';
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

test('inline builder restores metric selectors and reflects non-rep metrics without changing the logger contract',()=>{
 const tid=S.library.templates[0].id,bid=S.library.templates[0].blocks.at(-1).id;
 LibraryView.open(tid);LibraryView.editBlock(bid);
 let html=LibraryView.html();
 assert.match(html,/What do you want to track\?/);
 assert.match(html,/First metric for Squat/);
 assert.match(html,/Weight \(kg\)/);
 LibraryView.setCols('seconds','none',bid);
 const block=HybridLibrary.template(S.library,tid).blocks.at(-1);
 assert.deepEqual(block.columns,['seconds']);
 html=LibraryView.html();
 assert.match(html,/>Seconds</);
 assert.doesNotMatch(html,/Set 1 reps|Add final AMRAP/);
 const before=block.setCount;
 LibraryView.nudgeSets(1,bid);
 assert.equal(HybridLibrary.template(S.library,tid).blocks.at(-1).setCount,before+1);
 LibraryView.setCols('meters','weight_kg',bid);
 assert.deepEqual(HybridLibrary.template(S.library,tid).blocks.at(-1).columns,['meters','weight_kg']);
 html=LibraryView.html();
  assert.match(html,/>Meters</);
  assert.match(html,/>Weight \(kg\)</);
});

test('creating a session walks warm-up, the exercise picker, reps, tempo, cool-down, then the session', () => {
  const savedTempos = new Map();
  globalThis.localStorage = {
    getItem(key) { return savedTempos.has(key) ? savedTempos.get(key) : null; },
    setItem(key, value) { savedTempos.set(key, String(value)); },
  };
  LibraryView.create();
  assert.equal(S.libUi.flow, 'wizard');
  assert.equal(S.libUi.screen, 'warmup');
  assert.match(LibraryView.html(), />Warm-up</);
  assert.match(LibraryView.html(), /Bike/);
  assert.match(LibraryView.html(), />Next</);
  LibraryView.wizardNext();
  assert.equal(S.libUi.screen, 'edit');
  assert.match(LibraryView.html(), /Session instructions/);
  LibraryView.picker('exercises');
  assert.match(LibraryView.html(), /Superset/);
  assert.match(LibraryView.html(), /Create New Exercise/);
  const squat = S.library.catalog.exercises.find((e) => e.title === 'Back Squat');
  const bench = S.library.catalog.exercises.find((e) => e.title === 'Bench Press');
  LibraryView.togglePick(squat.id);
  LibraryView.addPicked(false);
  assert.match(LibraryView.html(), /Back Squat/);
  assert.equal(S.libUi.screen, 'exercises');
  LibraryView.togglePick(bench.id);
  const pull = S.library.catalog.exercises.find((e) => e.title === 'Lat Pull Downs');
  LibraryView.togglePick(pull.id);
  LibraryView.addPicked(true);
  LibraryView.wizardNext();
  assert.match(LibraryView.html(), /What do you want to track\?/);
  assert.match(LibraryView.html(), /Back Squat/);
  assert.match(LibraryView.html(), /No tempo/);
  assert.match(LibraryView.html(), /Add tempo/);
  assert.doesNotMatch(LibraryView.html(), /Same tempo for every set/);
  const squatId = HybridLibrary.template(S.library, S.libUi.tid).blocks.find((b) => b.title === 'Back Squat').id;
  LibraryView.beginTempo(squatId);
  const adding = LibraryView.html();
  assert.match(adding, /Lower/);
  assert.match(adding, /way down/);
  assert.match(adding, /Pause/);
  assert.match(adding, /bottom/);
  assert.match(adding, /Lift/);
  assert.match(adding, /X means fast/);
  assert.match(adding, />top</);
  LibraryView.draftTempo(0, '3');
  LibraryView.draftTempo(1, '1');
  LibraryView.draftTempo(2, 'x');
  LibraryView.draftTempo(3, '0');
  LibraryView.saveTempo(squatId);
  assert.equal(HybridLibrary.template(S.library, S.libUi.tid).blocks.find((b) => b.title === 'Back Squat').tempo, '31X0');
  assert.deepEqual(JSON.parse(globalThis.localStorage.getItem('strength-training-tempos')), ['31X0']);
  LibraryView.wizardNext();
  assert.match(LibraryView.html(), /Bench Press/);
  assert.match(LibraryView.html(), /Lat Pull Downs/);
  LibraryView.wizardNext();
  assert.match(LibraryView.html(), /Cool-down/);
  assert.equal(S.libUi.screen, 'cooldown');
  assert.equal(S.libUi.flow, 'wizard');
  LibraryView.wizardBack();
  assert.equal(S.libUi.screen, 'edit');
  assert.equal(S.libUi.flow, 'wizard');
  LibraryView.wizardBack();
  assert.equal(S.libUi.screen, 'warmup');
  LibraryView.wizardNext();
  LibraryView.wizardNext();
  assert.equal(S.libUi.screen, 'cooldown');
  LibraryView.setRoleText('cooldown', 'Easy walk');
  LibraryView.wizardNext();
  const html = LibraryView.html();
  assert.match(html, /Post to calendar/);
  assert.match(html, /31X0/);
  assert.match(html, /WARM-UP/);
  assert.match(html, /Cool-down/);
  assert.doesNotMatch(html, /Create session/);
  const plan = HybridLibrary.compile(HybridLibrary.template(S.library, S.libUi.tid));
  assert.equal(plan.blocks.find((b) => b.title === 'Back Squat').prescription.endsWith('31X0'), true);
  assert.equal(plan.blocks.find((b) => b.title === 'Bench Press').tempo, undefined);
});

test('leaving or posting the wizard returns later edits to the normal editor', () => {
  LibraryView.create();
  const tid = S.libUi.tid;
  LibraryView.goList();
  assert.equal(S.libUi.flow, null);
  LibraryView.open(tid);
  LibraryView.picker('exercises');
  assert.equal(S.libUi.screen, 'picker');
  LibraryView.create();
  LibraryView.calendar(S.libUi.tid, true);
  LibraryView.setDate('2026-12-02');
  LibraryView.confirmDate();
  assert.equal(S.libUi.screen, 'list');
  assert.equal(S.libUi.flow, null);
});

test('next on reps with every lift deleted moves to cool-down', () => {
  LibraryView.create();
  const tid = S.libUi.tid;
  LibraryView.wizardNext();
  LibraryView.picker('exercises');
  const squat = S.library.catalog.exercises.find((e) => e.title === 'Back Squat');
  LibraryView.togglePick(squat.id);
  LibraryView.addPicked(false);
  LibraryView.wizardNext();
  const bid = HybridLibrary.template(S.library, tid).blocks.find((b) => b.kind === 'lift' && !b.role).id;
  LibraryView.removeBlock(bid);
  assert.doesNotThrow(() => LibraryView.wizardNext());
  assert.equal(S.libUi.screen, 'cooldown');
});

test('changing wizard lifts closes the reps keypad before it can write', () => {
  LibraryView.create();
  const tid = S.libUi.tid;
  LibraryView.wizardNext();
  const squat = S.library.catalog.exercises.find((e) => e.title === 'Back Squat');
  const bench = S.library.catalog.exercises.find((e) => e.title === 'Bench Press');
  S.libUi.tab = 'exercises';
  LibraryView.picker('exercises');
  LibraryView.togglePick(squat.id);
  LibraryView.addPicked(false);
  LibraryView.togglePick(bench.id);
  LibraryView.addPicked(false);
  LibraryView.wizardNext();
  const first = HybridLibrary.template(S.library, tid).blocks.find((b) => b.kind === 'lift' && !b.role).id;
  LibraryView.openNumberPad('set:0', first);
  assert.match(LibraryView.html(), /Reps keypad/);
  LibraryView.wizardNext();
  assert.doesNotMatch(LibraryView.html(), /Reps keypad/);
  LibraryView.numberKey('6');
  const lifts = HybridLibrary.template(S.library, tid).blocks.filter((b) => b.kind === 'lift' && !b.role);
  assert.equal(lifts[0].repTarget, '8');
  assert.equal(lifts[1].repTarget, '8');
});

test('deleting the open block drops its keypad and selection', () => {
  LibraryView.create();
  const tid = S.libUi.tid;
  LibraryView.wizardNext();
  const squat = S.library.catalog.exercises.find((e) => e.title === 'Back Squat');
  const bench = S.library.catalog.exercises.find((e) => e.title === 'Bench Press');
  S.libUi.tab = 'exercises';
  LibraryView.picker('exercises');
  LibraryView.togglePick(squat.id);
  LibraryView.addPicked(false);
  LibraryView.togglePick(bench.id);
  LibraryView.addPicked(false);
  LibraryView.wizardNext();
  const first = HybridLibrary.template(S.library, tid).blocks.find((b) => b.kind === 'lift' && !b.role).id;
  LibraryView.openNumberPad('set:0', first);
  LibraryView.removeBlock(first);
  assert.equal(S.libUi.bid, null);
  assert.doesNotMatch(LibraryView.html(), /Reps keypad/);
  LibraryView.numberKey('4');
  const left = HybridLibrary.template(S.library, tid).blocks.find((b) => b.kind === 'lift' && !b.role);
  assert.equal(left.title, 'Bench Press');
  assert.equal(left.repTarget, '8');
});

test('the lift card uses the tempo dropdown and Next leaves for cool-down', () => {
  const tid = globalThis.S.library.templates[0].id;
  globalThis.S.library = globalThis.HybridLibrary.addExercise(globalThis.S.library, tid, {
    title: 'Back Squat', setCount: 3, columns: ['reps']
  });
  globalThis.S.libUi.screen = 'edit';
  globalThis.S.libUi.tid = tid;
  let html = globalThis.LibraryView.html();
  assert.match(html, /No tempo/);
  assert.match(html, /Add tempo/);
  assert.doesNotMatch(html, /Same tempo for every set/);
  assert.match(html, /Reps/);
  assert.match(html, /Meters/);
  assert.doesNotMatch(html, /Watts|Calories|Linear Weight Progression|Inches|Velocity|Other/);
  globalThis.LibraryView.wizardNext();
  assert.equal(globalThis.S.libUi.screen, 'cooldown');
});
