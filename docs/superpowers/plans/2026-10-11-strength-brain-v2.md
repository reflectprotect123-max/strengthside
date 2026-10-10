# Strength Brain v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give arbitrary per-set strength prescriptions one consistent adaptive calculator, equipment policy and revision-safe memory without changing the app's appearance.

**Architecture:** Canonical browser-global modules in apps/shared implement prescription, equipment and pure calculation contracts. The existing athlete brain becomes an adapter; builder, session compiler, logger and Supabase memory consume those contracts. A reproducible simulator imports the same core and selects a versioned conservative policy before integration.

**Tech Stack:** Existing JavaScript IIFEs, Node test runner, pnpm, Playwright Chromium, Supabase PostgreSQL JSON records and Capacitor Android.

**Spec:** [Strength brain v2 design](../specs/2026-10-11-strength-brain-v2-design.md)

## Global Constraints

- Preserve the existing colours, navigation, effort slider, metric logging and shared keypad appearance.
- Do not add builder fields for target effort, smallest weight jump or starting weight.
- Do not publish to Capgo, release an APK, merge a shared branch or deploy live Supabase changes during this implementation.
- Use one canonical implementation per responsibility; athlete and coach distribution copies are generated.
- Support arbitrary positive integer reps and ranges. A one-rep prescription is not a maximum attempt.
- Use two warmups for eligible main lifts; accessories retain the current classification policy. Calibration may continue over multiple sessions.
- A user's actual logged weight always wins. Do not rewrite completed observations when recommendations or references change.
- Holds, carries, assistance and non-weight metrics remain loggable; unsupported prediction never produces e1RM.
- WHOOP, conditioning, LLM assistance, automatic max testing and timed/distance progression are outside this change.
- Reuse the deployed strength_brain_records table and its owner-scoped revision API unless a demonstrated contract limitation requires an additive migration.
- Supabase sync remains local-first, idempotent and account-isolated; no secrets in source or reports.

## Execution and file map

Use an isolated feature worktree based on fix/shared-training-contracts. Fresh implementer per task; one independent task reviewer checks specification and code quality, then the controller checks the diff and evidence. Resume the implementer for fixes. Track commits, tests, rulings and acceptance in this plan's gitignored SDD ledger. No worker spawns additional agents. Do not change models or global settings. Run focused tests during edits and broader checks at integration boundaries.

Canonical modules: strength-targets.js (authored intent), strength-equipment.js (available loads/conventions), strength-rts.js (attributed lookup), strength-brain-core.js (pure recommendations and learning), strength-policy.js (versioned configuration). Generated copies are synchronized using scripts/sync-training-core.mjs. Athlete strength-brain.js owns compatibility/seeding/history only. Existing library.js/library-ui.js author targets; session.js snapshots them; logger.js records actuals. strength-memory.js stores actuals and recomputable derived evidence. The simulator is scripts/strength-simulator.mjs; browser regressions live in checks/browser/strength-brain-v2.spec.mjs.

All new modules use `(function(root){ ... root.Name={...}; })(typeof window!=='undefined'?window:globalThis);`. Node tests import canonical modules in dependency order; fixtures must reset mutable globals/local storage. No external package is required.

### Task 1: Canonical authored set contracts

**Files:** Create apps/shared/strength-targets.js and apps/shared/strength-targets.test.mjs. Modify scripts/sync-training-core.mjs and package.json. Generate apps/athlete/strength-targets.js and apps/coach/strength-targets.js.

**Interfaces:** Produce `StrengthTargets.normalize(block) -> SetTarget[]`, `forRow(page,row,index) -> SetTarget|null`, `working(targets) -> SetTarget[]`, `resolveReference(target,rows) -> number|null`, and `validate(targets) -> {valid:boolean,error:string|null}`. Types and legacy expansion follow spec section 1. `normalize` returns stable target IDs; invalid input raises a descriptive RangeError. `forRow` prefers targetId, then workingIndex; a ramp row resolves as warmup. `resolveReference` reads the first ordinary working row only, requires logged/nondeleted/nonskipped, and returns finite nonnegative actual kg.

- [ ] Write failing deterministic tests for legacy 3×6–8, unequal 5/3/1, 20–25 reps, target serialization, no input mutation, first-set AMRAP rejection and first-working reference excluding ramps/skips/deletes.

```js
assert.deepEqual(StrengthTargets.normalize({id:'a',setCount:3,repMin:6,repMax:8})
  .map(t=>t.reps),[{min:6,max:8},{min:6,max:8},{min:6,max:8}]);
assert.equal(StrengthTargets.resolveReference({loadRule:{kind:'first_working_set'}},[
  {purpose:'ramp',logged:true,kg:10},{purpose:'working',logged:true,kg:31}]),31);
```

