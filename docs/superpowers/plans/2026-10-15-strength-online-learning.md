# Strength Online Learning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate bounded personal strength learning into our existing app without changing its look, corrupting history, or breaking authored workouts.

**Architecture:** Normalize facts once, derive one replayable state per athlete/exercise/equipment/tempo, and route seeding, next-set suggestions and displayed estimates through that state. Keep fast session calibration separate from slow rep-curve fitting. Repair and benchmark the default before evaluating the online candidate.

**Tech Stack:** Existing classic JavaScript browser modules, Node test runner, Playwright 1.57, Capacitor Android and Supabase/Postgres; no R runtime, LLM or new frontend framework.

**Spec:** [Strength online learning design](../specs/2026-10-15-strength-online-learning-design.md)

## Global Constraints

- Runtime: Node >=20.19; package manager pnpm 10.33.0; preserve the frozen lockfile unless a reviewed dependency change is necessary.
- Edit canonical shared calculations under `apps/shared`; generate athlete/coach copies using `scripts/sync-training-core.mjs`.
- Preserve the current appearance and selected logging metrics; add no athlete-facing AI settings or target-effort fields.
- Conditioning and WHOOP adaptation remain outside this change.
- Never rewrite logged actuals when generating a recommendation.
- No hosted migration, main merge, APK publication or Capgo deployment during this planning task.
- An eventual release requires all mandatory gates in the test matrix; unrun gates remain blocked, not passed.

## Execution rules and dependency order

Read the spec, evidence and test matrix first. Start from the latest main, record its SHA, compare with inspected `1c5789a3`, and incorporate newer fixes without reverting Cursor's work. Do not merge unrelated branches. This cloud checkout is already isolated; do not create another worktree unless the user requests it.

Execute tasks 1–12 in order. Each task is a reviewable commit, with short red/green steps. Review requirements and code quality separately before accepting each task. Failed assertions must demonstrate the intended behavior, not missing fixtures alone; after implementing a regression, temporarily revert the relevant implementation and confirm it fails for the original reason. Never weaken assertions to obtain green. App implementation is a separate execution phase from this documentation PR.

**File responsibilities:** `strength-load.js` owns unit/convention boundaries; `strength-context.js` owns comparable-history identity; `strength-learning.js` owns pure candidate maths; `strength-replay.js` owns deterministic evidence selection. Existing `strength-brain-core.js` owns load policy, `strength-brain.js` the athlete adapter, and `strength-memory.js` durability. These shared modules follow the existing global-wrapper pattern, export `StrengthLoad`, `StrengthContext`, `StrengthLearning`, `StrengthReplay` and load before the core. Extend the sync script and actual athlete/coach entry points when a new module first becomes a runtime dependency. Never edit generated copies directly.

## Shared contracts used by all tasks

```ts
type Observation = {
  id: string; revision: number; contextKey: string; sessionId: string;
  weight: number; reps: number; rir: number | null;
  purpose: 'working' | 'warmup' | 'amrap'; workingIndex: number;
  miss: boolean; completed: boolean;
};
type LearnerState = {
  version: 'online-v1'; k: number; rows: Observation[];
  accepted: number; updates: number;
};
type ReplayState = LearnerState & {
  startingScale: number | null; evidenceFingerprint: string;
};
```

`weight` is canonical physical kg for a barbell, per-hand kg for dumbbells. `rir` is an approximate slider representative, not a measured value. Raw authored reps/actuals stay outside these derived structures. No `session_estimate` is an Observation.

### Task 1: Make physical load unambiguous

**Files:**
- Create: `apps/shared/strength-load.js`, `apps/shared/strength-load.test.mjs`, `apps/shared/test/strength-harness.mjs`
- Modify: `apps/shared/strength-equipment.js`, `apps/shared/strength-equipment.test.mjs`, `scripts/sync-training-core.mjs`
- Generated: `apps/athlete/strength-load.js`, `apps/coach/strength-load.js` and equipment copies

**Interfaces:**
- Produces: `StrengthLoad.normalize({value,unit,convention,barKg,provenance}) -> NormalizedLoad | null` (schema in spec §3).
- Produces: `StrengthLoad.displayKg(normalized, convention, barKg) -> number | null`.
- Test helper produces `loadStrength(extra = []) -> object` with existing shared globals and requested new modules loaded in a VM.

