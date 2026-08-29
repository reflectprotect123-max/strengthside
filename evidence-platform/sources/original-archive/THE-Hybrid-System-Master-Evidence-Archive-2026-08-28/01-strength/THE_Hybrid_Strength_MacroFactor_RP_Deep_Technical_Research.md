# THE Hybrid Engine — deep technical research: MacroFactor Workouts + RP Hypertrophy

**Research date:** 25 August 2026  
**Scope:** public product behaviour, proposed numerical architecture, evidence boundaries and unresolved algorithms.

## 1. The correct synthesis

The two products solve related but different problems:

| System | Primary loop | Main feedback | What it does not prove |
|---|---|---|---|
| MacroFactor Workouts | exercise-level progression | load, reps, target/actual RIR, exercise history, equipment | exact load algorithm or optimal muscle volume |
| RP Hypertrophy | muscle-level volume progression | pump, soreness, workload, performance, emphasis | universal MEV/MAV/MRV values or maximal-strength optimisation |
| THE Hybrid Engine | goal-specific controller | both loops plus pain, schedule, nutrition and recovery constraints | that product heuristics are scientifically validated for every user |

The implementation should not average the two algorithms. It should let each operate at the level where its public evidence is strongest, then add a deterministic arbitration layer.

## 2. MacroFactor Workouts: recovered public behaviour

### 2.1 Program generator

Public inputs include goal, experience, training days/session duration, equipment, exclusions, split and emphasis. Generated output includes exercise selection, sets, reps and program structure. Logged sets subsequently improve recommendations. This is a program prior plus a performance-feedback loop, not a black-box “AI knows the perfect routine” claim.

### 2.2 Program immutability and recommendation updates

Once created, a program’s structure stays fixed until the user edits or replaces it. Exercise-level targets can update after a workout. This distinction should be represented as two versioned objects:

```text
program_structure_version -> exercise order, split, cycles, planned sets/reps/RIR
recommendation_version     -> next load/reps/sets for a specific exercise exposure
```

This avoids a common data bug: overwriting the plan to make it look as if the athlete completed the recommendation.

### 2.3 Public progression logic

MacroFactor’s public explanation supports an `effective failure-reps` concept:

```text
expected failure reps = midpoint(target rep range) + target RIR
observed failure reps = completed reps + actual RIR
```

For target 7–9 at 2 RIR, expected failure performance is about 10 reps. Public guidance also says failure-set progress can be inferred when the athlete exceeds prior performance. The actual implementation is likely more complex because the app also uses exercise history, equipment, rep-range constraints and set context.

### 2.4 Constraint solver

The Smart Progression UI exposes three distinct behaviours:

1. **normal recommendation:** candidate load/reps fit the target;
2. **range expansion/weight match:** equipment jumps make the normal solution inefficient;
3. **warning/fix:** the target cannot be satisfied with available increments, range or RIR.

THE should never hide case 3 by silently recommending an impossible load. The UI needs a reason such as `equipment_increment_too_large`, `rep_range_conflict`, or `insufficient_history`.

### 2.5 Actual versus target RIR

RIR is an observation with measurement error. A useful state model stores:

```text
targetRir
actualRir
rirConfidence
rirCalibrationHistory
```

Repeated “2 RIR” estimates that produce substantially different performance should lower RIR confidence or request an anchor set; they should not force the controller to believe the subjective label is perfect.

## 3. RP Hypertrophy: recovered public behaviour

### 3.1 Volume landmarks are adaptive landmarks

MV, MEV, MAV and MRV are useful control concepts:

```text
below MEV -> possibly maintenance or insufficient stimulus
MEV to MAV -> productive growth zone for a given athlete and phase
near MRV -> high fatigue and diminishing practical returns
above MRV -> recovery/performance failure risk
```

But the numerical value is muscle-specific and personal. RP’s own guides vary numbers by muscle, frequency, exercise selection, training status and systemic fatigue. Store the landmark as a prior plus a personal posterior, not as a universal table.

### 3.2 Set-feedback system

