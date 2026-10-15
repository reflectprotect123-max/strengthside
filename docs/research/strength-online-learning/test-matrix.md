# Mandatory strength integration test matrix

This is the test contract, not a record of passing execution. Each row needs evidence at the reviewed commit. Unit tests check mathematical invariants, database tests check real authorization, browser tests check app wiring, and APK tests check native behavior; no layer substitutes for another.

## Functional coverage

| ID | Meaningful case | Required assertions | Layers / task |
|---|---|---|---|
| M1 | 15/20 kg bars, empty bar, old total load | Correct physical mass, reversible display, legacy ambiguity excluded, unchanged raw actual | Unit, adapter, browser, APK / 1,2,5,9,12 |
| M2 | Dumbbells 1–10 then 2.5 kg steps; gym-specific manual values | Per-hand semantics, feasible suggestions, off-grid actual retained, coarse reductions safe | Unit, property, browser / 1,5,9 |
| M3 | 3×6–8, all 6/Average | No earned next-session increase; all 8/acceptable effort can earn increase | Unit, replay, full browser session / 5,6,9 |
| M4 | Arbitrary 10/8/6, 5/3/1, ascending and mixed ranges | Authored target IDs/reps preserved; correct projected target; one-rep target isn't max test | Unit, simulator, browser / 5,9,10 |
| M5 | All slider bins, missed reps, double submit | Easy directional only; Hard/miss guards; one fact per logged set; visible weight matches decision | Unit, browser / 3,5,9 |
| M6 | Two ramp sets with later Hard or miss | Exactly two main ramps; today adjusts; no long-term ramp evidence; no warmup floor overrides work | Unit, replay, browser / 4–6,9 |
| M7 | Populated/empty/stale next-row kg | Same canonical guards applied; prefilled value cannot bypass caps; input rows immutable | Unit, actual-path simulator / 5,10 |
| M8 | AMRAP at first working actual | Ignores ramps; tracks edits before logging; completed AMRAP unchanged after source edit; no fitting | Unit, browser, APK / 4–6,9,12 |
| M9 | High reps, null/blank/NaN/negative, zero vs absent | Targets remain authored; no invented zero; finite valid fallback; no curve extrapolation outside domain | Unit, fuzz, browser / 1,3,5,9 |
| M10 | 33X1 vs 20X1 and formatting aliases | Same notation aliases share history; different tempos do not pool; unknown is separate; no fixed X time | Unit, replay, alternating-week simulator / 2,4,10 |
| M11 | Weighted dips, bodyweight chins, timed holds, carries, distance | All selected metrics save/reload; no fake system-load e1RM or invented body mass; added load preserved | Unit, browser, APK / 1,5,9,12 |
| M12 | Every selected metric/keypad; calendar delete | Builder/logger style consistent; dash only for ranges; no missing metrics or ghost day item | Browser, existing regression suites / 9 |
| M13 | Rest selection, auto-start, Next, back, lock/resume | Existing approved timer behavior preserved; no invented rest observations; no duplicate set | Browser, physical APK / 9,12 |
| M14 | Finish/reopen/edit/delete/import older session | Latest facts replay deterministically; unfinished sessions excluded from slow fit; summaries not double counted | Unit, IO, browser / 4,6,7,9 |
| M15 | Offline/reload/kill/reconnect/lost ack/new edit while sending | Durable facts and pending revisions survive; no duplicate teaching or lost newer actual; stale cache invalidated | Unit, browser, real DB, APK / 7–9,12 |
| M16 | Account A/B, stale JWT, two-device conflicting edits | No cross-owner reads/writes/cache; preserve both intents on conflict; candidate disabled for affected context | Real DB, IO, browser, APK / 7–9,12 |
| M17 | Old/new clients, payload revisions, malformed/oversized batches | Old RPC contract supported; atomic rejection; tombstone/revision semantics maintained | Real local Supabase, staging APK / 8,12 |
| M18 | Too little or repetitive evidence, biased/noisy effort, long gap | Default until identifiable; bounded updates; no forced claim of personal confidence after X sessions | Unit, held-out simulation / 3,4,10 |
| M19 | Default/shadow/online/rollback, corrupt model, missing dependency | Shadow output equals default; failure preserves logging; rollback retains facts/outbox; no athlete toggle | Adapter, browser, staging / 11,12 |
| M20 | Large history, repeated render, multiple context keys | Bounded fit, fingerprint cache, owner invalidation; no interaction-blocking refits | Operation-count tests, profiled device / 11,12 |

