# THE Hybrid Engine — formula registry

**Registry version:** `1.0.0`  
**Research date:** 24 August 2026

This registry is the numerical contract for the first transparent implementation. Every production formula must have a stable `formulaId`, units, source class, policy version and tests. A formula marked `INFERENCE` or `UNKNOWN` must never be described as MacroFactor’s exact code.

## Source classes

- `PRODUCT` — publicly documented MacroFactor behaviour or equation.
- `SCIENCE` — peer-reviewed physiology, measurement or sports-nutrition evidence.
- `HYBRID_INFERENCE` — explicit implementation chosen where public information is incomplete.
- `UNKNOWN` — intentionally not specified because the underlying production behaviour is private or not safely recoverable.

## Formula table

| Formula ID | Status | Definition | Units | Source class | Implementation note |
|---|---|---|---|---|---|
| `bmr.general.v1` | active | `129.6 × weightKg^0.55 + 0.011 × heightCm^2 − ageAdjustment − 213.8 × sexCode` | kcal/day | `PRODUCT` | Published encoding: male `0`, female `1`; preserve the selected equation and sex mapping in provenance. |
| `bmr.general.ageAdjustment.v1` | active | `1.96 × min(age,60) + 4.9 × max(age−60,0)` | kcal/day | `PRODUCT` | Used by the general equation. |
| `bmr.ffm.v1` | active | `50.2 × FFMKg^0.7 + 40.5 × (FFMKg^0.7 × FMKg^0.066) − ageAdjustment` | kcal/day | `PRODUCT` | Requires explicit FFM and FM provenance. |
| `bmr.ffm.ageAdjustment.v1` | active | `1.1 × min(age,60) + 2.75 × max(age−60,0)` | kcal/day | `PRODUCT` | Used by the body-composition equation. |
| `bmr.athlete.v1` | feature-flag | `40.4 × FFMKg^0.932` | kcal/day | `PRODUCT` | MacroFactor’s public athlete equation. Classify by a versioned training-hours rule; do not infer from gym sessions alone. |
| `bmr.adaptation.deficit.v1` | active | `adjustedBmr = bmr × 0.95` when currently in an energy deficit | kcal/day | `PRODUCT` | Initial-prior modifier only. It is not a diagnosis of metabolic adaptation. |
| `bmr.adaptation.lowWeight.v1` | active | `adjustedBmr = bmr × 0.97` when current mass is >10% below highest recorded mass | kcal/day | `PRODUCT` | Requires a trustworthy highest-weight history. |
| `bmr.adaptation.combined.v1` | active | `adjustedBmr ≈ bmr × 0.92` when both prior conditions apply | kcal/day | `PRODUCT` | Published approximate combined effect; do not multiply `0.95 × 0.97` and call it exact. |
| `expenditure.initial.v1` | active | `adjustedBmr × (generalActivityFactor + exerciseCorrection)` | kcal/day | `PRODUCT` | Public table: general `1.2/1.4/1.6`; exercise `0/0.1/0.2/0.3`. Keep table versioned. |
| `expenditure.balance.v1` | active | `caloriesOut = caloriesIn − storedEnergyChange` | kcal/day | `PRODUCT` + `SCIENCE` | Core energy-balance identity; the stored-energy conversion is separately versioned. |
| `storedEnergy.symmetric7700.v1` | prototype | `dailyStoredEnergyKcal = dailyWeightChangeKg × 7700` | kcal/day | `HYBRID_INFERENCE` | Transparent approximation only; do not claim it is MacroFactor V3. |
| `trend.ewma.v1` | prototype | `trend_t = α×observedWeight_t + (1−α)×trend_(t−1)` | kg | `HYBRID_INFERENCE` | Candidate filter. `α` must be configuration, logged and validated; exact MacroFactor coefficients are unknown. |
| `changeRate.20day.v1` | active | `(trendTodayKg − trend20DaysAgoKg) ÷ 20 × 7` | kg/week | `PRODUCT` | Public 20-day horizon; use trend weight, not raw weight. |
| `changeRate.percent.v1` | active | `weeklyChangeKg ÷ referenceWeightKg × 100` | %/week | `PRODUCT` | Reference-weight choice must be explicit and versioned. |
| `target.signedRate.v1` | prototype | `targetKcal = expenditureKcal + signedRateKgPerWeek × 7700 ÷ 7` | kcal/day | `HYBRID_INFERENCE` | Signed rate: loss negative, gain positive. Approximate energy conversion. |
| `budget.weekly.v1` | active | `weeklyBudgetKcal = Σ dailyTargetKcal over 7 days` | kcal/week | `PRODUCT` | Distribution can change; weekly total remains the control variable in coached/collaborative modes. |
| `macro.energyFactors.v1` | active | protein `4`, carbohydrate `4`, fat `9` | kcal/g | `PRODUCT` convention | Database calories remain primary because label energy and macro arithmetic can differ. |
| `protein.ffm.v1` | prototype | `FFM = bodyMassKg × (1 − bodyFatFraction)`; `protein = bounded(rate × FFM)` | g/day | `HYBRID_INFERENCE` + `SCIENCE` | Store body-mass versus FFM basis with every target. Smart-scale FFM requires uncertainty. |
| `protein.lifterTable.v2025` | reference | Bulk/maintain `1.75/2.35/2.75/3.10`; cut `2.00/2.50/3.00/3.50` g/kg FFM for low/moderate/high/extra | g/kg FFM | `PRODUCT` | Lifter-specific product reference; do not apply unchanged to endurance athletes. |
| `fat.floor.v1` | active | `max(30, 30 + 0.5 × (heightCm − 150))` | g/day | `PRODUCT` | For height <150 cm use 30 g/day. Product guardrail, not universal medical minimum. |
| `goalPrior.multiplier.v1` | feature-flag | `1 + 4 × intendedRateFractionPerWeek` | multiplier | `PRODUCT` report | Creator-reported heuristic; cap, decay and interactions remain private. Validate against a no-modifier control. |
| `energyAvailability.proxy.v1` | safety-only | `(intakeKcal − exerciseEnergyExpenditureKcal) ÷ FFMKg` | kcal/kg FFM/day | `SCIENCE` | Risk proxy only. No universal diagnostic threshold. Exercise expenditure is uncertain. |

