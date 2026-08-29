# Session handoff — 30 August 2026

For whoever (Cursor or otherwise) picks this up next. **Merged to `main`
at `1a249a4` (30 Aug 2026, owner-approved direct merge).** Branch
`claude/big-mac-q7xyqo` kept for history. Everything below is real and
verified; nothing described here is athlete-facing or claims to be.

## What this session built, in order

Phases 1-7 of the evidence-platform BIG MAC build-out (contract-complete
five-engine shells + Whole-Athlete State → bounded Gemini/Gemma
lead-fallback gateway → per-engine model seam → engine-scoped model
generalized to all five → cross-system candidate arbitration → shadow-mode
promotion gate → athlete-facing contract, deliberately NOT wired to the
real app). Each phase's own commit message documents its design reasoning
in full; `docs/OPERATIONS-RUNBOOK.md` indexes the operational surface each
one added.

Then, on request: a real research-acquisition pass. `docs/research-plan-
five-engines.md` and `docs/research-acquisition-strategy.md` cover the
reasoning; the short version is in the corpus counts below.

## Real corpus state right now

2,814 new source records acquired (Europe PMC open-access papers plus 5
named practitioner/vendor sources - EliteFTS, Garmin/Firstbeat,
TrainingPeaks, WHOOP), all independently verified against the live Europe
PMC API before landing, all wired into the actual `records` table with
`system` set correctly (`platform_core/ingest.py`/`hydrate.py` extended to
recognize `sources/acquired/` as a third source root alongside the frozen
original archive). Per-engine totals as of this commit:

| Engine | Sources | 
|---|---|
| Strength | 596 |
| Conditioning | 599 |
| Nutrition | 587 |
| Recovery | 545 |
| Coordinator | 637 |

**Coordinator's real evidence-backed focus turned out to be narrower than
originally designed for**: not abstract cross-domain arbitration/
uncertainty calibration, but return-to-play/return-to-sport readiness
after injury or illness. `platform_core/engines/coordinator.py`'s
docstring and `docs/research-plan-five-engines.md` were corrected to say
so explicitly. `platform_core/arbitration.py`'s actual mechanics
(structural conflict detection between domain candidates) are unaffected -
they were always domain-agnostic.

Every one of these 2,814 records is `machine_classified_needs_human_
review` / `extracted_untrusted_pending_source_validation`. None is
verified, none is reviewed, none is promoted, none is runtime-eligible.
That has not changed and nothing in this session tried to change it -
`gates.py::promotion_gate` still requires two independent human reviewers,
which is the actual, unmoved bottleneck across all five engines.

## Real mistakes made and caught this session (left visible, not scrubbed)

Documented in full in each affected file/commit, summarized here so the
next person doesn't have to dig:

1. **Sorting acquisition candidates by citation count** pulled wrong-
   domain results into coordinator (AlphaFold 3, a crystallography suite,
   RNA-seq tooling) via incidental keyword overlap. Caught on inspection
   before any file was written. Fixed by requiring sport/athlete-context
   terms in every query and switching to relevance ranking.
   (`sources/acquired/2026-08-30-batch2/README.md`)
2. **Broad decision-science query terms** (explainable AI, calibration,
   human-in-the-loop) pulled mammography classifiers, maternal nursing
   systems, mosquito density models, solar forecasting into coordinator's
   first large pull. Filtered from 500 raw hits to 104 real ones.
   (`sources/acquired/2026-08-30-batch3-large-pull/README.md`)
3. **A retry with narrower, sport-anchored terms** still leaked a few
   off-topic hits (Neandertal genetics, prenatal-mercury multi-omics) via
   an incidental context-term mention deep in an unrelated abstract.
   Fixed by requiring the match in the title specifically, not the
   abstract. (`sources/acquired/2026-08-30-batch4-coordinator-retry/README.md`)
4. **One confirmed wrong citation** in the original ChatGPT handoff batch:
   `NUT-OA-006` cites a PMCID for a different paper than the one it names.
   Flagged inline in that file rather than silently corrected or removed.
   (`sources/acquired/2026-08-30-batch1-chatgpt-handoff/nutrition/source_records/NUT-OA-006.md`)
5. **A non-idempotent migration** (`006_engine_scoped_models.sql`'s bare
   `ALTER TABLE ADD COLUMN`) crashed the CLI on its second-ever run against
   any real database file - only surfaced when this session actually ran
   the CLI twice against a real copy while pulling live corpus numbers.
   Fixed with migration-tracking in `platform_core/db.py`.
6. **`runtime/evidence.db`'s migration state changed permanently** the
   moment a real `ingest` CLI call ran against it for this session's
   wiring work (the CLI always migrates before it does anything else). A
   test that depended on the packaged db staying pre-v2-migration forever
   had to be rewritten against a synthetic fixture instead.

## Where to pick this up

- **The real bottleneck, unchanged by any of this**: two independent human
  reviewers doing actual source verification and domain review
  (`gates.py::promotion_gate`). No amount of further acquisition or
  engineering substitutes for this - see `docs/research-plan-five-
  engines.md`'s closing section.
- **Strength is closest to a real first promotion**: 66+ triaged claims
  from before this session, a scoped research question
  (`docs/phase3-strength-session-gate-research-brief.md`), and now 596
  acquired sources on top. If anything in this corpus gets promoted first,
  the existing infrastructure (per-engine model seam, shadow-gate,
  arbitration) already supports it end to end.
- **Coordinator's corpus now matches its corrected framing** (return-to-
  play), but still needs the same review gate as everything else - the
  correction changes what a reviewer would look at, not whether review is
  still required.
- **This branch is not merged.** If the next session is Cursor picking up
  fresh, it needs `git fetch origin claude/big-mac-q7xyqo` (or the PR, if
  one gets opened) before it sees any of this.

## Verification state as of this commit

182 tests pass (`python3 -m pytest tests/`, run from `evidence-platform/`).
`python3 validators/validate_platform.py` reports `PASS_PRE_RESEARCH_ONLY`
with 0 errors, against a baseline deliberately bumped to reflect the real,
current corpus size (documented inline in
`validators/validate_platform.py` itself, not silently re-recorded).
