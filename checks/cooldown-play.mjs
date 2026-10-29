/**
 * The cool-down play is a warm-up circuit that only tracks seconds and reps.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'prototypes/strength-cooldown-play.html'), 'utf8');

function must(cond, msg) {
  if (!cond) {
    console.error('COOL-DOWN PLAY FAILED: ' + msg);
    process.exit(1);
  }
}

must(html.includes('<h1>Cool-down</h1>'), 'cool-down heading missing');
must(!html.includes('LOCKED warm-up play'), 'cool-down file is carrying the warm-up lock');
const catalog = html.slice(html.indexOf('const WARMUPS = ['), html.indexOf('];', html.indexOf('const WARMUPS = [')));
const rows = [...catalog.matchAll(/\['([^']+)', '([^']+)', '([^']+)'/g)];
must(rows.length >= 6, 'cool-down catalog is missing movements');
for (const row of rows) must(row[3] === 'seconds' || row[3] === 'reps', row[2] + ' tracks ' + row[3]);
must(!catalog.includes('meters'), 'cool-down catalog includes metres');

const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
must(scripts.length === 1, 'expected one cool-down script');
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
function jump(ms) {
  context.__now += ms;
  intervals.forEach((fn) => fn());
}
context.Play.restart();
const saved = JSON.parse(store['strength-cooldown-play']);
must(saved.warmups.length === 6, 'seed length ' + saved.warmups.length);
must(saved.warmups.every((block) => block.sets.length === 3), 'cool-down is not three rounds');
must(saved.warmups[0].title === 'Easy Bike' && saved.warmups[0].metric === 'seconds' && saved.warmups[0].sets[0].text === '180' && saved.warmups[0].countIn === 3, 'easy bike is not a 3-count into 180 seconds');
must(saved.warmups[2].title.includes('each side'), 'couch stretch is not marked each side');
must(saved.warmups[5].title === 'Cat-Cow' && saved.warmups[5].metric === 'reps', 'cat-cow is not reps');
must(view.innerHTML.includes('>Cool-down<') && !view.innerHTML.includes('tm-full'), 'screen did not open on the cool-down list');
context.Play.startPrep();
must(view.innerHTML.includes('>Easy Bike<') && view.innerHTML.includes('tm-count') && view.innerHTML.includes('>3<'), 'easy bike did not count in from 3');
jump(3000);
must(view.innerHTML.includes('>3:00<'), 'easy bike did not reach 3:00');
context.Play.restart();
JSON.parse(store['strength-cooldown-play']).warmups.map((block) => block.id).forEach((id) => context.Play.removeBlock(id));
context.Play.togglePick('couch_stretch');
context.Play.addSelected();
context.Play.startPrep();
must(view.innerHTML.includes('side 1'), 'each-side stretch did not start on side 1');
jump(60000);
must(view.innerHTML.includes('side 2') && view.innerHTML.includes('>1:00<'), 'each-side stretch did not start side 2');
context.Play.restart();
JSON.parse(store['strength-cooldown-play']).warmups.map((block) => block.id).forEach((id) => context.Play.removeBlock(id));
context.Play.togglePick('thread_needle');
context.Play.addSelected();
context.Play.startPrep();
must(view.innerHTML.includes('6 L') && view.innerHTML.includes('6 R'), 'thread the needle did not show reps on each side');
const needle = JSON.parse(store['strength-cooldown-play']).warmups[0];
context.Play.openPad(needle.id, 0, 'text');
must(view.innerHTML.includes('Left'), 'thread the needle keypad did not start on the left');
context.Play.key('>');
context.Play.key('9');
must(view.innerHTML.includes('Right') && view.innerHTML.includes('6 L') && view.innerHTML.includes('9 R'), 'thread the needle did not record the right side');
context.Play.restart();
JSON.parse(store['strength-cooldown-play']).warmups.map((block) => block.id).forEach((id) => context.Play.removeBlock(id));
context.Play.togglePick('figure_four');
context.Play.addSelected();
context.Play.startPrep();
must(view.innerHTML.includes('8 L') && view.innerHTML.includes('8 R'), 'figure four did not show reps on each side');
context.Play.restart();
JSON.parse(store['strength-cooldown-play']).warmups.map((block) => block.id).forEach((id) => context.Play.removeBlock(id));
context.Play.togglePick('cat_cow');
context.Play.addSelected();
context.Play.startPrep();
context.Play.advanceWarm();
context.Play.advanceWarm();
context.Play.advanceWarm();
must(view.innerHTML.includes('>Finished<') && view.innerHTML.includes('completed'), 'cool-down did not finish');
console.log('cool-down play ok');
