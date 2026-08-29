# THE Hybrid Engine — implementation checklist

**Checklist version:** `1.0.0`  
**Purpose:** turn the research pack into a safe, auditable build without pretending to have MacroFactor’s private code.

## Phase 0 — repository audit and governance

- [ ] Audit `reflectprotect123-max/THE-HYBRID-ENGINE1` before restructuring.
- [ ] Map current nutrition, training, athlete-state, Android and web-coach packages.
- [ ] Preserve existing behaviour and user data migrations.
- [ ] Add an evidence label to every numerical rule: `PRODUCT`, `SCIENCE`, `HYBRID_INFERENCE` or `UNKNOWN`.
- [ ] Agree who owns formula/policy version changes.
- [ ] Complete privacy review for food, weight, health, menstrual/reproductive and performance data.
- [ ] Define escalation copy and professional-referral boundaries before athlete-safety UI is enabled.

**Exit criteria:** current repository behaviour is documented; no restructuring has removed an existing contract; data ownership and safety responsibilities are assigned.

## Phase 1 — schemas and provenance

- [ ] Implement `NutritionObservation` with `complete`, `estimated`, `partial`, `blank`, `fasting` and `imported` states.
- [ ] Implement `WeightObservation` with observed versus interpolated status, source and quality.
- [ ] Implement `ExpenditureState` with `insufficient_data`, `updating`, `holding` and `stale`.
- [ ] Implement target provenance: formula ID, policy version, source class, accepted time and reason codes.
- [ ] Implement audit events for user overrides, skipped/declined check-ins, held updates and modifier activation.
- [ ] Add consent and retention rules for athlete-safety inputs.

**Exit criteria:** every value that can affect a target can be traced back to raw input, state, formula and policy version.

## Phase 2 — deterministic core estimator

- [ ] Implement one documented BMR prior first; add alternatives only through the formula registry.
- [ ] Implement the published activity/exercise prior table as a versioned product-precedent input.
- [ ] Implement a transparent trend filter with observed/interpolated distinction.
- [ ] Implement the 20-day change-rate calculation.
- [ ] Implement a named energy-conversion model; expose it in audit output.
- [ ] Implement 4/7 nutrition and 1/7 weight gates.
- [ ] Hold the last high-confidence estimate when a gate fails.
- [ ] Never reset a held estimate to onboarding without an explicit reset event.
- [ ] Add stale-data detection and reactivation rules.

**Exit criteria:** all formula-registry test vectors pass; failed gates hold; one outlier cannot create an unbounded expenditure jump.

## Phase 3 — goal controller and macros

- [ ] Represent gain/loss rate as a signed rate with explicit units.
- [ ] Implement weekly budget as the primary control variable.
- [ ] Ensure daily distribution changes preserve the weekly budget.
- [ ] Keep goal progress separate from goal rate; no automatic catch-up.
- [ ] Implement protein basis as `body_mass`, `fat_free_mass` or `goal_weight`.
- [ ] Keep lifter, endurance and hybrid protein policies separate and versioned.
- [ ] Implement fat floor with visible constraint conflicts.
- [ ] Keep database calories primary when macro-derived calories disagree due to labels/rounding.
- [ ] Add standard/low/no-floor policy states and display the selected policy.

**Exit criteria:** every generated target explains calories, protein basis, fat floor, carbohydrate remainder, weekly total and safety constraints.

## Phase 4 — check-ins and modifiers

- [ ] Implement deterministic predicates for partial logging, weigh-in, fasting, logging break and program update.
- [ ] Allow skip, dismiss, Fast Check-In and decline without deleting evidence.
- [ ] Require explicit acceptance before applying a new program target.
- [ ] Keep Step-Informed Updates behind a feature flag and exclude wearable calorie credits from the core estimator.
- [ ] Keep Predictive Goal Adjustment behind a feature flag with caps, decay and a no-modifier control.
- [ ] Add an Australian season/climate/training-calendar context field for analysis, not a fixed calorie multiplier.

**Exit criteria:** check-in output is deterministic, auditable and reversible; modifiers can be turned off without corrupting the base estimate.

## Phase 5 — athlete-safety layer

- [ ] Implement `not_screened`, `monitor`, `review` and `urgent_referral` states.
- [ ] Combine persistent fuelling proxies with performance, recovery, illness, injury/bone-stress and optional reproductive/libido signals.
- [ ] Do not diagnose RED-S or infer medical clearance from body weight, protein or a calorie floor.
- [ ] Do not use a universal `<30 kcal/kg FFM/day` diagnostic rule.
- [ ] Prevent aggressive deficit escalation in `review` and `urgent_referral`.
- [ ] Provide clear professional-referral guidance for concerning patterns.
- [ ] Test false-positive burden and subgroup differences before enabling automated interventions.

**Exit criteria:** the safety layer can stop a harmful prescription even if the expenditure controller requests a deeper deficit, and it never presents a diagnosis.

## Phase 6 — testing and validation

- [ ] Run all JSON formula and state fixtures in CI.
- [ ] Add replay scenarios for high-carb/refeed, sodium, creatine, menstrual cycle, illness, fasting, GI events, missing logging, breaks and recomposition.
- [ ] Add property tests: blank ≠ zero; hold ≠ reset; weekly budget is conserved; declined update changes nothing.
- [ ] Add rolling-origin 7/14/28-day prediction validation.
- [ ] Report MAE, bias, limits of agreement, update volatility, time-to-recover and coverage—not correlation alone.
- [ ] Validate against doubly labelled water, indirect calorimetry or chamber data where feasible.
- [ ] Separate criterion TDEE validity from target-tracking validity.
- [ ] Validate training outcomes, safety outcomes and subgroup fairness.
- [ ] Keep flux/decision ranges labelled operational until empirical calibration demonstrates coverage.

**Exit criteria:** the team can show where the engine is accurate, where it is uncertain and where it abstains.

## Phase 7 — release gate

- [ ] Formula registry and claim matrix are current.
- [ ] README and migration notes are included with the release.
- [ ] No private MacroFactor behaviour is presented as fact.
- [ ] No medical diagnosis or unsafe calorie promise appears in copy.
- [ ] User can inspect why a target changed.
- [ ] User can correct partial logging, confirm fasting and decline updates.
- [ ] Safety and privacy review is signed off.
- [ ] Prospective validation report is attached to the release.

**Release decision:** do not launch aggressive automatic goal modes until Phase 5 and Phase 6 exit criteria pass.
