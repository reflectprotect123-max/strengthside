# THE Hybrid Engine — strength implementation checklist

**Checklist version:** `1.1.0`  
**Target:** existing `THE-HYBRID-ENGINE1` monorepo; preserve current local-first athlete PWA and separate coach surface.

## Phase 0 — audit and boundaries

- [ ] Audit the current strength/training code before restructuring.
- [ ] Preserve athlete app and coach app separation with one tested boundary.
- [ ] Confirm coach owns prescriptions; athlete owns actual load, reps, RIR, completion, notes and symptoms.
- [ ] Add evidence labels: `PRODUCT`, `SCIENCE`, `HYBRID_POLICY`, `UNKNOWN`.
- [ ] Assign owners for formula and policy versions.
- [ ] Define privacy/consent rules for pain, health, performance, sleep and nutrition constraints.

**Exit criteria:** current behaviour and data migrations are documented; no historical result is silently rewritten.

## Phase 1 — data contracts

- [ ] Implement exercise, movement pattern, prime movers, substitution group and fatigue-cost metadata.
- [ ] Implement `ExerciseSetObservation` with load/unit/reps/target RIR/actual RIR/set type/technique/pain.
- [ ] Store warm-up, working, failure, drop, myo and partial sets distinctly.
- [ ] Store RIR confidence and missingness.
- [ ] Implement `ProgramSnapshot` with version, cycle, schedule, targets and deload policy.
- [ ] Separate repeating cycle templates (1–52 cycles; default custom 7) from dated session instances; cap unique training days per cycle at 14.
- [ ] Implement `ProgressionRecommendation` separately from the program snapshot.
- [ ] Implement per-muscle direct sets, indirect exposure, priority and feedback state.
- [ ] Add audit events for session-only edits, program updates, swaps, skips, overrides and declined recommendations.
- [ ] Add lifecycle events for repeat/complete/activate/backfill/edit/delete and preserve all historical observations.
- [ ] Make exercise metadata first-class: laterality, load semantics, bodyweight status, ROM, stability, movement pattern and recommendation exclusions.
- [ ] Preserve original and corrected RIR observations when a set is edited after completion.

**Exit criteria:** every prescription and recommendation can be traced to raw observations, policy, formula and reason codes.

## Phase 2 — MacroFactor-style exercise progression

- [ ] Implement target midpoint plus RIR expected-failure signal.
- [ ] Use recent comparable history rather than one-set reactions.
- [ ] Require a user-selected starting load until comparable exercise history is sufficient.
- [ ] Implement load/reps hold, increase, reduce and range-expand actions.
- [ ] Implement equipment-aware rounding and warning states.
- [ ] Store bar/plate inclusion and pin-loaded start/end/increment constraints.
- [ ] Implement weight-match preference as a configurable policy.
- [ ] Keep missing RIR as lower certainty, not as a perfect value.
- [ ] Apply inherited +2.5% progression only as a bounded policy.
- [ ] Apply inherited −5% reactive reduction only after repeated comparable deterioration.
- [ ] Do not escalate load when pain/medical review is active.
- [ ] Keep set-specific RIR targets and do not flag later-set rep reductions as automatic underperformance.
- [ ] Add transactional previews for bulk edits that cascade across RIR, sets and rep bounds.

**Exit criteria:** every progression has a reason; no impossible increment is generated; a poor single set cannot collapse the program.

## Phase 3 — RP-style muscle volume controller

- [ ] Represent MV/MEV/MAV/MRV as priors with source and confidence.
- [ ] Implement Maintain/Grow/Emphasize priority per muscle.
- [ ] Capture pump, soreness resolution, workload and performance separately.
- [ ] Add sets only when priority, stimulus and recovery predicates permit.
- [ ] Hold or reduce volume when repeated poor recovery/performance appears.
- [ ] Keep direct sets and indirect exposure separate.
- [ ] Prevent one muscle’s volume increase from exhausting the global recovery budget.
- [ ] Require honest user feedback while preserving a missing-data state.
- [ ] Store direct, indirect and optional fractional volume projections separately.