RP publicly describes continuous set adjustments using pump, soreness, workload and performance. This is a latent recovery/stimulus controller. It is not a single scalar called “muscle readiness.” Keep the dimensions separate so a good pump does not cancel persistent soreness or pain.

Recommended input object:

```ts
MuscleFeedback {
  pump: 0 | 1 | 2 | null;
  soreness: "none" | "resolved" | "late" | "persistent" | null;
  workload: "easy" | "manageable" | "limit" | "overwhelming" | null;
  performance: "above" | "on_target" | "below" | null;
  recoveryConfidence: "low" | "medium" | "high";
}
```

### 3.3 Emphasis levels are resource allocation

Emphasize/Grow/Maintain should control how willing the engine is to spend recovery resources on a muscle. They should not alter the athlete’s effort requirement for every exercise or make all sessions harder.

### 3.4 Deload design

RP’s default final-cycle deload and MacroFactor’s configurable first/last-cycle deload are product choices. The literature supports fatigue management as a real programming concern, but it does not establish one universal deload interval or exact reduction formula. Therefore:

```text
scheduled deload = user/program policy
early deload = evidence from performance + recovery + symptoms
deload magnitude = explicit policy, tested by replay and prospective outcomes
```

## 4. Strength versus hypertrophy: the non-negotiable split

### 4.1 Why RP Hypertrophy alone is not enough

