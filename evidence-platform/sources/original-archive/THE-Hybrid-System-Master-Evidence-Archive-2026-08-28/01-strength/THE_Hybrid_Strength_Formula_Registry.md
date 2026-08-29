# THE Hybrid Engine — strength formula and policy registry

**Registry version:** `1.2.0`
**Research date:** 25 August 2026

This registry distinguishes public product anchors from explicit Hybrid policies. Product algorithms remain private unless documented below.

## Source classes

- `PRODUCT` — publicly documented MacroFactor Workouts or RP behaviour.
- `SCIENCE` — peer-reviewed resistance-training evidence.
- `HYBRID_POLICY` — inherited or proposed THE Hybrid rule.
- `UNKNOWN` — not safely recoverable.
- `PUBLIC_BEHAVIOUR_ANCHOR` — public product behaviour reproducible at the stated level, without claiming hidden implementation identity.

## Numerical formulas

| Formula ID | Definition | Units | Class | Use and limits |
|---|---|---|---|---|
| `rir.expectedFailure.v1` | `(repMin + repMax) ÷ 2 + targetRir` | reps | `PRODUCT` anchor | Mirrors MacroFactor’s public 7–9 reps at 2 RIR example. Exact production history weighting is unknown. |
| `rir.observedFailure.v1` | `completedReps + reliableActualRir` | reps | `HYBRID_POLICY` | Only compute when actual RIR is present and reliable. |
| `progression.signal.v1` | `observedFailureReps − expectedFailureReps` | reps | `HYBRID_POLICY` | Positive means above target; use history, not one set alone. |
| `load.progressionDefault.v1` | `stableOpeningLoad × 1.025` | load units | `HYBRID_POLICY` | Existing Hybrid default; round to available equipment. Not MacroFactor/RP source code. |
| `load.reactiveReduction.v1` | `stableOpeningLoad × 0.95` | load units | `HYBRID_POLICY` | Existing Hybrid default after repeated comparable deterioration. Not triggered by one poor set or pain diagnosis. |
| `load.roundEquipment.v1` | `nearestAllowedIncrement(candidateLoad, equipmentProfile)` | load units | `HYBRID_POLICY` | Must preserve machine/barbell/dumbbell constraints and unit. |
| `e1rm.epley.v1` | `load × (1 + reps ÷ 30)` | load units | `HYBRID_POLICY` | Analytics only; exercise- and rep-range-specific, not a sole prescription input. |
| `volume.directSets.v1` | `Σ working sets where muscle is prime mover` | sets/week | `PRODUCT`/`SCIENCE` convention | Keep indirect exposure separately; do not silently apply a universal fractional-set multiplier. |
| `weeklyFrequency.v1` | `count distinct exposures for muscle in microcycle` | exposures/week | `HYBRID_POLICY` | Used for distribution and recovery context; not a guarantee of better results. |
| `deload.weekLast.v1` | `cycleWeek = cycleLengthWeeks` | boolean | `PRODUCT` precedent | RP app default and a MacroFactor option; not universal physiology. |
| `deload.rirIncrease.v1` | `targetRir_deload > targetRir_accumulation` | RIR | `HYBRID_POLICY` | Exact increase is policy-controlled and tested, not recovered product code. |
| `volume.addSet.v1` | no single scalar equation | sets | `HYBRID_POLICY` | Requires priority, stimulus, recovery and performance predicates. |
| `volume.reduceSet.v1` | no single scalar equation | sets | `HYBRID_POLICY` | Requires repeated poor recovery/performance or deload state. |
| `cycle.bounds.v1` | `defaultCustomCycles = 7; allowedCycles = 1..52; maxUniqueTrainingDaysPerCycle = 14` | cycles/days | `PRODUCT` | Public MacroFactor program constraints; do not confuse cycle count with calendar duration. |
| `rest.default.v1` | `lowerBodyCompound = 180 seconds; upperBodyIsolation = 90 seconds` | seconds | `PRODUCT` anchor | Public defaults; readiness and performance can override. |
| `warmup.example.v1` | `workingLoad × [0.40, 0.60, 0.80] × 3 reps` | load/reps | `PRODUCT` example | Public example only; exact warm-up defaults are unknown and warm-ups are excluded from working-set totals. |
| `e1rm.analyticsBoundary.v1` | `displayed e1RM = product-specific estimator` | load units | `UNKNOWN` | MacroFactor exposes estimated-strength analytics, but its exact equation and weighting are not public. Keep this separate from `e1rm.epley.v1`. |
| `volume.fractionalIndirect.v1` | `directSets + 0.5 × indirectSets` | equivalent sets | `SCIENCE`/`HYBRID_POLICY` | Optional projection inspired by PMID 41343037; retain raw direct/indirect counts and allow policy replacement. |
| `response.mdc.v1` | `MDC = measurementSpecificMultiplier × typicalError` | outcome units | `SCIENCE`/`HYBRID_POLICY` | Do not use a universal multiplier or classify a non-response from one block. |
| `rir.calibration.v1` | `rirError = reportedRir − observedOrAnchorRir` | reps | `SCIENCE`/`HYBRID_POLICY` | Calibrate by exercise family and rep band; retain missingness and confidence. |
| `measurement.sem.v1` | `SEM = SD × sqrt(1 − ICC)` | outcome units | `SCIENCE` | Requires a standardised test-retest design; ICC alone is not enough. |
| `measurement.mdc95.v1` | `MDC95 = 1.96 × SEM × sqrt(2)` | outcome units | `SCIENCE` | Indicates change beyond estimated measurement error, not meaningfulness or causation. Exercise/device-specific. |

