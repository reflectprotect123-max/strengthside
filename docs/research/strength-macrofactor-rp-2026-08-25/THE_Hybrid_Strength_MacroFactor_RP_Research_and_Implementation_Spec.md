# THE Hybrid Engine — MacroFactor Workouts + RP Hypertrophy strength specification

**Research date:** 25 August 2026  
**Purpose:** document MacroFactor Workouts, RP Hypertrophy and relevant resistance-training evidence, then translate the useful parts into a transparent strength/hypertrophy engine for `reflectprotect123-max/THE-HYBRID-ENGINE1`.

## 1. Executive conclusion

This should not be built as one undifferentiated “strength score.” It needs two linked but separate adaptation controllers:

```text
logged exercise performance + RIR + equipment constraints
        -> load/reps progression for each exercise

muscle volume + pump/soreness/recovery/performance feedback
        -> weekly set progression and deload decisions

goal priority + fatigue/pain/schedule constraints
        -> target program snapshot
```

MacroFactor Workouts is strongest as the first loop. It publicly documents a program generator, exercise logging, RIR-informed Smart Progression, equipment-aware load selection, rep-range expansion, weight matching, periodization and program-update controls. It updates future load/rep recommendations after logged workouts, while the program’s exercise selection and overall structure remain unchanged unless the user edits or replaces the program. [MacroFactor Smart Progressions](https://help.macrofactorapp.com/en/articles/305-understanding-and-using-smart-progressions) · [How often programs update](https://help.macrofactorapp.com/en/articles/369-how-often-does-my-program-update)

RP Hypertrophy is strongest as the second loop. It uses volume landmarks, muscle emphasis, RIR progression and subjective feedback about pump, soreness and workload to adjust sets across a mesocycle. RP explicitly says its Hypertrophy app is designed primarily to maximise muscle growth; strength is a secondary outcome. Therefore, a strength-priority Hybrid mode must add heavier skill-specific practice and strength outcome tracking instead of simply copying the RP hypertrophy prescription. [RP app scope](https://help.rpstrength.com/hc/en-us/articles/33510008280087-Who-is-the-RP-Hypertrophy-App-for) · [RP set/weight progression](https://help.rpstrength.com/hc/en-us/articles/32600173777815-How-does-the-app-determine-when-to-add-weight-reps-and-sets)

The safe design is:

```text
coach owns program targets and prescriptions
athlete owns actual load, reps, RIR, completion, notes, pain and symptoms
raw facts remain separate from derived state
recommendations are versioned snapshots, never mutations of history
```

## 2. Evidence classes

Every statement in this pack belongs to one of four classes:

- **Product fact:** directly documented by MacroFactor Workouts or RP.
- **Scientific evidence:** peer-reviewed research about resistance-training outcomes or measurement.
- **Hybrid design convention:** explicit rule chosen for THE Hybrid Engine where the products or literature do not disclose a complete algorithm.
- **Private/unknown:** a production algorithm or coefficient that cannot be recovered honestly.

MacroFactor and RP are product precedents, not independent validation of THE Hybrid Engine.

## 3. MacroFactor Workouts — public components

### 3.1 Program-generation inputs

MacroFactor Workouts says Smart Generation uses:

- primary goal, including strength or hypertrophy;
- training experience;
- schedule and session duration;
- available equipment/gym profile;
- exercise exclusions;
- split and areas of emphasis;
- generated exercise selection, set targets and rep targets;
- subsequent logged sets to improve recommendations over time.

It also supports custom and imported programs. [What information generates a program](https://help.macrofactorapp.com/en/articles/370-what-information-does-macrofactor-workouts-use-to-generate-your-program)

THE should retain the original answer, source, timestamp and confidence for each setup input. A program generated from an incomplete schedule or false equipment profile is not a valid failure of the progression algorithm.

### 3.2 Program structure versus recommendations

MacroFactor’s public behaviour is unusually important:

- after creation, exercise selection, weekly layout, sets and reps remain stable unless the user edits or creates a new program;
- logged training updates recommendations such as suggested load or reps;
- the next occurrence of an exercise can receive new targets immediately after the prior workout is completed;
- Smart Progression is not the same as changing the program structure or periodization.

This gives THE a clean separation:

```text
ProgramSnapshot = exercise selection + schedule + cycles + planned targets
ProgressionRecommendation = next load/reps/sets suggestion for an exercise
AthleteResult = what was actually completed
```

Do not rewrite historical program snapshots when a recommendation changes.

### 3.3 Exercise and equipment layer

MacroFactor Workouts publicly lists 900+ strength-training exercises, technique information, gym profiles, exercise swaps, exclusions, equipment settings and machine weight-stack ranges. Its progression warnings can arise when rep ranges, RIR targets or equipment increments make an optimal recommendation impossible. [MacroFactor Workouts](https://macrofactorapp.com/workouts/) · [Smart Progression constraints](https://help.macrofactorapp.com/en/articles/305-understanding-and-using-smart-progressions)

Hybrid rules:

- identify primary strength lifts, secondary compounds and hypertrophy accessories;
- preserve exercise identity and equipment constraints in the program contract;
- permit a session-only swap when equipment or pain prevents the planned movement;
- require an explicit program update before making a swap permanent;
- record movement pattern, prime movers, fatigue cost, stability, loading mode and substitution group;
- never treat two exercises as interchangeable merely because they share a muscle label.

### 3.4 RIR input

MacroFactor uses RIR from 0 through 6+, with 0–1 close to the limit and higher values easier. RIR is optional but strongly recommended because it helps the system interpret how hard a logged set was, not merely the load and reps. MacroFactor also acknowledges that it can take several sessions to learn an individual’s RIR estimates. [MacroFactor RIR](https://help.macrofactorapp.com/en/articles/385-what-is-rir-and-how-should-i-use-it-during-training)

THE stores both:

```ts
actualRir: 0 | 1 | 2 | 3 | 4 | 5 | 6 | "6_plus" | null
rirSource: "athlete" | "coach" | "inferred" | "missing"
rirConfidence: "low" | "medium" | "high"
```

Missing RIR should lower certainty, not be silently replaced by a perfect estimate.

### 3.5 Smart Progression logic that is public

MacroFactor says progression uses:

- logged weight and reps;
- RIR target and actual effort;
- comparison of logged performance with expected performance;
- accumulated history for that exercise.

For a set taken to failure, public guidance says that exceeding prior performance can trigger a load or rep increase. For a set with an RIR target, MacroFactor provides a public example: a 7–9 rep target at 2 RIR implies an expected failure performance around the midpoint, 8 reps, plus 2 RIR = 10 reps to failure. Exceeding that expectation indicates progress. [Progressive overload](https://help.macrofactorapp.com/en/articles/372-what-does-progressive-overload-mean-in-macrofactor-workouts)

Publicly documented does **not** mean fully reproducible. MacroFactor does not publish the exact load estimator, smoothing, history weighting, caps, set-to-set fatigue model or equipment-selection objective.

### 3.6 Load and rep adaptation

Smart Progression can:

- increase or lower load;
- increase or lower reps;
- expand a rep range when an equipment jump is too large;
- prefer matching the previous weight when that is still a good target;
- show a warning when the programmed range and available increments cannot produce an optimal recommendation;
- offer new workout targets or a manual fix.

The recommendation is not punitive. A harder-than-intended set can result in a lower next recommendation because the system is trying to match current ability. [Lowering weight or reps](https://help.macrofactorapp.com/en/articles/373-why-does-the-app-sometimes-recommend-lowering-weight-or-reps) · [Smart Progression options](https://help.macrofactorapp.com/en/articles/305-understanding-and-using-smart-progressions)

### 3.7 Periodization and deload settings

MacroFactor allows sets, rep minimums/maximums and RIR targets to vary across cycles. Generated programs apply periodization automatically; custom programs can enable it. A deload can be placed at the first or last cycle, or omitted. [Periodization settings](https://help.macrofactorapp.com/en/articles/389-how-can-i-customize-periodization-rir-reps-and-sets-for-the-exercises-in-my-program) · [Deload settings](https://help.macrofactorapp.com/en/articles/297-deload-first-cycle-or-last-cycle)

### 3.8 Program-update toggle

During a workout, structural edits can be session-only or applied to the program moving forward. Smart Progression still learns from logged sets even when the user does not update the program. This is a critical reversible-edit pattern for THE. [Update Program toggle](https://help.macrofactorapp.com/en/articles/395-what-does-the-update-program-toggle-do)

### 3.9 Missed workouts and time off

MacroFactor says programs are cycle-based rather than calendar-locked. Missing a workout does not automatically rewrite the program; the athlete can skip/log rest or pause and resume. New logged performance after time off then informs normal recommendations. [Missed workouts](https://help.macrofactorapp.com/en/articles/382-what-happens-to-my-program-if-i-miss-workouts-or-take-time-off)

### 3.10 Integration with MacroFactor Nutrition

MacroFactor currently states that Workouts and Nutrition are separate apps. They do not automatically adjust training from nutrition data or nutrition targets from training data, although selected body metrics and period data can be shared. THE should preserve that explicit boundary while allowing its own coach layer to use nutrition constraints intentionally. [MacroFactor integration](https://help.macrofactorapp.com/en/articles/381-how-does-macrofactor-workouts-integrate-with-macrofactor-nutrition)

## 4. RP Hypertrophy — public components

### 4.1 The scope correction

RP’s own support page says the Hypertrophy App is for maximising muscle growth and that strength is secondary. That means RP Hypertrophy is appropriate for the muscle-building half of a hybrid plan, but it is not sufficient as the sole controller for maximal strength. Strength mode needs practice of the target lifts, heavier loading exposure, technical consistency and a strength-specific outcome metric.

### 4.2 Volume landmarks

RP uses:

- **MV:** maintenance volume;
- **MEV:** minimum effective volume;
- **MAV:** maximum adaptive volume range;
- **MRV:** maximum recoverable volume.

RP’s working-set convention counts the sets where a muscle is the prime mover or where an isolation exercise directly targets it, rather than naïvely counting every indirect contribution as a full set. Its public numerical landmarks are starting estimates that vary by muscle, training age, frequency, exercise selection, priority and recovery. They are not universal physiological constants. [RP volume landmarks](https://rpstrength.com/blogs/articles/training-volume-landmarks-muscle-growth) · [RP chest landmarks](https://rpstrength.com/blogs/articles/chest-hypertrophy-training-tips)

### 4.3 Muscle emphasis

The RP app offers three priority levels:

- **Emphasize:** add volume when the muscle is responding and recovering well, moving from MEV toward MRV;
- **Grow:** pursue growth but add volume only when needed, staying closer to MEV;
- **Maintain:** remain near MV to free recovery resources for other priorities.

THE should represent priority as a per-muscle policy, not as a global “train harder” switch. [RP muscle emphasis](https://help.rpstrength.com/hc/en-us/articles/34825395726743-Muscle-Emphasis-Breakdown)

### 4.4 Set progression feedback

RP says its set algorithm continuously uses:

- pump quality;
- soreness and whether it resolves before the next exposure;
- perceived workload or how “beat up” the athlete feels;
- performance and ability to meet targets;
- muscle emphasis level.

The public behavioural pattern is:

```text
low stimulus + good recovery -> consider adding sets
adequate stimulus + recoverable workload -> hold volume
poor recovery / excessive soreness / declining performance -> hold or reduce volume
```

Do not turn pump or soreness into a universal score that overrides performance, pain or health information. [RP progression algorithm](https://help.rpstrength.com/hc/en-us/articles/32600173777815-How-does-the-app-determine-when-to-add-weight-reps-and-sets) · [RP long-workout guidance](https://help.rpstrength.com/hc/en-us/articles/32600133107863-Why-is-the-app-giving-me-so-many-sets-Long-Workouts)

### 4.5 RIR and mesocycle flow

RP describes a typical accumulation pattern as beginning around 3–4 RIR and progressively approaching 0 RIR for safer exercises or 1 RIR for exercises where failure is risky. It advises keeping reps relatively stable while adding load to maintain the intended RIR. Its public muscle guides describe mesocycles commonly in the 3–12-week range, with an accumulation phase followed by a deload. [RP RIR](https://help.rpstrength.com/hc/en-us/articles/31147466880791-What-does-RIR-mean) · [RP periodization example](https://help.rpstrength.com/hc/en-us/articles/32433153518359-Chest)

For THE:

- hypertrophy accessories may approach 0–2 RIR when safe and recoverable;
- primary strength lifts should not be forced to failure as a default;
- strength blocks should include submaximal practice of the target lift and a clear performance test or estimated strength metric;
- RIR decline is a policy choice, not a reason to ignore declining performance or pain.

### 4.6 Deloads

RP’s app places the deload in the final week of the selected cycle by default. MacroFactor allows none/first/last-cycle choices. These are product behaviours, not proof that every athlete needs a fixed deload every four, five or six weeks. THE should support scheduled deloads plus an evidence-driven early-deload request. [RP automatic deloads](https://help.rpstrength.com/hc/en-us/articles/33510413024279-Does-the-app-automatically-place-deloads) · [MacroFactor deload choices](https://help.macrofactorapp.com/en/articles/297-deload-first-cycle-or-last-cycle)

### 4.7 Exercise order, warm-ups and rest

RP recommends not counting warm-ups as hypertrophy working sets. It does not impose a universal rest timer; rest should be long enough to perform the next set effectively and depends on exercise and goal. Exercise order can be changed when necessary but should be treated as a deliberate change because order alters performance. [RP warm-ups](https://help.rpstrength.com/hc/en-us/articles/33510158383255-Do-I-log-warm-up-sets) · [RP rest](https://help.rpstrength.com/hc/en-us/articles/30805293312407-Why-is-there-no-rest-timer) · [RP exercise order](https://help.rpstrength.com/hc/en-us/articles/31644098611351-Can-I-do-my-exercises-out-of-order)

## 5. Strength-priority Hybrid mode

### 5.1 Modes

```ts
type TrainingPriority =
  | "strength"
  | "hypertrophy"
  | "hybrid";
```

**Strength:** target-lift skill and performance are primary; hypertrophy volume supports the lift.  
**Hypertrophy:** muscle growth and volume landmarks are primary; strength is a secondary outcome.  
**Hybrid:** reserve high-quality exposures for key lifts and use RP-style volume progression for supporting muscles.

### 5.2 Exercise roles

```ts
type ExerciseRole =
  | "primary_strength"
  | "secondary_strength"
  | "hypertrophy_compound"
  | "hypertrophy_isolation"
  | "rehab_or_accessory"
  | "conditioning";
```

Primary strength exercises need stable technique, equipment and order. Accessories can use a substitution group, but the replacement must carry its own loading history and fatigue profile.

### 5.3 Recommended v1 target ranges

These are Hybrid policies, not recovered MacroFactor or RP equations:

| Role | Typical rep target | Default RIR policy | Main outcome |
|---|---:|---:|---|
| Primary strength | 2–6 | 2–4, occasionally 1–2 in a planned peak | specific strength and skill |
| Secondary strength | 4–10 | 1–3 | strength with muscle stimulus |
| Hypertrophy compound | 5–15 | 1–3 | muscle growth |
| Hypertrophy isolation | 8–30 | 0–3 if safe | muscle growth |

The wide hypertrophy range is consistent with RP’s 5–30-rep guidance, while heavier loading remains more specific to maximal strength. [Load effects meta-analysis](https://pubmed.ncbi.nlm.nih.gov/28834797/)

### 5.4 Performance metrics

Track at least:

- completed load and reps by set;
- actual and target RIR;
- estimated 1RM or rep-strength trend for key lifts;
- load, rep and set completion rate;
- technique or range-of-motion flags;
- session duration and rest where available;
- pump, soreness, recovery and workload feedback by muscle;
- pain separately from fatigue;
- sleep, illness, stress and nutrition constraints when voluntarily supplied.

An e1RM is an analytics estimate, not a direct measure of strength. A Hybrid prototype may use an explicit formula such as Epley for stable, technically valid sets, but should not use it as the sole progression controller.

## 6. Progression controller

### 6.1 Per-set signal

For a target rep range `[min,max]` and target RIR:

```text
expected_failure_reps = midpoint(min,max) + target_RIR
observed_failure_reps = completed_reps + actual_RIR
performance_signal = observed_failure_reps - expected_failure_reps
```

This mirrors MacroFactor’s public explanatory example. The exact app likely includes additional history and constraints; THE should keep this equation transparent and versioned.

### 6.2 Candidate recommendation order

For the next exposure of an exercise:

1. validate equipment and exercise identity;
2. use recent comparable sets, not one isolated set;
3. preserve target RIR and rep range where possible;
4. if performance is clearly above target, test a small load increase;
5. if the equipment jump is too large, add a rep or expand the range if policy permits;
6. if performance is below target, hold or lower load/reps rather than punish the athlete;
7. round to available equipment increments;
8. store the reason and confidence.

### 6.3 Inherited Hybrid defaults

The existing project evidence dossier contains these defaults:

- progression target: approximately 2.5% of the last stable opening load, with equipment-aware rounding and rep/RPE fallback;
- reactive reduction: approximately 5% after repeated comparable deterioration;
- pain is a separate state from fatigue;
- missing data lowers certainty;
- a single noisy observation does not drive the whole program.

These are inherited THE Hybrid design decisions. They are not MacroFactor source code, RP source code or universal science. Keep them behind a policy version and validate them.

## 7. Volume controller

### 7.1 Direct-set accounting

Maintain separate fields:

```text
directWorkingSets[muscle]
indirectExposure[muscle]
systemicFatigueCost[exercise]
jointStressCost[exercise]
```

Use direct prime-mover sets for RP-style landmark comparisons. Keep indirect exposure visible rather than secretly converting it into a fixed fractional set.

### 7.2 Volume decision

For each muscle and microcycle:

```text
if priority = maintain:
    remain near MV unless performance or recovery requires change
elif priority = grow:
    add volume only when stimulus is inadequate and recovery is good
elif priority = emphasize:
    progress from MEV toward MAV while recovery and performance remain acceptable

if repeated poor recovery, performance decline or excessive soreness:
    hold or reduce volume; consider deload
```

Do not use a single MRV number for every person. Exercise selection, frequency, training age, sleep, nutrition, occupation and concurrent sport materially alter tolerable volume.

### 7.3 Fatigue and readiness state

```ts
type TrainingState =
  | "normal"
  | "caution"
  | "hold_progression"
  | "deload_review"
  | "pain_or_medical_review"
  | "insufficient_data";
```

Rules:

- one bad set: adjust locally and continue gathering data;
- repeated comparable underperformance: hold or reduce load/volume;
- broad performance decline plus poor recovery: review fatigue and deload;
- pain, neurological symptoms or injury concern: route separately; do not describe it as ordinary fatigue;
- missing feedback: lower confidence rather than automatically adding or removing volume.

## 8. Mesocycle and deload controller

Support both:

1. scheduled deload at the selected cycle boundary;
2. early deload request when performance/recovery evidence justifies it.

Do not require a fixed 4-, 5- or 6-week block for everyone. A six-week test vector is useful because both products commonly expose cycle-based workflows, but the production policy must allow a different length.

For a deload snapshot, make each reduction explicit:

- sets reduced toward a maintenance/recovery level;
- load and/or reps reduced;
- target RIR increased;
- high-fatigue accessory work optionally removed;
- primary movement pattern retained where useful for skill;
- next accumulation cycle starts from the new observed state, not a deleted history.

## 9. Check-ins and update events

### 9.1 In-session

Capture actual performance and allow:

- RIR correction;
- session-only load/rep change;
- session-only exercise swap;
- rest adjustment;
- partial-rep, drop-set, myo-rep or failure-set classification;
- pain or symptom flag;
- note.

### 9.2 Post-workout

The app should explain:

- what was completed;
- whether the next recommendation changed;
- whether the change was based on load/reps/RIR, equipment, or history;
- whether the program structure stayed unchanged;
- what feedback is still missing.

### 9.3 Weekly/muscle feedback

Ask only what the decision needs:

- pump quality;
- soreness resolution before next exposure;
- workload/recovery perception;
- performance trend;
- ability to complete planned sessions;
- pain or injury concern.

Do not let an LLM invent a set increase. Predicates and numerical outputs must be deterministic; the coach can explain them.

### 9.4 Mesocycle review

At cycle end, review:

- key-lift strength trend;
- hypertrophy proxy trend where available;
- direct sets by muscle;
- completion rate;
- RIR calibration drift;
- pain and symptom flags;
- sleep/illness/nutrition constraints;
- whether the athlete wants the same emphasis.

Create a new program snapshot or cycle version. Never silently rewrite the old one.

## 10. Nutrition and whole-athlete integration

MacroFactor’s own apps are currently separate, and THE should preserve this boundary. The nutrition engine may publish constraints such as `low_energy_availability_review`, `aggressive_deficit_blocked`, or `fueling_data_missing`. The training engine may publish training load and recovery observations. Neither engine should silently prescribe the other’s targets.

```text
nutrition engine -> approved nutrition target + constraints
training engine  -> approved program target + load/recovery observations
whole-athlete-state -> shared facts, derived states, safety gates
coach surface -> explanations and acceptance flows
```

## 11. Data contracts

```ts
interface ExerciseSetObservation {
  athleteId: string;
  sessionId: string;
  exerciseId: string;
  setIndex: number;
  setType: "working" | "warmup" | "failure" | "drop" | "myo" | "partial";
  load: number;
  unit: "kg" | "lb";
  repsCompleted: number;
  targetRepsMin?: number;
  targetRepsMax?: number;
  targetRir?: number;
  actualRir?: number | "6_plus";
  rirSource: "athlete" | "coach" | "inferred" | "missing";
  techniqueQuality?: "good" | "compromised" | "unknown";
  painFlag?: boolean;
  notes?: string;
  observedAt: string;
}

interface ExerciseProgressionRecommendation {
  exerciseId: string;
  nextSessionId: string;
  load?: number;
  repsMin?: number;
  repsMax?: number;
  targetRir?: number;
  action: "increase" | "hold" | "reduce" | "expand_range" | "manual_review";
  reasonCodes: string[];
  confidence: "low" | "medium" | "high";
  formulaVersion: string;
  sourceClass: "product" | "science" | "hybrid_inference";
}

interface MuscleVolumeState {
  muscleId: string;
  microcycleId: string;
  priority: "maintain" | "grow" | "emphasize";
  directWorkingSets: number;
  indirectExposure: "none" | "low" | "medium" | "high";
  pump: "poor" | "adequate" | "excellent" | "missing";
  soreness: "none" | "resolved" | "late" | "persistent" | "missing";
  workload: "easy" | "manageable" | "limit" | "overwhelming" | "missing";
  action: "add_set" | "hold" | "reduce_set" | "deload_review" | "insufficient_data";
  policyVersion: string;
}

interface ProgramSnapshot {
  programId: string;
  version: number;
  priority: "strength" | "hypertrophy" | "hybrid";
  cycleNumber: number;
  cycleLengthWeeks: number;
  deloadPlacement: "none" | "first" | "last" | "adaptive_review";
  exercises: string[];
  acceptedAt: string;
}
```

## 12. Engine pseudocode

```text
onSetLogged(set):
    persistRawSet(set)
    classifySetQuality(set)
    if set.painFlag:
        emit pain_or_medical_review
        do not auto-escalate load
        return

    expected = targetMidpoint(set) + targetRir(set)
    observed = completedReps(set) + actualRirIfReliable(set)
    performance = observed - expected
    history = comparableExerciseHistory(set.exerciseId)

    recommendation = chooseBoundedLoadRepChange(
        performance,
        history,
        equipmentProfile,
        programTargets,
        policyVersion
    )
    persistRecommendation(recommendation)

afterMuscleExposure(muscle):
    feedback = collectPumpSorenessWorkloadPerformance(muscle)
    state = updateMuscleVolumeState(muscle, feedback, history)
    if state.action == deload_review:
        blockAggressiveVolumeIncrease()
    persistVolumeState(state)

onWorkoutCompleted(session):
    updateNextExerciseRecommendations()
    if userEnabledProgramUpdate and structuralEditsExist:
        createProgramSnapshotVersion()
    else:
        preserveProgramStructure()

onCycleReview(cycle):
    evaluateKeyLiftTrend()
    evaluateMuscleVolumeAndRecovery()
    evaluateRirCalibration()
    if scheduledDeload or evidenceSupportsDeload:
        createDeloadSnapshot()
    else:
        createNextAccumulationSnapshot()
```

## 13. Edge cases

| Situation | Correct behaviour |
|---|---|
| Missed workout | Do not punish or automatically rewrite the program; resume and relearn from new performance. |
| RIR estimate wrong | Keep the observation, reduce confidence and use subsequent sets; do not erase history. |
| Equipment unavailable | Session-only substitute by default; update program only after explicit acceptance. |
| Large equipment jump | Match weight, add reps, expand range or present manual fix; never invent an impossible load. |
| Pain | Separate pain/medical review from ordinary fatigue and soreness. |
| One poor session | Local adjustment and more data; no whole-program deload from one noisy result. |
| Repeated underperformance | Hold progression, investigate sleep/illness/nutrition/stress and consider volume reduction or deload. |
| Warm-up set | Store it, but exclude from hypertrophy working-set totals unless explicitly configured. |
| Drop/myo/failure set | Preserve type and do not count it as an ordinary set without a policy decision. |
| Exercise swap | New exercise starts with its own history and conservative calibration. |
| Strength peak | Reduce fatigue and preserve specificity; do not run normal hypertrophy volume into a test. |
| Nutrition concern | Training receives a constraint; nutrition does not silently rewrite completed training history. |

## 14. Validation plan

### 14.1 Unit and property tests

- RIR 0–6+ parses correctly;
- missing RIR lowers confidence;
- target midpoint plus RIR matches the documented MacroFactor example;
- failed progression does not produce a punitive jump;
- equipment rounding never recommends an unavailable increment;
- session-only edits do not mutate the program snapshot;
- program-update edits create a new version;
- warm-ups do not count as working sets by default;
- weekly budget and strength-side outputs remain separate from nutrition prescriptions;
- pain state blocks automatic load escalation.

### 14.2 Replay tests

Replay at least:

1. steady progress at the target RIR;
2. completed reps above target at same RIR;
3. repeated underperformance;
4. one isolated poor session;
5. equipment jump too large;
6. missed week and resume;
7. RIR drift from 3 to 1 without actual load change;
8. high pump/low soreness/easy workload;
9. persistent soreness and performance decline;
10. strength-priority block with hypertrophy accessory volume;
11. scheduled deload;
12. pain flag;
13. nutrition constraint during a strength block.

### 14.3 Outcome validation

Validate separately:

- load/reps/RIR target accuracy;
- key-lift strength trend and test performance;
- hypertrophy proxy or body-composition outcome where measurement is credible;
- volume recommendation stability;
- deload timing and recovery response;
- subgroup fairness across sex, age, training experience, equipment and schedule;
- user adherence and manual override rate.

Do not advertise “AI knows your MRV” without prospective calibration. RP’s volume landmarks and MacroFactor’s Smart Progression behaviour are useful starting points, not validated guarantees for this app.

## 15. What remains unknown

The following are not publicly reproducible:

- MacroFactor’s exact Smart Progression load estimator and history weighting;
- exact MacroFactor set-to-set fatigue model;
- exact equipment objective and warning thresholds;
- exact generated-program exercise-selection and volume tables;
- exact RP app volume coefficients by muscle and experience;
- exact pump/soreness/workload scoring weights;
- exact RP app set-progression gains and caps;
- exact deload load/rep reductions for every exercise;
- exact cross-muscle indirect-volume accounting;
- exact strength-priority model in MacroFactor Workouts.

RP does publish a concrete volume-progression framework (including 1–4 recovery/performance scores and add/hold/deload directions), so it is wrong to describe RP as having no public algorithmic logic. The current app’s exact coefficients, state transitions and rule base remain unverified. It would also be wrong to claim an exact MacroFactor or RP clone. The correct deliverable is a transparent, versioned analogue with a provenance trail.

## 16. Primary sources

### MacroFactor Workouts

- [Workouts overview](https://macrofactorapp.com/workouts/)
- [Smart Generation inputs](https://help.macrofactorapp.com/en/articles/370-what-information-does-macrofactor-workouts-use-to-generate-your-program)
- [Smart Progression](https://help.macrofactorapp.com/en/articles/305-understanding-and-using-smart-progressions)
- [Progressive overload](https://help.macrofactorapp.com/en/articles/372-what-does-progressive-overload-mean-in-macrofactor-workouts)
- [RIR](https://help.macrofactorapp.com/en/articles/385-what-is-rir-and-how-should-i-use-it-during-training)
- [Lowering weight or reps](https://help.macrofactorapp.com/en/articles/373-why-does-the-app-sometimes-recommend-lowering-weight-or-reps)
- [Program update timing](https://help.macrofactorapp.com/en/articles/369-how-often-does-my-program-update)
- [Periodization](https://help.macrofactorapp.com/en/articles/389-how-can-i-customize-periodization-rir-reps-and-sets-for-the-exercises-in-my-program)
- [Deloads](https://help.macrofactorapp.com/en/articles/297-deload-first-cycle-or-last-cycle)
- [Update Program toggle](https://help.macrofactorapp.com/en/articles/395-what-does-the-update-program-toggle-do)
- [Missed workouts](https://help.macrofactorapp.com/en/articles/382-what-happens-to-my-program-if-i-miss-workouts-or-take-time-off)
- [Nutrition integration](https://help.macrofactorapp.com/en/articles/381-how-does-macrofactor-workouts-integrate-with-macrofactor-nutrition)

## Agent deep-pass addendum — additional product behaviour

The second research pass recovered several implementation details that should be explicit in the build. These are public product behaviours, not a claim that the private production algorithm has been cloned.

### MacroFactor program and setup constraints

- Smart Generation takes goal, lifting experience, training days, session duration, equipment/gym profile, exercise exclusions, structure/split, muscle-group emphasis and deload preference.
- A custom program starts with 7 cycles by default, can be configured from 1–52 cycles, and can contain up to 14 unique training days in a cycle. Treat cycles as repeating program structure, not calendar dates.
- Focus points may prioritise up to five muscle groups and deprioritise up to five. Persist this as an explicit resource-allocation input rather than inferring it from exercise count.
- Before sufficient exercise history exists, the user supplies the starting load. The engine must not invent a high-confidence initial load recommendation.

### Equipment, warm-up and session execution

- Exercise selection is constrained by gym profiles, allowed equipment, exercise exclusions, muscle groups and training type. Swaps should be represented as a reasoned substitution event.
- Plate-calculator weights include the bar; pin-loaded machines need start, end and increment ranges. Candidate loads must be rounded to the actual equipment profile before a recommendation is shown.
- Smart warm-ups scale from the working load; the public example uses approximately 40%, 60% and 80% for 3 reps. The exact default algorithm remains unknown. Warm-ups stay outside working-set volume.
- Public rest defaults are approximately 180 seconds for lower-body compounds and 90 seconds for upper-body isolation; treat these as product-inspired defaults, not physiological laws. Readiness and performance remain the override.
- Smart Progression warnings are explainable states: informational, unusual/suboptimal requiring review, or unavailable-equipment. A warning must carry the corrective options it considered.

### History, analytics and audit boundaries

- Smart Progression uses logged load, reps, RIR, expected performance and comparable exercise history. The public rule is enough for a transparent v1, but the exact estimator, exercise ranking and fatigue model remain unknown.
- Insights expose weekly muscle sets, exercise records, volume/reps and estimated-strength trends. Do not assume MacroFactor's exact e1RM equation or muscle-set weighting; keep analytics formulas versioned and exercise-specific.
- Data export should be a first-class feature with workout, exercise, muscle, gym and bodyweight records. Store the formula/policy version and reason codes beside each recommendation so an export can reproduce the decision.
- Missing workouts do not rewrite the program; the user resumes the cycle and new observations update later recommendations.
- Nutrition and training remain separate controllers. Shared bodyweight or circumference data may be displayed, but training logs must not silently create nutrition prescriptions or vice versa.

### Research boundaries that survived the agent pass

- Main-lift strength is exercise-specific: do not treat bench press, dumbbell press and machine press as interchangeable strength series.
- Use frequency to distribute practice and volume. It is not an automatic progression target when volume is equated.
- RIR is useful but noisy. Store predicted RIR, achieved reps and confidence; allow an error band and calibrate against repeated performance.
- Deloads should combine cycle policy with performance/recovery evidence. A common athlete practice is roughly a week every 5–6 weeks, but this is not a universal causal prescription.

### New primary sources

- [MacroFactor Workouts collection](https://help.macrofactorapp.com/en/collections/20-macrofactor-workouts)
- [Smart Generation inputs](https://help.macrofactorapp.com/en/articles/370-what-information-does-macrofactor-workouts-use-to-generate-your-program)
- [Program cycles](https://help.macrofactorapp.com/en/articles/302-change-number-of-cycles-in-a-program)
- [Starting load](https://help.macrofactorapp.com/en/articles/377-how-do-i-know-what-weight-to-start-with)
- [Equipment settings](https://help.macrofactorapp.com/en/articles/390-how-to-change-equipment-settings-to-simplify-weight-recommendations)
- [Warm-ups](https://help.macrofactorapp.com/en/articles/304-configuring-warm-ups)
- [Rest timers](https://help.macrofactorapp.com/en/articles/303-change-default-rest-timers)
- [Warnings](https://help.macrofactorapp.com/en/articles/391-what-does-the-smart-progression-wand-mean)
- [Workout export](https://help.macrofactorapp.com/en/articles/356-export-your-data-workouts)
- [Strength specificity — PMID 36396899](https://pubmed.ncbi.nlm.nih.gov/36396899/)
- [Weekly volume — PMID 41343037](https://pubmed.ncbi.nlm.nih.gov/41343037/)
- [RIR autoregulation — PMID 31009432](https://pubmed.ncbi.nlm.nih.gov/31009432/)
- [Deload practice survey — PMID 38499934](https://pubmed.ncbi.nlm.nih.gov/38499934/)

## Second deep-pass addendum — volume accounting, cardio interaction and safety

### Indirect-set accounting is now an explicit option

The 2026 dose-response meta-analysis classified sets as direct or indirect and found the strongest relative evidence for a fractional method: a direct set counts as 1.0 and an indirect set as 0.5 for the target muscle. The result supports distinguishing direct from indirect exposure; it does not prove that every exercise, person or muscle has a universal 0.5 coefficient. The engine should therefore store raw exposure types and expose `fractionalIndirect.v1` as a replaceable policy, alongside `directOnly` and `totalExposure` views.

Do not double-count a bench press as a full chest, triceps and front-delt set. Also do not hide the raw count behind one “volume” number. Recommendations should show direct sets, fractional indirect exposure, total exposure and the policy version used.

### Concurrent cardio is a resource interaction, not a blanket block

The app needs to know whether an athlete is also doing running, cycling, steady-state cardio, HIIT or sport practice. For a lower-body strength priority, resistance-before-endurance is the safer default when both are performed in one session, and lower-body performance should be monitored when endurance frequency or duration rises. Evidence is mixed: whole-muscle hypertrophy is often preserved, while lower-body strength interference is more plausible in some male concurrent-training datasets and with running or high-volume endurance work.

Required data: modality, duration, intensity proxy, same-session order, gap between sessions, body region, and whether the session was planned or incidental. The engine may reduce automatic lower-body volume escalation or request a review after repeated deterioration, but must not declare cardio “bad” or block it from one study.

### Optional velocity-loss layer

If the athlete has a validated velocity sensor, velocity loss can be stored as an objective fatigue signal. Evidence supports lower velocity-loss exposure (approximately ≤25%) for strength-oriented work and higher exposure (roughly >20–25%) for hypertrophy when the extra relative volume is meaningful. This should be an optional measurement layer, not a replacement for RIR and not an inferred value from reps alone. Without a device, the field remains missing—not zero.

### Safety state: fueling and health review

The IOC REDs consensus makes two boundaries important for this app. First, low energy availability is a continuum and a clinical syndrome requires accumulated indicators and differential diagnosis. Second, no universal energy-availability threshold should be treated as a diagnosis in a consumer app. The engine may enter `fueling_safety_review` when a constellation persists—for example, rapid weight loss or aggressive restriction combined with performance decline, persistent fatigue, illness/injury signals or relevant symptoms—but it must not label the athlete with REDs, calculate medical clearance, or automatically intensify training.

The review state should pause automatic volume escalation, preserve the athlete's recorded history, explain the trigger, and route the user toward qualified medical/sports-dietetic assessment when warranted. The safety state is separate from ordinary fatigue, soreness and a single bad workout.

### Validation must distinguish noise from a true response

Individual response variability is real, but “non-responder” status cannot be assigned from one short block or one noisy body measurement. Use repeated blocks, stable exercise identity, standardised testing conditions and a measurement-error/MDC field before classifying a response as probable improvement, probable no-change or review-needed. The absence of change in one proxy is not proof that the program failed.

### New sources from the second pass

- [2026 volume/frequency dose-response meta-analysis — PMID 41343037](https://pubmed.ncbi.nlm.nih.gov/41343037/)
- [Autoregulated load and velocity-loss thresholds — PMID 35038063](https://pubmed.ncbi.nlm.nih.gov/35038063/)
- [Velocity-loss review — PMID 36178597](https://pubmed.ncbi.nlm.nih.gov/36178597/)
- [Concurrent training by sex/training status — PMID 37847373](https://pubmed.ncbi.nlm.nih.gov/37847373/)
- [Concurrent exercise sequence — PMID 28917030](https://pubmed.ncbi.nlm.nih.gov/28917030/)
- [Concurrent training hypertrophy — PMID 36508686](https://pubmed.ncbi.nlm.nih.gov/36508686/)
- [IOC REDs consensus — PMID 37752011](https://pubmed.ncbi.nlm.nih.gov/37752011/)
- [IOC REDs consensus full text](https://bjsm.bmj.com/content/57/17/1073)

### Safety pathways that must not be collapsed into pain

The second safety review found that the existing boolean `painFlag` is too coarse for a real personal app. Replace it with structured `HealthEvent` records and a priority-ordered `SafetyState`:

```text
emergency_stop
> training_pause
> clinician_review
> reentry_required
> hold_progression
> caution
> normal
> insufficient_data
```

Hard-stop examples include chest pain, collapse/fainting, severe breathing difficulty, sudden neurological symptoms and suspected heat stroke. Fever, significant systemic illness, suspected concussion, severe/worsening pain, instability, swelling or loss of function should pause training automation. These states must not be overridden by a good wearable recovery score, good RIR or one good set.

For an Australia-facing app, the emergency copy should be explicit: stop exercising and call `000` if the situation is an emergency. The app must not diagnose an injury, REDs, overtraining or concussion. It should record the pattern, preserve the history and route the user to appropriate clinical or crisis support.

### Return-after-gap rules

Every gap needs a reason: routine/travel, illness, injury, stress/mental health or unknown. A routine gap can use `reentry_required` and a conservative first exposure. Illness and injury gaps cannot be cleared by elapsed days alone; they need symptom resolution, functional tolerance and clinician clearance where appropriate. A missing reason is not the same as a routine gap.

### Decision-system validation additions

RIR calibration must be exercise-family and rep-band specific. Store reported RIR, anchor-derived or observed actual RIR when available, error, observation count and confidence. A user who estimates bench-press RIR well is not automatically calibrated on a machine row or high-rep isolation work.

For standardised outcomes, calculate exercise-specific typical error and MDC95 where the test design supports it:

```text
SEM = SD × sqrt(1 − ICC)
MDC95 = 1.96 × SEM × sqrt(2)
```

MDC means the change is likely larger than measurement error; it does not prove the app caused the improvement. Recommendation confidence must also be calibrated against outcomes, not assigned as a decorative label. Track acceptance, decline, modification, skip, manual load, pain-based override and the outcome after each override.

Every decision must be replayable from an immutable trace containing decision ID, source event IDs, program snapshot, input hash, engine/formula/policy versions, normalised inputs, derived values, safety gates, candidate actions, rejected candidates and reasons, selected action, confidence, warnings, override and output hash. Late or corrected events create compensating events; they do not silently rewrite history.

### Further training-control corrections

- Do not treat small fixed volume increases as automatically safer or more productive. Recent evidence does not justify a universal volume-ramp law; performance, fatigue and recovery gates must arbitrate.
- Fatigue is not just weekly sets. Include proximity to failure, set duration, load, density/rest and local volume. Dense low-load near-failure work can be disproportionately fatiguing.
- Support alternative controllers—RIR, APRE and optional velocity-based training—without claiming that one method wins for every athlete. If velocity is unavailable, do not manufacture it.
- BFR and very-low-load work require their own RIR/progression calibration. Normal rep-to-failure tables can be badly wrong at very low loads.
- e1RM is an exercise-specific estimate with uncertainty. A safe direct 1RM test, when appropriate, outranks a generic equation; never show e1RM as true strength.
- Full ROM remains the default for strength. Lengthened partial ROM may be a deliberate hypertrophy or pain-management substitution; shortened partials should not receive automatic equivalence credit.
- Strength and hypertrophy outcomes must stay separate. A stronger lift does not prove a muscle grew, and a hypertrophy proxy does not prove maximal strength improved.

### Third product pass — lifecycle and exercise semantics

The official-product pass found that the app needs a richer event model than `program + sets + reps`:

- Program completion has separate `repeat_block` and `complete_program` paths. Changing the active program changes a pointer; it must not delete or reset history.
- Backfill is manual and should preserve provenance. Do not promise automatic import from another workout app without a validated mapping.
- Smart Progression can learn from altered/custom programs, but progression history does not automatically rewrite exercise selection. Keep structure and recommendation streams separate.
- Bulk edits across cycles can cascade: changing RIR can change set and rep targets, and changing sets can change rep ranges/RIR. Show a transactional preview and affected fields before commit.
- Allow post-set RIR corrections while preserving the original report, corrected value, timestamp and downstream recalculation event.
- RIR targets can vary by set. Later-set rep reductions at the same RIR are not automatically underperformance.
- Warm-ups require a hierarchy: global scheme → exercise override → cycle/program override → session override. Removing one warm-up must not silently mutate the saved scheme.
- Exercise metadata must include metric/load semantics, compound/isolation, laterality, primary/secondary muscles, equipment, bodyweight status, ROM, stability, movement pattern, alternate names and recommendation exclusions.
- Exercise swaps start a new progression series for the replacement. Keep a related-movement link for context, but do not merge non-equivalent performance curves.
- Skipping an exercise for one cycle, skipping a workout, un-skipping, repeating a block and completing a program are different reversible lifecycle events.
- Supersets are grouped rounds with rest after the round, not merely adjacent exercises. RP-style manual adjacency and MacroFactor-style explicit grouping should remain distinct modes.
- Load semantics must be explicit: bar-included, per-dumbbell, bodyweight, added-load, machine-stack or assistance load. Never assume a logged load represents bilateral total load.
- Units may be immutable within a cycle; changing units should create an explicit migration/new-cycle event.
- RP’s mesocycle guidance varies by training age, and its volume feedback distinguishes recovery capacity from time capacity. A user who has limited time is not necessarily ready for more sets.
- Sport/cardio sessions consume recovery budget. Straight sets should remain the default foundation; intensity techniques belong mainly on stable, low-skill accessory work and should not appear automatically on primary strength lifts.

### RP Strength

- [RP Hypertrophy App scope](https://help.rpstrength.com/hc/en-us/articles/33510008280087-Who-is-the-RP-Hypertrophy-App-for)
- [RIR](https://help.rpstrength.com/hc/en-us/articles/31147466880791-What-does-RIR-mean)
- [Set, rep and load progression](https://help.rpstrength.com/hc/en-us/articles/32600173777815-How-does-the-app-determine-when-to-add-weight-reps-and-sets)
- [Automatic deloads](https://help.rpstrength.com/hc/en-us/articles/33510413024279-Does-the-app-automatically-place-deloads)
- [Muscle emphasis](https://help.rpstrength.com/hc/en-us/articles/34825395726743-Muscle-Emphasis-Breakdown)
- [Volume landmarks](https://rpstrength.com/blogs/articles/training-volume-landmarks-muscle-growth)
- [Chest periodization example](https://help.rpstrength.com/hc/en-us/articles/32433153518359-Chest)
- [Training days](https://help.rpstrength.com/hc/en-us/articles/32600191344023-How-many-days-per-week-should-i-choose-to-train)
- [Warm-up and starting weight](https://help.rpstrength.com/hc/en-us/articles/30803792842775-How-should-I-warm-up-and-select-a-starting-weight)
- [Rest](https://help.rpstrength.com/hc/en-us/articles/30805293312407-Why-is-there-no-rest-timer)

### PubMed

- [Low versus high load](https://pubmed.ncbi.nlm.nih.gov/28834797/)
- [Resistance-training load effects](https://pubmed.ncbi.nlm.nih.gov/33433148/)
- [Proximity to failure meta-regression](https://pubmed.ncbi.nlm.nih.gov/38970765/)
- [Failure versus non-failure](https://pubmed.ncbi.nlm.nih.gov/33497853/)
- [Proximity-to-failure hypertrophy meta-analysis](https://pubmed.ncbi.nlm.nih.gov/36334240/)
- [Periodization for strength and hypertrophy](https://pubmed.ncbi.nlm.nih.gov/35044672/)
- [RPE-based loading](https://pubmed.ncbi.nlm.nih.gov/29628895/)
- [RIR-based scale](https://pubmed.ncbi.nlm.nih.gov/26049792/)
- [Resistance-training frequency and strength](https://pubmed.ncbi.nlm.nih.gov/29470825/)
- [Resistance-training frequency and hypertrophy](https://pubmed.ncbi.nlm.nih.gov/27102172/)

### Confidence and missingness requirements

Recommendation confidence must be calibrated against outcomes, not assigned as a decorative label. Keep these dimensions separate:

```text
dataConfidence
rirConfidence
recommendationConfidence
expectedOutcomeConfidence
```

For probabilistic outputs, evaluate success rates by confidence band, Brier score, calibration intercept/slope, reliability diagrams and expected calibration error. For missing values, store the reason (`user_skipped`, `not_applicable`, `abandoned_session`, `import_failure`, `pain_or_illness`, `backfilled_later`, `unknown`). Do not impute missing RIR as failure, carry the last value forward, or treat missing health data as normal.
