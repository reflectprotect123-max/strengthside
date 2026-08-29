# Phase 3 research brief: strength session-progression gate

29 August 2026. Written by the AI assistant building this platform, as
research-assistant triage only — **not** a review, approval, or promotion of
any claim below. Nothing here has passed `platform_core/gates.py`'s
`promotion_gate`, which requires two independent human domain reviewers
(`reviewer_registry` / `reviews`). This document exists to save a future human
reviewer the corpus-scan step, not to replace their judgment.

## Why this document exists instead of a working Phase 3 rule

Phase 3's roadmap target is the strength engine's first real, evidence-backed
session-progression rule (progress / maintain / trim / modify / hold, per
`platform_core/engines/common.py::ALLOWED_ACTIONS`). Getting a rule to
`active` status requires two independent human reviewers to approve it through
`reviewer_registry` / `reviews` — there is no code path around that gate, and
the System Constitution's ban on the AI acting as decision-maker means I
cannot fill either reviewer seat myself. That's not a limitation of this
session's time or tooling; it's the gate working as designed.

I also attempted to use the bounded research-assistant tool
(`research/candidate_extraction.py`, built and approved earlier this session)
against the real corpus excerpt at
`sources/original-archive/THE-Hybrid-System-Master-Evidence-Archive-2026-08-28/01-strength/THE_Hybrid_Strength_Claim_Matrix.md`
to produce a fresh triaged candidate. Both attempts hit
`google/gemma-4-31b-it:free is temporarily rate-limited upstream`
(`limit_source: upstream_provider_shared_pool`) — this is free-tier OpenRouter
capacity, not a bug in the tool. So this brief is a manual compilation of
`claims/claim-registry.csv` rows already extracted in an earlier pass, not new
LLM-assisted extraction.

What I scoped Phase 3 to instead, and did complete: per-engine model-artifact
loading (`platform_core/runtime_artifacts.py`,
`platform_core/engines/common.py::load_active_engine_model`), the strength
engine's seam for applying a future active model
(`platform_core/engines/strength.py`), and an offline shadow-mode comparison
harness (`platform_core/shadow.py`) so that whenever a rule *does* clear the
review gate, there's already a tested path to run it in shadow before it can
touch anything. None of that required inventing or approving scientific
content.

## Corpus claims relevant to the session-progression question

All rows below are `system=strength`, `review_status=
extracted_untrusted_pending_source_validation` in `claims/claim-registry.csv`
— extracted, not verified. `normalized_status` for every one is
`scientific_or_product_claim_unverified`. PMIDs are the claim's own cited
source, not independently checked by me. Full text of each is in the CSV,
keyed by `claim_id`; the summaries below trim
`implementation_or_status_as_documented` to what's relevant here.

### Autoregulation signal (RPE/RIR) — most directly on-question

