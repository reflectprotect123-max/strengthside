# Coordinator, control, and cross-system corpus review

## Scope and interpretation

This is a source-bound review of these locations in the preserved archive:

- `00-governance/`
- `05-coordinator/`
- `06-cross-system/`
- the requested `07-evidence-platform/`, which is **absent** from the extracted top-level archive

The extracted archive contains `07-repo-research/` instead. That directory was not reviewed because it was outside this lane's assigned scope. Evidence-platform design material found in `00-governance/` was reviewed.

The scoped corpus contains 168 files: 19 governance files, 3 coordinator files, and 146 cross-system files. This count includes ZIPs, binary dossier formats, prototypes, fixtures, code, and duplicated material. It is an inventory fact, not a count of scientific sources. No web research was performed. References in the documents were not independently checked. Statements below about proposed physiology, evidence grades, repository behaviour, and safety effectiveness remain unverified unless explicitly described as a corpus or schema fact.

Terminology in old filenames and quoted headings is preserved for provenance. The product is called **THE Hybrid System** here. Archived references to “Hybrid Engine” or “THE Hybrid Engine” are stale naming, not the current product name.

## Evidence-class key

- **Verified source fact (corpus):** directly observed file, field, schema, heading, exact duplicate, or internal inconsistency in the preserved archive.
- **Scientific claim:** a scientific assertion made by an archived document; not independently verified in this review.
- **Product policy:** a normative product decision or safety boundary.
- **Executable-rule candidate:** deterministic logic described sufficiently to encode, but not necessarily evidence-supported, approved, versioned, or tested.
- **Model assumption:** an unvalidated mapping, coefficient, threshold, priority, or state abstraction.
- **Open research gap:** evidence, calibration, approval, interface, or validation still required.
- **Unsupported/rejected claim:** a claim the reviewed corpus itself rejects or marks unverified.

## Executive assessment

The best current control proposal is a deterministic pipeline in which domain systems emit versioned proposals, a separate Whole-Athlete State layer emits domain-neutral context and hard/soft constraints, and one Coordinator reconciles proposals into a reason-coded weekly plan. The governance design then extends this to a higher-level non-LLM pipeline: quality/freshness checks, state estimation, personal adaptation, constrained optimisation, hard validators, and an immutable decision receipt. See `00-governance/THE-Hybrid-System-Traceability-System-Design.md`, headings “Model integration” and “Decision receipt”; and `06-cross-system/fitness-ecosystem-research/docs/01_ARCHITECTURE_DECISIONS.md`, ADR-002, ADR-005, and ADR-006.

This is not yet a validated Multi-model adaptive control system. The archive supplies useful contracts and candidate invariants, but it does not supply an approved objective function, calibrated state model, identifiable personal coefficients, uncertainty model, complete five-system proposal contract, complete validator pack, or evidence-linked executable rule registry. The scoped material supports a deterministic shadow-mode prototype and simulation specification, not an athlete-facing autonomous release.

## Current architecture proposals

### 1. Evidence-to-decision stack

**Product/design proposal.** The governance design specifies eight layers: immutable source archive; extraction/normalisation; structured evidence warehouse; claim/contradiction graph; policy/rule registry; model registry/calibration store; decision/replay ledger; and review/search interfaces. It explicitly says extraction creates candidates rather than truth and requires bidirectional lineage from source through observation, claim, policy, rule, model, and decision. Source: `00-governance/THE-Hybrid-System-Traceability-System-Design.md`, headings “System layers,” “Extraction and normalization,” “Provenance model,” and “From claims to runtime rules.”

**Corpus fact.** Governance includes draft JSON Schemas for an evidence record and decision receipt: `00-governance/evidence-record.schema.json` and `00-governance/decision-receipt.schema.json`. It also includes YAML templates for source records, claims, policies, and candidate rules under `00-governance/decision-hub-research-briefing/templates/`.

**Gap.** These artefacts are drafts, not a complete implemented evidence platform. The scoped archive contains no folder named `07-evidence-platform/`, no populated canonical source registry, no populated model registry, no end-to-end replay ledger, and no evidence-linked control-rule dataset.

