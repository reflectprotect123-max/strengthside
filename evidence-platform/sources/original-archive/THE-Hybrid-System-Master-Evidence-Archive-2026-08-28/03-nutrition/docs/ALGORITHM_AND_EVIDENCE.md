# Algorithm and evidence contract

## 1. The core honesty rule

MacroFactor’s exact production algorithm is not public. MacroTrack may use the
public product behaviour as a design precedent, but must not claim private
parameter parity. Every constant in this repository is a versioned MacroTrack
product choice unless a direct source says otherwise.

## 2. Evidence hierarchy

Use this hierarchy in code comments, UI copy, documentation, and future
experiments:

1. **Direct primary evidence** — the source directly tests the relevant
   population, measurement, and outcome.
2. **Adjacent evidence** — a mechanism or nearby population is relevant but not
   identical.
3. **Product precedent** — another app publicly describes a behaviour.
4. **Engineering convention** — a practical implementation rule.
5. **MacroTrack choice** — selected for usability or safety and validated only
   by internal tests until evidence exists.
6. **Unresolved** — do not encode as a hidden assumption.

The exact sources are in `docs/SOURCE_REGISTER.md`.

## 3. What the public MacroFactor material supports

The public product and help pages support these observable behaviours:

| Observable behaviour | Classification | Safe MacroTrack interpretation |
| --- | --- | --- |
| Food logging through barcode/search, custom food, recipes, quick add, history/copy, and other fast paths | PRODUCT PRECEDENT | These are product requirements, not scientific claims. |
| Micronutrients, body metrics, progress photos, weight trend, and expenditure estimate | PRODUCT PRECEDENT | Provide the same category of capability with separate provenance and uncertainty. |
| Intake and weight change are used to update expenditure; wearable calorie estimates are not the basis of the public method | PRODUCT PRECEDENT | Use logged intake and weight trend as the reference inputs. |
| Trend smoothing is used to reduce short-term scale noise | PRODUCT PRECEDENT + ADJACENT | Implement a transparent trend filter and show raw values separately. |
| Weekly check-in modules can be skipped/declined and may address partial logging, weigh-ins, fasting/logging breaks, and program updates | PRODUCT PRECEDENT | Make the check-in a reversible proposal flow. |
| Public help material describes at least six nutrition-log days in seven and a weigh-in in a seven-day period as useful for updates | PRODUCT PRECEDENT | Treat these as operational coverage rules, not guarantees of accuracy. |
| Exact smoothing kernel, confidence formula, BMR choices, activity factors, damping, and all edge cases | UNRESOLVED | Do not pretend to have reconstructed them. |

Public product accuracy discussion should be described as predictive validity
against observed weight change in the product’s own context, not as direct
validation against chamber calorimetry or doubly labelled water. Independent
validation of the proprietary expenditure implementation remains unresolved.

## 4. MacroTrack reference engine

`adaptive_engine.py` is the executable reference. Kotlin must match its fixture
tests before adding new behaviour.

### Daily record model

```text
date
calories: nullable number
weight_kg: nullable number
nutrition_status: complete | partial | fasted | unlogged
```

`complete` with a non-negative calorie value is countable. `fasted` is
countable only when the caller explicitly stores zero calories. `partial` and
`unlogged` are not countable. Missing is not zero.

### Trend

For an observed weight `x_t`, the reference uses:

```text
trend_t = alpha * x_t + (1 - alpha) * trend_(t-1)
```

with `alpha = 0.20` by default and the previous trend carried across missing
weight observations. This is an implementation choice, not a claim that it is
MacroFactor’s kernel.

### Expenditure

Estimate the trend slope by linear regression over the smoothed points in the
current two-week window:

```text
slope_kg_per_day = linear_slope(trend_weight, date)
raw_expenditure_kcal_per_day = mean(countable_logged_kcal_per_day)
                                - slope_kg_per_day * kcal_per_kg
```

The default `kcal_per_kg = 7,700` is a product parameter. Clamp to the
configured sanity range. If a previous estimate exists, limit the change to
the configured damping cap (`100 kcal/day` by default).

### Coverage gate

The current reference requires two consecutive seven-day periods with:

* at least six countable nutrition days per period; and
* at least one weigh-in per period.

This two-period gate is a MacroTrack choice inspired by the public operational
behaviour. It is not an experimentally validated universal minimum.

When the gate fails:

* state is `holding`;
* the previous estimate is carried forward, if one exists;
* no replacement target is silently generated;
* the UI explains the missing coverage and offers a non-punitive next action.

### Targets

With a signed target rate where loss is negative, gain is positive, and
maintenance is zero:

```text
target_kcal_per_day = expenditure_kcal_per_day
                     + target_rate_kg_per_week * kcal_per_kg / 7
```

Protein and fat are allocated from explicit preferences; the remaining energy
is allocated to carbohydrate. Defaults in the reference are `1.8 g/kg`
protein and `0.8 g/kg` fat. They are product defaults, not medical advice and
not a claim about MacroFactor’s values.

The Mifflin–St Jeor equation is used for one transparent initial estimate when
sex, height, age, and weight are available. An optional lean-mass equation is
used when body-fat input is available. Observed intake/weight data should
replace the starting estimate; the initial estimate must be labelled as such.

## 5. Evidence around the building blocks

* **Energy balance:** Hall and colleagues describe energy balance and body
  weight as a dynamic system; Chow and Hall model weight and body-composition
  dynamics. This supports the direction of the feedback loop, not the
  accuracy of any particular app implementation.
* **Initial resting expenditure:** Mifflin et al. published the Mifflin–St Jeor
  predictive equation. Predictive equations have individual error and should
  not be shown as measured metabolic rate.
* **Protein:** meta-analyses in resistance-trained/healthy adults report
  group-level dose-response findings around protein intake. These do not imply
  one correct target for every user, health state, goal, or sport.
* **Scale noise:** water, glycogen, sodium, gastrointestinal contents, illness,
  medications, menstrual-cycle effects, and measurement conditions can move
  scale weight independently of fat-mass change. A trend is a noise-reduction
  device, not a direct body-composition measurement.

## 6. Guardrails

1. Do not use wearable energy expenditure as a hidden input.
2. Do not retroactively charge or repay calories.
3. Do not treat a partial/unlogged day as a deficit.
4. Do not update a target from inadequate coverage merely to make the graph
   look responsive.
5. Do not show an estimate with more precision than the inputs justify.
6. Do not let a source-food edit mutate historical log snapshots.
7. Do not auto-coach users who have selected a safety/manual mode.
8. Do not expose “metabolic damage,” “willpower,” or shame-based language.
9. Do not use a single unusual weigh-in as a diagnosis or a target trigger.
10. Log configuration version, source data, coverage counts, raw estimate,
    damped estimate, final target, and explanation for every update.

## 7. State and explanation contract

```text
NO_HISTORY       -> show starting estimate or ask for profile inputs
INSUFFICIENT     -> HOLDING; preserve prior estimate; show missing coverage
UPDATING         -> calculate raw estimate; apply damping; create proposal
PROPOSED         -> user accepts, edits, or declines
ACCEPTED         -> write a versioned macro-program week
DECLINED         -> preserve current program and record the decision
SAFETY_MANUAL    -> no automatic target update
```

Every state change returns:

* state and confidence;
* window start/end;
* countable nutrition days and weight days;
* trend slope;
* previous/raw/damped values;
* configuration version;
* reason codes;
* human-readable explanation.

## 8. Required algorithm tests

At minimum test:

* no records;
* fewer than 14 days;
* one incomplete week;
* missing weight in one period;
* explicit fast versus unlogged day;
* noisy weight with stable intake;
* weight loss and weight gain signs;
* first estimate versus damped update;
* clamping at minimum/maximum expenditure;
* target rate signs;
* macro allocation when calories are too low for requested protein/fat;
* duplicate dates and out-of-order input;
* late historical edits and recomputation;
* Kotlin/Python fixture parity.

## 9. Unresolved validation work

The product should eventually run a retrospective validation study using
de-identified, consented logs. Report calibration, error distribution, missing
data sensitivity, and subgroup behaviour. Do not call this clinical validation
unless the study design supports that claim. A future comparison against a
validated reference method would be required for a stronger measurement claim;
the current repository has no such dataset.