- [ ] Run `node --test apps/shared/strength-targets.test.mjs`; capture expected missing-module/function RED.
- [ ] Implement pure normalization, validation and references; do not infer AMRAP from last position. Add new module to the synchronization source list. Extend check:shared-contracts to run its tests. Keep TrainingCore.repTarget as the shared parser; do not create a second keypad/parser contract.
- [ ] Run focused tests, synchronize copies with `node scripts/sync-training-core.mjs`, then `pnpm run check:shared-contracts`. Capture GREEN and self-review.
- [ ] Commit only task files: `feat: define canonical per-set strength prescriptions`.

### Task 2: Equipment and reasonable starter suggestions

**Files:** Create apps/shared/strength-equipment.js and apps/shared/strength-equipment.test.mjs. Modify scripts/sync-training-core.mjs/package.json; generate athlete/coach copies.

**Interfaces:** Produce `StrengthEquipment.profile(page) -> {loads:number[],step:number,min:number,convention:string,unit:string}`, `floor(value,page) -> number|null`, `next(value,page) -> number|null`, `round(value,current,page,{upCap,downCap}) -> number|null`, `starter(page) -> {kg:number|null,confidence:'provisional'|'unknown',reason:string}`. No dependency on brain state. Explicit availableLoads supersedes inferred DB ladder. Unrecognized equipment/unit/convention yields no automatic starter.

- [ ] Write RED tests for 1→2,…9→10→12.5→15→17.5, custom 18 holding without creating a rack, declared bar minima, manual overrides, per-hand/total separation, upward caps and coarse reductions.

```js
const db={equipmentId:'dumbbell',loadConvention:'per_hand',loadUnit:'kg'};
assert.equal(StrengthEquipment.next(10,db),12.5);
assert.equal(StrengthEquipment.round(12.5,10,db,{upCap:.15,downCap:.15}),10);
assert.equal(StrengthEquipment.starter({...db,title:'Dumbbell Bench Press'}).kg,5);
assert.equal(StrengthEquipment.starter({equipmentId:'machine',title:'Press'}).kg,null);
```

- [ ] Run `node --test apps/shared/strength-equipment.test.mjs`; preserve RED.
- [ ] Implement the spec's exact provisional exercise starters and ladder. Bound dynamically generated ladders above the requested candidate rather than setting a low arbitrary maximum. Filter NaN/negative inputs; include manual current load as a hold option. Do not silently convert units or transfer exercises.
- [ ] Synchronize copies, wire tests into shared checks, run both new module tests and check:shared-contracts; preserve GREEN.
- [ ] Commit `feat: centralize strength equipment and starter loads`.

### Task 3: Pure RTS calculation, capacity and progression

**Files:** Create apps/shared/strength-rts.js, strength-policy.js, strength-brain-core.js and strength-brain-core.test.mjs. Modify scripts/sync-training-core.mjs and package.json; generate app copies. Do not replace athlete adapter yet.

**Interfaces:** Consume StrengthTargets and StrengthEquipment. Produce `StrengthRTS.percent(reps,rpe) -> number|null` for exact integer reps 1–12 and supported RPE values. Produce `StrengthPolicy` with version and selected conservative parameters. Produce `StrengthBrainCore.suggest({page,row,nextRow,index,state}) -> {kg,target,ruleVersion,reason,confidence}`, `estimate(row,page) -> number|null`, `review(page,rows) -> {e1rm,nextKg,earned,calibrated,complete,ruleVersion,sourceSetIds}`, `learn(previous,sessionEvidence) -> {freshE1rm,exposures,confidence,modelVersion,lastSourceSignature}`. Evidence includes sessionId, sourceSignature and eligible first working estimate. An identical sourceSignature is a no-op; replacing an exposure is handled by replay in Task 7, not by accumulating it twice.

- [ ] Write failing tests for planned 10/8/6 versus missed 6-of-10; 5/3/1 without maximal intent; Easy with null precise estimate; high reps unchanged; first working fresh estimate; AMRAP/warmup exclusions; every set's own upper bound; zero reps and minimum equipment.

```js
assert.equal(StrengthBrainCore.estimate({logged:true,purpose:'working',reps:5,kg:31,effort:'easy'},page),null);
assert.equal(StrengthBrainCore.review(rangePage,threeSetsAtSixAverage).earned,false);
assert.equal(StrengthBrainCore.suggest({page,row:{logged:true,reps:0,kg:10,miss:true},nextRow}).kg<=10,true);
```