### 2. Six-layer operational control topology

**Product/design proposal.** The operational topology is:

```text
Strength proposal ─┐
Conditioning proposal ─┤
Nutrition context/proposal ─┤
Recovery/state observations ─┤→ Whole-Athlete State → Coordinator
User goals, schedule, locks ─┘                         ↓
                                      Multi-model adaptive control
                                      → hard validators
                                      → one SystemDecision + receipt
```

The archived cross-system package is more limited than the requested topology. Its formal `session-proposal.schema.json` permits only `strength` and `conditioning`, and its `weekly-plan.schema.json` likewise permits only those two engines. Nutrition is deliberately outside Coordinator arbitration in `06-cross-system/hybrid-engine-repo-docs/ACTUAL_ARCHITECTURE.md`, heading “The three worlds.” Recovery is represented as state/context, not as a proposal-producing peer. Coordinator is the canonical combined-plan writer in `06-cross-system/fitness-ecosystem-research/docs/01_ARCHITECTURE_DECISIONS.md`, ADR-005.

**Gap.** A five-feed contract does not exist in the reviewed material. Nutrition, Recovery, and Coordinator output semantics must be reconciled with the user's requested five-system input architecture before the higher-level controller can be specified.

### 3. Shared facts, derived state, specialist proposals, canonical writer

**Product policy candidates.** The cleanest ownership boundary is described in `06-cross-system/fitness-ecosystem-research/docs/00_EXECUTIVE_REVIEW.md`, heading “Recommended ownership model”:

- shared-core owns identity, goals, schedule, body metrics, safety flags, raw observations, and contracts;
- Whole-Athlete State interprets shared context but does not prescribe exercise;
- specialist systems own domain proposals;
- Coordinator arbitrates priorities and placement but does not rewrite raw facts or invent physiology;
- clients display, persist, integrate devices, and submit overrides but do not write other domains.

`06-cross-system/fitness-ecosystem-research/contracts/shared-core-contract.json` reinforces this with owning-domain fact writers, Whole-Athlete State as the derived-state writer, and Coordinator as weekly-plan writer.

**Gap.** The contract is marked `1.0.0-draft` and `proposal`. It contains Nutrition integration but no Recovery domain in `supported_domains` or event-envelope domain enums.

## Deterministic, non-LLM control candidates

### Candidates suitable for specification and simulation

1. **Archived candidate, not current policy.** The source proposed broad pain/illness precedence. Current locked policy is narrower: pain holds Strength autopilot load increases only, illness is record-only, and HRV cannot create or clear pain/injury/illness restrictions. Any wider safety rule requires explicit research and review.
2. **Hard-schedule feasibility.** Reject or defer placements outside availability/time windows or conflicting with completed/locked sessions. This is a deterministic feasibility rule. Same source and heading.
3. **One canonical combined-plan writer.** Only Coordinator publishes the combined plan; domain apps may request refresh, preview, override, or mark owned sessions completed/missed. This is a consistency policy. Source: the same file, heading “Canonical writer and permissions.”
4. **Missingness preservation.** Missing observations remain unknown, not zero or “normal.” This is an explicit invariant in `06-cross-system/fitness-ecosystem-research/contracts/shared-core-contract.json` and is reflected in state enums in `contracts/state-snapshot.schema.json`.
5. **Reason-coded disposition per proposal.** Each proposal must resolve to accepted, modified, deferred, dropped, blocked, or needs-input, with reasons and triggered constraints. Source: `06-cross-system/fitness-ecosystem-research/docs/04_COORDINATOR_SPEC.md`, heading “Output,” and `contracts/weekly-plan.schema.json`.
6. **No automatic make-up double.** A missed session triggers replanning, not an automatic catch-up double session. This is a product policy candidate. Source: `06-cross-system/fitness-ecosystem-research/docs/04_COORDINATOR_SPEC.md`, heading “Initial rules to simulate, not silently ship.”
7. **Minimum-change fallback.** If the ideal proposal is infeasible, select the smallest safe modification; otherwise defer or drop with a reason. Same file, heading “Decision order.”
8. **Hard validators dominate learning.** A personal adaptive model may update bounded coefficients but cannot bypass a hard validator. Source: `00-governance/THE-Hybrid-System-Traceability-System-Design.md`, heading “Model integration.”
9. **Immutable/corrective history.** Historical decisions are immutable; corrections create linked new records. Sources: the governance traceability design, heading “Decision ledger,” and `06-cross-system/fitness-ecosystem-research/contracts/shared-core-contract.json`.

