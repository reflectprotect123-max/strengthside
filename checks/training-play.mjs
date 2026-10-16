/**
 * The training builder play keeps the app's set editor:
 * per-set reps, ranges, a final AMRAP, and supersets.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'prototypes/strength-training-play.html'), 'utf8');
const KEY = 'strength-training-play';

function must(cond, msg) {
  if (!cond) {
    console.error('TRAINING PLAY FAILED: ' + msg);
    process.exit(1);
  }
}

const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
must(scripts.length === 1, 'expected one training script');
must(!html.includes('LOCKED warm-up play'), 'training play must stay out of the warm-up lock');

function boot() {
  const store = {};
  const phone = { classList: { toggle() {} } };
  const view = { innerHTML: '', scrollTop: 0 };
  const fields = {};
  const document = {
    getElementById(id) {
      if (id === 'phone') return phone;
      if (id === 'view') return view;
      if (id === 'libResults') return { innerHTML: '' };
      return fields[id] || null;
    },
    querySelector() { return null; },
    addEventListener() {},
    activeElement: null
  };
  const context = {
    document,
    sessionStorage: {
      getItem(key) { return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null; },
      setItem(key, value) { store[key] = String(value); }
    },
    console
  };
  vm.createContext(context);
  context.window = context;
  vm.runInContext(scripts[0][1], context);
  return {
    Play: context.Play,
    view,
    fields,
    saved() { return JSON.parse(store[KEY]); }
  };
}

function byTitle(play, title) {
  return play.saved().blocks.find((block) => block.title === title);
}

const play = boot();
play.Play.restart();
let page = play.view.innerHTML;
must(page.includes('>Session Template<'), 'editor did not open');
must(page.includes('>Back Squat<') && page.includes('>Bench Press<'), 'seeded lifts are missing');
must(page.includes('>A<') && page.includes('>B<') && page.includes('>C1<') && page.includes('>C2<'), 'letters are ' + page.match(/lib-letter">([^<]+)/g));
must(page.includes('− Superset'), 'accessory superset marker is missing');
must(page.includes('10 / 8 / 6 / AMRAP · 20X1'), 'squat line is not 10/8/6 plus AMRAP');
must(page.includes('3 x 6-8 · 33X1'), 'bench line is not 3 x 6-8');
must((page.match(/aria-label="Set \d+ AMRAP"/g) || []).length === 1, 'squat AMRAP cell is missing');

const squat = byTitle(play, 'Back Squat');
play.Play.openPad(squat.id, 0, 'text');
must(play.view.innerHTML.includes('>REPS<'), 'squat keypad is not reps');
play.Play.key('–');
must(play.saved().pad.error === 'Range needs Rep Range.', 'a fixed rep accepted a range');
must(byTitle(play, 'Back Squat').sets[0].text === '10', 'the rejected range changed the set');
play.Play.key('5');
must(byTitle(play, 'Back Squat').sets.map((set) => set.text).join(',') === '5,8,6,', 'per-set edit changed another set');

const bench = byTitle(play, 'Bench Press');
play.Play.openPad(bench.id, 0, 'text');
must(play.view.innerHTML.includes('>REPS<') && play.view.innerHTML.includes('Rep Range keypad'), 'bench keypad is not a rep range');
play.Play.key('8');
play.Play.key('–');
play.Play.key('6');
must(play.saved().pad.error === 'Enter the lower number first.', 'a descending range was accepted');
must(byTitle(play, 'Bench Press').sets[0].text === '8', 'a descending range replaced the last valid number');

play.Play.restart();
play.Play.nudge(byTitle(play, 'Bench Press').id, 1);
must(byTitle(play, 'Bench Press').sets.map((set) => set.text).join(',') === '6-8,6-8,6-8,6-8', 'adding a set did not copy 6-8');
play.Play.amrap(byTitle(play, 'Bench Press').id);
must(byTitle(play, 'Bench Press').sets.at(-1).amrap, 'bench did not gain a final AMRAP');
play.Play.metric(byTitle(play, 'Bench Press').id, 'reps');
const converted = byTitle(play, 'Bench Press');
must(converted.sets.filter((set) => !set.amrap).every((set) => set.text === '6'), 'range did not become the lower number');
must(converted.notice === 'Range became the lower number.', 'the range conversion was silent');

play.Play.restart();
play.Play.goPick();
play.Play.togglePick('front_squat');
play.Play.togglePick('romanian_deadlift');
play.Play.addSuperset();
const added = play.saved().blocks.slice(-2);
must(added.map((block) => block.title).join(',') === 'Front Squat,Romanian Deadlift', 'superset order changed');
must(added[0].groupId && added[0].groupId === added[1].groupId, 'the two lifts were not grouped');
must(play.view.innerHTML.includes('>D1<') && play.view.innerHTML.includes('>D2<'), 'new superset letters are missing');

play.Play.goPick();
play.Play.togglePick('farmer_carry');
play.Play.addSelected();
const carry = byTitle(play, 'Farmer Carry');
must(carry.metric === 'meters' && carry.sets.map((set) => set.text).join(',') === '20,20,20', 'carry is not 3 x 20 m');
must(!play.view.innerHTML.includes('Add final AMRAP</button></article>') || !play.view.innerHTML.slice(play.view.innerHTML.indexOf('Farmer Carry')).includes('Add final AMRAP'), 'carry offered an AMRAP');
play.Play.openPad(carry.id, 0, 'text');
must(play.view.innerHTML.includes('>M<'), 'carry keypad is not metres');

play.Play.calendar();
must(play.view.innerHTML.includes('>Post to calendar<'), 'calendar did not open');
play.Play.confirmDate();
must(play.saved().posted && play.view.innerHTML.includes('Posted for ' + play.saved().posted), 'posting did not return to the session');

console.log('training play ok');
