# Session builder replacement implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Library warm-up note, tempo wizard, and cool-down note with the warm-up circuit, the lift cards, and the cool-down circuit.

**Architecture:** `library.js` stores warm-up and cool-down as `role` exercises with a prescribed value and three rounds. `library-ui.js` renders those circuits and the lift cards, and stops routing through the text warm-up, per-lift tempo page, and text cool-down. `compile` and the logger path already on this branch play the result. The prototype HTML files stay the references and are not shipped as pages.

**Tech Stack:** Vanilla JS in `apps/athlete`, node:test, Playwright for the browser journey.

**Spec:** `docs/superpowers/specs/2026-10-16-session-builder-replacement-design.md`

## Global Constraints

- Warm-up behavior stays the locked circuit in `docs/warmup-play-lock.md`. Do not edit `prototypes/strength-builder-play.html`.
- Tempo stays the locked dropdown in `docs/training-tempo-lock.md`. No tempo, then saved tempos, then Add with four boxes: Lower (way down), Pause (bottom), Lift (X means fast), Pause (top).
- Cool-down tracks only `seconds` and `reps`.
- Builder metric list is Reps, Rep Range, Weight (lb), Weight (kg), Weight (%), Time (mm:ss), Seconds, Miles, Yards, Meters, and Feet. No target weight field.
- Main-lift ramps stay two sets, labeled Ramp, with no skip control.
- Do not run Capgo, deploy, or merge.
- Edit `apps/shared/training-core.js` only if a contract change is required, then run `node scripts/sync-training-core.mjs`. This plan does not require that.

---

### Task 1: Seed a new template with the warm-up circuit

**Files:**
- Modify: `apps/athlete/library.js` (`createTemplate`)
- Test: `apps/athlete/library.test.js`

**Interfaces:**
- Consumes: `addExercise(state, tid, { title, columns, setCount, value, role, countIn })`
- Produces: `createTemplate` returns a template whose first five blocks are Bike, Row, Run, Ski, Jump Rope, each `role: 'warmup'`, `setCount: 3`

- [ ] **Step 1: Write the failing test**

```js
test('a new template seeds the locked warm-up and an empty cool-down', () => {
  const st = Lib.createTemplate(Lib.emptyState(), { title: 'Lower Strength' });
  const blocks = st.templates[0].blocks;
  assert.deepEqual(blocks.map((b) => b.title), ['Bike', 'Row', 'Run', 'Ski', 'Jump Rope']);
  assert.ok(blocks.every((b) => b.role === 'warmup' && b.setCount === 3));
  assert.equal(blocks[0].prescribed, '180');
  assert.equal(blocks[4].prescribed, '60');
  assert.equal(blocks.find((b) => b.role === 'cooldown'), undefined);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test apps/athlete/library.test.js --test-name-pattern "seeds the locked warm-up"`

Expected: FAIL because `blocks` is empty.

- [ ] **Step 3: Write minimal implementation**

Inside `createTemplate`, after the template object is pushed, call `addExercise` five times on `st.templates[0].id`:

```js
[
  ['Bike', '180'],
  ['Row', '180'],
  ['Run', '180'],
  ['Ski', '180'],
  ['Jump Rope', '60']
].forEach(([title, value]) => {
  Object.assign(st, addExercise(st, st.templates[0].id, {
    title, columns: ['seconds'], setCount: 3, value, role: 'warmup'
  }));
});
```

Do not seed cool-down movements. Do not read, convert, or delete blocks already saved on other templates. Leave any existing warm-up or cool-down instruction text on `template.instructions`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test apps/athlete/library.test.js --test-name-pattern "seeds the locked warm-up"`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/athlete/library.js apps/athlete/library.test.js
git commit -m "Seed a new session with the warm-up circuit."
```

### Task 2: Open the builder on the warm-up circuit

**Files:**
- Modify: `apps/athlete/library-ui.js` (`create`, `html`, `wizardNext`)
- Test: `apps/athlete/library-ui.test.js`

**Interfaces:**
- Consumes: template blocks from Task 1
- Produces: `LibraryView.create()` sets `libUi.screen` to `'warmup'`. `LibraryView.html()` for that screen lists Bike and a Next control that goes to `'edit'`.

- [ ] **Step 1: Write the failing test**

```js
test('create opens the warm-up circuit instead of the note wizard', () => {
  globalThis.S.library = globalThis.HybridLibrary.emptyState();
  globalThis.LibraryView.create();
  assert.equal(globalThis.S.libUi.screen, 'warmup');
  const html = globalThis.LibraryView.html();
  assert.match(html, /Warm-up/);
  assert.match(html, /Bike/);
  assert.match(html, /3:00|180/);
  assert.doesNotMatch(html, /Session instructions/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test apps/athlete/library-ui.test.js --test-name-pattern "warm-up circuit"`