- [ ] **Step 1: Add this executable regression, plus the cases named in the task's implementation notes.**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {loadStrength} from './test/strength-harness.mjs';
const {StrengthLoad:L}=loadStrength(['strength-load']);
test('empty bar and historical total have different raw values but honest physical loads',()=>{
  const empty=L.normalize({value:0,unit:'kg',convention:'barbell_plates',barKg:20,provenance:'explicit'});
  const old=L.normalize({value:60,unit:'kg',convention:'barbell_total',barKg:20,provenance:'known_legacy_version'});
  assert.equal(empty.externalKg,20); assert.equal(old.externalKg,60);
  assert.equal(L.displayKg(old,'barbell_plates',20),40);
  assert.equal(L.normalize({value:null,unit:'kg',convention:'single',provenance:'explicit'}),null);
});
```

- [ ] **Step 2: Run the focused test and confirm the assertion fails against the baseline behavior.**

Run: `node --test apps/shared/strength-load.test.mjs apps/shared/strength-equipment.test.mjs`. A missing new module establishes initial red only; verify the behavioral red/green cycle after its first implementation.

- [ ] **Step 3: Implement the following contract and behavior.**

Implement the VM helper first, using the current module order and no silently missing modules:

```js
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
export function loadStrength(extra=[]) {
  const root={};
  const names=['training-core','strength-targets','strength-equipment','strength-rts','strength-policy',...extra,'strength-brain-core'];
  for(const name of [...new Set(names)]) {
    vm.runInNewContext(readFileSync(new URL(`../${name}.js`,import.meta.url),'utf8'),{window:root});
  }
  return root;
}
```

Reject null, undefined, blank, boolean, NaN, infinity and negative input before numeric conversion. Preserve zero as an actual load. Use `externalKg = valueKg + barKg` only for explicitly plates-only bars; require finite positive bar mass. Per-hand values stay per hand. Test lb conversion, 15/20 kg bars, exact inverse display conversion, explicit total 60, 0 added dip, corrupt metadata, ambiguous legacy exclusion and raw input immutability. Keep equipment grids in display convention; convert only at policy boundaries. Do not infer equipment from a title for a persisted migration. Run `node scripts/sync-training-core.mjs` after extending its module list.

- [ ] **Step 4: Run `node --test apps/shared/strength-load.test.mjs apps/shared/strength-equipment.test.mjs` and its named matrix cases; verify passing counts, zero skipped mandatory cases, and inspect the diff.**

- [ ] **Step 5: Stage only the files listed above and regenerated shared copies; commit with `git commit -m "fix: normalize strength load conventions without rewriting actuals"`. Record the command, result counts and commit SHA in the execution evidence.**

### Task 2: Partition comparable history and classify legacy evidence

**Files:**
- Create: `apps/shared/strength-context.js`, `apps/shared/strength-context.test.mjs`, `scripts/audit-strength-evidence.mjs`
- Modify: `scripts/sync-training-core.mjs`, `apps/athlete/strength-brain.js`, `apps/athlete/strength-brain.test.js`

**Interfaces:**
- Consumes: `StrengthLoad.normalize(input)` from task 1.
- Produces: `StrengthContext.tempo(value: string | null) -> string | null` (null means unknown/invalid).
- Produces: `StrengthContext.key({athleteId,exerciseId,equipmentId,convention,tempo}) -> string`; canonical JSON tuple.
- Produces: `StrengthContext.classifyLegacy(payload: object) -> 'known_legacy_version' | 'ambiguous_legacy'`; explicit provenance wins, unknown versions stay ambiguous.

- [ ] **Step 1: Add this executable regression, plus the cases named in the task's implementation notes.**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {loadStrength} from './test/strength-harness.mjs';
const {StrengthContext:C}=loadStrength(['strength-load','strength-context']);
test('tempo notation aliases match but alternating tempos and athletes do not',()=>{
  const p={athleteId:'a',exerciseId:'squat',equipmentId:'barbell',convention:'barbell_total'};
  assert.equal(C.key({...p,tempo:'33x1'}),C.key({...p,tempo:'3-3-X-1'}));
  assert.notEqual(C.key({...p,tempo:'33X1'}),C.key({...p,tempo:'20X1'}));
  assert.notEqual(C.key({...p,tempo:null}),C.key({...p,tempo:'20X1'}));
  assert.equal(C.classifyLegacy({}), 'ambiguous_legacy');
});
```

- [ ] **Step 2: Run the focused test and confirm the assertion fails against the baseline behavior.**

Run: `node --test apps/shared/strength-context.test.mjs apps/athlete/strength-brain.test.js`. A missing new module establishes initial red only; verify the behavioral red/green cycle after its first implementation.

- [ ] **Step 3: Implement the following contract and behavior.**

Implement canonical phase parsing, then key construction:

```js
function key(p) {
  return JSON.stringify([p.athleteId,p.exerciseId,p.equipmentId,p.convention,tempo(p.tempo)]);
}
```

Validate required IDs before constructing keys. Pass canonical `barbell_total` into the learning context for both plates-input and total-input barbells after converting physical load; do not split equivalent normalized loads by their raw keypad convention. Numeric phases are nonnegative whole seconds, X is accepted only as a concentric intent; no calculated fixed X duration. Compact four-character and four-field delimited formats normalize identically. Invalid/absent tempo goes to unknown and never shares a known-tempo key. Produce a provenance mapping only for producer versions established from Git history and fixtures. The audit CLI consumes a local JSON records export and writes aggregate counts by known/ambiguous/unsupported; raw exports stay ignored and never enter Git. Default is read-only; do not add a mutating backfill mode in this task. Test collisions, renamed titles with stable exercise IDs, invalid tempo, unknown metadata, and owner separation. Keep legacy history display through the existing key while new learning uses normalized context; do not rename old facts in place.

- [ ] **Step 4: Run `node --test apps/shared/strength-context.test.mjs apps/athlete/strength-brain.test.js` and its named matrix cases; verify passing counts, zero skipped mandatory cases, and inspect the diff.**

- [ ] **Step 5: Stage only the files listed above and regenerated shared copies; commit with `git commit -m "feat: separate strength learning contexts and audit legacy provenance"`. Record the command, result counts and commit SHA in the execution evidence.**

### Task 3: Implement the bounded learner as a pure module

**Files:**
- Create: `apps/shared/strength-learning.js`, `apps/shared/strength-learning.test.mjs`
- Modify: `scripts/sync-training-core.mjs`

**Interfaces:**
- Consumes: Observation and LearnerState contracts above.
- Produces: `StrengthLearning.initial() -> LearnerState`, `fraction(n:number,k:number) -> number | null`.
- Produces: `observe(previous:LearnerState, observation:Observation) -> LearnerState` (immutable; caller supplies unique ordered evidence).
- Produces: `project({weight,fromReps,fromRir,toReps,targetRir,k}) -> number | null`.
- Produces: `updateStart(scale:number|null, observation:Observation, step:number) -> number|null`.