### Candidates that must not be promoted unchanged

- **LLM runtime decision maker.** `05-coordinator/THE-Coach-Brain-v0-AI-Model-Spec.md`, headings “Prompt for the AI Runtime” and “Background Learning v0,” assigns runtime training decisions and trend learning to an external AI model. This directly conflicts with the current deterministic non-LLM requirement. Preserve it as historical design material only.
- **Readiness total thresholds of 13–15, 8–12, and 3–7.** These are explicit in the same file, heading “Readiness Rules,” using sleep + energy + soreness scored 1–5 each. They are model assumptions with no source, calibration population, uncertainty, or validation in the reviewed file.
- **Composite readiness thresholds at 70 and 45.** `06-cross-system/hybrid-engine-repo-docs/COORDINATOR_AND_EVIDENCE_AUDIT.md`, “Rule 4 — `deriveAthleteState` readiness composition,” reports code thresholds of `>=70` high and `>=45` moderate and states no rationale is documented. Treat as unsupported model parameters.
- **Wearable recovery bands.** The audit's “Rule 3 — `nextWorkingWeight` daily recovery gate” reports band constants used by code but no evidence rationale. Preserve as a documented software behaviour, not a verified physiological rule.
- **Opaque fatigue budget.** The corpus repeatedly rejects starting with one universal numeric fatigue budget. If later introduced, its units, population, calibration, uncertainty, bounds, and rollback must be explicit. Source: `06-cross-system/fitness-ecosystem-research/docs/04_COORDINATOR_SPEC.md`, heading “Decision order,” and ADR-006.

## State-estimation design

### Proposed state snapshot

`06-cross-system/fitness-ecosystem-research/docs/03_WHOLE_ATHLETE_STATE.md`, headings “State vector” and “Data-quality model,” proposes a deterministic, conservative transformation:

```text
timestamped observations with provenance and missingness
→ normalization and compatibility checks
→ versioned state derivation
→ categorical state + hard/soft constraints + reasons + data quality
```

Candidate state variables are overall capacity, strength capacity, conditioning capacity, recovery debt, life load, sleep context, illness status, pain status, time available, data quality, confidence, constraints, and reason codes. Inputs include sleep, HRV, resting heart rate, subjective wellness/stress/energy/soreness, work/life load, recent training, pain, illness, schedule, and nutrition context.

### Conservative implementation recommendation

The first non-LLM estimator should be a versioned rule-based interpreter, not a weighted readiness score:

1. validate timestamps, units, source identity, allowed ranges, and freshness;
2. preserve every raw observation and provider label;
3. classify missing, stale, and conflicting inputs explicitly;
4. route pain and illness independently to reviewed hard constraints;
5. emit domain-neutral categorical context and reasons;
6. allow specialist systems to translate soft context within their own bounded rules;
7. withhold aggressive adaptation when coverage is sparse or conflicting.

This recommendation follows the corpus's own redline against false precision in `06-cross-system/fitness-ecosystem-research/docs/00_EXECUTIVE_REVIEW.md`, “Redline C — state outputs must not imply physiological certainty.” It is a design choice, not proof that the proposed categories predict performance.

### State-estimation gaps