Expected: FAIL because `create()` still goes to `'instructions'`.

- [ ] **Step 3: Write minimal implementation**

Change `create()` to `go('warmup', ...)`.

Add `prepCircuitHtml(role)` used when `screen === 'warmup'`. It lists `blocks.filter(b => b.role === 'warmup')` with title and `rxFor` summary, an Add button, and Next calling `LibraryView.wizardNext()`. `wizardNext` from `'warmup'` goes to `'edit'`.

Render the locked warm-up catalog (Bike, Row, Run, Ski, Jump Rope, Push Downs, 90/90 Hip Switch, Isometric Hold, Farmers Carry, and the rep movements in `docs/warmup-play-lock.md`) as add rows. Adding calls `addExercise` with `role: 'warmup'`, `setCount` equal to the current round count, and `countIn: 3` only for Isometric Hold.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test apps/athlete/library-ui.test.js --test-name-pattern "warm-up circuit"`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/athlete/library-ui.js apps/athlete/library-ui.test.js
git commit -m "Open a new session on the warm-up circuit."
```

### Task 3: Put the tempo dropdown on the lift card and skip the tempo page

**Files:**
- Modify: `apps/athlete/library-ui.js` (`exerciseCardHtml`, `wizardNext`, `html`)
- Test: `apps/athlete/library-ui.test.js`

**Interfaces:**
- Consumes: `patchBlock(state, tid, bid, { tempo })`
- Produces: the edit card HTML contains a button labeled with the current tempo or `No tempo`, plus `Add tempo`. `wizardNext` from `'edit'` goes to `'cooldown'`.

