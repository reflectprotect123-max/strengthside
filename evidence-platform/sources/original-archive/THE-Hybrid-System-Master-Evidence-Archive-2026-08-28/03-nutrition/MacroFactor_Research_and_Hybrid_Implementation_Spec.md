# MacroFactor: research and implementation specification for THE Hybrid Engine

**Research date:** 24 August 2026  
**Purpose:** document what MacroFactor publicly says it does, identify what remains proprietary, and translate the useful mechanisms into a buildable nutrition system for THE Hybrid Engine.

## 1. Executive conclusion

MacroFactor is not primarily a calorie calculator. Its important mechanism is a closed feedback loop:

    initial estimate
      -> logged intake + body-weight observations
      -> smoothed weight trend
      -> inferred energy expenditure
      -> goal-based weekly calorie budget
      -> protein/fat/carbohydrate allocation
      -> weekly check-in and bounded update
      -> repeat

The key design decision is that the app estimates expenditure from what the athlete actually logged and how their smoothed body mass changed. It does not simply add wearable “calories burned” to a static calculator. This makes the recommendations adherence-neutral: eating above or below the previous target is not treated as a failure; it becomes new evidence.

For THE Hybrid Engine, the useful pattern is:

1. Treat the onboarding estimate as a prior, not as truth.
2. Keep raw observations separate from smoothed state and prescribed targets.
3. Never update from a single noisy weigh-in or an obviously incomplete food day.
4. Use explicit updating, holding, and insufficient-data states.
5. Make weekly target changes damped and explainable.
6. Keep nutrition targets in the nutrition engine. Training state should receive nutrition observations and constraints, not silently create food prescriptions.

## 2. Documented versus proprietary

### Publicly documented by MacroFactor

- The initial expenditure estimate uses custom BMR equations and custom activity factors.
- The personalised expenditure estimate is based on calorie intake and change in trend weight.
- Trend weight is intended to separate meaningful weight change from daily noise.
- Missing weights can be filled by linear interpolation for trend calculations.
- The change-rate window is described as the previous 20 days, expressed as a weekly rate.
- V3 exposes a non-confidence “flux range”: a navigable space in which the algorithm may travel while responding to meaningful expenditure movement.
- Expenditure V3 is more stable, more responsive to durable changes, and more tolerant of missing data than earlier versions.
- A practical operating gate is four nutrition days in seven and at least one weigh-in per seven days; daily nutrition and more frequent weighing are preferred.
- The weekly calorie budget is based on estimated expenditure and the user’s goal. Coached and collaborative plans keep the weekly budget locked while allowing different daily distributions.
- Protein is considered first in coached plans. Remaining calories are allocated between fat and carbohydrate according to the chosen diet style and preferences.
- Weekly check-ins can include partial-logging, weigh-in, fasting, logging-break, and program-update modules.
- The user can skip modules, disable modules, use Fast Check-In, or decline the program update.
- Current optional expenditure modifiers include Step-Informed Updates and Predictive Goal Adjustment.

### Not publicly reproducible

- The exact Expenditure V3 trend filter and weighting coefficients.
- Exact outlier handling, imputation model, confidence calculation, and update gains.
- Exact fat/lean tissue composition assumptions used in every situation.
- The exact questionnaire wording and mapping logic that turns every onboarding answer into a factor.
- Exact protein coefficients for every exercise and preference category.
- Exact weekly smoothing/guardrail function.
- Exact step-trend and predictive-goal contributions.

It would be wrong to claim that THE Hybrid Engine can reproduce MacroFactor exactly from public information. We can reproduce its public architecture and build a transparent, testable analogue.

## 3. Components

### 3.1 User profile and onboarding

Useful inputs:

- age
- sex variable used by the selected BMR equation
- body mass
- height
- body-fat category or estimate, if available
- highest recorded body mass, if available
- general daily activity
- structured exercise type and frequency
- current goal: lose, maintain, or gain
- target body mass
- desired rate of change
- protein preference
- carbohydrate/fat preference
- preferred calorie distribution across the week

For THE Hybrid Engine, retain the original answer, source, timestamp, and confidence for every onboarding input. A manually supplied expenditure estimate should be labelled manual_initial_estimate and treated as a prior.

### 3.2 Initial BMR equations

The following equations are published by MacroFactor. They are appropriate for an initial-estimate module only; the personalised feedback loop should supersede them.

#### General anthropometric equation

For weight in kg, height in cm, age in years, and sex = 0 for male / 1 for female in the published equation:

    BMR = 129.6 × weight^0.55
          + 0.011 × height^2
          - age_adjustment
          - 213.8 × sex

    age_adjustment =
        1.96 × min(age, 60)
        + 4.9 × max(age - 60, 0)

#### Body-composition equation

Where FFM is fat-free mass in kg and FM is fat mass in kg:

    BMR = 50.2 × FFM^0.7
          + 40.5 × (FFM^0.7 × FM^0.066)
          - age_adjustment

    age_adjustment =
        1.1 × min(age, 60)
        + 2.75 × max(age - 60, 0)

#### Athlete equation

MacroFactor defines an athlete for this purpose as someone spending at least seven hours per week engaged in intense exercise:

    BMR = 40.4 × FFM^0.932

Do not automatically classify someone as an athlete from the number of gym sessions alone. Store the classification reason and use a versioned rule.

#### Metabolic-adaptation modifiers

The published BMR article says:

- If the person is currently in an energy deficit, multiply BMR by 0.95.
- If current body mass is more than 10% below their highest body mass, multiply BMR by 0.97.
- If both conditions apply, the combined effect is approximately 0.92.

These are initial-estimate modifiers, not a replacement for learning from observed intake and weight data.

### 3.3 Initial expenditure / TDEE

The initial estimate is broadly:

    initial_expenditure = adjusted_BMR × initial_activity_factor

MacroFactor publicly separates general activity from exercise activity. One published example uses:

    1938 × (1.4 + 0.1) = 2907 kcal/day

#### 3.3.1 Official custom correction table

MacroFactor’s official algorithms article includes the following table as an image. These values are documented product inputs, not inferred values:

| General activity | Correction | Exercise activity | Correction |
|---|---:|---|---:|
| Low Activity | 1.2 | 0 sessions/week | +0.0 |
| Moderate Activity | 1.4 | 1–3 sessions/week | +0.1 |
| High Activity | 1.6 | 4–6 sessions/week | +0.2 |
| — | — | 7+ sessions/week | +0.3 |

The documented example implies the starting estimate is calculated as:

    initial_expenditure = adjusted_BMR × (general_activity_correction + exercise_correction)

The table does **not** disclose the full onboarding decision tree. It does not tell us exactly how MacroFactor classifies borderline lifestyles, how it handles different session durations or intensities, or whether the live app has changed the table since the article was updated. Those remain unknown. Use a versioned table and label it with its source date.

