# Strength brain: recommended maths

Research and design recommendation, 10 October 2026. No app implementation made.

## Decision

Use deterministic rules. Actual completed performance is the main evidence; effort helps interpret it. Keep the athlete-facing slider and silent recommendations. No LLM is required to calculate loads.

These six calculations support the eight agreed modules. Published research supports the general methods, but our slider conversion, adjustment caps, eligibility filters and three-session smoothing are product defaults to validate, not a scientifically validated algorithm or Peak's proprietary formula.

## Accepted memory architecture

User accepted the conditioning APK patterns on 10 October 2026. Supabase will hold shared athlete history; the APK will save locally first, retain a native backup and queue writes for retry. Actual completed records remain separate from recommendations and e1RM estimates. Keep the existing app appearance and silent recommendation flow.

Reuse existing strength schema concepts: assigned_session, performed_set and performed_measurement. The repository already defines client-generated set IDs for offline-first upserts, and athlete ownership through session RLS. This is source-schema evidence, not verification of the live deployed database or current logger wiring.

Extend only where necessary for effort categories, ramp/working purpose, incomplete outcomes, edit revisions and deletion state. Existing performed_set status accepts completed/skipped/not_reached; partial failure needs an explicit representation. Keep derived session/rolling estimates linked to their source set IDs and revisions, with a rule version. working_max_event is an append-only ledger with a single from_set_id and restricted formula values: it needs a deliberate compatibility design for multi-set/three-session estimates and correction invalidation rather than overwriting historical events.

Use stable IDs, atomic idempotent writes and explicit conflict rules so sync retries cannot count a set twice. Edits/deletions invalidate dependent estimates and rebuild recommendations. Reconcile local pending records with cloud history before computing final server results. Sharing a Supabase project does not itself implement cross-app recovery reads; define a small conditioning-summary read contract under the same athlete identity.

Implementation sequence: inspect deployed schema and logger wiring; add compatible memory fields and write contracts; implement local queue/native backup/reconciliation; test offline/retry/edit/delete/account isolation; connect the deterministic strength calculations. Recovery thresholds remain a later module decision. No APK or database changes have been made by accepting this design.

## 1. Interpret effort

| Slider | Athlete meaning for lifts | Internal estimate |
|---|---|---|
| Very Easy | Very light effort | No precise RIR; directional evidence only |
| Easy | About 5–7 more clean reps | 6 RIR, low confidence |
| Average | About 3–4 more clean reps | 3 RIR |
| Hard | About 1–2 more clean reps | 1 RIR |
| Max Effort | No more clean reps | 0 RIR |
| Did Not Complete | Missed the prescribed reps | Separate completion outcome; record actual reps |

RIR means repetitions in reserve. The point values deliberately use the lower end for Average and Hard to avoid inflated capacity estimates. They are approximations of broad categories. Do not interpolate a continuous slider into fractional RIR or present these categories as exact RPE numbers. Peak's screenshot RPE bands differ from the conventional RIR-based scale.

For holds/carries the same labels mean general effort. Do not convert their effort into extra reps, seconds or metres. Incomplete sets cannot earn progression or establish our strength baseline.

## 2. Starting weight

Priority: comparable exercise history first; an estimate only when history cannot answer the new prescription; athlete-entered comfortable weight when neither exists.

Same exercise and same rep range: reuse the calibrated working load, plus an increase only if earned under rule 4. Do not raise it simply because an e1RM number rose.

Different rep prescription, with a usable strength estimate:

    suggested load = rolling e1RM / (1 + (target reps + target RIR) / 30)

Use the lower rep boundary as the initial target, e.g. 6 for 6–8, and the brain's intended effort. This inverse formula is a heuristic, particularly when the total of reps and RIR exceeds 12. Outside that provisional envelope, use comparable history or athlete input rather than invent precision.

No evidence: the athlete supplies a comfortable first ramp load. Never assign everyone 10 kg. Two ramps are enough; uncertain calibration can continue across future sessions. Manual load edits alone do not establish capacity.

History must match exercise/variation, equipment, units, load convention (e.g. per dumbbell), and prescription sufficiently to be comparable. Recent, unchanged history matters more than distant records. Do not silently transfer barbell estimates to machines or related variations. Assisted/bodyweight movements need their own model; do not treat zero external kg as zero total resistance.

## 3. Ramps and changes between sets

