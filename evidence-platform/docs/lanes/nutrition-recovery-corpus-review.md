# Nutrition and Recovery corpus review

**Review scope:** only `sources/original-archive/THE-Hybrid-System-Master-Evidence-Archive-2026-08-28/03-nutrition/` and `04-recovery/`  
**External research:** none  
**Validation posture:** document statements, citations, confidence labels, and formula status are corpus facts; the scientific content they assert is **not verified** by this review. No document-derived claim is promoted to `Verified source fact` merely because it includes a PMID, DOI, URL, confidence grade, or the word “direct.”  
**Product naming note:** source titles and quotations are preserved, but their use of “THE Hybrid Engine” is stale terminology. The product is **THE Hybrid System**.

## 1. Review method and classification boundary

This is a corpus audit, not a literature review. Files were inventoried, Markdown structure and source registers inspected, explicit claim/formula/rule tables reviewed, prototype code and tests compared with the written contracts, and repeated citations counted as a duplication signal. Scientific sources linked from the documents were not opened or validated.

The labels below are used conservatively:

| Label | Meaning in this review |
|---|---|
| Verified source fact | A fact about the local artifact itself, such as a file count, table row, formula text, code constant, or cited location. It does **not** verify the underlying science. |
| Structured observation | A candidate numerical or categorical record extracted from a local artifact with provenance. It remains unvalidated until checked against the primary source. |
| Scientific claim | A proposition the corpus attributes to research. It remains unverified here. |
| Product policy | A stated design, safety, authority, or product-behaviour choice. |
| Executable rule | A deterministic operation with sufficiently explicit inputs, conditions, and outputs to encode and test. |
| Model assumption | A coefficient, mapping, proxy, filter, or threshold selected without verified recovery of the precedent system or without local calibration. |
| Open research gap | A question requiring primary-source retrieval, extraction, synthesis, or empirical validation. |
| Unsupported or rejected claim | A claim the corpus itself rejects or says should not be operationalized. |

## 2. Corpus coverage

### 2.1 Nutrition

**Verified source facts.** The Nutrition lane contains **47 files** when hidden files are included: 17 Markdown documents, 1 JSON test-vector registry, 1 JSON example, 8 Python files, 4 Kotlin files, 1 SQL migration, 5 CSV fixtures, 5 Gradle/configuration files, 2 XML files, 1 `.gitignore`, and 2 additional build/style files. The corpus contains **80 unique PMID identifiers** across **328 PMID mentions** and 34 DOI-like strings. These counts measure citation strings, not unique validated sources.

Coverage is broad but heterogeneous:

| Artifact group | Coverage | Evidence-system value | Main limitation |
|---|---|---|---|
| Research handoff pack | Public MacroFactor behaviour, expenditure estimation, confounders, athlete safeguards, validation design | High for candidate claims, formulas, gaps, and provenance links | AI-prepared synthesis; primary sources not bundled; scientific assertions not verified in this review |
| Claim and formula registries | 24 explicit claims, 22 formulas, 7 non-equation operating rules | Highest-value normalization starting point | Status labels are self-assigned; several items are product precedent or inference, not scientific validation |
| Earlier MacroTrack documentation | Product requirements, evidence contract, source register, architecture, UX, data provenance, test plan | Strong design and governance context | Overlaps the later handoff pack; uses an earlier product/repository framing |
| Deterministic prototypes | Python reference engine, Kotlin calculation object, SQL data model, importers, test fixtures | High implementation relevance and useful for rule/code comparison | Prototype code is not validation; Python and written contract diverge on a key gate |
| Food-data fixtures | Small AUSNUT/NUTTAB/Open Food Facts examples | Useful importer tests | Not a research dataset and not representative food-composition coverage |

### 2.2 Recovery

