# THE Hybrid System
## Five-Engine Research and Evidence-Refinery Plan

**Version:** 1.0  
**Date:** 28 August 2026  
**Status:** Master research plan

---

## 1. Purpose

THE Hybrid System will be built on a large, traceable research foundation and converted into a transparent, non-LLM adaptive control system.

The research ambition is **1–3 million normalized lines of research per engine**:

| Engine | Research target |
|---|---:|
| Strength | 1–3 million lines |
| Conditioning | 1–3 million lines |
| Nutrition | 1–3 million lines |
| Recovery | 1–3 million lines |
| Coordinator | 1–3 million lines |
| **Total** | **5–15 million lines** |

The line target describes the size of the evidence corpus. It is not the number of lines the runtime must read, and it is not a substitute for research quality.

The runtime must use a much smaller, verified layer of claims, policies, rules, equations, models and tests.

---

## 2. Target architecture

The five systems are independent domain feeds. They do not directly rewrite each other.

```text
Research corpus, app data, sessions, check-ins, WHOOP and optional web research
                              ↓
                       Five system feeds
       Strength · Conditioning · Nutrition · Recovery · Coordinator
                              ↓
             Multi-model adaptive control system
       State estimation · Personal adaptation · Optimisation
                              ↓
                    Hard validators and audit
                              ↓
               One validated system decision
                              ↓
                    Authorised silent apply
```

The Multi-model adaptive control system is the non-LLM AI layer. It learns relationships between the five systems, but it must remain bounded by deterministic rules and safety validators.

---

## 3. What the research product must contain

The finished research product is not one enormous document. It is an evidence system containing:

1. Raw source archive and web captures.
2. Immutable source registry.
3. Deduplicated full-text index.
4. Source-quality and population metadata.
5. Atomic evidence claims.
6. Contradiction and limitation records.
7. Evidence syntheses.
8. Product policies.
9. Versioned executable rule packs.
10. Golden test scenarios.
11. Model assumptions and calibration records.
12. Cross-engine interaction maps.
13. Decision receipts and replay traces.

The research corpus is a build-time asset. Raw research must never directly control an athlete decision at runtime.

---

## 4. Evidence-to-rule pipeline

Every important decision must follow this chain:

```text
Raw source
  → source record
  → exact passage or location
  → atomic evidence claim
  → evidence synthesis
  → product policy
  → executable rule
  → golden test
  → shadow evaluation
  → approved release
```

Every silent decision must be traceable:

```text
SystemDecision
  → domain decision
  → rule ID and pack version
  → policy ID
  → claim IDs
  → source IDs and exact locations
```

LLM-assisted extraction is allowed during research, but an extracted claim remains untrusted until its source is checked.

---

## 5. Source-quality hierarchy

### Tier A — strongest foundations

- systematic reviews and meta-analyses;
- randomised and well-designed prospective trials;
- consensus statements;
- professional position stands;
- measurement standards;
- official product documentation when documenting product behaviour;
- authoritative engineering and safety standards.

### Tier B — useful supporting evidence

- high-quality observational studies;
- reliability and validity studies;
- validated modelling studies;
- relevant cohort studies;
- official technical documentation;
- well-documented implementation research.

### Tier C — indirect or bounded evidence

- mechanistic studies;
- adjacent populations;
- expert synthesis;
- coaching precedents;
- product case studies;
- historical evidence.

### Tier D — discovery material

- search snippets;
- unsourced articles;
- forum posts;
- influencer claims;
- AI-generated summaries without verified source locations.

Tier D may help locate better evidence but cannot independently justify a runtime rule.

---

## 6. The five research programmes

### 6.1 Strength

#### Core decisions

- increase, maintain or reduce working load;
- progress repetitions, load, sets or effort;
- estimate current strength capacity;
- handle equipment increments and rounding;
- respond to repeated deterioration;
- distinguish ordinary fatigue from pain;
- handle training gaps and re-entry;
- preserve the intended purpose of the session.

#### Research lanes

