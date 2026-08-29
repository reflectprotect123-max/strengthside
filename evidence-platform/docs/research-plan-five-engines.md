# Research plan: getting a first real rule for each of the five engines

29 August 2026. This is a plan for what research work is actually needed,
grounded in the current corpus state (queried directly, not estimated) - not
a claim that any of it has been done. Nothing here moves a claim toward
`verified`, decides an arbitration policy, or fills either of the two
independent-reviewer seats `gates.py::promotion_gate` requires; those stay
this project's human owner's job, per the Constitution's explicit ban on
this AI acting as decision-maker or reviewer of its own work. What follows
is: where each domain actually stands today, and what the next concrete
action is - and the five domains are **not** at the same starting point, so
they don't get the same plan.

## Current ground truth (queried from the real corpus, 29 August 2026)

| Domain | Claims (records) | Formulas | Source files | Rule candidates |
|---|---|---|---|---|
| Strength | 66 | 11 | 34 | most of the 7 registered candidates draw on strength content |
| Conditioning | 0 | 0 | 47 | 0 |
| Nutrition | 0 | 22 | 47 | 0 (the 7 candidates are nutrition-shaped product rules, but none has an extracted scientific claim backing it) |
| Recovery | 0 | 0 | 5 | 0 |
| Coordinator | 0 | 0 | 3 | 0 |
| Cross-system | 20 | - | 127 | - |

Every one of the 7 registered rule candidates fails `promotion_gate` on the
identical 9 blockers today: `source_not_verified`, `domain_review_missing`,
`independent_reviewers_missing`, `open_contradictions_unresolved`,
`owner_missing`, `tests_missing`, `input_contract_missing`,
`output_contract_missing`, `evidence_links_missing`. Zero models are
registered anywhere. This matches `docs/PRE-RESEARCH-STATUS.md` exactly -
nothing has moved since that snapshot.

The load-bearing fact this table makes visible: **only strength has been
through claim extraction at all.** Nutrition has candidate *formulas* (raw
equations, e.g. from MacroFactor's public documentation) but zero of them
have a matching extracted *claim* record - a formula is not evidence, it's
a candidate implementation of evidence that doesn't exist yet in this
system. Conditioning, recovery and coordinator have neither - their 47, 5,
and 3 source files respectively have never been run through extraction at
all. `docs/five-system-gap-report.md`'s "Have" column names real source
material for all five domains, but "have source material" and "have
extracted claims" are different states, and the gap report doesn't say
which domains are still stuck at the first one. This table does.

## Why the five domains need different plans, not one plan

### Strength - closest to a real promotion attempt

66 claims already extracted, all at
`extracted_untrusted_pending_source_validation`. A Phase 3 pass
(`docs/phase3-strength-session-gate-research-brief.md`) already narrowed 33
of those to the exact question "what session-progression rule can this
system defend" and flagged 9 of them with real, checkable PMIDs (RIR/RPE
autoregulation, volume progression, deload timing, failure policy). The
per-engine model seam this domain needs to run a real rule already exists
(`platform_core/engines/strength.py`, Phase 3/4) and so does the shadow-gate
that would have to pass before it could reach `active`
(`platform_core/gates.py`, Phase 6).

**Next action is verification, not extraction.** Someone needs to actually
pull the 9 PMID-backed sources named in the Phase 3 brief and check the
claim text against them - `add_review(db, "claim", <id>, "source_verification",
"verified"|"rejected", reviewer_id)`. This is real work (reading papers,
not running a script) but it is the single most leveraged next action
available anywhere in this corpus: strength is the only domain where
verification, not extraction, is the bottleneck.

### Nutrition - has formulas, has no claims to back them

22 candidate formulas exist (mostly MacroFactor's publicly documented
behavior - progressive overload logic, RIR-based expected performance,
Smart Progression options) but none of them cites a verified scientific
claim, because none has been extracted yet. **Next action is extraction,
not verification** - the opposite bottleneck from strength. The
`research/` package built this session
(`research/candidate_extraction.py`) exists for exactly this: point it at
`sources/original-archive/.../03-nutrition/` (47 files) and produce
candidate claim records the same shape as `claims/claim-registry.csv`'s
strength rows, for a human to then verify. It is bounded by the same
free-tier OpenRouter rate limiting documented in
`docs/OPERATIONS-RUNBOOK.md`; running it may take several sessions rather
than one.

