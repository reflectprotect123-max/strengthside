# Executive review: architecture approved with redlines

## Verdict

The product direction is coherent, but the supplied build plan should not be implemented as written. The split into separate Strength and Conditioning apps is a valid product and engineering destination. The unsafe part is the proposed compatibility boundary: two independently released clients sharing one client-merged JSONB blob.

The revised recommendation is:

> Two specialist apps, one explicit shared-core contract, one Whole-Athlete State interpreter, and one canonical Coordinator writer — with local-first clients and server-side versioning/ownership before public split release.

This is an architecture review, not an implementation approval. Approve the baseline audit and contract/migration rehearsal first. Public app-split approval is a separate gate.

## What the original plan gets right

### 1. Domain separation

Strength and Conditioning have different primary signals, progression rules, and failure modes. Strength reasons over exercise selection, load, sets, reps, RPE/RIR, e1RM, local fatigue, and volume tolerance. Conditioning reasons over modality, duration, intervals, pace/power/heart-rate/RPE, aerobic and anaerobic exposure, and mechanical limitations. Splitting their engines makes the decisions easier to explain and test.

### 2. Whole-Athlete State is a distinct layer

Sleep, life stress, work, illness, pain, soreness, motivation, schedule, and recent load should not be duplicated inside both specialist engines. A state layer can interpret raw observations into context and constraints. It should not become a third workout engine.

### 3. Coordinator as an arbiter

Specialist engines should emit proposals. A Coordinator should resolve priorities, available time, interference tags, rest rules, user overrides, and safety constraints into one weekly plan. That is substantially clearer than allowing two apps to silently prescribe conflicting plans.

### 4. Evidence-aware boundaries

The prior handoff correctly treats HRV as advisory, not as an injury detector; separates pain from fatigue; distinguishes observed data from derived estimates; and requires deterministic, reason-coded outputs. Those constraints should become schema and test invariants, not remain prose.

## What must change before implementation

### Redline A — replace the cross-app blob as the compatibility boundary

Local-first storage can remain. The current one-blob server model cannot remain the public compatibility boundary for independently deployed apps unless the baseline audit proves a stronger server protocol already exists.

Strength may write while Conditioning is offline. A newer Conditioning build may read an older Strength-shaped blob. Either app may attempt a broad overwrite. A shared TypeScript package prevents some compile-time drift, but it cannot protect old installed binaries, partial rollouts, replayed writes, malformed updates, or compromised clients.

Use domain-owned server rows or resources with:

- a contract/schema version;
- an owning domain and permitted writers;
- an idempotency key for every mutation;
- optimistic concurrency (`expected_version` or an equivalent conditional write);
- server timestamps and client observation timestamps;
- append-only integration events for cross-domain facts;
- immutable or snapshot-based historical decisions;
- explicit conflict and migration outcomes;
- RLS and least-privilege grants.

Do not relationalise every internal object on day one. Do make shared cross-app facts and Coordinator output first-class server contracts.

### Redline B — do not create a new “readiness authority” beside hidden old authorities

If the new state engine drives only a Home card while lifting and conditioning logic continue reading WHOOP directly, users and developers will have two incompatible interpretations of the athlete. Choose one of these explicit modes:

1. **Observational mode:** state is displayed and logged but cannot affect prescriptions; or
2. **Authoritative adapter mode:** every readiness-sensitive prescription calls one state adapter.

For a safe v1, use observational mode during persistence and contract work, then migrate decision call sites behind an adapter in a named phase. Do not silently mix modes.

### Redline C — state outputs must not imply physiological certainty

“Recovery debt,” “capacity,” and “readiness” are model-derived labels. They are not measurements of tissue recovery, injury status, or medical safety. Every output must include data quality, coverage, missingness, confidence, and reason codes. Do not create a universal threshold such as “readiness under 40 blocks heavy lifting” without product validation and evidence appropriate to the exact population and input protocol.

### Redline D — pain and illness require hard routes

Pain, red flags, illness, and return-to-training status should be able to block or route to human/clinical review independently of a readiness number. HRV, sleep, or a wearable score must never clear a pain hold. Start illness as an explicit manual state. Build a safe, conservative return pathway rather than an inferred diagnosis.