- progressive overload and resistance-training progression;
- strength and hypertrophy dose-response;
- volume, intensity and frequency;
- RPE/RIR and autoregulation;
- e1RM and performance measurement;
- microloading and equipment resolution;
- failure, fatigue and deloads;
- exercise and population specificity;
- concurrent training interactions;
- pain, injury boundaries and non-diagnostic adaptation.

#### Existing foundation

Strength currently has the strongest dedicated research package after Nutrition. It includes ACSM progression guidance, load-versus-repetition evidence, microloading research, RPE/RIR evidence, e1RM reliability, RP Hypertrophy principles, MacroFactor Workout behaviour, fatigue logic and test fixtures.

#### Remaining work

- broaden the source corpus substantially;
- standardise all claims into the master registry;
- resolve conflicting progression gates;
- separate evidence-backed rules from product heuristics;
- validate the live repository path and actual silent application.

---

### 6.2 Conditioning

#### Core decisions

- progress, maintain or ease conditioning;
- adjust duration, frequency, interval structure or intensity distribution;
- interpret incomplete heart-rate data;
- estimate internal and external load;
- identify interference with strength;
- account for occupational steps, heat and physical work;
- distinguish useful fatigue from excessive fatigue.

#### Research lanes

- aerobic training dose-response;
- Zone 2 and low-intensity training;
- threshold and high-intensity intervals;
- polarized, pyramidal and other intensity distributions;
- modality specificity and transfer;
- heart-rate zones and limitations;
- internal versus external load;
- HRV-guided endurance training;
- concurrent strength-and-endurance programming;
- heat and environmental stress;
- wearable measurement reliability;
- recovery time between hard sessions.

#### Existing foundation

The project already contains conditioning concepts, libraries and research on heart rate, Zone 2, intervals, HRV limitations, physical workload, heat, activity compensation and strength interference.

#### Remaining work

Conditioning does not yet have a research corpus or evidence pack matching the depth of Nutrition and Strength. It needs a dedicated primary-source programme, clearer modality-specific rules and deeper research on hybrid scheduling.

---

### 6.3 Nutrition

#### Core decisions

- estimate expenditure and energy balance;
- adjust nutrition targets from bodyweight trends;
- handle complete, partial, fasted and missing logs;
- set protein, carbohydrate and fat targets;
- support strength and conditioning fuelling;
- recognise low-fuelling risk;
- handle body-composition goals conservatively;
- separate nutrition estimation from medical safety.

#### Research lanes

- MacroFactor-style expenditure estimation;
- BMR and TDEE equations;
- trend-weight filtering;
- activity and step modelling;
- food-log error and missingness;
- protein dose, distribution and energy restriction;
- carbohydrate timing and periodisation;
- hydration and electrolytes;
- energy availability and RED-S boundaries;
- body-composition change rates;
- sex, age and life-stage differences;
- contraindications and referral limits.

#### Existing foundation

Nutrition has the most complete research package. It includes MacroFactor documentation, expenditure logic, trend handling, calibration, activity modifiers, partial logging, calorie and fat floors, protein research, PubMed validation, energy availability and athlete-safety material.

#### Remaining work

- convert the current synthesis into a complete master claim registry;
- expand independent evidence beyond MacroFactor’s public descriptions;
- improve hybrid carbohydrate and hydration research;
- establish product-specific calibration and safety tests;
- keep MacroFactor replication claims separate from independent evidence.

---

### 6.4 Recovery

#### Core decisions

- estimate recovery posture and available capacity;
- adjust confidence when data is incomplete;
- account for sleep, HRV, soreness, pain, illness and stress;
- account for heat, occupational workload and training gaps;
- identify accumulated recovery debt;
- support conservative re-entry;
- avoid treating one signal as a diagnosis or verdict.

#### Research lanes

- sleep duration, regularity and performance;
- subjective wellness and measurement reliability;
- HRV and resting-heart-rate limitations;
- acute and accumulated training load;
- soreness, pain and fatigue separation;
- illness and return-to-training evidence;
- heat and environmental recovery cost;
- recovery interventions;
- deload research;
- detraining and re-entry;
- energy availability and health signals;
- composite readiness-score validity.

