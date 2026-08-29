# Strength and conditioning corpus review

**Review scope:** only `sources/original-archive/THE-Hybrid-System-Master-Evidence-Archive-2026-08-28/01-strength/` and `02-conditioning/`  
**Review date:** 2026-08-29  
**Verification status:** corpus audit only; no web retrieval or independent source verification was performed  
**Product name used here:** THE Hybrid System

## Interpretation boundary

The archive's text is evidence *about what the corpus contains*, not proof that the scientific or product claims in it are true. A DOI, PMID, official-product URL, or confidence label written in a document is a candidate provenance pointer until the cited primary item is retrieved, matched to the claim, and reviewed. No scientific claim below is promoted to `Verified source fact`. Repository plans, formulas, defaults, and pseudocode are not runtime authority.

The corpus appears substantially authored or consolidated by research assistants, including likely LLM-assisted synthesis. Signals include filenames and internal language such as “ChatGPT evidence bundle,” “Claude review,” “agent deep-pass,” generated handoffs, and prompt/model specifications. This does not make the content false, but it means the synthesis layer is untrusted. The original studies, official specifications, and official product documentation referred to by those syntheses are the items that may later become verified source records.

## Corpus coverage and measured size

| Lane | Physical files | Bytes | Main coverage | Important limitation |
|---|---:|---:|---|---|
| Strength | 37 | 1,684,677 | progression, RIR/RPE, equipment rounding, exercise identity, volume, deloads, concurrent-training interaction, safety boundaries, product-behaviour audits, implementation plans, tests, exercise library | almost all evidence is secondary synthesis or product/design material; cited papers and official pages are not preserved as primary full-text records in this lane |
| Conditioning | 58 | 2,363,793 | running, rowing, SkiErg/Nordic, conventional cycling, combined arm-and-leg air bike, load monitoring, benchmark validity, Concept2 Logbook API, Echo V3/FTMS connectivity, machine-readable progression trees | strongest coverage is air bike and device/data integration; general conditioning prescription, long-term periodisation, and population-specific safety remain thin |
| Combined | 95 | 4,048,470 | the two lanes above | 79 unique SHA-256 payloads after exact duplicates are collapsed; physical-file counts must not be interpreted as independent evidence counts |

File types include Markdown syntheses and plans, JSON manifests/contracts/test vectors, CSV/JSON exercise-library copies, Mermaid diagrams, and small code/test fixtures. There are no study PDFs or source-data tables in these two lane folders. The very large `final-evidence-dossier.md` payload is copied three times across the two lanes and must count once.

## Evidence-artifact assessment

### Strength

| Artifact and exact relative path | Likely status | Value | Review treatment |
|---|---|---|---|
| `01-strength/THE_Hybrid_Strength_Claim_Matrix.md` | secondary/tertiary synthesis; likely AI-assisted | 66 explicitly identified candidate claims (`S-001`–`S-066`) with class, confidence, implementation decision, and source pointer | strongest claim index, but every external claim remains unverified; lines/rows 8–73 are the claim table |
| `01-strength/THE_Hybrid_Strength_Formula_Registry.md` | project registry; likely AI-assisted | 22 candidate formulas/definitions and 35 policy rows; unusually good separation of product, science, policy, and unknown classes | strongest rule/formula inventory; not executable validation and not proof of scientific correctness; numerical formulas table lines 18–41, policy table lines 45–81 |
| `01-strength/THE_Hybrid_Strength_PubMed_RP_Validation_Review.md` | secondary scientific review | compact evidence boundaries with PMID links and limitation notes | best route to primary-source retrieval; see sections 1–10, “Additional agent PubMed pass,” “Second deep-pass evidence additions,” and “Third evidence lane” |
| `01-strength/THE_Hybrid_Strength_Algorithm_Transparency_Audit_2026-08-25.md` | product/public-record audit | makes private/unknown coefficients explicit and warns against claiming product-code recovery | valuable negative-evidence boundary; see “Confidence by product,” “what remains unknown,” “Adversarial checks,” and “Product decision” |
| `01-strength/THE_Hybrid_Strength_MacroFactor_RP_Research_and_Implementation_Spec.md` | mixed product synthesis, policy, and engineering design | detailed controller/data-contract/pseudocode/test concepts | implementation relevance is high, evidentiary authority is low; sections 2–4 are evidence classification/product anchors, 5–15 are mostly THE Hybrid System design |
| `01-strength/THE_Hybrid_Strength_Test_Vectors.json` | project test fixtures | concrete edge cases for deterministic replay | candidate acceptance inputs only; they do not validate the source claims or chosen constants |
| `01-strength/strength-system-model.md` | architecture/policy | separates strength, hypertrophy, safety, and context controllers and proposes arbitration | useful system design; exact duplicate exists at `01-strength/docs/strength-system-model.md` |
| `01-strength/strengthside-research/strength-adaptive-engine-v2/final-evidence-dossier.md` | broad secondary/tertiary dossier; likely AI-assisted | large historical synthesis | low marginal value because it is duplicated in Conditioning and is much less structured than the later claim/formula registries |
| `01-strength/strengthside-plans-and-specs/**` | implementation plans/specifications | repository history, intended contracts, tests, migrations | product/design facts only; repository-specific and outside the current no-app-modification scope |
| `01-strength/strengthside-research/strength-adaptive-engine-v2/exercise-library/*` | project dataset | 120-exercise library in CSV and JSON | structured-data value is high, but exercise mappings are unverified product data and are duplicated in Conditioning |