## Operating rules that are not equations

| Rule ID | Rule | Status |
|---|---|---|
| `gate.v3.4of7.1of7` | Update only with at least 4 valid nutrition days and 1 valid weight day in the last 7 days. | `PRODUCT` operating precedent |
| `state.blank.notZero` | Blank intake is unknown, not zero. | `PRODUCT` + `SCIENCE` |
| `state.fast.confirmedZero` | Zero intake is assigned only after the user explicitly confirms a fast. | `PRODUCT` semantic rule |
| `state.partial.separate` | Partial logging is not a complete low-calorie day; ask to estimate, exclude or confirm. | `PRODUCT` + `SCIENCE` |
| `range.flux.notConfidence` | Operational flux/decision ranges are not confidence intervals without empirical calibration. | `PRODUCT` + `SCIENCE` |
| `safety.noDiagnosis` | Athlete-safety signals can hold/soften a target and route to care; they cannot diagnose RED-S. | `SCIENCE`/safety policy |
| `activity.noDirectCalories` | Steps and wearable energy estimates do not directly add calories to the core estimator. | `SCIENCE` + `PRODUCT` precedent |

## Versioning rules

- Never change a formula in place after it has been used for user-facing results.
- Create a new formula ID or policy version, retain the old version for replay, and record migration behaviour.
- Store `formulaId`, `registryVersion`, inputs, output, timestamp, source class and reason codes in the audit event.
- If an input is estimated or interpolated, record that state next to the numerical value.
- If a formula is only a hypothesis about MacroFactor, label it `HYBRID_INFERENCE` in code and UI provenance.