- No canonical metric IDs for the candidate inputs or outputs appear in these Coordinator/control contracts.
- No measurement-protocol definitions, population scope, reliability bounds, or calibration datasets are present.
- `coverage = observed required inputs / required inputs` is proposed, but “required inputs” is not defined by context or decision.
- Freshness is described as time since last valid observation, but per-metric TTLs are not specified.
- Confidence is explicitly a bounded label rather than a calibrated probability, but its deterministic mapping is absent.
- Conflicting-input precedence is underspecified. Documents state that direct athlete input should outrank wearables, while the audited implementation reportedly averages both into one composite (`COORDINATOR_AND_EVIDENCE_AUDIT.md`, Rule 4).
- Pain and illness questionnaires, red-flag criteria, reviewer ownership, and return-to-training rules require clinical and primary-source work.
- Nutrition is named as context, but no exact data contract establishes which nutrition facts can constrain training, at what time basis, or with what evidence.

## Constrained decision-optimisation design

### Safe v1 formulation

Treat the Coordinator as a deterministic constraint solver over a small proposal set, not as an unconstrained optimizer:

1. **Validate:** reject unknown contract/model versions, malformed proposals, stale snapshots beyond an approved TTL, missing provenance for decision-critical fields, and incompatible units.
2. **Apply hard constraints:** safety holds, clinical-review routes, user locks, legal/product invariants, ownership, schedule feasibility, and version compatibility.
3. **Generate feasible variants:** original proposal plus only specialist-declared safe modifications and minimum viable variants.
4. **Rank lexicographically:** approved goal priority, mandatory/preferred/optional class, continuity/staleness, interference cost, and minimal deviation from locked/current plan.
5. **Resolve conflicts:** retain the highest-ranked feasible set; defer/drop the rest with stable reason codes.
6. **Validate final plan:** domain caps, weekly caps, spacing, duplicates, incompatible combinations, hard blocks, and provenance completeness.
7. **Emit receipt:** exact snapshots/proposals, contract and model versions, rule/policy/claim IDs, validator results, changed and unchanged fields, and replay hash.

The lexicographic order avoids inventing commensurate numerical units across safety, schedule, goals, and physiology. If weighted optimisation is later proposed, every coefficient is a model parameter requiring bounds, provenance, calibration, and rollback under `00-governance/THE-Hybrid-System-Traceability-System-Design.md`, heading “Model registry.”

### Candidate objective and constraints

**Model assumption.** Within the feasible set, minimize plan disruption and lost approved goal contribution while respecting hard constraints. This is not yet an executable formula because the archive does not define goal-contribution units, interference costs, tie-breaking, or acceptable trade-offs.

**Product-policy candidates:** hard safety outranks schedule; schedule outranks invariants and preferences; user locks are preserved unless a hard safety rule blocks them; no system may invent a modification that the owning specialist did not declare safe.

**Open gap:** the archived “Decision order” places user locks within hard safety and hard schedule language in slightly different ways. A formal precedence table is required for cases where a user lock conflicts with pain/illness, invalid data, or stale state.

## System interfaces and interference

### Required common proposal envelope

Each of Strength, Conditioning, Nutrition, and Recovery needs a versioned output contract containing:

- stable proposal/decision ID, system ID, system version, contract version, and generated/expires timestamps;
- athlete and state-snapshot IDs;
- proposed action, target time window, duration, priority class, and goal contribution;
- resource/load tags (muscle/region, mechanical impact, energy system, nutrition/recovery demand where relevant);
- prerequisites, incompatibilities, hard and soft constraints;
- minimum viable and specialist-approved safe modifications;
- raw observation IDs and normalized metric IDs used;
- claim, policy, rule, and model-version references;
- data quality, uncertainty, unresolved assumptions, and reason codes.

Coordinator should consume these envelopes plus user goals, availability, locks, history, overrides, and current time. It should output one combined plan decision plus a per-proposal disposition. The higher-level Multi-model adaptive control layer should consume structured facts and domain outputs only, never raw research prose or LLM-generated advice.

### Known interference relationships in the corpus