### Conditioning

| Artifact and exact relative path | Likely status | Value | Review treatment |
|---|---|---|---|
| `02-conditioning/conditioning_evidence_handoff.md` | secondary scientific/product synthesis; likely AI-assisted | most complete narrative review, 59-item source registry, exact numeric anchors, explicit gaps, and implementation boundaries | strongest conditioning overview; exact duplicate at `02-conditioning/hybrid-engine-research/conditioning-evidence-bundle/conditioning_evidence_handoff.md` |
| `02-conditioning/hybrid-engine-research/conditioning-evidence-bundle/conditioning_source_model_manifest.json` | structured secondary synthesis | 59 candidate sources, 9 research models, 16 cross-reference decisions, and 9 explicit evidence gaps | strongest machine-readable evidence index; source entries still require retrieval and verification |
| `02-conditioning/hybrid-engine-research/conditioning-evidence-bundle/modality_progression_regression_trees.json` | product-policy state machine | explicit common states and modality-specific trees for running, rowing, SkiErg, cycling, and air bike | strong design artifact, but its own metadata says the exact thresholds/transition counts are product design, not validated physiological rules |
| `02-conditioning/hybrid-engine-research/2026-07-30-conditioning-progression-science.md` | secondary overview | shared progression skeleton and four modality summaries | useful orientation; superseded in breadth by the later handoff/manifest |
| `02-conditioning/hybrid-engine-research/2026-07-31-conditioning-evidence-cross-reference.md` | synthesis/audit | records rejected universal numbers and a surfaced design bug | useful contradiction log, not primary evidence |
| `02-conditioning/hybrid-engine-research/2026-08-14-set-type-load-rules-brief.md` and `2026-08-15-load-increment-sizing-brief.md` | research requests, not answers | precise unresolved questions and desired extraction format | open gaps; must not be counted as completed research |
| `02-conditioning/hybrid-engine-research/concept2-logbook-bundle/SOURCE_REGISTRY.json`, `API_CONTRACT.json`, `FIELD_MAPPING.md`, and `PROVENANCE.md` | mixed official-document synthesis and implementation corroboration | raw-plus-normalised mapping, explicit unresolved API questions, provenance and contract shape | comparatively strong technical evidence architecture; `API_CONTRACT.json` declares `research_handoff_not_live_validated`; live-account validation remains required |
| `02-conditioning/hybrid-engine-research/echo-v3-connectivity-bundle/evidence/source_registry.json`, `echo_v3_connectivity_research.md`, and `echo_v3_data_contract.json` | official-source/standards synthesis plus third-party implementation evidence | FTMS service/characteristic mapping, data-quality boundaries, licensing notes | useful technical lead; archived official local copies named in the registry are not present under the reviewed lane, and physical-device validation is absent |
| `02-conditioning/hybrid-engine-research/strength-adaptive-engine-v2/**` | exact copies of Strength-side historical bundle | duplicate/misclassified content | exclude from Conditioning evidence counts and route to Strength or cross-system history |

## Documented facts, claims, formulas, policies, rules, assumptions, and gaps

The labels in this section are the reviewer's classification of *corpus records*. “Source fact” means a fact directly observable in an archived file, not independent scientific verification.

### Source facts

