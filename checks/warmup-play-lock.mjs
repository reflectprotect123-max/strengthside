/**
 * Fails when the locked warm-up play drifts.
 * Contract: docs/warmup-play-lock.md
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'prototypes/strength-builder-play.html'), 'utf8');
const KEY = 'strength-builder-play';
const LOCKED = [
  ['bike', 'Bike', 'seconds', '180', 3],
  ['row', 'Row', 'seconds', '180', 3],
  ['run', 'Run', 'seconds', '180', 3],
  ['ski', 'Ski', 'seconds', '180', 3],
  ['jump_rope', 'Jump Rope', 'seconds', '60', 3],
  ['push_downs', 'Push Downs', 'reps', '10', 0],
  ['hip_switch', '90/90 Hip Switch', 'reps', '8', 0],
  ['isometric_hold', 'Isometric Hold', 'seconds', '30', 3],
  ['farmers_carry', 'Farmers Carry', 'meters', '20', 0],
  ['band_pull_apart', 'Band Pull-Apart', 'reps', '15', 0],
  ['arm_circle', 'Arm Circle', 'reps', '10', 0],
  ['bodyweight_squat', 'Bodyweight Squat', 'reps', '10', 0],
  ['glute_bridge', 'Glute Bridge', 'reps', '10', 0],
  ['worlds_greatest', "World's Greatest Stretch", 'reps', '5', 0],
  ['dead_bug', 'Dead Bug', 'reps', '8', 0],
  ['inchworm', 'Inchworm', 'reps', '6', 0]
];

function must(cond, msg) {
  if (!cond) {
    console.error('WARM-UP LOCK FAILED: ' + msg);
    process.exit(1);
  }
}

must(html.includes('LOCKED warm-up play'), 'the play file is missing its lock banner');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
must(scripts.length === 1, 'expected one play script');

function boot() {
  const store = {};
  const intervals = [];
  const phone = { classList: { toggle() {} } };
  const view = { innerHTML: '', scrollTop: 0, querySelector() { return null; } };
  const context = {
    document: {
      getElementById(id) {
        if (id === 'phone') return phone;
        if (id === 'view') return view;
        return null;
      },
      querySelector() { return null; },
      addEventListener() {},
      activeElement: null
    },
    sessionStorage: {
      getItem(key) { return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null; },
      setItem(key, value) { store[key] = String(value); }
    },
    setInterval(fn) { intervals.push(fn); return intervals.length; },
    clearInterval() {},
    console,
    __now: Date.parse('2026-10-16T12:00:00.000Z')
  };
  vm.createContext(context);
  context.window = context;
  vm.runInContext('Date.now = function () { return __now; };', context);
  vm.runInContext(scripts[0][1], context);
  return {
    Play: context.Play,
    view,
    jump(ms) {
      context.__now += ms;
      intervals.forEach((fn) => fn());
    },
    saved() { return JSON.parse(store[KEY]); }
  };
}

function timerHtml(view) {
  const at = view.innerHTML.indexOf('<div class="tm-full"');
  must(at >= 0, 'timed movement did not open the timer');
  return view.innerHTML.slice(at);
}

function cells(view) {
  return view.innerHTML.match(/class="lib-cell/g)?.length || 0;
}

const play = boot();
play.Play.restart();
const seeded = play.saved().warmups;
must(seeded.length === 5, 'seed is ' + seeded.map((b) => b.catalogId).join(', '));
seeded.forEach((block, index) => {
  const row = LOCKED[index];
  must(block.catalogId === row[0] && block.metric === row[2] && block.countIn === row[4], row[0] + ' left the timed seed');
  must(block.sets.length === 3 && block.sets.every((set) => set.text === row[3]), row[1] + ' is not three rounds of ' + row[3]);
});

play.Play.startPrep();
let timer = timerHtml(play.view);
must(timer.includes('>Bike<') && timer.includes('tm-count') && timer.includes('>3<'), 'Bike did not count in from 3');
must(!timer.includes('>Next<'), 'Next appeared before Bike finished');
must(cells(play.view) === 1, 'Bike showed more than the current round');
play.jump(3000);
timer = timerHtml(play.view);
must(timer.includes('>3:00<') && !timer.includes('>Next<'), 'Bike did not roll into 3:00');
play.jump(180000);
must(play.view.innerHTML.includes('>Row<'), 'Bike did not auto-advance to Row');

const rope = play.saved().warmups.find((block) => block.catalogId === 'jump_rope');
play.Play.startListed(rope.id);
timer = timerHtml(play.view);
must(timer.includes('>Jump Rope<') && timer.includes('tm-count') && timer.includes('>3<') && !timer.includes('>Next<'), 'Jump Rope did not count in from 3');
play.jump(3000);
timer = timerHtml(play.view);
must(timer.includes('>1:00<') && !timer.includes('>Next<'), 'Jump Rope did not roll into 1:00');

function only(id) {
  play.Play.restart();
  play.saved().warmups.map((block) => block.id).forEach((blockId) => play.Play.removeBlock(blockId));
  play.Play.togglePick(id);
  play.Play.addSelected();
  return play.saved().warmups[0];
}

const hold = only('isometric_hold');
must(hold.countIn === 3 && hold.sets.length === 3 && hold.sets.every((set) => set.text === '30'), 'hold is not a 3-count into 30 seconds for three rounds');
play.Play.startPrep();
timer = timerHtml(play.view);
must(timer.includes('tm-count') && timer.includes('>3<') && !timer.includes('>0:30<'), 'hold did not start on 3');
play.jump(3000);
timer = timerHtml(play.view);
must(!timer.includes('tm-count') && timer.includes('>0:30<') && !timer.includes('>Next<'), 'hold did not roll into 0:30');
play.jump(30000);
timer = timerHtml(play.view);
must(timer.includes('tm-count') && timer.includes('>3<'), 'hold did not auto-advance into the next round');

const carry = only('farmers_carry');
play.Play.startPrep();
must(play.view.innerHTML.includes('>Round 1<') && cells(play.view) === 1, 'carry did not open on round 1');
play.Play.openPad(carry.id, 0, 'text');
must(play.view.innerHTML.includes('>M<'), 'carry keypad is not metres');
play.Play.advanceWarm();
must(play.view.innerHTML.includes('>Round 2<') && play.view.innerHTML.includes('>2<'), 'carry did not walk into round 2');
play.Play.advanceWarm();
must(play.view.innerHTML.includes('>Round 3<'), 'carry did not walk into round 3');
play.Play.advanceWarm();
must(play.view.innerHTML.includes('>Warm-up<') && !play.view.innerHTML.includes('tm-full'), 'carry did not return to the warm-up list');

const reps = only('push_downs');
play.Play.startPrep();
play.Play.openPad(reps.id, 0, 'text');
must(play.view.innerHTML.includes('>REPS<'), 'push downs keypad is not reps');

play.Play.restart();
play.saved().warmups.map((block) => block.id).forEach((blockId) => play.Play.removeBlock(blockId));
LOCKED.forEach((row) => play.Play.togglePick(row[0]));
play.Play.addSelected();
const all = play.saved().warmups;
must(all.length === LOCKED.length, 'catalog length is ' + all.length);
all.forEach((block, index) => {
  const row = LOCKED[index];
  const texts = block.sets.map((set) => set.text).join(',');
  must(block.catalogId === row[0] && block.title === row[1] && block.metric === row[2], 'catalog moved at ' + row[0]);
  must(block.countIn === row[4], row[1] + ' count-in is ' + block.countIn);
  must(block.sets.length === 3 && block.sets.every((set) => set.text === row[3]), row[1] + ' rounds are ' + texts);
});

play.Play.startPrep();
must(play.view.innerHTML.includes('>Round 1<') && play.view.innerHTML.includes('>Bike<') && timerHtml(play.view).includes('tm-count'), 'full circuit did not count in on Bike');
play.jump(3000);
must(timerHtml(play.view).includes('>3:00<'), 'full circuit Bike did not reach 3:00');
play.jump(180000);
must(play.view.innerHTML.includes('>Round 1<') && play.view.innerHTML.includes('>Row<'), 'Bike did not hand off to Row in the same round');

console.log('warmup play lock ok: ' + LOCKED.length + ' movements, 3 rounds');
