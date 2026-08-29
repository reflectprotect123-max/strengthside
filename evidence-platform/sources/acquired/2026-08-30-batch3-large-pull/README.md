# Acquisition batch 3 — large pull, 30 August 2026

Requested: 500 sources per engine. Delivered: 500 for strength,
conditioning, nutrition and recovery; **104 for coordinator**, and that
shortfall is deliberate, not a shortfall in effort - see below.

## Counts (this batch only)

| Engine | Delivered |
|---|---|
| Strength | 500 |
| Conditioning | 500 |
| Nutrition | 500 |
| Recovery | 500 |
| Coordinator | 104 |

Combined with batches 1 and 2, running totals per engine now stand at 559
(strength), 541 (conditioning), 540 (nutrition), 540 (recovery), 134
(coordinator).

## Why coordinator did not reach 500 - a caught and corrected mistake

The first pass at coordinator's broadened queries (generic terms:
"explainable AI," "decision support system," "calibration," "human-in-
the-loop") *did* return 500 raw hits from Europe PMC. Spot-checking a
random sample before writing anything caught that a large fraction were
genuinely unrelated to this system - mammographic cancer classification,
maternal nursing decision systems, mosquito density prediction, solar
power forecasting, protein-ligand modeling software. These terms are used
across all of applied machine learning, not just sport or decision science
for athletes, and citation/relevance ranking alone did not filter them
out.

Filtered in two passes: first requiring athlete/sport/exercise/coach/
fitness context in the title or evidence note (500 to 161), then dropping
weak matches where "training" or "fitness" appeared in an unrelated
clinical sense (ICU mortality, radiotherapy, gastroenterology training
programs) and requiring a stronger sport-specific term (161 to 104). The
result skews toward sports-monitoring, injury epidemiology and athlete
data-management literature more than the original narrower "cross-domain
arbitration" angle from batch 2 - a real reflection of where the
literature actually sits, not a deliberate narrowing.

**104 is the honest ceiling for this query strategy, not a partial
result that more searching would fix by orders of magnitude.**
`docs/research-acquisition-strategy.md` already found only 308 raw hits
for coordinator's original narrow query; broadening into generic
decision-science terms trades relevance for volume in a way that fails
the same test batch 2 already applied to citation-count sorting. Reporting
104 honestly here is the same choice as reporting the earlier
citation-sort bug in batch 2's README, rather than padding to a number
that was asked for but does not exist as real, relevant, non-duplicate
research content.

## Method (unchanged from batch 2, extended with pagination)

Per engine: 10-12 domain-scoped Europe PMC queries (`isOpenAccess:y`),
paginated via `cursorMark` up to 300 results per query, deduplicated
against all 184 PMC IDs already used across batches 1 and 2, each
evidence note mechanically extracted from the article's own abstract
Results/Conclusions section. Same research-staging-only status as every
other record in this corpus; nothing here is verified, reviewed, or
promotable.
