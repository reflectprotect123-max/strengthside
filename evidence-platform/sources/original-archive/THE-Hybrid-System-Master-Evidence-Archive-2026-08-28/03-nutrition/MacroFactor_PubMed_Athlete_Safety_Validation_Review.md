# PubMed/NCBI review: athlete safeguards and validation for THE Hybrid Engine

**Research date:** 24 August 2026  
**Purpose:** identify what athlete-health and sports-nutrition evidence should change in THE Hybrid Engine, while keeping that evidence separate from MacroFactor-specific product behavior.

## Executive conclusion

The current MacroFactor-like architecture is useful, but it is not sufficient for an athlete-facing system.

The most important design correction is this:

> A weight/intake feedback loop estimates effective energy expenditure. It does not establish that the athlete is adequately fuelled, healthy, recovering, or safe to continue losing weight.

THE Hybrid Engine therefore needs two separate layers:

```text
nutrition observations + weight trend + activity data
        -> effective expenditure estimator

training load + intake + recovery/performance + health signals
        -> athlete-fuelling and safety state

both layers
        -> target controller, subject to safety guardrails
```

The safety layer must be able to hold or soften a calorie reduction even when the weight trend says the athlete is losing more slowly than intended. High protein can help preserve lean mass during energy restriction; it does **not** cure low energy availability or make a deeper deficit safe.

This review rates evidence by use:

- **High:** randomized trials, prospective validation, systematic reviews/meta-analyses, or expert consensus with explicit methods.
- **Moderate:** well-designed observational or mechanistic studies with a relevant population.
- **Low for product replication:** MacroFactor claims that are useful behaviorally but are not independent validation or do not disclose equations.

## 0. Additional PubMed validation pass: what the estimator can and cannot learn

### 0.1 Dynamic intake/weight models are promising, but the error bars matter