- **S-020** (Moderate/High) — RPE/RIR can regulate loading but relies on
  calibration. [PMID 26049792](https://pubmed.ncbi.nlm.nih.gov/26049792/) ·
  [PMID 29628895](https://pubmed.ncbi.nlm.nih.gov/29628895/)
- **S-033** (Moderate/High) — RIR autoregulation can improve strength versus
  fixed-percentage loading, but RIR accuracy is imperfect.
  [PMID 31009432](https://pubmed.ncbi.nlm.nih.gov/31009432/) ·
  [PMID 36135029](https://pubmed.ncbi.nlm.nih.gov/36135029/)
- **S-007** (High, product fact not a citation) — RIR is 0–6+, optional but
  recommended, and needs individual calibration (MacroFactor's own public
  documentation).

Read together: any session-progression rule keyed on RIR/RPE needs an
explicit calibration/confidence signal per athlete, not a raw RIR value — the
literature itself flags RIR accuracy as imperfect.

### Volume progression

- **S-021** (High) — Volume has a graded relationship with hypertrophy, with
  individual diminishing returns.
  [PMID 27433992](https://pubmed.ncbi.nlm.nih.gov/27433992/)
- **S-031** (Moderate/High) — More weekly set volume associates with more
  strength and hypertrophy, with diminishing returns.
  [PMID 41343037](https://pubmed.ncbi.nlm.nih.gov/41343037/)
- **S-061** (High as published framework, Moderate as current-app identity) —
  RP's published concrete framework: 1–4 recovery/performance scores, +2–3
  sets on excellent, +1 on moderate, maintain under rising fatigue,
  recover/deload after severe performance loss. [RP volume landmarks
  (public blog, not peer-reviewed)](https://rpstrength.com/blogs/articles/training-volume-landmarks-muscle-growth)

S-061 is the closest thing in the corpus to a ready-made decision table
shaped like this engine's action vocabulary (progress/maintain/trim/hold map
fairly directly onto "+sets / maintain / deload"). It is a vendor's published
policy, not a peer-reviewed result — flagged explicitly in its own
`confidence_as_documented` split. A reviewer should decide whether it's usable
as a cited starting policy or only as background.

### Frequency (secondary — affects how volume claims get applied)

- **S-032** (Moderate/High) — Frequency is mainly a volume-distribution
  variable for strength when volume is equated; hypertrophy evidence supports
  roughly two exposures more clearly than one.
  [PMID 27102172](https://pubmed.ncbi.nlm.nih.gov/27102172/) ·
  [PMID 29470825](https://pubmed.ncbi.nlm.nih.gov/29470825/)

### Deload / recovery-triggered regression

- **S-034** (Moderate) — Deload practice is common at roughly 5–6 week
  intervals, but survey evidence does not establish a universal causal
  interval — explicitly warns against hard-coding a calendar rule.
  [PMID 38499934](https://pubmed.ncbi.nlm.nih.gov/38499934/)

This directly argues against a fixed-week deload timer as the "trim"/"hold"
trigger; an evidence-triggered signal (from S-061-style performance/recovery
scoring) is what the cited literature actually supports.

### Set-to-failure policy (bears on `modify` vs `trim`)

- **S-018** (Moderate/High) — Failure is not clearly superior to nonfailure
  for hypertrophy, and produces more fatigue in some studies.
  [PMID 36334240](https://pubmed.ncbi.nlm.nih.gov/36334240/) ·
  [PMID 38393985](https://pubmed.ncbi.nlm.nih.gov/38393985/)
- **S-004** (High, product fact) — MacroFactor's public example uses a
  midpoint rep target plus RIR as expected nonfailure performance.

### Periodization (goal-mode framing, background)

- **S-019** (High) — Periodization may benefit 1RM strength more than
  hypertrophy when volume is equated.
  [PMID 35044672](https://pubmed.ncbi.nlm.nih.gov/35044672/)

### Velocity-based training (out of scope for a first rule, noted for later)

- **S-037** (Moderate) — Velocity-loss thresholds trade strength-oriented
  fatigue control against hypertrophy-oriented relative volume; the claim's
  own implementation note says support this only as an optional
  device-measured signal, never inferred from reps.
  [PMID 35038063](https://pubmed.ncbi.nlm.nih.gov/35038063/) ·
  [PMID 36178597](https://pubmed.ncbi.nlm.nih.gov/36178597/)

## What a human reviewer would need to do from here

1. Independently pull and read the primary sources above (PMIDs given, not
   re-verified by this pass).
2. Decide whether S-061's published framework is an acceptable cited starting
   policy for a first rule, or whether the peer-reviewed volume/RIR claims
   (S-020, S-021, S-031, S-033) should be synthesized into a new policy
   instead.
3. Draft the actual rule as a `records` table `draft` row with its evidence
   citations attached, per the existing promotion pipeline.
4. Get a second, independent human reviewer. Neither reviewer seat can be
   filled by this AI.
5. Only after both approvals does the rule become eligible to move toward
   `validated_offline` → `shadow` (where `platform_core/shadow.py`, built this
   session, can run it against golden cases before it can touch anything) →
   `limited_release` → `active`, per
   `docs/scopes/NON-LLM-AI-DESIGN-SCOPE.md` section 11.

No claim in this document should be read as validated, and none of it has
been promoted. It is a starting point for review, nothing more.