### Conditioning - same bottleneck as nutrition, different topic

47 source files (`hybrid-engine-research/` progression-science and
load-increment briefs), zero extraction. Same next action as nutrition:
run the extraction tool against this domain's source files. The gap
report's named primary-source targets (intensity distribution,
progression/regression, device validity, hybrid interference) are a
reasonable place to start once candidates exist to triage against them.

### Recovery - same bottleneck, plus a real provenance problem

5 source files, zero extraction - but `docs/five-system-gap-report.md`
already flags this domain as "the weakest-provenance lane": the 5 documents
are AI-authored synthesis/audit/handoff writeups, not primary sources
themselves. Running extraction here will produce candidates whose
`source_boundary_as_documented` cites PMIDs *second-hand* (a synthesis
document citing a paper, rather than the paper itself). **The plan here has
an extra step the other domains don't**: after extraction, a reviewer needs
to trace each candidate's cited PMID back to PubMed directly and confirm it
says what the synthesis document claims it says, before source_verification
can honestly pass. Expect a much higher quarantine/rejection rate here than
in strength or nutrition - that would be the review process working
correctly, not a sign anything is broken. This is also the one domain
`recovery.py`'s own docstring already binds by policy regardless of what
research eventually says: no HRV gate, no universal readiness score, pain
and illness stay safety flags never readiness penalties, whatever a future
recovery rule looks like.

### Coordinator - not primarily a research problem at all

3 source files, described as architecture concepts, not evidence
(`docs/five-system-gap-report.md`: "owned arbitration policies... feasible-
set definition, objective functions and validation data" are what's
missing). This is different in kind from the other four: `platform_core/
arbitration.py` (Phase 5) already established that resolving a real
cross-domain conflict needs "a reviewed policy," not a published study -
there is no PMID that tells you whether strength or recovery should win a
disagreement. **The next action for coordinator is a policy-owner decision
and review, not literature extraction.** Someone with the authority to own
that tradeoff needs to write down an actual arbitration policy (a
`record_type="policy"` row, of which 6 already exist in the corpus - worth
reading before drafting a new one) and take it through `domain_review`,
same as any other candidate, but the "evidence" behind it is a considered
judgment call, not a citation.

## Recommended sequencing

Given the infrastructure that already exists (per-engine model seam,
shadow-gate enforcement, arbitration, athlete-facing contract - Phases
3-7), **strength is the domain closest to a real, defensible end-to-end
promotion**, and finishing it first would prove the whole pipeline works
on real content rather than only synthetic fixtures:

1. Verify the 9 PMID-backed strength claims from the Phase 3 brief
   (source_verification stage).
2. Register a second, genuinely independent domain reviewer
   (`reviewer_registry`) if one isn't already active - `promotion_gate`
   requires 2 distinct reviewers across `source_verification` and
   `domain_review`, and both need real subject-matter judgment, not two
   accounts run by the same person.
3. Draft the actual rule as a `records` row (`record_type="rule"`) citing
   the verified claim ids, with an owner, input/output contracts and tests
   - `promotion_gate`'s blockers name exactly what's missing.
4. Get `domain_review`, resolve any open contradiction affecting it
   (15 exist in the corpus today; check which, if any, touch strength).
5. Only after both approvals: `offline_validated -> shadow` (this needs a
   real `shadow_report` per Phase 6's gate, not a synthetic one) `-> active`.

Nutrition and conditioning extraction can run in parallel with strength's
verification - they don't block each other. Recovery's extra
source-tracing step and coordinator's policy-ownership step are both
lower-leverage right now: neither can produce a promotable candidate until
a person, not a script, does the judgment work each one specifically needs.

## What this AI can and cannot do here

Can: run the extraction tool (bounded by rate limits, never self-approving
its own output), compile triage briefs like this one and Phase 3's, build
and test the infrastructure each stage needs. Cannot: verify a claim
against its source with reviewing authority, be either of the two
independent reviewers, or decide coordinator's arbitration policy. Those
three are the actual bottleneck, in every domain, and no amount of further
engineering substitutes for them.