**Exit criteria:** the engine can explain why a set was added, held or removed without saying it has measured a universal MRV.

## Phase 4 — strength/hypertrophy/hybrid modes

- [ ] Implement `strength`, `hypertrophy` and `hybrid` priorities.
- [ ] Tag primary strength lifts, secondary compounds and accessories.
- [ ] Protect key-lift specificity and technical quality in strength mode.
- [ ] Use wider rep ranges and local volume progression for hypertrophy mode.
- [ ] Use key-lift progression plus RP accessory volume in hybrid mode.
- [ ] Track lift-specific e1RM/rep PR trends separately from muscle volume.
- [ ] Keep non-equivalent exercise variations in separate strength series unless a validated transfer model is explicitly enabled.
- [ ] Do not call RP Hypertrophy a maximal-strength optimiser.
- [ ] Keep straight sets as the default foundation; require explicit enablement for myo/drop/partial techniques on primary strength lifts.

**Exit criteria:** changing priority changes the controller and metrics, not merely the label on the same program.

## Phase 5 — mesocycle, periodization and deload

- [ ] Implement cycle length as a user/program policy, not a universal fixed interval.
- [ ] Support RIR/reps/sets periodization across cycles.
- [ ] Support no/first/last scheduled deload and adaptive early review.
- [ ] Make deload set/load/rep/RIR changes visible and versioned.
- [ ] Preserve primary movement pattern during deload when appropriate for skill.
- [ ] Create a new cycle snapshot; do not rewrite historical cycles.
- [ ] Support public execution defaults as configurable starting values: approximately 180 seconds for lower-body compounds, 90 seconds for upper-body isolation, and warm-up examples around 40/60/80% × 3.

**Exit criteria:** deloads are reversible, explainable and not triggered by an arbitrary single failure.

## Phase 6 — whole-athlete integration

- [ ] Keep training and nutrition controllers separate.
- [ ] Accept explicit nutrition constraints such as low-energy-availability review or aggressive-deficit block.
- [ ] Do not silently create nutrition targets from training load.
- [ ] Do not silently alter completed training results from nutrition changes.
- [ ] Keep pain, illness, sleep, stress and recovery flags separate.
- [ ] Implement priority-ordered safety states: emergency stop, training pause, clinician review, re-entry, hold progression, caution, normal, insufficient data.
- [ ] Require a reason for every training gap; do not clear illness/injury return by elapsed days alone.
- [ ] Add structured health events for cardiopulmonary, systemic illness, neurological, heat, energy-availability and mental-health pathways.
- [ ] Connect the coach explanation to deterministic engine outputs.

**Exit criteria:** the engine can coordinate constraints without creating hidden cross-domain prescriptions.

## Phase 7 — testing and validation

- [ ] Parse and run all JSON test vectors in CI.
- [ ] Add property tests for session-only versus program updates.
- [ ] Replay steady progress, poor performance, missed sessions, RIR drift, equipment jumps, deloads and pain.
- [ ] Validate load/reps/RIR recommendation accuracy.
- [ ] Calibrate RIR separately by exercise family and rep band.
- [ ] Calculate exercise-specific SEM/MDC95, agreement and proportional-bias metrics where test data supports them.
- [ ] Validate key-lift strength outcomes.
- [ ] Validate RIR calibration and confidence bands against repeated performance, not a single reported RIR.
- [ ] Validate hypertrophy-volume outcomes where measurements are credible.
- [ ] Measure completion, manual overrides and adherence.
- [ ] Measure recommendation calibration, override outcomes, abstention coverage, volatility and subgroup error/safety metrics.
- [ ] Add immutable decision-trace replay, duplicate/out-of-order event tests and compensating-event behavior.
- [ ] Report bias, MAE, limits of agreement, confidence calibration and update volatility.
- [ ] Validate across training age, sex, equipment, schedule and nutrition phase.

**Release gate:** no aggressive automatic progression mode until pain handling, data quality, deload review and prospective validation are complete.
