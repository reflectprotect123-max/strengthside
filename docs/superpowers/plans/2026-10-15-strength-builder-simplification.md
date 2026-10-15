# Strength Builder Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing strength builder faster by replacing repeated wizard pages with its familiar editable session overview, while preserving its data and logging behavior.

**Architecture:** Reuse `editorHtml()`, `exerciseCardHtml()`, `HybridLibrary` transformations and `StrengthTargets`. Keep one template model, route create/edit to the same screen and treat the existing picker/calendar as temporary screens. Separate transient field/keypad state from persisted workout content.

**Tech Stack:** Existing classic JavaScript modules, HTML/CSS, Node test runner, Playwright 1.57 and Capacitor Android; Node >=20.19 and pnpm 10.33.0.

**Spec:** [Builder simplification design](../specs/2026-10-15-strength-builder-simplification-design.md)

## Global Constraints

- Reuse the existing app styling, exercise cards and numeric keypad; introduce no frontend framework.
- Preserve all current metric choices, arbitrary per-set reps/ranges, final first-set-last AMRAP and invisible exercise metadata.
- Keep engine-owned weights, target difficulty and equipment jumps out of the builder.
- Conditioning, cloud schema changes and brain mathematics are outside this builder change.
- No runtime implementation, main merge or Capgo deployment is included in this planning task.

## Scope and execution order

