# Research mission

## Primary question

What current, high-quality evidence and authoritative guidance should inform deterministic decisions in Strength, Conditioning, Nutrition, Recovery, and cross-domain Coordination for a hybrid-training athlete app?

## Required research behavior

1. Browse for current sources; do not rely only on model memory.
2. Prefer primary and authoritative sources:
   - systematic reviews and meta-analyses;
   - consensus statements and professional guidelines;
   - randomized or controlled trials where appropriate;
   - well-designed longitudinal or observational research;
   - validated measurement and monitoring literature;
   - official safety or public-health guidance.
3. Record direct links, publication dates, authors or issuing bodies, source type, population, and relevant locations.
4. Identify retractions, corrections, contradictory findings, population limitations, and dates when guidance may have become stale.
5. Avoid long copyrighted reproductions. Capture metadata, short necessary excerpts, paraphrased claims, and precise page/section references.
6. Separate evidence from product policy.
7. Never turn association into causation without support.
8. Never generalize a result beyond its studied population without flagging the inference.
9. Treat health, injury, illness, and nutrition safety claims as high-stakes and apply stricter sourcing.

## Deliverables from the first research pass

### A. Five research maps

For each engine, provide:

- decisions it might make;
- input signals required;
- major evidence themes;
- strongest known source families;
- important disagreements or uncertainty;
- safety boundaries;
- missing product data;
- recommended depth order.

### B. Source inventory

Create a structured table with at least these fields:

```text
sourceId, engine, decisionQuestion, title, authorsOrBody, year,
sourceType, population, URL, accessStatus, qualityTier,
keyContribution, limitations, reviewStatus
```

### C. Initial claims

Draft atomic claims using `templates/evidence-claim.yaml`. Claims must be narrow, qualified, and cited.

### D. Candidate policies

Show examples of how reviewed claims might inform product policies. Label every threshold or precedence choice that is not directly established by evidence.

### E. Research backlog

Prioritize remaining work using:

- decision impact;
- potential harm if wrong;
- evidence uncertainty;
- source availability;
- whether the app currently measures the needed inputs.

## Source-quality tiers

- **Tier A:** authoritative guidelines, consensus statements, systematic reviews, meta-analyses, and measurement standards.
- **Tier B:** strong primary studies directly relevant to the target decision and population.
- **Tier C:** indirect studies, adjacent populations, mechanistic evidence, or high-quality expert synthesis.
- **Tier D:** commercial articles, unsourced summaries, social content, anecdotes, and discovery-only material.

Tier D may help discover better sources but must not independently justify an executable rule.