**Verified source facts.** The Recovery lane contains **5 Markdown documents**, 7,351 lines and approximately 610 KB in total. It contains **262 unique PMID identifiers** across **930 PMID mentions** and 147 DOI-like strings. At least **59 PMID identifiers occur in two or more documents**, demonstrating substantial source reuse. None of the five files is a downloaded primary paper, structured study record, normalized observation table, machine-readable claim registry, executable model, or test suite.

Coverage is conceptually broad: recovery methods, sleep, subjective wellness, pain/soreness/illness distinctions, load monitoring, HRV/readiness, progression/regression, detraining/re-entry, approval boundaries, decision receipts, UI design, and weekly review. However, this breadth is contained in overlapping AI-authored handoff/synthesis documents rather than in a validated evidence substrate.

## 3. Strongest evidence artifacts and likely provenance class

“Strongest” means best structured and most useful for later validation, not scientifically verified.

### 3.1 Nutrition artifacts

| Relative path | Likely class | Why it is valuable | Required treatment |
|---|---|---|---|
| `03-nutrition/MacroFactor_Hybrid_Engine_Claim_Matrix.md` | AI-prepared secondary synthesis plus product-source index | Explicit 24-row claim matrix with evidence class, confidence, implementation decision, and source/limitation | Import as **candidate claims**; validate each source and scope independently |
| `03-nutrition/MacroFactor_Hybrid_Engine_Formula_Registry.md` | Product-policy/formula registry derived from public product material and scientific synthesis | 22 stable formula IDs, definitions, units, source classes, statuses, and implementation notes; 7 named operating rules | Import formulas without promoting source class; mark `HYBRID_INFERENCE`, `PRODUCT`, and unknown coefficients explicitly |
| `03-nutrition/MacroFactor_PubMed_Athlete_Safety_Validation_Review.md` | AI-prepared secondary research review | Focused safety, RED-S/LEA, protein, wearable, missingness, and validation boundaries | Verify every PMID and numerical result against the paper before structured use |
| `03-nutrition/MacroFactor_Research_and_Hybrid_Implementation_Spec.md` | AI-prepared mixed research/design specification | Extensive numerical findings, limitations, confounder policies, data contracts, and a primary-source section | Split into observations, scientific claims, policies, assumptions, and gaps; never ingest whole paragraphs as rules |
| `03-nutrition/docs/ALGORITHM_AND_EVIDENCE.md` | Earlier product evidence/design contract | Concise explicit separation of precedent, unresolved private detail, reference formulas, gates, and guardrails | Retain as historical policy/specification; reconcile with later formula registry and code |
| `03-nutrition/docs/SOURCE_REGISTER.md` | Secondary source index | Direct URLs grouped by product precedent, food data, science, Android, and privacy | Resolve into stable source records; check version/date/licensing and retrieve primary artifacts |
| `03-nutrition/MacroFactor_Hybrid_Engine_Test_Vectors.json` | Deterministic fixture registry | Machine-readable formula/state/safety/conservation cases | Useful for conformance tests, but expected values validate implementation consistency only |
| `03-nutrition/adaptive_engine.py` and `03-nutrition/tests/test_adaptive_engine.py` | Executable prototype and tests | Reveals actual assumptions and runtime behavior | Treat as a candidate model version; do not silently adopt because it conflicts with the written gate |

### 3.2 Recovery artifacts