- **Strength ↔ Conditioning:** archived documents claim interference is context-specific and propose tags such as `heavy_lower_body`, `high_intensity_intervals`, `explosive_power`, `local_lower_limb_high`, `low_intensity_aerobic`, `long_duration_endurance`, and `mechanical_impact_high`. These are scientific/product claims requiring source validation. Source: `06-cross-system/fitness-ecosystem-research/docs/04_COORDINATOR_SPEC.md`, heading “Interference policy.”
- **Recovery → all specialist systems:** state produces hard/soft constraints and context but should not select exercises or prescribe a workout. Pain/illness are separate safety routes and must not be cleared by HRV. Sources: `docs/03_WHOLE_ATHLETE_STATE.md`, headings “HRV boundary” and “Pain and illness are safety routes”; `contracts/shared-core-contract.json`.
- **Nutrition → state/specialists:** current architecture says nutrition facts may be read as context while Coordinator does not see macros. This is an archived product boundary, not yet aligned with the requested five-feed design. Source: `06-cross-system/hybrid-engine-repo-docs/ARCHITECTURE_STATUS.md`, heading “Deliberate boundaries and remaining release work.”
- **Schedule/workload → all systems:** physical work and daily activity should retain modality, duration, intensity, and confidence rather than collapse into arbitrary “extra fatigue.” Source: `docs/04_COORDINATOR_SPEC.md`, heading “Initial rules to simulate, not silently ship.”
- **Coordinator → specialists:** Coordinator may accept, modify only through predeclared variants, defer, drop, block, or request input; it should not invent specialist physiology or rewrite raw facts.
- **User override → Coordinator:** overrides must be explicit, attributable, versioned, and unable to bypass non-overridable safety validators without a reviewed authority path.

### Interface defects and omissions

- `contracts/session-proposal.schema.json` and `contracts/weekly-plan.schema.json` encode only Strength and Conditioning, not all five systems.
- `contracts/event-envelope.schema.json` includes core, strength, conditioning, state, plan, and nutrition, but no explicit recovery or coordinator aggregate domain.
- `00-governance/decision-receipt.schema.json` requires `engine` in each `domainDecisions` item but defines a property named `system` instead. With `additionalProperties: false`, a conforming object cannot satisfy both requirements; this is a blocking schema defect.
- The same decision-receipt schema carries IDs but no input content hash, rule-pack hash, deterministic seed/tie-break state, execution environment, or replay result/hash, so replay equivalence is not fully specified.
- The evidence-record schema permits only one `system` value and omits `cross_system`; cross-system evidence requires either multi-tagging or a dedicated scope mechanism.
- Proposal and plan schemas do not require claim IDs, rule IDs, policy IDs, validator results, uncertainty, or decision-critical provenance.
- The weekly plan's `data_quality` is a single label with no derivation, field-level missingness, or conflict detail.

## Contradictions, duplicates, and staleness

### Exact duplicates observed

**Verified source facts (corpus).** SHA-256 grouping found three exact duplicate pairs in scope:

1. `05-coordinator/2026-08-06-athlete-onboarding-research-brief.md` duplicates `06-cross-system/hybrid-engine-research-notes/2026-08-06-athlete-onboarding-research-brief.md`.
2. `05-coordinator/coaching-platform-research-bundle-2026-08-06.md` duplicates `06-cross-system/hybrid-engine-research-notes/2026-08-06-coaching-platform-research-results.md`.
3. `05-coordinator/THE-Coach-Brain-v0-AI-Model-Spec.md` duplicates `06-cross-system/THE_Hybrid_Engine_Project_Handoff_2026-08-16/02_EVIDENCE_AND_DESIGN/THE-Coach-Brain-v0-AI-Model-Spec.md`.

These should share canonical source IDs with duplicate-instance records rather than be counted as independent evidence.

### Material contradictions

