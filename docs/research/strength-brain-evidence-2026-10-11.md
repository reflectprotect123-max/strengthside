# Strength brain: evidence, decisions and validation plan

11 October 2026, Australia/Sydney. Research and design only. No app, APK, Supabase or Capgo changes.

## Recommendation

Build a small deterministic load engine around **the authored set target, actual completed performance, effort feedback and available equipment**. Use RTS as an initial lookup, then give comparable personal history increasing influence. Keep calibration separate from ordinary progression. Do not average three strength formulas, infer max attempts from a one-rep target, or invent a universal conversion between exercises.

The builder defines the workout; the brain chooses reasonable loads and adjusts them. A prescription such as 5/3/1, 12/10/8, 8/8/8 or individual rep ranges is data, not a hardcoded routine. The athlete keeps the existing logger, numeric editor and effort slider. No target-effort or weight-increment boxes are needed in the builder. Internal confidence and explanations can be stored for debugging without showing flags to the athlete.

The earlier simulations are useful fault-finding tools, but do not validate this design for real lifters. Improving their assumptions is a prerequisite to tuning the brain.

## What the evidence establishes

| Question | Evidence | Consequence for our design |
|---|---|---|
| Can a percentage table select loads? | RTS supplies a practical reps/RPE/% lookup [1]. Nuzzo's meta-regression found substantial individual variation and exercise differences, including bench versus leg press [2]. | Use a table as a starting estimate, not ground truth. Personalise by exercise. |
| Is effort useful? | RIR-based autoregulation is a recognised method [3,4]. Prediction accuracy is imperfect and generally better near failure or with fewer repetitions; experience alone does not guarantee accuracy [5]. | Keep the slider, reduce influence of very easy/high-rep observations, and avoid exact estimates from vague labels. |
| Does every set need failure? | ACSM's 2026 overview found failure did not consistently improve outcomes [6]. Other analyses suggest proximity to failure can matter more for hypertrophy than strength, with limitations in estimated RIR [7,8]. | Do not automatically request Max Effort. Respect an explicitly authored failure AMRAP, rather than manufacturing one. |
| Must progression always add weight? | A trial comparing repetition and load progression found both viable over eight weeks [9]. | For ranges, more reps at the same weight can be progress. Equipment gaps need not force a heavier load immediately. |
| Does rest matter? | The rest-interval review describes performance/volume implications and uncertain differences in long-term hypertrophy [10]. | Record rest context; do not interpret performance after short rest as a precise fresh-strength decline. There is no universal rest-to-1RM correction. |
| Can we copy Peak's formula? | Peak documents rating-based next-set changes, planned ramps, and recent exercise estimates [11,12], but not its exact coefficients. | Borrow the interaction pattern. Our maths must be independently designed and tested. |
| Is there a proven first-session kg default? | Beginner guidance recommends starting light and working toward a manageable effort [13]. Fitbod says new exercises start conservatively without publishing its cold-start formula [14]. | Exercise-specific starter weights are product assumptions. There is no evidence supporting one exact kg value for all users. |

**Important evidence boundary:** studies of training adaptations do not prove the correctness of a next-set algorithm. A percentage table is not a measurement of today's strength. A synthetic model does not demonstrate real-world safety or training effectiveness. No source establishes our earlier 5/15/25% caps, two-session equipment exception, 25% smoothing factor, starter table or guaranteed calibration after X sessions.

## Eight modules to design

### 1. Understand the prescription

**Keep:** unrestricted authored rep targets and ranges; the existing set logger and metrics.

**Improve:** store a target per set, with a stable set ID, set purpose and optional load-reference rule. Separate prescription from actual reps. The prescription cannot be replaced by what the athlete happened to achieve.

Required meanings:

- Fixed reps: 5, 3, 1 or any positive authored target.
- Range: 6–8 or any valid ordered range, independently per set.
- Warmup: preparation and calibration; not a working set or progression achievement.
- Working set: contributes evidence according to its quality and context.
- AMRAP: open-ended repetitions; failure is a separate authored intent.
- First-set-last load: a reference to the first actual **working** set, not a warmup and not its original suggestion.

