# Acquisition batch 2 — 30 August 2026

Second research-acquisition pass, following
`docs/research-acquisition-strategy.md`'s proven pipeline (search Europe PMC
live, keep only open-access hits, verify existence, extract an evidence note
from the article's own abstract) and expanding it per the user's explicit
instructions: peer-review status does not gate acquisition, and named
practitioner/vendor sources (EliteFTS, Jason Brown, T-Nation, Garmin,
TrainingPeaks, WHOOP) are in scope alongside academic literature.

## What this is, and is not

Everything here is `extracted_untrusted_pending_source_validation` /
research-staging only, same as every other record in this corpus. Nothing
here is verified, reviewed, owned, or promotable. No full-text PDFs are
archived for the PMC records - each note is derived from the article's own
public abstract (Results/Conclusions section), not full text.

## Counts

| Engine | Academic (Europe PMC, open access) | Practitioner/vendor |
|---|---|---|
| Strength | 35 | 2 (EliteFTS VESP method, Jason Brown - identity only, no content captured) |
| Conditioning | 30 | 1 (TrainingPeaks TSS/CTL/ATL/TSB) |
| Nutrition | 30 | 0 |
| Recovery | 30 | 2 (Garmin/Firstbeat training status, WHOOP Strain/Recovery) |
| Coordinator | 20 | 0 |
| **Total** | **145** | **5** |

Coordinator's count (20, vs. 30-35 for the sports-science engines) reflects
its real, smaller literature pool - `docs/research-acquisition-strategy.md`
already found only 308 open-access hits for its narrower decision-science
query set, versus 7,900-47,000+ for the other four.

## Methodology, including a mistake caught and fixed mid-run

Per engine: 3-4 domain-scoped Europe PMC queries (`isOpenAccess:y`), results
deduplicated against every PMC ID already used in the first acquisition
batch (60 records, `THE_Hybrid_System_25MB_EACH_TAKEOVER_HANDOFF_20260830`),
each candidate's evidence note extracted mechanically from its own
abstract's Results or Conclusions section (regex-trimmed, not freely
paraphrased) to keep the note tied to the source's own words rather than a
synthesized claim.

**First run sorted candidates by citation count and returned wrong-domain
results** - generically massive-citation methods papers (AlphaFold 3,
DESeq2, a CCP4 crystallography suite paper) matched query keywords by
incidental overlap (e.g. "calibration," "regression") rather than actual
topical relevance, and would have been miscategorized as coordinator-domain
evidence. Caught on inspection before any file was written; fixed by
tightening every query to require exercise/athlete/sport-context terms and
dropping the citation-count sort in favor of Europe PMC's relevance
ranking. Left here rather than silently corrected, because catching this
kind of error is exactly what source verification is for, and it happening
once in an automated pass is a reason to be more careful reviewing the
rest, not less.

## Practitioner/vendor sources - a different evidence tier, not a lesser check

Named sources were fetched live where the page allowed it (EliteFTS,
Garmin's own blog, TrainingPeaks' own coach blog, WHOOP's developer docs).
Two fetch failures are recorded honestly rather than worked around:
`whoop.com/us/en/thelocker/` blog URLs returned HTTP 403 to automated fetch
(WHOOP's own developer-docs page covers the same methodology and was used
instead); Jason Brown's own site is a JavaScript-rendered page with no
static text this session's fetch tool can read, and t-nation.com returned
403 for his named articles - his record (`STR-VENDOR-002`) preserves only
that he and specific article titles are real and where they live, with
**no methodology content claimed on his behalf**, since none was actually
read.

Every vendor source carries an explicit numeric-threshold warning where
relevant (TrainingPeaks' TSB bands, in particular) - these are the vendor's
own marketed guidance, not independently validated science, and this
project's own rules already forbid adopting a number like that without
review (see `docs/phase3-strength-session-gate-research-brief.md` for the
same boundary applied to strength, and `platform_core/engines/recovery.py`
for why a vendor recovery/readiness score specifically is exactly the shape
of thing that engine's hard "no HRV gate" rule exists to keep out).

## Where this fits the existing research plan

`docs/research-plan-five-engines.md` found conditioning, nutrition,
recovery and coordinator had zero extracted claims; batch 1 (60 records)
and this batch (150 records) together put roughly 210 candidate sources in
front of a future reviewer across those four domains plus strength. None
of it changes the actual bottleneck named in that plan: two independent
human reviewers doing real source verification and domain review. This
batch makes that queue longer, deliberately, on the reasoning that a
larger, honestly-tiered candidate pool is more useful to a reviewer than a
small one - not a claim that acquisition volume itself is progress.