- [ ] Run `node --test apps/shared/strength-brain-core.test.mjs`; preserve expected RED.
- [ ] Implement attributed literal RTS lookup using the research packet's table/source; no unverified third-party library. Default selected policy upCap=.05, warmupUpCap=.10, downCap=.10, observationBlend=.15, learningBlend=.10 pending Task 4. Use actual reps for evidence and next target reps for projection; apply one blend/cap/round. Map Average to calculation RPE7, Hard to RPE9 with broad-confidence metadata; Max Effort never auto-targeted. Easy/Very Easy are directional and capped. Unsupported metrics or >12 reps return null e1RM and hold/history fallback. `review` excludes AMRAP from ordinary completion/earned checks but preserves its facts; all authored ordinary targets must be completed at upper bounds. `learn` updates only fresh first qualifying ordinary evidence and ignores duplicate signatures.
- [ ] Add focused tests to shared checks, synchronize copies, run all new module tests and check:shared-contracts; record GREEN and confirm no app behavior switched yet.
- [ ] Commit `feat: add deterministic RTS strength core`.

### Task 4: Reproducible simulator and frozen policy

**Files:** Create scripts/strength-simulator.mjs, scripts/strength-simulator.test.mjs, docs/research/strength-brain-v2-simulation.md, docs/research/strength-brain-v2-simulation.json. Modify apps/shared/strength-policy.js and package.json; regenerate policy copies.

**Interfaces:** Simulator imports production canonical modules. Export `simulate({seed,exposures,policy,cohort}) -> report` and `selectPolicy(tuningReports) -> policy`. CLI `node scripts/strength-simulator.mjs --report-dir <directory>` writes deterministic JSON/Markdown. Reports include seed sets, model assumptions, per-stratum denominators/misses/underloading, invariant counts, selected policy version, and rejection reasons. Tuning seeds 1101–1104; holdout seeds 2201–2204. Selection sees tuning data only.

- [ ] Write RED tests for same seed determinism, changed seed variation, chart-independent capacity models, zero software invariant violations, no holdout data passed to selection and strict gate failure for a deliberately overaggressive fixture.

```js
assert.deepEqual(simulate({seed:1101,exposures:12,policy,cohort:'db'}),
  simulate({seed:1101,exposures:12,policy,cohort:'db'}));
assert.equal(gate({baselineMissRate:.04,candidateMissRate:.06,
  baselineUnderloadRate:.20,candidateUnderloadRate:.10}).pass,false);
```

- [ ] Run `node --test scripts/strength-simulator.test.mjs`; preserve RED.
- [ ] Implement a bounded deterministic matrix: Epley/Brzycki/perturbed capacity, dumbbell/bar/custom machine minima, beginner/trained strength, ±2 RIR bias plus noise, 0–6% set fatigue, two warmups, targets 10/8/6,5/3/1,6–8,20–25, final reference AMRAP, superset/short-rest stress, absence/plateau and 12/50 exposures. Simulate actual completed AMRAP reps and zero-rep outcomes. Keep fatigue/rest in simulated physiology, not an exact production correction. Compare baseline and candidates with paired athlete draws. Test up caps .05/.10/.15, warmup caps .10/.15 and blends .15/.25, learning .10/.20. No 25% coarse-jump exception.
- [ ] Select from tuning by lowest underloading among candidates that satisfy each stratum's miss increase ≤1 percentage point; ties favor smaller caps/blends. Evaluate frozen selection on untouched holdout. If any holdout stratum fails, retain baseline policy and document rejection; do not tune again on holdout. Software invariant failure blocks integration and must be fixed. Freeze named policy version and a hash of canonical parameters. Document modeled results separately from real-athlete accuracy.
- [ ] Run simulator tests and CLI; check committed reports regenerate byte-for-byte apart from deliberately omitted timestamps. Wire `check:strength-simulator` into verify. Synchronize copies and run shared checks.
- [ ] Commit `test: stress strength policy with independent capacity models`.

### Task 5: Builder and immutable session prescriptions

**Files:** Modify apps/athlete/library.js, library-ui.js, session.js, library.test.js, library-ui.test.js, session.test.js, index.html; apps/coach/coach.html if its module load list requires StrengthTargets. Modify scripts/generate-strength-release.mjs only if its asset manifest excludes new modules; regenerate assets without changing release version.

**Interfaces:** Builder persists block.setTargets. HybridLibrary.compile emits setTargets alongside legacy repMin/repMax/setCount for old consumers. Session page.setTargets is a deep snapshot; each working row has targetId and its own target reps. Existing page.targetReps/targetRepMax remain first ordinary target fallbacks. Authored sets exclude two automatic warmups. `StrengthTargets.validate` authoring errors display inline.

