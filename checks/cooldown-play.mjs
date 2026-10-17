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
  setInterval() { return 1; },
  clearInterval() {},
  console,
  __now: Date.parse('2026-10-16T12:00:00.000Z')
};
vm.createContext(context);
context.window = context;
vm.runInContext('Date.now = function () { return __now; };', context);
vm.runInContext(scripts[0][1], context);
context.Play.restart();
const saved = JSON.parse(store['strength-cooldown-play']);
must(saved.warmups.length === 6, 'seed length ' + saved.warmups.length);
must(saved.warmups.every((block) => block.sets.length === 3), 'cool-down is not three rounds');
must(saved.warmups[0].title === 'Easy Bike' && saved.warmups[0].metric === 'seconds' && saved.warmups[0].sets[0].text === '180', 'easy bike is not 180 seconds');
must(saved.warmups[5].title === 'Cat-Cow' && saved.warmups[5].metric === 'reps', 'cat-cow is not reps');
must(view.innerHTML.includes('>Cool-down<'), 'screen did not open on Cool-down');
context.Play.startPrep();
must(view.innerHTML.includes('>Easy Bike<') && view.innerHTML.includes('>3:00<'), 'easy bike did not start at 3:00');
console.log('cool-down play ok');