- [ ] **Step 1: Add this executable regression, plus the cases named in the task's implementation notes.**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {loadStrength} from './test/strength-harness.mjs';
const {StrengthLearning:L}=loadStrength(['strength-learning']);
test('default projection preserves Epley ratios and invalid feedback cannot teach it',()=>{
  const state=L.initial();
  const kg=L.project({weight:50,fromReps:10,fromRir:3,toReps:6,targetRir:3,k:state.k});
  assert.ok(Math.abs(kg-50*(1+.0333*13)/(1+.0333*9))<1e-10);
  const next=L.observe(state,{id:'x',revision:1,contextKey:'c',sessionId:'s',weight:50,reps:10,rir:6,purpose:'working',workingIndex:0,miss:false,completed:true});
  assert.equal(next.k,state.k); assert.equal(next.accepted,0); assert.equal(state.rows.length,0);
});
```

- [ ] **Step 2: Run the focused test and confirm the assertion fails against the baseline behavior.**

Run: `node --test apps/shared/strength-learning.test.mjs`. A missing new module establishes initial red only; verify the behavioral red/green cycle after its first implementation.

- [ ] **Step 3: Implement the following contract and behavior.**

Implement the equations and exact candidate thresholds in spec §6. No shared mutable state, clock access or randomness. Add tests for 7 versus 8 observations, eight identical effective reps, three distinct values with insufficient span, clean fit recovery, contradictory/noisy feedback, positive/finite outputs and bounds after 1,000 observations. Warmups, AMRAP, missed/max, incomplete sessions, bodyweight without normalized model, reps outside 1–12 and RIR outside {1,3} cannot enter fitting.

Keep fast calibration independent: if scale is absent and eligible precise evidence exists, initialize from `weight / fraction(reps+rir,k0)`; if absent and Easy-only evidence exists, return null and let equipment seeding handle it. Otherwise apply the experimental calibration formula below, with physical-load equipment step supplied by the caller:

```js
const pct=fraction(observation.reps+3,k0);
const oneStep=step/pct;
if(observation.miss) return Math.max(scale*.9,scale-oneStep*2);
if(observation.rir!=null && observation.rir>=5) return scale+oneStep;
if(![1,3].includes(observation.rir)) return scale;
const implied=observation.weight/fraction(observation.reps+observation.rir,k0);
return Math.max(scale-Math.max(scale*.1,oneStep),Math.min(scale+oneStep,scale+.5*(implied-scale)));
```

Validate scale/step/observation before this arithmetic. Miss precedence must not require a valid RIR. Keep these calibration constants experimental and test them under task 10 rather than asserting simulator superiority in code comments.

- [ ] **Step 4: Run `node --test apps/shared/strength-learning.test.mjs` and its named matrix cases; verify passing counts, zero skipped mandatory cases, and inspect the diff.**

- [ ] **Step 5: Stage only the files listed above and regenerated shared copies; commit with `git commit -m "feat: add bounded pure online strength learner"`. Record the command, result counts and commit SHA in the execution evidence.**

### Task 4: Build deterministic replay instead of duplicate rolling estimates

**Files:**
- Create: `apps/shared/strength-replay.js`, `apps/shared/strength-replay.test.mjs`
- Modify: `scripts/sync-training-core.mjs`
- Create: `apps/shared/test/strength-record-fixture.mjs`

**Interfaces:**
- Consumes: load/context/learning modules and existing record envelopes `{id,sessionId,kind,deleted,payload,localRevision}`.
- Produces: `StrengthReplay.replay(records:object[], {ownerId,contextKey,excludeSessionId?}) -> ReplayState`.
- Fixture produces `record(id:string, revision:number, weight:number) -> object` for the schema shown below.

- [ ] **Step 1: Add this executable regression, plus the cases named in the task's implementation notes.**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {loadStrength} from './test/strength-harness.mjs';
import {record} from './test/strength-record-fixture.mjs';
const {StrengthReplay:R}=loadStrength(['strength-load','strength-context','strength-learning','strength-replay']);
test('revisions replace evidence; deletion and delivery order cannot double learn',()=>{
  const a=record('set-a',1,50),edit=record('set-a',2,55),b=record('set-b',1,60);
  const options={ownerId:'a',contextKey:a.payload.learning.contextKey};
  assert.equal(JSON.stringify(R.replay([a,edit,b],options)),JSON.stringify(R.replay([b,edit,a],options)));
  assert.equal(R.replay([a,edit,b],options).accepted,2);
  assert.equal(R.replay([a,{...edit,deleted:true},b],options).accepted,1);
});
```

- [ ] **Step 2: Run the focused test and confirm the assertion fails against the baseline behavior.**

Run: `node --test apps/shared/strength-replay.test.mjs`. A missing new module establishes initial red only; verify the behavioral red/green cycle after its first implementation.

- [ ] **Step 3: Implement the following contract and behavior.**

Define the fixture using the real record envelope, not a separate simulator-only format:

```js
export function record(id,revision,weight) {
  const contextKey=JSON.stringify(['a','squat','barbell','barbell_total','2-0-X-1']);
  return {id,sessionId:`session-${id}`,kind:'set',deleted:false,localRevision:revision,
    payload:{contractVersion:3,sessionStartedAt:10,completed:true,
      learning:{ownerId:'a',contextKey,observation:{id,revision,contextKey,sessionId:`session-${id}`,
        weight,reps:5,rir:3,purpose:'working',workingIndex:0,miss:false,completed:true}}}};
}
```

