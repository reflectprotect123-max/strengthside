# THE Hybrid Engine — PubMed/RP validation review for strength and hypertrophy

**Research date:** 25 August 2026  
**Purpose:** distinguish what resistance-training evidence supports from what MacroFactor Workouts and RP Hypertrophy claim as product behaviour.

## Executive conclusion

The proposed strength system should not optimise one number. It should protect three outcomes:

1. lift-specific strength performance;
2. muscle growth and recoverable volume;
3. long-term training continuity and safety.

MacroFactor Workouts and RP Hypertrophy provide useful coaching precedents, but their private algorithms are not clinical or independent scientific validation. The Hybrid Engine must validate its own progression accuracy, volume recommendations, fatigue handling and subgroup performance.

## 1. Loading: strength and hypertrophy are not the same target

A systematic review/meta-analysis found greater 1RM strength gains with high-load versus low-load training, while hypertrophy was similar across loading ranges when sets were taken to failure. A separate load-effects review reached the same practical boundary: strength is more load-specific, while hypertrophy can be achieved across a broad range. [Low/high-load meta-analysis — PMID 28834797](https://pubmed.ncbi.nlm.nih.gov/28834797/) · [Load-effects meta-analysis — PMID 33433148](https://pubmed.ncbi.nlm.nih.gov/33433148/)

**Design decision:**

- strength mode must include heavier, technically consistent practice of the target lift or close variation;
- hypertrophy mode can use a wider rep range and more exercise variation;
- hybrid mode reserves high-quality fatigue for key lifts and uses RP-style volume progression for accessories;
- a high-rep PR on a curl is not evidence of a stronger squat.

## 2. Proximity to failure and RIR

A 2024 meta-regression found that estimated RIR had a clearer relationship with hypertrophy than with strength; strength changes were similar across a broad range of estimated RIR, while hypertrophy tended to increase when sets ended closer to failure. The authors caution that RIR was estimated from study descriptions and the model fit was modest. [PMID 38970765](https://pubmed.ncbi.nlm.nih.gov/38970765/)

A 2023 systematic review/meta-analysis found no evidence that momentary failure was superior to non-failure training for hypertrophy, and a 2024 trained-participant trial found similar quadriceps hypertrophy at 1–2 RIR versus failure with more acute fatigue in failure conditions. [PMID 36334240](https://pubmed.ncbi.nlm.nih.gov/36334240/) · [PMID 38393985](https://pubmed.ncbi.nlm.nih.gov/38393985/)

**Design decision:** use RIR as a control and observation variable, not as a magical precise sensor. Most strength work should preserve technique and avoid routine failure. Hypertrophy accessories may approach failure where safe and recoverable.

## 3. Volume and frequency

Meta-analytic evidence supports a graded relationship between resistance-training volume and hypertrophy, but individual response and diminishing returns matter. Higher frequency can help distribute volume and may support strength, but frequency is not automatically better when adherence and recovery fall. [Weekly volume meta-analysis — PMID 27433992](https://pubmed.ncbi.nlm.nih.gov/27433992/) · [Strength frequency — PMID 29470825](https://pubmed.ncbi.nlm.nih.gov/29470825/) · [Hypertrophy frequency — PMID 27102172](https://pubmed.ncbi.nlm.nih.gov/27102172/)

RP’s MV/MEV/MAV/MRV model is a useful coaching representation of this dose-response problem. The evidence does not establish one exact number of weekly sets that is optimal or recoverable for every muscle and athlete.

**Design decision:**

- start with a prior volume based on training age, muscle, frequency and emphasis;
- update from performance, soreness, pump and workload feedback;
- keep direct sets and indirect exposure visible;
- add volume only when stimulus appears inadequate and recovery is acceptable;
- reduce or deload when performance and recovery decline together.

## 4. Periodization and deloads

A 2022 meta-analysis found periodized resistance training had an advantage for 1RM strength over non-periodized training when volume was equated, while hypertrophy differences were not clear. This supports a distinct strength-periodization layer rather than relying entirely on hypertrophy volume progression. [Periodization — PMID 35044672](https://pubmed.ncbi.nlm.nih.gov/35044672/)

Deloading is widely used in strength and physique practice, but the evidence base for the exact timing and size of a deload is limited and mixed. A one-week deload inside a nine-week study is not enough to justify a universal rule for all athletes. [Deloading review](https://pmc.ncbi.nlm.nih.gov/articles/PMC10511399/) · [Deload practice survey/review](https://pmc.ncbi.nlm.nih.gov/articles/PMC10948666/)

**Design decision:** offer scheduled deloads and an early-deload review. Do not present “week 4/5/6 deload” as physiology. Record whether the deload was scheduled, user-requested or triggered by performance/recovery evidence.

## 5. Autoregulation and RPE/RIR

RIR-based scales were developed to regulate resistance-training load and provide feedback during 1RM testing. RPE-based loading can be effective and may offer an advantage for some individuals, but it still depends on calibration, technical consistency and honest reporting. [RIR scale — PMID 26049792](https://pubmed.ncbi.nlm.nih.gov/26049792/) · [RPE versus percentage loading — PMID 29628895](https://pubmed.ncbi.nlm.nih.gov/29628895/)

**Design decision:** combine subjective RIR with objective reps/load and exercise-specific history. Missing or inconsistent RIR lowers confidence. Do not let a single subjective rating create a large program change.

## 6. Volume landmarks: product precedent versus evidence

RP’s public volume landmarks are best treated as priors and language for coaching decisions:

```text
MV -> maintain
MEV -> begin productive growth
MAV -> likely productive range
MRV -> upper recoverability boundary
```

They are not directly measured for every user in the app, and the complete muscle-specific coefficients are not published. Store:

```ts
landmarkSource: "rp_prior" | "user_calibrated" | "coach_override";
landmarkConfidence: "low" | "medium" | "high";
```

Never say the system has measured an athlete’s MRV from one hard week.

## 7. Safety and medical boundaries

The strength engine must distinguish:

- normal training fatigue;
- expected soreness;
- persistent performance decline;
- pain or injury concern;
- illness or systemic symptoms;
- possible low energy availability or disordered-eating concern.

Pain is not “bad RIR.” A lower load may be appropriate for a pain/technique reason, but the app should not diagnose the injury or automatically turn pain into a fatigue score. If the safety state is concerning, the program should hold aggressive progression and route the athlete to appropriate professional care.

## 8. Nutrition and recovery interaction

MacroFactor officially states that its Workouts and Nutrition apps are separate and do not automatically change one another. THE can intentionally share constraints, but it must not silently rewrite targets or completed results. [MacroFactor integration](https://help.macrofactorapp.com/en/articles/381-how-does-macrofactor-workouts-integrate-with-macrofactor-nutrition)

During a meaningful calorie deficit, worsening performance may be caused by fuel availability, sleep, stress, illness, exercise selection or accumulating training fatigue. The engine should request context before reducing load or adding volume.

## 9. Validation plan

### Criterion and performance validity

- compare key-lift estimates with standardised 1RM or rep-max tests;
- report bias, MAE, limits of agreement and test-retest reliability;
- separate load/reps recommendation accuracy from muscle-volume recommendation accuracy.

### Prospective training outcomes

- strength trend by lift;
- hypertrophy proxy where measurement quality is acceptable;
- completion and adherence;
- RIR calibration drift;
- time spent in pain/medical review;
- deload recovery response;
- manual override rate.

### Subgroups

Validate across beginners, intermediates, advanced lifters, different sexes, age, exercise types, equipment availability, session frequencies, occupations, nutrition phases and missing-data patterns.

## 10. What the research does not support

- a single universal MRV number;
- failure on every set as the best strength or hypertrophy method;
- using pump or soreness as a standalone muscle-growth meter;
- assuming RP Hypertrophy is a maximal-strength program;
- treating e1RM as true strength;
- using tonnage alone as training stimulus;
- an automatic deload after a fixed number of weeks for every athlete;
- an LLM making an unbounded set/load prescription;
- diagnosing injury, RED-S or any medical condition from training data.

## Additional agent PubMed pass

| Topic | Finding | Build consequence | Boundary |
|---|---|---|---|
| Strength specificity | Strength improves in trained and untrained tests, but transfer is smaller when the test is not the trained movement. [PMID 36396899](https://pubmed.ncbi.nlm.nih.gov/36396899/) | Maintain exercise-specific strength histories and stable anchor lifts. | Do not merge all variations into one e1RM. |
| Weekly volume | A 67-study meta-regression found more weekly sets predicted more strength and hypertrophy with diminishing returns. [PMID 41343037](https://pubmed.ncbi.nlm.nih.gov/41343037/) | Add volume gradually and learn the individual's response. | Not a universal set prescription. |
| Frequency | Hypertrophy evidence favours twice-weekly exposure over once-weekly in older meta-analysis evidence; strength benefits largely disappear when volume is equated. [PMID 27102172](https://pubmed.ncbi.nlm.nih.gov/27102172/) · [PMID 29470825](https://pubmed.ncbi.nlm.nih.gov/29470825/) | Use frequency to distribute volume and practice; default around two exposures where practical. | Allow one or three based on schedule and recovery. |
| Volume progression | Adding 4–6 sets every two weeks improved lower-body strength in trained males, while hypertrophy differences were uncertain. [PMID 37796222](https://pubmed.ncbi.nlm.nih.gov/37796222/) | Make set increases conditional and small. | Do not generalise an aggressive protocol to every muscle or user. |
| RIR autoregulation | RIR-based squat autoregulation improved strength more than fixed percentage loading in one trained sample. [PMID 31009432](https://pubmed.ncbi.nlm.nih.gov/31009432/) | Prefer observed performance plus RIR over stale percentages alone. | One exercise, male sample and modest duration. |
| RIR reliability | RIR is useful but not perfectly accurate. [PMID 36135029](https://pubmed.ncbi.nlm.nih.gov/36135029/) | Store confidence and an error band; calibrate over repeated sets. | Do not treat self-reported RIR as laboratory truth. |
| Deload practice | Competitive strength/physique athletes commonly deload for about six days every five to six weeks, reducing volume/load/effort. [PMID 38499934](https://pubmed.ncbi.nlm.nih.gov/38499934/) | Support a scheduled deload plus earlier evidence trigger. | Survey evidence does not establish causality or a universal interval. |
| Fatigue and overtraining | Definitions and markers remain poorly standardised. [PMID 31820373](https://pubmed.ncbi.nlm.nih.gov/31820373/) | Combine performance, RIR drift, sleep, soreness, motivation and adherence. | Never infer a medical state from one metric. |
| Exercise variation | Systematic variation may help regional outcomes, while random variation can impair progression. [PMID 35438660](https://pubmed.ncbi.nlm.nih.gov/35438660/) | Keep anchor lifts stable; rotate accessories deliberately. | Evidence base is small and narrow. |
| Validation | 1RM is generally reliable under standardised conditions; ultrasound thickness can be reliable, but other architectural measures are less consistent. [PMID 32681399](https://pubmed.ncbi.nlm.nih.gov/32681399/) · [PMID 38304420](https://pubmed.ncbi.nlm.nih.gov/38304420/) | Validate lift-specific e1RM and treat body measurements/photos as noisy secondary outcomes. | App logs alone cannot prove hypertrophy. |

### What remains uncertain

The evidence supports a transparent personalised v1, not a universal optimiser. Exact individual volume landmarks, fatigue thresholds, RIR error correction, exercise transfer coefficients and deload causality remain uncertain. These must be versioned hypotheses evaluated over rolling 6–12-week blocks, not presented as settled constants.

## Second deep-pass evidence additions

| Topic | Finding | Product implication | Confidence/boundary |
|---|---|---|---|
| Direct versus indirect sets | A 2026 meta-analysis classified sets by specificity and found the strongest relative evidence for fractional accounting: direct = 1.0, indirect = 0.5. [PMID 41343037](https://pubmed.ncbi.nlm.nih.gov/41343037/) | Store raw direct/indirect exposure and expose fractional volume as a policy view. | The 0.5 coefficient is not a universal biological law. |
| Load autoregulation | A 15-study review found autoregulated and standardised load prescriptions produced similar strength gains overall. [PMID 35038063](https://pubmed.ncbi.nlm.nih.gov/35038063/) | RIR/velocity systems should be treated as individualisation tools, not guaranteed superiority claims. | Evidence is heterogeneous. |
| Velocity loss | Lower thresholds around ≤25% favoured strength in one review, while >20–25% favoured hypertrophy partly through greater relative volume. [PMID 35038063](https://pubmed.ncbi.nlm.nih.gov/35038063/) | If velocity is measured, strength and hypertrophy modes may use different fatigue ceilings. | Device, exercise and protocol modify the result; do not infer velocity. |
| Concurrent training | A 59-study review found blunted lower-body strength adaptations in males but not females; hypertrophy evidence was insufficient for a firm sex-specific conclusion. [PMID 37847373](https://pubmed.ncbi.nlm.nih.gov/37847373/) | Track cardio modality/dose and lower-body performance; do not apply a blanket cardio penalty. | Training status, modality and sex matter. |
| Session order | A review found resistance-before-endurance improved lower-body dynamic strength versus the reverse order in pooled data, with no clear hypertrophy effect. [PMID 28917030](https://pubmed.ncbi.nlm.nih.gov/28917030/) | Prefer resistance first when lower-body strength is the priority and sessions must be combined. | Ten studies; not a universal rule. |
| Cardio modality | Concurrent-training reviews found whole-muscle hypertrophy often preserved, while running or HIIT may affect some lower-body/fiber outcomes more than continuous cycling. [PMID 22002517](https://pubmed.ncbi.nlm.nih.gov/22002517/) · [PMID 36508686](https://pubmed.ncbi.nlm.nih.gov/36508686/) | Use modality and dose as state inputs rather than a binary cardio flag. | Findings vary by outcome and study design. |
| REDs/LEA boundary | The IOC consensus describes problematic low energy availability as a complex continuum, warns against universal thresholds, and reserves diagnosis/risk stratification for clinical assessment. [PMID 37752011](https://pubmed.ncbi.nlm.nih.gov/37752011/) | Add a non-diagnostic fueling-safety review state; never calculate medical clearance. | A training app cannot diagnose REDs from food, weight or performance logs. |
| Individual response | Repeated-training studies show response variability and measurement error; a non-responder label should not be based on one variable or one short block. [PMID 37038845](https://pubmed.ncbi.nlm.nih.gov/37038845/) · [PMID 39958513](https://pubmed.ncbi.nlm.nih.gov/39958513/) | Require repeated standardised blocks and measurement-specific error before declaring no response. | Evidence is still developing and mostly not app-based. |

### What this changes

The app should become more context-aware, not more aggressive. New data fields should mainly prevent false certainty: direct/indirect exposure, cardio modality and timing, optional velocity quality, fueling-safety state, and measurement error. The controller should respond to repeated patterns, not punish one run, one low-rep set, one noisy body measurement or one day of low appetite.

## Third evidence lane — newer training-control findings

| Topic | New finding | Build change | Limitation |
|---|---|---|---|
| Broad programming evidence | The 2026 ACSM position stand synthesised 137 systematic reviews and over 30,000 participants: strength generally benefited from heavier loading, full ROM, 2–3 sets, early exercise placement and at least twice-weekly exposure; no consistent universal advantage was found for failure, equipment type, tempo, complexity, set structure or periodisation. [PMID 41843416](https://pubmed.ncbi.nlm.nih.gov/41843416/) | Protect heavy anchor work and early exercise order in strength mode; do not hard-code failure, tempo or equipment bonuses. | Broad synthesis, not an individual optimiser. |
| Working-set volume | Near-failure set count is a reasonable volume measure across roughly 6–20+ reps when other variables are controlled. [PMID 30063555](https://pubmed.ncbi.nlm.nih.gov/30063555/) | Keep working sets as the primary hypertrophy ledger, while retaining exercise role, ROM, load and effort. | Does not justify full counting for every secondary muscle. |
| Volume jumps | A small 8-week trained-participant study found both a 20% and a 120% increase in habitual quadriceps volume produced hypertrophy, without automatically worsening molecular markers. [PMID 42461790](https://pubmed.ncbi.nlm.nih.gov/42461790/) | Remove any assumption that every large volume jump is automatically harmful; still require performance/recovery gates. | Short, small, quadriceps-focused study. |
| Fatigue inputs | A 51-article review linked acute fatigue mainly to set duration, proximity to failure and total volume; dense, light-load, near-failure work was especially fatiguing. [PMID 40644670](https://pubmed.ncbi.nlm.nih.gov/40644670/) | Fatigue state must include density, duration and proximity—not only weekly sets or soreness. | Mostly acute evidence. |
| Deload trial | An 8-week trial found a reduced-frequency/reduced-set deload preserved muscle thickness and 10RM similarly to continuous training in untrained men. [PMID 41730991](https://pubmed.ncbi.nlm.nih.gov/41730991/) | Deloads can preserve exposure; make them optional, evidence-triggered and auditable. | Untrained, single-joint and short-term sample. |
| Autoregulation methods | A 27-RCT network meta-analysis reported advantages for some variable-resistance, APRE and velocity-based methods over fixed percentage loading for squat strength, while RPE/RIR was less clearly superior. [PMID 42454076](https://pubmed.ncbi.nlm.nih.gov/42454076/) | Support multiple controllers and do not treat percentage loading as the only option. | Indirect network comparisons and mixed populations; no universal winner. |
| RIR versus velocity | Individualised velocity profiles estimated RIR more accurately than subjective estimates in bench-press testing, particularly early in sets and at lower loads. [PMID 38595310](https://pubmed.ncbi.nlm.nih.gov/38595310/) | Use velocity devices to calibrate RIR when available; widen uncertainty without them. | Bench press and short-term testing. |
| BFR/very-low load | At 20% 1RM with blood-flow restriction, RIR error was very large, with limits of agreement around −7 to +7 reps. [PMID 40644671](https://pubmed.ncbi.nlm.nih.gov/40644671/) | Give BFR and very-low-load work a separate controller; do not use normal RIR tables. | Specific BFR protocol. |
| e1RM validation | Direct 1RM was highly reliable in a bench-press study, while most load–velocity equations were less accurate; more load points improved estimation. [PMID 39074242](https://pubmed.ncbi.nlm.nih.gov/39074242/) | e1RM needs confidence bounds and exercise-specific calibration; safe direct testing outranks a generic equation. | Small bench-press sample. |
| Range of motion | A lengthened-partial knee-extension trial found similar hypertrophy to full ROM at different loads, with better fascicle-length changes than shortened partials. [PMID 42392615](https://pubmed.ncbi.nlm.nih.gov/42392615/) | Full ROM remains the strength default; lengthened partials can be a deliberate hypertrophy or pain-management substitution. | One exercise and short intervention. |
| Strength versus hypertrophy outcomes | Hypertrophy was largely independent of load and relatively conserved within individuals, while strength and hypertrophy changes shared little variance. [PMID 41474371](https://pubmed.ncbi.nlm.nih.gov/41474371/) | Maintain separate strength and hypertrophy outcome models; neither is a proxy for the other. | Previously untrained men and failure-based isolation work. |
| Biomarker “responders” | Baseline/chronic androgen-receptor-style markers did not reliably distinguish high and low hypertrophy responders. [PMID 39143904](https://pubmed.ncbi.nlm.nih.gov/39143904/) | Do not build biomarker-based responder claims; use repeated outcomes. | Small, untrained sample. |

### Updated honest rating

The scientific basis is approximately **8.5/10 for a guarded personalised v1**, but only about **6/10 for claims about advanced-lifter MRV, exact fatigue thresholds, permanent optimal volume or universal RIR equations**. The package is ready to guide implementation; it is not evidence that the eventual engine is already validated.

## Primary sources

- [MacroFactor Workouts Smart Progression](https://help.macrofactorapp.com/en/articles/305-understanding-and-using-smart-progressions)
- [MacroFactor RIR](https://help.macrofactorapp.com/en/articles/385-what-is-rir-and-how-should-i-use-it-during-training)
- [MacroFactor program updates](https://help.macrofactorapp.com/en/articles/369-how-often-does-my-program-update)
- [RP app scope](https://help.rpstrength.com/hc/en-us/articles/33510008280087-Who-is-the-RP-Hypertrophy-App-for)
- [RP progression](https://help.rpstrength.com/hc/en-us/articles/32600173777815-How-does-the-app-determine-when-to-add-weight-reps-and-sets)
- [RP deloads](https://help.rpstrength.com/hc/en-us/articles/33510413024279-Does-the-app-automatically-place-deloads)
- [RP volume landmarks](https://rpstrength.com/blogs/articles/training-volume-landmarks-muscle-growth)
- [PMID 28834797](https://pubmed.ncbi.nlm.nih.gov/28834797/)
- [PMID 33433148](https://pubmed.ncbi.nlm.nih.gov/33433148/)
- [PMID 38970765](https://pubmed.ncbi.nlm.nih.gov/38970765/)
- [PMID 36334240](https://pubmed.ncbi.nlm.nih.gov/36334240/)
- [PMID 38393985](https://pubmed.ncbi.nlm.nih.gov/38393985/)
- [PMID 35044672](https://pubmed.ncbi.nlm.nih.gov/35044672/)
- [PMID 26049792](https://pubmed.ncbi.nlm.nih.gov/26049792/)
- [PMID 29628895](https://pubmed.ncbi.nlm.nih.gov/29628895/)