- [ ] Write RED tests for legacy migration; separate 10/8/6 and 5/3/1 authoring; 6–8 ranges through keypad; first-AMRAP rejection; optional final first-working-weight AMRAP; metric lists unchanged; edits to library not changing active targets.

```js
const targets=[10,8,6].map((r,i)=>({id:`a:set:${i}`,purpose:'working',
  reps:{min:r,max:r},loadRule:{kind:'adaptive'},toFailure:false}));
const plan=HybridLibrary.compile({id:'tpl',blocks:[{id:'a',kind:'lift',
  title:'Back Squat',columns:['reps','weight_kg'],setCount:3,repTarget:'10',setTargets:targets}]});
assert.deepEqual(plan.blocks.find(b=>b.kind==='lift').setTargets.map(t=>t.reps.min),[10,8,6]);
```

- [ ] Run `node --test apps/athlete/library.test.js apps/athlete/library-ui.test.js apps/athlete/session.test.js`; preserve RED for new cases.
- [ ] Keep the existing compact set-count/rep-target editor as default. Add a compact expandable per-set list using the existing shared keypad styles; each row edits reps/range, optional final AMRAP toggle authors reference rule automatically. No prescribed-effort/starting-load/equipment-jump form. Use metric choice to allow range keypad hyphen. Sync legacy fields from the first ordinary target and count while preserving full setTargets. Deep-copy targets on compile/session creation. Preserve coaches' legacy prescriptions via shared normalization rather than inventing a separate coach engine.
- [ ] Load canonical module copies before consumers, ensure service worker/stage asset lists include them, run focused tests and shared asset checks.
- [ ] Commit `feat: author arbitrary set reps and first-set-last AMRAP`.

### Task 6: Athlete adapter and logger integration

**Files:** Modify apps/athlete/strength-brain.js, strength-brain.test.js, logger.js, session.test.js, timer.test.js, index.html. Add apps/athlete/strength-logger.test.js if focused logger tests need a separate harness. Modify package.json to include that harness.

**Interfaces:** Preserve StrengthBrain.VERSION/RIR/key/eligible/equipment/round/stepUp/target/next/estimate/review/history/seed. All calculation delegates to StrengthBrainCore and StrengthEquipment; no duplicate RTS implementation. Existing callers continue receiving compatible fields. `seed` adds at most two ramps for the current main-lift classification, assigns row targetId/purpose/workingIndex, and chooses prior comparable history or provisional starter.

- [ ] Write RED tests for seed idempotence, main versus accessory warmups, starter override, exact per-row rep display, planned reduced reps getting heavier with cap, zero-rep miss, high-rep manual logging and complete AMRAP reference/edit behavior.

```js
const once=StrengthBrain.seed(session,{});
assert.deepEqual(StrengthBrain.seed(once,{}),once);
assert.equal(once.logs[mainId].sets.filter(r=>r.purpose==='ramp').length,2);
assert.equal(StrengthBrain.estimate(timedHoldRow,timedHoldPage),null);
```

- [ ] Run check:strength-brain plus focused logger/session tests; preserve new failures.
- [ ] Replace v1 math with adapters to canonical v2. Preserve manual load entry, all metrics and slider. Logger reads the active row target instead of pagewide target. For pending AMRAP, resolve actual first ordinary working weight; if unresolved show an editable blank with a small inline explanation. Completed actuals stay fixed when set 1 changes. Preserve selected-rest automatic start/reuse/Next-clear behavior. Capture requestedRestSec and leave elapsedRestSec null unless timing genuinely measures it. No new athlete rule-selection step.
- [ ] Run focused tests, check:shared-contracts, check:athlete-app and stage asset tests; confirm browser boot has no missing dependency. Update v1-specific test expectations to actual v2 behavior with explanations rather than removing coverage.
- [ ] Commit `feat: wire adaptive set loads into strength logging`.

### Task 7: Revision-safe local and Supabase evidence

**Files:** Modify apps/athlete/strength-memory.js, strength-memory.test.js, plan-sync.test.js; checks/sql/strength-brain-memory-test.sql and checks/migrations-apply.mjs if needed to execute the dedicated SQL test. Add scripts/check-strength-memory-sql.mjs only if the migration runner cannot safely incorporate it. Modify package.json for dedicated test wiring. No applied migration edits.