Select latest revisions by record ID before sorting canonical session order. Only first ordinary working evidence per completed session/context is fitted; warmups and summaries never count. Start scale may consume directional first-set evidence, shape may not. Compute a stable canonical evidence fingerprint including revision, completion, deletion and context. Conflicting same-revision payloads must be excluded with diagnostic reasons, not resolved by delivery order. Replay updates through `observe` and `updateStart`; cap fit rows at 24 but retain the authoritative fact ledger. Add import/reorder/late older-session, reopening, source edit, context change, account mismatch and duplicate summary tests. Assert no mutation of input payloads and deterministic JSON state.

- [ ] **Step 4: Run `node --test apps/shared/strength-replay.test.mjs` and its named matrix cases; verify passing counts, zero skipped mandatory cases, and inspect the diff.**

- [ ] **Step 5: Stage only the files listed above and regenerated shared copies; commit with `git commit -m "feat: derive one replayable strength learning state from facts"`. Record the command, result counts and commit SHA in the execution evidence.**

### Task 5: Repair next-set policy at the actual populated-row boundary

**Files:**
- Modify: `apps/shared/strength-brain-core.js`, `apps/shared/strength-brain-core.test.mjs`, `apps/shared/strength-policy.js`
- Modify: `apps/athlete/strength-brain.js`, `apps/athlete/strength-brain.test.js`
- Modify: `apps/athlete/index.html`, `apps/coach/index.html` for dependencies actually consumed

**Interfaces:**
- Consumes: `StrengthLearning.project`, normalized load, ReplayState and existing `Core.suggest({page,row,nextRow,index,state})`.
- Produces: same public suggest/next response shape `{kg,target,ruleVersion,reason,confidence}`; optional diagnostic fields remain internal.
- `state.learning` holds ReplayState; `state.rows` holds actual session rows. `kg` returned remains the page's display convention.

- [ ] **Step 1: Add this executable regression, plus the cases named in the task's implementation notes.**

```js
// Add to existing strength-brain-core.test.mjs; B, page, row are its existing helpers.
test('a populated next-row plan cannot bypass an upper load guard',()=>{
  const p=page([10,6]),r=row('a:set:0',10,40,'average');
  const next={targetId:'a:set:1',purpose:'working',kg:42};
  const out=B.suggest({page:p,row:r,nextRow:next,index:1,state:{freshE1rm:100,rows:[r]}});
  assert.ok(out.kg<=43); // one step above planned 42 is stricter than the 10% current-load cap
  assert.equal(next.kg,42); assert.equal(r.kg,40);
});
```

- [ ] **Step 2: Run the focused test and confirm the assertion fails against the baseline behavior.**

Run: `node --test apps/shared/strength-brain-core.test.mjs apps/athlete/strength-brain.test.js`. A missing new module establishes initial red only; verify the behavioral red/green cycle after its first implementation.

- [ ] **Step 3: Implement the following contract and behavior.**

Centralize guard application after every projection branch; no return from rep-change logic bypasses it. Evaluate first-set-last references before ordinary adaptive logic; resolve against logged first working actuals, retain logged AMRAP actuals. Reject null/blank before Number coercion. Use canonical physical load for e1RM, caps and ratios, then convert to display kg and feasible equipment grid. Apply the exact unchanged-target/rep-transition/coarse-reduction rules in spec §6. Miss/max precede increased-rep-plan branches; Hard cannot increase because of `sessionFloor`. Warmup evidence expires as an authoritative floor at the first usable working set.

Use `const candidate = state.learning ? L.project(inputs) : defaultProjection(inputs);` internally, followed by one shared `guardAndRound` path. In shadow mode only log the candidate decision; the default controls output. Keep intended difficulty Easy for warmups and Average for ordinary sets, including a prescribed one rep. Test both empty and populated next-row values with identical facts, physical zero versus empty bar, coarse dumbbell steps, 6–8 lower bound hold, missed lower bound, 5/3/1, 20+ reps fallback and manual off-grid input. Reference `test-matrix.md` M1–M9 for the mandatory assertions.

- [ ] **Step 4: Run `node --test apps/shared/strength-brain-core.test.mjs apps/athlete/strength-brain.test.js` and its named matrix cases; verify passing counts, zero skipped mandatory cases, and inspect the diff.**

- [ ] **Step 5: Stage only the files listed above and regenerated shared copies; commit with `git commit -m "fix: apply one guarded policy across strength next-set paths"`. Record the command, result counts and commit SHA in the execution evidence.**

### Task 6: Wire seeding, display and today calibration to the same state

**Files:**
- Modify: `apps/athlete/strength-brain.js`, `apps/athlete/strength-brain.test.js`, `apps/athlete/logger.js`, `apps/athlete/session.js`
- Modify: `apps/athlete/strength-memory.js`, `apps/athlete/strength-memory.test.js`

**Interfaces:**
- Consumes: `StrengthReplay.replay`, `StrengthBrain.seed(session,records)`, existing `StrengthMemory.replay(exerciseKey)`.
- Produces: compatibility replay delegates to the canonical normalized context; seed/next/estimate use its `startingScale`, `k`, fingerprint and confidence.
- Remove the adapter's independent latest-three e1RM average only after all its callers use replay.

- [ ] **Step 1: Add this executable regression, plus the cases named in the task's implementation notes.**

```js
// Add to existing strength-memory.test.js; create() and session() are its existing fixtures.
test('completion and reopening gate persistent learning without losing actuals',()=>{
  const {M}=create(),s=session();
  s.completedAt=null; M.capture(s);
  const fact=Object.values(M.records()).find(r=>r.kind==='set');
  assert.equal(fact.payload.completed,false);
  s.completedAt='2026-10-15T10:00:00Z'; M.capture(s);
  assert.equal(M.records()[fact.id].payload.completed,true);
  s.completedAt=null; M.capture(s);
  assert.equal(M.records()[fact.id].payload.completed,false);
  assert.equal(M.records()[fact.id].payload.row.kg,40);
});
```

