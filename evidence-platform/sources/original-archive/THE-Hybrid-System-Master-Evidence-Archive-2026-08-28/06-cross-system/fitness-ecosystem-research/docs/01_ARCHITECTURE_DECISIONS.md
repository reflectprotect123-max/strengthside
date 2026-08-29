# Architecture decisions and alternatives

## ADR-001: separate products, shared contracts

**Decision:** Strength and Conditioning are separate deployable products. Share pure domain contracts and non-UI infrastructure; do not force a universal UI package before the domain boundary is stable.

**Reasoning:** Their decision variables and native integrations differ. Separate deploys permit product-specific release cadence, permissions, store listing, and failure isolation. Shared contracts preserve ecosystem continuity.

**Trade-off:** A user may experience two apps, two release trains, and two local databases. Deep links and one identity are required for the ecosystem to feel like one system.

**Rejected alternative:** One fused app with one giant engine. It reduces app-split migration cost but makes domain ownership and testing less clear, and it keeps the current cross-modality code entanglement.

## ADR-002: Whole-Athlete State is an interpreter and constraint generator

**Decision:** Put shared context facts in shared-core and derived interpretation in Whole-Athlete State. The state engine emits domain-neutral context plus hard/soft constraints; specialist engines apply them to their own proposals.

**Inputs:** sleep observations, HRV/RHR observations, subjective sleep/stress/energy, life/work load, recent training/load records, pain flags, illness flag, schedule/time, nutrition/weight events when available, and data-quality metadata.

**Outputs:** `stateSnapshot`, `constraints[]`, `dataQuality`, `confidence`, `reasonCodes`, and `observedInputs[]`. No exercise prescription.

**Rejected alternatives:**

- Put recovery inside both engines: duplicates logic and creates contradictory advice.
- Put all recovery logic in the Coordinator: makes scheduling and physiological interpretation inseparable.
- One opaque readiness scalar: hides why a recommendation changed and encourages false precision.

## ADR-003: server contracts before public app split

**Decision:** Keep local-first databases, but introduce server-side domain ownership and compatibility before two public clients write to shared account data.

**Minimum server resource families:**

```text
core_profile / core_preferences / core_safety_flags
core_observations / integration_events
strength_sessions / strength_results / strength_snapshots
conditioning_sessions / conditioning_results / conditioning_snapshots
athlete_state_snapshots
weekly_plans / weekly_plan_decisions
sync_mutations / migration_runs
```

The exact relational shape must follow the baseline audit. The key decision is ownership and compatibility, not a specific table count.

## ADR-004: append-only integration events plus projections, not full event sourcing

**Decision:** Use append-only, idempotent integration events for cross-domain facts and audit-sensitive decisions. Use ordinary domain tables/snapshots for current query views. Do not make every internal record a replay-only event stream in v1.

**Why:** Events improve auditability and decouple Strength, Conditioning, and future Nutrition. Projections keep ordinary reads understandable. Full event sourcing increases migration, replay, deletion, schema-version, and operational complexity.

**Event examples:**

- `strength.session_completed.v1`
- `conditioning.session_completed.v1`
- `body_weight.recorded.v1`
- `nutrition.target_updated.v1`
- `athlete.safety_flag_changed.v1`
- `weekly_plan.published.v1`

## ADR-005: Coordinator has one canonical writer

**Decision:** The Coordinator service/job/package is the only writer of a combined `weekly_plan`. Apps may request a replan, preview a proposal, or submit a user override. They cannot independently replace the combined plan.

**Reasoning:** This prevents two apps from racing to rewrite the same plan and makes decisions auditable. The server should enforce writer ownership where possible.

## ADR-006: use rules before optimization or ML

**Decision:** v1 Coordinator uses explicit hard constraints, product invariants, user priorities, interference tags, schedule/time, and bounded ranking. It emits a reason code for every accepted, modified, deferred, or dropped proposal.

**Reasoning:** Four to eight proposals over seven days is small. Transparent rules are easier to test, explain, roll back, and calibrate. A generic fatigue budget has no validated universal units; if introduced later, it must be bounded and observed against outcomes.

## ADR-007: share contracts and tokens, not all screens

**Decision:** Share TypeScript types, JSON Schemas, codecs, migrations, pure decision functions, test fixtures, design tokens, and view-model contracts. Keep web DOM and native rendering code separate until the app split is stable.

**Reasoning:** The supplied codebase duplicates web/mobile UI. Trying to extract all UI immediately risks coupling platform constraints to domain migration.

## ADR-008: health/wellness product boundary

**Decision:** Product copy and algorithms target general training and wellness behavior. They must not claim to diagnose, prognose, treat, or clear disease/injury. Regulatory counsel must review intended purpose, data flows, integrations, and all multi-function features before Australian release.

**Reasoning:** Australian TGA exclusions depend on intended use and every feature in a multi-function product. Privacy obligations apply to health information regardless of whether the app is a medical device.

## Decision matrix

| Choice | Works now | Two public apps | Auditability | Migration risk | Decision |
|---|---:|---:|---:|---:|---|
| One JSONB blob + client merge | yes | poor | poor | high | reject as public boundary |
| Per-domain JSONB rows + versioned writes | yes | medium | medium | medium | transitional option |
| Relational domain rows + events/snapshots | yes | high | high | medium | recommended target |
| Full event sourcing for everything | difficult | high | high | high | defer |
| CRDT for all state | difficult | medium | mixed | high | reject for prescriptions/safety |
| Server authoritative, local-first clients | yes | high | high | medium | recommended operating model |