| Corpus fact | Location |
|---|---|
| The strength claim matrix contains IDs `S-001` through `S-066`. | `01-strength/THE_Hybrid_Strength_Claim_Matrix.md`, rows/lines 8–73 |
| The strength formula registry declares version `1.2.0`, research date 2026-08-25, and classes `PRODUCT`, `SCIENCE`, `HYBRID_POLICY`, `UNKNOWN`, and `PUBLIC_BEHAVIOUR_ANCHOR`. | `01-strength/THE_Hybrid_Strength_Formula_Registry.md`, lines 3–14 |
| The conditioning manifest declares 59 source records, 9 models, 16 decisions, and 9 gaps. | `02-conditioning/hybrid-engine-research/conditioning-evidence-bundle/conditioning_source_model_manifest.json`, top-level arrays |
| The Conditioning handoff says there is no validated universal air-bike zone table and labels its numbers evidence anchors rather than universal zones. | `02-conditioning/conditioning_evidence_handoff.md`, “A1. What can and cannot be prescribed numerically on air bike,” lines 71–86 |
| The Concept2 contract labels itself `research_handoff_not_live_validated`. | `02-conditioning/hybrid-engine-research/concept2-logbook-bundle/API_CONTRACT.json`, metadata/status |

### Candidate scientific claims requiring primary-source validation

| Candidate claim | Exact corpus location | Boundary to preserve |
|---|---|---|
| Heavy loading is more specific to 1RM strength, while hypertrophy can occur across a wider load spectrum. | `01-strength/THE_Hybrid_Strength_Claim_Matrix.md`, `S-016`; also PubMed review §1 | retrieve PMID 28834797 and 33433148; verify population, failure matching, outcome and effect sizes |
| Failure is not clearly superior to non-failure for hypertrophy and may produce more acute fatigue. | same matrix, `S-017`–`S-018`; PubMed review §2 | do not convert into a universal RIR cutoff |
| Volume relates to hypertrophy/strength with diminishing returns. | same matrix, `S-021`, `S-031`; PubMed review §3 and additional pass | no universal set prescription follows from the claim |
| Exercise-specific transfer is limited and RIR accuracy is imperfect. | same matrix, `S-030`, `S-033`; PubMed review “Additional agent PubMed pass” | require exercise/rep-band calibration and uncertainty |
| Concurrent-training effects vary by sex, modality, duration, frequency, and outcome. | same matrix, `S-036`; PubMed review “Second deep-pass evidence additions” | no blanket cardio penalty |
| Combined air-bike ramp/VO₂peak testing has device/protocol-specific reliability signals. | `02-conditioning/conditioning_evidence_handoff.md`, “A2. Reliability and validity,” table rows “Ramp test” and “VO₂peak test,” lines 97–110 | not a universal treadmill conversion or cross-brand score |
| Four- and eight-week air-bike/all-extremity interventions reported improved aerobic outcomes in narrow populations. | same file, “A3. Acute physiology versus long-term superiority,” lines 112–123 | short, small, supervised and population-specific; no superiority claim |
| Device-exported calories/distance differ even when broad physiological stress is similar. | same file, “A4. Additional direct cross-checks,” especially lines 127–137 | verify S56 primary table and device/protocol details before normalising |
| The running 10% rule and one HRR threshold are not validated universal progression gates. | same file, “Training load and autoregulation,” lines 139–150; manifest decisions `running_10_percent_rule` and `hrr_gate` | absence of a universal rule does not establish an alternative threshold |

### Candidate formulas and numerical models