| Relative path | Likely class | Why it is valuable | Required treatment |
|---|---|---|---|
| `04-recovery/claude-recovery-progression-regression-evidence-audit-2026-08-08.md` | AI-generated secondary evidence audit | Clearest evidence-quality framework, overclaim audit, claim-boundary matrix, gaps, and bibliography | Best seed for candidate claims/contradictions, but primary-source verification is mandatory |
| `04-recovery/claude-recovery-progressions-regressions-pain-aware-training-research-handoff-2026-08-08.md` | AI-generated mixed research, policy, and product handoff | Most explicit safety boundaries, regression ladder, deterministic action vocabulary, receipt proposal, source register, and gaps | Split into distinct claim/policy/rule/gap records; clinical material must remain clinician-governed |
| `04-recovery/claude-recovery-progression-regression-product-design-extension-2026-08-08.md` | AI-generated product-design synthesis | Outcome taxonomy, recovery-method matrix, decision contract, data architecture, and test scenarios | Use for schema/interface design, not as evidence of intervention efficacy |
| `04-recovery/claude-progression-recovery-regression-research-and-product-synthesis-2026-08-08.md` | AI-generated secondary synthesis | Compact overview, progression/recovery claims, Coordinator contract, one-variable intervention principle, source register | De-duplicate against the audit and pain-aware handoff before extraction |
| `04-recovery/claude-week-in-review-recovery-readiness-progression-research-handoff-2026-08-08.md` | AI-generated UX/research handoff with appended recovery research | Largest source index; useful planned-versus-actual and intervention-receipt concepts | Contains two major documents in one file and extensive overlap; segment before indexing |

No artifact in either lane should be treated as a primary scientific source. Official product pages and peer-reviewed papers are referenced by URL/identifier but are not present as preserved source objects in these two folders.

## 4. Documented Nutrition claims, observations, formulas, and rules

### 4.1 Explicit candidate claims

**Verified source fact:** `03-nutrition/MacroFactor_Hybrid_Engine_Claim_Matrix.md`, table “ID / Claim or behaviour / Evidence class / Confidence / Implementation decision / Source / limitation” (lines 8–32), contains 24 entries (`C-001`–`C-024`). They cover:

- **Product-precedent claims:** custom BMR equations; activity/exercise correction; intake-plus-trend expenditure; trend weight; 20-day rate; holding with insufficient data; differentiated blank/partial/fasted states; weekly budgets; deterministic check-ins; and step-trend modifiers (`C-001`–`C-012`).
- **Scientific/design claims:** protein target basis, lifter/endurance boundary, fat-floor caution, individual error, exercise compensation, self-report bias, informative missingness, scale confounders, seasonality, RED-S/EA threshold limits, and low-energy-availability safety (`C-013`–`C-023`).
- **Validation boundary:** cited evidence does not validate the local implementation (`C-024`).

All 24 are **candidate claims**, not verified claims. In particular, “High” confidence in the table is an author label rather than a validator result.

### 4.2 Explicit formula registry

**Verified source fact:** `03-nutrition/MacroFactor_Hybrid_Engine_Formula_Registry.md`, section “Formula table” (lines 15–40), contains **22 formula definitions**:

| Formula family | IDs / location | Classification in this review |
|---|---|---|
| BMR priors and modifiers | `bmr.general.v1`, both age-adjustment formulas, `bmr.ffm.v1`, `bmr.athlete.v1`, and three adaptation modifiers (lines 19–26) | Product-precedent formulas/model assumptions pending source verification |
| Initial and adaptive expenditure | `expenditure.initial.v1`, `expenditure.balance.v1`, `storedEnergy.symmetric7700.v1`, `trend.ewma.v1` (lines 27–30) | Mixed product precedent, energy-balance identity, and explicit Hybrid assumptions |
| Rate and target | `changeRate.20day.v1`, `changeRate.percent.v1`, `target.signedRate.v1`, `budget.weekly.v1` (lines 31–34) | Candidate executable formulas; reference-weight and energy-density choices must be versioned |
| Macro allocation | `macro.energyFactors.v1`, `protein.ffm.v1`, `protein.lifterTable.v2025`, `fat.floor.v1` (lines 35–38) | Product conventions/policies with population and basis constraints |
| Modifiers and safety proxy | `goalPrior.multiplier.v1`, `energyAvailability.proxy.v1` (lines 39–40) | Feature-flagged product heuristic and safety-only scientific proxy; neither is a universal physiological rule |

Important numerical examples suitable only as **structured-observation candidates** include:

- `storedEnergy.symmetric7700.v1`: 7,700 kcal/kg approximation (line 29).
- `trend.ewma.v1`: EWMA equation with unspecified/configurable alpha (line 30).
- `changeRate.20day.v1`: 20-day horizon (line 31).
- Macro convention: 4/4/9 kcal/g (line 35).
- Lifter protein table: 1.75/2.35/2.75/3.10 and 2.00/2.50/3.00/3.50 g/kg FFM bands (line 37).
- Fat floor: `max(30, 30 + 0.5 × (heightCm − 150))` g/day (line 38).
- Goal-prior multiplier: `1 + 4 × intendedRateFractionPerWeek` (line 39).
- Energy-availability proxy: `(intake − exercise expenditure) / FFM` kcal/kg FFM/day without a universal diagnostic threshold (line 40).

### 4.3 Candidate operating rules and code behavior

**Verified source fact:** the formula registry’s “Operating rules that are not equations” table (lines 42–50) names 7 candidate rules: `gate.v3.4of7.1of7`, blank-not-zero, confirmed-fast-zero, partial-logging separation, flux-range-not-confidence, no-diagnosis safety, and no-direct-wearable-calories.

The earlier evidence contract documents a reference estimator at `03-nutrition/docs/ALGORITHM_AND_EVIDENCE.md`, sections “Trend,” “Expenditure,” “Coverage gate,” and “Targets” (lines 64–126). It specifies:

- a transparent weight trend;
- linear trend slope and intake-minus-stored-energy expenditure;
- a 7,700 kcal/kg product parameter and 100 kcal/day damping cap;
- coverage states rather than imputing blank days as zero;
- signed target rate; and
- default protein 1.8 g/kg and fat 0.8 g/kg as product defaults, not medical advice.

The Python prototype makes these rules executable at `03-nutrition/adaptive_engine.py`: `EngineConfig` (lines 29–42), countable-day semantics (lines 85–90), EWMA (lines 93–102), coverage gate (lines 127–144), expenditure estimation (lines 146–211), initial expenditure (lines 214–241), target and macro allocation (lines 244–264), and weekly check-in (lines 268–304). The Kotlin prototype duplicates a smaller calculation subset in `03-nutrition/app/src/main/java/com/macrotrack/app/domain/AdaptiveNutrition.kt`, especially constants/EWMA (lines 26–35), expenditure (lines 40–48), and macros (lines 50–59).

These are **candidate executable rules/model assumptions**, not validated runtime rules.

### 4.4 High-value structured observations in the long specification

The main implementation specification contains many extractable study-level observations with population, sample size, intervention, duration, result, and limitations. Examples include:

- Illness/RMR and fluid-shift observations: `03-nutrition/MacroFactor_Research_and_Hybrid_Implementation_Spec.md`, section “18.2.5 Illness, inflammation and fluid shifts” (lines 1407–1417).
- Fasting trials and synthesis: section “18.2.6 Fasting and refeeding” (lines 1419–1429).
- Stool output, transit, fiber dose-response, and bowel-preparation effects: section “18.2.7 Gastrointestinal contents…” (lines 1431–1443).
- Body recomposition examples and scale-inference limitations: section “18.2.8 Body recomposition…” (lines 1445–1457).
- Confounder response matrix: “Cross-confounder rules: annotate, hold, avoid inferring” (lines 1459–1472).
- Proprietary/unrecoverable behavior: section “18.4 Still not recovered” (lines 1506–1508).
- Athlete safety policies and population-specific protein context: section “20. PubMed/NCBI athlete safeguards…” and “Design changes that are now required” (lines 1544 onward).

These are strong extraction targets because the prose often includes study design and limitations, but every value still requires primary-source comparison before entering a normalized observation registry.

## 5. Documented Recovery claims, policies, and rules

### 5.1 Scientific claim candidates

The best-scoped claim candidates occur in `04-recovery/claude-recovery-progression-regression-evidence-audit-2026-08-08.md`:

| Candidate claim | Exact location | Classification |
|---|---|---|
| Evidence does not support a universal readiness oracle, injury-probability calculator, fixed progression law, mandatory deload calendar, or single universal HRV threshold | Executive verdict, lines 10–23 | Scientific claim boundary; unverified |
| ACSM 2–10% progression and the 10% weekly running rule are not universal biological/injury thresholds | “Highest-priority conclusions,” lines 45–52 | Scientific claim plus rejected universal rule; unverified |
| HRV should not be a binary universal gate | lines 50 and section “HRV and readiness algorithms,” lines 362–408 | Scientific claim/product policy; unverified |
| ACWR and “sweet spots” should not predict individual injury | lines 51 and section “Injury prediction, ACWR…,” lines 409–440 | Scientific claim/rejected rule; unverified |
| Recovery modalities must separate soreness/perceived recovery from performance and long-term adaptation | lines 52, 127–207 | Scientific claim taxonomy; unverified |
| Sleep is relevant but no universal hour threshold is supported for every athlete | section 2.3, lines 153–160 | Scientific claim boundary; unverified |
| Progression is multidimensional and should not default to load-only | section 3, lines 208–272 | Scientific claim/product-design claim; unverified |
| Return to sport is a shared, criteria-informed decision rather than an app clearance | section 4.5, lines 316–329 | Clinical/product authority policy informed by claims; unverified science |
| Deload evidence is thinner than common practice suggests | section 5, lines 335–361 | Scientific claim; unverified |

Other useful claim locations include `04-recovery/claude-recovery-progression-regression-product-design-extension-2026-08-08.md`, “Recovery-method evidence matrix” (lines 114–136) and detailed guidance (lines 138–484), plus the pain-aware handoff’s direct evidence register (lines 1291–1418).

### 5.2 Product policies and authority boundaries

Strong candidate policies, not scientific facts, include:

- Keep pain, soreness, illness, readiness, fatigue, capacity, and recovery as separate typed objects: `04-recovery/claude-recovery-progressions-regressions-pain-aware-training-research-handoff-2026-08-08.md`, Parts I and V (lines 77–164 and 464–556).
- Preserve training intent through a regression ladder and substitutions rather than substituting by exercise name alone: same file, Part IV (lines 321–462).
- Route diagnosis, return-to-sport clearance, and named rehabilitation decisions to clinicians: same file, sections 36–38 (lines 697–742).
- Make abstention/insufficient evidence a valid decision: same file, section 40 (lines 764–777).
- Store provenance, uncertainty, policy version, and reversible history: same file, sections 39 and 43–45 (lines 744–762 and 816–860).
- Use load history, HRV, resting heart rate, wellness, and soreness as typed contextual inputs rather than collapsing them into a single oracle: `04-recovery/claude-recovery-progression-regression-product-design-extension-2026-08-08.md`, outcome taxonomy (lines 97–112), state/decision contract (lines 628–701), and data architecture (lines 938–956).

### 5.3 Candidate rules and formulas

Recovery contains no stable rule IDs, model versions, machine-readable executable rules, unit-tested formulas, or calibrated coefficients. It does contain policy-shaped action logic:

- Decision priority and permission boundaries: pain-aware handoff, sections 34–38 (lines 663–742).
- Action receipt proposal: section 39 (lines 744–762).
- Candidate top-level action vocabulary: `Proceed`, `Hold`, `Regress`, `Substitute`, `Escalate`, `Return`, `Record`, Part XIII (lines 1421–1452).
- Trigger/action examples: product-design extension, “Regression triggers and actions” (lines 545–556) and goal-specific policy table (lines 590–600).
- Re-entry tolerance window of 24–72 hours is stated as part of an inferred policy workflow, not a validated universal threshold: product-design extension, “Return after a lapse” (lines 616–626).
- A “one-variable intervention rule” is described in `04-recovery/claude-progression-recovery-regression-research-and-product-synthesis-2026-08-08.md`, section 23 (lines 671–679), but lacks an executable schema and exceptions contract.