- [ ] **Step 1: Write the failing test**

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test apps/athlete/library-ui.test.js --test-name-pattern "tempo dropdown"`

Expected: FAIL because the card has no tempo dropdown and `wizardNext` is not on the edit screen.

- [ ] **Step 3: Write minimal implementation**

On each lift card, replace any tempo-page link with the dropdown from `docs/training-tempo-lock.md`. Saved tempos live in `localStorage` key `strength-training-tempos`. Add opens four inputs labeled Lower / way down, Pause / bottom, Lift / X means fast, Pause / top. Save writes the four-character tempo with `patchBlock`.

`wizardNext` when `screen === 'edit'` calls `go('cooldown')`. `wizardBack` when `screen === 'edit'` calls `go('warmup')`. The lift-card metric `<select>` options are exactly: Reps, Rep Range, Weight (lb), Weight (kg), Weight (%), Time (mm:ss), Seconds, Miles, Yards, Meters, Feet, and None for the second column. Delete the `'tempo'` branch from `wizardNext` and `wizardBack`, and stop `html()` from returning `tempoStepHtml()`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test apps/athlete/library-ui.test.js --test-name-pattern "tempo dropdown"`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/athlete/library-ui.js apps/athlete/library-ui.test.js
git commit -m "Put the locked tempo dropdown on the lift card."
```

### Task 4: Replace the cool-down note with the seconds-and-reps circuit

**Files:**
- Modify: `apps/athlete/library-ui.js` (`html`, `prepCircuitHtml`)
- Test: `apps/athlete/library-ui.test.js`

**Interfaces:**
- Consumes: `addExercise(..., { role: 'cooldown', columns, value, setCount })`
- Produces: `screen === 'cooldown'` HTML lists only cool-down blocks and only offers Reps and Seconds.

- [ ] **Step 1: Write the failing test**

```js
test('cool-down is a circuit and only offers seconds and reps', () => {
  globalThis.S.libUi.screen = 'cooldown';
  const html = globalThis.LibraryView.html();
  assert.match(html, /Cool-down/);
  assert.doesNotMatch(html, /Coach notes for Start Session|Mark As Completed/);
  assert.match(html, /Reps/);
  assert.match(html, /Seconds/);
  assert.doesNotMatch(html, /Meters|Watts|Calories/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test apps/athlete/library-ui.test.js --test-name-pattern "cool-down is a circuit"`

Expected: FAIL because `cooldown` still renders `textStepHtml`.

- [ ] **Step 3: Write minimal implementation**

When `screen === 'cooldown'`, render `prepCircuitHtml('cooldown')`. The add list is Easy Bike, Breathing, Couch Stretch, Hamstring Stretch, Child's Pose, Cat-Cow, Thread the Needle, and Figure Four, with the metrics from `prototypes/strength-cooldown-play.html`. Adding a cool-down movement passes `role: 'cooldown'` and only `seconds` or `reps`. The track `<select>` options are exactly Reps and Seconds.

`wizardNext` from `'cooldown'` goes to `'calendar'` when the template has at least one lift, otherwise it stays on cool-down. `wizardBack` from `'cooldown'` goes to `'edit'`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test apps/athlete/library-ui.test.js --test-name-pattern "cool-down is a circuit"`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/athlete/library-ui.js apps/athlete/library-ui.test.js
git commit -m "Replace the cool-down note with the seconds and reps circuit."
```

### Task 5: Start Session plays warm-up, lifts, then cool-down

**Files:**
- Modify: `apps/athlete/library.js` (`compile`) only if a cool-down or warm-up block is still emitted as a text checklist
- Test: `apps/athlete/library.test.js`

**Interfaces:**
- Consumes: blocks with `role: 'warmup' | 'cooldown'`, `prescribed`, `countIn`, `setCount`
- Produces: `HybridSession.pagesFromPlan(Lib.compile(template))` ordered warm-up rounds, then lifts, then cool-down rounds, then Done Training

- [ ] **Step 1: Write the failing test**

```js
test('start session order is warm-up rounds, lifts, cool-down rounds', () => {
  let st = Lib.createTemplate(Lib.emptyState(), { title: 'Lower Strength' });
  const tid = st.templates[0].id;
  st = Lib.addExercise(st, tid, { title: 'Back Squat', setCount: 3, columns: ['reps'], value: '5' });
  st = Lib.patchBlock(st, tid, st.templates[0].blocks.at(-1).id, { tempo: '20X1' });
  st = Lib.addExercise(st, tid, { title: 'Easy Bike', columns: ['seconds'], setCount: 3, value: '180', role: 'cooldown' });
  const names = HybridSession.pagesFromPlan(Lib.compile(st.templates[0])).map((p) => p.section + ':' + p.title);
  assert.equal(names[0], 'Warm-Up:Bike');
  assert.ok(names.includes('Strength/Power:Back Squat'));
  assert.ok(names.includes('Cool-Down:Easy Bike'));
  assert.ok(names.indexOf('Warm-Up:Bike') < names.indexOf('Strength/Power:Back Squat'));
  assert.ok(names.indexOf('Strength/Power:Back Squat') < names.indexOf('Cool-Down:Easy Bike'));
  assert.equal(names.at(-1), 'undefined:Done Training');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test apps/athlete/library.test.js --test-name-pattern "start session order"`

Expected: FAIL if create seeding or compile order is wrong. If it already passes because Task 1 and the existing logger path are enough, keep the test and do not change `compile`.

- [ ] **Step 3: Write minimal implementation**

If the test fails, fix `compile` so `role: 'warmup'` and `role: 'cooldown'` blocks are emitted as lifts with `section` Warm-Up or Cool-Down, `prescribed`, and `countIn`, in template order. Do not emit them as `kind: 'warmup'` checklist blocks.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test apps/athlete/library.test.js --test-name-pattern "start session order"`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/athlete/library.js apps/athlete/library.test.js
git commit -m "Play warm-up, lifts, then cool-down in that order."
```

### Task 6: Browser journey of one session

**Files:**
- Modify: `checks/browser/session.spec.mjs`
- Test: `checks/browser/session.spec.mjs`

**Interfaces:**
- Consumes: the Library screens from Tasks 2–4 and the logger from Task 5
- Produces: a Playwright test that creates a session, sees Bike, sees No tempo on the lift card, sees Cool-down, starts the session, and sees Ramp 1 of 2 with no skip button

- [ ] **Step 1: Write the failing test**

Add a test that opens the athlete app, creates a template, and asserts the visible text `Bike`, `No tempo`, and `Cool-down` before start, then after start asserts `Ramp 1 of 2` and `getByRole('button', { name: /skip ramp/i })` has count 0.

- [ ] **Step 2: Run test to verify it fails**

Run: `PLAYWRIGHT_CHROMIUM_PATH=/usr/bin/chromium pnpm exec playwright test -c checks/browser/playwright.config.mjs checks/browser/session.spec.mjs --grep "warm-up lifts cool-down"`

Expected: FAIL until the UI from Tasks 2–4 is reachable in the running app.

- [ ] **Step 3: Write minimal implementation**

Only if the journey cannot reach the new screens. Do not add a skip control. Do not change ramp count.

- [ ] **Step 4: Run test to verify it passes**

Run the same Playwright command.

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add checks/browser/session.spec.mjs apps/athlete/library-ui.js
git commit -m "Walk one session from warm-up through Ramp."
```
