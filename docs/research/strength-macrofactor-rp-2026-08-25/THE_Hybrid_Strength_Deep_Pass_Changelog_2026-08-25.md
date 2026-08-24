# THE Hybrid Strength Pack — deep-pass changelog

**Date:** 25 August 2026  
**Pack release:** `0.3.1-algorithm-transparency-audited`

## Why this pass happened

The original strength handoff was strong on MacroFactor-style progression, RP-style volume control and the broad PubMed boundary. It was not yet complete as a safety-conscious adaptive decision system or sufficiently precise about what remains proprietary. This pass used four delegated research lanes:

1. official MacroFactor and RP product behaviour and transparency;
2. adversarial public-record checks across code, APIs, patents and public examples;
3. newer strength/hypertrophy evidence;
4. athlete safety, clinical boundaries, validation, calibration, missing data and auditability.

## Material additions

- Direct/indirect/fractional volume projections, with raw exposure preserved.
- Concurrent cardio/sport context, session ordering and lower-body interference review.
- Optional velocity-loss measurement, with no imputation when unavailable.
- Separate BFR/very-low-load controller because ordinary RIR tables can be inaccurate there.
- Exercise-specific RIR calibration, SEM, MDC95 and confidence dimensions.
- Immutable decision traces, replay, compensating events, override-outcome tracking and missingness reasons.
- Priority-ordered safety states: emergency stop, training pause, clinician review, re-entry, hold progression, caution, normal and insufficient data.
- Structured health events instead of one generic pain boolean.
- Criteria-based return after illness/injury; time elapsed alone cannot clear return.
- MacroFactor lifecycle semantics: repeat, complete, activate, backfill, swap, skip, unskip, edit and delete.
- Hierarchical warm-up schemes, set-specific RIR, post-set correction and transactional bulk-edit previews.
- Rich exercise/load semantics: laterality, bodyweight, per-dumbbell, bar-included, machine-stack, assistance, ROM and stability.
- RP constraints around training age, time capacity, sport volume, straight-set foundations and intensity-technique placement.

## Algorithm-transparency correction

The new transparency audit corrects an over-broad claim. RP publishes a concrete volume-progression framework, and MacroFactor publishes multiple behavioural anchors and worked examples. However, neither product publishes enough exact parameters, state transitions, history weighting and tie-break rules to reproduce the current production engine deterministically. Third-party GitHub projects are independent approximations or data utilities, not recovered official source.

## Evidence boundary

The evidence supports a guarded personalised v1 at approximately **8.5/10**. It does not support claims of a universal optimiser. Confidence is closer to **6/10** for advanced-lifter MRV, exact fatigue thresholds, universal RIR equations and permanent optimal volume.

The package is therefore a build specification with explicit unknowns and validation requirements—not proof that MacroFactor or RP’s private algorithms have been replicated.

## Verification

- JSON fixtures: 36 cases.
- Local fixture/invariant validation: passed.
- Archive must be rebuilt and checked with `unzip -tq` before release.
