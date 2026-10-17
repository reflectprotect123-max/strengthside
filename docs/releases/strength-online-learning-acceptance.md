# Strength online learning: implementation and release acceptance

Historical acceptance record. Subsequent calibration and Cursor-builder fixes
are recorded in [the calibration follow-up](strength-calibration-followup.md).
The numerical results below describe the original runtime and protocol.

16 October 2026 (Australia/Sydney). **Production rollout held. The user subsequently authorized merging the completed code with the conservative default retained; hosted migration deployment and Capgo publication remain separate.** Conditioning and the separate builder redesign remain parked. The user requested direct implementation/review, without subagents.

## Reviewed implementation

Runtime/build source: `eb9fa3f4b3eb0c2f5852a80092d36fc2188a7fc6`. Later evidence/documentation commits do not change the runtime. Main was refreshed and remained `1c5789a339918bf10a131d4112316b444146f7d1` during this work.

The branch repairs physical load conversion, bounded next-set decisions, deterministic history replay and offline sync. It introduces an original JavaScript online learner inspired by the pinned STMr equations, rather than adding an external R runtime or an LLM. The existing slider, appearance, selected metrics, builder flow and rest interaction remain. Library changes only preserve hidden bar metadata through compilation.

Shipping policy remains `strength-v3-conservative`, `learningMode: default`, `learningVersion: online-v1`. Internal shadow mode returns exactly the default visible decision while retaining bounded anonymous diagnostics. Online mode is available for evaluation; it is not enabled for athletes. The default still adapts loads; the experimental personalized curve is the part held back.

Important behavior:

- Barbell display values count plates plus the declared 15/20 kg bar exactly once. Per-hand dumbbell values are never doubled. Old ambiguous values remain raw history and cannot teach the model, including after resume, unlogging or repeated effort/reps edits.
- Average and Hard use broad 3/1 RIR representatives. Easy is directional only. Max Effort and misses reduce conservatively and do not become precise fitting evidence. A one-rep prescription remains ordinary work.
- Only a finished session's first authored ordinary work set can teach shape. Ramps, later work, AMRAP, deleted/skipped/unlogged first sets, unsupported metrics and belt/bodyweight system-load models cannot teach it. There are two main-lift ramps.
- Owner, canonical exercise, equipment, convention and normalized tempo define context. `33X1` and `20X1` stay separate; formatting aliases match. Unknown tempo is its own context. No fixed tempo penalty or duration is invented for X.
- All 6/Average in 3×6–8 holds. All upper-bound sets at acceptable effort can earn one increment. Independently, clearly Easy feedback can raise a later comparable starting weight by one equipment rung without an invented e1RM; it can do so when the next target asks for fewer reps. Intra-session percentage guards still apply. A miss/Max Effort reduction survives a changed prescription.
- AMRAP uses actual first-work-set weight. It follows source edits until logged, then its completed actual remains immutable.
- Local facts/outbox persist before acknowledgement. Delayed acknowledgements preserve newer edits. Owner epochs prevent stale identity/pull/push responses from contaminating another account. Conflicting variants survive restart and quarantine the affected model. Quota rejection rolls back memory and the logger's visible completion. Native restore cannot overwrite newer local writes.
- Replay caches are disposable, scoped to immutable fact snapshots, owner, context and model version. Actual changes invalidate them. They do not use a short hash as their equality proof; full fingerprints are not copied into every uploaded set/summary.

## Verification record