Fewer planned reps usually permit a heavier suggestion at similar effort. Fewer **achieved** reps than prescribed do not imply readiness for more weight. A one-rep target is not automatically a max attempt. Do not recognise 5/3/1 as a branded programme merely because those numbers appear.

For a range, the lower boundary is the minimum intended completion, and the upper boundary is the normal progression gate. Start with comparable range history when available; the chart's initial target is a provisional design choice. Do not silently convert a range into a permanent fixed count or increase load merely for reaching its lower end.

### 2. Starting load and equipment

**Decision:** same-exercise, matching equipment/load convention history first; a conservative starter when absent. Use a personal cross-exercise relationship only if paired athlete results support it. A generic barbell-to-dumbbell multiplier stays out of version one.

History matching must include exercise variation, equipment, unit, per-hand versus total load, assistance versus external resistance, rep target and record validity. Decline confidence after absence rather than deleting evidence or applying an unsupported universal decay percentage.

**Agreed dumbbell ladder, per dumbbell:** 1–10kg in 1kg steps, then 12.5, 15, 17.5, 20kg and subsequent 2.5kg steps. Athlete-entered 18kg is a valid actual observation. That alone does not reveal the entire gym rack; a known custom rack can override the default.

Barbells, machines, cables, assisted exercises and adjustable dumbbells cannot share that ladder. Total bar weight includes the bar. Unknown machine-stack labels are not automatically kg. Do not prescribe an empty 20kg bar without knowing that equipment exists and the athlete can manage it. An unknown minimum needs equipment information or an athlete override; an unmanageable minimum must not be repeated automatically.

The tested starter table remains provisional: lateral raise2kg; curl4kg; dumbbell bench5kg; overhead press4kg; row6kg; goblet squat6kg. Barbell defaults10–15kg apply only where such equipment exists. These values are candidates, not settled universally appropriate defaults.

### 3. Calibration and confidence

**Decision:** two warmups, then continue learning through working sets and future sessions. Do not guarantee complete calibration after two warmups or three sessions.

Calibration should remember that the previous load was still too light. It should not start again from the original default each visit. Distinguish confidence in the starting load from confidence in an e1RM number.

Low confidence must **not** mean unconditional larger jumps: confidently completed easy repetitions can justify a faster search; weak or conflicting evidence cannot. Equipment-aware absolute steps and relative limits both matter. Calibration should slow down near intended effort and resume when returning after a long absence or switching equipment.

Warmup feedback is useful for today's load but weaker evidence of fresh maximum strength. Our startup experiment used ten-rep warmups to avoid assuming five easy reps guarantee ten manageable reps. That creates extra fatigue and is not a final warmup prescription. Compare low-rep versus matched-rep warmups explicitly, including fatigue.

### 4. Effort and next-set calculation

Keep plain labels. Model them as uncertainty bands:

| Label | Meaning for ordinary lifts | Proposed internal treatment |
|---|---|---|
| Very Easy | Very light effort | Direction only; no exact RPE/% estimate |
| Easy | Roughly5–7 clean repetitions left | Direction, low confidence; outside the chosen RTS chart's range |
| Average | Roughly3–4 repetitions left | RPE approximately6–7; chart-based interval or conservative point, not falsely precise |
| Hard | Roughly1–2 repetitions left | RPE approximately8–9; stronger evidence but still a band |
| Max Effort | No further clean repetitions possible | ApproximatelyRPE10 only when actual form/completion supports it |
| Did Not Complete | Prescribed minimum not achieved | Separate outcome, with actual reps including zero |

The current app/simulator uses Average≈RPE7 and Hard≈RPE9. That is a simplification, not a validated conversion. Preserve the visible meanings, version the interpretation, and compare point versus interval handling before choosing coefficients.

For chart-supported sets:

    observed set estimate = actual load / percentage(actual reps, reported effort)
    next raw load = today's estimate × percentage(next target reps, intended effort)

The estimate update needs bounded influence and record-quality weighting. Easy is not a precise chart observation. The planned rep change and effort correction must flow into **one** next-load calculation, followed by equipment rounding and outcome checks. Do not independently add a rep-change increase and an Easy increase.

