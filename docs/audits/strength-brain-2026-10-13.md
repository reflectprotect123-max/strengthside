# Strength brain audit — 13 October 2026

Audited repository: `reflectprotect123-max/strengthside`, current `main` at `4c82bff3`, app release `1.3.8`.

## Latest-update review — main `5f9db1f5`, release `1.3.10`

The original audit below is a snapshot of `4c82bff3`. A subsequent fetch found merged Cursor PRs #251 and #252, reviewed against that snapshot on 13 October 2026.

- PR #251 adds a Library session wizard: instructions, warm-up, exercise selection, per-set reps, exercise-wide four-count tempo, cool-down, overview and calendar posting. Training becomes the logging area. It also closes stale keypads and handles deleting lifts during the wizard.
- Tempo is now saved on the library exercise block and compiled into the plan as both `tempo` and a prescription suffix. The original finding that there is no tempo entry/compile support is therefore partially resolved. The session page still omits structured `tempo`; it retains the prescription string for display. Set-target normalization, matching-history logic and numerical learning remain tempo-unaware. A new unit test explicitly confirms that adding tempo does not change the weight suggestion.
- PR #252 packages the pinned Engine page under `engine/` and adds the Strength/Engine switch on Me/Settings. The apps share the configured Supabase authentication session but retain distinct local state. A running or paused Engine workout blocks returning to Strength. This navigation integration does not create a shared strength/conditioning numerical brain or shared calendar.
- The strength core, adapter, memory, targets and equipment calculation files are unchanged from the original audit. Its other numerical findings have not been repaired by these updates.
- Capgo was checked read-only: `com.hybrid.strength` / `strength-live` points to **1.3.10**. No release was performed during this review.
- Independent local verification: **59 unit tests passed**, boot/release checks passed, and **5 focused Playwright tests passed**, including the new Strength → Engine → Strength switch and session-building/logging flows. GitHub CI and the latest APK workflow also report success. Authentication on a physical phone was not tested locally.

PRs: https://github.com/reflectprotect123-max/strengthside/pull/251 and https://github.com/reflectprotect123-max/strengthside/pull/252.

## Assessment

The builder and logger can record ordinary strength sessions successfully. The adaptive recommendations are not yet dependable across this programme's changing tempos, rep patterns and bodyweight movements. There are confirmed implementation faults as well as deliberate limitations that now need decisions.

The app does not need a huge exercise library or a ground-up rewrite. It needs a consistent prescription context, one learning calculation, and corrections to the transitions between warm-ups, work sets and subsequent sessions.

This was an audit. No product code, release metadata, deployed functions, live channels or athlete data were changed. The local checkout was fast-forwarded to current main for inspection. This report and a temporary diagnostic harness were created locally.

## Verification and limits

- 56 shared-contract, equipment, targets, core, adapter, memory, packaging and simulator tests passed.
- 55 builder, library, session and plan-sync tests passed.
- 32 Playwright browser tests passed using `/usr/bin/chromium`, including session creation, scheduling, logging, metrics, AMRAP, range entry, persistence and update restart.
- The memory migration passed its tests in a disposable local PostgreSQL instance: persisted sets, revision conflicts, deletion tombstones, direct-write denial, athlete isolation and unauthenticated denial.
- 11 additional scenarios reproduced the findings below by calling the actual production JavaScript in an isolated environment. Harness: `/tmp/strength-programme-audit.mjs`; command: `node /tmp/strength-programme-audit.mjs`.
- The existing simulation was rerun into `/tmp/strength-audit-simulation`. It reproduced the conservative fallback and rejected candidate policy.
- No athlete's production Supabase history or physical phone was inspected. Local SQL tests establish the migration's behavior, not production deployment status or successful sync on your account.

The first browser attempt could not launch because Playwright's default browser binary was absent. Selecting the installed Chromium resolved that environment issue. The pnpm wrapper tried an unnecessary install and failed on its store database; the exact script checks were then run directly with Node successfully.

## Confirmed findings, prioritised

### 1. Known working weights are lost at the warm-up transition — high priority

Reproduction: a previous completed squat session at 100 kg produces a next-session working target of **102.5 kg**. The new session starts the first ramp at **50 kg**. Logging both ramps as Easy produces **52.5 kg** for ramp two and **55 kg** for working set one.

Cause: seeding saves `page.workingKg`, blanks working rows when ramps exist, then the core advances one equipment step from the previous ramp. That final transition does not use the known working target.

Sources: `apps/athlete/strength-brain.js:48–54`, `apps/shared/strength-brain-core.js:48–51`, `apps/athlete/logger.js:789–794`.

Fix direction: distinguish ramp-to-ramp from final-ramp-to-work. Use two planned ramps towards the working target, with bounded adjustments from actual feedback. For unknown capacity, retain a provisional process instead of pretending two ramps identify a precise maximum.