A 12-month weight-loss intervention evaluated time-weighted TDEE estimates from only two or three body-composition/energy-balance observations. The resulting models reported high in-sample association (`R²` approximately 0.911–0.982), but limits of agreement were still roughly 121–274 kcal/day. This supports testing an intake-plus-trend estimator as a useful population tool; it does **not** justify showing a precise individual TDEE without external calibration. [Time-weighted TDEE validation](https://pubmed.ncbi.nlm.nih.gov/40878019/)

Repeated doubly labelled water measurements also show that total energy expenditure can be reasonably repeatable in adults under similar conditions. That is useful for estimating a person's stable baseline, but repeatability is not the same as accuracy during illness, rapid training change, dieting, or large fluid shifts. [TEE repeatability](https://pubmed.ncbi.nlm.nih.gov/35013190/)

**Implementation rule:** report point error, limits of agreement, subgroup calibration and update volatility—not only correlation or `R²`.

### 0.2 Exercise and steps cannot be converted into a universal calorie credit

In a controlled aerobic-exercise study, a high exercise dose increased free-living TDEE by about 4% while chamber-based 24-hour expenditure fell by about 4%; a lower dose produced no measurable weight change. This is direct evidence against a universal `steps × calories` or `exercise calories = intake allowance` rule. [Exercise-induced weight-loss and compensation study](https://pubmed.ncbi.nlm.nih.gov/34519717/)

Step count and cadence can still be useful covariates when coverage is reliable and the model is validated in the target population. The feature should adjust a prior or responsiveness, not pretend to measure exercise energy expenditure directly.

### 0.3 Food logging error is a model input, not a correction factor

Doubly labelled water comparisons have found self-reported intake well below measured expenditure in some populations; one study reported reported intake around 80% of expenditure in middle-aged women. Weight-loss maintainers also under-reported more than normal-weight controls in another study. These results justify data-quality states, sensitivity analyses and conservative update gains. They do **not** justify adding a universal “logging correction” to every user. [Dietary records versus DLW](https://pubmed.ncbi.nlm.nih.gov/8599310/) · [Under-reporting in weight-loss maintainers](https://pubmed.ncbi.nlm.nih.gov/33742193/)

### 0.4 Missingness may be informative

A longitudinal weight-monitoring study found that overeating was associated with failure to weigh the next day. Therefore, a blank weight or food day may not be missing at random. The engine should preserve the observation state, widen uncertainty and test sensitivity to different missingness assumptions rather than silently filling a blank with a typical day. [Overeating and next-day weigh-in missingness](https://pubmed.ncbi.nlm.nih.gov/27619935/) · [Longitudinal mHealth missingness](https://pubmed.ncbi.nlm.nih.gov/41167252/)

### 0.5 Australia-specific seasonality belongs in context, not as a fixed multiplier

Seasonal changes in weight and self-weighing have been observed in longitudinal military data, with patterns varying across winter, spring, summer and autumn. For an Australian app, season, climate, heat exposure, holiday periods and training calendar can be stored as context features and used in backtesting. There is not enough evidence for a universal Australia-wide seasonal calorie correction. [Seasonal weight and self-weighing fluctuations](https://pubmed.ncbi.nlm.nih.gov/31093925/)

## 1. Evidence that changes the product, versus evidence that only explains MacroFactor

| Area | Medical/sports-nutrition evidence | MacroFactor-specific evidence | THE Hybrid Engine decision |
|---|---|---|---|
| Energy availability/RED-S | Problematic low energy availability can impair endocrine, bone, immune, reproductive, metabolic and performance systems. Thresholds are not universal, especially in men. | MacroFactor documents calorie floors and adaptive targets, not a clinical RED-S system. | Add a separate athlete-safety state. Never treat a calorie floor or weight trend as a medical clearance. |
| Protein | Higher protein supports lean-mass retention in energy restriction, with dose affected by leanness, deficit and resistance training. | MacroFactor publishes lifter tables but not the complete non-lifter/endurance coefficients. | Store protein basis and evidence source. Do not apply the lifter FFM table to every athlete. |
| Steps/TDEE | Steps can help predict TEE in a population model, but wearable calorie estimates are poor and compensation is individual. | Step-Informed Updates use step trends rather than direct wearable calories. | Keep steps as a measured covariate and bounded responsiveness signal, never `steps × kcal`. |
| Missing data | Missingness can be informative; state-space methods can handle missing observations, but MNAR missingness remains difficult. | V3 pauses/holds with insufficient nutrition data and estimates some missing intake privately. | Preserve blank/partial/estimated/fasting states and widen uncertainty. Do not coerce blanks to zero. |
| Uncertainty | A model can be well calibrated on average and still be wrong for an individual or subgroup. | MacroFactor calls flux range navigable space, not a confidence interval. | Use operational data quality now; add empirical prediction intervals only after backtesting and calibration. |
| Validation | Criterion measures and prospective outcome validation answer different questions. | MacroFactor’s public accuracy work is creator-reported predictive validity, not independent DLW/chamber validation. | Validate estimator accuracy, target tracking, safety outcomes and subgroup fairness separately. |

## 2. Energy availability and RED-S

### 2.1 What energy availability means

The research definition is:

```text
EA = (energy intake − exercise energy expenditure) / fat-free mass
```

in kcal/kg FFM/day.

This is a useful physiological framework, but it is a difficult individual app variable because both food intake and exercise energy expenditure are noisy. It should be treated as a **risk proxy or range**, not a precise diagnostic measurement.

The 2023 IOC consensus describes RED-S as a multisystem consequence of problematic, usually prolonged and/or severe, low energy availability. Its CAT2 tool uses three stages: screening, severity/risk stratification from primary and secondary indicators, and physician-led diagnosis/treatment. That is not equivalent to a calorie calculator. [IOC RED-S consensus, PubMed](https://pubmed.ncbi.nlm.nih.gov/37752011/) · [IOC REDs CAT2 rationale and validation, PubMed](https://pubmed.ncbi.nlm.nih.gov/37752002/)

### 2.2 Thresholds: useful context, unsafe as an automatic diagnosis

The often-quoted values of approximately 45 kcal/kg FFM/day for adequate availability and below 30 kcal/kg FFM/day for increased risk came mainly from controlled female research and are not universal clinical cutoffs. Evidence in men is much thinner. A study of recreationally trained male endurance athletes found that many fell below the female-derived <30 value without showing the expected symptom pattern. [Male endurance-athlete study](https://pmc.ncbi.nlm.nih.gov/articles/PMC8294781/)

Conversely, controlled male studies have shown that materially reduced EA can worsen explosive power, well-being, haemoglobin or hormonal markers before a simple weight-based screen would necessarily detect a problem. [Male low-EA study](https://pubmed.ncbi.nlm.nih.gov/34825937/) · [Randomized male EA-reduction trial](https://pubmed.ncbi.nlm.nih.gov/35813848/)

A 2024 systematic review/meta-analysis found LEA classifications in 44.7% of athletes across 59 included studies, with performance, illness and bone-health findings pointing in the same general direction but with substantial methodological variation. That prevalence must not be copied into an app as an individual probability: the studies used different intake, exercise-expenditure, screening and athlete-population methods. [LEA/RED-S systematic review and meta-analysis](https://pubmed.ncbi.nlm.nih.gov/39485653/)

**Implementation decision:**

- Do not trigger a diagnosis from one daily EA estimate.
- Do not use the female <30 value as a male diagnostic rule.
- Use a rolling range and persistence requirement, with data-quality penalties.
- Combine the proxy with performance, training availability, illness/injury, recovery, menstrual/reproductive or libido signals where voluntarily supplied, and clinician-provided information.
- If risk is persistent or symptoms are concerning, hold aggressive weight-loss progression and recommend professional review rather than lowering calories harder.

### 2.3 Weight stability does not clear the athlete

Low energy availability can impair physiology and performance without requiring a large drop in body mass. A 10-day controlled study in trained females found reduced muscle protein synthesis and reductions in lean mass, resting metabolic rate and endocrine markers under LEA. [Trained-female muscle-protein-synthesis study](https://pubmed.ncbi.nlm.nih.gov/37329147/)

This matters because a weight-only controller can conclude “maintenance is fine” while training adaptation, recovery or health is deteriorating. Conversely, symptoms can also come from illness, sleep loss, psychological stress, disordered eating or injury; RED-S should not become a catch-all explanation. [Critical review of the RED-S model](https://pmc.ncbi.nlm.nih.gov/articles/PMC11561064/)

**Implementation decision:** the safety layer must monitor more than scale weight. It should never diagnose; it should classify `no_screen`, `monitor`, `review`, or `urgent_referral` based on evidence and route the user to a clinician when appropriate.

### 2.4 RMR-ratio safeguards

A measured-to-predicted RMR ratio below 0.90 is often discussed as a possible marker of metabolic suppression. It is not safe to generate this as a diagnosis from an arbitrary predictive equation. In high-level athletes, the prevalence of “low RMR ratio” changed dramatically depending on which equation was used; a 2025 cohort found no single equation had adequate sensitivity and specificity for RED-S diagnosis. [Equation-choice study](https://pubmed.ncbi.nlm.nih.gov/38194347/) · [Large athlete cohort](https://pubmed.ncbi.nlm.nih.gov/40262739/)

**Implementation decision:**

- Store measured RMR only when the athlete or clinician supplies it, with protocol and date.
- Label predicted RMR as a prior, never as a measured result.
- Do not show “metabolic suppression” from a single equation without a clinical disclaimer.

### 2.5 Use CAT2 as a design pattern, not as a diagnosis engine

The CAT2 model is valuable because it combines multiple indicators and separates screening from clinical diagnosis. A 2025 prospective application across 200+ elite athletes found that more severe traffic-light categories were associated with current RED-S indicators and higher subsequent self-reported bone-stress-injury risk. [Prospective CAT2 application](https://pubmed.ncbi.nlm.nih.gov/39164063/)

THE should borrow the separation of concerns:

```text
screening signal -> risk review -> clinician pathway
```

It should not copy CAT2’s clinical labels into a consumer app and imply diagnosis.

## 3. Protein by training type and energy deficit

### 3.1 The unit problem

The literature uses both g/kg body mass and g/kg FFM. They are not interchangeable. THE must store:

```ts
type ProteinBasis = "body_mass" | "fat_free_mass" | "goal_weight";
```

Every target needs `basis`, `range`, `source`, `population`, and `policyVersion`. A smart-scale FFM value should carry uncertainty; it should not silently drive a high-precision target.

### 3.2 Resistance training at roughly energy balance

A large meta-analysis of resistance-training studies found that protein supplementation improved strength and FFM, but gains did not continue to increase once total daily protein reached approximately 1.62 g/kg/day in the included population. That is a population breakpoint, not a hard ceiling for every athlete, older adult, lean athlete or energy-deficient athlete. [Morton meta-analysis](https://pubmed.ncbi.nlm.nih.gov/28698222/)

**Design effect:** the default resistance-training target can live around an evidence-based middle range, but the controller should not keep raising protein indefinitely when calories fall. Remaining energy, carbohydrate availability, fat minimums and safety status still matter.

### 3.3 Resistance/hybrid training during energy restriction

A review of lean, resistance-trained athletes proposed approximately 2.3–3.1 g/kg FFM/day during caloric restriction, scaled upward with leanness and deficit severity. This is a reasoned review recommendation, not a universal RCT-derived requirement. [Energy-restricted resistance-trained review](https://pubmed.ncbi.nlm.nih.gov/24092765/)

A 4-week randomized trial in young men using a roughly 40% energy deficit plus six days/week of resistance and high-intensity interval training found greater FFM gain and fat-mass loss at 2.4 g/kg/day than at 1.2 g/kg/day. The study was short, small, male-only, supervised and unusually exercise-heavy; it should not be generalized to every cut. [Longland randomized trial](https://pubmed.ncbi.nlm.nih.gov/26817506/)

**Candidate v1 policy:** move resistance/hybrid athletes toward the upper part of the normal protein range when the deficit is meaningful, the athlete is leaner, and resistance training is present. Do not automatically select the maximum FFM value.

### 3.4 Endurance and mixed training

A recent evidence-based endurance review suggests approximately 1.8 g/kg body mass/day for endurance athletes, with potentially higher needs during carbohydrate-restricted training or rest days. Indicator-amino-acid studies and reviews also place endurance requirements above the sedentary RDA in some conditions. [Endurance protein review](https://pubmed.ncbi.nlm.nih.gov/40117058/) · [IAAO scoping review](https://pubmed.ncbi.nlm.nih.gov/37573015/)

**Design effect:** do not apply MacroFactor’s lifter FFM table unchanged to endurance-only athletes. For a hybrid athlete, the profile should record resistance volume, endurance volume, intensity distribution and current energy deficit. The target can be chosen from a versioned policy, but its evidence basis must remain visible.

### 3.5 Protein is not a substitute for energy availability

This is a critical safety rule. In a controlled male study, high protein during five days of LEA did not prevent the LEA-associated shift in bone turnover. [High-protein/LEA bone study](https://pubmed.ncbi.nlm.nih.gov/33671093/)

**Therefore:** if the safety layer identifies persistent low EA risk, the app must not respond by preserving a low calorie target and simply increasing protein. The corrective action is adequate energy availability, reduced training or clinical review—not protein arithmetic alone.

### 3.6 Candidate policy table

These are transparent implementation ranges, not claims about MacroFactor’s hidden coefficients or universal medical prescriptions.

| Profile | Evidence-informed starting policy | What should raise caution |
|---|---:|---|
| No structured exercise | General active-adult policy, not the athlete tables | Kidney disease, eating-disorder history or clinician restrictions |
| Endurance-focused | About 1.6–1.8 g/kg body mass/day as a starting range | High volume, low carbohydrate availability, large deficit, low EA signals |
| Resistance-focused, energy sufficient | About 1.6–2.2 g/kg body mass/day as a product range | Older age, high leanness, unusually high volume or poor recovery |
| Resistance/hybrid cut | Consider a higher range, potentially expressed as 2.3–3.1 g/kg FFM in lean resistance-trained users | Do not use this range to justify an unsafe energy deficit |
| Persistent low-EA risk | Do not solve with a higher protein number | Hold aggressive loss and route to review |

The app should present these as a policy choice with uncertainty, not as a single “correct” number.

## 4. Activity compensation, constrained expenditure and step/TDEE prediction

### 4.1 Steps are a useful signal; wearable calories are not a reliable truth source

A doubly labelled water study found that models using body weight, steps/day and cadence bands explained 79% of TEE variance in men and 65% in women in that sample. That supports steps as one feature in a population model, not a universal individual calorie conversion. [Tudor-Locke DLW study](https://pubmed.ncbi.nlm.nih.gov/22963352/)

By contrast, systematic reviews repeatedly find poor individual accuracy for consumer-wearable energy expenditure. One review found energy-expenditure MAPE above 30% for all tested brands; another meta-analysis found large activity-dependent heterogeneity. [Wrist-wearable accuracy review](https://pubmed.ncbi.nlm.nih.gov/35060915/) · [Energy-expenditure device meta-analysis](https://pubmed.ncbi.nlm.nih.gov/30194221/)

**Design effect:** import steps, cadence, wear time and source quality; ignore wearable calorie-burn fields for the core expenditure equation unless a product-specific validation study supports them.

### 4.2 Compensation is real but not a universal constant

The constrained-expenditure literature argues that TEE need not rise linearly with activity across populations. Other work documents compensation through greater intake, reduced non-exercise activity, resting-metabolic adaptation or improved efficiency. The direction and magnitude vary substantially by person and protocol. [Pontzer et al.](https://pubmed.ncbi.nlm.nih.gov/26832439/) · [DLW review](https://pubmed.ncbi.nlm.nih.gov/28724452/) · [Energy-compensation systematic review](https://pubmed.ncbi.nlm.nih.gov/25988763/)

An RCT of supervised exercise found significant compensation and increased energy intake in exercise groups, while another trial found that higher exercise volume produced more fat loss without a clear difference in percentage compensation. That is evidence against a single fixed “activity tax” or “constrained exponent.” [E-MECHANIC RCT](https://pubmed.ncbi.nlm.nih.gov/31172175/) · [Exercise-for-weight-loss RCT](https://pubmed.ncbi.nlm.nih.gov/33064415/)

**Design effect:** learn a person-specific response only after enough paired step/intake/trend data. The initial step feature should change update responsiveness or the prior slightly, not add a fixed number of calories.

### 4.3 Step feature contract

```ts
type StepEvidence = {
  date: string;
  steps?: number;
  cadenceBands?: Record<string, number>;
  wearMinutes?: number;
  source: "phone" | "watch" | "manual" | "imported";
  validDay: boolean;
};

type ActivitySignal = {
  baseline7d?: number;
  baseline28d?: number;
  delta?: number;
  validDays7d: number;
  context: "work" | "training" | "mixed" | "unknown";
  confidence: "low" | "medium" | "high";
};
```

Use robust medians or trimmed means, require valid-day coverage, separate occupational steps from structured training where possible, and never allow one high-step day to create a large target jump.

## 5. Missing data: classify it instead of pretending it is random

### 5.1 Why the missingness mechanism matters

A blank food day may mean a normal day, a large social meal, illness, fatigue, or disengagement. If high-intake days are more likely to be omitted, the missingness is not random and a simple average will bias expenditure down. A blank scale day is different: it hides a measurement but does not itself imply an intake value.

Longitudinal-methods research shows that multiple imputation and full-information methods can reduce bias under their assumptions, while state-space/Kalman approaches can handle missing observations in intensive time series. Performance deteriorates when missingness is non-ignorable. [Longitudinal imputation study](https://pubmed.ncbi.nlm.nih.gov/32101358/) · [State-space missingness simulation](https://pubmed.ncbi.nlm.nih.gov/40091737/)

### 5.2 Required data states

```ts
type IntakeDayState =
  | "complete_observed"
  | "complete_estimated"
  | "partial"
  | "blank"
  | "fast_confirmed"
  | "excluded";

type WeightDayState =
  | "observed"
  | "interpolated_for_display"
  | "missing"
  | "context_flagged";
```

Rules:

- A blank nutrition day is not zero calories.
- A confirmed fast is zero calories only when the user explicitly confirms it.
- A partial day carries an intake uncertainty distribution and reduced update gain.
- Weight interpolation is acceptable for a display trend or latent-state filter, but the interval must widen across gaps and the interpolated point must never count as a new measurement.
- Long intake gaps should hold the last estimate or use a prior with uncertainty, not silently impute a typical day.
- When missingness could be high-intake-related, show low/typical/high sensitivity scenarios.

## 6. Uncertainty and calibration

### 6.1 Do not call a heuristic range a confidence interval

MacroFactor explicitly says its flux range is not a confidence interval. That is correct product language. A range becomes a calibrated prediction interval only after checking its empirical coverage against future outcomes.

Clinical prediction research also warns that apparent perfect calibration can hide bias and residual variation. Model instability in small or narrow development datasets can produce miscalibration in new users. [Calibration paper](https://pubmed.ncbi.nlm.nih.gov/24021610/) · [Prediction-model stability](https://pubmed.ncbi.nlm.nih.gov/37466257/)

### 6.2 Hybrid uncertainty decomposition

Store separate components:

```ts
type ExpenditureUncertainty = {
  observation: number;    // intake and scale measurement noise
  process: number;        // real short-term expenditure movement
  missingness: number;    // blank/partial/unobserved intake
  model: number;          // uncertainty in the estimator form
  context: number;        // illness, cycle, creatine, carb shift, activity transition
  total?: number;
};
```

Do not compress these into a fake precise percentage. Before calibration, show `data coverage`, `history length`, `last update`, `state`, and `reason codes`. Later, produce empirical bands by horizon and data state:

```ts
type ForecastBand = {
  horizonDays: 7 | 14 | 28;
  nominalCoverage: 0.5 | 0.8 | 0.95;
  empiricalCoverage?: number;
  calibrationSampleN?: number;
  cohortVersion?: string;
  status: "uncalibrated" | "calibrated" | "insufficient_data";
};
```

Calibration must be evaluated with rolling-origin, time-ordered backtests. Do not randomly split daily rows from the same athlete into train and test sets.

## 7. Outcome validation: four separate questions

One accuracy number is not enough. THE should validate four outcomes separately.

### 7.1 Criterion validity: does estimated TDEE resemble measured TDEE?

Use doubly labelled water for free-living TEE and indirect calorimetry or a metabolic chamber where appropriate. For energy-storage change, use a validated body-composition method rather than assuming every kg is identical tissue. A controlled calorie-restriction validation found that DLW estimated EE accurately at group level but individual calculated intake had wide error, which is exactly why individual-level uncertainty must be reported. [DLW/calorie-restriction validation](https://pubmed.ncbi.nlm.nih.gov/17209180/) · [DLW reproducibility](https://pubmed.ncbi.nlm.nih.gov/24523488/)

Metrics: mean bias, MAE, RMSE, limits of agreement, subgroup bias and repeatability.

### 7.2 Predictive validity: does the next trend move as forecast?

Test future 7-, 14- and 28-day trend change, target tracking error and time to recover from water shifts. This is closer to MacroFactor’s public outcome claim, but it is not the same as DLW accuracy.

### 7.3 Athlete outcome validity: does the system support training?

Track training completion, performance or standardized test trends, recovery/readiness, illness days, injury/bonestress-injury signals, and body-composition outcomes where available. A system that predicts weight well but increases missed training or low-EA signals is not successful for THE.

### 7.4 Safety and fairness validity

Stratify performance and adverse signals by:

- resistance, endurance and mixed training;
- sex and reproductive context where voluntarily provided;
- age, body size and body-fat category uncertainty;
- high-step occupations versus recreational activity;
- menstrual-cycle tracking status;
- device type and missingness pattern;
- goal type and training phase.

Use temporal external validation and calibration plots, not only an overall average. [Temporal/geographic validation methods](https://pubmed.ncbi.nlm.nih.gov/27262237/)

## 8. Required THE Hybrid Engine changes

### 8.1 New safety contract

```ts
type AthleteSafetyState =
  | "not_screened"
  | "monitor"
  | "review"
  | "urgent_referral";

type AthleteSafetySignal = {
  kind:
    | "low_energy_availability_proxy"
    | "rapid_weight_loss"
    | "performance_decline"
    | "recovery_decline"
    | "recurrent_illness"
    | "injury_or_bone_stress_concern"
    | "menstrual_or_reproductive_change"
    | "libido_or_endocrine_change"
    | "disordered_eating_concern";
  source: "self_report" | "derived" | "clinician";
  persistenceDays?: number;
  confidence: "low" | "medium" | "high";
  userVisible: boolean;
};
```

Nutrition target changes must pass a safety policy:

```text
if urgent_referral:
    do not increase deficit; show referral guidance
elif review:
    hold aggressive loss and request review / more information
elif monitor:
    cap loss rate and increase monitoring; do not use protein to mask low EA
else:
    allow normal bounded controller
```

This is a product safety workflow, not a diagnostic protocol.

### 8.2 Preserve the existing architecture boundary

- `nutrition-core`: definitions, equations, units, data-state semantics.
- `nutrition-engine`: expenditure estimator, macro policy, uncertainty and safety policy.
- `nutrition-adapter`: imports from food logs, wearables and exports.
- `whole-athlete-state`: receives nutrition observations, estimator freshness, safety constraints and athlete-approved targets; it does not silently invent nutrition prescriptions.
- `session-authoring` and training systems: can request fuelling constraints and flag high-intensity sessions that conflict with a chosen low-carbohydrate plan.

### 8.3 Event logging and auditability

Every target change should record:

```ts
{
  estimateVersion,
  policyVersion,
  dataCoverage,
  intakeStateCounts,
  weightCoverage,
  stepSignal,
  safetyState,
  uncertainty,
  priorTarget,
  proposedTarget,
  appliedTarget,
  reasonCodes,
  userOverride
}
```

## 9. What should and should not be copied from MacroFactor

### Copy or adapt

- intake plus trend-weight feedback;
- explicit blank/partial/fasting semantics;
- holding/paused behavior;
- damped weekly updates;
- step trends as a bounded signal;
- protein-first allocation with a visible basis;
- event annotations for illness, creatine, carb shifts and cycle changes;
- no automatic catch-up.

### Do not copy blindly

- a fixed 1,200-kcal floor as athlete safety evidence;
- a universal <30 kcal/kg FFM RED-S diagnosis;
- lifter protein coefficients for endurance athletes;
- direct wearable calorie credits;
- a fixed calories-per-step formula;
- a hidden imputation of blank food days;
- a confidence percentage without empirical calibration;
- a weight-only definition of athlete success.

## 10. Highest-priority build order

1. Add explicit data-state semantics and audit events.
2. Add the athlete-safety screen and prescription guard before aggressive goal modes.
3. Keep the expenditure engine empirical and separate from safety assessment.
4. Add training-type and deficit-aware protein policies with visible unit basis.
5. Use steps only as a validated covariate/responsiveness feature.
6. Build missingness stress tests and rolling-origin backtests.
7. Run criterion and prospective validation before advertising precision or calibrated ranges.

## Primary PubMed/NCBI sources

- [IOC 2023 RED-S consensus — PMID 37752011](https://pubmed.ncbi.nlm.nih.gov/37752011/)
- [IOC REDs CAT2 — PMID 37752002](https://pubmed.ncbi.nlm.nih.gov/37752002/)
- [Prospective CAT2 application — PMID 39164063](https://pubmed.ncbi.nlm.nih.gov/39164063/)
- [LEA/RED-S systematic review and meta-analysis — PMID 39485653](https://pubmed.ncbi.nlm.nih.gov/39485653/)
- [Male endurance-athlete EA thresholds — PMC8294781](https://pmc.ncbi.nlm.nih.gov/articles/PMC8294781/)
- [Male low-EA performance study — PMID 34825937](https://pubmed.ncbi.nlm.nih.gov/34825937/)
- [Male randomized EA-reduction trial — PMID 35813848](https://pubmed.ncbi.nlm.nih.gov/35813848/)
- [LEA and muscle protein synthesis in trained females — PMID 37329147](https://pubmed.ncbi.nlm.nih.gov/37329147/)
- [RMR equation choice in athletes — PMID 38194347](https://pubmed.ncbi.nlm.nih.gov/38194347/)
- [RMR prediction equations and RED-S validity — PMID 40262739](https://pubmed.ncbi.nlm.nih.gov/40262739/)
- [Morton resistance-training protein meta-analysis — PMID 28698222](https://pubmed.ncbi.nlm.nih.gov/28698222/)
- [Energy-restricted resistance-trained protein review — PMID 24092765](https://pubmed.ncbi.nlm.nih.gov/24092765/)
- [Longland high-protein energy-deficit RCT — PMID 26817506](https://pubmed.ncbi.nlm.nih.gov/26817506/)
- [Endurance protein review — PMID 40117058](https://pubmed.ncbi.nlm.nih.gov/40117058/)
- [IAAO protein-requirement scoping review — PMID 37573015](https://pubmed.ncbi.nlm.nih.gov/37573015/)
- [High-protein LEA bone study — PMID 33671093](https://pubmed.ncbi.nlm.nih.gov/33671093/)
- [Step/cadence prediction of DLW TEE — PMID 22963352](https://pubmed.ncbi.nlm.nih.gov/22963352/)
- [Wearable EE accuracy review — PMID 35060915](https://pubmed.ncbi.nlm.nih.gov/35060915/)
- [Wearable EE meta-analysis — PMID 30194221](https://pubmed.ncbi.nlm.nih.gov/30194221/)
- [Constrained TEE — PMID 26832439](https://pubmed.ncbi.nlm.nih.gov/26832439/)
- [DLW review of exercise and energy balance — PMID 28724452](https://pubmed.ncbi.nlm.nih.gov/28724452/)
- [Energy-compensation systematic review — PMID 25988763](https://pubmed.ncbi.nlm.nih.gov/25988763/)
- [E-MECHANIC RCT — PMID 31172175](https://pubmed.ncbi.nlm.nih.gov/31172175/)
- [Longitudinal missing-data methods — PMID 32101358](https://pubmed.ncbi.nlm.nih.gov/32101358/)
- [State-space missing-data simulation — PMID 40091737](https://pubmed.ncbi.nlm.nih.gov/40091737/)
- [Calibration of prediction rules — PMID 24021610](https://pubmed.ncbi.nlm.nih.gov/24021610/)
- [Prediction-model stability — PMID 37466257](https://pubmed.ncbi.nlm.nih.gov/37466257/)
- [Hall dynamic body-weight model — PMID 21872751](https://pubmed.ncbi.nlm.nih.gov/21872751/)
- [DLW/calorie-restriction validation — PMID 17209180](https://pubmed.ncbi.nlm.nih.gov/17209180/)
- [Temporal/geographic validation methods — PMID 27262237](https://pubmed.ncbi.nlm.nih.gov/27262237/)