| Formula/model | Class | Exact corpus location | Review status |
|---|---|---|---|
| expected failure reps = `(repMin + repMax) / 2 + targetRir` | public-product behaviour anchor | `01-strength/THE_Hybrid_Strength_Formula_Registry.md`, `rir.expectedFailure.v1`, line 20 | product documentation must be retrieved and exact semantics tested |
| observed failure reps = `completedReps + reliableActualRir`; signal = observed minus expected | THE Hybrid System policy | same table, `rir.observedFailure.v1` and `progression.signal.v1`, lines 21–22 | candidate transparent analogue, not recovered vendor logic |
| progression load = `stableOpeningLoad × 1.025`; reactive reduction = `stableOpeningLoad × 0.95` | inherited policy | same table, lines 23–24; claim matrix `S-023` | unsupported as universal science; trigger and rounding semantics need validation |
| Epley e1RM = `load × (1 + reps/30)` | policy analytics formula | formula registry, `e1rm.epley.v1`, line 26 | analytics only; error by exercise/rep band must be quantified |
| fractional volume = `directSets + 0.5 × indirectSets` | science-informed replaceable policy view | formula registry, line 37; claim matrix `S-035` | raw direct/indirect counts must be retained; coefficient is not a biological law |
| `SEM = SD × sqrt(1 − ICC)` and `MDC95 = 1.96 × SEM × sqrt(2)` | statistical formulas | formula registry, lines 40–41 | require a matching test-retest design; MDC is not clinical/practical importance |
| session-RPE load = duration minutes × post-session CR10 | candidate internal-load model | `02-conditioning/conditioning_evidence_handoff.md`, “B1. Models to preserve,” line 145; manifest model `M05` | preserve scale and timing; does not prove adaptation |
| TRIMP-style duration weighted by HR intensity | underspecified model family | same table, line 146 | not executable until formula variant, coefficients, sex handling, sensor/protocol, and units are defined |
| 2–3 comparable successful exposures before advancement | product heuristic | same file, line 196 and QA line 628; manifest decision `phase_confirmation` | explicit assumption, not scientific threshold |
| cycling FTP conventions (`20-minute mean × 0.95`; ramp estimate about 75% of highest one-minute power) | coaching/software conventions | conditioning manifest source records `S45`–`S46` | cycling only; blocked from automatic air-bike transfer |

### Candidate product policies and executable-rule shapes

- **Strength priority/arbitration policy:** protect key-lift specificity and performance before accessory-volume progression. Location: `01-strength/THE_Hybrid_Strength_Formula_Registry.md`, policy rows `priority.strength.v1`, `priority.hypertrophy.v1`, and `priority.hybrid.v1`; expanded in `01-strength/strength-system-model.md`, “Controller responsibilities” and “Arbitration contract.” This is a product policy, not a scientific fact.
- **Safety precedence:** the ordered state `emergency_stop > training_pause > clinician_review > reentry_required > hold_progression > caution > normal > insufficient_data`. Location: formula registry `safety.priority.v1`, line 67. This is a safety/product state design; clinical criteria are not fully specified in this lane.
- **Equipment fallback:** hold load, add reps, widen range, or explicitly swap rather than prescribe an impossible increment. Location: formula registry `equipment.fallback.v1`, line 61. This is a plausible deterministic rule shape but requires unit/load-semantics tests.
- **Conditioning completion split:** store cardiovascular and mechanical completion independently and do not allow HR to rescue failed mechanical work. Location: `02-conditioning/conditioning_evidence_handoff.md`, “B3. When cardiovascular target is reached but local muscles fail,” lines 161–177.
- **Conditioning transition rule:** safety route on pain/unsafe technique; otherwise pass/repeat/reduce based on work completion, RPE, technique, recovery, output trend, and recent comparable stability. Location: same file, “B4,” lines 179–196 and “Completion algorithm,” lines 583–606; machine-readable form in `modality_progression_regression_trees.json`, `common_tree`.
- **Device comparability policy:** never compare fan-bike calories, watts, RPM, speed, or distance across brands without calibration and never assign cycling FTP zones to an air bike automatically. Location: same file, cross-reference table lines 57–67 and QA lines 618–630.

None of these rule shapes qualifies as a validated runtime rule yet because the reviewed lanes do not jointly provide verified sources, canonical schemas, policy-owner approval, versioned executable code, complete unit/property tests, safety acceptance tests, and replay receipts.

## Contradictions, duplicates, and staleness

### Exact duplicates

- `01-strength/strength-system-model.md` = `01-strength/docs/strength-system-model.md`; the two `.mmd` files are also identical.
- `02-conditioning/conditioning_evidence_handoff.md` = the copy under `conditioning-evidence-bundle/`.
- The full `strength-adaptive-engine-v2` historical package is copied into both lanes. Identical cross-lane files include `AUDIT.md`, `design.md`, `FILE_TREE.md`, `HybridTraining_Audit.md`, `INDEX.md`, `JARVIS_TAKEOVER_AUDIT.md`, `README_FIRST.md`, `THE-Coach-Brain-v0-AI-Model-Spec.md`, `hybrid_adaptive_evidence_bundle_2026-08-01.md`, and all three exercise-library files.
- `final-evidence-dossier.md` is byte-identical in Strength and Conditioning and to `02-conditioning/hybrid-engine-research/2026-08-16-progression-evidence-answer.md` (three copies total).