Acceptance: a known 102.5 kg working target should not become 55 kg merely because both warm-ups were Easy. Hard or missed ramps must still change the plan appropriately; completed actuals remain immutable.

### 2. Easy sessions can earn progression and then have it ignored — high priority

Reproduction: three 5-rep sets at **100 kg, Easy** produce `earned: true` and `nextKg: 102.5`. However, Easy intentionally produces no precise e1RM, so `calibrated` is false. History excludes that session from `latest`. With no other eligible history, the next session selects the **20 kg provisional barbell starter** as its working weight.

Sources: `apps/shared/strength-brain-core.js:19–22,73–77`, `apps/athlete/strength-brain.js:30–31,41–47`.

Fix direction: separate useful actual-load/progression evidence from evidence eligible to estimate 1RM. An Easy session can supply a useful load anchor without manufacturing a precise maximum.

Acceptance: repeatedly completing the same prescription easily must carry a defensible load forward. It must not restart calibration because the effort category lacks a chart mapping.

### 3. Today's Hard feedback can still trigger an increase — high priority

Reproduction: a **100 kg × 5 Hard** set, with a historical e1RM of 200 kg, produces **105 kg** for the next ordinary 5-rep set. Intended effort is Average. Without that historical baseline, the same observed set projects approximately 95 kg on the declared rack.

Cause: historical capacity receives 85% of the projection and the current observation 15%; Hard has no explicit rule to prevent an increase when the next prescription is unchanged. The stale/overestimated baseline can dominate today's result.

Source: `apps/shared/strength-brain-core.js:57–64`.

Fix direction: add a feedback consistency rule for unchanged prescriptions and separate today's capacity from longer-term learning. Changing to fewer reps can reasonably increase load; the rule must account for that distinction.

Acceptance: stale history alone must not increase an unchanged set after harder-than-intended feedback. Test changing reps separately, so a useful 10/8/6 progression is preserved.

### 4. Saved learning and live suggestions use different baselines — high priority

Saved memory replays eligible sessions through a **10% weighted update** over all exposures. The live adapter instead recalculates the **mean of the latest three estimates**. It does not consume the replayed learned baseline.

Reproduction using four first-set observations at 40, 60, 80 and 100 kg for 5 reps at Average:

- Live history mean: **101.78 kg e1RM**.
- Saved learned baseline: **65.17 kg e1RM**.

These are deliberately spaced synthetic inputs to make the discrepancy obvious, not a proposed training progression.

Sources: `apps/athlete/strength-memory.js:60–77,96–98`, `apps/shared/strength-brain-core.js:25–30`, `apps/athlete/strength-brain.js:15–17,29–31`.

Fix direction: choose one canonical learning pipeline and use it for stored state, UI estimates, session seeds, intra-session suggestions and simulations. Keep today's feedback separate from the long-term baseline.

Acceptance: the same eligible history must produce the same long-term estimate wherever the app consumes it; edited/deleted evidence must replay correctly.

### 5. Tempo has no structured path from builder to learning — high priority for your programme

There is no tempo field in the active athlete builder. Adding a tempo property to a block does not solve it: the compile step and session-page construction omit it. Target normalization also drops a tempo property on individual sets. The history key and prescription signature contain no tempo.

Reproduction: `33X1` with 5/5/5 and `20X1` with 10/8/6 share `back_squat|barbell|total|kg`. A supplied tempo disappears during compile/session creation; supplied set tempo disappears during normalization.

Sources: `apps/athlete/library-ui.js:162–210`, `apps/athlete/library.js:331–355`, `apps/athlete/session.js:95–135`, `apps/shared/strength-targets.js:47–53`, `apps/athlete/strength-brain.js:6–8`, `apps/athlete/strength-memory.js:50–51`.

Legacy database DDL contains a tempo metric, but the active app's memory path is `strength_brain_records` with JSON payloads. That old metric table does not make tempo work in the shipped app.

Fix direction: one exercise identity, tempo as prescription context, and a shared tempo parser. Prioritise matching-tempo performance, use other-tempo history only as provisional evidence, and preserve the prescribed tempo on each recorded set. Allow exercise-level default tempo with set-level override if the programme requires it. Treat `X` as explosive intent, not a fixed number of seconds.

Acceptance: your alternating six-week block must retain both contexts and support changing reps within each. Returning to a slower tempo must not reset learning or rewrite the faster-tempo baseline. No universal percentage matrix should be presented as validated physiology.

Old records without structured tempo should remain labelled unknown. Do not relabel them as standard tempo or guess tempo from arbitrary notes silently.

### 6. Weighted dips lack added-weight/bodyweight/assistance semantics — high priority before trusting dip suggestions