Treat failure/zero reps before ordinary positive-rep estimation. Respect authored AMRAP references before normal ramp calculations. The load reference must not be overridden by Easy feedback on an earlier heavy set.

Start with conservative internal effort for ordinary work and allow fatigue-aware variation. Do not mandate a universal 7/8/9 schedule; it is a simulator candidate. Brain-selected effort should remain silent. Automatic max-test scheduling stays out.

### 5. Session fatigue, rest and recovery

**Decision:** separate today's capacity from longer-term strength. Let unexpectedly difficult sets reduce today's recommendations without immediately rewriting the athlete's baseline downward.

Record set order, previous work, exercise order, superset context and available rest evidence. Keep the agreed timer behaviour: chosen rest starts automatically when a set is logged; moving exercises resets its context.

The chosen timer duration is not proof of actual rest. Time between two logged sets also contains lifting, editing and interruptions. Store the distinction between requested rest, timer activity and an actual start timestamp if available. Missing rest remains unknown; do not fabricate a physiological measurement.

Short rest, accumulated fatigue and changed technique may explain fewer reps. Avoid exact multipliers pretending to turn any of those into a known 1RM loss. Conditioning/WHOOP may later provide context, but sleep/recovery scores do not supply a proven kg adjustment. Keep that extension parked until the strength engine works reliably.

### 6. Memory, estimates and next-session progression

**Keep:** local-first actual records, queued Supabase synchronization, stable identities, explicit revisions/deletions and account isolation.

Every completed set is stored, but not every record gets equal influence on fresh-strength estimation. Distinguish actual performance, historical PR, current estimate, session adjustment and next suggestion. A manual weight edit alone is not a completed lift.

Start with clean early working sets as fresh evidence. Later sets can contribute when their context is comparable; do not discard them permanently or treat every fatigued set as a new maximum. Compare recent weighted median versus smoothed estimates and avoid taking the largest noisy estimate simply because it is the best-looking number.

For same-weight rep ranges, reaching the upper boundary on all prescribed working sets with acceptable effort can earn the next equipment step. Reaching only the lower boundary does not. Separate underload calibration from ordinary progression: a clearly miscalibrated easy load may need correcting before an ordinary range progression gate is satisfied.

For different set targets/weights, progression uses each set's target and whole-session completion. The fixed-weight 3×8 rule cannot be applied blindly to5/3/1 or a ramp plus first-set-last AMRAP. Distinguish a next-workout suggestion from an instruction to rewrite an already active workout.

Derived estimates must reference source set IDs, revisions and rule version. Retried sync cannot count a set twice. Editing/deleting evidence rebuilds affected estimates. A new model version must not reinterpret old data invisibly. Missing/old/contradictory evidence should lower confidence without creating a fake PR or wiping personal history.

### 7. AMRAP, high reps and other metrics

**AMRAP:** use the actual first working-set weight. Store achieved reps and actual effort. AMRAP is not automatically failure unless authored that way. Compare equivalent final sets with similar prior work/rest. Initially keep a fatigued final AMRAP out of direct fresh-e1RM updates; use it as programme-specific performance evidence.

An authored5/3/1+AMRAP and10/8/6+AMRAP both work. If the referenced first set is skipped, invalid or deleted, do not invent a load. Recomputing an unperformed AMRAP can reflect an edited first load; edits after AMRAP completion must not overwrite the weight already lifted.

**High reps:** the chosen RTS chart covers1–12 reps andRPE6–10. Builder targets must not be restricted to that domain. Above it, use comparable history and conservative effort-based steps without precise RTS e1RM. Do not clamp20 prescribed reps to12. Validate long ranges and bodyweight/assisted/power movements separately.

**Holds/carries:** retain existing metric logging; no rep-based e1RM. A future hold-duration or carry-distance/load engine is separate. Neither increasing every metric at once nor inferring a target range as a new metric is necessary. This remains out of the current brain implementation.

### 8. Validation and release

No further Capgo publication until the agreed implementation is complete and tested. Research, simulator results, actual app implementation and deployment are different states. This packet completes research planning; it does not implement these modules.