1. **Runtime authority:** the Coach Brain v0 specification assigns decisions to an external AI model, while current governance requires deterministic non-LLM runtime models. The older specification is superseded for runtime architecture.
2. **Readiness representation:** the Coach Brain uses a 3–15 sum and fixed bands; Whole-Athlete State warns against universal scalar thresholds; the repo audit reports a different 0-like composite with 70/45 bands. These are incompatible model designs with no validation trail.
3. **Athlete input precedence:** cross-system policy says direct athlete input should outrank a wearable, but the repo audit says manual and wearable values are combined into one score without that ordering.
4. **App topology:** cross-system design proposes separate deployable Strength and Conditioning products (`docs/01_ARCHITECTURE_DECISIONS.md`, ADR-001), while `hybrid-engine-repo-docs/ARCHITECTURE_STATUS.md`, heading “Product build profiles,” reports one Android app with a runtime world switch. Treat architecture plans as versioned alternatives, not one current truth.
5. **Nutrition topology:** some design materials describe Nutrition as a future separate system/integration; the reported repo architecture says Nutrition is a third world in the same repository and excluded from Coordinator arbitration. The requested target now makes it one of five feeds. A new approved boundary is required.
6. **Automatic progression:** provisional constraints say do not automatically increase load and require coach approval, but `COORDINATOR_AND_EVIDENCE_AUDIT.md`, Rules 1 and 2, reports automatic next-set prefilling and automatic cross-session progression banking in the historical repository.
7. **Receipt durability:** governance requires immutable, replayable receipts, but the same audit's Rule 7 reports the auto-coach ledger as device-local and unsynced.

### Stale or non-authoritative material

- Product naming that calls the overall product “Hybrid Engine” or “THE Hybrid Engine.”
- `05-coordinator/THE-Coach-Brain-v0-AI-Model-Spec.md` as a runtime architecture, because it is LLM-led and lacks schema-trusted deterministic execution.
- Repository-status assertions tied to dated commits or dates, including `hybrid-engine-repo-docs/ACTUAL_ARCHITECTURE.md` (“Written 8 August 2026 against `main` @ `a8ff104`”) and `ARCHITECTURE_STATUS.md` (“Updated 2026-08-04”). They are historical claims; the application repository was not inspected in this lane.
- Any source or evidence grade in `docs/CLAIM_REGISTER.md` until the cited source registry entries are independently checked. The register itself explicitly marks some entries unverified or rejected.

## Conservative scoped counts

These are lower-bound content counts for planning, not claims of validated evidence. Exact duplicates are not counted twice where identified.

| Item | Conservative count | Interpretation |
|---|---:|---|
| Files in reviewed top-level areas | 168 | 19 governance + 3 coordinator + 146 cross-system; includes binaries/code/ZIPs |
| Explicit registered candidate claims/rules | 20 | IDs CR-001 through CR-020 in `06-cross-system/fitness-ecosystem-research/docs/CLAIM_REGISTER.md`; none independently source-verified here |
| Candidate state/context metrics or variables | 24 | Lower-bound unique named inputs/outputs in `docs/03_WHOLE_ATHLETE_STATE.md`; **0 have canonical metric IDs in the reviewed control contracts** |
| Explicit formula expressions | 2 | readiness total as the sum of three 1–5 inputs (implied by the 3–15 specification) and coverage = observed required inputs / required inputs |
| Additional threshold/parameter sets | 3 | 3–15 readiness bands; audited 70/45 state bands; audited provider-recovery bands with constants not shown in the review document |
| Initial Coordinator rules explicitly marked for simulation | 7 | Listed under `docs/04_COORDINATOR_SPEC.md`, “Initial rules to simulate, not silently ship” |
| Product invariants proposed for tests | 12 | `docs/00_EXECUTIVE_REVIEW.md`, “Product invariants to freeze” |
| Existing code-rule behaviours audited historically | 9 | `hybrid-engine-repo-docs/COORDINATOR_AND_EVIDENCE_AUDIT.md`, Rules 1–9; code not re-inspected here |
| Fully usable evidence-linked executable rules | 0 | None in scope has the complete claim → approved policy → versioned rule → model → validator → receipt chain required by current governance |
| Exact duplicate pairs | 3 | SHA-256-identical pairs listed above |
| Explicit registered evidence gaps | 7 | Listed in `docs/CLAIM_REGISTER.md`, “Evidence gaps to research later” |

The metric count deliberately excludes every number merely appearing in UI prototypes, research prose, or example athlete records. The formula count excludes undefined prose such as “bounded ranking,” “interference cost,” or “increase slightly.”

## Priority gaps

