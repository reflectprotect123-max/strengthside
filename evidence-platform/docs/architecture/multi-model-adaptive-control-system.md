# Multi-model adaptive control system design

Status: **design foundation, not production-ready**.

## Boundary

Strength, Conditioning, Nutrition, Recovery, and Coordinator publish versioned domain outputs. The Multi-model adaptive control system consumes those outputs, creates a time-indexed athlete-state snapshot, generates bounded candidates, applies hard and soft constraints, ranks feasible candidates, validates the selected result, and emits an immutable decision receipt. No LLM participates in runtime state estimation, constraint enforcement, ranking, or final selection.

## Deterministic flow

1. **Ingest** signed/versioned domain envelopes; reject schema or version mismatches.
2. **Normalize** units, denominators, time bases, athlete identity hash, and observation time.
3. **Assess data quality** per feature: observed/estimated/missing/stale, measurement method, uncertainty, and provenance.
4. **Estimate state** as a vector, never a single safety-clearing readiness number.
5. **Generate candidates** from approved rule/model versions only.
6. **Apply action-scoped constraints** in priority order: emergency/clinical routing, locked product policy, invalid provenance, incompatible units, unavailable equipment/time, and explicit athlete constraints. Pain holds Strength autopilot load increases only; it does not automatically block training. Illness is record-only. HRV cannot create or clear pain, injury, or illness restrictions.
7. **Score feasible candidates** using declared objectives and parameter sets. Unknown coefficients remain absent, not guessed.
8. **Cross-system arbitration** resolves resource conflicts and records support/interference tags.
9. **Validate** the winner against schema, safety, lineage, and model-version gates.
10. **Emit** recommendation plus immutable receipt; replay uses identical normalized inputs, rule/model artifacts, parameter set, and deterministic seed when applicable.

## Athlete-state vector

The snapshot contains domain sub-states plus quality and uncertainty:

- Strength: exercise-specific performance history, exposure, load semantics, fatigue evidence, target phase.
- Conditioning: modality, intensity distribution, load, device quality, recent performance, planned stress.
- Nutrition: intake completeness, mass trend, target direction, estimated expenditure, macro/fuelling context.
- Recovery: sleep, HR/HRV protocol outputs, soreness, structured pain/illness events, subjective context.
- Coordinator: schedule, priorities, equipment, time, conflicts, policy constraints, previous decisions.

Every field is tagged `observed`, `derived`, `estimated`, `missing`, or `stale`, with timestamp, method, uncertainty, and lineage IDs.

## Optimisation contract

The optimizer solves a constrained selection problem over a finite candidate set. Objectives can include expected goal progress, adherence feasibility, monotony control, and plan stability. Hard constraints must never be converted into tradeable penalty weights. Soft-objective weights and all model parameters require owned versioned parameter sets and validation reports; this release intentionally supplies no invented coefficients.

## Cross-system support and interference

| Producer | Supports | Can constrain/interfere | Required coordinator signal |
|---|---|---|---|
| Strength | neuromuscular/skill stimulus | lower-body fatigue, soreness, time | muscle/movement load, priority, recovery cost |
| Conditioning | aerobic/anaerobic capacity | modality-specific concurrent load | modality, intensity, duration, lower-body stress |
| Nutrition | substrate, energy and recovery support | low/uncertain intake, goal-rate conflict | completeness, target, uncertainty, safety flags |
| Recovery | context for tolerance | pain/illness/sleep constraints | structured events, quality, expiry, precedence |
| Coordinator | scheduling and priorities | plan instability or unresolved conflicts | constraints, conflicts, chosen trade-offs |

## Interfaces

All domain outputs use an event envelope with `event_id`, `athlete_id_hash`, `occurred_at`, `produced_at`, `system`, `schema_version`, `model_version`, `payload_hash`, `provenance_ids`, and payload. Cross-system messages are append-only; corrections supersede earlier events rather than mutating history.

## Safety and abstention

The control system must abstain when required inputs, provenance, compatible units, approved model versions, or a feasible safe candidate are missing. Abstention is a valid decision with reason codes and a receipt.
