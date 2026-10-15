# Engine builder and adaptive-conditioning audit — 14 October 2026

Repository: strengthside main `5f9db1f5`; shipped Engine import under `apps/athlete/engine/`, Strength release 1.3.10. Engine is pinned to upstream `1df7fd78555af0211f40ddc7c95ab36ca3bdfcf9` in `UPSTREAM.json`.

## Result

Engine has a substantial recording/timing foundation. It does not currently implement the proposed mixed-session adaptive loop. Build a shared structured session model and extend the active live player; do not simply turn on the older conditioning progression code bundled in the page.

No product, deployment, database or release changes were made. The inspection used source tracing and an isolated local browser. Production athlete records and native Bluetooth/foreground-service behavior were not tested.

## What already exists

| Component | Current behavior | Reuse |
| --- | --- | --- |
| Method builder | 12 named conditioning methods, editable modality/work/recovery/rounds/warm-up/cool-down, remembered settings | Keep as presets inside a more general block builder |
| Live timer | Work/rest phases, rounds, warm-up/cool-down, countdown audio, pause/resume, finish and reopening paused workouts | Keep tested primitives; one scheduler should drive the mixed session |
| Block queue | Saved engine-only blocks become a first interval and pending queue | Extend; currently subsequent blocks wait in ready state for confirmation |
| Heart-rate transport | Heart-rate broadcast over browser/native Bluetooth, connection-health handling | Reuse; it does not provide bike watts, row split or running pace |
| HR accounting | Measured time, bounded short-gap estimates and unknown time are separated | Preserve this distinction |
| Zones | Estimated Karvonen zones from HRmax and resting HR, including WHOOP 28-day resting-HR baseline | Reuse as explicit HR context, not proof of measured thresholds |
| Daily adjustment | Today's recovery changes green/red boundaries using a versioned product formula | Already adaptive zone presentation; not personalised pace/power learning |
| In-session zone locking | Zones freeze when the workout starts | Preserve so later recovery sync does not rewrite the workout's classification |
| Workout history | HR samples, zone totals, interval completion/configuration, whole-session RPE/performance/notes | Extend with per-step actuals and feedback |
| Storage | Local state, native backup, account-scoped snapshot sync | Extend versioned entities; no need to replace the whole storage path |

## What the current UI/player cannot do

1. Author the user's five alternating cardio/EMOM blocks through the visible method builder.
2. Represent activity choices (Run/Bike/Row) distinctly from the activity selected and performed.
3. Interpret 65/70/75% effort: no explicit reference to HR reserve, HRmax, speed, threshold power or perceived effort.
4. Rotate named exercises through a six-minute EMOM, including separate left/right holds.
5. Automatically switch the cardio/strength recording segment based on the current block; Mixed currently uses a manual segment toggle.
6. Collect actual output and actual effort after each work step, then adjust a comparable next step.
7. Learn activity-specific capacity and choose next-session starting targets from those recorded actuals.
8. Post a session through a Strength-style date picker: the active Engine overrides the inherited calendar action to load the session into LiveWorkout.

The inherited code contains an EMOM timer, but its current representation is a minute counter with a round count. It is not an alternating exercise/side scheduler integrated into the active live recorder.

## Existing adaptive code: distinguish availability from use

The embedded adaptive package includes `openCond`, `decideNextCond`, `closeCond` and 2k mapping. Its old heuristics change watts/RPM by +3%, -5% or -8%, or split by fixed seconds, according to effort bands. Legacy HybridEngine logic also routes some targets through a brain kernel.

That is not the path used by the present live recorder. Current method templates explicitly set `manualNoProgression: true`. The active LiveWorkout stores a session RPE/performance rating after the workout, and has no call from interval feedback into pace/power adjustment or persistent modality learning.

Furthermore, legacy `recordEffort` records the current target watts/split/RPM in the bout, rather than separately collected measured output. It cannot be adopted as actual-performance learning without correcting that distinction. Cadence/RPM also cannot be treated as universally equivalent to workload: resistance, gearing and machine characteristics matter.

Weekly-target history can be displayed and synced, but the UI explicitly says automatic target progression is not enabled. Fitness level and goal are stored without a personalised progression calculation.

## Behavioral reproductions

Harness: `/tmp/engine-audit-browser.mjs`, run against the actual Engine page served locally.

1. **Ordered cardio steps work under the hood.** A saved engine-only template with 180/120/60-second steady blocks produces a first step and pending queue `[120,60]`.
2. **Percent text is not an intensity model.** Naming those steps “65% effort,” “70% effort,” and “75% effort” leaves the default active target at Middle Green in this test. Titles alone do not encode percentages.
3. **Block transition is manual.** After completing the first step, the second is ready while the overall workout remains running. This is useful for equipment transitions, but should be deliberately designed rather than mistaken for continuous 3/2/1 playback.
4. **Mixed prescription rejected.** Adding a circuit/EMOM block to the saved template produces “unsupported blocks” and does not load a workout.
5. **Zero-rest bug in legacy construction.** `HybridLibrary.addEnginePiece(...restSec:0...)` stores 45 seconds because the expression uses `Number(value) || 45`. The new contract must distinguish zero from missing.
6. **Recovery affects boundaries and zones freeze.** With HRmax 180, resting HR 60, recovery 20 gives green 137; recovery 100 gives green 144. The active workout retains 137 once started. This demonstrates the product rule, not physiological validation of its coefficients.
7. **Storage carries the current history.** Submitting a workout produces a `conditioning_workout` entity in the account snapshot along with measurements/settings. This was verified by packing local state, not pushing to production.
8. **Default feedback can look observed.** A newly created workout starts at `rpe:5` and `performance:5`; submit can save those defaults without a confirmed rating. Learning must use explicit feedback confirmation or null/missing status, not infer that the user actually reported 5.