## What our existing simulations actually show

| Experiment | Coverage | Useful finding | Material limitation |
|---|---|---|---|
| Main brain |64,800 sessions /194,400 work sets;100,000 randomized transitions |No upward-cap/AMRAP-link violations, but too many modeled misses; gentler early effort helped |Fixed10/8/6 only; simple athlete models; no actual AMRAP performance or rest-dependent fatigue |
| Startup |18,000 first-session athletes |Conservative starters substantially underload stronger athletes and still overshoot some weak athletes |Assumed strength populations; warmup fatigue absent |
| Related transfer |5,000 modeled athletes |Universal barbell-to-DB conversion depends heavily on individual transfer ratio |Distribution assumed, not measured |
| Paired equipment exception |2,000 identical athletes per policy,12 sessions;72,000 working sets per policy |Underloaded after12 sessions fell75.4%→0.2%, while misses rose4.0%→5.4% |Truthful ratings;3% working-set fatigue; no warmup fatigue; no holdout tuning |

These are reasons to improve the design, not real-world rates or assurances. An invariant such as “no jump above15%” can pass while load selection is poor. A1kg increment at1kg is a100% relative jump; our small-load exception must not be described as obeying the ordinary percentage cap.

## Required next simulations

Run these as explicit experiments before integrating production maths. Keep the earlier version as a baseline, with seeded paired athletes and a separate holdout seed/population. Do not tune and claim success on the same synthetic cases.

| Experiment | Vary | Measure / decision |
|---|---|---|
| Arbitrary prescriptions |5/3/1,12/10/8,8/8/8,6/10/15,mixed ranges,1–30 reps,1–6 sets |Correct target interpretation; no automatic max attempt; no out-of-domain chart lookup |
| Cold start |Weaker than equipment minimum through highly trained; defaults at several scales |First-set misses, underloading, time to appropriate load; no universally assumed starter |
| Calibration search |One step, percentage-only, absolute+relative bound, evidence-earned step |Convergence without oscillation/runaway; performance trade-offs by subgroup |
| Misrated effort |Optimistic/pessimistic bias, occasional incorrect ratings, drifting bias |No inflated estimates from isolated Easy; misses and corrections after conflicting evidence |
| Warmups |Two sets with lower versus matched reps, different rest and fatigue |Readiness information versus added fatigue; no claim that low-rep ease establishes high-rep capacity |
| Equipment |AgreedDB ladder,custom18kg,bar weight,coarse stack,assistance,unit/convention changes |Only valid suggestions; large gaps do not stall forever or force unearned jumps |
| Rest/order |30–300s rest,unknown rest,interruptions,supersets,exercise order |Avoid permanent strength reduction for contextual fatigue; first/session estimates remain distinct |
| AMRAP |Different preceding targets,rest,fatigue;technical versus muscular failure |Actual linked weight; achieved-rep forecasting; comparison of genuinely comparable sequences |
| Evidence models |RTS versus independent athlete curves, exercise-specific endurance, broad random variation |Load-selection error across models; no testing only against the formula used by the brain |
| Longitudinal |1–50 exercise exposures,absence,illness-like temporary dip,strength gain/plateau |Calibration persistence,return handling,drift,stability; no guaranteedX-session promise |
| Estimate update |Recent median versus smoothing;outliers,late fatigue,low-rep noisy reports |Current estimate stability and recommendation quality; estimates are not just inflated PRs |
| Record replay |Duplicate/offline/out-of-order writes,edit/delete/recreate,account switch |No double learning,wrong owner,stale AMRAP reference,or lost actual records |

## Tests that must run in the real app

After simulation gates, exercise the actual builder→calendar→logger→summary→memory flow with arbitrary targets and ranges. Verify all selected metrics still log; the first set is never silently turned into AMRAP; the last reference uses actual logged load; zero-rep misses work; numeric editor semantics remain shared. Check rest auto-start/reuse/reset, active-session snapshots and app-update preservation.

Test offline completion, reopening the APK, syncing twice, cloud reconciliation, evidence edits/deletions and athlete switches. Do not confuse a JSON serialization test with Supabase sync validation. Supabase tests must confirm persisted records/derived invalidation and isolation, not merely HTTP success.