RP explicitly says strength is a secondary outcome in its Hypertrophy App. In the research, high-load training produced greater 1RM strength gains while hypertrophy could be similar across a wider load range when effort and volume were sufficient. [Low/high-load meta-analysis](https://pubmed.ncbi.nlm.nih.gov/28834797/)

Therefore a strength-priority mode needs:

- repeated exposure to the target lift or a tightly defined variation;
- heavier, technically consistent work;
- a separate performance metric such as e1RM, rep PR or test-lift result;
- fatigue management that protects high-quality practice;
- hypertrophy volume that supports rather than obscures the performance goal.

### 4.2 Failure is not the same for both goals

The 2024 proximity-to-failure meta-regression found a stronger relationship between closer-to-failure sets and hypertrophy than strength, although its RIR estimates were indirect and the authors caution against overinterpreting the exact slope. [PubMed 38970765](https://pubmed.ncbi.nlm.nih.gov/38970765/)

The 2023 hypertrophy meta-analysis found no clear advantage for momentary failure over non-failure, and a 2024 trained-participant study found similar quadriceps hypertrophy at 1–2 RIR versus failure with more acute fatigue in failure conditions. [PubMed 36334240](https://pubmed.ncbi.nlm.nih.gov/36334240/) · [PubMed 38393985](https://pubmed.ncbi.nlm.nih.gov/38393985/)

Implementation consequence:

```text
strength main lift -> usually stop short of failure; protect technique
hypertrophy accessory -> closer RIR can be used when safe and recoverable
failure -> an optional set type, not a universal progress requirement
```

### 4.3 Periodization has different expected payoffs

When volume is equated, a 2022 meta-analysis found periodized resistance training favoured 1RM strength over non-periodized training, while hypertrophy did not differ clearly. That supports giving strength mode a more explicit intensity/skill structure while allowing hypertrophy mode to focus on volume and local stimulus. [PubMed 35044672](https://pubmed.ncbi.nlm.nih.gov/35044672/)

## 5. Proposed arbitration layer

The controller should score competing requests in this order:

1. pain/medical constraint;
2. safety and recovery block;
3. exercise/equipment validity;
4. target RIR and technical quality;
5. strength-priority performance;
6. hypertrophy volume priority;
7. optional progression ambition.

Example:

```text
if pain_or_medical_review:
    stop automatic escalation and route for review
elif repeated_underperformance and recovery_is_poor:
    hold_or_reduce; do not add volume
elif strength_priority and key_lift_quality_is_good:
    progress key-lift load/reps conservatively
elif muscle_priority and stimulus_is_low and recovery_is_good:
    add one set according to policy
else:
    hold and gather more data
```

This is safer than allowing MacroFactor-style per-exercise progression and RP-style per-muscle volume progression to both increase training simultaneously without a shared fatigue budget.

## 6. Load, rep and set mathematics

### 6.1 Publicly anchored performance signal

```text
expectedFailureReps = (repMin + repMax) / 2 + targetRir
observedFailureReps = completedReps + reliableActualRir
signal = observedFailureReps - expectedFailureReps
```

Use a history-weighted signal rather than a single set:

```text
aggregateSignal = weightedMedian(recentComparableSignals)
```

The weighted median is a Hybrid implementation choice, not recovered MacroFactor code.

### 6.2 Load step

The existing Hybrid decision uses a default progression target around 2.5% of the last stable opening load, with equipment rounding and a rep/RPE fallback. Keep it as a policy, not a law:

```text
candidateLoad = stableOpeningLoad × (1 + 0.025)
roundedLoad = nearestAllowedIncrement(candidateLoad, equipmentProfile)
```

If the rounded increment is too large for the target range, preserve the load and add a rep or expand the range if allowed.

### 6.3 Reactive reduction

The inherited Hybrid default is approximately 5% after repeated comparable deterioration:

```text
if repeatedComparableUnderperformance and no pain:
    candidateLoad = stableOpeningLoad × 0.95
```

The trigger, window and cap must be versioned and validated. It is not a MacroFactor or RP formula.

### 6.4 e1RM analytics

An optional analytics estimate can use:

```text
e1RM_Epley = load × (1 + reps / 30)
```

Restrictions:

- use only technically valid working sets;
- flag high-rep estimates as noisy;
- do not compare different exercises as the same strength;
- do not use e1RM alone to increase training load;
- store formula and confidence.

## 7. Volume mathematics

The system should calculate direct working sets by muscle and retain indirect exposure separately:

```text
weeklyDirectSets[muscle] = sum(workingSets where muscle is prime mover)
```

Do not force a universal “half set” multiplier for all indirect work. A press, flye and overhead extension create different local and systemic costs; a fractional-set policy may be tested later but must be explicit.

A volume action is a policy decision, not a formula with a universally correct answer:

```text
add_set only when:
  priority is grow/emphasize
  and performance is on target or above
  and soreness is resolved on time
  and workload is not overwhelming
  and no pain/safety block exists
```

## 8. Data-quality and state machine

### 8.1 Observation confidence

Confidence should decrease when:

- RIR is missing or inconsistent;
- the exercise was swapped;
- load units/equipment are uncertain;
- technique or range of motion changed;
- the set was partial/drop/myo/failure and no comparison policy exists;
- sleep, illness or pain likely altered performance;
- the session was incomplete.

### 8.2 State transitions

```text
insufficient_data -> calibration -> normal
normal -> caution after one meaningful anomaly
caution -> normal after repeatable recovery
caution -> hold_progression after repeated underperformance
hold_progression -> deload_review when decline is broad/persistent
any state -> pain_or_medical_review when pain/symptom rule fires
```

Do not make a single low-rep set trigger a deload. Do not let a pump score override a pain flag.

## 9. Review of product and research gaps

| Gap | Why it matters | Honest treatment |
|---|---|---|
| MacroFactor load estimator is partially disclosed but exact history weighting/solver is not public | exact clone impossible | implement public signal plus versioned bounded solver |
| RP publishes a concrete volume-progression framework, but current-app coefficients/rule base are not fully specified | exact current-app clone impossible | preserve the public framework as an anchor; use explicit priors and personal feedback; calibrate |
| RIR subjective | labels are noisy | retain uncertainty and history |
| Deload evidence mixed | fixed interval may be wrong | schedule + adaptive review |
| Indirect sets ambiguous | false volume precision | store direct and indirect separately |
| Strength outcome exercise-specific | e1RM not universal | track lift-specific trends |
| Pain confounded with fatigue | unsafe load escalation | separate safety state |
| Nutrition/training interaction | energy deficit affects recovery | explicit shared constraints, no silent prescription |

## 10. Technical source register

### MacroFactor

- [Workout collection](https://help.macrofactorapp.com/en/collections/20-macrofactor-workouts)
- [Smart Generation inputs](https://help.macrofactorapp.com/en/articles/370-what-information-does-macrofactor-workouts-use-to-generate-your-program)
- [Smart Progression](https://help.macrofactorapp.com/en/articles/305-understanding-and-using-smart-progressions)
- [Progressive overload](https://help.macrofactorapp.com/en/articles/372-what-does-progressive-overload-mean-in-macrofactor-workouts)
- [RIR](https://help.macrofactorapp.com/en/articles/385-what-is-rir-and-how-should-i-use-it-during-training)
- [Terms of Service](https://macrofactor.com/terms/)

### RP transparency

- [Progression algorithm](https://help.rpstrength.com/hc/en-us/articles/32600173777815-How-does-the-app-determine-when-to-add-weight-reps-and-sets)
- [Expert-system description](https://help.rpstrength.com/hc/en-us/articles/32434237175447-Shouldn-t-I-be-doing-more-sets-or-weight)
- [Volume landmarks and weekly set-progression algorithm](https://rpstrength.com/blogs/articles/training-volume-landmarks-muscle-growth)
- [Historical RP patent application — US20170352289A1, abandoned](https://patents.google.com/patent/US20170352289A1/en)
- [Program update timing](https://help.macrofactorapp.com/en/articles/369-how-often-does-my-program-update)
- [Periodization](https://help.macrofactorapp.com/en/articles/389-how-can-i-customize-periodization-rir-reps-and-sets-for-the-exercises-in-my-program)
- [Deload settings](https://help.macrofactorapp.com/en/articles/297-deload-first-cycle-or-last-cycle)

### RP

- [App scope](https://help.rpstrength.com/hc/en-us/articles/33510008280087-Who-is-the-RP-Hypertrophy-App-for)
- [Set/weight progression](https://help.rpstrength.com/hc/en-us/articles/32600173777815-How-does-the-app-determine-when-to-add-weight-reps-and-sets)
- [RIR](https://help.rpstrength.com/hc/en-us/articles/31147466880791-What-does-RIR-mean)
- [Automatic deloads](https://help.rpstrength.com/hc/en-us/articles/33510413024279-Does-the-app-automatically-place-deloads)
- [Volume landmarks](https://rpstrength.com/blogs/articles/training-volume-landmarks-muscle-growth)

### PubMed

- [Low/high load meta-analysis — PMID 28834797](https://pubmed.ncbi.nlm.nih.gov/28834797/)
- [Load effects meta-analysis — PMID 33433148](https://pubmed.ncbi.nlm.nih.gov/33433148/)
- [Failure/non-failure meta-analysis — PMID 33497853](https://pubmed.ncbi.nlm.nih.gov/33497853/)
- [Proximity-to-failure meta-analysis — PMID 36334240](https://pubmed.ncbi.nlm.nih.gov/36334240/)
- [Proximity-to-failure meta-regression — PMID 38970765](https://pubmed.ncbi.nlm.nih.gov/38970765/)
- [Periodization meta-analysis — PMID 35044672](https://pubmed.ncbi.nlm.nih.gov/35044672/)
- [RPE-based loading — PMID 29628895](https://pubmed.ncbi.nlm.nih.gov/29628895/)
- [RIR scale — PMID 26049792](https://pubmed.ncbi.nlm.nih.gov/26049792/)
- [Strength frequency meta-analysis — PMID 29470825](https://pubmed.ncbi.nlm.nih.gov/29470825/)
- [Hypertrophy frequency meta-analysis — PMID 27102172](https://pubmed.ncbi.nlm.nih.gov/27102172/)

## Agent deep-pass addendum — implementation gaps worth making explicit

### MacroFactor details the controller should model

The public product surface is more constrained than a generic workout generator. The setup contract includes goal, experience, schedule, session duration, equipment profile, exclusions, structure, muscle emphasis and deload preference. A custom program defaults to 7 cycles, supports 1–52 cycles, and supports up to 14 unique training days per cycle. This means the data model needs both a repeating `CycleTemplate` and a dated `SessionInstance`; a calendar date must never be used as the identity of the program structure.

The generator also has a real cold-start boundary: initial loads are user-selected until exercise history exists. The first recommendation should therefore be a calibrated setup flow, not a fabricated exact load. After logging begins, the progression controller can use comparable load/reps/RIR history, target expectations, rep-range expansion and equipment rounding.

Equipment constraints deserve their own subsystem. Barbell targets include the bar; pin-loaded machines have start/end/increment ranges; plate and machine rounding can make a nominal percentage increase impossible. A recommendation should expose the candidate load, rounded load, available increment, and fallback action (hold load, add reps, change equipment or ask for a swap). Warning severity should be stored as a reason code, not rendered as unexplained UI colour.

Warm-ups and rest are execution inputs, not working-set stimulus. MacroFactor's public warm-up example scales approximately 40/60/80% of working load for 3 reps, while exact defaults are not public. Public rest defaults are approximately 180 seconds for lower-body compounds and 90 seconds for upper-body isolation. Store these as configurable starting values and let readiness/performance override them.

The dashboard/export surface also changes the implementation boundary. Exercise-specific records, weekly muscle-set summaries, volume/reps, estimated-strength trends and exportable workout history should be reproducible from the event log. The app's exact e1RM equation, muscle-set weighting, exercise ranking and fatigue score remain unresolved; analytics must not be mistaken for prescription truth.

### Agent evidence synthesis

The new PubMed pass adds four design constraints. First, strength transfer is smaller when the test exercise is not the trained exercise, so the engine must keep lift-specific series rather than collapsing all presses or squats into a single strength score ([PMID 36396899](https://pubmed.ncbi.nlm.nih.gov/36396899/)). Second, more weekly set volume is associated with more strength and hypertrophy with diminishing returns, but the meta-regression is not an individual dose calculator ([PMID 41343037](https://pubmed.ncbi.nlm.nih.gov/41343037/)). Third, frequency is primarily a distribution/practice variable once volume is equated for strength; hypertrophy evidence supports roughly two exposures more clearly than one, but not an automatic three-times rule ([PMID 29470825](https://pubmed.ncbi.nlm.nih.gov/29470825/) · [PMID 27102172](https://pubmed.ncbi.nlm.nih.gov/27102172/)). Fourth, RIR autoregulation can outperform fixed percentage loading in a trained squatting sample, but RIR accuracy is imperfect, so confidence and error bands are required ([PMID 31009432](https://pubmed.ncbi.nlm.nih.gov/31009432/) · [PMID 36135029](https://pubmed.ncbi.nlm.nih.gov/36135029/)).

Deloading should be implemented as a policy-plus-evidence state. A survey of competitive strength and physique athletes found a common practice of roughly six days every five to six weeks, reducing volume, load and effort while usually retaining exercise selection and frequency; this describes practice, not proof of a universal optimum ([PMID 38499934](https://pubmed.ncbi.nlm.nih.gov/38499934/)). The engine should therefore support a scheduled deload, an early evidence-triggered deload and a user override, with all three auditable.

## Second deep-pass addendum — controller extensions

### Volume ledger

Use one raw event ledger and multiple projections:

```text
raw exposure
  -> direct prime-mover sets
  -> indirect sets by secondary mover
  -> optional fractional projection: direct + 0.5 × indirect
  -> total exposure projection: direct + indirect
```

The 0.5 value is a transparent policy inspired by the strongest relative evidence in the 2026 volume meta-analysis, not a biological constant. It belongs in the formula registry and every recommendation must state which projection it used. This avoids the current two common errors: counting every compound set fully for every muscle, or pretending indirect work does not exist.

### Concurrent-training state

Add `enduranceLoadContext` to the weekly state:

```json
{
  "modality": "run|cycle|steady_state|HIIT|sport|unknown",
  "durationMinutes": 0,
  "intensityProxy": {"type": "RPE|HR_zone|pace|power", "value": null},
  "sameSessionOrder": "resistance_first|endurance_first|separate|unknown",
  "separationHours": null,
  "lowerBodyDemand": "low|moderate|high|unknown"
}
```

State transitions should be conservative:

```text
if strengthPriority && lowerBodyDemandHigh && persistentPerformanceDecline
  -> hold lower-body volume escalation
  -> prefer resistance-first scheduling when feasible
  -> request review of endurance dose/recovery
else
  -> continue and learn from lift-specific performance
```

This is deliberately not a cardio ban. Meta-analytic results differ by sex, modality, duration and outcome; whole-muscle hypertrophy is not uniformly impaired, while lower-body strength can be more sensitive. A single concurrent session must not trigger a penalty.

### Velocity-loss measurement boundary

When a validated device is present, store `velocityLossPercent`, device identity, measurement quality and the set's load/reps/RIR. Use velocity loss as an additional signal:

- strength-priority work: consider ending or modifying a set when loss exceeds the configured low-to-moderate threshold, commonly around 25%;
- hypertrophy-priority work: allow a higher threshold when the intended trade-off is more local fatigue and relative volume;
- no device: leave velocity missing and do not impute it from rep count.

The literature is not internally identical: one meta-analysis favours ≤25% for 1RM strength and >20–25% for hypertrophy, while another review found the chronic strength effect less stable. The product rule must therefore remain a feature-flagged policy and be validated with the athlete's own data.

### Safety state machine

Add a non-diagnostic state independent of normal fatigue:

```text
normal
  -> fueling_safety_review when a persistent constellation appears
fueling_safety_review
  -> hold/reduce automatic escalation and request professional review
  -> normal only after the signals resolve and the athlete confirms readiness
blocked_review
  -> no autonomous training escalation
```

Inputs may include rapid weight trend, intentional restriction, persistent performance decline, repeated illness/injury, low mood, sleep disruption or other user-reported symptoms. None is diagnostic alone. The IOC consensus explicitly warns against treating one energy-availability cutoff as clinical clearance and emphasises differential diagnosis.

### Response validation

For an outcome `y`, store:

```text
change = post − pre
typicalError = measurement-specific estimate
MDC = chosen confidence multiplier × typicalError
responseStatus = unknown | probable_change | probable_no_change | review
```

Do not use a universal MDC. It must be tied to the exercise, device, measurement method and protocol. For body measurements, photos and circumference, the default status should stay uncertain more often than for standardised 1RM testing.

## Third product pass — lifecycle, exercise and RP semantics

### Program lifecycle events

Model these as separate events rather than mutating one program record:

```text
repeat_block
complete_program
activate_program
backfill_manual_workout
skip_exercise_for_cycle
skip_workout
unskip_workout
edit_logged_set
delete_logged_set
commit_session_edit
commit_program_edit
```

Repeating a completed block preserves the old block and creates a new reference. Completing/importing a new program changes the active pointer but retains all histories. Backfill must be manual and provenance-labelled because automatic competitor-app history migration is not publicly supported.

### Transactional program edits

Some MacroFactor bulk edits cascade across fields. A change to RIR can affect sets and rep bounds; a change to sets can affect rep bounds and RIR. The implementation should calculate a proposed diff first:

```json
{
  "editId": "...",
  "scope": "cycle|all_cycles|session",
  "affectedFields": ["targetRir", "sets", "repMin", "repMax"],
  "oldValues": {},
  "newValues": {},
  "recommendationImpact": "...",
  "requiresUserCommit": true
}
```

The user can accept, decline or modify it. Historical observations are never rewritten by a program edit.

### Set-specific effort and correction

Do not force a constant RIR target across a workout. A program may intentionally use different target RIRs across sets, and later-set rep reductions can be normal fatigue at the same RIR. If the user edits RIR after completing a set, preserve both the original and corrected values and emit a recalculation event. The engine should learn from the corrected observation without hiding the original audit trail.

### Exercise and load semantics

An exercise is not just a name. Minimum metadata:

```json
{
  "exerciseId": "...",
  "metricType": "load_reps|time|distance|assistance|bodyweight",
  "category": "compound|isolation",
  "laterality": "bilateral|unilateral|alternating",
  "primaryMuscles": [],
  "secondaryMuscles": [],
  "equipment": [],
  "loadSemantics": "bar_included|per_dumbbell|bodyweight|added_load|machine_stack|assistance",
  "rom": "full|partial_lengthened|partial_shortened|unknown",
  "stability": "stable|unstable|unknown",
  "movementPattern": "...",
  "recommendationExcluded": false
}
```

Swapping an exercise starts a new progression series for the replacement. Preserve a related-movement link for substitution context, but do not merge performance curves for barbell bench, dumbbell bench and machine press. Per-exercise settings such as rest between sides, notes and “do not recommend” are separate from gym-level eligibility.

### Warm-up and superset hierarchy

Warm-up schemes should resolve from global default to exercise override to cycle/program override to session override. A session change is not automatically a saved scheme change. Supersets should be represented as grouped rounds with one rest event after the round; simply putting exercises next to each other is a different RP-style manual adjacency mode.

### RP-specific resource arbitration

RP’s public guidance implies that training age should influence mesocycle length, that time limitations should be recorded separately from recovery capacity, and that sport volume consumes recovery budget. It also treats straight sets as the foundation, with myo-reps, drop sets and partials used sparingly and mainly on stable low-skill accessory work. The Hybrid controller should therefore make technique selection an explicit role policy, not let an optimiser introduce intensity techniques into primary strength lifts because they increase local stimulus.

### Official product source register for this pass

- [Program end and repeat/complete paths](https://help.macrofactorapp.com/en/articles/396-what-happens-when-your-program-ends)
- [Manual workout backfill](https://help.macrofactorapp.com/en/articles/384-can-i-backfill-past-workouts-to-have-training-history)
- [Active program switching](https://help.macrofactorapp.com/en/articles/289-set-or-swap-active-programs)
- [Custom/altered program Smart Progression](https://help.macrofactorapp.com/en/articles/387-will-smart-progression-work-with-altered-or-customized-programs)
- [RIR program edits](https://help.macrofactorapp.com/en/articles/293-setting-rir-for-exercises-in-a-program)
- [Set program edits](https://help.macrofactorapp.com/en/articles/295-change-sets-for-exercises-in-a-program)
- [Post-set RIR correction](https://help.macrofactorapp.com/en/articles/314-changing-rir-during-an-active-workout)
- [RIR across sets](https://help.macrofactorapp.com/en/articles/397-is-it-normal-to-see-failure-sets-or-rir-decreasing-across-sets)
- [Warm-up overrides](https://help.macrofactorapp.com/en/articles/304-remove-or-add-smart-warm-ups)
- [Custom exercise metadata](https://help.macrofactorapp.com/en/articles/328-how-to-create-a-custom-exercise)
- [Exercise settings](https://help.macrofactorapp.com/en/articles/329-editing-the-settings-of-an-exercise)
- [Exercise substitution](https://help.macrofactorapp.com/en/articles/375-what-should-i-do-if-i-cannot-perform-an-exercise-or-do-not-have-the-required-equipment)
- [Skip exercise/workout](https://help.macrofactorapp.com/en/articles/399-how-to-skip-an-exercise-without-removing-it-from-your-program)
- [Superset behavior](https://help.macrofactorapp.com/en/articles/321-supersetting-exercises)
- [MacroFactor release notes](https://macrofactor.com/wo-version-1-1-0/) · [1.1.8](https://macrofactor.com/wo-version-1-1-8/) · [1.2.0](https://macrofactor.com/versions-1-2-0/)
- [RP mesocycle length](https://help.rpstrength.com/hc/en-us/articles/30976017295383-How-many-weeks-should-my-mesocycle-be)
- [RP long-workout feedback](https://help.rpstrength.com/hc/en-us/articles/32600133107863-Why-is-the-RP-app-giving-me-so-many-sets-Long-Workouts)
- [RP load-box semantics](https://help.rpstrength.com/hc/en-us/articles/30801977895063-What-to-put-in-the-load-box)
- [RP asynchronous splits](https://help.rpstrength.com/hc/en-us/articles/30977019952663-How-can-I-create-an-asynchronous-split)
- [RP sport training](https://help.rpstrength.com/hc/en-us/articles/30804097539095-How-should-I-incorporate-hypertrophy-training-into-sport-training)
- [RP intensity techniques](https://rpstrength.com/blogs/articles/intensity-techniques-for-maximum-mass)