- Focused combined suite: **190 tests passed**, zero failures/skips. Includes shared maths/replay, adapter, real Session→Memory integration, offline failures, rollout, builder bar metadata and production-path simulator tests.
- Full Playwright CLI suite: **38 passed** in the final full-repository run. Real controls build, schedule, complete ramps/work, use the slider and rest timer, finish, reload history and open the next session. Coverage includes 10/8/6 plus first-set-last AMRAP, 5/3/1, ranges, every supported metric/keypad, calendar deletion, offline completion, quota rejection and logout/login.
- `pnpm run verify`: **passed**. Its host-only all-migration subcommand reports SKIP because this host lacks initdb. That gap was separately closed by executing the unchanged migration runner inside real Postgres 16 with pgvector: **all 8 migrations passed**, all owned-table/RLS and cross-repository assertions passed, zero known extension gaps.
- Real disposable PostgreSQL record-lane tests: **passed**. Authenticated-role/JWT-subject ownership, B/anon denial, mixed v2/v3 payloads, malicious payload owner, revisions, tombstones, stale-batch atomicity and malformed/oversized/duplicate batches were exercised. The new migration rejects SQL NULL and alternate-case UUID duplicates. The applied old migration was not edited.
- Final `verify:strength` rerun: **passed**, including 37 browser scenarios and zero mandatory failures. The final full-repository run also includes the Android-size touch/double-tap case among its 38 passing browser scenarios.
- Production paired evaluation: **complete**. Eighteen independent paired synthetic athletes contributed 108 scenario pairs and 10,368 ordinary sets per policy. Both policies hit the target effort on 3.99% of these deliberately uncalibrated cold-start sets, with a 0.087% miss rate and zero software-invariant violations. The numerical noninferiority margins pass with equal outcomes, but **107 of 108 scenario pairs never acquired enough eligible evidence to fit**; the one fitted pair first updated at session 31. This is not evidence that personalization improves the app. Initial load acquisition remains unresolved without athlete weight adjustments. See [results and limitations](../research/strength-online-learning/baseline-2026-10-16/production-evaluation.md); no outcome-driven retuning of the sealed seeds was performed.
- Runtime profiling: bounded-operation/cache checks **pass**. Observed cold replay of 10,000 records has been approximately 290–393 ms, exceeding the 250 ms reference target. Cached lookup and next-set p95 remain below 1 ms on this host. This reference latency gate **fails**; device latency is **unrun**. The adjacent performance JSON records the latest annotated measurement, including snapshot construction separately.

Commands use Node 24.19.0, pnpm 10.33.0 and system Chromium via `PLAYWRIGHT_CHROMIUM_PATH=/usr/bin/chromium`. Browser suites run sequentially because their server owns port 8899. Initial environment-only failures (missing browser-path selection and JRE without javac) were diagnosed and corrected; they were not hidden as passing tests.

## Android artifact

A local **debug-signed test APK** was built using the repository dogfood script, Android SDK 36/build-tools 35, checksum-verified Temurin JDK 21.0.12.1+1 and Gradle 8.14.3. This is not a production signing/release certificate.

- Package `com.hybrid.strength`; version `1.3.11`, versionCode `140`, minimum SDK `24`.
- Build source: `eb9fa3f4b3eb0c2f5852a80092d36fc2188a7fc6`.
- Artifact: `/workspace/artifacts/strength-online-learning/strength-online-learning-eb9fa3f4-debug.apk`.
- SHA256: `f995447ee75bd99e5f49ca929f55ecbd5d6640802a07259c76b673258f7237fe`.
- `apksigner verify` passed. Fourteen relevant packaged runtime assets matched the reviewed source byte-for-byte. [Build metadata](../research/strength-online-learning/apk-build.json) records the asset list and artifact size.
- No phone/emulator installation, physical Android version, screen-lock/background test or native backup recovery was observed. Those checks are **UNRUN**, not inferred from browser execution or successful assembly. Do not install over a production-signed app expecting its signing identity to match this debug certificate.

## Matrix evidence and remaining release gates