Across the two lanes there are 15 duplicate hash groups and 16 excess physical copies, leaving 79 unique payloads. Deduplication should be logical (canonical record plus duplicate relationships); original files should remain unchanged.

### Contradictions and boundary conflicts

- **Name staleness:** many documents call the product “THE Hybrid Engine” or use “Hybrid Engine” in filenames and code identifiers. That name is stale. The product is THE Hybrid System; legacy names should be retained only as source text/aliases.
- **Direct versus fractional set counting:** the formula registry first describes direct working sets and warns against silently applying a multiplier, then offers `direct + 0.5 × indirect` as an optional view. This is resolvable only by storing raw ledgers and versioning the projection, not by selecting one as universal truth.
- **Deload timing:** product precedents include first/last-cycle and survey descriptions around five to six weeks, while the policy registry rejects a universal interval. The defensible representation is separate documented precedent, scientific claim, and configurable policy.
- **RIR as signal versus truth:** product specifications rely heavily on RIR, while the scientific review says RIR accuracy is imperfect and especially poor in some very-low-load/BFR contexts. RIR must carry calibration, missingness, and uncertainty and cannot be a sole gate.
- **Progression constants:** `+2.5%`, `−5%`, and `2–3 successful exposures` are repeatedly presented as usable defaults while also correctly labelled inherited/product heuristics. They must remain assumptions pending prospective validation.
- **Air-bike metrics:** some archived protocols report watts, calories, RPM, HR percentages, or test scores, but the handoff rejects their universal or cross-device use. The apparent numeric specificity is protocol evidence, not a universal prescription table.
- **Conditioning “one shared skeleton” versus modality specificity:** the earlier progression overview proposes one skeleton, while the later handoff insists that modality, device, impact, technique, and local-fatigue signals cannot share one undifferentiated algorithm. A shared state vocabulary is compatible; shared thresholds are not.
- **External AI runtime conflict:** `THE-Coach-Brain-v0-AI-Model-Spec.md` proposes an external AI runtime and is duplicated in both lanes. This conflicts with the required deterministic non-LLM runtime decision layer and is stale design material, not an implementation target.

### Staleness assessment

No file can be declared scientifically current merely from its 2026 filename. Time-sensitive product help pages, API contracts, device firmware/FTMS behaviour, source URLs, and “no current source found” conclusions require rechecking. Repository-specific plans and implementation checklists are stale for the present evidence-only task even if historically useful. The later versioned Strength claim/formula/transparency artifacts generally supersede the less structured early dossier for indexing purposes, but do not erase it.

## Gaps requiring primary-source or PubMed review

### Strength

1. Retrieve every PMID/DOI behind `S-016`–`S-043` and the later additions; extract study design, population, sample size, sex, training status, intervention/comparator, duration, measurement method, effect estimates, uncertainty, and exact table/figure location.
2. Reconcile apparently future/recent PMIDs and claims against actual publication records; confirm that title, year, population, and conclusion match the archive text.
3. Quantify RIR accuracy and calibration by exercise, load, repetition band, sex/training status, and proximity to failure; keep BFR/very-low-load separate.
4. Validate e1RM equations and error by exercise and repetition range; establish when direct 1RM, velocity, or rep tests are permitted.
5. Resolve dose-response evidence for direct versus indirect sets and ensure the `0.5` coefficient is represented as model/policy uncertainty.
6. Determine evidence-supported bounds for load/rep/set changes. The corpus has no primary evidence establishing universal `+2.5%` or `−5%` changes.
7. Review concurrent-training interference by modality, order, separation, sex, training status, and outcome; no single penalty coefficient is justified.
8. Define validated measurement error/MDC inputs for strength and hypertrophy outcomes rather than leaving `measurementSpecificMultiplier` unspecified.
9. Retrieve current official MacroFactor/RP documentation separately from scientific sources; distinguish public product behaviour from proprietary/unrecoverable coefficients.
10. Validate safety/return-to-training criteria with relevant clinical consensus and ensure no diagnosis is inferred from training logs.

### Conditioning