### P0 — blocking architecture and safety gaps

1. Approve a single five-system interface model, including whether Nutrition and Recovery emit proposals, constraints, context, or a combination.
2. Repair and extend the decision-receipt schema; add input and rule-pack hashes, exact versions, replay fields, and consistent `system`/`engine` naming.
3. Define hard-validator ownership and non-overridable outcomes for pain, illness, invalid model versions, incompatible units, stale state, incomplete provenance, and conflicting recommendations.
4. Replace all LLM runtime authority with deterministic rules/models; permit LLM use only for untrusted extraction/classification/summarisation outside athlete decision execution.
5. Define formal conflict precedence among safety, user locks, coach approval, schedule, domain caps, and user overrides.
6. Build canonical registries linking observations → claims → policies → rules → model versions → validators → receipts.

### P1 — state and optimisation research gaps

1. Define metric IDs, units, time bases, collection methods, population scope, freshness TTLs, and uncertainty for every state input.
2. Validate or reject the candidate state categories and thresholds against appropriate primary sources and product data; do not reuse 3–15 or 70/45 bands by default.
3. Specify missing/conflicting-data behaviour at field and decision level.
4. Define specialist-declared safe modifications and minimum viable variants.
5. Operationalise interference tags with precisely scoped claims, populations, modalities, timing, outcomes, and uncertainty.
6. Define goal-contribution semantics and deterministic tie-breaking without pretending unlike quantities share a natural scale.
7. Establish bounded personal adaptation: parameter identity, priors, update window, minimum observations, shrinkage/default behaviour, bounds, drift checks, rollback, and out-of-distribution handling.

### P2 — validation and replay gaps

Create golden tests for at least:

- identical inputs and versions produce byte-equivalent normalized decisions or a documented canonical equivalent;
- pain/illness cannot be cleared by wearable or learned coefficients;
- missing is never coerced to zero or normal;
- incompatible units, denominators, populations, and time bases block comparison;
- unknown/expired contract or model version blocks execution;
- stale and conflicting inputs downgrade or block according to explicit policy;
- only specialist-declared modifications can be selected;
- locked sessions cannot bypass hard safety;
- simultaneous domain recommendations resolve deterministically with per-proposal reasons;
- corrections append and link; they never rewrite prior receipts;
- replay verifies source snapshot hash, rule-pack hash, model version, validator version, and result hash.

## Proposed acceptance boundary for this lane

This material can be considered organised enough to seed implementation only when:

1. every candidate rule has a stable ID and explicit classification (scientific claim, product policy, safety invariant, software default, or model assumption);
2. no unsupported threshold is labelled evidence-based;
3. the proposal/state/plan/receipt contracts cover all five systems and validate successfully;
4. every executable decision path emits deterministic reasons and immutable lineage;
5. hard validators have tests and cannot be bypassed by personal learning;
6. simulation fixtures cover the conflict cases listed in `docs/04_COORDINATOR_SPEC.md`, heading “Simulation harness,” plus five-system and provenance failures;
7. shadow replay succeeds before any athlete-facing automated change is enabled.

## Status statement

- **Complete in this lane:** scoped inventory count; architecture synthesis; exact-duplicate identification; deterministic control candidates; state-estimation and constrained-optimisation proposal; interface/interference map; contradiction/staleness review; conservative counts; prioritized gaps.
- **Partially complete in the archive:** draft evidence/receipt schemas, state/proposal/plan/event contracts, claim register, proposed product invariants, and simulation scenarios.
- **Incomplete:** canonical five-system contracts, verified source registry, metric dictionary, evidence-linked rule registry, calibrated model registry, validator implementation, immutable replay ledger, and five-system fixtures.
- **Uncertain:** scientific validity of interference, HRV, sleep/stress, pain, illness, and readiness assertions; actual current application behaviour; suitability of any thresholds or coefficients.
- **Unsupported or rejected for runtime use:** LLM-led Coach Brain decision execution, universal readiness cutoffs, opaque fatigue budgets, unverified wearable recovery thresholds, and any claim of production readiness.