- [ ] **Step 2: Run the focused test and confirm the assertion fails against the baseline behavior.**

Run: `node --test apps/athlete/strength-memory.test.js apps/athlete/strength-brain.test.js apps/athlete/session.test.js`. A missing new module establishes initial red only; verify the behavioral red/green cycle after its first implementation.

- [ ] **Step 3: Implement the following contract and behavior.**

Introduce `session.completedAt` in `finishToSummary` (the baseline currently sets only `phase = summary`), clear it on explicit reopen, and map that lifecycle to persisted `payload.completed`; use an explicit completion snapshot rather than assuming every captured set belongs to a finished workout. Add derived `payload.learning` envelope through the task-1/2 normalization boundary. Never trust client-supplied precomputed scale as evidence on replay. Logger receives one state snapshot; its displayed estimate, next-row recommendation and subsequent session seed must report that same fingerprint/model version internally.

Keep two main-lift ramps; do not grow more sets while uncertain. Unknown equipment/tempo context uses the existing conservative starter; directional Easy calibration can raise later seeds without entering shape fitting. A later Hard/miss invalidates the provisional warmup floor. Keep earned range progression based on all ordinary targets reaching upper bound, not merely a changed e1RM. Test a full sequence across reload: seed → two ramps → work → finish → next comparable session → edit prior first set → replay → revised next seed. Preserve all logged row IDs, cells, timer state and authored target IDs. Remove duplicated estimator calculations once equivalent consumers are migrated; do not retain competing fallback averages.

- [ ] **Step 4: Run `node --test apps/athlete/strength-memory.test.js apps/athlete/strength-brain.test.js apps/athlete/session.test.js` and its named matrix cases; verify passing counts, zero skipped mandatory cases, and inspect the diff.**

- [ ] **Step 5: Stage only the files listed above and regenerated shared copies; commit with `git commit -m "feat: unify strength seeding display and session learning"`. Record the command, result counts and commit SHA in the execution evidence.**

### Task 7: Make offline, edits and account changes replay safely

**Files:**
- Modify: `apps/athlete/strength-memory.js`, `apps/athlete/strength-memory.test.js`
- Create: `apps/athlete/strength-learning-offline.test.js`

**Interfaces:**
- Consumes: existing memory capture/restore/bind/sync/outbox APIs and canonical replay.
- Produces: revision-aware acknowledgement, per-owner cache invalidation, deterministic recovery after failure; preserve existing public API signatures.

- [ ] **Step 1: Add this executable regression, plus the cases named in the task's implementation notes.**

```js
// Add to existing strength-memory.test.js; create() and session() are defined there.
test('a delayed cloud acknowledgement never clears a newer local edit',async()=>{
  const {M}=create(),s=session(); await M.bind('a'); M.capture(s);
  const id=s.logs.A.sets[0].id;
  await M.sync({userId:async()=> 'a',pull:async()=>[],push:async()=>{
    s.logs.A.sets[0].reps=7; M.capture(s); return {ok:true};
  }});
  assert.equal(M.records()[id].payload.row.reps,7);
  assert.ok(M.getStatus().pending>0);
});
```

- [ ] **Step 2: Run the focused test and confirm the assertion fails against the baseline behavior.**

Run: `node --test apps/athlete/strength-memory.test.js apps/athlete/strength-learning-offline.test.js`. A missing new module establishes initial red only; verify the behavioral red/green cycle after its first implementation.

- [ ] **Step 3: Implement the following contract and behavior.**

Snapshot each queued local revision before upload; acknowledge only if the current pending revision still equals that snapshot:

```js
if(memory.pending[id]===sentLocalRevision) delete memory.pending[id];
```

Keep remote revision separate from local revision. Lost success responses should reconcile identical remote facts without a second write. Conflicting different facts retain pending intent and disable personalization for that context until resolved; do not overwrite actuals with averages. Derived caches are owner/context/model/fingerprint-scoped and disposable. Do not introduce a new app-boot failure for unknown model versions: retain facts, discard incompatible cache and use default. Test storage quota rejection before a successful log acknowledgement, malformed cache, process death between persist/send/ack, native backup restore, airplane-mode completion, reconnect, delete, logout/login A→B→A and a two-device concurrent edit. No facts may leak between owners, and unrelated contexts must remain usable.

- [ ] **Step 4: Run `node --test apps/athlete/strength-memory.test.js apps/athlete/strength-learning-offline.test.js` and its named matrix cases; verify passing counts, zero skipped mandatory cases, and inspect the diff.**

- [ ] **Step 5: Stage only the files listed above and regenerated shared copies; commit with `git commit -m "fix: preserve strength evidence across offline sync and concurrent edits"`. Record the command, result counts and commit SHA in the execution evidence.**

### Task 8: Prove the existing Supabase lane with a real database

**Files:**
- Create: `supabase/tests/strength-learning.test.sql`, `scripts/check-strength-learning-db.mjs`
- Modify: `scripts/check-strength-memory-sql.mjs`, `package.json`, `.github/workflows/ci.yml`
- Conditional Create: migration file returned by `supabase migration new strength_learning_record_compatibility` only if a DB regression requires an RPC/schema fix

**Interfaces:**
- Consumes: existing `sync_strength_brain_records(p_records jsonb)` and `strength_brain_records` schema, including revision/deleted/payload.
- Produces: SQL integration suite and `pnpm run check:strength-learning-db`; old-client payload/response compatibility retained.
- No new hosted model table or new endpoint is required.

- [ ] **Step 1: Add this executable regression, plus the cases named in the task's implementation notes.**

