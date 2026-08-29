# THE Hybrid Engine — MacroFactor/PubMed research handoff

**Pack version:** `0.2.0-handoff`  
**Research date:** 24 August 2026  
**Target repository:** `reflectprotect123-max/THE-HYBRID-ENGINE1`  
**Status:** architecture and validation handoff; not a production clinical system

## What this pack is

This is a build-oriented research pack for implementing a transparent nutrition and expenditure engine inspired by MacroFactor’s publicly described behaviour, with a separate athlete-safety layer informed by PubMed and IOC sports-nutrition literature.

The pack deliberately separates four kinds of claims:

1. **Product fact:** MacroFactor publicly documents the behaviour or equation.
2. **Scientific evidence:** peer-reviewed physiology, measurement or sports-nutrition evidence.
3. **Hybrid inference:** a proposed, explicit implementation where the public detail is incomplete.
4. **Private/unknown:** MacroFactor’s exact production behaviour cannot be recovered from public material.

MacroFactor is product precedent, not independent scientific validation. The Hybrid Engine must not claim to be an exact MacroFactor clone.

## Read in this order

1. `MacroFactor_Research_and_Hybrid_Implementation_Spec.md` — main architecture, public behaviour, equations, data contracts, check-ins, edge cases and implementation decisions.
2. `MacroFactor_Deep_Technical_Research_Hybrid_Engine.md` — deeper evidence, confounders, validation design and unresolved technical gaps.
3. `MacroFactor_PubMed_Athlete_Safety_Validation_Review.md` — athlete fuelling, RED-S/LEA safeguards, protein by training type, missingness and validation boundaries.
4. `MacroFactor_Hybrid_Engine_Formula_Registry.md` — versioned formulas and explicit provenance.
5. `MacroFactor_Hybrid_Engine_Claim_Matrix.md` — claim-by-claim evidence and implementation status.
6. `MacroFactor_Hybrid_Engine_Test_Vectors.json` — deterministic fixtures for unit and replay tests.
7. `MacroFactor_Hybrid_Engine_Implementation_Checklist.md` — build order and acceptance criteria.

## The key architecture

```text
logged intake + observed weight + optional activity features
        -> expenditure estimator

training load + intake + recovery/performance/health signals
        -> athlete-safety state

expenditure + goal + macros + safety state
        -> bounded nutrition target
```

The safety state can hold or soften an aggressive deficit even when the weight trend says the athlete is losing more slowly than intended. It is a screening and referral workflow, not a RED-S diagnosis.

## What is ready to build

- versioned BMR and initial-expenditure prior;
- explicit nutrition and weight data states;
- transparent trend-weight filter;
- 20-day change-rate calculation;
- intake/weight expenditure inference with a named energy-conversion model;
- four-of-seven nutrition and one-of-seven weight operating gates;
- holding, updating, insufficient-data and stale states;
- weekly calorie budget and no automatic catch-up;
- protein-first macro allocation with explicit unit basis and fat floor;
- deterministic check-in module predicates;
- bounded updates, reason codes and audit events;
- optional step-informed and predictive modifiers behind feature flags;
- athlete-safety state and prescription guard;
- replay, rolling-origin and criterion-validation plan.

## What is not ready to claim

- exact MacroFactor Expenditure V3 replication;
- true individual TDEE measurement from food logs and a scale;
- calibrated confidence percentages or prediction intervals;
- wearable calorie accuracy;
- diagnosis of RED-S, an eating disorder or any medical condition;
- a universal energy-availability cutoff or calorie floor;
- production release without privacy, clinical-safety and prospective validation review.

## Build rules that must not be weakened

- A blank food day is not zero intake. A confirmed fast is a separate state.
- Interpolated weight is usable for a display trend, not a new measurement.
- Steps are a possible covariate, never `steps × calories`.
- A partial food day must not silently become a complete low-calorie day.
- A failed update gate holds the last high-confidence estimate; it does not reset to onboarding.
- An LLM may explain deterministic outputs but may not choose the numerical adjustment.
- Every target change must include provenance, algorithm version, policy version and reason codes.
- Athlete-safety signals must be consent-based, privacy-minimised and routed to appropriate professional care when concerning.

## Integration note

The existing repository is a monorepo with shared engine packages, an Android athlete app and a web coach workspace. Preserve and audit the current implementation before restructuring it. The recommended boundaries in the main specification are `packages/nutrition-core`, `packages/nutrition-engine`, `packages/nutrition-adapter`, `packages/whole-athlete-state`, and an explicit nutrition-target emission boundary.

## Verification

The JSON fixtures are intentionally framework-neutral. At minimum, the implementation should:

1. parse the fixture file as strict JSON;
2. run the formula cases with a documented tolerance;
3. assert every state-machine case;
4. replay the edge-case scenarios without hidden corrections;
5. record the implementation version and test-vector version in the result.

The PubMed review supports safety and validation design, but it does not validate the Hybrid Engine itself. That requires prospective data and, where possible, doubly labelled water, indirect calorimetry or chamber comparisons.
