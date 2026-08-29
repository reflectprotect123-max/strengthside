# THE Hybrid System — System Constitution v1.0

**Status:** Ratified  
**Constitution version:** 1.0-ratified  
**Date:** 2026-08-28  
**Authority:** This document is the highest product and runtime design authority.  
**Scope:** Product identity, system boundaries, authority, data ownership, runtime behaviour, evidence governance, activation and amendment.  

## 1. Purpose

THE Hybrid System is a local-first, evidence-governed coaching system that coordinates strength training, conditioning, nutrition, recovery context and real-life constraints into one coherent plan.

Its operating loop is:

> **Plan → Schedule → Train → Log → Recover → Review → Progress**

The system exists to improve long-term progress while keeping decisions bounded, internally traceable, reversible and responsive to the individual athlete. It is not a chatbot, an unrestricted workout generator, a medical diagnostic system or a single opaque readiness score.

## 2. Product identity

1. The product and ecosystem name is **THE Hybrid System**.
2. The final control and execution layer is **BIG MAC**: **Biological Integration & Guidance Multi-model Adaptive Controller**.
3. The five specialist systems are:
   - Strength
   - Conditioning
   - Nutrition
   - Recovery
   - Coordinator
4. The five systems are peer inputs to BIG MAC. None has unilateral authority over the complete athlete plan.
5. The Coordinator is not BIG MAC and does not sit above the other four specialist systems.
6. Whole-Athlete State is the structured state-estimation layer used by BIG MAC. It is not a sixth specialist system and cannot independently prescribe training or nutrition.
7. When BIG MAC has an approved deterministic answer, BIG MAC leads the decision. When BIG MAC formally declares that it does not know the answer, a configured Gemini/Gemma fallback becomes the lead decision author while BIG MAC remains the hard gate and silent executor.
8. “Hybrid” means coordinated management of competing and supporting adaptations across the complete athlete—not merely placing lifting and cardio in the same calendar.

## 3. Product surfaces and logical systems

Logical systems and user-facing applications are different concerns.

The product destination is:

- Strength and Conditioning may remain separately deployed specialist applications.
- Nutrition may remain a separately deployed product such as MacroTrack.
- Recovery and Coordinator may appear as shared services or integrated surfaces rather than standalone applications.
- BIG MAC is a shared control service, not a user-facing chat product.
- All surfaces communicate through explicit, versioned shared contracts.

No application may obtain authority by directly reading another application’s private storage or silently reproducing another system’s logic. Shared behaviour must cross an owned contract or integration-event boundary.

## 4. Human authority

1. The athlete owns their goals, preferences, availability, equipment, locks, manual overrides and consent settings.
2. A coach may author programs and prescriptions only within an explicit athlete–coach relationship.
3. Coach-authored prescriptions and athlete-observed results are separate data objects with separate ownership.
4. A coach prescription must never contain or overwrite athlete-owned performed results.
5. A BIG MAC decision may not destructively overwrite an athlete or coach decision. It creates a superseding plan version with a complete hidden receipt.
6. Manual logging and user-authored training remain available when BIG MAC abstains or is unavailable.
7. Hybrid System v1 operates in **silent automation mode** after the athlete enables the system. Approved training, nutrition and schedule actions apply without per-change confirmation.
8. The normal athlete experience contains no adjustment notification, approval prompt or unsolicited “we changed this because…” explanation. The current plan simply reflects the new approved state.
9. Silent operation never means unrecorded operation. Every change remains bounded, append-only, reversible and fully receipted in the background.
10. The athlete may disable silent automation globally at any time. This does not create per-change prompts; it returns the product to manual planning and logging.

## 5. Responsibility of each specialist system

### 5.1 Strength

Strength owns:

- exercise identity, equipment and load semantics;
- prescriptions for sets, repetitions, load, RIR/RPE, tempo, rest and other strength metrics;
- performed strength observations and exercise-specific history;
- exercise-specific performance and exposure estimates;
- planned strength or hypertrophy stimulus;
- bounded proposals to maintain, progress, regress, substitute or change volume;
- strength-specific uncertainty and action constraints.

Strength does not own conditioning prescription, nutrition targets, whole-athlete readiness, medical interpretation or the final cross-system decision.

### 5.2 Conditioning

Conditioning owns:

- modality and session identity;
- duration, distance, pace, power, heart rate, work/rest and device method;
- modality-specific performance and load history;
- cardiovascular and local/mechanical outcomes as separate dimensions;
- bounded proposals to maintain or change duration, intensity, intervals, density, timing or modality;
- conditioning-specific uncertainty and interference descriptors.