Planning baseline: main `1c5789a3`. Refresh main before implementation; reconcile newer Cursor and [strength learning](https://github.com/reflectprotect123-max/strengthside/pull/258) work. Do not merge unrelated branches or overwrite updated modules. This cloud checkout is already isolated; do not create another worktree unless asked.

Execute tasks 1–8 in order. Prefer the user's chosen subagent-driven execution with primary-agent requirement and code-quality review after each task; this document itself does not start execution. Each task ends in a focused commit. Record before/after screenshots, assertions and test counts. Do not change stored workout values to simplify rendering.

**File boundaries:** `library.js` remains the pure template/compile API; `library-ui.js` owns rendering and editor interaction; `library.css` supplies existing visual tokens. `strength-targets.js` stays the authoritative target validator, not a duplicate builder parser. Existing `session.js`/logger/brain are contract consumers, not targets for new builder business logic. Add no second quick-builder data model. New code stays in the current modules unless an independently useful pure extraction is justified in review.

**Shared UI contract:**

```ts
type KeypadBinding = { templateId: string; blockId: string; targetId: string };
type BuilderError = { blockId: string | null; field: string; message: string };
// Additional transient S.libUi fields; these are not exercise/template fields:
type BuilderUi = {
  screen: 'edit' | 'picker' | 'newEx' | 'newCirc' | 'calendar' | 'list';
  returnScreen?: 'edit'; activeBlockId?: string | null;
  expanded?: Record<string, boolean>; errors?: BuilderError[];
  scrollAnchor?: string | null;
};
```

Existing `S.libUi.tid`, `bid`, `selected`, `q` remain compatible during migration. `LibraryView.create()`, `open(tid)`, `picker(tab)`, `addPicked(asSuperset)`, `calendar(tid,fromEditor)` and `confirmDate()` keep their public signatures. Private helpers may change; template and logger contracts may not.

### Task 1: Unify creation and editing without changing the template model

**Files:**
- Modify: `apps/athlete/library-ui.js`, `apps/athlete/library-ui.test.js`
- Read: `apps/athlete/app.js`, `apps/athlete/library.js`

**Interfaces:** Consumes existing create/open/template APIs. Produces private `normalizeBuilderUi(u,library) -> object`; keeps `LibraryView.create()` / `open(tid)` signatures and routes both to `screen:'edit'`.

- [ ] **Step 1: Add this regression to the named existing test file (its imports/helpers already exist), or the explicitly standalone browser file.**

```js
test('create opens the same editable session screen as open',()=>{
  LibraryView.create();
  const tid=S.libUi.tid;
  assert.equal(S.libUi.screen,'edit');
  assert.notEqual(S.libUi.flow,'wizard');
  assert.ok(HybridLibrary.template(S.library,tid));
  assert.match(LibraryView.html(),/Post to calendar/);
  assert.doesNotMatch(LibraryView.html(),/>Next</);
  LibraryView.open(tid); assert.equal(S.libUi.screen,'edit');
});
```

- [ ] **Step 2: Run against the baseline and verify this behavior assertion fails; missing setup alone is not a meaningful regression. After implementation, revert the relevant change briefly to confirm the assertion catches it.**

Run: `node --test apps/athlete/library-ui.test.js`.

- [ ] **Step 3: Implement the following behavior using the supplied contract.**

Retain the existing `HybridLibrary.createTemplate` call and saved template identity. Change create's destination, not its data defaults:

```js
// Inside create(), after assigning the new library:
go('edit',{tid:next.templates[0].id,flow:null,bid:null,selected:[],returnScreen:'edit'});
```

Before render, normalize restored wizard screens `instructions,warmup,exercises,reps,tempo,cooldown,overview` to edit if their template exists; preserve authored content, active block and safe scroll anchor. Missing template returns to list. Normalize `flow:'wizard'` to null so picker/calendar Back cannot resurrect the old flow. No destructive rewrite of templates, target IDs or assignments. Add tests for every legacy screen, missing templates, leaving/reopening and an existing fully populated template. Keep migration idempotent. Old wizard functions remain temporarily until call sites migrate in task 8; no new entry point uses them.

- [ ] **Step 4: Run `node --test apps/athlete/library-ui.test.js`, cover the additional cases listed above, inspect the diff and record actual pass/fail/skip counts.**

- [ ] **Step 5: Stage only the task's listed files and commit with `git commit -m "feat: open strength sessions directly in the existing editor"`. Require requirement and code-quality review before moving on.**

### Task 2: Make the familiar session editor the complete overview

**Files:**
- Modify: `apps/athlete/library-ui.js`, `apps/athlete/library.css`, `apps/athlete/library-ui.test.js`

**Interfaces:** Consumes `editorHtml`, `exerciseCardHtml`, `HybridLibrary.lettered/compile`. Produces private `optionalSectionHtml(id,label,summary,body) -> string` and `LibraryView.toggleSection(id) -> void`, with expansion held only in `S.libUi.expanded`.

- [ ] **Step 1: Add this regression to the named existing test file (its imports/helpers already exist), or the explicitly standalone browser file.**

```js
test('editor keeps add, metrics and posting while removing mandatory navigation',()=>{
  LibraryView.create();
  const tid=S.libUi.tid;
  S.library=HybridLibrary.addExercise(S.library,tid,{title:'Squat',columns:['reps','weight_kg']});
  LibraryView.open(tid);
  const html=LibraryView.html();
  assert.match(html,/Add Exercise/); assert.match(html,/Post to calendar/);
  assert.match(html,/Metrics/); assert.match(html,/Tempo/);
  assert.doesNotMatch(html,/>Next</);
  assert.doesNotMatch(html,/Target difficulty|Starting weight|Smallest weight/);
});
```

- [ ] **Step 2: Run against the baseline and verify this behavior assertion fails; missing setup alone is not a meaningful regression. After implementation, revert the relevant change briefly to confirm the assertion catches it.**

Run: `node --test apps/athlete/library-ui.test.js`.

- [ ] **Step 3: Implement the following behavior using the supplied contract.**

Keep title, existing card headers, sets/reps and Add Exercise visible. Reuse the existing colors/spacing/classes; optional content uses labeled expandable regions and summaries, not new tabs. Factor a reusable tempo-card fragment out of the existing tempo renderer rather than copy its setter/parser.

```html
<button type="button" aria-expanded="false" aria-controls="exercise-metrics-ID">Metrics</button>
<div id="exercise-metrics-ID" hidden><!-- existing two metric selectors --></div>
```

Generate safe unique IDs from stable block identity and escape labels/content as the existing code does. Use “Metrics” and “Tempo” actions; put notes beneath their card, instructions/warm-up/cool-down in session-level sections. Filled values show short summaries when collapsed. Error-bearing sections automatically expand. Keep all metric options from `HybridLibrary.TRACK` and the current Add Circuit entry. No default tempo insertion, preset toolbar or new weight field. Expansion must preserve keyboard focus, text values and scroll position. Tests verify existing populated notes, collapsed metric controls still reachable, warm-up text distinct from ramp sets, supersets/lettering and completion blocks remain editable.

- [ ] **Step 4: Run `node --test apps/athlete/library-ui.test.js`, cover the additional cases listed above, inspect the diff and record actual pass/fail/skip counts.**

- [ ] **Step 5: Stage only the task's listed files and commit with `git commit -m "feat: consolidate strength builder fields in the familiar session editor"`. Require requirement and code-quality review before moving on.**

### Task 3: Bind keypad and errors to the exact set

**Files:**
- Modify: `apps/athlete/library-ui.js`, `apps/athlete/library-ui.test.js`
- Read: `apps/athlete/logger.js`, `apps/athlete/logger.css`

**Interfaces:** Consumes `openNumberPad(field,bid)`, canonical target IDs and `StrengthTargets` validation. Produces private `resolvePadBinding(binding:KeypadBinding) -> {block,target,index}|null`; keypad state stores binding plus its existing buffer. `S.libUi.errors` uses BuilderError entries.

- [ ] **Step 1: Add this regression to the named existing test file (its imports/helpers already exist), or the explicitly standalone browser file.**

```js
test('a reordered target cannot receive another target keypad edit',()=>{
  LibraryView.create();const tid=S.libUi.tid;
  S.library=HybridLibrary.addExercise(S.library,tid,{title:'Squat',columns:['reps','weight_kg']});
  const b=HybridLibrary.template(S.library,tid).blocks[0];
  LibraryView.open(tid);LibraryView.editBlock(b.id);
  LibraryView.openNumberPad('set:0',b.id);
  LibraryView.removeBlock(b.id);LibraryView.numberKey('9');
  assert.equal(HybridLibrary.template(S.library,tid).blocks.length,0);
  assert.doesNotMatch(LibraryView.html(),/Reps keypad/);
});
```

- [ ] **Step 2: Run against the baseline and verify this behavior assertion fails; missing setup alone is not a meaningful regression. After implementation, revert the relevant change briefly to confirm the assertion catches it.**

Run: `node --test apps/athlete/library-ui.test.js`.

- [ ] **Step 3: Implement the following behavior using the supplied contract.**

Replace positional-only keypad ownership with `{templateId,blockId,targetId}` captured at open. Resolve by ID on each key, validate the target still belongs to this template and is ordinary work. Stale binding closes without mutation. Keep current index-based public handlers for compatibility, resolving to IDs immediately at entry. Reordering a set/block preserves its target identity; deleting that target closes the pad. Selecting another block or leaving the editor closes the pad before it can affect a different selection.

Enforce range permissions in both rendering and handlers:

```js
const allowsRange=block.columns.includes('reps_range');
if((key==='-'||key==='–'||key==='>')&&!allowsRange) return;
```

Use the logger's existing keypad styling rather than changing both screens. Keep all current valid rep/range inputs. Add handler tests for fixed/range dash, invalid decreasing/incomplete ranges, editing card A then B, reorder while open, delete/recreate, AMRAP not accepting numeric target input, and errors appearing only on the affected card. A pending invalid buffer blocks posting and focuses the correct field; it cannot silently fall back to a prior valid number. The shown delete test already protects an existing behavior; add a stale set-ID reorder test that fails with the old positional binding.

- [ ] **Step 4: Run `node --test apps/athlete/library-ui.test.js`, cover the additional cases listed above, inspect the diff and record actual pass/fail/skip counts.**

- [ ] **Step 5: Stage only the task's listed files and commit with `git commit -m "fix: keep builder keypad edits and errors attached to stable targets"`. Require requirement and code-quality review before moving on.**

### Task 4: Preserve tempo and optional fields without forced pages

**Files:**
- Modify: `apps/athlete/library-ui.js`, `apps/athlete/library-ui.test.js`, `apps/athlete/library.test.js`
- Modify: `apps/athlete/library.js` only if validation currently drops invalid tempo before an error can be surfaced

**Interfaces:** Consumes current `setTempoPart(index,value,bid)`, `setRoleText(role,text)`, `HybridLibrary.tempoText/compile`. Produces `LibraryView.validateBuilder(tid) -> BuilderError[]` for publish-time validation; reuses `StrengthTargets` rather than inventing target grammar.

- [ ] **Step 1: Add this regression to the named existing test file (its imports/helpers already exist), or the explicitly standalone browser file.**

```js
test('incomplete tempo prevents publication instead of silently disappearing',()=>{
  LibraryView.create();const tid=S.libUi.tid;
  S.library=HybridLibrary.addExercise(S.library,tid,{title:'Squat'});
  const bid=HybridLibrary.template(S.library,tid).blocks[0].id;
  LibraryView.setTempoPart(0,'3',bid);
  const errors=LibraryView.validateBuilder(tid);
  assert.ok(errors.some(e=>e.blockId===bid&&e.field==='tempo'));
  LibraryView.setTempoPart(1,'3',bid);LibraryView.setTempoPart(2,'X',bid);LibraryView.setTempoPart(3,'1',bid);
  assert.ok(!LibraryView.validateBuilder(tid).some(e=>e.field==='tempo'));
  assert.equal(HybridLibrary.compile(HybridLibrary.template(S.library,tid)).blocks.find(b=>b.kind==='lift').tempo,'33X1');
});
```

- [ ] **Step 2: Run against the baseline and verify this behavior assertion fails; missing setup alone is not a meaningful regression. After implementation, revert the relevant change briefly to confirm the assertion catches it.**

Run: `node --test apps/athlete/library.test.js apps/athlete/library-ui.test.js`.

- [ ] **Step 3: Implement the following behavior using the supplied contract.**

Use the same tempo setters inside each exercise card. Empty tempo is allowed; fully specified current four-phase notation compiles unchanged. Partial, invalid or unsupported imported tempo must return a specific error without truncating or clearing stored input. If the brain plan's canonical parser is now available, adapt its validation to current storage semantics; never independently estimate tempo factors. Test 20X1, 33X1, lowercase X, blank, partial phases, unsupported longer imported strings and all-empty fields. Existing stored valid tempos and notes survive collapse/reload/edit.

`validateBuilder` checks template existence, at least one compilable work/completion block, current target validation, numeric keypad buffer errors and nonempty tempo completeness. Blank title keeps existing fallback. Optional notes/warm-up/cool-down may all be empty; exclude empty role text from unnecessary session blocks using the existing transformation semantics. Return ordered errors, expand/focus the first field and keep other authored content. Drafts can remain incomplete and saved; validation gates posting, not continued editing. Distinguish warm-up note roles from engine warmup set purpose.

- [ ] **Step 4: Run `node --test apps/athlete/library.test.js apps/athlete/library-ui.test.js`, cover the additional cases listed above, inspect the diff and record actual pass/fail/skip counts.**

- [ ] **Step 5: Stage only the task's listed files and commit with `git commit -m "fix: preserve tempo and optional builder data with local validation"`. Require requirement and code-quality review before moving on.**

### Task 5: Flush edits and preserve calendar behavior

**Files:**
- Modify: `apps/athlete/library-ui.js`, `apps/athlete/library-ui.test.js`
- Read: `apps/athlete/app.js`, `apps/athlete/library.js`

**Interfaces:** Consumes current `flushActiveField`, picker/calendar methods and library persistence. Produces private `commitActiveBuilderField() -> boolean`; false means invalid buffer or persistence failure. Picker/calendar set `returnScreen:'edit'` and a safe scroll anchor.

- [ ] **Step 1: Add this regression to the named existing test file (its imports/helpers already exist), or the explicitly standalone browser file.**

```js
test('calendar Back returns to the same editable session without wizard pages',()=>{
  LibraryView.create();const tid=S.libUi.tid;
  LibraryView.calendar(tid,true);LibraryView.calendarBack();
  assert.equal(S.libUi.screen,'edit');assert.equal(S.libUi.tid,tid);
  assert.notEqual(S.libUi.flow,'wizard');
  assert.match(LibraryView.html(),/Add Exercise/);
});
```

- [ ] **Step 2: Run against the baseline and verify this behavior assertion fails; missing setup alone is not a meaningful regression. After implementation, revert the relevant change briefly to confirm the assertion catches it.**

Run: `node --test apps/athlete/library-ui.test.js`.

- [ ] **Step 3: Implement the following behavior using the supplied contract.**

Call `commitActiveBuilderField()` before picker, calendar, template switch, Back and posting. Dispatch the active input's change event through its document realm and handle IME composition without committing a partial composed character; defer navigation until compositionend if necessary. Preserve input focus/caret by saving without a shell render on each character. Persist content before navigation; do not issue a successful post after save throws or validation fails. Do not add a second delayed draft store.

Preserve the existing explicit calendar behavior: open date selection once, confirm once, refuse an in-progress/completed day, confirm replacement of another planned session and return to selected Training date. Double taps must not duplicate assignments or templates. Cancelling or Back returns to edit, with contents and position preserved. Library entry can still post an existing template without forcing editor detours. Picker add/cancel returns to the originating template; additions retain selection order and explicit superset grouping. Draft Back returns to Library without automatically posting or silently deleting a template. Add real DOM browser tests for last-character entry then immediate navigation, local save failure and picker/calendar keyboard dismissal; unit mocks alone cannot establish focus behavior.

- [ ] **Step 4: Run `node --test apps/athlete/library-ui.test.js`, cover the additional cases listed above, inspect the diff and record actual pass/fail/skip counts.**

- [ ] **Step 5: Stage only the task's listed files and commit with `git commit -m "fix: persist builder edits before navigation and calendar posting"`. Require requirement and code-quality review before moving on.**

### Task 6: Prove the unchanged compiled workout and brain contract

**Files:**
- Modify: `apps/athlete/library.test.js`, `apps/athlete/library-ui.test.js`, `apps/athlete/session.test.js`
- Read: `apps/shared/strength-targets.js`, `apps/athlete/strength-brain.js`, `apps/athlete/strength-memory.js`

**Interfaces:** Consumes existing `HybridLibrary.compile(template)`, `HybridSession.startSession({date,plan,letter,existing})`, current target normalizer and brain adapter. Produces compatibility fixtures/assertions only; no new serialization contract.

- [ ] **Step 1: Add this regression to the named existing test file (its imports/helpers already exist), or the explicitly standalone browser file.**

```js
test('compile preserves unequal targets and hidden exercise identity',()=>{
  let st=Lib.createTemplate(Lib.emptyState(),{title:'Compatibility'});
  const tid=st.templates[0].id;
  st=Lib.addExercise(st,tid,{title:'Back Squat',columns:['reps','weight_kg']});
  const b=st.templates[0].blocks[0];
  const setTargets=[10,8,6].map((n,i)=>({id:`${b.id}:set:${i}`,purpose:'working',reps:{min:n,max:n},loadRule:{kind:'adaptive'},toFailure:false}));
  st=Lib.patchBlock(st,tid,b.id,{setTargets,tempo:'20X1'});
  const plan=Lib.compile(Lib.template(st,tid));const lift=plan.blocks.find(x=>x.kind==='lift');
  assert.deepEqual(lift.setTargets,setTargets);assert.equal(lift.tempo,'20X1');
  assert.equal(lift.exerciseId,b.exerciseId);assert.equal(lift.equipmentId,b.equipmentId);
});
```

- [ ] **Step 2: Run the characterization before implementation; it may already pass, and must remain green. Do not manufacture a failure in working domain behavior.**

Run: `node --test apps/athlete/library.test.js apps/athlete/library-ui.test.js apps/athlete/session.test.js apps/athlete/strength-brain.test.js`.

- [ ] **Step 3: Implement the following behavior using the supplied contract.**

Record canonical compiled fixtures before changing the UI, then author equivalent content through the simplified UI and compare stable fields. Exclude only nondeterministic newly created IDs from cross-fixture comparison; within each template target/exercise/group IDs must stay unchanged through editing. The test above is a green characterization and should not require changing working domain code.

Cover fixed reps, ranges, unequal 5/3/1 and 10/8/6, final AMRAP, supersets, circuits/for-completion, all TRACK columns, tempo, notes and role text. Verify automatic brain difficulty and suggested loads are identical for equivalent normalized templates/facts before and after UI simplification. Starting a workout then editing the template must leave the running session and logged actuals untouched. Do not reuse a new normalized model as its own expected fixture; keep explicit snapshots of the prior supported contract. Range → fixed reps conversion remains explicit and visible; fixed reps → range does not invent an upper bound. Unsupported adaptive metrics still log normally.

- [ ] **Step 4: Run `node --test apps/athlete/library.test.js apps/athlete/library-ui.test.js apps/athlete/session.test.js apps/athlete/strength-brain.test.js`, cover the additional cases listed above, inspect the diff and record actual pass/fail/skip counts.**

- [ ] **Step 5: Stage only the task's listed files and commit with `git commit -m "test: lock simplified builder to existing logger and brain contracts"`. Require requirement and code-quality review before moving on.**

### Task 7: Measure full authoring workflows through Playwright

**Files:**
- Create: `checks/browser/strength-builder.spec.mjs`
- Modify: `checks/browser/strength-brain-v2.spec.mjs`, `checks/browser/metrics.spec.mjs`, `checks/browser/session.spec.mjs`
- Create: `docs/research/strength-builder/implementation-results.md` during execution

**Interfaces:** Consumes actual current app UI and revised consolidated editor. Produces walkthrough, repeatable functional tests, trace/screenshots and before/after action/timing measurements for the fixed scenarios in the test gates.

- [ ] **Step 1: Add this regression to the named existing test file (its imports/helpers already exist), or the explicitly standalone browser file.**

```js
import {test,expect} from 'playwright/test';
test('new session goes directly to the editable overview',async({page})=>{
  await page.goto('/');
  await page.getByRole('heading',{name:'Today',exact:true}).waitFor();
  await page.getByRole('button',{name:'Add',exact:true}).click();
  await page.getByRole('button',{name:'Create session',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Session Template',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Next',exact:true})).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Post to calendar',exact:true})).toBeVisible();
});
```

- [ ] **Step 2: Run against the baseline and verify this behavior assertion fails; missing setup alone is not a meaningful regression. After implementation, revert the relevant change briefly to confirm the assertion catches it.**

Run: `pnpm run check:browser`.

- [ ] **Step 3: Implement the following behavior using the supplied contract.**

Keep existing browser helpers but replace their wizard-specific navigation with real editor interactions; retain every target/load/AMRAP assertion. Do not delete broad tests because their navigation changed. Author the six-exercise timed fixture, schedule, start, log two ramps where appropriate, complete all ordinary work/final AMRAP, finish and reload. Test fixed/range keypad, all selected metrics, optional tempo/notes, reorder/superset, delete ghost assignment, picker cancel, repeated post and started-session isolation.

Use Playwright CLI to explore focus, scroll, touch and Back behavior, then encode regressions in committed Playwright tests. Test at 390×844 and 320×568 mobile sizes plus keyboard desktop navigation. Capture screenshots against baseline tokens/layout; cards should still look like our app. Add active-field immediate navigation, IME composition and offline reload cases. Count deliberate UI actions and navigation separately; never claim storage injection is a build-and-play session. Save traces and browser errors.

Installed cloud-browser command if needed:

```bash
PLAYWRIGHT_CHROMIUM_PATH=/usr/bin/chromium node node_modules/playwright/cli.js test -c checks/browser/playwright.config.mjs
```

Report the measured action/timing outcomes rather than promising speed. Failed gates require implementation correction and remeasurement, not redefining the fixture.

- [ ] **Step 4: Run `pnpm run check:browser`, cover the additional cases listed above, inspect the diff and record actual pass/fail/skip counts.**

- [ ] **Step 5: Stage only the task's listed files and commit with `git commit -m "test: cover and measure simplified builder end to end"`. Require requirement and code-quality review before moving on.**

### Task 8: Remove obsolete wizard paths and verify native behavior

**Files:**
- Modify: `apps/athlete/library-ui.js`, `apps/athlete/library-ui.test.js`, `apps/athlete/library.css`
- Create: `docs/releases/strength-builder-acceptance.md` during execution
- Read: `.github/workflows/dogfood-apk.yml`, `.github/workflows/capgo-ship.yml`

**Interfaces:** Consumes consolidated editor and restored-state normalizer. Produces one create/edit path, preserved legacy restoration, final acceptance evidence and no production deployment.

- [ ] **Step 1: Add this regression to the named existing test file (its imports/helpers already exist), or the explicitly standalone browser file.**

```js
test('restored wizard state resumes its template in the editor',()=>{
  LibraryView.create();const tid=S.libUi.tid;
  S.libUi={...S.libUi,screen:'tempo',flow:'wizard',liftIndex:0};
  const html=LibraryView.html();
  assert.equal(S.libUi.screen,'edit');assert.equal(S.libUi.tid,tid);
  assert.match(html,/Post to calendar/);assert.doesNotMatch(html,/>Next</);
});
```

- [ ] **Step 2: Run against the baseline and verify this behavior assertion fails; missing setup alone is not a meaningful regression. After implementation, revert the relevant change briefly to confirm the assertion catches it.**

Run: `pnpm run verify:strength`.

- [ ] **Step 3: Implement the following behavior using the supplied contract.**

After all call sites and browser tests use edit, remove obsolete mandatory wizard rendering/Next/Back logic and wizard-only CSS. Keep the restored-state normalizer, not a second live navigation flow. Retain shared tempo/role-text helpers and any public handler still used by reachable HTML. Search call sites before deletion:

```bash
rg -n 'wizardNext|wizardBack|wizardChrome|repsStepHtml|tempoStepHtml|liftIndex|flow.*wizard' apps/athlete checks/browser
```

Remaining legacy references should be restoration constants/tests only. Run focused suites, full `verify:strength` and repository `verify`; report unrelated failures rather than skipping them. Check ownership/staging scripts so packaging includes the correct changed builder assets. Build a private staging APK only during execution, install it and verify Android keyboard/back, keypad bounds, touch expansion, scroll restoration, background/kill/reopen, offline drafting and post/reload. Confirm actual installed build SHA/version; no assumption that web Playwright validates native WebView behavior.

Acceptance record links every test gate, exact commit, device/Android, baseline/revised navigation/time and screenshots. No claim of flawless operation or faster completion unless measured. No merge or Capgo upload until the user has requested that release and mandatory gates have passed; this planning PR does neither.

- [ ] **Step 4: Run `pnpm run verify:strength`, cover the additional cases listed above, inspect the diff and record actual pass/fail/skip counts.**

- [ ] **Step 5: Stage only the task's listed files and commit with `git commit -m "refactor: retire strength builder wizard after compatibility validation"`. Require requirement and code-quality review before moving on.**

## Self-review and execution handoff

Spec coverage: same look and direct editor → tasks 1–2; numeric safety/tempo/data preservation → tasks 3–4; persistence/calendar → task 5; existing builder/logger/brain compatibility → task 6; speed and full workflows → task 7; dead-code removal/native verification → task 8. The mandatory [test gates](../../research/strength-builder/test-and-speed-gates.md) travel with the spec.

Do not add an advanced builder feature set in the name of simplicity. Execute as separate reviewable tasks, keep the current authoring model and use the user's prior subagent-driven preference when implementation is requested. All implementation/runtime tests in this plan are future work; the planning audit only ran the existing 26 library/UI tests.