Additional checks: 9 import/hallway unit tests passed and athlete boot smoke passed. Physical device HR capture, authentication, production snapshot writes and exercise-specific adaptation were outside this local audit.

## Storage path

The active Engine uses `athlete_domain_snapshots` and `upsert_athlete_domain_snapshot`, preferring `engine_side` and falling back to `conditioning`. Live workouts are whole snapshot entities, not the strength brain's per-set record table. Each includes interval summaries and raw HR samples, but no complete per-interval output/feedback/evidence model.

Add stable session/block/step IDs, authored prescription, actual activity, actual output with units, confirmed effort, completion/stop status and decisions. Existing JSON payloads can carry a first version of these fields. Bounded sample storage, account isolation, conflicts and replay across edits still need testing. Flexible JSON does not by itself provide a consistent learning model.

## The user's session expressed correctly

- Cardio block A: 180 seconds at 65%, 120 at 70%, 60 at 75%.
- Six-minute EMOM B: minute 1 hip-thrust hold 15 seconds each leg; minute 2 side plank 15 seconds each side; repeat the two-minute rotation three times.
- Duplicate cardio block A.
- Six-minute EMOM D: minute 1 ring plank 15 seconds each arm; minute 2 ring-row hold 15 seconds each arm; repeat three times.
- Duplicate cardio block A.

Programmed time: 30 minutes before transitions. Each EMOM minute allocates 30 seconds of hold time; actual switching time must also fit the minute. The remaining time is not automatically equivalent to passive rest. Completion and substitutions should be recordable without pretending every hold was measured.

## Recommended architecture

1. **One shared session contract.** Ordered blocks, explicit interval steps, activity choices, EMOM rotations, side instructions, programmed durations and transition rules. Builder, player and stored history all use it. Preserve templates as immutable prescription snapshots when a session starts.
2. **Extend the current method catalogue.** Keep existing methods as ready-made block presets. Add custom cardio sequences and exercise EMOMs, duplication/reordering, overview and genuine calendar posting.
3. **One active player.** Reuse the live timer and HR accounting. Switch cardio/strength accounting according to blocks, retain pause/resume and use explicit ready transitions where setup is needed. Do not run legacy HybridTimer and LiveWorkout as competing clocks.
4. **Capture evidence first.** Actual pace/power may be entered manually initially; HR remains contextual. Record confirmed effort after suitable intervals or blocks. Avoid interrupting every one-minute exercise turn just to collect a rating.
5. **Canonical conditioning learning.** Modality/machine-specific baselines; comparable interval duration and intent; history seed; bounded within-session changes; slower between-session learning. Distinguish actual output from target output, and missing evidence from poor performance. Do not directly reuse strength e1RM maths.
6. **Separate EMOM progression.** Holds and exercises use duration/load/variation/completion rules. A low HR during an isometric hold does not justify an automatic harder exercise.

## Decide before designing the percentages

The user's 65–75% effort must retain its intended meaning. If it is a subjective programme cue, display it as such; do not convert it to a precise HR or watts target. If it references a measured threshold or max speed/power, store that reference and the test/context it came from. Running, biking and rowing need separate output baselines.

Recovery adjustment already exists, but its numerical thresholds are product assumptions. It should be evaluated separately from actual-performance learning; a WHOOP score alone does not establish a precise reduction in pace or power.

## Size and order of work

This is a medium-to-large feature extension, not a cosmetic copy of Strength's builder. Reusing recording, zones, timers and storage saves substantial work. Structured mixed sessions, per-step evidence and a consistent learning pipeline are the main new pieces.

First milestone: reliably build and play the exact five-block session, with zero invented intensity conversions and no adaptation. Second: capture outputs and confirmed effort. Third: simulate and add the adaptive decisions. Only then integrate optional recovery modifiers and live output sensors.

Expect several working days for the basic mixed-session builder/player and additional time for defensible adaptive learning and regression testing. A fixed total estimate is premature until the intensity definition and data-source choices are settled.

The imported Engine page is a 9,532-line built HTML artifact plus native bridge. Changes should go through a maintainable source module and the pinned import/staging workflow; direct one-off edits to generated HTML risk being overwritten by the next import.

## Acceptance tests before shipping

- Exact 30-minute five-block timeline; all EMOM minute/side rotations correct.
- Continuous transitions versus manual setup transitions behave as prescribed.
- Paused time, app restart, sensor disconnect and delayed timer ticks do not invent work or HR coverage.
- Zero-rest intervals remain zero; active-recovery-after-last rules remain correct.
- Switches between cardio and holds classify HR time appropriately.
- Blank effort stays blank; actual outputs are never copied from suggestions and labelled observed.
- Running/rowing/bike histories and machines do not share an unqualified output baseline.
- Unclear percentages stay subjective until an explicit reference is provided.
- Feedback corrections, substitutions, stopped steps and offline/cloud conflicts replay predictably.
- Builder, active session and stored prescription remain congruent; future template edits cannot rewrite a completed session.