These are **candidate product policies**. They should not be counted as usable runtime rules until assigned stable IDs, explicit inputs and units, preconditions, outputs, authority, conflict handling, evidence links, version, tests, and validator results.

## 6. Contradictions, duplication, and staleness

### 6.1 Direct contradictions or unresolved inconsistencies

1. **Nutrition coverage gate conflict.** The later claim/formula registry says update with at least **4 valid nutrition days and 1 weight day in the last 7 days** (`03-nutrition/MacroFactor_Hybrid_Engine_Claim_Matrix.md`, `C-007`, line 15; formula registry `gate.v3.4of7.1of7`, line 44). The Python prototype defaults to **6 nutrition days and 1 weight day per week for two consecutive weeks** (`03-nutrition/adaptive_engine.py`, `EngineConfig`, lines 33–37; `_coverage_explanation`, lines 127–144). The earlier README also describes two consecutive seven-day periods. This is a material rule conflict; no implementation should be selected silently.

2. **Nutrition target basis mismatch.** The later corpus says protein target basis must distinguish body mass from FFM (`Claim Matrix`, `C-013`; formula registry `protein.ffm.v1` and `protein.lifterTable.v2025`, lines 36–37). The Python and Kotlin prototypes calculate protein and fat directly from body weight (`adaptive_engine.py`, lines 249–264; `AdaptiveNutrition.kt`, lines 50–59). This may be a deliberate older simplification but is unresolved provenance/version drift.

3. **Formula coverage mismatch.** The 22-formula registry is much broader than the Python/Kotlin prototypes. Test vectors cover selected formulas and states, but the existence of expected outputs does not demonstrate a single implementation conforming to the entire registry.

4. **Recovery precision tension.** The Recovery audit repeatedly rejects universal thresholds, while other handoff sections offer action tables, re-entry bands, traffic lights, and windows. The documents often label these as inferred/configurable, but extraction that drops those qualifiers would convert cautions into false precision. Every such value must retain its evidence tag and policy-owner requirement.

5. **Clinical authority boundary is conceptually consistent but not executable.** Recovery documents say clinician-owned decisions must not be automated, but there is no normalized red-flag taxonomy, jurisdiction/version field, signed clinician restriction object, or executable authority validator.

### 6.2 Duplicates and near-duplicates

- Nutrition contains two overlapping generations: an earlier MacroTrack build/research bundle (`README.md`, `docs/*`, Python/Kotlin/SQL/importers) and a later MacroFactor/PubMed handoff pack (`MacroFactor_*`). Both describe similar expenditure loops, data states, provenance, and validation boundaries. They are not exact duplicates and should be versioned separately rather than merged textually.
- Recovery’s five documents were all dated 8 August 2026 and reuse sources, claims, policy language, UI concepts, and decision-receipt ideas. There are 930 PMID mentions but only 262 unique PMID strings; at least 59 identifiers occur in multiple documents. This is evidence of repeated citation, not independent corroboration.
- `claude-week-in-review-recovery-readiness-progression-research-handoff-2026-08-08.md` contains an appended second major document beginning at line 1484, so it should be segmented into at least two logical source records while preserving the original file unchanged.
- Source lists repeatedly cite reviews, consensus papers, and the same studies. Duplicate citations must resolve to one stable source record, with many document-claim links.

### 6.3 Staleness

- The files are recent relative to the archive date, so no item is declared scientifically stale by date alone.
- The phrase “THE Hybrid Engine” and repository-specific takeover/build instructions are **product-semantic stale** under the current naming and no-repository-modification requirements.
- Product documentation, software versions, food databases, safety consensus, and URLs are temporally volatile. All such source records need `retrieved_at`, `source_version`, and review-expiry metadata before policy use.
- The earlier MacroTrack prototype and later 24 August handoff are different design generations. The later date does not automatically make the later rule correct.

## 7. Gaps requiring primary-source or PubMed review

