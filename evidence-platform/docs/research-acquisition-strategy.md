# Research acquisition strategy: growing real coverage toward the roadmap's scale

29 August 2026. `docs/research-roadmap.md` already names a "5-15 million-line
evidence corpus" as a long-term storage/coverage ambition, but the same
document is explicit that this is "a storage/coverage ambition, not a
quality metric" and warns that "large PDFs, duplicate archives and
generated prose must not inflate progress." This plan takes that warning
seriously: it is a strategy for acquiring real, licensable, relevant
primary literature at meaningful scale - not a plan to hit a line-count
number by any means. Where a number appears below, it was queried live
against a real external source on 29 August 2026, not estimated.

## What's actually reachable from this session, confirmed live

This environment's outbound HTTPS (`curl` via the pre-configured agent
proxy) can reach Europe PMC's public REST API - no key, no login required:

```
GET https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=<query>&format=json
GET https://www.ebi.ac.uk/europepmc/webservices/rest/<PMCID>/fullTextXML
```

Confirmed this session: a real search returns real, current (2026) hits
with PMID/DOI/title/journal and, critically, `isOpenAccess`/`inEPMC`/
`license` fields per result - so open-access, actually-fetchable,
actually-relicensable articles can be distinguished from paywalled ones
*before* fetching anything. A real open-access full text
(`PMC13300969`, license `cc by`) fetched clean in one call. This is the
same category of source PMC itself describes as the "PMC Open Access
Subset" - 3.4-6+ million articles, several licenses (CC-BY, CC-BY-NC,
CC0, etc.), each with different reuse terms that matter for what this
corpus can store and redistribute.

**This changes the acquisition plan from "hypothetical future research" to
something this AI can actually execute now**: search a domain-specific
query, keep only `isOpenAccess:y` hits, fetch full text for the ones with
`inEPMC:Y`, record the per-article license, convert to the same
line-oriented markdown/text format `sources_typed`/`document_chunks`
already expects, and hand it to `ingest.py` and `research/candidate_extraction.py`
exactly as today's archive is handled - untrusted, candidate-only, same as
everything else in this corpus.

## Real per-domain ceiling, queried live

Five domain-scoped open-access queries, hit counts as of 29 August 2026:

| Domain | Query focus | Open-access hits |
|---|---|---|
| Strength | resistance/strength training progression, periodization, RPE | 17,866 |
| Recovery | HRV, sleep, overtraining, athlete recovery | 47,429 |
| Conditioning | aerobic/interval/concurrent training progression | 7,912 |
| Nutrition | sports nutrition, energy availability, protein intake (athlete) | 2,762 |
| Coordinator | multi-objective optimization / training load management (athlete/sport) | 308 |

This is itself research-plan-relevant evidence, not just a capacity number:
**coordinator has almost no literature to acquire in the first place** -
308 hits for a broad query is a small pool, and confirms
`docs/research-plan-five-engines.md`'s finding from the other direction:
coordinator was never going to be solved by acquiring more papers, because
there mostly aren't papers to acquire. Recovery and strength have the
deepest pools; nutrition's narrower count likely reflects query wording
more than real scarcity and would benefit from broader terms before
concluding it's thin.

## Reframing "1-3 million lines"

Using this corpus's own existing markdown source files as a baseline (215
files, 65,174 lines, ~300 lines/file average), a full-text article
converted to the same clean markdown shape lands in a comparable range.
1-3 million lines is therefore roughly 3,000-15,000 full articles - a real
number, achievable against the pools above, but the actual bottleneck was
never fetching capacity. It's what happens after: **every acquired article
lands as an untrusted candidate**, exactly like the 86 claims already
sitting at `extracted_untrusted_pending_source_validation` today. Fetching
15,000 more articles without growing review throughput doesn't move
anything toward `active` - it grows the exact backlog
`docs/PRE-RESEARCH-STATUS.md` already reports. So the target this plan
actually optimizes for is **curated, licensed, triaged volume paced by
real review capacity** - not raw fetch count.

## Phased plan

### Phase A - prove the pipeline on real new content (small, next 1-2 sessions)

Pull a small, curated batch - not a bulk dump - for the domain best
positioned to use it: strength, which already has 66 triaged claims and a
scoped research question (`docs/phase3-strength-session-gate-research-brief.md`).
Concretely: run the query above, sort by relevance/citation count, take
the top ~30-50 open-access hits, fetch full text for the ones with
`inEPMC:Y`, record license per article, convert to markdown, ingest, run
`research/candidate_extraction.py` against them. This proves the full
acquisition -> ingest -> triage loop end to end on genuinely new material
(not the pre-packaged archive) at a scale small enough to review the
output by hand before trusting the mechanism with anything larger. This is
real, external network activity and real new files committed to the
corpus - not something to run unattended; I'd want to actually do this
batch with you watching the first pass, not as a background loop.

### Phase B - scale per domain against its real ceiling

Once Phase A's mechanism is proven: conditioning and recovery have large
real pools (7,912 and 47,429) and zero existing claims - they get the most
marginal value from acquisition specifically. Nutrition needs query
broadening first (its narrow count may be an artifact of the query terms
used here, not the domain). Each domain's batch size should be set by how
fast source_verification review can actually keep up - acquiring faster
than that just relabels the backlog problem, it doesn't solve it.

### Phase C - coordinator does not belong in this plan

308 hits confirms `docs/research-plan-five-engines.md`'s earlier
conclusion from a different angle: coordinator's gap isn't literature
coverage, it's an unmade policy decision
(`platform_core/arbitration.py`'s own docstring: resolving a real
cross-domain conflict needs a reviewed policy, not a citation). Spending
acquisition effort here would be optimizing the wrong bottleneck.

## What this AI can and cannot do here

Can, with your go-ahead each time: run the domain-scoped searches, filter
to open-access, fetch and convert full text, record license terms
faithfully, ingest as untrusted candidates, run the existing triage tool
against them. Cannot: decide any article's claims are verified, review its
methodology with actual subject-matter authority, or shortcut the two-
independent-reviewer gate by acquiring more material faster. Volume was
never this project's bottleneck - review capacity is, and no acquisition
strategy changes that.