Known working load: start with two provisional ramps around 50% and 75% of that load, rounded to usable equipment. These percentages are simple defaults, not universal warm-up requirements. Minimum bar/machine loads can make a percentage impossible; never increase a ramp beyond the planned working weight just to fit them. Use the lower prescribed rep boundary. Accessories usually have no automatic ramps.

Unknown load: keep the athlete's comfortable start and use small equipment steps. Do not jump to a formula-derived working weight from one Easy ramp. Allow up to one available upward step after an Easy/Very Easy ramp only if it is no more than 10%; otherwise hold. At most two ramps; the first working set can continue calibration. A user can manually choose a different weight.

For eligible working-set observations:

    raw next load = actual load ×
        (30 + actual reps + actual RIR) /
        (30 + next target reps + next target RIR)

This follows the same Epley-style model as rule 5. It considers the next set's planned difficulty, not just the previous slider label. Within the same effort category and rep target, hold rather than treating a category midpoint as new evidence.

Provisional limits: at most +5% or −5% per normal working-set adjustment. Unexpected Max Effort or an incomplete set can reduce by up to 10%; they never trigger an increase. Very Easy supplies direction only: one upward equipment step, subject to the +5% cap. Easy observations can guide a capped adjustment but do not establish e1RM.

A planned Hard set following an actual Hard set can hold. A Hard rating is not automatically a reason to reduce. Ramping toward a harder planned set may allow an increase. Fatigue can also make the same weight feel harder; the system does not force every set to get heavier.

Ramps do not count toward working-set completion, progression or e1RM. Their feedback can adjust today's starting recommendation, but does not prove a permanent strength gain.

## 4. Next-session progression

For 3 × 6–8 at one working load:

- 8,8,8, all prescribed sets completed, no Max Effort/incomplete result: earn one smallest available load step.
- 6,6,6 at Average: hold. Six is valid, but the upper boundary has not been cleared.
- 8,8,7: hold.
- 8,8,8 with a Hard final set: progression can still be earned.
- Loads changed during the exercise: save the successfully calibrated load; do not add a progression bonus on top.

A skipped/deleted prescribed set does not count as a completed set. Correcting a logged set must recompute the recommendation from the full exercise record.

For calibrated mixed-load sessions, choose the final completed load that met the rep range at Average or Hard; if the final set was incomplete or Max Effort, fall back to the most recent successful suitable load. If none exists, retain a conservative starting recommendation without claiming successful calibration.

A proposed automatic increase greater than 10% is deferred rather than overriding the cap because equipment has coarse steps. This cap is a product default. The athlete can still edit the load. Equipment options/microplates can solve an otherwise blocked progression.

Holds/carries: compare logged seconds/metres with the prescribed upper boundary. At 3 × 30–45 m, 40 m at Hard is valid and holds; completing 45 m across all sets can earn progression. Weighted carries increase load after clearing the range, preserving the range. Unweighted holds increase time only within the existing prescription; at its ceiling hold until the prescription changes. Change one variable at a time. No e1RM for either.

## 5. Strength estimate

Choose Epley as the initial common model, with an explicit effort adjustment:

    effective reps = completed reps + estimated RIR
    set e1RM = load × (1 + effective reps / 30)

For a completed single with zero RIR, use the actual load rather than adding Epley's 3.3% uplift.

Adding RIR is our heuristic extension. Original prediction equations use repetitions to fatigue; they were not validated against this five-category slider. Do not describe our estimate as a measured maximum.

Provisional eligibility:

- An ordinary completed working set from a supported loaded repetition exercise.
- Actual reps from 1 to 10 and effective reps no greater than 12.
- Average, Hard or Max Effort feedback; Easy/Very Easy are too uncertain for the baseline.
- Valid comparable units/equipment and actual weight and reps; no ramp, failed set, carry, hold, assisted/bodyweight estimate, or edited-but-uncompleted set.
- Explosive/technical exercises should use their own logged history until a suitable model exists.

    session estimate = highest eligible set estimate
    rolling estimate = arithmetic mean of latest 3 eligible session estimates

Use the available one or two sessions while history builds, with lower internal confidence. Missing eligible evidence means no update, not zero. Edits/deletions recalculate affected sessions. A large unexpected increase is retained as provisional evidence and must be repeated before it influences an automatic load increase; do not silently erase it as an error. Starting estimates never manufacture PRs before completion.