```js
// In scripts/check-strength-learning-db.mjs, after executing the SQL file with psql.
import {spawnSync} from 'node:child_process';
const result=spawnSync('psql',[process.env.STRENGTH_TEST_DATABASE_URL,'-v','ON_ERROR_STOP=1','-f','supabase/tests/strength-learning.test.sql'],{encoding:'utf8'});
if(result.error) throw result.error;
if(result.status!==0) throw new Error('Strength learning database assertions failed');
```

- [ ] **Step 2: Run the focused test and confirm the assertion fails against the baseline behavior.**

Run: `pnpm run check:strength-learning-db`. A missing new module establishes initial red only; verify the behavioral red/green cycle after its first implementation.

- [ ] **Step 3: Implement the following contract and behavior.**

Discover installed Supabase CLI commands with `--help`, then run the local Supabase stack and reset only that disposable database. Require an explicit local `STRENGTH_TEST_DATABASE_URL`; the runner must reject non-loopback hosts and redact connection strings. SQL setup runs in BEGIN/ROLLBACK, creates two fixture auth users, switches to authenticated roles and sets JWT subject claims. Test authenticated A can insert/read only A, B sees no A facts, anon cannot call RPC, malicious owner fields cannot create B-owned records, stale revisions conflict, duplicate IDs fail atomically, invalid/oversized payload rolls back the batch, tombstones survive pull, and contract-v2 and v3 clients can coexist.

Example SQL ownership assertion after fixture insert:

```sql
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',true);
do $$ begin
  if exists(select 1 from public.strength_brain_records
            where athlete_id='00000000-0000-4000-8000-000000000001') then
    raise exception 'cross-account evidence disclosure';
  end if;
end $$;
```

Use `auth.uid()` as the ownership authority. Keep existing transaction/advisory-lock guarantees. If SQL changes are needed, generate a new migration; never edit the applied 20261010120000 file. Verify relevant current Supabase docs/changelog before implementing. Tests must use JWT sessions/RLS, not only postgres-owner reads or mock IO. CI's required job must fail, rather than skip, if its local database prerequisite is absent. Hosted deployment remains a separate release activity.

- [ ] **Step 4: Run `pnpm run check:strength-learning-db` and its named matrix cases; verify passing counts, zero skipped mandatory cases, and inspect the diff.**

- [ ] **Step 5: Stage only the files listed above and regenerated shared copies; commit with `git commit -m "test: verify strength learning record ownership and migration compatibility"`. Record the command, result counts and commit SHA in the execution evidence.**

### Task 9: Exercise the full unchanged app through Playwright

**Files:**
- Modify: `checks/browser/strength-brain-v2.spec.mjs`, `checks/browser/metrics.spec.mjs`, `checks/browser/session.spec.mjs`
- Create: `checks/browser/strength-learning.spec.mjs`
- Modify: `apps/athlete/library.js`, `apps/athlete/library-ui.js`, `apps/athlete/logger.js` only for demonstrated contract/interaction regressions

**Interfaces:**
- Consumes: actual builder, calendar, logger, effort slider, rest timer and memory APIs.
- Produces: browser scenarios M1–M16 in test matrix; traces/screenshots/assertions and no new athlete controls.
- UI test fixtures use real buttons/keypads; storage/evaluate is allowed for boundary setup and inspection, not as a replacement for completing the workout.

- [ ] **Step 1: Add this executable regression, plus the cases named in the task's implementation notes.**

```js
import {test,expect} from 'playwright/test';
test('ordinary builder still hides engine-owned controls',async({page})=>{
  await page.goto('/');
  await page.getByRole('heading',{name:'Today',exact:true}).waitFor();
  await page.getByRole('button',{name:'Add',exact:true}).click();
  await page.getByRole('button',{name:'Create session',exact:true}).click();
  await page.getByRole('button',{name:'Next',exact:true}).click();
  await page.getByRole('button',{name:'Next',exact:true}).click();
  await page.getByRole('button',{name:'Back Squat',exact:true}).click();
  await page.getByRole('button',{name:'Add (1)',exact:true}).click();
  await page.getByRole('button',{name:'Next',exact:true}).click();
  await expect(page.getByLabel('Target difficulty',{exact:true})).toHaveCount(0);
  await expect(page.getByLabel('Smallest weight jump',{exact:true})).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Set 1 reps',exact:true})).toBeVisible();
});
```

- [ ] **Step 2: Run the focused test and confirm the assertion fails against the baseline behavior.**

Run: `pnpm run check:browser`. A missing new module establishes initial red only; verify the behavioral red/green cycle after its first implementation.

- [ ] **Step 3: Implement the following contract and behavior.**

Verify accessible names against the current screen before fixing locator-only drift. Expand the actual helpers in strength-brain-v2.spec.mjs into parameterized tests: build 10/8/6 plus final first-set-last AMRAP, schedule, start, log both ramps, log/adjust every working set and effort, edit first work before and after AMRAP, finish, reload, inspect history and start the next session. Repeat with 5/3/1, 3×6–8 and mixed selected metrics. Assert actual displayed next weight equals policy output, actuals unchanged, target labels correct and no fake PR before completion.

Run offline/reconnect and cross-account browser contexts, delete library session/calendar assignment and verify no ghost training item. Test every available metric still enters/saves/reloads correctly; time/distance/carries/holds remain loggable without e1RM fitting. Verify builder numeric keypad matches logger style, range dash exists only for range metrics, arbitrary ranges survive. Logging starts the existing selected rest timer; changing exercise or next-set navigation follows the current approved timer interaction without inventing rest durations. Include Android-size touch slider, keyboard operation, back navigation, console/network error assertions, double-tap logging, background/resume and screenshot comparison against pre-change screens. Use Playwright CLI for exploratory walkthrough plus committed Playwright tests for repeatability; never call a scripted storage-only test a full workout run. Save traces for failures.

