# THE Hybrid System — Research Depth Scope

**Scope:** Strength, Conditioning, Nutrition, Recovery, and Coordinator/control  
**Purpose:** Define how much research is required, how it must be structured, and what evidence is sufficient at each activation stage  
**Boundary:** This document scopes the research programme. It does not perform or approve scientific research.  
**Runtime constraint:** Athlete-facing decisions remain deterministic, non-LLM, versioned, bounded, replayable, and fail-closed.

## Executive decision

THE Hybrid System does not need “millions of lines” before it can become useful. It needs a complete, reviewable evidence chain for each decision it is allowed to make.

The useful unit of progress is not a line of text. It is a **decision-covered evidence chain**:

```text
Decision question
→ search protocol
→ immutable primary sources
→ reproducible observations
→ atomic claims
→ contradiction-aware synthesis
→ applicability decision
→ owned product policy
→ tested rule/model
→ offline validation
→ shadow evidence
→ bounded activation
```

The programme should therefore have two depth targets:

1. **Activation-grade portfolio:** enough verified evidence to support a deliberately small set of bounded decisions across all five systems.
2. **Mature research platform:** a continuously updated knowledge base that covers important populations, modalities, edge cases, interactions, measurement methods, and uncertainty.

The current package is at the **pre-research gate**. Engineering can continue building storage, search, review, promotion, deterministic execution, abstention, receipts, and replay. Scientific research begins when the first source is appraised or the first claim is considered for promotion.

## Current baseline

The package already has useful breadth but almost no activation-grade evidence.

| Asset | Current count | Research meaning |
|---|---:|---|
| Archived source records | 328 | All are machine-classified and require human review |
| Byte-verified source entries | 318 | File identity is known; scientific validity is not |
| External citation rows | 1,199 | All began as corpus citations, not independent verification |
| Unique external locator IDs | 1,097 | Candidate discovery inventory |
| Abstract-level source checks | 4 | Full-text extraction and applicability remain pending |
| Candidate claims | 86 | 74 unverified; 12 unsupported/rejected; concentrated in Strength and cross-system material |
| Structured observations | 19 | All unverified and currently Nutrition-derived |
| Formula candidates | 44 | 11 malformed/column-shifted; 33 structurally usable but unverified |
| Provisional metrics | 32 | Definitions exist but are not yet scientifically governed |
| Contradiction/qualification records | 15 | Several remain open or only architecturally resolved |
| Candidate rules | 7 | All non-executable and Nutrition-focused |
| Registered models | 0 | Correct pre-research posture |

Coverage is asymmetric:

- **Strength:** strongest explicit claim/formula coverage, but independent verification and population/method extraction are absent.
- **Conditioning:** meaningful modality and device material, but no comparable canonical evidence set or validated dose-response layer.
- **Nutrition:** strongest implementation-oriented research pack, but many equations and behaviours are inferred, prototype, or product-specific.
- **Recovery:** broad AI-authored synthesis but weak primary provenance, measurement protocols, and structured observations.
- **Coordinator:** architecture and policy concepts exist, but arbitration objectives, precedence, interaction effects, and validation data are not evidence-complete.

The current archive is a strong **discovery corpus**, not a verified scientific corpus.

## What “deep enough” means

Research is deep enough for a decision only when all six dimensions below are adequate.

| Dimension | Required answer |
|---|---|
| Decision coverage | Exactly what action may change, by how much, and on what cadence? |
| Evidence strength | What source designs directly support the relationship or boundary? |
| Measurement validity | Are the input and outcome measures reliable enough for this use? |
| Applicability | Does the evidence apply to this athlete, modality, goal, sex, age, training status, and context? |
| Uncertainty and conflict | What is unknown, heterogeneous, contradicted, or not measurable? |
| Operational proof | Can the rule/model abstain, replay, survive edge cases, and remain inside product and safety locks? |

A large corpus that cannot answer those questions is not deep. A smaller corpus with exact provenance and decision coverage can be.

## Core research questions

Every question must be registered before searching with population, intervention/exposure, comparator, outcome, context, time horizon, and intended product use. Questions should be split whenever one answer would produce more than one materially different rule.

### Strength system

The Strength programme must establish when the system may maintain, progress, regress, or abstain for a specific exercise exposure without pretending that one global strength score represents all movements.

Priority questions:

1. How do load, repetitions, sets, proximity to failure, frequency, and exercise selection affect strength and hypertrophy outcomes by training status and movement class?
2. Which within-session and between-session performance signals are sufficiently reliable to justify a load, repetition, effort, or volume change?
3. How accurate and reliable are RPE/RIR judgements, and how should their uncertainty change with exercise, repetition range, proximity to failure, and experience?
4. How should estimated 1RM methods be selected and bounded by exercise, loading range, repetitions, and technique consistency?
5. What constitutes a meaningful performance change rather than ordinary measurement error?
6. What evidence supports progression increments, double progression, rep-range progression, set progression, or maintaining after ambiguous exposures?
7. What evidence supports deload, re-entry, training-gap, repeated underperformance, and exercise-substitution policies?
8. How do fatigue and interference differ for heavy lower-body work, explosive work, hypertrophy work, and isolation work?
9. What is known about minimum effective, productive, and excessive volume, and what remains coaching terminology rather than validated thresholds?
10. Which safety-related outputs can be non-diagnostic and action-scoped? The locked product behaviour remains: pain may hold Strength autopilot load increases only; it does not automatically block training.
11. How do sex, age, training history, energy status, exercise familiarity, equipment, and disability alter applicability?
12. Which public MacroFactor Workout and RP Hypertrophy behaviours are documented, which can be independently observed, and which remain private or historically described?