The core uses the logged kg scalar in its estimate, without consulting bodyweight or load convention. Its eligibility check admits weighted dips entered as a kg/reps lift. A custom exercise can also lack any equipment rack, in which case suggestions simply cannot move to a new known load.

Reproduction with explicitly declared dip metadata:

- Athlete bodyweight **80 kg**, added weight **20 kg**, 5 reps at Hard produces **23.89 kg e1RM**, based only on the added 20 kg.
- **0 kg added** is considered non-positive capacity and cannot automatically progress to added load through the current calculation.
- Negative kg representing assistance is rejected by the metric parser; entering positive assistance in an ordinary weight field would instead give it the wrong meaning.

Sources: `apps/shared/strength-brain-core.js:9–22,40`, `apps/shared/training-core.js:34–40`, `apps/athlete/library.js:390–400`.

Fix direction: explicit load modes for external load, added load and assistance. Store dated bodyweight context when available. Model changes to added load correctly and treat missing bodyweight conservatively. Bodyweight plus attached weight can be a useful context proxy, but it should not be asserted to equal the mechanically effective load for every bodyweight exercise.

Acceptance: bodyweight-only to weighted transitions, changing bodyweight, weighted to assisted transitions and declining assistance must all behave correctly. The logger should continue showing the user's added or assistance weight, not force them to enter combined load.

### 7. Equipment-step policy differs between next set and next session — medium priority

Reproduction on the declared dumbbell rack: **10 kg, Easy** holds at **10 kg** intra-session because the next 12.5 kg rung exceeds the 5% upward cap. Completing all ordinary targets easily produces **12.5 kg** in session review, without that same cap. Thus the same feedback can mean hold now and a 25% increase next time; Easy-history filtering in finding 2 may additionally discard the latter decision.

Sources: `apps/shared/strength-equipment.js:64–81`, `apps/shared/strength-brain-core.js:53–55,76`.

Fix direction: make the difference intentional. The sensible response to a coarse rack might be to build reps first or request a smaller available increment. Do not automatically approve a large jump just because it is the next rung. Use one documented equipment policy across all decisions.

Acceptance: test 1 kg rungs through 10 kg, the transition to 12.5 kg, optional 18 kg overrides, plate increments and machine stacks.

### 8. Equivalent prescriptions lose earned progress when set IDs differ — medium priority

The same-prescription check compares normalized targets including their IDs. Two templates can prescribe the same squat and reps with different block/set IDs.

Reproduction: prior 3×5 at 100 kg Average earns **102.5 kg**. An equivalent new template with different target IDs instead seeds **100 kg** from the e1RM fallback, losing the earned step.

Source: `apps/athlete/strength-brain.js:43–46`.

Fix direction: compare prescription meaning rather than storage IDs. Include reps, tempo, set purpose, load mode and reference rules. Keep IDs for tracking edits and immutable evidence, not for deciding whether two tasks match.

### 9. Some machines have no usable rack or starter — medium priority

The seeded Lat Pull Downs catalogue entry specifies machine/total but no available loads, minimum or step. A custom exercise form only supplies title and metrics; it has no structured equipment setup path.

Reproduction: the machine's starter is null and a logged **40 kg Easy** set holds at **40 kg**, because no next equipment rung is known.

Sources: `apps/athlete/library.js:6,41–50`, `apps/athlete/library-ui.js:274–291`, `apps/shared/strength-equipment.js:30–39,60–63,83–104`.

Holding instead of inventing a load is defensible. The gap is that the app cannot learn/use a rack consistently and may look adaptive while it is holding for lack of metadata.

Fix direction: useful default profiles with athlete-adjustable exceptions or a simple catalogue metadata setup. Keep engine controls out of every workout builder row.

### 10. Missed-target learning has inconsistent semantics — medium priority; policy decision required

Logging **4 reps against a target of 5** without explicitly choosing Did Not Complete triggers the core's below-target reduction check, but the session review still returns a positive calibrated e1RM from that same set.

Sources: `apps/shared/strength-brain-core.js:18–22,42,74–77`.

A below-target set can still contain useful evidence, so it is not automatically mathematically invalid. The problem is that one path calls it a miss while another admits it to ordinary fresh learning without a distinct evidence label.

Fix direction: define shared evidence eligibility. Distinguish valid observed performance, completed prescription, technical failure, deliberately shortened set and ordinary evidence for learning. Preserve actuals; do not silently assume every short set means muscular failure.

### 11. Failure intent is stored but does not affect intended effort — medium priority

First-set-last AMRAP correctly references the actual first ordinary working load. However, the builder authors the final AMRAP with `toFailure: false`; even when a target is supplied with `toFailure: true`, the brain returns **Average** intended effort. Normal working sets also always target Average, regardless of broader programme intent.

Reproduction: AMRAP target with `toFailure: true` returns `average`.

