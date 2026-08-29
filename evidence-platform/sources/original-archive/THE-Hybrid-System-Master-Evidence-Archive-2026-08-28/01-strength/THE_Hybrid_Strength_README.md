# THE Hybrid Engine — strength handoff pack

**Pack version:** `0.3.1-algorithm-transparency-audited`  
**Research date:** 25 August 2026  
**Target repository:** `reflectprotect123-max/THE-HYBRID-ENGINE1`  
**Status:** research and architecture handoff, not production code; expanded after delegated algorithm-transparency, MacroFactor/RP/PubMed/safety and validation passes

## Read order

1. `THE_Hybrid_Strength_Deep_Pass_Changelog_2026-08-25.md` — what changed in this research pass.
2. `THE_Hybrid_Strength_Algorithm_Transparency_Audit_2026-08-25.md` — what is public, what remains private/unknown, and the exact-clone boundary.
3. `THE_Hybrid_Strength_MacroFactor_RP_Research_and_Implementation_Spec.md` — main design and data contracts.
4. `THE_Hybrid_Strength_MacroFactor_RP_Deep_Technical_Research.md` — recovered product behaviour, controller design and unresolved gaps.
5. `THE_Hybrid_Strength_PubMed_RP_Validation_Review.md` — scientific boundary for strength, hypertrophy, failure, volume and deloading.
6. `THE_Hybrid_Strength_Formula_Registry.md` — formulas and policies with provenance.
7. `THE_Hybrid_Strength_Claim_Matrix.md` — claim-by-claim source and confidence register.
8. `THE_Hybrid_Strength_Test_Vectors.json` — deterministic fixtures.
9. `THE_Hybrid_Strength_Implementation_Checklist.md` — build order and release gates.

## What this pack combines

```text
MacroFactor Workouts -> exercise logging + RIR/load/reps progression
RP Hypertrophy       -> muscle volume + emphasis + mesocycle feedback
PubMed evidence      -> strength/hypertrophy boundaries and validation
THE Hybrid Engine    -> explicit arbitration, safety and auditability
```

## Important correction

RP itself says its Hypertrophy App is designed primarily to maximise muscle growth, with strength as a secondary outcome. This pack therefore includes a separate strength-priority mode. It would be wrong to call a pure RP Hypertrophy program a complete maximal-strength system.

## What is ready to build

- exercise/program schemas;
- program snapshots versus progression recommendations;
- RIR-aware, equipment-aware load/reps controller;
- cycle-template and dated-session separation;
- cold-start handling, equipment fallback and explainable warnings;
- exercise-specific strength validation and RIR confidence bands;
- scheduled plus evidence-triggered deload review;
- direct/indirect/fractional volume projections;
- concurrent cardio context and optional velocity-loss control;
- BFR/very-low-load separate handling;
- structured health events and priority-ordered safety stops;
- RIR calibration, MDC/measurement-error and immutable decision-trace requirements;
- reversible lifecycle events for backfill, swaps, skips, repeats and program completion;
- direct-set and indirect-exposure accounting;
- Maintain/Grow/Emphasize volume policy;
- strength, hypertrophy and hybrid modes;
- cycle periodization and deload states;
- pain/fatigue separation;
- nutrition/training boundary;
- formula provenance, reason codes and replay fixtures.

## What remains private or unvalidated

- exact MacroFactor load-history estimator, generated-program tables and tie-breaks;
- exact RP volume coefficients, feedback weights and expert-system rule base;
- exact deload reductions;
- universal MRV or ideal RIR values;
- validated THE Hybrid outcome accuracy.

Do not present any of these as recovered code or medical certainty. The package contains public behavioural anchors and explicit Hybrid policies, not an exact clone of either product.

## Verification

The JSON fixtures are strict, framework-neutral test data. The implementation should parse them, run numeric and state assertions, and record its own formula/policy versions. Before launch, add prospective validation of key-lift outcomes, muscle-volume recommendations, fatigue/deload handling, pain escalation and subgroup performance.