#### Existing foundation

Recovery research is substantial. Existing work covers sleep, HRV, pain, illness, soreness, fatigue, recovery debt, heat, work stress, training gaps, deloads and athlete-safety boundaries. Whole-athlete state and readiness concepts also exist in the product architecture.

#### Remaining work

- create a dedicated, standardised Recovery evidence pack;
- distinguish recovery capacity from medical screening;
- convert recovery signals into bounded state transitions;
- prove that pain and illness states are consumed by the live decision path;
- test missing, stale and contradictory recovery data.

---

### 6.5 Coordinator

#### Core decisions

- merge the five system feeds;
- resolve conflicts between domain recommendations;
- preserve session purpose;
- decide when evidence is insufficient;
- handle stale, missing or contradictory inputs;
- select the correct decision cadence;
- apply only authorised effects;
- create a complete decision receipt.

#### Research lanes

- deterministic expert systems;
- multi-objective optimisation;
- constrained decision-making;
- control theory and adaptive control;
- state estimation and temporal reasoning;
- uncertainty and missing-data policy;
- safety invariants and rule precedence;
- human factors and silent automation;
- auditability, rollback and replay;
- shadow evaluation and model monitoring;
- cross-domain sports-science interactions;
- privacy, ownership and data boundaries.

#### Existing foundation

The Coordinator has a strong architectural base: the Decision Hub concept, whole-athlete snapshots, domain decisions, validators, audit receipts, versioning, rollback and silent application.

#### Remaining work

Coordinator research is currently more architectural than empirical. It needs a dedicated research programme covering deterministic control systems, human-factors evidence, multi-objective decision systems and cross-engine interaction research.

The Coordinator must also be separated clearly from the new Multi-model adaptive control system. The Coordinator is one of the five system feeds. The Multi-model system is the higher-level adaptive intelligence that learns from all five.

---

## 7. Agent research structure

Research will be conducted in non-overlapping lanes so agents do not repeatedly search the same material.

### Per-engine lanes

Each engine receives dedicated agents for:

1. Primary science.
2. Reviews and meta-analyses.
3. Guidelines and consensus.
4. Measurement and validation.
5. Product and coaching precedent.
6. Edge cases and contradictions.

### Cross-system lanes

Additional agents cover:

1. Strength–conditioning interaction.
2. Training–nutrition interaction.
3. Recovery–performance interaction.
4. Energy availability and hybrid training.
5. Control-system and optimisation research.
6. Safety, uncertainty and silent automation.

Each agent must return structured records, not just a prose summary:

- source ID;
- engine;
- decision question;
- source type;
- population;
- intervention or exposure;
- comparator;
- outcome;
- exact finding;
- limitation;
- transferability;
- candidate policy implication;
- confidence;
- exact citation.

---

## 8. Research waves

### Wave 0 — Inventory and foundation

Create the master index of everything already produced. No new research should be treated as complete until existing material is catalogued first.

Outputs:

- current file inventory;
- source inventory;
- duplicate map;
- existing claim map;
- existing rule map;
- gap map;
- line-count method;
- research taxonomy.

### Wave 1 — Balanced five-engine breadth

Build an initial evidence map for all five engines. The purpose is to prevent one engine becoming extremely detailed while another remains mostly architectural.

Outputs:

- research questions per engine;
- source-quality map;
- initial claims per major decision;
- major contradictions;
- first evidence-to-rule example for each engine.

### Wave 2 — Conditioning, Recovery and Coordinator expansion

These are the weakest relative areas and should receive the next depth pass.

Outputs:

- dedicated Conditioning evidence pack;
- dedicated Recovery evidence pack;
- dedicated Coordinator/control-system evidence pack;
- cross-engine interaction map;
- expanded source registry.

### Wave 3 — Strength and Nutrition expansion

Expand the already strong areas with more primary studies, subgroup evidence, measurement work, historical sources and contradictory findings.

Outputs:

- expanded Strength corpus;
- expanded Nutrition corpus;
- independent validation review;
- refined claims and policy boundaries.

### Wave 4 — Evidence compilation

Convert reviewed claims into rule packs and model specifications.

Outputs:

- evidence claim registry;
- policy registry;
- executable rules;
- state-transition definitions;
- model inputs and outputs;
- cross-engine interaction coefficients or bounded policies.

### Wave 5 — Testing and shadow evaluation

Before silent application, replay historical data and run the system without changing the athlete plan.

Test:

- missing data;
- stale data;
- contradictory signals;
- pain;
- illness;
- poor sleep;
- low HRV;
- high work steps;
- hard conditioning;
- low fuelling;
- equipment limits;
- training gaps;
- conflicting system recommendations.

### Wave 6 — Controlled release

Enable only bounded, reversible changes. Every output must have a version, reason code, source status and audit receipt.

---

## 9. Progress measures

Line count is tracked, but the main progress measures are:

- verified source count;
- primary-source coverage;
- deduplication rate;
- evidence-claim count;
- claims with exact citations;
- unresolved contradiction count;
- population and modality coverage;
- policy coverage;
- executable-rule coverage;
- golden-test coverage;
- decision determinism;
- silent-data-coercion rate;
- safety-validator bypass rate;
- replay consistency;
- personal calibration performance.

The target quality condition is not merely “three million lines collected.” It is:

> Every important runtime behaviour is supported by a traceable evidence or policy chain and tested at its boundaries.

---

## 10. Product locks

These rules are fixed unless deliberately reopened:

- no LLM makes runtime athlete decisions;
- training is never automatically blocked;
- pain may hold strength autopilot load increases only;
- illness is recorded and does not automatically stop training;
- HRV is not a pain, injury or illness gate;
- progression changes remain silent;
- there is no accept/decline progression interface;
- each pure engine remains free of I/O;
- adapters own persistence and side effects;
- raw facts remain separate from derived estimates;
- historical athlete records are never silently rewritten;
- every automatic change is replayable and auditable.

An LLM such as Gemini may assist with research sorting, note parsing or optional explanation, but its output must be treated as an untrusted proposal and passed through deterministic validation.

---

## 11. First two-day sprint

### Day 1 — master inventory

- catalogue every existing research document;
- identify which engine each document supports;
- extract source names, dates, URLs and evidence types;
- identify duplicates and superseded files;
- list existing rules, formulas and tests;
- create the five-engine gap map.

### Day 2 — evidence refinery foundation

- finalise the source-record schema;
- finalise the evidence-claim schema;
- finalise the policy schema;
- finalise the candidate-rule schema;
- create the first verified claim for each engine;
- create one complete source-to-rule example for Strength;
- record all product-policy choices separately from scientific findings.

### Definition of done

- all five engines have a research map;
- existing research is indexed;
- each engine has initial cited claims;
- unresolved gaps are visible;
- evidence and product policy are separated;
- one end-to-end evidence-to-rule chain exists;
- no raw research is treated as runtime authority.

---

## 12. Roles

### Research and synthesis

The research process will be conducted through structured searches, parallel research lanes, source checking, evidence reconciliation and repeated synthesis passes.

### Owner decisions

The owner approves:

- product intent;
- hard safety locks;
- acceptable automation boundaries;
- disputed policy choices;
- whether a heuristic is acceptable for personal use;
- release from shadow mode to silent application.

### Runtime system

The runtime uses deterministic interpreters, versioned models, validators and authorised adapters. It does not depend on an LLM being available.

---

## 13. Final objective

The finished system will not be a chatbot that gives generic advice.

It will be a personalised, non-LLM adaptive control system that:

1. observes the five systems;
2. estimates the current whole-athlete state;
3. learns individual responses over time;
4. recognises support and interference between domains;
5. chooses one bounded action;
6. explains and records the decision;
7. applies it silently through authorised adapters;
8. improves only through validated evidence and observed outcomes.

The 5–15 million-line corpus is the research foundation. The real product is the verified chain from evidence to safe, tested behaviour.