1. Validate the 59 manifest source records against primary publications/official sources and extract complete structured observations from exact tables/figures, not narrative `key_numbers` strings.
2. Establish device-specific reliability, validity, familiarisation, and smallest detectable change for air-bike 30-second, 60-second/repeated sprint, 5-minute, 10-minute, distance, ramp, VO₂peak, critical-power, and maximal-aerobic-power protocols.
3. Determine whether any defensible combined-air-bike VT/LT, HR, RPE, RPM, watt, calorie, or distance thresholds exist by exact device and protocol. The current corpus explicitly finds no universal table.
4. Obtain cross-brand calibration for Assault, Echo, Airdyne, Beast, and Air Bike Revolution outputs or retain a hard comparability block.
5. Find direct beginner and diverse-population evidence for air-bike interval formats and progression; current interventions are small, short, and population-specific.
6. Investigate injury incidence and body-region risks for combined air bikes; “non-weight-bearing” cannot be converted into “universally safer.”
7. Validate progression/regression criteria separately for running, rowing, SkiErg, conventional cycling, and air bike; current `2–3 exposures` and one-lever transitions are product heuristics.
8. Specify a TRIMP variant or reject it; the current reference is too underspecified for deterministic execution.
9. Recheck Concept2 Logbook authentication, scopes, rate limits, pagination, webhook delivery, API version/deprecation status, and nested-workout response shape with current official documentation and live-account fixtures.
10. Validate Echo V3 FTMS fields, flags, units, rollover, disconnect/reconnect, console/firmware variance, and control-point safety on physical hardware. ANT+ export remains unresolved.

## Conservative candidate counts

These are deduplicated *candidates visible in the reviewed corpus*, not verified evidence-platform totals. Counts deliberately avoid treating repeated prose as additional evidence.

| Item | Conservative count | Counting rule |
|---|---:|---|
| Candidate claims | 82 | 66 explicit Strength matrix rows plus 16 Conditioning cross-reference decisions; overlaps within narrative copies are not added |
| Candidate source records | 59 Conditioning + unresolved Strength citations | Conditioning manifest has 59 explicit records; Strength citations cannot be safely counted as canonical sources until deduplicated by PMID/DOI/official URL |
| Candidate metrics | at least 35 | distinct logged/derived measures explicitly needed across the Strength formulas and Conditioning session/benchmark schema; this lower bound excludes exercise-library attributes and synonyms not yet normalised |
| Candidate formulas/models | 24 | 22 rows in the Strength numerical-formula table plus session-RPE and the underspecified TRIMP family; cycling conventions remain source observations unless adopted by policy |
| Candidate research models | 9 | Conditioning manifest `research_models` array |
| Candidate conditioning decisions | 16 | Conditioning manifest `cross_reference_decisions` array |
| Explicit Conditioning gaps | 9 | Conditioning manifest `evidence_gaps` array; lane-wide gap list above is broader |
| Prototype deterministic rule candidates | 14 | only clearly bounded rule shapes with identifiable inputs/outcomes were counted; several still lack thresholds or complete tests |
| Currently validated/usable runtime rules | 0 | none has complete verified provenance, canonical schema linkage, owner approval, executable version, validator result, safety acceptance, and replay receipt in the reviewed lanes |

The 66 Strength rows mix product facts, scientific claims, safety boundaries, inherited decisions, legal/public-record observations, and unknowns; they must be split into their canonical record types before they are used as a scientific-claim count. Similarly, the Conditioning source registry mixes peer-reviewed studies, official guidance, manufacturer material, coaching conventions, theses, and popular practice.

## Recommended ingestion order

1. Register all 95 physical files with hashes and duplicate relations while preserving them unchanged.
2. Canonicalise the 79 unique payloads and mark misclassified Strength-package copies in Conditioning.
3. Ingest the Strength claim matrix, formula registry, and transparency audit as untrusted extracted records.
4. Ingest the Conditioning manifest and progression trees as untrusted structured records, preserving their explicit evidence-tier and design-status fields.
5. Retrieve and validate primary studies/official sources before promoting any candidate source fact or scientific claim.
6. Split each mixed row into source, observation, claim, policy, rule, assumption, gap, and contradiction records.
7. Permit a rule to become usable only after unit/population compatibility checks, policy approval, executable tests, safety validation, and replayable lineage exist.

## Lane conclusion

The Strength lane has a strong *indexing and design foundation*: explicit claim IDs, a formula/policy registry, transparency boundaries, test vectors, and architecture. It does not yet contain verified primary evidence or a validated runtime rule set. The Conditioning lane has unusually useful structured synthesis for five modalities, strongest for air-bike evidence boundaries and device/data contracts, but its exact progression transitions remain product heuristics and its source observations are not table-level extractions. Duplicates, stale product naming, external-AI runtime material, proprietary-product unknowns, and unsupported universal constants must be kept visible rather than silently normalised away.
