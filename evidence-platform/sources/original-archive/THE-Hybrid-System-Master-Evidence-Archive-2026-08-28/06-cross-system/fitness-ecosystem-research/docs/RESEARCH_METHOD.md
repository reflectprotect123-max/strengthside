# Research method and limitations

## Questions researched

1. Is the two-app split architecturally defensible?
2. Where should recovery, sleep, life stress, pain, illness, and wearable data live?
3. What must change for two independently released clients to share one athlete safely?
4. What evidence supports or limits HRV, sleep, concurrent training, pain monitoring, and illness handling?
5. What Australian privacy/regulatory boundaries matter?
6. How should Claude Code, worktrees, plugins, agents, and MCP be used safely?

## Source selection

Priority was given to:

- official Claude Code, Git, Android, Expo, Supabase, PostgreSQL, WHOOP, OAIC, and TGA documentation;
- PubMed-indexed primary studies, systematic reviews, and consensus statements;
- OWASP verification standards.

Product architecture recommendations are labeled as decisions or heuristics rather than presented as scientific findings.

## Interpretation rules

- A study about endurance HRV-guided training does not validate a strength-training block threshold.
- A condition-specific pain-monitoring model does not validate a universal pain score.
- A consensus statement informs a monitoring framework but does not prove a product algorithm.
- A provider API documents what may be available, not what every user has authorized or what is clinically valid.
- Official platform documentation is version-sensitive; re-check at implementation time.
- Line counts, file paths, existing bugs, and deployment facts from the supplied plan are not independently verified here.

## Known limitations

- No access to the real `the-hybrid-engine1` source during package creation.
- No production schema, event volume, conflict telemetry, device matrix, or store account was inspected.
- No clinical review of the actual user-facing pain/illness questions was performed.
- No legal opinion was obtained on Australian Privacy Act, TGA, or cross-border vendor obligations.
- No product-specific validation study exists for the proposed Whole-Athlete State or Coordinator heuristics.

## Required next research

Phase 00 must connect every supplied claim to a real file/test/query. Phase 02 must validate data quality and state behavior against real historical fixtures. Phase 07 must obtain privacy, regulatory, clinical, accessibility, and device reviews.