### 7.1 Nutrition

Priority primary-source work:

1. Verify every `C-013`–`C-023` scientific/safety claim against the cited paper or consensus, including population, sex, training status, intervention, comparator, measurement method, effect estimate, uncertainty, and limitations.
2. Retrieve and validate the public product pages underlying `C-001`–`C-012`, record page version/retrieval date, and keep them as product precedent rather than science.
3. Validate the BMR equations, activity tables, 20-day rate behavior, fat-floor formula, lifter protein table, and goal-prior heuristic against the exact public source locations.
4. Review dynamic energy-density models and decide when, if ever, a symmetric 7,700 kcal/kg approximation is acceptable; quantify error by goal, duration, and population.
5. Validate protein policies separately for resistance, endurance, hybrid, energy-restricted, older, adolescent, female, and clinical populations. Store body-mass versus FFM basis.
6. Validate energy-availability measurement and screening boundaries without creating a universal diagnostic cutoff; define dietitian/clinician escalation ownership.
7. Extract primary observations for glycogen/water, creatine, sodium, menstruation, illness, fasting/refeeding, GI contents, recomposition, missingness, and self-report bias.
8. Assess criterion validity of the local intake/weight estimator against DLW, indirect calorimetry, or chamber data; define rolling-origin calibration, limits of agreement, subgroup performance, and prediction-interval acceptance criteria.
9. Verify food-composition source versions, licensing, field definitions, analytical/missing-value codes, measure bases, and update cadence for FSANZ/AUSNUT/AFCD/NUTTAB and Open Food Facts.
10. Resolve the 4/7 versus 6/7 gate empirically and by product-policy decision; neither should inherit authority from document repetition.

Known proprietary/unrecoverable items are explicitly listed in `03-nutrition/MacroFactor_Research_and_Hybrid_Implementation_Spec.md`, section “18.4 Still not recovered” (lines 1506–1508): exact V3 filter coefficients, water-shift estimator, hidden intake predictor, partial-logging classifier, gains/caps, flux construction, menstrual logic, illness/hold trigger, and any confidence probability. These must remain `Open research gap` or `Model assumption`, never reconstructed as fact.

### 7.2 Recovery

Priority primary-source work:

1. Build a deduplicated source registry for the 262 PMID strings, then verify bibliographic identity, study design, population, intervention, comparator, outcome, timing, effect, uncertainty, and applicability.
2. Separate acute soreness/perceived recovery outcomes from next-day performance, adaptation, hypertrophy, injury, sleep, and return-to-sport outcomes for massage, compression, active recovery, cold, heat, contrast therapy, and stretching.
3. Review athlete sleep evidence by sport, sex, age, schedule, travel, and individual baseline; avoid universal-hour decision gates.
4. Review HRV-guided training protocols by device/metric, measurement reliability, baseline window, endurance versus strength population, action logic, and prospective outcome.
5. Review workload monitoring and ACWR literature as descriptive context only unless a specific prospectively validated decision rule exists; capture denominator/window choices and leakage/bias concerns.
6. Review deload and taper evidence separately; distinguish surveys of practice from efficacy trials and distinguish complete cessation from reduced volume/intensity/frequency.
7. Review pain-monitoring and graded-loading protocols diagnosis by diagnosis. Do not generalize an Achilles protocol to all pain or tendons.
8. Review detraining/retraining and missed-session evidence by training status, modality, absence duration, illness/injury context, and retained adaptation. Do not create universal re-entry percentages.
9. Define clinician-authored restrictions, medical red flags, emergency routing, consent, jurisdiction, and scope-of-practice governance with qualified clinical review.
10. Prospectively validate multidimensional recovery-state estimates and decision policies. No current file validates a single athlete-state score or causal adaptation decision.

## 8. Conservative lane counts

Counts below avoid inflating repeated prose and citations. “Candidate” means explicitly identifiable in the corpus; “usable rule” means a sufficiently specified, internally consistent, versioned rule that could be admitted to runtime after source and safety validation.