Required output families:

- exercise-specific performance and reliability observations;
- dose-response observations for load, volume, frequency, effort, and rest;
- progression and regression candidate claims;
- measurement-error and minimum-detectable-change records;
- population and modality applicability maps;
- product-behaviour records separated from scientific claims;
- explicit unknowns for proprietary estimators and rule tables.

### Conditioning system

The Conditioning programme must avoid collapsing all modalities into heart-rate zones or one fatigue number.

Priority questions:

1. How do frequency, duration, intensity, interval structure, and progression affect aerobic capacity, threshold, endurance performance, health, and adherence?
2. When do polarized, pyramidal, threshold-heavy, low-intensity, or mixed distributions apply, and to which athlete populations and goals?
3. How should intensity be prescribed and interpreted using power, pace, speed, heart rate, lactate, perceived effort, talk test, or ventilatory markers?
4. What are the validity, reliability, lag, dropout, and environmental limitations of each measurement method and device class?
5. How should load and progress be represented separately for cycling, rowing, running, walking, circuits, and other modalities?
6. What constitutes a meaningful change in pace, power, heart-rate response, interval completion, or repeatability?
7. What recovery intervals and progression patterns are supported for low-, moderate-, threshold-, and high-intensity sessions?
8. Under what conditions does conditioning interfere with strength, hypertrophy, or explosive performance? Examine modality, sequence, separation, weekly volume, intensity, muscle group, and training status.
9. How do occupational activity, steps, heat, humidity, altitude, illness records, and fuelling context alter interpretation without creating invented calorie or fatigue conversions?
10. What evidence supports HRV-guided endurance adjustment, and what protocol dependencies prevent HRV from becoming a universal gate?
11. How should incomplete heart-rate, power, GPS, or device data change confidence and abstention?
12. Which Concept2, FTMS, Echo, WHOOP, and other vendor behaviours are official contracts, observed behaviour, or proprietary scoring?

Required output families:

- modality-specific dose-response matrices;
- measurement validity and error tables;
- intensity-classification mappings with incompatibility warnings;
- interference observations linked to Strength decisions;
- environment and occupational-context modifiers;
- device/product behaviour records with software/firmware version and expiry.

### Nutrition system

The Nutrition programme must distinguish expenditure estimation, intake measurement, goal policy, performance fuelling, and clinical safety.

Priority questions:

1. Which resting-energy and total-energy-expenditure methods are valid for the target athlete, and what error should be expected at individual level?
2. How accurately can energy expenditure be inferred from body-mass trend and logged intake under realistic fluid, glycogen, creatine, menstrual, gastrointestinal, and missing-data noise?
3. Which trend filters, observation windows, and update cadences are defensible for a personal estimator? Proprietary competitor coefficients must not be guessed.
4. How should complete, partial, intentionally fasted, and missing nutrition days be represented and weighted?
5. How large and systematic are self-report and database errors, and which quality indicators improve or degrade inference?
6. What protein dose, distribution, quality, and timing evidence applies by body size, goal, energy restriction, age, and training type?
7. What carbohydrate availability and timing evidence applies to strength, high-intensity conditioning, endurance volume, and mixed training?
8. What minimum fat, fibre, hydration, sodium, and micronutrient policies are scientific findings, population guidance, or product guardrails?
9. What goal-rate ranges are supported for loss, maintenance, recomp, and gain, and what are their uncertainties and applicability limits?
10. How should low-energy-availability and RED-S evidence be represented as non-diagnostic screening/referral context rather than a universal automated threshold?
11. How should nutrition support or constrain same-day and next-day Strength and Conditioning candidates?
12. Which MacroFactor behaviours and formulas are public and current, which are inferred from examples, and which production details remain undisclosed?

Required output families:

- equation validation by population;
- intake and weight measurement-error observations;
- time-series estimator evaluation datasets;
- nutrient target and timing syntheses;
- goal-rate and safety-boundary policies;
- product behaviour/version records;
- explicit proprietary unknowns.

### Recovery system

The Recovery programme must model observations and context, not manufacture a medically authoritative “readiness score.”

Priority questions:

1. How do sleep duration, regularity, timing, fragmentation, and measurement method relate to next-day and accumulated performance outcomes?
2. What are the validity and reliability limits of consumer sleep staging, total sleep time, resting heart rate, respiratory rate, skin temperature, and HRV?
3. Which HRV protocols—metric, posture, timing, duration, device, artifact correction, baseline, and smallest worthwhile change—are sufficiently reproducible for advisory use?
4. How do subjective fatigue, soreness, stress, energy, motivation, and perceived recovery perform alone and alongside objective measures?
5. What time courses follow resistance training, endurance training, eccentric loading, heat exposure, travel, shift work, and physical occupations?
6. How should missing, stale, conflicting, or protocol-incompatible recovery data alter state estimation?
7. Are composite readiness scores more useful than a vector of domain-specific observations, and under what validation conditions?
8. What non-diagnostic pain, illness, cardiopulmonary, neurological, heat, and return-to-training pathways require qualified clinical ownership?
9. Which recovery interventions have credible effects, for which outcomes and populations, and with what risk of bias?
10. How should Recovery constrain specific actions without selecting exercises, diagnosing conditions, or clearing risk based on HRV?
11. How should baselines adapt to a single athlete while protecting against drift, sensor changes, and acute outliers?
12. Which WHOOP or other wearable fields are raw measurements, vendor interpretations, or undisclosed proprietary scores?

Required output families:

- measurement protocol and validity records;
- within-person reliability and baseline-method observations;
- recovery time-course syntheses;
- missingness/staleness rules;
- action-scoped constraint candidates;
- clinical-boundary policies owned outside the model;
- vendor field provenance and proprietary boundaries.

### Coordinator and multi-model control

The Coordinator programme is both an evidence-synthesis problem and an engineering/control validation programme. Sports science alone cannot select the product’s trade-offs.

Priority questions:

1. What exact structured outputs must each domain publish, and which fields are observed, derived, estimated, missing, or stale?
2. Which cross-system relationships are sufficiently supported to become interference or support tags rather than free-form narratives?
3. How should Strength–Conditioning interactions vary by modality, muscle group, sequence, separation, dose, and goal priority?
4. How should Nutrition context influence feasible training candidates without diagnosing energy deficiency or converting uncertainty into false precision?
5. How should Recovery context modify confidence, candidate bounds, or progression while respecting the locked pain, illness, and HRV policies?
6. Which constraints are scientific, clinical, legal, user-controlled, or product-policy constraints, and who owns each?
7. What precedence resolves conflicts among safety, invalid data, user locks, schedule, equipment, goal priority, plan continuity, and domain recommendations?
8. Can v1 use lexicographic and decision-table arbitration rather than unsupported weighted optimization?
9. If weighted or learned optimization is later proposed, what outcomes, counterfactuals, constraints, and calibration data identify its parameters?
10. What missingness, staleness, uncertainty, and incompatibility conditions require abstention or minimum-change behaviour?
11. How will offline, shadow, and bounded personal validation detect harmful interference, instability, oscillation, or systematic undertraining?
12. What receipt, replay, rollback, and revocation evidence is required to prove that the same immutable inputs produce the same result?

Required output families:

- five-system metric and event contracts;
- support/interference evidence graph;
- owned precedence and feasible-set policies;
- conflict scenario catalogue;
- deterministic arbitration test corpus;
- model-identification and personal-calibration protocol;
- stability, rollback, and monitoring criteria.

## Evidence source hierarchy

Source quality depends on the question. Official product documentation is authoritative for documented product behaviour but not for physiology. A systematic review is useful for effect synthesis but cannot replace a device-validation study or exact software contract.

### Scientific and measurement questions

Use this order:

1. **Primary standards and authoritative methods:** measurement standards, consensus definitions, official reference methods, validated clinical instruments.
2. **Systematic reviews/meta-analyses with inspectable methods:** use for landscape and heterogeneity; inspect included studies rather than copying conclusions.
3. **Direct primary studies:** randomized trials for interventions; prospective/cohort studies for prediction and time course; criterion-validity and reliability studies for measurements; model-development and external-validation studies for estimators.
4. **Position stands and consensus statements:** useful for boundaries and practice interpretation; retain evidence grade and conflicts of interest.
5. **Mechanistic and laboratory studies:** useful to explain plausibility; insufficient alone for broad athlete-facing rules.
6. **Adjacent-population evidence:** allowed only with explicit indirectness and narrower activation bounds.
7. **Expert reviews, textbooks, coaching frameworks:** discovery and policy context; not independent proof of algorithmic thresholds.
8. **Blogs, forums, social posts, snippets, and AI summaries:** discovery only.

### Product-behaviour questions

Use this order:

1. Current official API/schema/export documentation and versioned release notes.
2. Current official help-centre or product documentation.
3. Reproducible controlled observations from a lawful test account/device, with app/firmware version and input/output fixture.
4. Official staff statements tied to a date and product version.
5. Archived official pages for historical behaviour.
6. Community observations and third-party code for hypothesis generation only.

Terms of service, patents, trademarks, and public repositories define legal and historical context. They do not prove the current production algorithm.

### Engineering and control questions

Use standards, primary control/decision research, formal methods, safety engineering, reproducibility literature, and internally generated validation results. Product policy is not “proven” by literature; it must be explicitly owned and tested.

## Systematic search protocol

Each decision question receives its own versioned protocol. Broad one-query searches are not acceptable for promotion-grade work.

### 1. Register the question

Record:

- question ID and system(s);
- exact decision the answer may influence;
- population, intervention/exposure, comparator, outcomes, setting, and time horizon;
- measurement methods and acceptable proxies;
- required source designs;
- exclusions;
- date limits and languages;
- planned subgroup and applicability fields;
- safety class and intended maximum activation stage;
- reviewer assignments and conflicts of interest.