Sources: `apps/athlete/library-ui.js:512`, `apps/athlete/strength-brain.js:14`, `apps/shared/strength-brain-core.js:16`.

Fix direction: distinguish programmed AMRAP-to-failure from ordinary adaptive work. This does not require an effort box for the athlete. The engine can use the set's programme intent while the user continues reporting actual effort on the same slider. Whether to prescribe deliberate maximum attempts remains a separate product decision.

## Existing boundaries, not newly reproduced faults

- The chart supports 1–12 reps. Higher reps can be authored and logged, but precise e1RM estimation is withheld and projection often holds. Easy can still take a directional step when equipment permits it.
- Holds and carries are excluded from e1RM, correctly. Logging their selected metrics works; automatic duration/distance/load progression is not implemented in this brain.
- Pounds, percentage loads, LWP and extra metrics can be logged but do not get the ordinary kg/reps adaptive calculation. Adding velocity as a tracking metric does not create velocity-based training: it excludes the lift from the current supported calculation.
- Requested rest is captured, but `elapsedRestSec` is always null in the active set flow. There is no measured-rest model informing weight predictions.
- WHOOP, daily check-ins and conditioning load do not directly feed this numerical strength policy. Their observations are useful context, but displaying them is not the same as adapting loads from them. This is consistent with parking the conditioning integration for now.
- There is no time-based confidence decay for a long break in the history/seed path. Three eligible exposures produce a `personal` label, but that count is not proof that the estimate is accurate.
- Sync conflict detection protects data, but stops a conflicting outbox without a complete user reconciliation flow. This is a reliability improvement to design before heavy multi-device use.

## Why the previous simulator did not find these problems

It exercises the production pure core, but builds its own session starting loads using synthetic athlete capacity. It does not run the actual `StrengthBrain.seed` and two warm-up transitions as the logger does. Consequently, it cannot expose findings 1 and 2 through the real session-start path.

It uses `Core.learn` as its learning pipeline, while the app adapter uses last-three history averaging. That misses finding 4. It has barbell, dumbbell and machine cohorts, but no tempo switching or weighted/bodyweight/assisted cohorts.

The rerun still rejected the candidate policy on holdout underloading and retained `strength-v2-conservative`. The recorded 79,488 holdout sets refer to the candidate. Conservative baseline miss rate was approximately **8.38%** and underloading **49.65%**, measured against the simulator's own assumed ideal. These are synthetic measures, not expected real-user rates or validated estimates of injury risk. Software invariants passing does not establish that weight suggestions fit the actual programme.

## What is already worth keeping

- Arbitrary per-set reps, including 10/8/6 and 5/3/1, and positive rep ranges reach the logger.
- Rep-range progression requires reaching each ordinary set's upper bound at Average or easier; 3×6 within 6–8 does not earn the next-session step.
- Actual weight overrides and completed AMRAP actuals remain intact.
- AMRAP can reference the first working set's actual weight; it does not learn a fresh e1RM from that fatigue-heavy final set.
- Warm-ups do not directly update long-term e1RM.
- Equipment ladders, manually logged exceptions, local persistence, replay after edits/deletion, outbox retries, revisions and account isolation have a useful foundation.
- Tempo can be added to the existing JSON memory payload without creating a duplicate exercise catalogue. Rollout still needs versioned context, replay rules and legacy-data handling; flexible JSON alone does not solve those decisions.

## Recommended implementation order

1. **Unify the brain's source of truth:** one history/replay calculation, shared evidence eligibility, semantic prescription matching and explicit today's-capacity state.
2. **Repair current load flow:** known working-target transition, useful Easy history, harder-than-intended feedback safeguards and coherent equipment jumps.
3. **Carry tempo end to end:** builder prescription → compiled plan → logger snapshot → set records → matching history. Use matching evidence first and a conservative fallback, not a fixed universal tempo penalty.
4. **Handle bodyweight load modes:** weighted dips/pull-ups, bodyweight-only and assistance, with appropriate equipment and bodyweight context.
5. **Finish programme intent and declared boundaries:** AMRAP-to-failure, higher reps, timed/distance progression and long-break handling. Only then consider whether measured rest or recovery data should affect weights.
6. **Test the actual app path:** drive builder/compile/session seeding, the two real warm-up decisions, logger saves, saved-memory replay and the next scheduled session. Preserve the current tests and add the reproduced cases.

The programme simulation should alternate `33X1` 5/5/5 with `20X1` 10/8/6 over weeks 1–6, then repeat the block. Include unfamiliar tempo, missing history, all-Easy sessions, rough days, failed/short sets, coarse dumbbells, changing bodyweight, assisted dips, manual overrides, long breaks, edits, offline sync and account switches.

The practical goal is unchanged: the athlete enters the programme's prescription, logs actual performance and uses the existing effort slider. The internal model should handle context without turning the builder into an engineering settings screen.