Then run Playwright against staged release assets and an Android smoke test. A live authenticated WHOOP test is a separate integration check, not necessary evidence for the RTS maths. No release until implemented behaviour matches the agreed specification and material unresolved failures are documented/resolved.

## What requires further investigation rather than an invented rule

1. Exact cold-start weights by exercise/equipment and how weaker athletes handle minimum loads. Our table is not validated.
2. The best balance between fast calibration and equipment jumps under optimistic reporting. The current exception solves stalling but worsens misses.
3. How much personal data justifies changing the RTS relationship for an exercise. Do not promise a fixed calibration count.
4. How to learn slider bias without making users perform regular failure tests. Reported effort alone cannot identify its own systematic error.
5. How to use later/fatigued sets without corrupting fresh estimates. Rest duration is often incompletely observed.
6. Whether a high-rep alternative table improves predictions enough to justify added complexity. Nuzzo supplies useful population comparisons, not a ready-made per-athlete RPE algorithm.
7. When personal related-exercise transfer is reliable enough to use. No universal multiplier for bench/squat/row variations.
8. How explicit failure AMRAP should influence next-session progression after different preceding work. Comparable history is needed.

These need sensitivity analysis followed by small real-world observations across different strength levels and equipment. Shadow mode can compare suggestions to athlete-selected loads before automatic recommendations control workouts. A pilot can test usability/selection quality; it cannot quickly prove long-term superiority.

## Priority and implementation order

1. **Write the set/evidence contract:** arbitrary targets,units,purpose,outcome,load references,actual versus prescribed values.
2. **Settle equipment and starter rules:** conservative defaults,known minima,manual overrides,no universal transfer.
3. **Improve simulator and choose calibration rules:** arbitrary plans,rest/warmup fatigue,noisy effort,holdout evaluation.
4. **Implement a single RTS decision path:** interval-aware effort,bounded correction,failure override,outside-chart fallback.
5. **Wire logger and memory:** current-session state,derived-record provenance,idempotentSupabase sync,edits/deletions.
6. **Add progression and AMRAP semantics:** ranges,planned ramps,evidence-earned steps,actual first-weight reference.
7. **Complete browser/backend/Android verification and a practical pilot.** Publish Capgo only after the agreed work is finished and tested.

Keep the existing visual design,slider,manual override,local-first memory and silent recommendations. Defer LLM load selection,automatic max testing,generic cross-exercise conversions,WHOOP load multipliers,holds/carries progression and continuously learning complex models. Fewer hidden interacting rules will make this easier to trust and debug.

## Release gates

**Software:** zero wrong-target,wrong-unit,wrong-owner,duplicate-learning and corrupted-reference errors in deterministic/fuzz/replay checks. Every reduction/increase has a stored internal reason and rule version. Unsupported chart targets still log correctly.

**Recommendation quality:** candidate improves calibration/stalling against the current baseline without masking worsened miss rates in weaker/noisy-reporting cohorts. Measure individual groups as well as totals, and evaluate on holdout scenarios. Trade-offs such as the observed75.4%→0.2% underloading versus4.0%→5.4% misses are not a pass merely because the first number improves. Thresholds are engineering/product choices, not established by a research paper.

**Integration:** builder/logger/calendar/history/Supabase reflect the same prescription and actual records; offline/reload/edit flows are correct; Android installation and update preserve state. No promises of perfect load selection or guaranteedX-session calibration.

## Sources and access

Studies searched via EuropePMC and saved alongside this packet. Full-text XML and targeted body sections inspected where available; abstract-only access is identified below. This is a targeted evidence review, not a preregistered systematic review. Unrelated search results and preprints were excluded from the recommendations. General healthy-adult evidence does not validate specialised injury rehabilitation,children's programming,Olympic-lift loading or every machine variation.