Cloud command if using the already-installed system browser:

```bash
PLAYWRIGHT_CHROMIUM_PATH=/usr/bin/chromium node node_modules/playwright/cli.js test -c checks/browser/playwright.config.mjs
```

No golden snapshot or weight expectation is changed until its canonical-unit and actual interaction assertions establish the intended behavior.

- [ ] **Step 4: Run `pnpm run check:browser` and its named matrix cases; verify passing counts, zero skipped mandatory cases, and inspect the diff.**

- [ ] **Step 5: Stage only the files listed above and regenerated shared copies; commit with `git commit -m "test: cover strength learning through builder logger and history"`. Record the command, result counts and commit SHA in the execution evidence.**

### Task 10: Benchmark production decisions rather than a favorable formula port

**Files:**
- Create: `scripts/strength-learning-simulator.mjs`, `scripts/strength-learning-simulator.test.mjs`, `checks/fixtures/strength-learning-cases.json`
- Modify: `scripts/strength-simulator.mjs`, `scripts/strength-simulator.test.mjs`, `package.json`
- Create: `docs/research/strength-online-learning/production-evaluation.md`, `docs/research/strength-online-learning/production-results.json` during execution

**Interfaces:**
- Consumes: actual shared modules, adapter and memory path from tasks 1–7, no duplicated policy implementation.
- Produces: exported `runScenario({seed,policy,scenario}) -> {decisions,metrics}` from the new simulator; each decision includes targetId/physical/display kg/context/fingerprint/model/reason.
- Produces: corrected-default vs online paired results; rest candidate is evaluated separately, not silently enabled.

- [ ] **Step 1: Add this executable regression, plus the cases named in the task's implementation notes.**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {runScenario} from './strength-learning-simulator.mjs';
test('same production facts and seed produce identical decisions',()=>{
  const input={seed:912731,policy:'online',scenario:'alternating-tempo-10-8-6'};
  const a=runScenario(input),b=runScenario(input);
  assert.deepEqual(a,b);
  assert.ok(a.decisions.length>0);
  for(const d of a.decisions){assert.ok(Number.isFinite(d.physicalKg));assert.ok(d.physicalKg>=0);assert.ok(d.targetId);}
});
```

- [ ] **Step 2: Run the focused test and confirm the assertion fails against the baseline behavior.**

Run: `node --test scripts/strength-learning-simulator.test.mjs scripts/strength-simulator.test.mjs`. A missing new module establishes initial red only; verify the behavioral red/green cycle after its first implementation.

- [ ] **Step 3: Implement the following contract and behavior.**

Implement `runScenario` by loading production modules and driving seed/capture/next/replay with real record envelopes. Include prepopulated next-row kg and persisted normalized conventions, not bare formula-only calls. Parameterize the simulator's external athlete truth and random seed; keep truth hidden from policy. Use separate training/tuning seeds and sealed evaluation seeds committed before tuning. Baselines receive the same first loads, observations, inventory, sessions and effort noise; cold-start tests start with no hidden teacher strength.

Add failed-learning acquisition, empty bar, 15 kg bars, coarse dumbbells, off-grid manual actuals, hard/miss, target changes, 1/3/5 vs 10/8/6, ranges/high reps, alternating tempo, low/high strength, recovery drift, long layoffs, short rest, feedback noise/bias, edits/deletions and imports. Report target hit, miss, load error, invalid/off-grid recommendation counts, excessive jumps, evidence acceptance and learning delay with subgroup sizes and paired athlete-level confidence intervals. Preserve the previous zero-history failure in the evidence record; do not erase failing seeds.

Require deterministic replay invariants and zero corruption violations. The online candidate must meet matrix statistical gates against the repaired default; if not, keep default live and the candidate in shadow. Do not compare revised acquisition percentages to the old established-history experiment as though it were one test. Native R/Dart implementations are not executed merely because equation ports match. Add attribution/provenance and maintain external source pins if reusing fixtures. Do not commit private TrainHeroic exports; chronological real-data evaluation may validate unit/identity behavior without invented effort labels.

- [ ] **Step 4: Run `node --test scripts/strength-learning-simulator.test.mjs scripts/strength-simulator.test.mjs` and its named matrix cases; verify passing counts, zero skipped mandatory cases, and inspect the diff.**

- [ ] **Step 5: Stage only the files listed above and regenerated shared copies; commit with `git commit -m "test: compare strength policies through the production decision path"`. Record the command, result counts and commit SHA in the execution evidence.**

### Task 11: Bound runtime cost and exercise fallback and shadow selection

**Files:**
- Modify: `apps/shared/strength-policy.js`, `apps/athlete/strength-brain.js`, `apps/athlete/strength-memory.js`
- Create: `scripts/check-strength-learning-performance.mjs`, `apps/athlete/strength-learning-rollout.test.js`
- Modify: `package.json`, `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: existing default and candidate decisions, replay fingerprint and model version.
- Produces: internal policy mode `'default' | 'shadow' | 'online'`, default `'default'`; no UI control.
- Produces: diagnostic events with context hash/model/reason/delta only; omit names, raw health data and secrets.

- [ ] **Step 1: Add this executable regression, plus the cases named in the task's implementation notes.**

```js
// In strength-learning-rollout.test.js, load production adapter in a VM as existing brain tests do.
import test from 'node:test';
import assert from 'node:assert/strict';
import {loadStrength} from '../shared/test/strength-harness.mjs';
const {StrengthPolicy:P}=loadStrength(['strength-load','strength-context','strength-learning','strength-replay']);
test('shipping policy is conservative until release gates are approved',()=>{
  assert.equal(P.learningMode,'default');
});
```

