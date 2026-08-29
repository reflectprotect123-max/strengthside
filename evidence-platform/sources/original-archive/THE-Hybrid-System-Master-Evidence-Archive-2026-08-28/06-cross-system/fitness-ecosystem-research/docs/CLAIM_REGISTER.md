# Claim register and implementation status

This register is designed to stop a model or developer from turning a useful research observation into an unsupported product promise.

| ID | Claim or rule | Grade | Status | Source/verification | Implementation consequence |
|---|---|---|---|---|---|
| CR-001 | Separate Strength and Conditioning domains have different decision variables. | B/C | adopted architecture | supplied plan; domain analysis | separate packages/contracts |
| CR-002 | A shared TypeScript package does not protect old deployed binaries from server incompatibility. | A | adopted architecture | S1, S7–S10 | server version/ownership boundary |
| CR-003 | Local-first UI should read from local data and sync in the background. | A | adopted architecture | S1, S4–S6 | repository/outbox design |
| CR-004 | Full event sourcing is not required for every internal record. | A/C | adopted architecture | S9 plus complexity trade-off | events for integration/audit, tables/snapshots for views |
| CR-005 | Supabase RLS must be enabled/tested for exposed data. | A | release gate | S10–S12 | positive/negative identity tests |
| CR-006 | WHOOP recovery/HRV/RHR/sleep data depends on OAuth scopes and provider terms. | A | integration constraint | W1–W4 | persist provenance; handle missing/revoked access |
| CR-007 | HRV-guided training has conditional evidence, especially in endurance contexts. | A/B | advisory only | E1–E8 | one advisory input; no universal threshold |
| CR-008 | HRV is not validated as a pain or tissue-integrity gate. | B | hard invariant | E1–E9; prior evidence review | never clears pain hold |
| CR-009 | Sleep/stress context is useful but does not produce one universal readiness cutoff. | B | adopted boundary | E17–E21 | soft constraints, data quality |
| CR-010 | Concurrent training interference is context-specific; explosive strength may be more sensitive. | A/B | Coordinator rule input | E10–E16 | interference tags, not blanket prohibition |
| CR-011 | Pain-monitoring evidence is condition-specific and cannot justify an app-wide pain threshold. | A/B | safety boundary | E25–E27 | pain route separate from fatigue |
| CR-012 | Illness requires a manual/safety pathway rather than inferred diagnosis. | A/B | safety boundary | E22–E24; R6–R9 | explicit illness state and review route |
| CR-013 | Health and wearable data should be treated as sensitive. | A | security baseline | R1–R5 | access, retention, logs, deletion |
| CR-014 | Wellness/coaching exclusions depend on intended purpose and all multi-function features. | A | regulatory gate | R6–R9 | claim review before release |
| CR-015 | Claude Code plugins/MCP can execute/read/write; source and permissions must be trusted. | A | operating rule | C2–C5 | staged, least-privilege installs |
| CR-016 | Current line counts, file paths, bug locations, and deployment identifiers are accurate. | D | unverified | supplied plan only | baseline audit required |
| CR-017 | “Two missed sessions means deload” is a validated universal rule. | D | rejected | no suitable evidence identified | do not hard-code |
| CR-018 | “Readiness under X blocks heavy lifting” is a validated universal rule. | D | rejected | no suitable evidence identified | use bounded context + constraints |
| CR-019 | Conditioning-first is the safest public launch. | D/C | rejected as assumption | risk analysis | private canary only |
| CR-020 | The Coordinator should be the only writer of a combined weekly plan. | C | adopted architecture | consistency/ownership reasoning | server permission + plan version |

## Evidence gaps to research later

- product-specific validation of any state thresholds;
- device/protocol reliability for the exact WHOOP/phone population;
- actual user conflict frequency and migration volume;
- performance effects of the product’s exact Strength/Conditioning schedule;
- privacy/legal analysis of coach access and cross-border vendors;
- clinical review of pain/illness screens and escalation copy;
- accessibility and inclusive design with actual users.