### 2. Search multiple source classes

At minimum:

- PubMed/MEDLINE for biomedical and sport-science evidence;
- SPORTDiscus or an equivalent sport/exercise index where accessible;
- Crossref/DOI and citation chasing for identity and linked literature;
- Cochrane and relevant guideline/consensus bodies for intervention/safety topics;
- IEEE/ACM or control/engineering indexes for Coordinator methods where relevant;
- official vendor/product documentation for behaviour and data contracts;
- trial registries, corrections, retractions, and supplementary material for high-impact claims.

Searches must include controlled vocabulary where available, free-text synonyms, measurement names, modality names, and population terms. Store exact query strings, database, interface, date, result count, and export hash.

### 3. Deduplicate by work and occurrence

Maintain one canonical work identity while preserving every occurrence path, version, correction, supplement, and archive location. DOI/PMID alone is not sufficient when versions differ.

### 4. Two-stage screening

- Title/abstract screening against registered criteria.
- Full-text eligibility screening with explicit exclusion reasons.

High-risk questions require two independent screeners. Lower-risk questions may use one screener plus independent audit of a random sample. LLM ranking may prioritize work but cannot exclude the last copy of a source or determine eligibility without human verification.

### 5. Retrieve and freeze exact sources

Store lawful full text when permitted; otherwise store immutable metadata, locator, retrieval date, and content hash for accessible material. Capture supplements, protocols, corrections, retractions, and registration records.

### 6. Extract reproducible observations

Use dual extraction for decision-critical numbers and safety evidence. Resolve disagreement before synthesis. A reviewer must be able to reproduce the value from the cited page/table/row/figure.

### 7. Appraise study design and measurement

Use design-appropriate risk-of-bias and quality tools. Record judgments at domain level; do not reduce them to an unexplained single score. Separately appraise measurement validity, missingness, adherence, multiplicity, model overfitting, and external validation.

### 8. Synthesize without forced pooling

Stratify by population, intervention, modality, measurement, outcome definition, and time horizon. Meta-analysis is appropriate only when pooling is scientifically coherent. Otherwise use structured narrative synthesis and retain incompatible estimates separately.

### 9. Grade certainty for the intended use

Certainty must be attached to a precise claim and product use—not to a paper. Record risk of bias, inconsistency, indirectness, imprecision, publication bias, measurement validity, and applicability.

### 10. Search for disconfirmation

Run explicit contradiction searches: null findings, harms, measurement failures, retractions, critiques, unsuccessful validations, and different populations. A research lane is incomplete if it only confirms the preferred design.

### 11. Freeze a synthesis snapshot

Every promotion decision references a frozen search/synthesis version. New evidence creates a new version and can trigger downstream suspension; it never silently rewrites history.

## Structured extraction target

The platform should optimize for small, exact records rather than prose accumulation.

### Minimum source record

- canonical work and version identity;
- title, authors/organization, year, journal/vendor;
- DOI, PMID, registration, URL, and retrieval date as applicable;
- source type and study design;
- full-text or metadata hash;
- correction/retraction state;
- licence/storage status;
- product/software/firmware version for behaviour records;
- discovery path and verification state.

### Minimum study/population record

- design, setting, recruitment, sample size, attrition;
- age, sex/gender reporting, training status, sport, modality, health status;
- baseline performance and relevant body-size variables;
- inclusion/exclusion criteria;
- intervention/exposure and comparator details;
- duration, frequency, adherence, co-interventions;
- funding and conflicts of interest;
- risk-of-bias judgments.

### Minimum observation record

- exact source location and quote/table-cell hash;
- canonical metric ID and original wording;
- value, unit, numerator, denominator, time basis;
- effect measure and direction;
- uncertainty interval, standard error/deviation, and sample size;
- outcome timing and measurement method/device;
- subgroup/population ID;
- intervention, comparator, and exposure dose;
- analysis set and adjustment variables;
- transformation history and extractor identity;
- missing/not-reported/not-applicable state;
- independent verification state.

Multi-number prose must be split into atomic observations. A result such as an effect estimate plus confidence interval and subgroup count cannot remain one unsearchable string.

### Minimum claim record

- one falsifiable proposition;
- intended population, context, outcome, direction, and time horizon;
- linked verified observations and sources;
- supporting, opposing, qualifying, and duplicate edges;
- certainty for this use;
- limitations and applicability boundary;
- reviewer decisions and unresolved disagreement;
- permitted product use and maximum activation stage.

### Minimum formula/model record

- mathematical expression and variable dictionary;
- canonical units and dimensional checks;
- derivation or training dataset;
- population and measurement boundaries;
- coefficient uncertainty and validity domain;
- missing-data and out-of-range behaviour;
- implementation hash and parameter-set hash;
- verification fixtures and error metrics;
- prohibited uses;
- owner, review date, rollback target, and lifecycle state.

## Population and applicability standards

Evidence does not automatically apply because participants were “healthy adults.” Each synthesis must compare the research population with the intended athlete and decision context.

Required applicability dimensions:

- age and life stage;
- sex/gender and menstrual/reproductive context where relevant;
- training status and years of experience;
- strength, endurance, or hybrid background;
- sport and movement/modality;
- goal: performance, hypertrophy, weight change, health, or return-to-training;
- health exclusions, medication, injury, eating-disorder or clinical context;
- environment: heat, altitude, occupation, travel, shift work;
- equipment, device, protocol, and software version;
- nutritional state and energy balance;
- intervention dose, duration, supervision, and adherence;
- outcome definition and measurement error.

Applicability outcomes:

- `direct`: population, measurement, dose, and context are materially aligned;
- `bounded_indirect`: some differences exist; rule must use narrower bounds or lower authority;
- `discovery_only`: evidence can motivate a question but not activation;
- `not_applicable`: incompatible population, method, or outcome;
- `clinical_review_required`: use exceeds the app’s non-diagnostic authority.

No subgroup absence may be interpreted as subgroup equivalence. If evidence is sparse for the athlete’s relevant context, the runtime should maintain, use a product-owned conservative default, request input, or abstain—never invent certainty.

## Contradiction handling

Contradictions must remain first-class graph records. They are not resolved by majority vote or averaging.

For every material disagreement, compare:

1. whether the claims are actually about the same question;
2. population, modality, training status, and baseline differences;
3. intervention dose, timing, adherence, and comparator;
4. outcome definition, measurement method, and follow-up;
5. study design, bias, precision, and analysis choices;
6. source independence and overlapping samples;
7. publication date, correction, retraction, and supersession;
8. conflicts of interest and selective reporting;
9. whether disagreement changes the proposed action.

Allowed dispositions:

- compatible after stratification;
- one source superseded or retracted;
- one claim too broad and narrowed;
- evidence genuinely inconsistent;
- product policy chooses a conservative bound despite scientific uncertainty;
- no action permitted pending more evidence.

Any unresolved contradiction that could materially change direction, magnitude, safety, or population applicability blocks rule/model promotion beyond offline experimentation.

## Product-behaviour verification

MacroFactor, RP, WHOOP, Concept2, device firmware, and similar products must be researched on a separate track from physiology.

Each behaviour record must be labelled as one of:

- `official_current_documentation`;
- `official_historical_documentation`;
- `controlled_observation`;
- `public_framework_not_exact_current_implementation`;
- `independent_approximation`;
- `inferred_low_confidence`;
- `proprietary_unknown`.

Verification requirements:

- app/service/device version and observation date;
- exact official page, release note, export field, or reproducible test fixture;
- starting state, input actions, output, and repeatability for observations;
- region, subscription tier, platform, equipment, and firmware where relevant;
- explicit expiry/recheck trigger after product updates;
- separation between copying a user-visible behaviour and claiming the hidden algorithm.

Community code, screenshots, anecdotes, and patents may identify hypotheses or historical concepts. They cannot prove the current production implementation.

## Proprietary-algorithm boundary

The programme should not waste years trying to recover what public evidence cannot reveal.

For each external product, maintain three layers:

1. **Documented public rule:** can be cited and implemented if legally and technically appropriate.
2. **Observable input/output behaviour:** can inform independent design only when testing is lawful, reproducible, versioned, and within applicable terms.
3. **Undisclosed implementation:** coefficients, filters, ranking tables, model weights, source code, and internal states remain unknown.

The stopping rule is simple: after official documentation, release history, public technical material, lawful controlled observations, patent/repository review, and targeted expert statements are exhausted, mark the remainder `proprietary_unknown`. Build an independently justified model; do not call it an exact clone.

Reverse-engineering restrictions and licences must be respected. No runtime artifact may depend on unverifiable assumptions about a competitor’s private implementation.

## Quantitative coverage targets

Counts are workload and coverage controls, not proof of quality. No source quota can override relevance or rigor.

### Target A — activation-grade portfolio

This is the realistic first research product: enough evidence to test a narrow, bounded decision path in every system.

| System | Registered decision questions | Fully reviewed sources | Verified atomic observations | Adjudicated claims | Frozen syntheses | Candidate rules/policies |
|---|---:|---:|---:|---:|---:|---:|
| Strength | 20–30 | 80–150 | 300–700 | 60–120 | 15–25 | 10–20 |
| Conditioning | 20–30 | 80–150 | 300–700 | 60–120 | 15–25 | 10–20 |
| Nutrition | 25–35 | 100–180 | 400–900 | 75–140 | 18–30 | 12–25 |
| Recovery | 25–35 | 100–180 | 400–900 | 75–140 | 18–30 | 10–20 |
| Coordinator/control | 25–40 | 80–150 external/internal validation sources | 250–600 evidence or simulation observations | 75–150 | 20–35 | 15–30 policies/rules |
| **Total** | **115–170** | **440–810** | **1,650–3,800** | **345–670** | **86–145** | **57–115** |

These are portfolio targets. A narrow rule can proceed with fewer sources when evidence is direct and consistent; a contentious or high-risk rule may require far more or may remain unactivatable.

Before any limited activation, the relevant decision path—not merely the system total—must have complete lineage, contradiction closure, applicability review, tests, and validation.

### Target B — mature personal research platform