## Training-policy registry

| Policy ID | Rule | Class | Status |
|---|---|---|---|
| `priority.strength.v1` | Key-lift specificity and performance outrank accessory-volume progression. | `HYBRID_POLICY` | active prototype |
| `priority.hypertrophy.v1` | Per-muscle volume landmarks and recoverable effort outrank maximal-lift practice. | `PRODUCT`/`HYBRID_POLICY` | active prototype |
| `priority.hybrid.v1` | Key lifts get protected quality exposures; accessories use muscle-volume controller. | `HYBRID_POLICY` | active prototype |
| `rir.range.v1` | Store 0–6+ RIR; missing RIR lowers confidence. | `PRODUCT` | active |
| `strength.noRoutineFailure.v1` | Do not make failure the default on primary strength lifts. | `SCIENCE`/`HYBRID_POLICY` | active |
| `hypertrophy.nearFailureOptional.v1` | Accessories may approach failure when safe and recoverable. | `SCIENCE`/`HYBRID_POLICY` | active |
| `volume.emphasis.v1` | Maintain/Grow/Emphasize controls willingness to spend recovery resources. | `PRODUCT` | active |
| `volume.noUniversalMRV.v1` | MRV is a prior, not a universal number. | `SCIENCE` | active |
| `program.structureImmutable.v1` | Logged performance updates recommendations; program structure changes only through explicit edit/new snapshot. | `PRODUCT` | active |
| `edit.sessionOnlyDefault.v1` | Mid-session changes are temporary unless Update Program is accepted. | `PRODUCT` | active |
| `pain.separate.v1` | Pain/medical review is separate from fatigue and soreness. | `HYBRID_POLICY` | active |
| `warmup.excludeWorkingSets.v1` | Warm-up sets are stored but excluded from hypertrophy working-set totals by default. | `PRODUCT` precedent | active |
| `deload.noUniversalInterval.v1` | Support scheduled and evidence-triggered deloads; do not hard-code 4/5/6 weeks for everyone. | `SCIENCE`/`HYBRID_POLICY` | active |
| `coldStart.manualLoad.v1` | Require user-selected initial load until comparable exercise history is sufficient. | `PRODUCT` | active |
| `equipment.fallback.v1` | When an increment is infeasible, prefer hold-load/add-rep/range-expansion or an explicit swap over an impossible load. | `PRODUCT`/`HYBRID_POLICY` | active |
| `strength.exerciseSpecific.v1` | Track strength by exercise and variation; never merge non-equivalent lifts without an explicit transfer model. | `SCIENCE` | active |
| `rir.confidenceBand.v1` | Store RIR confidence and tolerate an error band when updating load. | `SCIENCE`/`HYBRID_POLICY` | active |
| `concurrent.context.v1` | Store cardio modality, duration, intensity proxy, order, separation and lower-body demand. | `SCIENCE`/`HYBRID_POLICY` | active |
| `concurrent.resistanceFirst.v1` | Prefer resistance before endurance when lower-body strength is the priority and sessions must be combined. | `SCIENCE`/`HYBRID_POLICY` | active |
| `velocityLoss.optional.v1` | Use measured velocity loss only when device quality is acceptable; never infer missing velocity from reps. | `SCIENCE`/`HYBRID_POLICY` | active |
| `safety.priority.v1` | `emergency_stop > training_pause > clinician_review > reentry_required > hold_progression > caution > normal > insufficient_data` with missing-data handling explicit. | `HYBRID_POLICY`/`SAFETY` | active prototype |
| `safety.noDiagnosis.v1` | Training logs may trigger review/referral language but cannot diagnose REDs, injury, overtraining or medical clearance. | `SAFETY` | active |
| `safety.returnCriteria.v1` | Illness/injury gaps require symptom/functional criteria and, where appropriate, clinician clearance; elapsed days alone cannot clear return. | `SAFETY` | active |
| `safety.noAcwrDanger.v1` | Do not convert acute:chronic workload ratios into universal injury-risk thresholds. | `SCIENCE`/`SAFETY` | active |
| `program.lifecycle.v1` | Repeat, complete, activate, skip, unskip, backfill and delete are immutable lifecycle events. | `PRODUCT`/`HYBRID_POLICY` | active |
| `edit.transactionalDiff.v1` | Bulk edits preview affected fields and require explicit commit; historical observations are not rewritten. | `PRODUCT`/`HYBRID_POLICY` | active |
| `rir.setSpecific.v1` | RIR targets may vary by set; later-set rep loss at constant RIR is not automatically underperformance. | `PRODUCT` | active |
| `warmup.hierarchy.v1` | Resolve global → exercise → cycle/program → session warm-up overrides. | `PRODUCT`/`HYBRID_POLICY` | active |
| `load.semantics.v1` | Interpret load as bar-included, per-dumbbell, bodyweight, added-load, machine-stack or assistance. | `PRODUCT`/`HYBRID_POLICY` | active |
| `swap.newSeries.v1` | Exercise substitutions start a new progression series and retain only an explicit related-movement link. | `PRODUCT`/`SCIENCE` | active |
| `technique.primaryLiftGuard.v1` | Straight sets are default; intensity techniques require explicit enablement on primary strength lifts. | `RP`/`HYBRID_POLICY` | active |
| `bfr.separateController.v1` | BFR/very-low-load sessions use separate RIR and load progression calibration. | `SCIENCE`/`HYBRID_POLICY` | active |
| `decision.traceImmutable.v1` | Every recommendation stores inputs, hashes, candidate actions, rejected reasons, selected output, versions and overrides. | `HYBRID_POLICY`/`SAFETY` | active |
| `transparency.layering.v1` | Separate documented product anchors from explicit Hybrid policies and unknown/private components; never label an approximation as recovered vendor code. | `HYBRID_POLICY` | active |
| `transparency.negativeSearch.v1` | Record public-search scope/date and phrase negative findings as “not found in reviewed public sources,” never as proof of non-existence. | `HYBRID_POLICY` | active |

## Goal-specific defaults

| Role | Rep policy | RIR policy | Use |
|---|---:|---:|---|
| `primary_strength` | 2–6 | 2–4 normally; 1–2 only in planned peak | specific strength/skill |
| `secondary_strength` | 4–10 | 1–3 | strength plus hypertrophy |
| `hypertrophy_compound` | 5–15 | 1–3 | muscle growth |
| `hypertrophy_isolation` | 8–30 | 0–3 if safe | muscle growth |

These are Hybrid defaults. They are supported by the distinction between strength-specific heavy loading and broad hypertrophy loading, but they are not copied verbatim from a private MacroFactor or RP lookup table.

## Versioning rules

- Never mutate a formula or policy version after it has produced user-visible output.
- Store formula ID, policy ID, inputs, output, source class, confidence, timestamp and reason codes.
- Keep all user overrides and declined updates as audit events.
- When a product source changes, create a new registry version and replay historical fixtures.
- A private/unknown rule may be approximated only when the approximation is explicit and feature-flagged.