| Matrix | Automated evidence | Remaining evidence |
|---|---|---|
| M1 | strength-load/equipment/core, library/session metadata, browser cold bar, packaged source | 15/20 kg physical-device walkthrough |
| M2 | equipment/core properties, manual-off-grid simulator case | Device confirmation of actual inventory |
| M3 | core review, real finish/reload/reseed unit flow, browser range session | Prospective athlete outcomes |
| M4 | authored-target tests, 10/8/6+AMRAP and 5/3/1 browser workflows | Device walkthrough |
| M5 | core guards, slider UI, quota/double-capture regressions | Device touch behavior under real use |
| M6 | two-ramp seeding, later Hard/miss core regressions, real browser ramps | Physical session |
| M7 | populated-next-row guards and actual production simulator path | Device latency |
| M8 | reference/edit/immutability core and browser checks | Device first-set-last |
| M9 | normalization/learner/domain tests and high-rep simulation | Real athlete validation |
| M10 | context/replay aliases and separation; alternating-tempo simulation | Prospective per-tempo outcomes |
| M11 | all metric browser tests; bodyweight/belt exclusion tests | Native holds/carries/bodyweight logging |
| M12 | builder/logger keypad and calendar-delete browser regressions | Native visual confirmation |
| M13 | full browser rest selection/reuse/auto-start and timer tests | Lock/background/resume on phone |
| M14 | revision/tombstone/completion/import/reopen replay; Session→Memory integration | Mixed-device staging edits |
| M15 | offline/reload/outbox/lost-ack/quota/native-backup mocks and browser completion | Airplane mode, process kill, native restore/reconnect |
| M16 | owner-race/account/archive/conflict tests and real SQL RLS | Actual GoTrue/PostgREST JWT sessions under two staging accounts |
| M17 | real SQL mixed clients, malformed/atomic batches, all migrations | Old/new installed APKs against staging |
| M18 | eligibility/diversity/bounds tests and paired synthetic evaluation | Real prospective effort labels; sufficient subgroup power |
| M19 | exact default/shadow equivalence, corrupt/missing modules, rollback retaining facts/pending | Staging rollback rehearsal |
| M20 | 10k-record/cache operation checks and annotated cloud profiling | Android next-set p95≤16 ms, lookup p95≤5 ms, no interaction task>50 ms |

Hosted staging credentials and a physical Android device are not available in this environment. The SQL lane uses real Postgres authorization with JWT subject claims; it does not validate GoTrue token issuance or PostgREST transport. These are explicit unrun release gates. No new hosted model table is required: existing `strength_brain_records` payloads hold versioned raw facts and disposable summaries.

The previous 66.62% established-history prototype benchmark remains a historical reference. Its complete original protocol is not reproducible from the retained packet, so this branch does not assert that a different cold-start protocol reproduces that absolute number. The production harness is retained in full. Historical TrainHeroic data is private and contains no certified actual slider/purpose labels; no invented labels, body mass or completed-session dates were used, and no private export was committed.

## Follow-up before release

1. Resolve cold-start acquisition using meaningful athlete-entered working/warm-up loads through the existing keypad, then test with a newly registered independent evaluation set. Tight caps plus Easy-only feedback from an empty bar cannot identify an athlete's actual capacity. Do not invent a precise RIR for Easy or tune against these sealed results.
2. Reduce cold large-history replay cost or prepare it outside the interaction path, and demonstrate the reference and device latency gates. Fast cached reads do not close the cold-load failure.
3. Validate the installed APK on a physical Android device and exercise actual two-account GoTrue/PostgREST staging sync, native restart/backup and rollback. Keep online disabled until these and prospective outcome evidence support it.

## Review decisions and rollout

Work was completed inline after the user stopped delegation. Behavioral regressions were reproduced before fixes, including stale last-row UI, account logout/restore, repeated legacy edits, Easy-only seed stalls, changed-target miss reductions, NULL RPC input and UUID spelling aliases. The physical-load boundary is shared; there is no second active latest-three estimator or model table. A fixed default-k0 starting scale is not multiplied by an RTS or personalized-k fraction.

The early evaluation attempts were stopped without reading outcomes while integration/performance and training-fixture defects were corrected. Scenario truth, registered seed partition and acceptance margins were not tuned against evaluation results. Final results identify actual loaded source hashes. The old teacher-informed simulator remains explicitly labelled a legacy diagnostic, not evidence for online rollout.

Rollback rehearsal clears derived cache/diagnostics and returns to default while retaining raw records and pending uploads. Actual installed-device rollback remains unrun. Production rollout requires the outstanding device, staging, latency and outcome gates plus a separate release instruction. The user’s subsequent merge instruction authorizes code integration with the experimental learner disabled. The remaining gates still block candidate activation and production rollout; no Capgo or hosted migration deployment is included in that merge instruction.

## Integration follow-up

Main advanced to `2c2c3f77` with the planning/handoff PRs already merged. The sole integration conflict was the next-session browser assertion; it retains explicit empty-bar/ramp checks from main and the implementation branch’s owner/error/clock handling. Runtime source and candidate policy are unchanged. The user explicitly authorized merging all completed work; that supersedes the earlier draft-only merge hold, while keeping the learner disabled and preserving deployment gates.