| Asset | Mature target | Quality condition |
|---|---:|---|
| Registered decision questions | 300–600 | Prioritized and versioned; no orphan topics |
| Unique screened works | 10,000–30,000 | Includes exclusions and search provenance |
| Full-text included sources | 2,500–6,000 | Relevant, deduplicated, legally stored or precisely located |
| Verified observations | 15,000–40,000 | Atomic, unit-safe, population-linked, reproducible |
| Adjudicated claims | 1,500–4,000 | Support/opposition/applicability graph complete |
| Frozen syntheses | 250–600 | Decision-linked and updateable |
| Product-behaviour fixtures | 200–800 | Versioned and reproducible |
| Conflict scenarios | 500–2,000 | Includes missing, stale, extreme, and cross-system cases |
| Released deterministic rules/policies | 100–300 | Only where evidence and ownership permit |
| Personally calibrated parameters | As few as identifiable | Every parameter bounded, monitored, and reversible |

This is already an unusually deep personal evidence product. Growing beyond it should be driven by unresolved decisions, new modalities, new populations, changing products, or model error—not prestige.

## Translating “millions of lines” into useful volume

Five to fifteen million extracted text lines could be created by duplicating PDFs, OCR, reference lists, code, and AI summaries. That would increase storage while reducing trust.

If the ambition is retained, classify volume explicitly:

| Layer | Possible scale | Runtime authority |
|---|---:|---|
| Raw/OCR/search text | 5–15 million lines | None |
| Deduplicated immutable chunks | 500,000–2,000,000 | Discovery only |
| Candidate machine extractions | 100,000–500,000 records | Untrusted |
| Human-verified observations | 15,000–40,000 records | Evidence input |
| Adjudicated claims | 1,500–4,000 records | Synthesis input |
| Approved policies/rules | 100–300 records | Runtime eligible after validation |
| Active personal models | Small versioned set | Runtime authority inside hard constraints |

At roughly 0.5–1.5 GB of normalized plain text, 5–15 million short lines are not technically impressive. The expensive part is review. For example, 25,000 decision-critical observations at 10–20 minutes for dual extraction and resolution represents roughly 8,000–17,000 reviewer-hours. Scope must therefore prioritize **evidence yield per review hour**.

Primary success metrics:

- percentage of active decisions with complete source-to-receipt lineage;
- verified-observation yield per included source;
- percentage of decision-critical observations independently reproduced;
- unresolved material contradiction rate;
- applicability coverage for the target athlete/context;
- proportion of candidate rules that abstain correctly under missing/stale inputs;
- shadow error, override, rollback, and instability rates;
- update latency for retractions, product changes, and high-impact new evidence.

Line count should appear only as a storage statistic.

## Review staffing and independence

A credible programme cannot rely on one AI system marking its own extraction correct.

### Minimum roles

- **Research programme owner:** question priority, protocol control, scope changes, and final portfolio accountability.
- **Domain reviewers:** Strength, Conditioning, Nutrition, and Recovery expertise; one person may cover adjacent domains but must declare competence limits.
- **Methods reviewer:** study design, statistics, measurement, risk of bias, synthesis, and model validation.
- **Clinical/safety reviewer:** qualified ownership for pain, illness, RED-S/low-energy-availability, cardiopulmonary, neurological, heat, contraindication, and referral pathways.
- **Product-policy owner:** decides preferences and trade-offs that science cannot determine.
- **Engineering/control reviewer:** deterministic contracts, optimization, receipts, replay, rollback, and runtime isolation.
- **Independent extractor/adjudicator:** verifies decision-critical source locations and resolves disagreements.

### Independence rules

- Decision-critical observations and all safety-related observations require two independent extractions or one extraction plus blinded reproduction.
- Claim promotion requires a reviewer who did not author the original AI synthesis.
- The same person may not be the sole source extractor, policy owner, rule implementer, and activation approver.
- Clinical/safety material requires appropriately qualified review; AI output and general coaching expertise are insufficient.
- Conflicts of interest, vendor relationships, and prior authorship must be recorded.
- Disagreements remain visible. Adjudication creates a new signed decision; it does not erase reviewer records.

### Realistic solo-project model

For a personal app, maintain rigor by concentrating external review where consequences are highest:

- use AI for discovery, deduplication, candidate extraction, and schema checks;
- personally verify every promoted source location;
- commission independent methods review for the first rule pack and every material model redesign;
- obtain clinical review only for safety/referral policies, not ordinary training preferences;
- dual-review a risk-stratified sample of lower-risk observations and 100% of decision-critical/high-risk observations;
- keep the initial active action space narrow enough that review remains affordable.

## Priority waves

### Wave 0 — protocol and corpus repair

Complete before scientific promotion:

- repair or quarantine the 11 malformed formula records;
- resolve or formally abandon the 10 missing source-byte paths;
- establish controlled taxonomies for study design, populations, metrics, outcomes, status, and source type;
- register reviewer identities, roles, conflicts, and transition permissions;
- freeze question, search, extraction, appraisal, synthesis, and applicability templates;
- separate raw, reviewed, and runtime-eligible search views;
- make retraction and revocation cascade tests mandatory.

### Wave 1 — safety boundaries and measurement validity

Research what determines whether inputs can be trusted and what the app must never infer:

- load, RIR/RPE, e1RM, pace, power, HR, HRV, sleep, body mass, and food-log measurement validity;
- missingness, staleness, protocol compatibility, and minimum detectable change;
- pain/illness/HRV locked behaviour;
- low-energy-availability/RED-S, cardiopulmonary, neurological, heat, and return-to-training clinical ownership;
- device and vendor raw-versus-derived field boundaries.

This wave should produce conservative abstention and confidence rules before performance optimization.

### Wave 2 — one bounded decision path per system

Select deliberately narrow paths, for example:

- Strength: evidence interpretation for maintaining versus proposing a bounded next-exposure progression on one familiar exercise class;
- Conditioning: maintaining versus bounded duration/intensity progression for one device-measured modality;
- Nutrition: holding versus bounded target review under sufficiently complete intake and weight data;
- Recovery: data-quality and advisory context vector without a universal readiness score;
- Coordinator: deterministic conflict resolution using owned precedence and specialist-approved variants.

These are examples of scope shape, not pre-approved scientific rules. Research determines whether each path is supportable.

### Wave 3 — cross-system interactions

Build the support/interference graph:

- modality- and muscle-specific concurrent training;
- same-day and between-day sequencing;
- fuelling and energy-balance context;
- sleep, soreness, occupational work, heat, and schedule constraints;
- plan continuity, minimum-change fallback, and abstention.

Do not introduce a universal “fatigue budget” unless a defined, validated construct and personal calibration dataset support it.

### Wave 4 — personal model identification

Only after stable deterministic baselines exist:

- define outcomes and observation windows before fitting;
- estimate personal baselines and response relationships;
- use bounded parameters with priors from applicable evidence;
- protect against regression to the mean, confounding, sensor changes, and non-stationarity;
- compare against simple baselines;
- run shadow and rollback tests;
- activate one parameter family at a time.

### Wave 5 — breadth and edge cases

Expand modalities, exercise classes, goals, environments, life stages, devices, travel, shift work, illness recovery, and rare conflicts only in response to an explicit decision gap or observed model failure.

## Stopping rules

Research cannot prove universal truth. Each lane needs explicit stop conditions.

### Stop a search/synthesis cycle when

- all registered databases and citation-chasing steps are complete and reproducible;
- inclusion decisions are resolved;
- required source-design classes have been sought;
- recent updates add no material new claim, subgroup, harm, or measurement limitation after two consecutive update cycles;
- effect and uncertainty conclusions are stable enough for the intended bounded use—or are clearly too uncertain to activate;
- all material contradictions have a recorded disposition;
- the target population and measurement method have an explicit applicability decision;
- further review is unlikely to change the maximum permitted activation stage.

This is saturation for a decision, not “all literature ever published.”

### Stop proprietary investigation when

- current and archived official documentation, release notes, public technical material, lawful observations, patents, repositories, and targeted statements have been exhausted;
- no reproducible source reveals the missing coefficient/rule;
- terms/licensing create a boundary; or
- the hidden detail is unnecessary for an independently justified design.

Mark the gap `proprietary_unknown`; do not keep searching indefinitely.

### Stop or suspend a candidate rule/model when

- evidence is too indirect or imprecise for its proposed action;
- material contradiction remains unresolved;
- input measurement error exceeds the expected decision effect;
- the target athlete falls outside applicability bounds;
- no stable outcome can validate the parameter;
- shadow results show instability, unsafe edge cases, systematic overrides, or no improvement over a simpler baseline;
- required clinical or policy ownership is unavailable.

The correct endpoint may be abstention, a non-adaptive product default, or a request for better data.

## Update cadence

| Evidence area | Surveillance | Formal review trigger |
|---|---|---|
| Clinical/safety boundaries | Monthly alerts | Immediate on guideline/consensus change, retraction, or serious safety signal; formal quarterly review |
| Measurement/device validity | Quarterly | New device/firmware/protocol, sensor change, or detected drift |
| Strength/conditioning/nutrition/recovery syntheses | Quarterly alerts | Formal annual refresh or earlier if a material study changes direction, magnitude, or applicability |
| Product behaviour | Release-note and documentation change monitoring | Re-verify on app/API/firmware update or fixture failure |
| Coordinator policies | Quarterly | Goal/product-lock change, new domain contract, unresolved conflict class, or override pattern |
| Personal calibration | Rolling monitoring | Refit only on preregistered cadence with sufficient new data; reset/review after sensor, goal, health, or routine change |
| Full rule/model pack | Continuous monitoring | Scheduled quarterly review; immediate suspension on failed safety, replay, provenance, or drift gate |

Every update creates a new evidence snapshot and model/rule version. It must never mutate the evidence behind historical receipts.

## Evidence thresholds by activation stage

Stages apply per decision path. A strong Strength rule does not authorize unrelated Recovery or Nutrition logic.

### Draft

Permitted: hypothesis, schema design, synthetic fixtures, candidate formula, and non-authoritative prototype.

Required:

- registered decision question and intended action;
- at least one identifiable source or explicit product-policy origin;
- all assumptions and proprietary unknowns labelled;
- no athlete-facing output and no use of `verified` or `active` status;
- LLM/machine extraction retained as untrusted.

### Offline experimental

Permitted: deterministic execution on synthetic, historical, or held-out data; no athlete-facing application.