### Redline E — Conditioning-first is a private canary, not automatically the lower-risk public launch

Conditioning is smaller by line count in the supplied plan, but it contains higher integration risk: BLE/FTMS, Concept2, GPS/background behavior, native permissions, EAS, sensor dropout, and platform-specific testing. Build it first only as a private/canary app to validate package and identity boundaries. Do not migrate public users until the compatibility matrix passes.

## Evidence grading used in this package

| Grade | Meaning | Implementation treatment |
|---|---|---|
| A — primary/official | official platform docs, standards, primary studies, systematic reviews, regulator guidance | can justify a contract or guardrail, with scope limits |
| B — adjacent evidence | relevant consensus or study, but not a direct validation of this product’s exact rule | informs a bounded heuristic; label uncertainty |
| C — coaching/product precedent | useful applied practice or design choice without clinical validation | product decision only; never present as science |
| D — unknown | not verified or not supported | audit, experiment, or ask; never silently assume |

Examples:

- Local-first repository architecture: A from platform guidance and local-first systems literature.
- HRV as a conditional advisory input: B/A depending on exact protocol and population; not a pain gate.
- “Two missed sessions means deload”: D; no universal evidence-backed threshold.
- A reason-coded Coordinator with explicit drop decisions: C product architecture, not a physiological discovery.
- Existing line counts and bug locations: D until the real checkout is audited.

## Recommended ownership model

| Layer | Owns | Must not own |
|---|---|---|
| Shared-core | identity, goals, schedule, body metrics, safety flags, raw observations, event/snapshot contracts | workout prescriptions, hidden fatigue logic |
| Whole-Athlete State | interpretation of context, confidence, recovery/debt estimate, constraints, data quality | exercise selection, diagnosis, tissue safety clearance |
| Strength Engine | lifting proposals, progression, e1RM, strength-specific load and fatigue | cross-app weekly plan, illness diagnosis |
| Conditioning Engine | modality proposals, intervals, cardio progression, modality/mechanical outcomes, BLE/GPS/Concept2 adapters | cross-app weekly plan, pain clearance |
| Nutrition Engine | intake, weight trend, expenditure, nutrition targets | training prescription; separate product boundary |
| Coordinator | priority arbitration, weekly placement, accepted/modified/dropped proposals, explanations | rewriting raw facts or inventing specialist physiology |
| App clients | UI, local persistence, platform integrations, user overrides | bypassing server ownership or writing another domain’s data |

## Product invariants to freeze

These should be explicit tests, not only documents:

1. Strength and Conditioning are separate workout kinds; a workout cannot silently mix them.
2. Prescription target and logged result are different records.
3. A completed historical session remains auditable after later plan changes.
4. Local UI can read and log offline; sync retries do not duplicate events.
5. Missing observations are unknown, not zero.
6. Provider observations keep provider, capture time, source ID, and raw/normalized provenance.
7. Pain and illness can produce `blocked`, `held`, or `needs_clinical_review` without passing through a fatigue score.
8. Only the Coordinator publishes a combined weekly plan.
9. Every dropped or modified proposal has a reason code visible to the user or support tooling.
10. Old clients cannot erase fields written by newer clients.
11. Cross-app identity and deletion are consistent.
12. A health/wellness feature does not make unsupported diagnosis, prognosis, treatment, or injury-prevention claims.

## Bottom-line assessment

| Question | Assessment |
|---|---|
| Is splitting Strength and Conditioning defensible? | Yes, if contracts and identity boundaries are explicit. |
| Is a single shared package enough? | No. It helps source consistency but is not a server compatibility boundary. |
| Should recovery/life stress live inside each engine? | No. Shared raw facts and Whole-Athlete State own the interpretation. |
| Is a rules-based Coordinator reasonable for v1? | Yes, if it reconciles proposals and emits reasons; do not hide an uncalibrated fatigue budget. |
| Is Conditioning-first automatically safer? | No. Use it as a private canary because integrations are risky. |
| Can the current timeline be trusted? | Not until migration, old-version, device, security, and store work is measured. |
| What is the next approval? | Baseline audit plus versioned contract/migration rehearsal. |