| Lane | Candidate claims | Candidate metrics | Candidate formulas | Candidate policy/rule statements | Currently usable runtime rules |
|---|---:|---:|---:|---:|---:|
| Nutrition | **24** explicit claim-matrix rows | **18** minimally distinct core metric concepts | **22** explicit formula-registry rows | **7** named non-equation rules | **0 validated**; 7 are strong normalization candidates, but gate/basis conflicts and absent source validation block admission |
| Recovery | **18** minimally distinct, non-duplicate claim families | **16** minimally distinct observation/decision metric concepts | **0** stable/versioned formulas | **7** top-level action classes plus multiple unregistered policy tables | **0**; logic lacks stable IDs, complete predicates, model versions, tests, and validated thresholds |
| Combined | **42** | **34** | **22** | **14** named/action-class candidates | **0 validated** |

Nutrition metric concepts counted conservatively: intake energy, body weight, trend weight, weight-change slope, expenditure, BMR, activity factor, exercise correction, target rate, calorie target, weekly budget, protein, carbohydrate, fat, FFM, fat mass/body-fat fraction, energy availability, and logging/weight coverage. A later metric dictionary may split these further by raw/trend/estimated status, unit basis, and time basis.

Recovery metric concepts counted conservatively: sleep duration/quality, energy, stress, soreness, pain, perceived readiness, fatigue, session RPE, RIR, technical quality, load/reps/volume, pace/power/velocity, HRV, resting heart rate, fuelling/hydration context, and next-day symptom/performance trajectory. No universal composite score is counted.

The counts do **not** treat every sentence, citation mention, threshold example, table row, UI field, or repeated document statement as a separate claim/metric. They also do not count linked papers as verified sources.

## 9. Recommended normalization order

1. Preserve all 52 scoped files unchanged as source artifacts and assign stable source-artifact IDs.
2. Segment the two Nutrition generations and the appended Recovery document without altering originals.
3. Normalize Nutrition’s 24 claim rows, 22 formula rows, and 7 rule rows first, retaining their original labels as untrusted author metadata.
4. Create contradiction records for the 4/7 versus 6/7 coverage gate and body-mass versus FFM target basis.
5. Normalize Recovery’s 18 claim families and 7 action classes, with explicit `policy_only`, `clinician_owned`, `threshold_unvalidated`, and `not_executable` states.
6. Deduplicate citations to stable source IDs, retrieve primary records, and attach exact study/table/row provenance before extracting numbers.
7. Admit no rule into a model version until source validation, unit/population checks, authority review, deterministic tests, unsafe-decision tests, and replay receipts pass.

## 10. Final status for these lanes

| Status | Nutrition | Recovery |
|---|---|---|
| Complete in this review | File coverage; artifact classification; explicit claim/formula/rule discovery; major contradiction and duplicate identification; conservative counts | File coverage; artifact classification; major claim/policy families; duplication and threshold-overreach risks; conservative counts |
| Incomplete | Primary-source validation; full study/observation extraction; food-source licensing/version validation; formula conformance and empirical calibration | Primary-source validation; normalized study/claim/contradiction registry; executable recovery state model; clinical governance; tests |
| Uncertain | Correct coverage gate; correct protein basis by policy; estimator coefficients/caps; applicability of product precedents | Any universal threshold; HRV/load/readiness decision validity; deload/re-entry effect sizes; generalizability of pain protocols |
| Unsupported or rejected | Exact MacroFactor V3 replication, wearable calorie addition, blank-day-as-zero, universal EA diagnosis, calibrated confidence without validation | Universal readiness oracle, single HRV gate, ACWR injury probability, universal pain cutoff, mandatory deload calendar, universal re-entry percentage, app-issued return-to-sport clearance |

The corpus is a useful design and research map, but it is not yet a validated evidence platform and does not establish production readiness.