## Numerical/property gates

- Exact default-ratio equivalence to Epley within 1e-10 for valid inputs; 1-effective-rep fraction equals 1.
- Positive finite fractions/projections, decreasing load fraction with increasing effective reps at fixed k; increasing physical strength must not reduce a feasible unguarded recommendation.
- For every accepted update: 0.01 ≤ k ≤ 0.08 and absolute delta k ≤ 0.002. Fit eligibility min 8 rows / 3 distinct effective reps / span 4; maximum 24 fit rows.
- Replaying latest identical facts gives byte-identical state regardless of delivery order. Editing/deleting/reopening produces the same result as clean replay without the superseded evidence.
- Zero violations of ownership, immutable actuals, target/reference identity, missing-data handling, finite output or declared equipment feasibility in automated scenarios.
- Fuzz/load-grid sweeps include low physical loads, 15/20 kg bars, coarse inventory, unknown metadata and off-grid actuals. Do not interpret a 0 plates input as zero physical barbell load.

## Statistical evaluation gates, registered before tuning

1. Freeze code, scenario definitions, metrics and seed partition before evaluation. Use training seeds 912731, 1912731, 2912731; seal evaluation seeds 4912731, 5912731, 6912731 and do not tune on them. Use independent athlete/context clusters, not sets treated as independent people.
2. Compare corrected default and online through identical production boundaries and paired athlete scenarios. Report paired bootstrap 95% confidence intervals over athlete clusters (10,000 deterministic resamples), sample sizes and each seed result. Simulator truth parameters never enter policy inputs.
3. Overall online target-hit point estimate must be at least default; lower confidence bound on online-minus-default must exceed −1.0 percentage point. Miss-rate increase upper confidence bound must be ≤+0.5 percentage point. These are engineering acceptance margins, not clinical safety claims.
4. Within preregistered cold start, noisy feedback, coarse equipment, alternating tempo and short-rest subgroups, target-hit difference lower bound must exceed −3.0 points and miss-rate increase upper bound ≤+1.0 point. Report insufficient-power subgroups as unresolved; do not hide them in the overall score. A failure keeps the candidate in shadow, or requires a specified fallback followed by a fresh untouched holdout.
5. Preserve the established-history prototype target-hit benchmark 66.62% as a regression reference: same-protocol reimplementation must remain within 1 point and show no material miss increase. Do not use this absolute threshold on a different protocol or require 75% from a cold start because the calibrated acquisition experiment reached it later.
6. Include true zero-history starts without teacher initialization, learning curves versus eligible observations and exposures, and the original under-seeded/Easy deadlock case. Report default as acceptable if learning never becomes identifiable.
7. Historical export validation uses chronological splits and real available labels only. No fabricated effort, tempo, body mass or calibration targets. Without real prospective effort/outcome evidence, conclusions remain synthetic and staged operational validation; do not claim real-athlete superiority.

## Runtime and release gates

- Required focused suites plus `pnpm run verify:strength` and the repository `pnpm run verify` complete with zero mandatory failures. Report existing unrelated blockers distinctly; do not disable tests to pass.
- Playwright walkthrough and repeatable suite build/schedule/log/finish/reload the actual session, not only inject stored results. Capture traces, screenshots, console/network errors and result counts.
- Reference-host replay of 10,000 records ≤250 ms; device next-set p95 ≤16 ms and cached lookup p95 ≤5 ms; no main-thread task >50 ms during interaction. Record hardware and measurement method; use operation-count invariants in shared-host CI.
- Real local DB ownership/concurrency tests pass; additive migrations reset/replay cleanly, old payload clients remain compatible. Staging verification checks actual synced facts under two owners.
- Install the signed staging APK and record exact commit/bundle hash, app version, Android/device. Complete M1, M8, M11, M13, M15–M17 and M19 on device, including native restart/backup.
- Rollback rehearsal returns to default without discarding facts or unsent edits. Keep raw ledger compatible; never restore an older database backup over newer athlete logs as the model rollback.
- Every row links to evidence in `docs/releases/strength-online-learning-acceptance.md`. A blank, skipped, environment-blocked or unrun mandatory check blocks release. Passing simulations alone never authorize Capgo.