Example: 40 kg × 8 at Hard (1 RIR) gives 40 × (1 + 9/30) = 52 kg estimated capacity. That is a planning estimate, not evidence the athlete can definitely lift 52 kg once.

The three-session mean stabilises trends but can lag real changes. Keep starting-load and earned-progression rules separate so averaging does not automatically push weights up or suppress a completed progression.

## 6. Equipment rounding

Represent available loads explicitly, including machine stacks, bars plus plate combinations, per-hand dumbbells, and kg/lb conventions. Do not apply a universal +2.5 kg step.

Select the nearest available load to the proposed value that respects the relevant cap and direction. On ties choose the lower load. For a requested reduction choose a lower available load; if no lower load fits the cap, use the nearest lower option and record that the equipment forced a larger reduction. For an increase with no allowed upward option, hold. Never round an increase beyond its cap.

Example: 31 kg × 5 at Easy, next target 5 at Average:

    raw = 31 × (30 + 5 + 6)/(30 + 5 + 3) = 33.45 kg
    upward cap = 31 × 1.05 = 32.55 kg

With whole-kg options, recommend 32 kg. With 0.5 kg options, 32.5 kg is possible. This is a worked example of OUR proposed model; it does not reverse-engineer Peak. A 4 kg to 6 kg dumbbell jump is 50%, so the automatic recommendation holds.

## Recovery stays deliberately simple

WHOOP/heart-rate zones alone do not change weight or e1RM. A recent demanding conditioning session plus athlete-reported fatigue may lower today's starting weight by one equipment step; actual ramps/working performance has the final say. Do not multiply an arbitrary recovery percentage into measured strength.

The exact definition of recent/demanding still needs a separate recovery-module decision. None of the sources below establishes a universal heart-rate-zone-to-strength-load conversion.

## Before implementation

Validate the proposed defaults with recorded-session simulations: 6 at Average holds; 8,8,8 earns a step; 8,8,7 holds; intended Hard is not penalised; unexpected Max/incomplete cannot increase; no-history uses only two ramps; coarse equipment never bypasses upward caps; weight edits recompute; mixed-load calibration gets no extra bonus; holds/carries never get e1RM; recovery cannot rewrite the strength baseline.

These are planned checks, not tests already run on an implemented brain. The app and APK remain unchanged by this research.

## Sources and what they establish

1. [Helms et al., 2016: Application of the Repetitions in Reserve-Based Rating of Perceived Exertion Scale](https://pmc.ncbi.nlm.nih.gov/articles/PMC4961270/). Full text read via Europe PMC. Supports using RIR alongside training evidence and notes greater accuracy near failure and experience limitations. Does not validate our slider midpoints or exact load caps.
2. [ACSM Position Stand, 2026: Resistance Training Prescription for Muscle Function, Hypertrophy, and Physical Performance in Healthy Adults](https://pmc.ncbi.nlm.nih.gov/articles/PMC12965823/). Full text read via Europe PMC. Synthesises 137 reviews and more than 30,000 participants; updates 2009 guidance. Supports progressive training and individualisation; training to failure does not consistently improve outcomes. Does not prescribe one adaptive-app algorithm.
3. [LeSuer et al., 1997: Accuracy of Prediction Equations for Estimating 1-RM Performance in Bench Press, Squat and Deadlift](https://doi.org/10.1519/00124278-199711000-00001). [Accessible paper](https://dyrts.fr/fr/files/1RM_estimation.pdf), first-page abstract and formula table read using OCR. Compared seven equations in 67 untrained students; high correlations still accompanied systematic exercise-specific errors. Supports treating Epley as an estimate, not ground truth.
4. [Peak: How should I rate the difficulty of sets?](https://intercom.help/peak-strength/en/articles/10022478-how-should-i-rate-the-difficulty-of-sets). Explains set-by-set adjustments and explicitly says a Hard rating may still be followed by an increase in a ramping workout. The exact formula is not disclosed.
5. [Peak: Estimated 1 Rep Max versus 1 Rep Max](https://intercom.help/peak-strength/en/articles/15656862-what-s-the-difference-between-an-est-1-rep-max-and-a-1-rep-max). Describes a best-set estimate per workout and averaging recent evidence; does not disclose our exact Epley/RIR formula or a three-session window.

Our defaults are recommendations to implement and validate, with evidence boundaries documented above.