Source: Greg Nuckols, *MacroFactor’s Algorithms and Core Philosophy*, updated 10 October 2024; the table is the article’s [“MacroFactor Correction Factors” image](https://macrofactor.com/wp-content/uploads/2024/02/image-1.png).

#### 3.3.2 Onboarding and calibration timeline

The official sources describe overlapping stages rather than one exact calibration deadline:

- The initial estimate remains around for the first few days.
- The 2025 accuracy article says adaptive estimates begin updating on day 3.
- The 2024 algorithms article says the estimate starts moving after about a week.
- A first-week check-in may change targets by only a few Calories; a larger adjustment is expected at the second check-in after a full week of updating.
- MacroFactor describes roughly 2–3 weeks as enough to dial in a good estimate, 14–30 days for the day-to-day change rate to slow, and 3–4 weeks for recommendations to become fully informed by the user’s own data.
- Back-filling approximately 14–30 days of prior weight and nutrition data can accelerate the process; it does not reveal the underlying proprietary filter.

These statements are not contradictory if they are treated as different milestones: **adaptive learning can start around day 3; visible movement may be clearer after week 1; practical refinement is around weeks 2–3; full initial calibration is around weeks 3–4.**

For THE Hybrid Engine, expose these as state labels rather than pretending there is a sharp switch:

    days 0–2: initial_prior
    days 3–6: adaptive_learning_started
    days 7–20: partially_personalised
    days 21–30: initial_calibration_complete

The labels above are a Hybrid implementation convention. The dates are anchored to MacroFactor’s public descriptions, but the exact internal confidence thresholds are not published.

#### 3.3.3 Profile activity versus observed activity

The onboarding activity factors are only a starting prior. MacroFactor’s help centre explicitly says changing the profile-level activity setting does not directly change the current expenditure estimate or calorie targets; ongoing intake and weight data drive those values instead. A significant real-world activity change is expected to take roughly 3–4 weeks to become fully reflected, with the normal recommendation being to let the observed feedback loop catch up unless the change is extreme. [Change activity level](https://help.macrofactorapp.com/en/articles/57-change-your-activity-level) [Drastic activity changes](https://help.macrofactorapp.com/en/articles/210-what-should-i-do-if-my-activity-levels-change-drastically)

For THE Hybrid Engine, keep these separate:

```text
profile_activity_factor -> initial prior only
observed intake + trend weight -> learned expenditure
step/activity trend -> optional bounded modifier, never direct calorie add
```

This matters for athletes with seasonal work or training changes: changing “high activity” to “moderate” should not abruptly overwrite a learned expenditure estimate. It should create a labelled transition event and allow observed data to update the estimate, with a temporary manual override only when the activity change is too large to safely wait out.

### 3.4 Dynamic expenditure

The public core equation is:

    Calories in - Calories out = change in stored energy
    Calories out = Calories in - change in stored energy

If average intake is 3,000 kcal/day and trend indicates a stored-energy surplus of 200 kcal/day:

    expenditure = 3,000 - 200 = 2,800 kcal/day

An implementation can define:

    daily_trend_change_kg =
        (trend_weight_today - trend_weight_reference) / days_elapsed

    daily_stored_energy_change_kcal =
        daily_trend_change_kg × energy_density_model

    estimated_expenditure =
        mean_valid_daily_intake_kcal
        - daily_stored_energy_change_kcal

Sign convention:

- weight gain produces positive stored-energy change and lowers inferred expenditure at fixed intake;
- weight loss produces negative stored-energy change and raises inferred expenditure at fixed intake;
- stable weight makes inferred expenditure converge toward average logged intake.

The public material indicates that MacroFactor uses a more nuanced composition model than a universal 7,700 kcal/kg rule and that V3 corrected a prior upward bias caused by asymmetric gain/loss assumptions. The exact current mapping is not public. Make the model explicit and versioned, for example:

    energy_conversion_model = symmetric_7700_v1

Do not hide the assumption inside an unexplained constant.

#### Recovered V3 tissue-energy clues

MacroFactor does disclose the endpoints used in its explanation, but not the live interpolation or the complete composition policy:

- fat tissue is described as approximately 39.5 MJ/kg, or about 4,282 kcal/lb;
- lean tissue is described as approximately 7.6 MJ/kg, or about 824 kcal/lb;
- the older V1/V2 behaviour assumed that the surplus implied by weight gain was smaller than the deficit implied by weight loss, reflecting an assumption that gained weight in active users was more lean tissue than fat;
- MacroFactor says this asymmetry created a small upward expenditure bias when ordinary weight fluctuations reversed direction;
- V3 corrected that bias by making the gain/loss treatment effectively symmetric for this purpose. It does not publish the exact current body-composition mapping, gain/loss mixture function, or any user-specific caps.

Therefore, the evidence supports the endpoints, the direction of the V3 correction, and the existence of a symmetric-bias fix. It does not support claiming that V3 literally uses a fixed 7,700 kcal/kg conversion in every case. The Hybrid implementation must keep its conversion model versioned and label it as an approximation.

### 3.5 Weight trend

Raw scale weight is noisy because of water, sodium, glycogen, gastrointestinal contents, inflammation, menstruation, creatine, and other short-term effects. MacroFactor therefore uses trend weight rather than raw scale weight for decisions.

Publicly described behaviour:

- the trend gives more weight to recent observations while retaining information from older observations;
- missing scale-weight days may be filled with linear interpolation;
- the trend is used for change rate and protects the weekly update from one-off scale noise.
- MacroFactor’s public help describes the result as a moving average with greater emphasis on recent weigh-ins; it does not publish the window length, alpha, state-space model, or outlier rule.

Exact filter coefficients are proprietary. A transparent Hybrid Engine v1 can use an exponentially weighted moving average:

    trend_t = alpha × observed_weight_t
              + (1 - alpha) × trend_(t-1)

Use a separate rule for interpolated versus observed values. Do not present this as MacroFactor’s exact filter.

Recommended storage:

    WeightObservation {
      athleteId
      observedAt
      valueKg
      source                 // manual, scale, import
      isObserved             // false if interpolated
      quality                // valid, suspect, rejected
      reasonCodes[]
    }

    WeightTrendPoint {
      date
      rawWeightKg
      trendWeightKg
      sourceCoverage
      filterVersion
    }

### 3.6 Change rate

MacroFactor describes change rate as trend-weight change over the previous 20 days, expressed as a weekly rate:

    weekly_change_rate_kg =
        (trend_weight_today - trend_weight_20_days_ago)
        / 20 × 7

    weekly_change_rate_percent =
        weekly_change_rate_kg / reference_weight_kg × 100

Use trend weight, not raw scale weight. Define the reference-weight choice in the versioned specification.

### 3.7 Data quality and missingness

This is one of MacroFactor’s most important design lessons.

Nutrition-day states:

    complete        // full day logged or credible total estimate
    fasting         // explicitly confirmed zero-calorie day
    partial         // some intake logged, likely incomplete
    blank           // no intake data; never treat as zero
    estimated       // user-entered total or accepted estimate
    imported        // imported daily totals

Partial logging is worse than a blank day because the algorithm may interpret an incomplete low intake as the full intake. The app should offer three corrections: estimate the missing meal, mark the day partial and exclude it, or leave it blank.

MacroFactor also states that its expenditure calculations use the last 21 days of nutrition data, so one partially logged day can influence the calculation for approximately three weeks. This is an operational horizon, not proof that the hidden filter is a simple 21-day moving average. Its partial-logging module looks for a day whose intake total is considerably below the user’s recent norm and asks the user whether the day was genuinely low, incomplete, or should be excluded.

Suggested engine status:

    updating          // gate passed and estimate may change
    holding           // retain last high-confidence estimate
    insufficient_data // not enough history for a personalised estimate
    stale             // estimate is valid but observations are old

When holding:

- preserve the last high-confidence expenditure;
- do not silently reset to the onboarding estimate;
- show which gate failed;
- resume when the gate is satisfied;
- preserve all raw observations for auditability.

### 3.8 Initial learning period

MacroFactor publicly says the initial estimate remains for a few days, and its later accuracy article says the adaptive algorithms can begin updating around day 3. The estimate generally becomes more personalised after roughly 14–30 days, with accuracy improving materially after three to four weeks of consistent data.

Suggested Hybrid Engine learning phases:

    days_since_start < 7  -> prior-dominant estimate
    7–20 days              -> blended estimate, cautious updates
    21+ valid days         -> observation-dominant estimate

These are proposed Hybrid Engine parameters, not claims about MacroFactor’s private implementation. The day-3/day-7 distinction matters: the app can start learning before it should be trusted as fully calibrated.

### 3.9 Flux range

MacroFactor’s current help material describes “flux range” as an indicator of the magnitude of an expenditure change and the navigable space through which the V3 algorithm may move. It explicitly warns that this is not technically a confidence interval: a larger range does not directly mean a larger probability of error.

For THE Hybrid Engine, the closest honest equivalent is a `decision_range`, not a user-facing confidence percentage:

    decision_range = {
      lower: plausible_low_path,
      upper: plausible_high_path,
      selected: applied_path,
      reason: reason_codes
    }

Store it for audit and visualisation, but do not tell athletes that the range is a calibrated probability interval until the app has been validated for calibration.

## 4. Goals and calorie targets

### 4.1 Goal representation

    Goal {
      type: lose | maintain | gain
      targetWeightKg?
      targetRatePercentPerWeek?
      startDate
      endDate?
      status: active | paused | completed | superseded
    }

Convert a percentage rate to an absolute rate:

    target_rate_kg_per_week =
        current_reference_weight_kg × target_rate_percent_per_week / 100

Using a simple symmetric energy model:

    target_daily_kcal = expenditure
                        + target_rate_kg_per_week × 7700 / 7  // gain

    target_daily_kcal = expenditure
                        - target_rate_kg_per_week × 7700 / 7  // loss

The production engine should use a named energy-conversion model.

### 4.2 Maintenance / dynamic maintenance

MacroFactor’s dynamic maintenance example uses a tolerance band of approximately ±0.7 kg around target weight. Inside the band, recommendations track expenditure. Outside it, the app uses a small correction equivalent to approximately 0.15% of body mass per week.

    if abs(trend_weight - target_weight) <= maintenance_band:
        target = expenditure
    else if trend_weight > target_weight:
        target = expenditure - small_correction
    else:
        target = expenditure + small_correction

Make the band and correction versioned and explainable.

### 4.3 Weekly budget

The weekly target is the primary control variable:

    weekly_calorie_budget = sum(daily_targets[7])

For coached and collaborative modes, moving calories to one day must move calories away from other days so the weekly budget remains intact.

Distribution modes:

- even distribution;
- modest training-day or social-day shifts;
- collaborative user-controlled shifts;
- manual targets with no automatic budget control.

This maps naturally to training-day nutrition emphasis without importing exercise calorie estimates.

### 4.4 No catch-up logic by default

MacroFactor treats each forthcoming week as its own target period. If a user falls behind a long-term goal, the default system does not automatically increase the required weekly rate to “catch up.” A user with a hard deadline must deliberately change the goal rate before the next check-in.

This is an important product decision for the Hybrid Engine: distinguish `goal_progress` from `goal_rate`. Missing a prior target should not silently create a more aggressive prescription.

## 5. Macro allocation

### 5.1 Calorie arithmetic

Approximate energy factors:

    protein = 4 kcal/g
    carbohydrate = 4 kcal/g
    fat = 9 kcal/g

Food-label calories and macro-derived calories will not always match because fibre, alcohol, sugar alcohols, rounding, and food-specific metabolizable energy differ. Treat database calories as the primary energy total and macros as approximate targets.

### 5.2 Protein

MacroFactor publicly says protein is considered first and is influenced by:

- current body mass and rough lean mass;
- body-composition category;
- goal;
- protein preference;
- exercise type: no serious exercise, endurance, resistance, or combined training.

The exact coefficient mapping is not public. A Hybrid Engine policy can implement:

    FFM = body_weight_kg × (1 - body_fat_fraction)
    protein_target = bounded(profile_range × FFM, min_protein, max_protein)

If body-fat data are unreliable, fall back to body mass and mark the source lower-confidence. Do not create false accuracy from a smart scale.

MacroFactor published a revised table for lifters in November 2025. The values below are grams per kilogram of fat-free mass and should be treated as a current product reference, not universal physiological law:

    Goal: bulking or maintaining
      low      1.75
      moderate 2.35
      high     2.75
      extra    3.10

    Goal: cutting
      low      2.00
      moderate 2.50
      high     3.00
      extra    3.50

The public table is specifically for lifters. Do not apply it unchanged to endurance-only or non-exercising users. Store the exercise profile, goal, protein category, and table version as part of the target provenance.

#### Non-lifter and endurance gap

MacroFactor publicly confirms the ordering of its hidden exercise modifiers:

    no structured exercise < aerobic/cardio only < resistance training
    combined training uses the resistance-training side of the ordering

It does not publish the current numeric lookup table for non-lifters or endurance-only users. Its public guidance gives broad ranges rather than the in-app coefficients: roughly 1.2–1.8 g/kg/day for non-lifters in one MacroFactor article, and 1.2–2.2 g/kg/day for active people in its help guidance. Separately, a recent peer-reviewed endurance review suggests approximately 1.8 g/kg/day as a useful endurance-athlete target, with needs potentially exceeding 2.0 g/kg/day during carbohydrate-restricted training or rest days. These are public guidance and research ranges, not proof of the app’s hidden table. [MacroFactor cardio-experience help](https://help.macrofactorapp.com/en/articles/59-change-your-cardio-experience) [MacroFactor protein guidance](https://macrofactor.com/best-macro-tracker-app/) [Endurance protein review](https://pubmed.ncbi.nlm.nih.gov/40117058/)

For THE Hybrid Engine, use an explicit policy table until product data or exports allow calibration:

    no structured exercise:        1.2–1.6 g/kg body mass
    aerobic/endurance only:        1.5–1.8 g/kg body mass
    resistance or hybrid training: 1.6–2.2 g/kg body mass
    cutting + lean + resistance:  2.3–3.1 g/kg FFM as an optional high-protection range

The last row is supported by a peer-reviewed review of energy-restricted, resistance-trained lean athletes, but it should not be presented as a universal requirement. [Helms et al. review](https://pubmed.ncbi.nlm.nih.gov/24092765/)

### 5.3 Fat and carbohydrate

After protein:

    remaining_kcal = target_kcal - 4 × protein_g

Then apply a fat floor and the user’s preference:

    fat_g = remaining_kcal × fat_energy_share / 9
    carb_g = (remaining_kcal - 9 × fat_g) / 4

MacroFactor’s published lower-limit equation is:

    fat_floor_g = max(30, 30 + 0.5 × (height_cm - 150))

For a person under 150 cm, it recommends using 30 g/day rather than extending the equation below that point. MacroFactor also describes 20–35% of total energy as a general public-health range, but its coached plans use the absolute floor when calories are low. This is a product safety guardrail, not a universally proven minimum for every person. [MacroFactor fat-floor help](https://help.macrofactorapp.com/en/articles/78-how-much-dietary-fat-should-you-eat)

Public diet styles include:

- high-carbohydrate / low-fat: prioritise carbohydrate over fat after protein, while never dropping fat below the calculated lower limit;
- balanced: distribute remaining energy approximately evenly between carbohydrate and fat; in a manual program, MacroFactor describes this as carbohydrate grams being about 2–2.5 times fat grams because fat has 2.25 times the energy density;
- low-carbohydrate / high-fat: prioritise fat over carbohydrate after protein; MacroFactor describes typical low-carb settings as around 30% of energy or lower, with an absolute ceiling around 200 g/day depending on circumstances;
- keto: assign a very low carbohydrate target intended to allow fibre and some flexibility without generally taking the user out of ketosis, then allocate most remaining non-protein energy to fat. The carb value is better treated as an upper limit than a precise minimum target.

When calories become very low, MacroFactor publicly describes prioritising a safe fat intake, then protein, then carbohydrate. Expose this as a safety rule with a reason code.

Do not hard-code MacroFactor’s low-carb or keto behaviour as an exercise recommendation. Peer-reviewed evidence supports a context-dependent interpretation: ketogenic diets can preserve many aerobic outcomes in some trained populations, but repeated high-intensity performance is more vulnerable when glycogen availability is low. For a hybrid athlete, the app should warn when a low-carb choice conflicts with planned high-intensity or high-volume work, rather than silently changing the user’s diet. [MacroFactor carbohydrate guidance](https://help.macrofactorapp.com/en/articles/76-how-many-carbohydrates-should-you-eat) [Endurance keto meta-analysis](https://pubmed.ncbi.nlm.nih.gov/34445057/) [Anaerobic performance meta-analysis](https://pubmed.ncbi.nlm.nih.gov/42197050/)

### 5.5 Body-fat category logic

MacroFactor uses a profile-level, rough body-fat estimate for two purposes only:

1. estimating lean mass for the initial Cunningham-based expenditure estimate;
2. scaling coached-program protein recommendations.

It does not use day-to-day body-fat readings to drive recommendations because BIA, DEXA and circumference estimates are too noisy at the individual level. The public article gives an example of adjacent categories at 18–23%, 24–30% and 30–34%, where the same moderate protein preference produced 192 g, 177 g and 165 g respectively for a 102 kg example. MacroFactor does not publish the complete current category table or all sex-specific boundaries. Therefore the correct implementation is category-based and versioned, not a precise body-fat calculator.

Implementation policy:

    profile_body_fat_category -> representative_body_fat_fraction -> FFM
    FFM = body_mass × (1 - representative_body_fat_fraction)

Store both the selected category and the representative value used. If the user is uncertain, allow a range or confidence flag; do not let a smart-scale reading silently overwrite the profile estimate. Changes to adjacent categories should produce a small, explainable target change, not a complete recalibration. [MacroFactor body-composition article](https://macrofactor.com/body-composition/) [Change body-fat profile](https://help.macrofactorapp.com/en/articles/58-change-your-body-fat-percentage)

### 5.6 Goal-rate and calorie-floor rules

MacroFactor expresses gain and loss goals as a percentage of current body weight per week. The absolute kilogram target therefore changes as body mass changes. Its public cutting guidance recommends starting around 0.25–1.0%/week, with approximately 0.5–0.75%/week corresponding to a moderate 10–20% relative energy deficit. It advises keeping the practical upper boundary below 2 lb/1 kg per week and notes that deficits above roughly 1,000 kcal/day are usually difficult to sustain.

Its public bulking table is experience-sensitive:

    Beginner:     0.20 / 0.50 / 0.80 / 1.00 % body mass/week
    Intermediate: 0.15 / 0.325 / 0.575 / 0.80 % body mass/week
    Experienced:  0.10 / 0.15 / 0.35 / 0.60 % body mass/week

The columns are conservative, happy-medium, aggressive and very-aggressive. MacroFactor also caps these percentage outputs in absolute kg/week because percentage scaling becomes unreasonable at very high body masses. [MacroFactor cutting calculator](https://macrofactor.com/cutting-calculator/) [MacroFactor bulking calculator](https://macrofactor.com/bulking-calculator/)

Calorie floors are a separate guardrail from the goal rate:

- standard floor: 1,200 kcal/day;
- low floor: individualized from minimum protein, fat and carbohydrate amounts needed for basic physiological function over moderate periods;
- no floor: available as an opt-out, but explicitly cautioned against;
- collaborative and manual programs do not provide the same coached-plan safety rails.

There is no scientifically universal calorie floor that is safe for every adult. A fixed 1,200 kcal floor is a product rule. For THE Hybrid Engine, combine the product-style floor with a body-size and training-aware under-fuelling screen. For athletes, calculate energy availability as:

    EA = (energy_intake - exercise_energy_expenditure) / FFM_kg

Treat low EA as a risk signal requiring review, not a diagnostic threshold. The IOC specifically warns that a universal 30 kcal/kg FFM/day threshold is an imperfect clinical cutoff, especially in men. [MacroFactor coached-program options](https://help.macrofactorapp.com/en/articles/34-what-are-the-different-program-options-in-coached-mode) [IOC RED-S consensus](https://doi.org/10.1136/bjsports-2023-106994)

### 5.7 Calorie floor and fat-floor rules

MacroFactor documents three calorie-floor choices in coached mode:

- **Standard floor:** 1,200 kcal/day.
- **Low floor:** individualised from the minimum protein, fat, and carbohydrate levels the product considers necessary for basic physiological functions over moderate periods.
- **No floor:** the user can opt out.

The exact production formula for the individualised low calorie floor is not published. Do not reverse-engineer it from the standard value or claim that it is a medical safety threshold.

MacroFactor separately publishes a lower-bound estimate for dietary fat:

    fat_floor_g = ((height_cm - 150) × 0.5) + 30

For someone under 150 cm, the article says to use 30 g/day rather than the equation. This is a public fat lower-bound heuristic, not proof that the app’s low calorie floor is calculated from this equation alone.

When a coached plan reaches low energy intake, the documented priority is: preserve the minimum fat recommendation first, then protein, and reduce carbohydrate for further calorie reductions. The Hybrid Engine should expose the floor choice, formula version, and any constraint conflict instead of silently producing an impossible macro plan.

## 6. Weekly update and check-in

### 6.1 Trigger

- The user selects a weekly check-in day.
- A check-in becomes available once per week on coached or collaborative plans.
- The app reviews the latest data and prepares modules.
- The user can complete, skip modules, use Fast Check-In, or decline the update.

The check-in itself is schedule-based, not a documented event that fires only when a particular weight-change threshold is crossed. Data quality controls whether expenditure is updating or holding, and module predicates control which questions appear. The exact internal module-ranking logic is not public.

### 6.2 Deterministic module selection

Modules should be selected by predicates, not by an LLM deciding what to do:

    if suspicious_partial_days: show PartialLoggingModule
    if no_weight_entry_for_current_day and module_enabled: show WeighInModule
    if unlogged_days_not_marked_fasted: show FastingModule
    if expenditure_paused_at_any_point_this_week: show LoggingBreakModule
    if weekly_program_recommendation_ready: show ProgramUpdateModule

The coach layer can write the explanation, but the engine must produce the predicate, evidence, action, and next recheck condition.

### 6.3 Module behaviour

**Partial logging:** detect a day considerably below the recent norm or entries suggesting breakfast/lunch without a plausible dinner. Ask whether it was complete, partial, genuinely low, or better represented by a total estimate. Never silently reinterpret it.

**Weigh-in:** if there is no recent weight, ask for one. Allow skip, but state that expenditure may hold.

**Fasting:** if a day is blank, ask whether it was a genuine zero-calorie fast or simply unlogged. Only mark fasting after confirmation.

**Logging break:** explain that expenditure is held because recent data are insufficient. Show missing days and the resume condition.

**Program update:** show the previous target, new target, kcal/day and kcal/week change, expenditure estimate, trend rate, data coverage, goal rate, and reason codes. Require explicit acceptance. Declining must not erase the estimate or evidence.

Official trigger details that should be preserved in the implementation:

- The weigh-in module is surfaced when enabled and there is no weight entry for the current day; it reports the last weigh-in and offers a new entry before recommendations are generated. The user can decline.
- The fasting module concerns unlogged days that have not been marked as fasting.
- The logging-break module is surfaced when expenditure was paused at some point during the week.
- The partial-logging module asks whether suspected incomplete days should be marked incomplete so they do not negatively affect the algorithm.
- Modules are curated and can be skipped or permanently dismissed. Fast Check-In bypasses modules and goes directly to recommendations.
- The program update is a recommendation, not an automatic mutation: the user can decline it, in which case the proposed calorie recommendation is not applied.

## 7. Damped updating

MacroFactor publicly states that weekly recommendations are not changed one-for-one with every short-term expenditure fluctuation. The purpose is to avoid a calorie roller-coaster caused by water retention, constipation, illness, or random noise.

The exact damping function is not public. A transparent Hybrid Engine implementation can use:

    raw_delta = inferred_expenditure - previous_expenditure

    confidence_weight =
        f(data_coverage, history_length, trend_stability)

    bounded_delta = clamp(
        raw_delta × confidence_weight,
        -max_weekly_decrease,
        +max_weekly_increase
    )

    new_expenditure = previous_expenditure + bounded_delta

Policy:

- cleaner data and longer history increase the update weight;
- sudden trend reversals reduce the weight until confirmed;
- a hold produces zero target change, not a reset;
- manual changes are not treated as expenditure evidence;
- a new goal may activate a short predictive transition, visibly labelled as predictive.

MacroFactor’s own examples indicate that a one- or two-week deviation is not enough to force a large correction; after roughly three to four weeks of consistent evidence pointing in the same direction, it becomes more confident that expenditure has materially changed. This is a behavioural description, not a disclosed coefficient.

### 7.1 Program-update rules documented by MacroFactor

The public rules are:

1. Energy-target changes are determined by expenditure changes, goal changes, and an additional smoothing layer.
2. A slower loss target or faster gain target requires a smaller deficit or larger surplus, respectively; the reverse goal change works in the opposite direction.
3. If a goal rate is changed during a week, the change is reflected at the next check-in unless a new program is created first.
4. If a new program is created after changing the goal rate, that new program already incorporates the goal change; the next check-in reflects only expenditure changes since the new program was created.
5. A new program or goal change does not reset the expenditure algorithm or erase logged data. Changing the expenditure calculation start date is the separate reset/restart control.
6. Each forthcoming week is treated as a self-contained target period. The app does not automatically increase the future rate to catch up for a missed prior rate.
7. If a user eats above or below the previous target, MacroFactor uses actual logged intake and weight response; it does not punish the user by forcing a catch-up adjustment.
8. Weekly recommendations are intentionally not one-for-one with every short-term expenditure change. The exact smoothing and guardrails remain proprietary.

These rules are the behaviour to copy. The exact controller that converts expenditure and goal changes into a new daily or weekly target is not public.

## 8. Expenditure modifiers

### Step-Informed Updates

MacroFactor’s current modifier uses step-count trends to speed expenditure updates when steps trend up or down. It does not assign a direct calorie value to steps and does not use wearable calorie-burn estimates for the core calculation.

For the Hybrid Engine:

    step_trend = robust_recent_average(steps) - robust_baseline(steps)

Use step trend as a bounded confidence/prediction modifier. Do not calculate steps × calories-per-step and add it directly to expenditure.

### Predictive Goal Adjustment

This anticipates likely expenditure response during the first two weeks after certain goal changes. Because it predicts ahead of observed outcome data, the user should be told that it is provisional.

MacroFactor’s November 2025 technical article publishes one additional heuristic: the initial expenditure estimate was multiplied by approximately **four times the intended weekly weight-change percentage**, expressed as a signed fraction of body mass. In a signed representation where loss is negative and gain is positive:

    goal_prior_multiplier = 1 + 4 × intended_rate_fraction_per_week

For example, a target of -1.0%/week implies approximately `1 - 0.04 = 0.96`, while a target of +0.5%/week implies approximately `1 + 0.02 = 1.02`. A transition from -1.0%/week loss to +0.5%/week gain therefore creates an approximately 6% difference between the two goal priors, matching MacroFactor’s published example.

This is a creator-reported product heuristic, not an independently validated physiological constant. The full production behavior remains private: exact caps, user-specific conditions, interaction with BMR adaptation, and time-decay/update gains are not published. Keep it versioned, bounded, and behind a feature flag; compare it against a no-predictive-modifier control.

    if goal_change_direction is known
       and transition_age_days <= 14:
        apply bounded predictive prior
    else:
        rely on observed intake + trend response

The predictive prior must decay and must not permanently overwrite the observed estimate.

Sources: [MacroFactor expenditure-modifier technical article](https://macrofactor.com/expenditure-modifiers/) and [modifier Help Centre](https://help.macrofactorapp.com/en/articles/274-expenditure-modifiers).

## 9. Recommended Hybrid Engine architecture

This fits the existing project separation:

    packages/nutrition-core
      schemas, units, goals, macro policies, reason codes

    packages/nutrition-engine
      validation, trend, expenditure, budget, macro allocation,
      modifiers, check-in predicates, update state machine

    packages/nutrition-adapter
      food database, barcode/AI logging, wearable and scale imports,
      UI mapping

    packages/whole-athlete-state
      observed intake, estimated expenditure, data quality,
      energy-availability observations, constraints

    HybridEmit boundary
      nutrition targets only when an intentional nutrition plan is emitted

The training engine should receive observed intake, estimated expenditure/freshness, data quality, low-energy-availability or illness constraints, and an athlete-approved target when the nutrition engine produces one.

It should not generate a hidden calorie target from training load. This preserves the existing project rule that prescription targets and athlete results remain separate.

## 10. Suggested data contracts

    type NutritionDayStatus =
      | "complete" | "estimated" | "fasting"
      | "partial" | "blank" | "imported";

    interface NutritionObservation {
      athleteId: string;
      date: string;
      caloriesKcal?: number;
      proteinG?: number;
      carbsG?: number;
      fatG?: number;
      status: NutritionDayStatus;
      source: "manual" | "food_log" | "import" | "coach";
      completeness: number;       // coverage, not accuracy
      isUserConfirmed: boolean;
    }

    interface ExpenditureState {
      estimateKcal: number;
      priorEstimateKcal: number;
      status: "insufficient_data" | "updating"
        | "holding" | "stale";
      confidenceBand?: { lowKcal: number; highKcal: number };
      historyDays: number;
      validNutritionDays7: number;
      validWeightDays7: number;
      trendWeightKg?: number;
      changeRateKgPerWeek?: number;
      fluxRange?: {
        lowKcal: number;
        highKcal: number;
        selectedKcal: number;
        isCalibratedInterval: false;
      };
      algorithmVersion: string;
      filterVersion: string;
      reasonCodes: string[];
      lastUpdatedAt: string;
    }

    interface NutritionTargetPlan {
      goalId: string;
      weeklyCalories: number;
      dailyTargets: Array<{
        date: string;
        caloriesKcal: number;
        proteinG: number;
        carbsG: number;
        fatG: number;
      }>;
      distribution: "even" | "shifted"
        | "collaborative" | "manual";
      source: "initial_prior" | "observed_update"
        | "predictive_modifier" | "user_override";
      acceptedAt?: string;
    }

## 11. Engine pseudocode

    onObservationChanged(observation):
        persistRawObservation(observation)
        classifyDataQuality(observation)
        rebuildWeightTrend()
        coverage = calculateCoverage(last_7_days)

        if not enoughHistory():
            state = insufficient_data
            return

        if coverage fails updateGate:
            state = holding
            retainLastHighConfidenceExpenditure()
            return

        inferred = inferExpenditure(
            validNutrition,
            weightTrend,
            changeRate,
            energyConversionModel
        )

        predicted = applyOptionalModifiers(
            inferred,
            stepTrend,
            goalTransition
        )

        smoothed = dampUpdate(
            previousExpenditure,
            predicted,
            dataQuality,
            trendStability,
            historyLength
        )

        persistExpenditureState(smoothed, reasonCodes)

    onWeeklyCheckIn():
        modules = selectModules(
            dataQuality, currentGoal, expenditureState
        )
        presentModulesInOrder(modules)
        resolveUserCorrections()

        if updateAccepted:
            target = buildGoalTarget(expenditureState, currentGoal)
            macros = allocateMacros(
                target, preferences, exerciseProfile
            )
            budget = distributeWeeklyCalories(macros, schedule)
            persistNewPlan(budget)
        else:
            persistCheckInDeclined()

## 12. What not to copy blindly

1. Do not claim the estimate is true TDEE. It is a useful, self-correcting intake-target estimate, not direct calorimetry.
2. Do not claim the 4/7 and 1/7 gates are universal science. They are operating rules.
3. Do not add wearable calorie burn to the estimate. Use activity data only as bounded, validated modifiers.
4. Do not make partial logging look like a real low-calorie day.
5. Do not update targets directly from raw scale weight.
6. Do not let an LLM decide the numerical adjustment. The coach can explain deterministic outputs.
7. Do not hide user overrides, declined updates, skipped weigh-ins, or predictive modifiers.
8. Do not use a confidence percentage until it is calibrated against your own app outcomes.

9. Do not treat MacroFactor’s flux range as a conventional confidence interval. Its own documentation says it represents navigable algorithmic space, not a direct error probability.

## 13. Validation plan

Create replay tests for:

- stable intake and stable weight;
- stable intake with realistic ±1–2 kg noise;
- genuine gradual loss and gain;
- high-sodium/high-carbohydrate meal;
- creatine start;
- menstrual-cycle or other predictable fluid shifts where relevant;
- missing weights with interpolation;
- four of seven nutrition days;
- three of seven nutrition days and a hold;
- partial breakfast/lunch logging with missing dinner;
- confirmed fasting day;
- illness, holiday, or logging break;
- sudden step increase/decrease;
- cut-to-maintenance transition;
- maintenance drift above and below target;
- manual override and declined check-in;
- backfilled data and algorithm-version migration.

Also evaluate predictive validity separately from measurement validity. MacroFactor’s public evaluation predicts future weight change from intake and estimated expenditure, then compares that prediction with observed weight change. That is useful for judging whether targets work, but it is not the same as validating expenditure against a metabolic chamber or doubly labelled water.

For every replay, assert:

- raw observations are preserved;
- trend does not overreact to one outlier;
- expenditure holds when the gate fails;
- a hold does not reset to onboarding;
- target changes are bounded;
- every change has a reason code and source;
- training receives observations/constraints, not an accidental prescription;
- the UI explains what happened in plain language.

## 14. Recommended first release

Do not start by attempting to recreate private Expenditure V3. Build this smaller, auditable version first:

1. onboarding prior using one documented BMR method;
2. daily intake and weight observations;
3. complete/estimated/partial/blank/fasting statuses;
4. transparent trend-weight filter;
5. 20-day change-rate calculation;
6. observed expenditure using a named energy-conversion model;
7. four-of-seven nutrition and one-of-seven weight gates;
8. holding state;
9. goal-based weekly budget;
10. protein-first macro allocation with fat floor;
11. bounded weekly update;
12. check-in modules;
13. provenance and reason codes;
14. replay tests.

That captures the important product mechanism without pretending to possess MacroFactor’s undisclosed code. Once stable, add step-informed updates, predictive goal transitions, food-database quality scoring, and calibrated uncertainty display.

## 15. Deep-research findings and evidence grades

### High confidence: official product behaviour

- V3 minimum operating gate: nutrition on 4 of 7 days and weight on 1 of 7 days. Daily nutrition and at least three weigh-ins per week are preferred.
- V1/V2 had a stricter nutrition minimum of 6 of 7 days.
- V3 preserves the last high-confidence expenditure when paused rather than falling back to the initial estimate.
- A full-day estimate within roughly 30% of normal tracking accuracy is preferred to a partial day; a blank day is preferable to partial logging.
- V3 is reported as about 1–5 days faster at detecting durable changes than V2, with day-to-day expenditure updates generally about 35% smaller.
- The current modifier release reports approximately 6–8% better short-term accuracy and approximately 20% better long-term accuracy with both modifiers enabled.
- V3 can make behind-the-scenes intake estimates for unlogged days. In MacroFactor’s published test, the average relative error was about 13% and more than 90% of errors were below 30%. This is evidence about the tested predictor’s performance, not its formula.
- MacroFactor states that its expenditure calculation uses the last 21 days of nutrition data. A partial day can therefore affect the calculation for roughly three weeks. This is a documented lookback effect, not confirmation of a simple 21-day average.
- The partial-logging coaching module flags days with energy totals considerably below the user’s norm and asks the user to confirm or exclude them. The public documentation does not expose the exact live threshold.
- V3’s tissue-energy explanation publishes approximate fat and lean tissue energy densities of 4,282 and 824 kcal/lb, respectively, and says V3 corrected the upward bias caused by asymmetric gain/loss assumptions. It does not publish the current interpolation function.

### Medium confidence: creator-reported internal evaluation

MacroFactor’s November 2025 accuracy article reports a first-party analysis of 748 challenge participants after exclusions. It evaluates predictive validity using monthly and cumulative predicted-versus-observed weight change. It reports a median post-calibration expenditure error around 135 kcal/day in one comparison and an ongoing median around 80 kcal/day after the initial calibration period. These numbers are useful context, but they are not independent validation and should not be copied as an expected error guarantee for Hybrid Engine users.

The same article describes an evaluation heuristic for likely partial logging: logged energy below 50% of other days in the same week. That is an evaluation filter, not proof that the live app uses exactly that threshold.

### Low confidence: secondary technical clue

A third-party podcast description refers to MacroFactor using a “20-day exponential moving average.” Official MacroFactor pages confirm a recent-weight-emphasised averaging approach and a 20-day change-rate horizon, but they do not publish the exact filter as “EMA with a specified alpha.” Treat the EMA claim as a useful hypothesis for a Hybrid Engine prototype, not as a recovered MacroFactor equation.

The podcast transcript is a real secondary clue, but it is not a MacroFactor engineer describing the implementation. The speaker says “20 day exponential moving average” while explaining the product to listeners. MacroFactor’s own wording is weaker and more precise: a recent-weight-emphasised moving average plus a 20-day change-rate horizon. Confidence that the product uses some recent-emphasis filter: high. Confidence that the exact filter is a 20-day EMA with the conventional alpha `2/(20+1)`: low.

A separate 2026 N=1 analysis using a long MacroFactor export labels the exported Trend Weight series “exponentially-smoothed.” That is consistent with the podcast clue, but the author is analysing exported outputs rather than inspecting MacroFactor code, and does not recover an alpha or confirm that the live V3 implementation is a plain EMA. Confidence: low-to-medium for “exponential-like output”; low for any exact filter claim. Source: https://nasser1931.com/paper

### App-store and release-note evidence

The public App Store history adds version timing but no equations. The relevant entries are:

- Version 3.1.0, October 2024: V3, better responsiveness/stability, improved missing-data handling, and three days of consistent tracking to unpause after inactivity.
- Version 5.6.0, November 2025: “Expenditure V3 optimized” and new V3 modifiers.
- Later entries mostly list bug fixes, AI workflows, and food-logging features; they do not expose changes to the trend filter, missing-intake predictor, tissue model, or update gains.

This supports a versioned implementation strategy, but it provides no recoverable coefficient.

### Patent search result

Searches across Google Patents for `MacroFactor`, `Stronger By Science`, `Greg Nuckols`, “trend weight” combined with nutrition/expenditure, and related adaptive-calorie terms did not surface a patent that identifies MacroFactor’s V3 calculations. This is a negative search result, not proof that no relevant filing exists under another legal entity or unpublished application. No patent-derived formula should be added to the implementation.

### GitHub and reverse-engineering evidence

The public GitHub material falls into three categories:

- export visualisers/importers, such as `jordangarrison/vitals`, which read MacroFactor XLSX exports including scale weight, trend weight, TDEE, and nutrition;
- local export/MCP tools, such as `NasserAlbusaidi/macrofactor-mcp`, which explicitly require a manual export and state that they do not connect to a MacroFactor API;
- unofficial API clients, such as `sjawhar/macrofactor`, which expose account data and backend schemas. That repository is archived and warns that Firebase App Check now prevents third-party authentication.

None of these repositories contains a credible V3 expenditure reimplementation. The unofficial client is useful evidence about data access and export surfaces, not about the internal estimator. It also means reverse engineering through the old backend client is not a reliable path to recovering the algorithm.

### Still unknown

- V3’s exact state-space or weighting model.
- How the flux range is calculated and how the selected route is chosen.
- The exact hidden intake predictor used on missing days.
- Whether missing-day predictions use a rolling mean, a model conditional on weight/trend, a food-log pattern model, or a combination of these.
- Exact caps, gains, and transitions for target updates.
- Exact step-trend and predictive-goal formulas.
- Whether the live product has changed any of these mechanisms after the published 2025 modifier update.

## 16. Deep technical implementation addendum

### 16.1 Separate inference from simulation

The empirical estimator and a physiological projection model should be separate products inside the engine:

```text
observed intake + observed weight -> empirical expenditure estimate
goal + body composition + activity  -> scenario projection / goal-date estimate
```

The NIDDK/Hall model is useful for forward simulations because it represents fat mass, lean mass, glycogen, fluid, thermic effect of food, physical activity, and adaptive thermogenesis. It should not be silently substituted for the observed intake/weight feedback loop. In particular, early carbohydrate or glycogen changes can move scale weight through associated water without representing an equivalent tissue-energy change.

Recommended ownership in THE Hybrid Engine:

- `nutrition-core`: units, goals, macro constraints, versioned policy tables.
- `nutrition-engine`: trend filtering, data quality, expenditure inference, target controller, modifiers.
- `nutrition-simulator`: optional Hall-style forward projections and goal-date scenarios.
- `whole-athlete-state`: training/recovery context and constraints only; it should not silently create nutrition prescriptions.
- `HybridEmit`: emit target-only nutrition observations/constraints to training surfaces.

### 16.2 Trend filter candidates

The public evidence supports a recent-emphasis trend, but not a published MacroFactor alpha. Prototype two explicit candidates:

1. robust EWMA, with observed and interpolated weights carrying different gains;
2. a local-linear Kalman filter, where missing observations run the prediction step but skip the measurement update.

Select the production filter using replay metrics: resistance to water-weight shocks, time-to-detect a durable change, slope error, and target volatility. Do not choose solely by which line looks smooth. Keep `filterVersion` in every derived-state record so migrations are replayable.

### 16.3 Nutrition missingness is a first-class state

Use separate states for `complete`, `estimated`, `imported`, `fasting`, `partial`, `blank`, and `suspect`. The correct order of preference for a difficult day is:

```text
credible full-day estimate -> blank/excluded day -> partial logged day
```

The ±30% estimate guidance is MacroFactor’s operational recommendation, not a universal scientific cutoff. For the Hybrid Engine, ask the athlete to confirm an estimate or explicitly exclude the day; never coerce a blank day to zero calories or a partial day to a complete day.

Use effective sample size alongside coverage:

```text
n_eff = (sum(weights)^2) / sum(weights^2)
```

This lets confidence and update gain fall when the apparent number of days is inflated by low-quality or interpolated observations.

### 16.4 Transparent update controller

The auditable controller is:

```text
weighted intake = weighted mean(valid intake)
trend slope     = weighted regression(trend weight, recent window)
raw expenditure = weighted intake - energy_density * trend slope
new expenditure = old expenditure + gain * clamp(raw - old, -cap, +cap)
```

The gain should depend on history length, nutrition coverage, weight coverage, slope stability, and confirmed modifiers. Low-quality data can produce a hold or a small gain; it should not produce a confident large correction. Initial BMR/TDEE is a prior, not a replacement for observed evidence.

### 16.5 Modifier design rules

MacroFactor’s public Step-Informed Updates description supports changing update responsiveness from step trends; it does not support adding a fixed number of calories per step. The safer first implementation is a capped gain adjustment only when step coverage is reliable and the step residual agrees with the intake/weight residual.

Predictive Goal Adjustment should be a bounded, decaying prior behind a feature flag. Treat the reported approximately 6% example as a product result, not a universal constant. Log the goal transition, modifier magnitude, expiry/decay, and whether later observations absorbed or contradicted it.

### 16.6 Check-in event contract

Every weekly check-in should be an auditable state transition:

```json
{
  "event": "nutrition_program_update",
  "algorithmVersion": "hybrid-exp-v1",
  "filterVersion": "robust-ewma-v1",
  "windowDays": 21,
  "validNutritionDays": 16,
  "observedWeightDays": 12,
  "trendSlopeKgWeek": -0.42,
  "oldExpenditureKcal": 2680,
  "newExpenditureKcal": 2715,
  "goalRateKgWeek": -0.35,
  "weeklyBudgetKcal": 16555,
  "modifierEvents": [],
  "dataQuality": "updating",
  "userDecision": "accepted"
}
```

The UI should preview old versus new expenditure, weekly budget, observed versus desired rate, macro changes, data coverage, and the reason for the change. `accept`, `hold`, `edit`, `skip`, and `decline` must remain distinguishable in the event log.

### 16.7 Public implementation search

The deeper search found export tools and unofficial integrations, not a credible V3 reimplementation. Examples include:

- [Jordan Garrison’s vitals](https://github.com/jordangarrison/vitals), which works with exported MacroFactor data.
- [Nasser Albusaidi’s MacroFactor MCP](https://github.com/NasserAlbusaidi/macrofactor-mcp), which reads manual exports and explicitly does not implement the proprietary algorithm.
- [Sjawhar’s unofficial MacroFactor integration](https://github.com/sjawhar/macrofactor), which exposes account/export data rather than the internal equations.

These are useful for export schema and replay tooling only. They should not be treated as evidence of MacroFactor’s internal calculations. If THE Hybrid Engine obtains anonymised MacroFactor exports, the practical reverse-engineering route is to fit candidate trend filters and update controllers against exported trend/TDEE series, then perturb one variable at a time: missing food, partial food, a weight spike, a sustained step change, and a goal-rate change.

### 16.8 Validation boundary

MacroFactor’s public accuracy work is predictive-validity analysis: it compares predicted and observed weight change. That is different from direct validation against doubly labelled water or a metabolic chamber. THE Hybrid Engine should report both separately:

- target effectiveness: future weight-change prediction error;
- estimator validity: comparison with a reference expenditure method where available.

Do not use vendor-reported accuracy numbers as a promise to users. Freeze algorithm versions before evaluation, separate calibration from test data, and report performance by data quality, goal phase, training status, body size, and activity pattern.

The complete academic and implementation companion is [MacroFactor_Deep_Technical_Research_Hybrid_Engine.md](sandbox:/workspace/scratch/9db1c7f8a75a/MacroFactor_Deep_Technical_Research_Hybrid_Engine.md).

## 17. Gap-closure evidence register

This register is limited to MacroFactor’s own articles, help centre, and release notes. It separates the evidence from the Hybrid implementation decisions.

### Activity factors

- **Exact documented table:** the official algorithms article publishes the “MacroFactor Correction Factors” image: general activity 1.2 / 1.4 / 1.6 for low / moderate / high activity, plus exercise corrections of +0.0 / +0.1 / +0.2 / +0.3 for 0 / 1–3 / 4–6 / 7+ sessions per week.
- **Evidence:** the article says MacroFactor developed custom activity factors that separate day-to-day activity from exercise activity, and its worked example uses `1938 × (1.4 + 0.1) = 2907`.
- **Still unknown:** the exact questionnaire wording and classification rules behind each bucket, including duration, intensity, physically demanding work, borderline cases, and whether the current app has revised the 2024 table.
- **Source:** [MacroFactor’s Algorithms and Core Philosophy](https://macrofactor.com/macrofactors-algorithms-and-core-philosophy/) and the [official correction-factor image](https://macrofactor.com/wp-content/uploads/2024/02/image-1.png).

### Onboarding and calibration

- **Adaptive start:** the November 2025 accuracy article says the estimates “begin updating on the third day.”
- **First visible movement:** the October 2024 algorithms article says the initial estimate remains for a few days and starts moving after about a week.
- **Refinement:** the help centre says a good estimate generally takes 2–3 weeks; the algorithms article describes 14–30 days for day-to-day changes to slow; the same article says prior high-quality data can let the system “get to know you” from day 1.
- **Practical calibration:** the accuracy article attributes most initial-estimate error to the first 3–4 weeks, after which the algorithms have “fully taken over.”
- **Resume after inactivity:** V3 release notes say three days of consistent tracking are required to unpause after inactivity.
- **Interpretation:** these are different milestones, not one exact hidden calibration switch. Hybrid labels such as `initial_prior`, `adaptive_learning_started`, `partially_personalised`, and `initial_calibration_complete` are implementation labels, not MacroFactor’s published state names.
- **Sources:** [Algorithm accuracy](https://macrofactor.com/algorithm-accuracy/), [Algorithms and Core Philosophy](https://macrofactor.com/macrofactors-algorithms-and-core-philosophy/), [Interpreting expenditure changes](https://help.macrofactorapp.com/en/articles/26-how-should-i-interpret-changes-to-my-energy-expenditure), and [V3 release notes](https://macrofactor.com/version-3-1-0/).

### Check-in availability and module triggers

- **Schedule:** the help centre says check-ins are weekly, available on coached or collaborative programs, and tied to a user-selected check-in day.
- **Weight module:** if enabled and no weight has been entered for the current day, the module shows the last weigh-in and asks whether the user wants to enter a new one before recommendations are generated.
- **Nutrition module:** the partial-logging module checks for days that might be incomplete; the fasting module checks unlogged days not marked as fasting; the logging-break module appears when expenditure was paused during the week.
- **Controls:** modules can be skipped or dismissed; Fast Check-In bypasses modules; declining the check-in prevents the proposed calorie recommendations from being applied.
- **Data gates:** V3 requires nutrition on 4 of 7 days and weight on 1 of 7 days for continuous updating; the preferred pattern is daily nutrition and at least three weigh-ins weekly.
- **Still unknown:** the exact partial-logging classifier, module priority/ranking, and the complete condition for presenting a program-update module.
- **Sources:** [Check-ins and Coaching Modules](https://help.macrofactorapp.com/en/articles/247-introduction-to-check-ins-and-coaching-modules), [Weight logging frequency](https://help.macrofactorapp.com/en/articles/109-how-frequently-do-i-need-to-log-my-weight-for-the-expenditure-algorithm-and-weekly-coaching-updates), [Nutrition logging frequency](https://help.macrofactorapp.com/en/articles/110-how-frequently-do-i-need-to-log-my-nutrition-for-the-expenditure-algorithm-and-weekly-coaching-updates), and [Expenditure Version](https://help.macrofactorapp.com/en/articles/74-expenditure-version).

### Calorie floors

- **Standard floor:** the coached-program article explicitly documents 1,200 kcal/day.
- **Low floor:** it says the low floor is individualised from minimum protein, fat, and carbohydrate levels needed for basic physiological functions over moderate periods.
- **Opt-out:** the user can opt out of calorie floors entirely.
- **Fat lower boundary:** the dietary-fat article publishes `((height_cm − 150) × 0.5) + 30`, with 30 g/day suggested for people under 150 cm.
- **Still unknown:** MacroFactor does not publish the exact production formula for the individualised low calorie floor, nor prove that it is simply protein-plus-fat-plus-carbohydrate arithmetic.
- **Sources:** [Coached program options](https://help.macrofactorapp.com/en/articles/34-what-are-the-different-program-options-in-coached-mode) and [How much dietary fat should you eat?](https://help.macrofactorapp.com/en/articles/78-how-much-dietary-fat-should-you-eat).

### Activity-change behaviour

- **Profile setting:** editing the onboarding activity setting does not directly modify current expenditure or targets.
- **Normal change:** allow the intake/weight loop to absorb the change over roughly 3–4 weeks.
- **Extreme change:** a very large job, injury, illness, or training-volume change may justify a temporary manual bridge because waiting for the algorithm could under- or over-fuel the athlete.
- **Exercise compensation:** increased exercise is not assumed to raise total expenditure one-for-one; substitution, movement economy, and compensation can reduce the net change.
- **Still unknown:** the exact production logic for detecting and quantifying activity transitions.
- **Sources:** [Change activity level](https://help.macrofactorapp.com/en/articles/57-change-your-activity-level), [Drastic activity changes](https://help.macrofactorapp.com/en/articles/210-what-should-i-do-if-my-activity-levels-change-drastically), and [Why exercise may not increase expenditure one-for-one](https://help.macrofactorapp.com/en/articles/256-i-ve-started-exercising-more-why-isn-t-my-expenditure-increasing).

### Edge-case behaviour recovered from official guidance

- **Illness:** if the athlete stops logging, the expenditure estimate enters a holding phase so pre-illness targets are preserved. After returning, MacroFactor says consistent food and weight logging for about a week will restart updates; this is a recovery-specific instruction and should not be confused with V3’s general three-day unpause statement after inactivity. If sick-day data materially distort the estimate, the official guidance allows clearing those food logs and returning to the hold/recovery path.
- **Menstrual-cycle shifts:** V3 claims better handling of large temporary cycle-related weight shifts, and the release notes say this improvement does not require period tracking. Period tracking itself is currently described as personal reference rather than an input to expenditure recommendations.
- **Atypical water/scale days:** users may log or skip a weight they believe is unrepresentative; either is considered acceptable, with at least three weigh-ins per week preferred and one per week generally sufficient. The product does not instruct the user to manually “correct” the scale value.
- **Body recomposition:** profile-level body-fat data informs only the initial expenditure prior and coached protein; day-to-day body-fat estimates do not drive program updates. Weight-only inference can slightly underestimate true expenditure during simultaneous fat loss and lean-mass gain, but MacroFactor’s documented position is that the resulting intake targets can still be appropriate for the user’s weight/recomposition goal.
- **Uncertainty display:** no calibrated numeric confidence interval or probability-of-error rule was recovered. The documented `flux range` is navigable algorithmic space, not a conventional confidence interval.

Sources: [MacroFactor when sick](https://help.macrofactorapp.com/en/articles/203-how-should-i-use-macrofactor-when-i-m-sick), [V3 release notes](https://macrofactor.com/version-3-1-0/), [Period tracking](https://help.macrofactorapp.com/en/articles/17-track-your-period), [Atypical weight logging](https://help.macrofactorapp.com/en/articles/209-should-i-still-log-my-weight-if-i-feel-like-i-m-bloated-constipated-or-retaining-water), and [Body recomposition](https://help.macrofactorapp.com/en/articles/220-how-do-macrofactors-algorithms-respond-to-body-recomposition).

### Program-update rules

- **Inputs:** the help centre identifies expenditure changes, goal changes, and “a bit of additional smoothing logic” as the three drivers of energy-target changes.
- **Goal edits:** a goal-rate change is reflected at the next check-in unless a new program is created first; a new program already reflects the changed goal.
- **No reset:** changing goals or creating a new program does not reset expenditure or delete history; changing the expenditure start date is the separate reset mechanism.
- **No catch-up:** each forthcoming week is self-contained; the system does not make the target rate more aggressive just because a user fell behind.
- **Adherence-neutral:** the system uses actual logged intake and weight response rather than punishing deviation from the previous target.
- **Still unknown:** exact smoothing coefficients, caps, update gains, and the rules determining when a small proposed change is displayed as no change.
- **Sources:** [Weight-gain/loss adjustments](https://help.macrofactorapp.com/en/articles/222-how-does-macrofactor-make-adjustments-for-a-weight-gain-or-weight-loss-goal), [Does my data reset?](https://help.macrofactorapp.com/en/articles/204-does-my-data-reset-if-i-change-goals-or-create-a-new-program), and [Strict timelines](https://help.macrofactorapp.com/en/articles/202-what-should-i-do-if-im-pursuing-a-goal-with-a-strict-timeline).

### Modifier defaults and current-versus-legacy gates

- The current modifier help page describes Step-Informed Updates and Predictive Goal Adjustment as **optional** controls and gives the UI path `More` → `Expenditure` under Feature Settings. It explains the effects of enabling them, but does not state whether either toggle is on or off by default. The App Store release note for version 5.6.0 likewise announces that the V3 modifiers are available without documenting their default state. Store `default: unknown` unless the live product UI is explicitly inspected for the user’s account/version; do not infer a default from the accuracy claims. [Expenditure modifiers help](https://help.macrofactorapp.com/en/articles/274-expenditure-modifiers), [MacroFactor App Store history](https://apps.apple.com/us/app/macrofactor-macro-tracker/id1553503471)
- The current V3 help page documents a minimum of four nutrition days in seven and one weight entry in seven for active updating. An older interpretation article still describes six of seven nutrition days for continuous updates; that is a version/documentation conflict, not evidence that both gates apply simultaneously. Treat four-of-seven as the current V3 operating gate, retain six-of-seven as a legacy V1/V2 compatibility note, and record the algorithm version with every state transition. [Expenditure Version](https://help.macrofactorapp.com/en/articles/74-expenditure-version), [legacy expenditure interpretation](https://help.macrofactorapp.com/en/articles/26-how-should-i-interpret-changes-to-my-energy-expenditure)

### Data export: confirmed fields versus undisclosed schema

MacroFactor’s current export documentation confirms a distinction between a high-level Quick Export and selectable Granular Export datasets:

- **Quick Export:** expenditure, weight trend, scale weight, calories, macros, and primary nutrition targets, over a selected timeframe.
- **Granular Export:** individual spreadsheets/datasets can be selected, but the public help page does not publish a complete current column-by-column schema.
- **Workout export:** the workout export page says Quick Export can include Workouts data, Nutrition data, or both; granular workout data includes exercises, muscle groups, and gym profiles, with nutrition and weight datasets available as applicable.
- **Historical additions:** MacroFactor’s release/annual-report posts explicitly mention nutrition targets, period, fasting, daily expenditure, weight trend, weight, calories/macros, and “more” as exportable data. A version 2.1 release note adds body metrics to export, while an older integration note describes calories, macronutrients, supported micronutrients, weight, and body-fat data for Apple Health/Google Fit export. These historical notes show the surface has expanded over time; they are not a guarantee that every field appears in every current spreadsheet.
- **Privacy categories are not the export schema:** the privacy notice lists goals, calorie/macro programs, body metrics, macro/micronutrient intake, lifestyle answers, step/workout integration data, progress photos, and coaching-module preferences as stored categories. It also says MacroFactor is working toward adding all types of personal data to spreadsheets. Do not treat that inventory as proof that every category is currently exportable.

Implementation contract:

```text
exportDataset = {
  quick: [expenditure, weightTrend, scaleWeight, calories, macros, primaryNutritionTargets],
  granular: userSelectedDatasets,
  schemaVersion: providerReportedOrUnknown,
  source: "macrofactor_export"
}
```

Preserve unknown columns during import, map fields by header rather than column position, and keep the raw workbook for replay. The official sources do not expose all current CSV/XLSX column names, workout/nutrition join keys, or whether every privacy-category field is included in a granular export. [Export your data](https://help.macrofactorapp.com/en/articles/68-export-your-data), [Workouts export](https://help.macrofactorapp.com/en/articles/356-export-your-data), [September 2022 product update](https://macrofactor.com/mm-september-2022/), [2023 annual report](https://macrofactor.com/annual-report-2023/), [version 2.1.0 release notes](https://macrofactor.com/version-2-1-0/), [privacy notice](https://macrofactor.com/privacy/)

## 18. Edge-case gap closure: product facts versus physiology

This section records only the additional findings recovered by the latest search. Product behavior is kept separate from general physiology; a physiological observation is not evidence that MacroFactor uses that observation as a live input or modifier.

### 18.1 Newly recovered MacroFactor product behavior

#### Transient and persistent water shifts

MacroFactor distinguishes, in effect, between short-lived scale noise and persistent water shifts:

- For a several-pound/kilogram fluctuation lasting roughly 1–5 days, the official guidance says expenditure may move, but the next recommendation could be only about 20–30 kcal/day away from ideal. This is a creator-reported product example, not a published error bound.
- V3 specifically lists smaller impacts from fluid retention after a carb- and salt-rich meal, creatine initiation, ovulation or menses; fluid loss after reducing carbohydrate; a post-plateau “whoosh”; and release of fluid retained around ovulation or menses.
- A persistent shift caused by moving between low and high carbohydrate intake, loading creatine, or switching between weight-loss and weight-gain goals can distort the expenditure estimate. MacroFactor says tested errors were generally less than 10% of expenditure and resolved within about two weeks.
- Its worked example says a true 2,000 kcal/day expenditure could be estimated at approximately 1,800–1,900 kcal/day for about two weeks after moving from low-carb to high-carb intake or starting creatine.
- If the athlete wants to avoid acting on that temporary distortion, MacroFactor’s advice is to skip a couple of weekly check-ins, watch the expenditure line, and resume check-ins once the initial movement reverses. This is a user-controlled workflow, not a documented automatic “water-shift mode.”

The implementation consequence is important: record a suspected water-shift event as explanatory metadata, but do not add or subtract calories directly from expenditure. Do not remove the weight observation by default; MacroFactor says logging or skipping an atypical weight is acceptable.

Sources: [Interpreting expenditure changes](https://help.macrofactorapp.com/en/articles/26-how-should-i-interpret-changes-to-my-energy-expenditure), [V3 expenditure article](https://macrofactor.com/expenditure-v3/), and [V3 release notes](https://macrofactor.com/version-3-1-0/).

#### Menstrual-cycle handling and UI

Two separate product facts must not be conflated:

1. V3 claims better performance during large temporary weight shifts around ovulation and menses, and says that improvement does not require period tracking.
2. The nutrition app’s period feature is currently documented as personal reference only. It is not documented as an input to expenditure or target calculations, and the help article says cycle analytics/insights were intended for the future.

The documented nutrition-app UI is:

- `+` → `Edit Day` → `Day Properties` → toggle “Are you on your period?” → save; or
- Dashboard → Period → choose a day → toggle → save.
- Visibility is controlled through `More` → `Data Visibility` → `Period Visibility` → `Period Tracking`.

For THE Hybrid Engine, cycle data should therefore be an optional observation and explanatory annotation in the nutrition/recovery layer. It must not silently alter expenditure, calories, or training targets until an internally validated model exists.

Source: [Track Your Period](https://help.macrofactorapp.com/en/articles/17-track-your-period).

#### Body recomposition behavior

MacroFactor explicitly does not use day-to-day body-composition estimates for program adjustments. Its public worst-case illustration uses approximately 1,800 kcal/kg for lean tissue and 9,400 kcal/kg for fat tissue:

- extreme illustration: +3.2 kg lean mass and −3.2 kg fat over 10 weeks at unchanged scale weight implies an unobserved deficit of about 2,432 kcal/week, or 347 kcal/day; this is approximately a 10% expenditure under-estimate;
- more typical illustration: +1 kg lean and −1 kg fat over 10 weeks produces an error of about 108 kcal/day, or about 3.5%.

MacroFactor’s product conclusion is deliberately counterintuitive: for maintenance or very slow recomposition, correcting that weight-only “error” could make the target worse. If the observed intake maintains the athlete’s scale weight while the athlete recomping, the observed maintenance intake can be the appropriate target even if the hidden tissue-energy accounting would imply a higher true expenditure.

The app should show this as a limitation and avoid pretending that a smart-scale body-fat estimate can solve it. Use photos, circumferences, performance, and trend weight as separate evidence streams rather than feeding noisy daily body-fat estimates into the expenditure loop.

Source: [How MacroFactor responds to body recomposition](https://help.macrofactorapp.com/en/articles/220-how-do-macrofactors-algorithms-respond-to-body-recomposition).

#### Illness and recovery

MacroFactor does not automatically infer an illness mode from a scale pattern. Its official guidance leaves the choice to the user:

- if the user does not want to log while sick, they can stop logging; expenditure enters holding and pre-illness targets are carried forward;
- after returning, the article says consistent food and weight logging for about one week will start expenditure updates again;
- if sick-day logs materially distort the estimate, the user may clear the food logs for those days, returning the estimate to the holding/recovery path;
- if vomiting occurred, the guidance says either leave the most recent meal logged or delete it; do not invent a percentage of calories “absorbed”;
- if continuing to log, the user can accept the temporary estimate changes and let the system settle.

The product article also advises putting a weight-loss goal on hold or eating at least maintenance during illness, while deferring to a clinician’s advice. That is health guidance, not an expenditure equation. In THE Hybrid Engine, illness should create a user-confirmed `illness_declared` state and a safety review, not an automatic calorie multiplier.

Source: [How to use MacroFactor when sick](https://help.macrofactorapp.com/en/articles/203-how-should-i-use-macrofactor-when-i-m-sick).

#### Logging breaks and resume transitions

The official extended-break behavior is clearer than the public equations:

- during a sufficiently long break from food and/or weight logging, the algorithm pauses updates;
- when logging resumes, MacroFactor carries forward the last high-confidence expenditure estimate rather than reverting to the initial prior;
- V3 release notes say three consistent tracking days can unpause the algorithm after inactivity;
- the illness-specific article says about one consistent week after illness before updates restart.

These are context-specific public milestones, not one disclosed state machine. Store both the reason for holding (`logging_break`, `illness`, `insufficient_nutrition`, or `insufficient_weight`) and the resume rule/version that was applied. Do not merge “three days after ordinary inactivity” and “about one week after illness recovery” into a false universal constant.

Source: [Interpreting expenditure changes](https://help.macrofactorapp.com/en/articles/26-how-should-i-interpret-changes-to-my-energy-expenditure), [Logging Break module](https://help.macrofactorapp.com/en/articles/251-coaching-module-logging-break), [V3 release notes](https://macrofactor.com/version-3-1-0), and [sick-day guidance](https://help.macrofactorapp.com/en/articles/203-how-should-i-use-macrofactor-when-i-m-sick).

#### Partial logging: additional numerical and UI rules

MacroFactor gives a concrete illustration of the 21-day lookback effect:

- if the real intake is 3,000 kcal/day for 21 days but one day is recorded as 1,500 kcal, the reported average is approximately 2,929 kcal/day;
- the app says this could lower the expenditure estimate by about 71 kcal/day, with additional partial days compounding the effect over the next 21 days.

For an atypical unlogged day, the official example is also useful: 2,000 kcal/day on ordinary days and one unlogged 5,000 kcal day in a three-week span produces an apparent average of 2,000 rather than an actual average of about 2,140, so the expenditure may be under-estimated by about 140 kcal/day for approximately three weeks. The resulting program could functionally target roughly 1.25–1.3 lb/week instead of 1 lb/week during that period.

MacroFactor also documents a subtle but useful property: if the athlete consistently fails to log the same small intake every day, the displayed target is effectively for calories above that unlogged intake, and displayed expenditure is effectively expenditure minus the unlogged calories. The absolute interpretation changes, but the magnitude and direction of adjustments can remain useful. This is different from sporadically omitting large meals.

UI and correction behavior:

- use `Edit Today` or `Quick Add` for a deliberate total estimate;
- if the athlete cannot estimate the day within roughly ±30%, delete/blank the day rather than leaving a partial low number;
- the partial-logging check-in identifies suspicious days and lets the athlete select or unselect which days should be marked incomplete;
- marking a day incomplete causes the algorithm to ignore it;
- retroactively deleting the full day is supported when logging stopped part-way through.

Sources: [What is partial logging?](https://help.macrofactorapp.com/en/articles/241-what-is-partial-logging), [Unusual day of eating](https://help.macrofactorapp.com/en/articles/221-if-you-have-an-unusual-day-of-eating-is-it-better-to-log-it-or-leave-the-day-blank), [Interpreting expenditure changes](https://help.macrofactorapp.com/en/articles/26-how-should-i-interpret-changes-to-my-energy-expenditure), and [Partial Logging module](https://help.macrofactorapp.com/en/articles/248-coaching-module-partial-logging).

#### Fasting: exact semantic distinction

MacroFactor treats a confirmed fast differently from an unlogged day:

- `fasting` means no calories were consumed for the entire calendar day and no foods or beverages were logged on that day;
- if zero-calorie beverages or supplements were logged, the help article says the day does not need to be marked as fasting;
- a confirmed fast is counted as a 0-kcal day;
- an unlogged, unmarked day can be left unlogged so the algorithm skips it;
- the Fasting module asks the user to choose between marking the day as fasted or leaving it unlogged.

The UI is `+` → `Edit Day` → `Fasting` tile for the current day, or Dashboard → Habits → Food Logging → choose the prior day → `Fasting` → save. THE Hybrid Engine should not infer `fasting` from a blank day or from an unusually low intake.

Sources: [Track a fasting day](https://help.macrofactorapp.com/en/articles/16-track-a-fasting-day) and [Fasting module](https://help.macrofactorapp.com/en/articles/250-coaching-module-fasting).

#### Holding, updating, paused, and uncertainty UI

The official product exposes a point estimate plus operational states rather than a calibrated probability of correctness:

- `holding` means there is not enough data to update continuously, or a new user has not accumulated enough data;
- `updating` means the calculation is actively incorporating new observations;
- V3’s `paused` status means data availability is too low for active calculation and the algorithm has reverted to a holding strategy;
- the chart uses a square point marker for paused values and a circular marker for active values;
- `flux range` is shown for curiosity and is explicitly not a calibrated confidence interval or direct probability of error.

The official help also describes the update controller qualitatively: during the first week of a suspected change it makes tentative adjustments; if the trend holds into a second and third week, larger adjustments follow. During early calibration, overshoots/undershoots are usually described as roughly 50–150 kcal and are expected to smooth out after 3–4 weeks. For program recommendations, an apparent 500-kcal change may be smoothed to roughly 200–300 kcal rather than applied 1:1.

These numbers are examples from explanatory articles, not the production gains or caps. Do not label them as MacroFactor’s hidden coefficients.

Sources: [Expenditure Version](https://help.macrofactorapp.com/en/articles/74-expenditure-version), [Interpreting expenditure changes](https://help.macrofactorapp.com/en/articles/26-how-should-i-interpret-changes-to-my-energy-expenditure), and [Why new programs differ](https://help.macrofactorapp.com/en/articles/205-why-does-my-new-program-have-slightly-different-calorie-and-macronutrient-targets-than-my-old-program-even-though-i-didn-t-change-my-goal).

### 18.2 Primary human physiology that should not be confused with MacroFactor rules

These studies support the reason for robust trending and event annotations. They do not reveal MacroFactor’s V3 implementation.

#### Glycogen and water

- In nine trained subjects recovering from prolonged exercise, muscle glycogen recovery was accompanied by at least roughly 3 g of water per gram of glycogen; larger ratios were possible when additional rehydration water was supplied. [Primary study](https://pubmed.ncbi.nlm.nih.gov/25911631/)
- In eight subjects, 72 hours of high-carbohydrate refeeding after glycogen-depleting exercise increased muscle glycogen and total body water from approximately 39.3 to 40.2 kg, with intracellular-water increases detected in the legs. [Primary study](https://pubmed.ncbi.nlm.nih.gov/27231310/)

This supports a `glycogen_water_shift` annotation and a transient-noise guard. It does not justify subtracting a fixed number of calories from expenditure for every gram of carbohydrate.

#### Creatine

- In a controlled 32-person study, 25 g/day for 7 days followed by 5 g/day for 21 days increased body mass and total body water without changing fluid distribution. [Primary study](https://pubmed.ncbi.nlm.nih.gov/12937471/)
- A one-week creatine study found increased total body water and increased DXA/BIA-derived fat-free mass estimates, demonstrating that short-term “lean mass” movement can reflect water and creatine-related changes rather than new contractile tissue. [Primary study](https://pubmed.ncbi.nlm.nih.gov/37675500/)

The implementation should therefore treat creatine initiation/loading as a time-stamped explanatory event and avoid using the resulting short-term scale or body-composition jump as immediate evidence of a changed TDEE or newly gained muscle.

#### Menstrual-cycle changes

In a twice-weekly study of 42 women, body weight was approximately 0.450 kg higher during menstruation than in the first week of the cycle, associated with an approximately 0.474 kg increase in extracellular water. This is a study average, not a universal correction factor. [Primary study](https://pubmed.ncbi.nlm.nih.gov/37395124/)

The correct app behavior is to store cycle observations and allow trend filtering to absorb them; do not subtract 0.45 kg from every user’s cycle weight.

#### Body recomposition

Hall’s energy-density model uses approximately 39.5 MJ/kg for fat-energy change and 7.6 MJ/kg for lean-mass change. A separate 10-week Army basic-training study found little/no body-mass change in women while DXA lean mass rose by about 2.7 kg on average; men lost about 1.7 kg body mass while gaining about 1.7 kg lean mass on average. These findings show why scale weight alone can miss meaningful recomposition, while also reminding us that DXA fat-free mass includes water and other non-contractile components. [Hall model](https://pubmed.ncbi.nlm.nih.gov/17848938/), [Army training study](https://pubmed.ncbi.nlm.nih.gov/33414487/)

#### Illness

In 25 young men with naturally acquired respiratory infections, resting metabolic rate was about 8% higher during illness, with a subset averaging more than 14% higher. This is resting expenditure, not a validated total daily calorie multiplier, and the sample was small and male-only. [Primary study](https://pubmed.ncbi.nlm.nih.gov/20309883/)

A controlled typhoid-vaccine experiment produced a peak metabolic-rate increase of about 16% for 6–8 hours after vaccination. That is controlled immune activation, not a direct model for a common cold or influenza. [Primary study](https://doi.org/10.1152/jappl.1992.72.6.2322)

Therefore illness should trigger conservative safety behavior and an optional hold/review workflow, not an automatic “fever = +X% TDEE” rule.

#### Fasting

A small randomized study in lean adults compared alternate-day 24-hour fasting with matched continuous energy restriction and with fasting that was energy-balanced by larger alternate-day intake. Over three weeks, the 0:150 group lost about 1.60 kg, the matched 75:75 group about 1.91 kg, and the 0:200 group did not significantly reduce body mass. This supports treating a confirmed fast as an observed 0-kcal intake day, not as proof of a special long-term metabolic bonus or penalty. [Primary randomized trial](https://pubmed.ncbi.nlm.nih.gov/34135111/)

#### Measurement uncertainty

The Hall model paper notes that baseline energy requirements cannot generally be measured for an individual with perfect precision; even a roughly 5% initial expenditure uncertainty can create meaningful variation in projected weight trajectories. That supports showing data quality, history length, and estimator freshness rather than inventing a precise confidence percentage before THE Hybrid Engine has calibration data. [Primary model paper](https://pubmed.ncbi.nlm.nih.gov/21872751/)

### 18.2.1 Deep PubMed/NCBI review of weight-trend confounders

This is a targeted deep review of PubMed/NCBI-indexed human studies and systematic reviews, searched and checked on 24 August 2026. It is not a registered PRISMA review and it does not recover MacroFactor's private coefficients. Its purpose is narrower and more useful for THE Hybrid Engine: identify when scale weight is a poor proxy for tissue-energy change, quantify the direction and size of the problem where human data exist, and define what the product should annotate, hold, or refuse to infer.

The central engineering conclusion is consistent across all eight confounders: use event-aware robust trending rather than hard-coded weight corrections. Water, glycogen, gut contents, menstrual phase and creatine can move the scale without a corresponding change in fat energy. Illness and prolonged fasting can also change expenditure, activity, intake reliability and body-water compartments at the same time. A single scalar `weight_delta -> kcal_delta` rule is therefore not physiologically identifiable from ordinary app data.

#### 1. Glycogen, carbohydrate shifts and water

**What the human evidence shows.** The often-quoted relationship is not a magical universal conversion, but muscle glycogen repletion is genuinely hydrated. In nine trained subjects who lost about 4.6% body mass through 150 minutes of cycling in heat, muscle glycogen fell by about 44%. During recovery, at least 3 g of water was stored per gram of recovered glycogen in the low-rehydration condition; when the participants were fully rehydrated, the observed ratio was about 1:17 because additional water was stored beyond water bound to glycogen. [Fernández-Elías et al., PMID 25911631, DOI 10.1007/s00421-015-3175-z](https://pubmed.ncbi.nlm.nih.gov/25911631/)

In eight subjects after glycogen-depleting exercise, 72 hours at 12 g carbohydrate/kg/day increased muscle glycogen from 72.7 ± 10.0 to 169.4 ± 55.9 mmol/kg wet weight and total body water from 39.3 ± 3.2 to 40.2 ± 3.0 kg. The water increase was detected mainly as intracellular water in the legs. [Shiose et al., PMID 27231310, DOI 10.1152/japplphysiol.00126.2016](https://pubmed.ncbi.nlm.nih.gov/27231310/)

The speed of this transition matters for a daily-weight algorithm. In eight endurance-trained men, one day of 10 g carbohydrate/kg/day increased muscle glycogen from 95 ± 5 to 180 ± 15 mmol/kg wet mass, with no additional increase after two more days of the same diet. [Bussau et al., PMID 12111292, DOI 10.1007/s00421-002-0621-5](https://pubmed.ncbi.nlm.nih.gov/12111292/)

The evidence is not perfectly reducible to a whole-body rule. A separate 12-person study found that glycogen depletion and refeeding did not produce a simple, uniform redistribution of segmental extracellular and intracellular water. [PubMed, PMID 29420149](https://pubmed.ncbi.nlm.nih.gov/29420149/) A narrative review also concludes that the glycogen-water relationship is method-dependent and not fully settled across measurement techniques. [Muscle glycogen and hydration narrative review, PMID 36615811, DOI 10.3390/nu15010155](https://pubmed.ncbi.nlm.nih.gov/36615811/)

**Limitations.** These are small, acute studies, mostly trained young men or mixed athletic samples, often following exercise depletion, heat stress or unusually high carbohydrate intake. Muscle biopsy/MRS and total-body-water results do not tell us a user's exact whole-body scale response. The studies do not support converting carbohydrate grams into a fixed water correction, much less into an expenditure correction.

**App policy.** Log `carb_shift_up`, `carb_shift_down`, `glycogen_depletion`, exercise volume and rehydration as explanatory context when available. For an abrupt transition, temporarily reduce estimator gain or use a robust residual model for roughly 1–3 days; let the observed trend re-enter normally once it stabilizes. Annotate the scale change as “likely glycogen/water and food-volume contribution,” not “fat gained/lost.” Never infer that a carbohydrate refeed changed TDEE by the energy content of the scale movement.

#### 2. Creatine-related water and apparent lean mass

**What the human evidence shows.** In 32 resistance-training volunteers, a 25 g/day creatine-loading protocol for 7 days followed by 5 g/day for 21 days significantly increased body mass, muscle creatine and total body water without changing the measured distribution between extracellular and intracellular water. The measurements used deuterium oxide and sodium-bromide dilution, not only BIA. [Powers et al., PMID 12937471, PMC155510](https://pubmed.ncbi.nlm.nih.gov/12937471/)

In a more recent randomized one-week study of 27 young adults, creatine monohydrate at 0.3 g/kg/day increased fat-free mass estimates by 1.2 kg with single-frequency BIA, 1.9 kg with multi-frequency BIA and 1.1 kg with DXA; multi-frequency BIA total body water rose 2%, from 40.4 ± 9.5 to 41.2 ± 9.6 kg. The authors explicitly interpret the short-term FFM movement as a consequence of increased body water, not proof of new contractile muscle. [Buck et al., PMID 37675500, DOI 10.23736/S0022-4707.23.15058-4](https://pubmed.ncbi.nlm.nih.gov/37675500/)

Creatine and menstrual phase can interact. In 30 moderately active women using a short loading protocol, luteal-phase creatine was associated with increases of 0.832 ± 0.376 L in total body water, 0.460 ± 0.154 L in extracellular water and 0.742 ± 0.227 L in intracellular water relative to placebo; body-mass differences were not statistically significant in that small study. [Roberts et al., PMID 36678300, DOI 10.3390/nu15020429](https://pubmed.ncbi.nlm.nih.gov/36678300/)

**Limitations.** The protocols are short and often use loading doses. Samples are small, young and physically active; body-composition devices estimate FFM from water and assumptions. Response to maintenance-only creatine, prior creatine exposure, diet, training and sex is variable. The data are strong enough to label an initiation event, not to predict an individual's exact kilogram response.

**App policy.** Add `creatine_started` with dose, loading status, start date and whether the user stopped. Treat a new-start/loading period as an estimator-noise state for about 1–3 weeks unless the user's own data show a shorter or longer response. Do not change expenditure, calories or protein targets because the scale or FFM rose. Do not display “muscle gained” from a one-week BIA/DXA jump; display “lean-mass estimate may be water-sensitive.”

#### 3. Sodium and sodium/carbohydrate combinations

**What the human evidence shows.** Sodium effects are real but highly context-dependent, which is exactly why a fixed “grams of sodium equals kilograms of water” rule is unsafe.

- In 12 normotensive men, moving from less than 50 mmol/day to more than 200 mmol/day for 8 days increased body weight by 2.5 kg (95% CI 1.7–3.2). This is a dramatic sodium-depleted-to-high-sodium transition, not evidence that one restaurant meal always adds 2.5 kg. [Rorije et al., PMID 29206647, DOI 10.1097/ALN.0000000000001989](https://pubmed.ncbi.nlm.nih.gov/29206647/)
- In 78 healthy men, the same broad 50-to-200 mmol/day transition increased extracellular fluid volume by 1.2 ± 1.8 L; the individual response correlated with BMI (r = 0.361). [Visser et al., PMID 19282825, DOI 10.1038/oby.2009.61](https://pubmed.ncbi.nlm.nih.gov/19282825/)
- In a controlled metabolic-ward study of 32 healthy men, sodium intakes from 50 to 550 mEq/day increased plasma volume by 315 ± 37 mL at the highest intake, but total body water and body mass did not increase. The observed change was a relative fluid shift from interstitial to intravascular space. [Heer et al., PMID 10751219, DOI 10.1152/ajprenal.2000.278.4.F585](https://pubmed.ncbi.nlm.nih.gov/10751219/)
- In 17 men dehydrated by exercise, a sodium-containing rehydration protocol retained 1,144 ± 294 mL after 3 hours, more than water or glycerol conditions. This is a short-term, post-exercise hyperhydration experiment, not a meal-response equation. [Sodium-induced hyperhydration, PMID 25494972](https://pubmed.ncbi.nlm.nih.gov/25494972/)

The apparently conflicting studies are informative: starting sodium status, fluid intake, heat/exercise, body size, renal handling and the compartment measured all matter. Long-duration controlled salt studies also show that total-body sodium can oscillate without parallel body-weight or extracellular-water changes, supporting the concept of osmotically inactive sodium storage. [Titze et al., PMID 23312287, DOI 10.1016/j.cmet.2012.11.013](https://pubmed.ncbi.nlm.nih.gov/23312287/)

**Limitations.** Most sodium experiments are small, male-only, short-term and use extreme intakes or metabolic-ward control. The studies measure fluid compartments better than an app can, but they do not yield a general population conversion from sodium grams to next-morning body mass. Kidney disease, heart failure, diabetes and medications are separate clinical contexts and should not be generalized to healthy athletes.

**App policy.** Store `sodium_shift` only as a user-confirmed or meal-derived context signal; do not make it an automatic expenditure modifier. For a high-salt meal or rapid salt transition, annotate and down-weight one to three days of scale residuals. Do not calculate “water weight” from sodium alone. If sodium is paired with a high-carbohydrate refeed, keep both event flags but do not add two independent kilogram corrections; the observed scale trend is the response variable.

#### 4. Menstrual-cycle fluid changes, intake and metabolic measurements

**What the human evidence shows.** In 42 women measured twice weekly, body weight during menstruation was 0.450 kg higher than in the first week of the cycle and extracellular water was 0.474 kg higher; no other body-composition measure changed significantly. [Kanellakis et al., PMID 37395124, DOI 10.1002/ajhb.23951](https://pubmed.ncbi.nlm.nih.gov/37395124/)

In 19 eumenorrheic women, early- versus mid-follicular testing differed by 0.56 ± 0.80 kg in body mass and 0.27 ± 0.51 L in extracellular fluid, while RMR differed by only 6.0 ± 190.93 kcal/day and was not significant. DXA fat-mass differences were within device error. [Gould et al., PMID 34280938, DOI 10.1249/MSS.0000000000002702](https://pubmed.ncbi.nlm.nih.gov/34280938/)

The most useful synthesis is that cycle-phase effects on resting metabolism are small and uncertain, not that they are nonexistent. A 2020 systematic review/meta-analysis of 26 studies and 318 women found a small pooled increase in luteal-phase RMR (ES 0.33), but the more recent subgroup was smaller and not statistically significant (ES 0.23, 95% CI approximately 0 to 0.47). [Effect of menstrual cycle on resting metabolism, PMID 32658929](https://pubmed.ncbi.nlm.nih.gov/32658929/) A 2026 systematic review of seven newer studies estimated roughly 30–120 kcal/day in studies showing a luteal trend, while emphasizing a typical magnitude around 3–5% and substantial method/measurement overlap. [Resting metabolic rate fluctuations systematic review, PMID 41971666, DOI 10.3389/fphys.2026.1778735](https://pubmed.ncbi.nlm.nih.gov/41971666/)

Energy intake may also vary. A 2025 systematic review/meta-analysis of 15 datasets (330 women) estimated luteal intake about 168 kcal/day higher than follicular intake on average, but identified repeated inconsistencies in phase definition and intake measurement. [Tucker et al., PMID 39008822, DOI 10.1093/nutrit/nuae093](https://pubmed.ncbi.nlm.nih.gov/39008822/)

Phase effects are not universal. A phase-confirmed study in Australian National Rugby League athletes (11 naturally cycling athletes and 7 hormonal-contraceptive users) found no significant effect of cycle phase on RMR or DXA body-composition estimates; an erratum exists for the paper and should be retained in the source record. [Kuikman et al., PMID 38653456, DOI 10.1123/ijsnem.2023-0193](https://pubmed.ncbi.nlm.nih.gov/38653456/) [Erratum, PMID 39384172](https://pubmed.ncbi.nlm.nih.gov/39384172/)

**Limitations.** Studies vary in cycle confirmation, contraceptive use, symptom burden, phase labels, number of cycles and measurement technique. The 0.45 kg result is a sample mean, not a menstrual correction constant. Fluid distribution, appetite, GI symptoms, sleep and training can all change together.

**App policy.** Store cycle day/phase only with appropriate user consent and privacy controls. Use within-person cycle-to-same-cycle-day comparisons when enough history exists; do not subtract a universal 0.45 kg. For a first or irregular cycle, annotate and reduce estimator gain rather than filtering the data as if the phase were known. Do not automatically add 30, 120 or 168 kcal/day to TDEE; allow repeated user-specific data to update intake/expenditure estimates over several cycles. If period symptoms include diarrhea, constipation, vomiting or unusually heavy bleeding, also emit the relevant GI/illness/safety event rather than treating everything as ordinary menstrual water.

#### 5. Illness, inflammation and fluid shifts

**What the human evidence shows.** In 25 young men with naturally acquired, nonfebrile respiratory infections, RMR was about 8% higher during illness; a subset averaged more than 14% higher. Testosterone fell about 10% overall and about 30% in a subset. This is a repeated-measures human study and demonstrates that even mild immune activation can affect resting metabolism, but it does not provide a TDEE multiplier. [Muehlenbein et al., PMID 20309883, DOI 10.1002/ajhb.21045](https://pubmed.ncbi.nlm.nih.gov/20309883/)

In a controlled typhoid-vaccine experiment, metabolic rate rose rapidly and peaked about 16% above baseline for 6–8 hours, with a fever peak of 1.2 ± 0.2 °C at 12 hours. This is useful mechanistic evidence for acute immune activation, not a prescription for common-cold calorie adjustments. [Cooper et al., PMID 1321111, DOI 10.1152/jappl.1992.72.6.2322](https://pubmed.ncbi.nlm.nih.gov/1321111/)

Severe illness is a different regime entirely. In 12 patients with severe sepsis and 18 with major trauma followed for 21 days, total-body-protein losses were about 13.1% and 14.6%, respectively; post-resuscitation TBW losses averaged 11.1 L in sepsis and 6.7 L in trauma, largely from extracellular water, while sepsis patients retained about twice as much fluid. [Plank & Hill, PMID 10865810, DOI 10.1111/j.1749-6632.2000.tb06521.x](https://pubmed.ncbi.nlm.nih.gov/10865810/)

**Limitations.** The mild-infection study is small, observational and male-only; RMR is not TDEE and illness changes activity, sleep and intake. Vaccine studies are experimental immune activation. ICU studies are not a normal dieting population and are dominated by resuscitation, catabolism and fluid therapy.

**App policy.** A user-declared illness should create `illness_declared`, with fever, vomiting/diarrhea, reduced training and medication fields where the user chooses to provide them. For mild illness, preserve the last calibrated expenditure and down-weight or hold updates until the user reports recovery. For fever, repeated vomiting/diarrhea, dehydration symptoms, rapid unexplained weight change or clinical care, enter a hard hold and display a safety message; do not estimate extra calories from fever. Resume with a recovery marker and require several ordinary days before large estimator movement.

#### 6. Fasting and refeeding

**What the human evidence shows.** A randomized three-week trial in 36 lean healthy adults separated fasting from energy restriction: 0:150 alternate-day fasting lost 1.60 ± 1.06 kg body mass and 0.74 ± 1.32 kg fat; matched daily restriction lost 1.91 ± 0.99 kg and 1.75 ± 0.79 kg fat; energy-balanced fasting (0:200) did not significantly reduce body mass or fat. The trial found no fasting-specific metabolic advantage after matching energy balance. [Stekovic et al., PMID 34135111, DOI 10.1126/scitranslmed.abd8034](https://pubmed.ncbi.nlm.nih.gov/34135111/)

In a supervised 7-day water-only fast, 12 volunteers (5 women, 7 men) lost 5.7 ± 0.8 kg on average, with systemic proteomic changes becoming evident after about three days. The study is a prolonged complete-fast model, not ordinary time-restricted eating. [Pietzner et al., PMID 38429390](https://pubmed.ncbi.nlm.nih.gov/38429390/)

A 2026 systematic review/meta-analysis of 49 studies and 150 effect sizes found reductions in body weight, fat mass, fat-free mass and total body water during prolonged fasting. Weight loss was greater after more than three days, but there was no robust duration-response relationship for fat mass or fat-free mass. The authors emphasize that fasting weight loss is a mixture of tissue, glycogen, water and measurement effects. [Ulupınar et al., PMID 42440276, DOI 10.1093/nutrit/nuag092](https://pubmed.ncbi.nlm.nih.gov/42440276/)

**Limitations.** Fasting protocols, refeeding, baseline body composition and measurement methods are heterogeneous. Many prolonged-fasting studies are single-arm pre/post designs, use BIA or DXA under changing hydration and do not isolate tissue energy. A blank food log is not proof of fasting.

**App policy.** Distinguish `fasting_confirmed` from `logging_gap`, and do not treat an unlogged day as 0 kcal. For a confirmed short fast, record intake as reported but do not infer a special metabolic bonus. For prolonged fasting or abrupt refeeding, use a separate state: hold the normal trend controller, annotate glycogen/water/GI rebound, and resume only after ordinary intake and measurement conditions return. Do not interpret early FFM loss as all muscle or early scale loss as all fat.

#### 7. Gastrointestinal contents, stool, transit and acute GI loss

**What the human evidence shows.** Direct free-living measurements of total GI tract contents are scarce, so the app should not pretend that a universal “gut-content correction” is known. Useful human anchors are stool output and controlled bowel-emptying studies:

- In 23 healthy ambulant adults on usual diets, mean daily feces production was 141 ± 49 g and contained 891 ± 276 kJ; estimated energy absorption was 89.4 ± 3.8%. [Wierdsma et al., PMID 23647171, DOI 10.1111/jhn.12113](https://pubmed.ncbi.nlm.nih.gov/23647171/)
- In 220 healthy UK adults, median daily stool weight was 106 g and whole-gut transit time was 60 hours; across populations, average stool weight ranged from 72 to 470 g/day and was strongly related to nonstarch-polysaccharide intake. [Cummings et al., PMID 1333426, DOI 10.1016/0016-5085(92)91435-7](https://pubmed.ncbi.nlm.nih.gov/1333426/)
- In 66 healthy adults, 21 days of digestion-resistant maltodextrin shortened total colonic transit by 13.3 hours and increased stool volume by 56% versus baseline in the active group. [Abellán Ruiz et al., PMID 26437831, DOI 10.1007/s00394-015-1045-4](https://pubmed.ncbi.nlm.nih.gov/26437831/)
- A 2026 systematic review of 113 RCTs found each additional gram/day of total fiber was associated with approximately 1.76 g/day higher wet fecal weight, 0.47 g/day higher dry fecal weight and 0.24 hours shorter transit, with moderate certainty but indirect, heterogeneous evidence. [Balk et al., PMID 41611088, PMCID PMC12975388, DOI 10.1016/j.ajcnut.2026.101212](https://pubmed.ncbi.nlm.nih.gov/41611088/)
- In 12 healthy volunteers, bowel preparation caused a median 1.2 kg weight decrease, increased plasma osmolality from 287 to 290 and reduced exercise capacity by about 9%; this is a cathartic/dehydration event, not ordinary bowel variability. [Holte et al., PMID 15484356, DOI 10.1007/s10350-004-0592-1](https://pubmed.ncbi.nlm.nih.gov/15484356/)

**Limitations.** Stool output is not the same as the total mass of stomach, small intestine and colon contents at a weigh-in. Meal mass, fluid intake, transit time, fiber, constipation, diarrhea, menstrual symptoms and weigh-in timing all interact. Bowel-prep data exaggerate the size and direction of normal GI events.

**App policy.** Add `large_late_meal`, `constipation`, `diarrhea`, `vomiting`, `bowel_prep` and `weigh_in_timing` when users choose to report them. Annotate and down-weight ordinary GI residuals for roughly 1–3 days. A bowel prep, acute vomiting/diarrhea or dehydration should hard-hold estimator updates and invoke safety messaging. Do not infer a calorie-absorption multiplier from one stool event, and do not claim that a scale drop after laxation is fat loss.

#### 8. Body recomposition and the limits of scale-only inference

**What the human evidence shows.** A dynamic energy-density model explains why the energy deficit per kilogram of weight loss changes with the composition of the loss: fat and lean tissue have different energy densities, and the fraction of lean tissue changes with starting fatness and the size of the deficit. It is a model, not a scale-measurement algorithm. [Hall, PMID 17848938, DOI 10.1038/sj.ijo.0803720](https://pubmed.ncbi.nlm.nih.gov/17848938/)

In a large prospective Army basic-training cohort (573 women and 1,071 men), 10 weeks of common training produced no average body-mass change in women and a 1.7 kg loss in men, while DXA lean mass increased by 2.7 ± 1.6 kg in women and 1.7 ± 2.0 kg in men; body-fat percentage fell by 4.0 ± 2.4 and 3.4 ± 2.8 percentage points. [Foulis et al., PMID 33414487, DOI 10.1038/s41366-020-00730-0](https://pubmed.ncbi.nlm.nih.gov/33414487/)

In a 4-week randomized trial of young men under about 40% energy restriction with 6 days/week of resistance training plus HIIT, the higher-protein group gained 1.2 ± 1.0 kg lean body mass and lost 4.8 ± 1.6 kg fat, compared with approximately 0.1 ± 1.0 kg lean mass gain and 3.5 ± 1.4 kg fat loss in the lower-protein group. The study is a useful demonstration of short-term recomposition, but its extreme deficit/training context is not a general calculator. [Longland et al., PMID 26817506, DOI 10.3945/ajcn.115.119339](https://pubmed.ncbi.nlm.nih.gov/26817506/)

The protein/recomposition literature is heterogeneous. A systematic review of six studies in lean, resistance-trained athletes reported body-fat reductions in all groups, FFM losses in nine of 13 groups and a likely higher-protein range of 2.3–3.1 g/kg FFM when leanness and deficit severity are high. This is a nutrition-policy review, not a reason to infer tissue partition from the scale. [Helms et al., PMID 24092765, DOI 10.1123/ijsnem.2013-0054](https://pubmed.ncbi.nlm.nih.gov/24092765/)

**Limitations.** DXA FFM includes water, glycogen, organs and other non-contractile tissue; training cohorts are not representative of all users; short studies have large measurement error; strength and waist changes are not direct calorimetry. A stable scale can mean maintenance, recomposition, water noise or inconsistent measurement.

**App policy.** Do not alter TDEE because one body-composition scan says FFM increased or fat mass fell. Show a longer-horizon “possible recomposition” annotation only when multiple signals align: stable or slowly changing weight trend, improving strength/performance, waist or circumference movement and repeated body-composition measurements taken under comparable hydration/food conditions. Keep expenditure estimation driven by intake and long-run weight trend; use body-composition data as a separate evidence stream.

#### Cross-confounder rules: annotate, hold, avoid inferring

| Context | Annotate | Estimator action | Do not infer |
|---|---|---|---|
| Carb depletion/refeed, hard training, rehydration | `carb_shift`, glycogen and exercise context | Down-weight abrupt residuals for about 1–3 days; then resume normal gain | Fat change or TDEE change from the scale spike/drop |
| High-sodium meal or salt transition | `sodium_shift`, baseline diet if known | Context-only by default; down-weight 1–3 days if the residual is large | A universal sodium-to-water or sodium-to-kcal conversion |
| Creatine initiation/loading | Dose, start/stop date, loading flag | Hold/reduce gain for about 1–3 weeks; body-composition scan caution | New muscle, fat gain or expenditure change from early FFM/weight |
| Menstrual cycle | Consent-based cycle day/phase and symptoms | Prefer same-cycle-day comparisons; learn individual effects over cycles | Universal +0.45 kg or +X kcal/day correction |
| Mild illness | User-confirmed illness, fever and recovery | Preserve last calibrated expenditure; hold or down-weight until recovery | Fever × a universal TDEE multiplier |
| Prolonged fast/refeed | Confirmed fast vs logging gap; refeed marker | Separate state; hold normal controller through refeed stabilization | “Metabolic bonus,” all weight loss as fat, blank log = zero intake |
| Constipation/diarrhea/vomiting/bowel prep | GI event and weigh-in timing | Down-weight ordinary events; hard hold for acute loss/dehydration | GI symptoms as an absorption coefficient or scale loss as fat |
| Stable weight plus training/body-composition changes | Recomp candidate | Keep TDEE controller on longer horizon; display corroborating signals | FFM = muscle or stable scale = no physiological change |

These hold windows are implementation defaults for Hybrid, not published MacroFactor rules. They should be configurable, logged with `policyVersion`, and validated through replay tests rather than silently applied as hidden corrections.

### 18.3 Implementation changes for THE Hybrid Engine

Add event metadata without allowing those events to silently mutate expenditure:

```ts
type WeightContextEvent =
  | { kind: "carb_shift"; direction: "up" | "down"; startedAt: string }
  | { kind: "creatine_started"; startedAt: string; loading?: boolean }
  | { kind: "period_logged"; date: string }
  | { kind: "illness_declared"; startedAt: string; endedAt?: string }
  | { kind: "logging_break"; startedAt: string; endedAt?: string }
  | { kind: "fasting_confirmed"; date: string }
  | { kind: "partial_day_marked"; date: string };
```

Each event should store `source`, `userConfirmed`, `affectsEstimator: false` by default, and a versioned policy decision. The estimator can use the event to reduce update gain, hold updates, or explain a result only when that behavior is explicitly enabled and validated.

Add replay tests for:

1. a 1–5 day high-salt/high-carb weight spike;
2. a sustained low-carb-to-high-carb transition;
3. creatine loading;
4. a menstrual-cycle rise and subsequent water release;
5. one ordinary sick week followed by recovery;
6. one half-logged day and one unlogged 5,000-kcal social day;
7. a confirmed 0-kcal fast versus a blank unlogged day;
8. a two-week logging break and return;
9. a genuine body-recomposition period with stable scale weight;
10. a persistent activity change greater than roughly 500 kcal/day.

For each replay, report point-estimate error, target error, update volatility, time to recover, and whether the user-facing explanation correctly identifies the data state. Do not report `flux_range` as a probability unless it has been calibrated against THE Hybrid Engine’s own outcomes.

### 18.4 Still not recovered

The following remain proprietary or not recoverable from public evidence: V3’s exact trend/filter coefficients, its water-shift state estimator, the hidden intake predictor, the exact partial-logging classifier, update gains/caps, flux-range construction, the full menstrual-cycle correction logic, the exact illness/hold trigger, and any confidence probability behind the point estimate. The new sources improve the behavioral specification, but they do not turn these into public equations.

## 19. Primary sources

- MacroFactor’s Algorithms and Core Philosophy: https://macrofactor.com/macrofactors-algorithms-and-core-philosophy/
- Expenditure: https://help.macrofactorapp.com/en/articles/20-expenditure
- Change Rate: https://help.macrofactorapp.com/en/articles/19-change-rate
- Weight Trend: https://help.macrofactorapp.com/dashboard/weight_trend
- Expenditure V3: https://macrofactor.com/expenditure-v3/
- Expenditure Version: https://help.macrofactorapp.com/en/articles/74-expenditure-version
- Nutrition logging frequency: https://help.macrofactorapp.com/en/articles/110-how-frequently-do-i-need-to-log-my-nutrition-for-the-expenditure-algorithm-and-weekly-coaching-updates
- Weight logging frequency: https://help.macrofactorapp.com/en/articles/109-how-frequently-do-i-need-to-log-my-weight-for-the-expenditure-algorithm-and-weekly-coaching-updates
- Weight-gain/loss adjustments: https://help.macrofactorapp.com/en/articles/222-how-does-macrofactor-make-adjustments-for-a-weight-gain-or-weight-loss-goal
- Weekly budget: https://help.macrofactorapp.com/macro_program/weekly_budget
- Coached program options: https://help.macrofactorapp.com/en/articles/34-what-are-the-different-program-options-in-coached-mode
- Check-ins and coaching modules: https://help.macrofactorapp.com/en/articles/247-introduction-to-check-ins-and-coaching-modules
- Expenditure modifiers: https://help.macrofactorapp.com/en/articles/274-expenditure-modifiers
- MacroFactor BMR equations: https://macrofactor.com/macrofactors-bmr/
- MacroFactor macro guide: https://macrofactor.com/counting-macros/
- MacroFactor accuracy analysis: https://macrofactor.com/algorithm-accuracy/
- Expenditure modifiers deep dive: https://macrofactor.com/expenditure-modifiers/
- Initial expenditure estimate troubleshooting and 3–4 week refinement: https://help.macrofactorapp.com/en/articles/206-what-should-i-do-if-my-initial-expenditure-or-recommended-energy-intake-seems-too-high-or-too-low
- Manual initial expenditure estimate: https://help.macrofactorapp.com/en/articles/70-set-a-manual-initial-expenditure-estimate
- Goal/program changes do not reset expenditure: https://help.macrofactorapp.com/en/articles/204-does-my-data-reset-if-i-change-goals-or-create-a-new-program
- Expenditure-version and flux-range help: https://help.macrofactorapp.com/en/articles/74-expenditure-version
- Partial logging: https://help.macrofactorapp.com/en/articles/241-what-is-partial-logging
- Partial-logging coaching module: https://help.macrofactorapp.com/en/articles/248-coaching-module-partial-logging
- App Store version history: https://apps.apple.com/us/app/macrofactor-macro-tracker/id1553503471
- Weight trend for training context: https://help.macrofactorapp.com/en/articles/278-weight-trend
- Body recomposition limitations: https://help.macrofactorapp.com/en/articles/220-how-do-macrofactors-algorithms-respond-to-body-recomposition
- Strict timeline / no automatic catch-up: https://help.macrofactorapp.com/en/articles/202-what-should-i-do-if-im-pursuing-a-goal-with-a-strict-timeline
- Secondary EMA clue, not treated as verified: https://podcast.witsandweights.com/1870546/episodes/16822734-your-macro-tracking-app-is-too-dumb-for-real-fat-loss-or-muscle-gain
- GitHub export visualiser: https://github.com/jordangarrison/vitals
- GitHub local export/MCP tool: https://github.com/NasserAlbusaidi/macrofactor-mcp
- GitHub unofficial API client (archived): https://github.com/sjawhar/macrofactor

## 20. PubMed/NCBI athlete safeguards and validation pass

The detailed review is in [MacroFactor_PubMed_Athlete_Safety_Validation_Review.md](sandbox:/workspace/scratch/9db1c7f8a75a/MacroFactor_PubMed_Athlete_Safety_Validation_Review.md). It changes the implementation in one important way: the expenditure estimator and athlete-safety system must be separate.

The expenditure loop estimates effective expenditure from intake and trend weight. It does not establish adequate fuelling, recovery, health, or readiness to continue losing weight. A high-protein target can help preserve lean mass in some energy-deficit studies, but it does not remove low-energy-availability or RED-S risk. [IOC RED-S consensus](https://pubmed.ncbi.nlm.nih.gov/37752011/) · [LEA and muscle-protein-synthesis study](https://pubmed.ncbi.nlm.nih.gov/37329147/) · [High-protein/LEA bone study](https://pubmed.ncbi.nlm.nih.gov/33671093/)

### Design changes that are now required

1. **Add an athlete-safety state.** Track persistent low-energy-availability proxies alongside performance decline, recovery decline, illness, injury/bone-stress concern, reproductive/menstrual or libido changes where voluntarily supplied, and disordered-eating concern. Use `not_screened`, `monitor`, `review`, and `urgent_referral`; do not present a RED-S diagnosis. The IOC CAT2 separation between screening, risk stratification and physician-led diagnosis is the right architectural pattern. [IOC REDs CAT2](https://pubmed.ncbi.nlm.nih.gov/37752002/)

2. **Do not use a universal EA cutoff.** The common `<30 kcal/kg FFM/day` value is not a universal male or female diagnostic rule, and exact EA is difficult to calculate because exercise expenditure and intake are uncertain. A weight-stable athlete can still show low-EA physiology or declining adaptation. [Male endurance-athlete evidence](https://pmc.ncbi.nlm.nih.gov/articles/PMC8294781/) · [Male low-EA performance study](https://pubmed.ncbi.nlm.nih.gov/34825937/) · [RMR-equation validity study](https://pubmed.ncbi.nlm.nih.gov/40262739/)

3. **Make protein basis explicit.** Store `body_mass` versus `fat_free_mass` with every protein target. Use separate versioned policies for endurance, resistance and hybrid training. Do not apply MacroFactor’s lifter table unchanged to endurance athletes. Resistance-training evidence supports a population plateau near 1.6 g/kg/day at energy balance; lean resistance-trained athletes in a deficit may warrant a higher FFM-scaled range; endurance evidence supports roughly 1.8 g/kg/day as a useful context-dependent target. [Morton meta-analysis](https://pubmed.ncbi.nlm.nih.gov/28698222/) · [Energy-restricted resistance-trained review](https://pubmed.ncbi.nlm.nih.gov/24092765/) · [Longland RCT](https://pubmed.ncbi.nlm.nih.gov/26817506/) · [Endurance review](https://pubmed.ncbi.nlm.nih.gov/40117058/)

4. **Keep wearable calories out of the core estimator.** Step counts and cadence can be useful covariates, but systematic reviews find poor individual energy-expenditure accuracy for consumer wearables. Use step trends to alter responsiveness or a prior only when coverage is reliable; do not add `steps × kcal`. [Wearable accuracy review](https://pubmed.ncbi.nlm.nih.gov/35060915/) · [Step/cadence DLW model](https://pubmed.ncbi.nlm.nih.gov/22963352/)

5. **Treat missingness as a data state.** Preserve `blank`, `partial`, `estimated`, `fast_confirmed`, `excluded`, observed weight and interpolated-for-display weight as different states. A blank intake day is not zero; a confirmed fast is zero only when explicitly confirmed. Longitudinal and state-space evidence supports handling missing observations without pretending the uncertainty disappeared, especially when missingness may be non-random. [Longitudinal imputation](https://pubmed.ncbi.nlm.nih.gov/32101358/) · [State-space missingness study](https://pubmed.ncbi.nlm.nih.gov/40091737/)

6. **Do not label flux range as confidence.** Keep the current `fluxRange` as an operational navigable range. Add empirical prediction intervals only after rolling-origin validation demonstrates coverage at 7/14/28 days. [Calibration of prediction rules](https://pubmed.ncbi.nlm.nih.gov/24021610/) · [Prediction-model stability](https://pubmed.ncbi.nlm.nih.gov/37466257/)

7. **Validate four different outcomes.** Test criterion TDEE validity against DLW/chamber protocols, future trend/target accuracy, athlete training outcomes, and safety/fairness across training types, sex, size, high-step work, device source and missingness pattern. MacroFactor’s own predictive-validity claims should not be presented as independent physiological validation. [DLW validation](https://pubmed.ncbi.nlm.nih.gov/17209180/) · [Temporal validation methods](https://pubmed.ncbi.nlm.nih.gov/27262237/)

### Prescription guard

The target controller should not escalate a deficit when the safety state is `review` or `urgent_referral`:

```text
if urgent_referral:
    do not increase deficit; give appropriate referral guidance
elif review:
    hold aggressive loss and request review / more information
elif monitor:
    cap loss rate and increase monitoring
else:
    allow the normal bounded expenditure controller
```

This is a product safety workflow, not a diagnostic protocol. The full data contracts, validation design and evidence table are in the dedicated PubMed/NCBI review.