**Interfaces:** Existing capture/removeSession/bind/sync API stays compatible. Set payloads include authored targets and actual rows/context. Session estimates include modelVersion, sourceSetIds, sourceSignature derived from source IDs and actual-content fingerprints, prescriptionSignature and confidence/exposures. Recompute history by chronological replay of current nondeleted session evidence; do not trust stale v1 session_estimate values as v2. sourceSignature is deterministic serialization/hash, not a timestamp.

- [ ] Write RED tests for duplicate capture/sync retry exposure invariance, set-edit estimate replacement, source deletion invalidation, explicit recreation, legacy payload replay, stale revision conflict, offline reload and account switch.

```js
StrengthMemory.capture(session);
const before=JSON.stringify(memory.records);
StrengthMemory.capture(session);
assert.equal(JSON.stringify(memory.records),before);
assert.equal(historyAfterDeletingSource.rolling,null);
```

- [ ] Run `node --test apps/athlete/strength-memory.test.js apps/athlete/plan-sync.test.js`; preserve relevant RED.
- [ ] Implement deterministic replay/recomputation and tombstones while keeping stable row UUIDs, conditional pending-queue acknowledgement and expected revisions. Keep actual manual weights distinct from suggested loads. Use current JSON record table/RPC with additional payload metadata; do not create parallel memory storage. Complete sessions qualify once per exposure, corrected sessions replace earlier evidence. Persist before network activity and retain failures for retry.
- [ ] Run focused tests and real throwaway PostgreSQL owner/revision tests. Wire dedicated SQL checks into verify if current migration checks omit them. If PostgreSQL binaries are unavailable, install/use existing local tools within workspace or clearly record the blocked check; a SKIP is not a passing backend check. Never touch live data.
- [ ] Commit `feat: persist revision-safe adaptive strength evidence`.

### Task 8: Full workout verification and final handoff

**Files:** Create checks/browser/strength-brain-v2.spec.mjs and docs/research/strength-brain-v2-validation.md. Modify existing browser fixtures only where shared module dependencies or changed expectations require it. Modify scripts/stage-athlete.test.mjs if new runtime assets are not already covered.

**Interfaces:** Exercise real browser routes and controls. Keep tests independent using fresh local storage/account fixtures. Validation report lists exact commit/test commands, outcomes, browser screenshots, simulator policy gates and any device/backend limitations.

- [ ] Write browser regressions for builder→calendar→start→two ramps→10/8/6→first-set-last AMRAP→finish→history, 3×6 Average within 6–8 holding next load, user overrides, first-source edits before/after AMRAP completion, all metrics and keypad range/decimal behavior, session deletion calendar cleanup, offline reload and account isolation.

```js
test('builder keeps a true arbitrary range',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Add',exact:true}).click();
  await page.getByRole('button',{name:'Create session',exact:true}).click();
  await page.getByRole('button',{name:'+ Add Exercise',exact:true}).click();
  await page.getByRole('button',{name:'Back Squat',exact:true}).click();
  await page.getByRole('button',{name:'Add (1)',exact:true}).click();
  await page.getByRole('button',{name:'Edit',exact:true}).click();
  await page.getByLabel('First metric').selectOption('reps_range');
  await page.getByLabel('Rep range',{exact:true}).click();
  const pad=page.getByRole('dialog',{name:'Rep range keypad'});
  for(const key of ['2','0','–','2','5'])
    await pad.getByRole('button',{name:key,exact:true}).click();
  await pad.getByRole('button',{name:'Save',exact:true}).click();
  await expect(page.getByLabel('Rep range',{exact:true})).toHaveValue('20-25');
});
```

- [ ] Run `PLAYWRIGHT_CHROMIUM_PATH=/usr/bin/chromium pnpm run check:browser`; investigate actual failing journeys. Use the installed playwright-cli skill for interactive smoke and screenshots in addition to the committed browser suite. Do not call a browser API assertion a physical Android test.
- [ ] Run `pnpm run verify`, `pnpm run check:strength-simulator`, dedicated PostgreSQL memory test and staged app checks once after fixes. Inspect all outputs; rerun only affected checks after further code changes. Preserve baseline failures separately if truly pre-existing.
- [ ] Inspect available Android SDK/Gradle setup. If present, stage the athlete assets and build a local debug APK without signing/releasing/uploading; inspect ZIP for canonical modules and app metadata. If unavailable record that limitation rather than acquiring deployment credentials. Capgo remains on hold.
- [ ] Write validation report with supported behavior, rejected calibration candidates, synthetic assumptions and next real-athlete observation questions. Commit `test: verify complete adaptive strength workouts`.
- [ ] Controller dispatches whole-branch independent code review, resolves significant findings with implementer and scoped re-review, then marks every accepted task in ledger. Final response links plan, evidence and validation report; state no publication occurred.