Required:

- exact source identities and full-text review for every scientific dependency;
- reproducible observations with units, population, method, and uncertainty;
- atomic claims with design-appropriate appraisal;
- applicability judgment for the intended dataset;
- contradictions recorded, with material unresolved conflict blocking claims of support;
- owned policy separated from evidence;
- complete I/O, missing-data, bounds, abstention, and prohibited-use contract;
- independently hashed artifact and parameters;
- passing deterministic, safety, provenance, tamper, replay, extreme-input, and baseline-comparison tests.

### Shadow

Permitted: generate decisions beside the real workflow, but never apply them.

Required:

- offline requirements complete;
- independent methods review and domain review;
- no material unresolved contradiction for the proposed use;
- frozen evidence and validation datasets;
- predefined outcomes, error metrics, subgroup/applicability checks, instability limits, and failure thresholds;
- comparison with current deterministic baseline or no-change policy;
- decision receipts, replay, revocation, monitoring, and rollback demonstrated;
- enough representative cases to exercise normal, missing, stale, conflicting, and extreme states;
- safety-related paths reviewed by a qualified owner.

### Limited personal activation

Permitted: bounded use for the single owner-athlete, one action family at a time, with immediate rollback.

Required:

- shadow success against preregistered acceptance criteria;
- prospective evidence that the candidate is at least no worse than the simpler baseline on safety and plan stability;
- applicability explicitly limited to this athlete, current goal, equipment, measurement protocol, and context;
- maximum change per decision, cooldown, rollback, and manual override defined;
- model cannot bypass hard validators or locked product behaviour;
- one parameter/rule family activated at a time;
- daily receipt and anomaly monitoring during the initial activation window;
- automatic suspension on provenance failure, stale/invalid critical data, replay mismatch, unexpected action, excessive oscillation, or safety trigger.

### Broader or silent activation

This is outside the immediate personal-app scope. It would require larger prospective validation, subgroup/fairness analysis, privacy/security/regulatory review, clinical governance where relevant, operational incident response, and independent release approval. Personal success does not establish general population validity.

## Minimum release portfolio

The first credible integrated release should not attempt to optimize everything. It should prove that the five-system chain works safely.

Minimum portfolio requirements:

1. At least one narrow, evidence-complete candidate decision path for each system.
2. One owned five-system precedence table and deterministic conflict resolver.
3. Measurement validity and missingness rules for every decision-critical input.
4. At least 100 reviewed cross-system scenarios spanning support, interference, missingness, stale data, conflicting proposals, schedule limits, pain, illness records, HRV disagreement, heat, physical work, and nutrition uncertainty.
5. Zero unexplained active coefficients or thresholds.
6. Zero runtime dependencies on raw research, web search, Gemini, or another LLM.
7. Complete source-to-receipt lineage and byte-equivalent replay for every shadow decision.
8. A simpler no-change/maintain baseline that every adaptive candidate must beat or match on declared outcomes.

## Programme risks

| Risk | Consequence | Control |
|---|---|---|
| Counting prose instead of evidence | False sense of completion | Measure verified observations, claims, syntheses, and decision coverage |
| AI circular citation | Generated summaries validate one another | Verify original sources and exact locations; AI never approves |
| Strength/Nutrition bias | Recovery and Coordinator remain weak | Allocate Wave 1/2 quotas to missing domains |
| Product clone obsession | Endless search for unknowable coefficients | Enforce `proprietary_unknown` stopping rule |
| Overfitting to one athlete | Fragile personal rules | Bounded parameters, simple baselines, shadow tests, drift monitoring |
| Universal readiness/fatigue score | False physiological certainty | Preserve state vector and measurement uncertainty |
| Research-policy confusion | Preferences appear scientific | Separate evidence claims from owned product policy |
| Paper-count thresholds | Low-quality evidence satisfies quota | Gate on directness, reproducibility, certainty, and intended use |
| Review bottleneck | Millions of candidates never become trusted | Risk-based prioritization and narrow activation portfolio |
| Silent evidence drift | Historical decisions become unreproducible | Immutable snapshots, revocation cascade, versioned releases |

## Definition of research completion

There is no honest point at which all five sciences are permanently “finished.” Completion must be declared at three levels:

- **Question complete:** the search and synthesis stopping rules are met for one registered decision question.
- **Decision path complete:** all evidence, policy, rule/model, validation, shadow, and rollback gates are met for one bounded action.
- **Portfolio complete:** the planned set of decision paths covers the agreed personal use case and open gaps no longer block those decisions.

The mature platform remains a living evidence system. Its job is not to know everything; it is to know exactly what supports each permitted action, what weakens it, where it does not apply, and when it must abstain.

## Recommended next research action

After Wave 0 corpus repair and protocol freeze, begin **Wave 1 measurement validity and safety boundaries**, not broad topic accumulation. Register the first five decision questions—one per system—and conduct a complete primary-source review for those paths. This will test the evidence refinery end to end and reveal the real review cost before scaling.

Do not begin by importing millions of more lines. First prove that one source can become one reproducible observation, one adjudicated claim, one owned policy, one deterministic candidate rule, and one replayable shadow receipt without breaking the trust boundary.