1. **RTS lookup and attribution:** [calculator](https://www.rpecalculator.com/), [attribution](https://www.rpecalculator.com/about.html), [table source](https://www.rpecalculator.com/rpe_calc.js). Practical published chart; not a universal individual-validation study.
2. **Nuzzo et al.,2024:** [Maximal Number of Repetitions at Percentages of1RM](https://pmc.ncbi.nlm.nih.gov/articles/PMC10933212/). Full text/limitations inspected;269 studies,7,289 individuals. Supports population variability and exercise-specific caution.
3. **Helms et al.,2016:** [Application of the RIR-Based RPE Scale](https://pmc.ncbi.nlm.nih.gov/articles/PMC4961270/). Full text inspected. Method/practice guidance,not validation of our label conversion or caps.
4. **Greig et al.,2020:** [Autoregulation in Resistance Training: Addressing the Inconsistencies](https://pmc.ncbi.nlm.nih.gov/articles/PMC7575491/). Full text inspected. Helps distinguish longer-term adaptation from short-term readiness/fatigue.
5. **Halperin et al.,2022:** [Accuracy in Predicting Repetitions to Task Failure](https://doi.org/10.1007/s40279-021-01559-x). Detailed abstract inspected;13 publications/12 studies/414 participants in meta-analysis. Imperfect predictions,substantial heterogeneity;experience not a reliable guarantee of accuracy.
6. **ACSM Position Stand,2026:** [Resistance Training Prescription overview](https://pmc.ncbi.nlm.nih.gov/articles/PMC12965823/). Full text and abstract inspected;137 reviews/>30,000 participants. Broad training guidance,not adaptive-app validation.
7. **Refalo et al.,2023:** [Proximity-to-Failure and Hypertrophy](https://pmc.ncbi.nlm.nih.gov/articles/PMC9935748/). Full text inspected;definitions and methodological limitations matter.
8. **Robinson et al.,2024:** [Proximity-to-Failure Dose–Response Meta-Regressions](https://doi.org/10.1007/s40279-024-02069-2). Detailed abstract inspected. Exploratory RIR estimates and modest model fit;does not justify prescribing failure on all sets.
9. **Plotkin et al.,2022:** [Progressive overload without progressing load?](https://pmc.ncbi.nlm.nih.gov/articles/PMC9528903/). Full text/limitations inspected;43 trained participants,8 weeks,lower-body programme. Supports reps as one progression option,not a universal algorithm.
10. **Singer et al.,2024:** [Give it a rest](https://pmc.ncbi.nlm.nih.gov/articles/PMC11349676/). Full text retrieved,abstract inspected;9 studies. Rest matters,but exact per-athlete fatigue correction is not supplied.
11. **Peak official help:** [Difficulty slider](https://intercom.help/peak-strength/en/articles/10022478-how-should-i-rate-the-difficulty-of-sets). Page read. Documents actual interface and planned ramps,not disclosed maths.
12. **Peak official help:** [Estimated1RM versus repmax](https://intercom.help/peak-strength/en/articles/15656862-what-s-the-difference-between-an-est-1-rep-max-and-a-1-rep-max). Page read. Describes recent-performance estimates,variation handling and separate PRs;no exact coefficients.
13. **Barbell Medicine:** [Beginner Prescription](https://www.barbellmedicine.com/blog/the-beginner-prescription/). Starting-load guidance inspected. Light start toward manageable effort;no exercise-specifickg lookup.
14. **Fitbod official help:** [Sets,reps and weight recommendations](https://help.fitbod.me/hc/en-us/articles/43489869175063-How-does-Fitbod-decide-my-sets-reps-and-weight). Page retrieved and relevant explanations inspected. Conservative unfamiliar-exercise starts;proprietary algorithm.

Current source inspected: `/workspace/strength-merge/apps/athlete/strength-brain.js` and shared effort mappings. The current engine remains an Epley/RIR-style heuristic with page-level targets; it is **not** this proposed per-setRTS implementation. Earlier `docs/brain/strength-brain-design.md` reflects a previous design;this packet records the updated research recommendation without modifying the app or those historical documents.

Simulation artifacts: `/workspace/strength-brain-simulator/REPORT.md`, `STARTING-WEIGHTS.md`, `simulate.mjs`, `startup.mjs`, `results.json`, `startup-results.json`.