- [ ] **Step 2: Run the focused test and confirm the assertion fails against the baseline behavior.**

Run: `node --test apps/athlete/strength-learning-rollout.test.js`. A missing new module establishes initial red only; verify the behavioral red/green cycle after its first implementation.

- [ ] **Step 3: Implement the following contract and behavior.**

Cache replay per canonical evidence fingerprint; never refit on every slider render. Fit at most 24 observations/32 search steps, invalidate on fact changes and owner switch. Performance command measures real modules on a recorded Android staging device and an annotated CI reference host. Targets: next-set computation p95 ≤16 ms; cached lookup p95 ≤5 ms; 10,000-record replay ≤250 ms on the reference host, with no UI task exceeding 50 ms on the device. If replay exceeds the device budget, chunk outside the interaction path and retain previous default decision until a verified result is available; don't publish stale candidate state as current.

Test corrupted model, missing module, impossible projection, unsupported metrics and insufficient evidence each preserve log completion and select default/conservative behavior. Shadow must produce exactly default displayed decisions for identical facts while recording candidate deltas internally. Rollback drops only derived cache and changes mode; facts/pending sync survive. Add `check:strength-learning-performance` to CI with deterministic bounded-operation checks; hardware latency evidence is a separate mandatory staging gate rather than a flaky shared-host timing assertion. Keep policy mode default in this implementation PR until the staged release evidence supports enabling it.

- [ ] **Step 4: Run `node --test apps/athlete/strength-learning-rollout.test.js` and its named matrix cases; verify passing counts, zero skipped mandatory cases, and inspect the diff.**

- [ ] **Step 5: Stage only the files listed above and regenerated shared copies; commit with `git commit -m "feat: add safe shadow selection and bounded strength learning runtime"`. Record the command, result counts and commit SHA in the execution evidence.**

### Task 12: Validate the actual APK and prepare a reversible release

**Files:**
- Create: `docs/releases/strength-online-learning-acceptance.md`
- Modify: `.github/workflows/ci.yml` only to require the new nondeployment checks
- Read only: `.github/workflows/dogfood-apk.yml`, `.github/workflows/capgo-ship.yml`, `apps/mobile/capacitor/scripts/build-dogfood-apk.sh`

**Interfaces:**
- Consumes: all task evidence and matrix gates, staging database and signed private test APK built from the reviewed commit.
- Produces: acceptance record with exact commit, app version, device/Android versions, migration version, artifact SHA256, test counts, limitations and rollback rehearsal results.
- No automatic production Capgo action is introduced by this task.

- [ ] **Step 1: Add this executable regression, plus the cases named in the task's implementation notes.**

```js
// Add to strength-learning-rollout.test.js after task 11's shipping-policy test.
test('policy version explicitly identifies the learning algorithm',()=>{
  assert.equal(P.learningVersion,'online-v1');
});
```

- [ ] **Step 2: Run the focused test and confirm the assertion fails against the baseline behavior.**

Run: `pnpm run verify:strength`. A missing new module establishes initial red only; verify the behavioral red/green cycle after its first implementation.

- [ ] **Step 3: Implement the following contract and behavior.**

Set the policy's explicit learningVersion and run the full repository `pnpm run verify` after focused strength checks; existing conditioning/coach regression suites may run read-only but must not expand the implementation scope. Require nonzero mandatory test counts and capture failures. Build a private staging APK from the reviewed commit using the existing script/workflow, with deployment credentials supplied through existing secure bindings. Verify the actual installed build/version and bundle hash; browser tests cannot certify Capacitor storage, Android resume or updates.

On a physical Android device, build and finish a session online and in airplane mode; background/lock during rest; kill/reopen midworkout; reconnect and verify Supabase facts; edit/delete and verify replay; switch accounts; test 15/20 kg bar and first-set-last; preserve all selected metrics. Record video/screenshots and actual database verification, avoiding public personal data. Run old and candidate APK against staging to prove mixed-version payload compatibility. Rehearse switching back to default with facts and pending uploads intact.

Acceptance doc must link every matrix row to evidence and explicitly list any blocked/unrun gate. Do not label this flawless or guarantee 100%. No merge/release while a mandatory gate is failing or unrun. Once complete, present the exact tested commit/artifacts and release notes; production rollout/Capgo follows the user's release instruction, never merely a documentation commit or an invoice status. Enable online only if statistical and device gates pass; otherwise ship the repaired default separately with the learner remaining internal shadow.

- [ ] **Step 4: Run `pnpm run verify:strength` and its named matrix cases; verify passing counts, zero skipped mandatory cases, and inspect the diff.**

- [ ] **Step 5: Stage only the files listed above and regenerated shared copies; commit with `git commit -m "docs: record strength online learning release acceptance"`. Record the command, result counts and commit SHA in the execution evidence.**

## Self-review and handoff

- Spec §§1–4 → tasks 1–2, 5, 9; maths/evidence eligibility §§5–6 → tasks 3–6, 10; durability §7 → tasks 4, 6–8; rollout §8 → tasks 10–12.
- [Test matrix](../../research/strength-online-learning/test-matrix.md) assigns each meaningful failure class to a test layer and gate.
- Interfaces and generated-module loading must be reviewed together; no second history average, duplicate learner or server model ledger is introduced.
- This document is an implementation contract, not a claim these tests have run. Execution evidence belongs in the acceptance record.
- Preferred execution follows the user's earlier choice: subagent-driven tasks with primary-agent review of each change. Alternatively use executing-plans inline. Do not start implementation from the planning PR automatically.
