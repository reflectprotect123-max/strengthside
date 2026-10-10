# Strength brain v2 validation

Validated on 10 October 2026 from `feat/strength-brain-v2`. This report covers the local implementation only. No Capgo upload, live Supabase migration, release signing, or production deployment occurred.

## Supported behavior

- The builder accepts shared rep targets, arbitrary per-set rep targets such as 10/8/6 or 5/3/1, and an explicit final AMRAP. It does not ask the coach to select effort or equipment increments.
- Builder exercises carry stable hidden catalogue identity, equipment, load convention, minimum, and increment metadata. Renaming a scheduled exercise no longer changes that identity.
- New builder records no longer write hidden rest prescriptions, target effort, demo starting loads, or duplicate rep aliases. Old text prescriptions are read only for legacy sessions.
- The session compiler adds two ramp sets for supported main lifts. Ramp results calibrate the current workout but do not become e1RM evidence.
- The logger records the actual weight, reps, effort slider value, and selected rest context. Athletes can override every suggested load.
- A final first-set-last AMRAP resolves from the actual first working-set load. Editing that source before the AMRAP updates its pending load; editing the source after the AMRAP is complete does not rewrite the completed result.
- For a 6–8 target, six reps at Average holds the next load. Progression is rounded to declared equipment increments and obeys caps.
- Only eligible completed working evidence updates the exercise estimate. Failed sets, Easy sets, ramps, unsupported movements, holds, and carries do not produce an e1RM.
- Each exercise is learned independently. Replaying records in chronological order produces one exposure per qualifying session. Edits replace derived evidence, deletes invalidate it, retries are idempotent, and account data stays isolated.
- Estimated 1RM is read-only brain output. The obsolete manual working-max entry path has been removed.
- Set records persist the authored target, actual result, prescription signature, model version, source IDs, source signature, and rest context so derived estimates can be replayed rather than trusted as permanent facts.

## Automated verification

The complete repository gate was run with:

```bash
PATH=/workspace/pnpm-tools/node_modules/.bin:$PATH \
PLAYWRIGHT_CHROMIUM_PATH=/usr/bin/chromium \
pnpm run verify
```

It passed. The relevant results were:

- 35 shared contract tests passed.
- 17 strength brain and memory tests passed.
- The strength-memory migration, row security, optimistic conflict, tombstone, authorization, and account-isolation checks passed against PostgreSQL 17 in Docker.
- Four simulator tests passed and regenerated reports matched the committed deterministic artifacts.
- Type checking, workspace tests, athlete checks, and all ownership/smoke gates passed.
- 31 Playwright browser journeys passed in Chromium, including the complete build, calendar, two-ramp, workout, rest timer, summary, history, and next-session route.
- The focused v2 journeys passed for 10/8/6 plus first-set-last AMRAP, edits before and after AMRAP completion, 3×6–8 Average load holding, and manual load override.
- Builder/logger keypad coverage confirms the range dash only appears for rep ranges, reps remain whole numbers, and weight fields accept decimals.
- Browser screenshots were captured by the session and v2 journeys in `checks/browser/test-results/browser-artifacts`.

`check:migrations` itself reported a skip because `initdb` is absent from the command environment. The dedicated `check:strength-memory-sql` gate did run the new migration against a real PostgreSQL 17 Docker container and passed.

## Simulation decision

The deterministic simulator evaluated 79,488 holdout sets with zero software-invariant violations. The tuning winner slightly reduced aggregate miss rate, from 8.38% to 8.29%, but increased underloading from 49.65% to 50.44%. It therefore failed the holdout gate. The frozen runtime remains `strength-v2-conservative` with parameter SHA-256 `75bf80f104870dc977514c8a49f951ca73d30770f58166a936f7b04cb4005449`.

These are synthetic product tests. They establish repeatability and software constraints; they do not prove clinical safety or real-athlete accuracy. The first real sessions should be used to inspect target achievement, effort calibration, manual overrides, equipment availability, and whether suggested changes feel too slow or too aggressive. Policy changes should require a new version and should pass a held-out replay before release.

## Android artifact

A local debug APK was staged from the athlete app and built with Gradle/JDK 21. Its ZIP contents include the v2 target, equipment, RTS, policy, core, adapter, and memory modules. The APK is for direct review and device testing; it is not a release-signed production build.

- Package: `com.hybrid.strength`
- Version: `1.3.5` (`135`)
- Minimum/target SDK: 24/36
- Size: 77,974,463 bytes
- APK SHA-256: `17d3869ce26aafb76dbe07309ea5b144dd892af01478340163d7534d65f6c9eb`
- Signature verification: valid APK v2 Android debug signature
- The packaged builder, logger, session, and strength-brain files exactly match the tested source files.