A cardiovascular pass cannot erase a local or mechanical failure. Conditioning does not own strength-load changes, nutrition targets, universal fatigue or the final cross-system decision.

### 5.3 Nutrition

Nutrition owns:

- intake records and logging completeness;
- body-mass observations and transparent trend estimates;
- goal direction and versioned energy, macro and fuelling targets;
- validated expenditure estimates;
- bounded target-review proposals;
- uncertainty from partial, missing or incompatible data;
- non-diagnostic review flags.

Nutrition does not own exercise progression, wearable-calorie addition without a validated model, medical diagnosis, automatic training restrictions or the final cross-system decision.

### 5.4 Recovery

Recovery owns:

- sleep, resting heart rate, HRV protocol data, soreness, subjective energy, stress, heat and life-load observations;
- data freshness, measurement method, protocol quality and missingness;
- separate typed records for pain, illness, injury and other user-entered context;
- bounded contextual proposals and uncertainty.

Recovery is not a universal readiness oracle. It does not diagnose, select exercises, automatically cancel training or make the final cross-system decision.

### 5.5 Coordinator

Coordinator owns:

- calendar and time availability;
- location and equipment availability;
- goals and their versioned priority order;
- preferences, locks, overrides and adherence context;
- plan phase, plan continuity and prior decision references;
- schedule conflicts and bounded scheduling proposals;
- explicit product-policy inputs.

Coordinator does not estimate physiology, invent scientific thresholds, silently edit another system’s proposal or make the final cross-system decision.

## 6. BIG MAC authority and limits

BIG MAC is the only component permitted to commit a final multi-system decision to the product. It may delegate decision authorship to the Gemini/Gemma fallback only after a typed `NO_DETERMINISTIC_ANSWER` outcome.

For each decision, BIG MAC must:

1. Authenticate and validate versioned outputs from all required systems.
2. Normalize units, denominators, timestamps and time bases.
3. Distinguish observed, derived, estimated, missing, stale and synthetic-test data.
4. Construct a time-indexed, multi-dimensional Whole-Athlete State.
5. Receive or generate a finite set of approved, bounded candidate actions.
6. Optionally ingest frozen Gemini/Gemma alternative-action suggestions through the read-only advisory gateway while BIG MAC remains the decision lead.
7. Remove candidates that violate hard constraints or prerequisites.
8. Identify support, interference, timing and resource conflicts.
9. Preserve athlete locks, coach prescriptions and goal priorities according to a versioned precedence policy.
10. Rank only feasible candidates using approved objectives and parameter versions.
11. Select one candidate when an approved deterministic answer exists.
12. Emit `NO_DETERMINISTIC_ANSWER` when the approved deterministic artifacts cannot make a supported selection.
13. On that typed outcome, freeze a Complete Decision Packet and invoke the configured Gemini/Gemma lead-fallback route.
14. Validate the LLM-authored decision against the non-overridable fallback action envelope and hard validators.
15. Apply an eligible deterministic or fallback decision silently, or leave the current plan unchanged if the fallback fails.
16. Emit an immutable hidden decision receipt for every path.

BIG MAC must never:

- generate an arbitrary unbounded plan;
- use prose as executable authority;
- trade away a hard constraint for a higher score;
- diagnose an injury or illness;
- invent missing values;
- alter its active parameters during the live decision transaction;
- promote research, rules or models;
- permit Gemini or Gemma to write directly to plans, logs, rules, models, parameters, constraints or runtime storage;
- allow a Gemini/Gemma fallback decision outside its approved action schema, numeric bounds or permission envelope;
- depend on Gemini/Gemma availability for normal deterministic operation;
- browse the internet or read raw research inside the deterministic decision core;
- conceal rejected alternatives or reasons;
- surface unsolicited adjustment explanations, prompts or notifications in the normal athlete experience.

## 7. Decision horizons

THE Hybrid System operates across four distinct horizons:

1. **Plan horizon:** goals, phase, program structure and longer-term direction.
2. **Weekly horizon:** schedule placement, competing demands and plan continuity.
3. **Daily/session horizon:** current data quality, available resources and bounded changes to the next exposure.
4. **Review horizon:** outcomes, prediction error, overrides, adherence and eligibility for offline model updates.

A short-horizon signal must not silently rewrite a long-horizon goal. A long-horizon plan must not ignore a valid short-horizon hard constraint. Every proposal declares its target horizon and expiry.

## 8. Candidate-action model

Runtime decisions must select from an approved finite action vocabulary. Initial categories are:

- keep;
- maintain or hold progression;
- bounded increase;
- bounded decrease;
- change volume, intensity, duration, density or timing within approved limits;
- substitute an approved equivalent;
- reschedule;
- record a missing-information requirement without prompting;
- record context only;
- abstain.

Each action type requires a schema, prerequisites, bounds, reversibility rule, evidence/model references, expiry and fallback. Free-form text cannot define or modify an action. Any explanation is confined to an explicitly opened audit or troubleshooting route and is never pushed into normal use.

While BIG MAC has an answer, Gemini/Gemma may only nominate an alternative action type or combination from this approved vocabulary. In lead-fallback mode, the designated LLM may author the action type, target and magnitude, but only inside the separately approved fallback action envelope. It can never author or relax the envelope itself.

## 9. Current action-scoped product policies

These policies supersede broader or conflicting historical archive statements:

1. Training is never automatically blocked by the AI.
2. A recorded pain event makes only `strength_autopilot_load_increase` ineligible.
3. Pain does not automatically cancel training, diagnose an injury or prescribe medical action.
4. Illness is record-only in the current runtime policy. It does not automatically block, reduce or clear training.
5. HRV cannot create, remove or override a pain, injury or illness restriction.
6. Wearable scores are provider observations, not medical truth and not the system’s own readiness decision.
7. No universal readiness threshold, recovery-debt score, deload trigger or workload-danger ratio is authorized.
8. Wider pain, illness, return-to-training, cardiopulmonary, neurological, heat or clinical behaviour requires separate expert ownership, research, ratification and activation.

These are product permissions, not claims that the behaviours are medically sufficient.

## 10. Data constitution

1. The system is local-first and must remain usable for core logging without a network connection.
2. Every domain has an owning writer for its facts.
3. Cross-system communication is append-only through versioned events or snapshots.
4. Corrections supersede earlier records; they do not erase history.
5. Prescribed targets and performed results remain structurally separate.
6. Missing is not zero.
7. Stale is not current.
8. Estimated is not observed.
9. Synthetic test data is never treated as athlete data.
10. Units, denominators, measurement methods and time bases are mandatory where relevant.
11. Every derived value identifies its source observations and transformation version.
12. Device and protocol changes are recorded because they may break comparability.
13. No independently released application may rely on an unversioned, client-merged shared-data blob as its compatibility boundary.
14. Athlete identity, permissions, export, deletion and retention must have explicit ownership.

## 11. Evidence and model authority

THE Hybrid System has three separated planes:

### Evidence plane

Contains sources, observations, claims, contradictions and untrusted AI-assisted extractions. It cannot issue athlete decisions.

### Build and learning plane

Contains frozen datasets, model fitting, validation, replay, simulation and promotion workflows. It cannot directly mutate the athlete application.

### Runtime plane

Contains only approved, immutable and versioned schemas, rules, models, parameters, validators, arbitration policies, fallback action envelopes and frozen LLM input/output records. The deterministic decision core cannot access raw research, research staging, arbitrary plugins or the internet. Gemini/Gemma connectivity terminates at a separate gateway. The gateway can return an append-only proposal record but has no write route into plan, observation, rule, model, parameter or receipt stores.

An evidence item does not become runtime authority because it is plausible, popular or generated by an advanced model. Promotion requires traceable source evidence, applicability review, contradiction review, validation and an owned approval event.

## 12. Gemini/Gemma decision policy

Gemma, Codex or another LLM may assist outside live decisions with:

- research discovery;
- source classification;
- candidate extraction;
- draft structured records;
- contradiction discovery;
- software construction and review;
- offline evaluation of already completed receipts.

Gemini/Gemma has two live roles:

1. **Advisory mode:** suggest alternatives while BIG MAC has an approved deterministic answer.
2. **Lead-fallback mode:** author the decision when BIG MAC emits `NO_DETERMINISTIC_ANSWER`.

Both roles are governed as follows:

1. BIG MAC invokes lead-fallback mode only through the typed, receipted `NO_DETERMINISTIC_ANSWER` state. An LLM cannot declare BIG MAC uncertain or seize control.
2. The gateway supplies a Complete Decision Packet containing all decision-relevant information available to the system: the five domain outputs, Whole-Athlete State, current and prior plan versions, goals, priorities, locks, schedule, equipment, relevant history, recent outcomes, data quality, uncertainty, current candidate ledger, approved evidence summaries and applicable product policies.
3. “All information” means all relevant structured information for that decision, not an indiscriminate dump of raw archives, unrelated history, secrets or credentials.
4. Local Gemma may receive the complete personal packet. Cloud Gemini receives identifiable or sensitive information only when a separate privacy, consent and data-use gate permits it; otherwise the gateway de-identifies or withholds restricted fields.
5. A versioned routing policy selects the lead provider before the decision. Provider choice depends on privacy permission, availability, validated task capability and evaluation history—not on the LLM choosing itself.
6. The lead LLM returns one schema-constrained decision plus hidden reasoning fields, uncertainty and alternatives.
7. In advisory mode, an LLM can only nominate candidates. In lead-fallback mode, it may author a decision inside the approved fallback action envelope.
8. The fallback action envelope defines allowed action types, targets, maximum changes, prerequisites, forbidden combinations and reversion behaviour. It is deterministic, versioned and cannot be modified by an LLM.
9. The LLM cannot edit or destructively overwrite any plan, observation, log, proposal, rule, constraint, score, parameter, model or receipt. The deterministic executor creates a new superseding plan version.
10. The LLM cannot override athlete locks, coach locks, data ownership, the pain/illness/HRV policies in Section 9, hard validators or the fallback action envelope.
11. BIG MAC validates the fallback output mechanically. Passing validation permits silent application; failing validation leaves the current plan unchanged.
12. No acceptance, rejection, escalation or explanation message is shown during normal use.
13. If the selected provider is unavailable, slow, malformed or outside permission scope, the router may use the approved backup provider. If no valid fallback result exists, the plan remains unchanged.
14. Every prompt, Complete Decision Packet, provider/model version, response, validator result and committed change is frozen and hashed in the hidden receipt.
15. Replay uses the frozen LLM response; it never calls Gemini or Gemma again.

The deterministic BIG MAC path remains more trustworthy than the LLM fallback because it is backed by promoted rules/models and reproducible selection logic. Lead-fallback decisions must be separately monitored for reversals, errors, drift and disagreement and must never be reported internally as deterministic decisions.

All LLM-produced evidence, advisory and fallback records remain untrusted until they pass the permissions and validators assigned to their role. An LLM may not approve its own work, promote a rule, change a fallback envelope or set an active parameter.

## 13. Uncertainty, abstention and failure

Uncertainty is part of the data and decision—not a decorative confidence percentage.

BIG MAC must enter lead-fallback mode when no approved deterministic rule/model can support a selection or when eligible deterministic candidates remain materially tied or unsupported.

The complete system must leave the current plan unchanged when:

- a required system output is absent or structurally invalid;
- required data is stale, incompatible or below the model’s data contract;
- provenance or an artifact hash is invalid;
- the athlete or context is outside the validated applicability envelope;
- no feasible candidate remains;
- a material contradiction is unresolved;
- model disagreement exceeds an approved bound;
- the LLM fallback output fails its schema, permission, privacy, numeric-bound or hard-validator checks;
- no approved LLM provider returns a valid result;
- a complete decision receipt cannot be produced or replayed.

Abstention is a successful controlled outcome. It must include hidden reason codes, leave the current plan unchanged and avoid an unsolicited user-facing explanation. It must not prevent manual use of the product.

## 14. Decision receipts, replay and rollback

Every recommendation, hold, request or abstention produces an immutable receipt containing:

- normalized input snapshot and hashes;
- source event references;
- data-quality and uncertainty states;
- complete candidate set;
- rejected candidates and reason codes;
- selected action or abstention;
- exact rules, models, parameters, policies and software versions;
- validator results;
- prior and superseding decision references;
- runtime-bundle hash;
- canonical receipt hash.

Receipts are operational infrastructure, not normal athlete messaging. They remain invisible during ordinary use and are exposed only through an explicit audit, testing or troubleshooting route.

The same immutable inputs and artifacts—including frozen Gemini/Gemma advisory or lead-fallback responses when present—must reproduce the same canonical committed decision. Active model updates are atomic bundle replacements, never in-place mutation. Rollback restores a previously approved complete bundle without rewriting historical receipts.

## 15. Personal adaptation

1. Cold start must not pretend personalisation exists.
2. The first eligible model uses an approved population baseline within its applicability limits.
3. Personal models predict narrow measurable outcomes, not “the correct plan.”
4. Personal fitting occurs offline against frozen, traceable data.
5. Candidate personal models must outperform defined baselines and pass calibration, stability, replay and regression gates in shadow mode.
6. Runtime may record outcomes but may not immediately rewrite active parameters.
7. Personal adaptation cannot learn or relax product policy, consent, safety permissions or hard constraints.
8. Unconstrained reinforcement learning and opaque deep models are prohibited from initial activation.

## 16. Definition of Hybrid System v1

Hybrid System v1 is complete only when it can:

1. Ingest valid personal data through owned adapters.
2. Produce a timestamped Whole-Athlete State vector with quality and uncertainty.
3. Receive valid proposals from all five systems.
4. Generate and evaluate a finite bounded candidate set.
5. Apply action-scoped constraints before candidate ranking.
6. Resolve at least the approved v1 cross-system conflict classes.
7. Produce one silently applied action, maintain result or abstention result; missing-data requirements remain internal.
8. Apply eligible approved changes without a prompt, notification or unsolicited explanation while storing a hidden structured receipt.
9. Reproduce historical decisions byte-for-byte using immutable inputs and artifacts.
10. Continue normal deterministic operation when Gemini/Gemma is unavailable and leave the current plan unchanged when a required fallback cannot produce a valid decision.
11. Preserve athlete and coach data ownership and manual control.
12. Accept read-only Gemini/Gemma alternative-action nominations without granting direct write or override authority.
13. Invoke Gemini/Gemma as the lead decision author after a typed `NO_DETERMINISTIC_ANSWER`, feed it the Complete Decision Packet, validate its output and silently apply only decisions inside the approved fallback envelope.
14. Pass offline validation, historical replay and supervised shadow testing.
15. Support atomic rollback to the prior approved runtime bundle.

V1 does not require medical diagnosis, every sport or modality, full commercial-product parity, visible adjustment explanations or unrestricted generative coaching.

## 17. Sequential construction rule

The project is built one ratified, testable deliverable at a time.

The order is:

1. Ratify this Constitution.
2. Ratify the shared data contract.
3. Build the receipt and replay core.
4. Build one narrow Strength vertical slice with a deterministic BIG MAC path.
5. Add the Gemini/Gemma lead-fallback route for that same bounded Strength decision.
6. Research, validate and shadow-test both paths for that slice.
7. Add Conditioning as the second vertical slice.
8. Add Nutrition as the third vertical slice.
9. Add Recovery as the fourth vertical slice.
10. Add Coordinator as the fifth vertical slice.
11. Activate full BIG MAC cross-system arbitration only after the five inputs have valid owned contracts and tested behaviour.

No later stage may silently redefine an earlier ratified boundary. No system may be declared complete merely because its schema or software shell exists.

## 18. Supersession of historical designs

After ratification, this Constitution supersedes conflicting historical material on:

- an unbounded LLM-led Coach Brain as the primary runtime authority;
- Coordinator as the final system brain;
- Whole-Athlete State as an independent prescriber;
- universal scalar readiness bands;
- broad automatic pain or illness control;
- unreviewed automatic progression;
- unversioned shared-blob integration;
- mandatory per-change confirmation or visible adjustment explanations;
- guessed proprietary formulas or thresholds.

Historical documents remain evidence of prior exploration, not current implementation authority. Scientific claims inside them remain subject to the evidence-promotion process.

## 19. Amendment and ratification

### Ratification

This document became **v1.0-ratified** after the product owner instructed the system to update the Gemini/Gemma lead-fallback behaviour and begin construction on 2026-08-28. The ratified artifact records its file hash and retains all earlier Library versions.

### Amendments

Constitutional changes require:

1. an amendment identifier;
2. the exact old and proposed language;
3. the reason for change;
4. affected systems, contracts, models and tests;
5. migration and rollback impact;
6. product-owner approval;
7. a new constitution version and immutable history.

Research findings may change rules, parameters or models through ordinary promotion. They do not amend this Constitution unless they require a change to system identity, authority, product policy or non-negotiable boundaries.

## 20. Ratification checklist

The product owner should approve or amend these decisive positions:

- Five peer systems feed BIG MAC; Coordinator is not the brain.
- Strength, Conditioning and Nutrition may remain separate application surfaces while using one shared control architecture.
- Hybrid System v1 silently applies approved training, nutrition and schedule changes while storing hidden receipts.
- Gemini/Gemma may suggest alternatives while BIG MAC knows the answer and becomes the lead decision author after BIG MAC emits `NO_DETERMINISTIC_ANSWER`.
- BIG MAC remains the hard gate and silent executor; Gemini/Gemma cannot overwrite, bypass fixed constraints or directly write anything.
- Current pain, illness and HRV behaviour is action-scoped exactly as defined in Section 9.
- The project proceeds sequentially, beginning with one narrow Strength decision path after shared contracts and replay are complete.

## 21. Ratification record

- **Product-owner approval:** “update that. an then start building please”
- **Approval date:** 2026-08-28
- **Ratified version:** 1.0
- **Next authorized deliverable:** Shared Data Contract v1.0 draft
- **Construction constraint:** Complete and review one deliverable before beginning the next.
