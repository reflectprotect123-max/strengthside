# New HTML Android app

The screen source is `apps/athlete/conditioning/source.html`: the new standalone HTML approved in this chat. It is not rebuilt from the old athlete interface. `build.mjs` adds native plugins, the existing WHOOP connector, the existing cloud ledger and `runtime.js`.

## Build

1. Install root dependencies from the pnpm lockfile.
2. In `apps/mobile/capacitor`, install native dependencies (`npm ci` when the lockfile exists).
3. Run `node scripts/conditioning/build.mjs` from the repository root.
4. In `apps/mobile/capacitor`, run `npx cap sync android`.
5. With JDK 21 and Android SDK 36 configured, run `./gradlew assembleDebug --no-daemon` in `apps/mobile/capacitor/android`.

Do not package `source.html` as the entry point: `index.html` includes the native/account integrations. APK 1.1.1 uses the dedicated Capgo `engine-html` channel. Updates download automatically and apply through Settings → Restart now after the workout finishes. The app saves local state and its private-file backup before switching bundles, and confirms successful startup with `notifyAppReady()` before attempting account network requests.

## Implemented

- New Home / Train / centre-symbol Progress / Methods / Settings screens and all 12 interval methods.
- Official Capacitor BLE client, native scan picker and HR notifications fed into the new timer/zone engine.
- Foreground connected-device service and CPU wake lock while a Bluetooth workout is running; stopped on pause/end/disconnect.
- Backgrounding a workout without a connected sensor pauses it rather than pretending to record HR.
- Local browser state plus a private native file copy; the existing export/import remains available.
- Existing Supabase login/WHOOP consent/deep-link flow, without clearing saved workouts on login.
- Account-isolated local archives when switching authenticated accounts.
- Existing cloud snapshot/RPC extended to include live workouts, dated physiology, zone settings and target history.
- WHOOP sync code extended with dated HRV/RHR and durable history merging; full-history request capped at 10,000 records, with an explicit truncation indicator.
- After sign-in and launch, check the server for an existing WHOOP connection and sync it automatically. Home shows the latest observed WHOOP recovery/HRV/RHR with a clear date when today's reading is unavailable. Viewing a historical date stays on that date. Values remain observed WHOOP data, not a replacement recovery formula.

## Supabase WHOOP backend

The mobile client calls the existing configured Supabase WHOOP functions. The deployed sync source was downloaded from project `orysjncrksmdfabpuftd` and restored under `supabase/functions/`. On 3 October 2026, `whoop-sync` version 12 was deployed with `dailyMetrics`, cycle-local dates, precise RMSSD/RHR, bounded full-history pagination and durable history merging. OAuth connect/callback functions were preserved. The Netlify implementation under `scripts/brain-owner-coach` is not the live mobile sync endpoint.

Run `pnpm run check:whoop-history` for synthetic end-to-end handler tests. Redeploy with `bash scripts/deploy-whoop-sync.sh` using a securely supplied `SUPABASE_ACCESS_TOKEN` and installed Supabase CLI (`SUPABASE_CLI` can select its executable). The helper isolates the function from the legacy repository CLI configuration. Credentials are not stored in the repository.

Deployment access was verified, the uploaded bundle contains the new history response, and unsigned/invalid-login requests still return 401. No signed-in athlete/WHOOP account was supplied. Live OAuth, account history retrieval, database writes, real WHOOP pairing, locked-screen continuity and OEM battery behaviour remain unverified. The foreground service keeps the process alive; it does not independently reconstruct workouts after Android kills the app. Interrupted workouts reopen paused.

Automatic weekly progression stays disabled. All calculation/aggregation code remains STRENGTHSIDE-DESIGNED; no proprietary Morpheus formulas were recovered.

## Installation

This is a debug APK using Android's generated development signing key and the existing application ID `com.hybrid.athlete`. It may not update an installed APK signed with another key. Export a backup from the old app before any uninstall; do not erase the old installation to troubleshoot a signature conflict without preserving its data. Production signing and store publication are separate.

## Validation in this task

Android debug build succeeded with JDK 21 and SDK 36. APK v2 signature verified. Packaged HTML/native bundle matched the new generated files byte for byte. Sixteen unit tests passed, plus the browser workflow smoke test, mocked native BLE/service/export test, WHOOP routing and deep-link checks. No physical-device or authenticated production tests were performed.

The cloud worker initially had a JRE without javac; a checksum-verified Temurin JDK was installed under `/workspace/engine-jdk`. Android tools were installed under `/workspace/android-sdk`. Maven Central returned HTTP 429; the worker used Google's HTTPS Maven Central mirror through a local Gradle init script. The session proxy CA was added to a local Java trust store without disabling TLS verification. These are worker setup details, not app dependencies.

Supabase deployment validation: eight history/pagination/handler tests passed and all workspace typechecks passed. After wiring Capgo to the new HTML, the complete `pnpm run verify` pipeline passed, including five update-controller tests and the updated Capgo smoke check. Migration checks were skipped because the worker lacks a local PostgreSQL server; no production migration was applied.

## Capgo publication

Bundle 1.1.2 initially established the `engine-html` channel; its downloaded archive checksum and APK asset match were verified. Bundle 1.1.3 adds existing-account WHOOP discovery and observed Home readings without requiring a native APK change. The existing `live` and `dogfood` channels are preserved. No WHOOP account or physical-phone update is inspected from this workspace.

For future HTML updates, use a unique version with `CAPGO_BUNDLE_VERSION=1.1.3 bash apps/mobile/capacitor/scripts/ship-capgo.sh`. This builds the new HTML and uploads only `index.html` and `native-plugins.js`, declares minimum update version 1.1.1, and pins the dedicated channel. Native plugin/Java changes still require a rebuilt APK. The cloud worker requires `NODE_USE_ENV_PROXY=1` for Node's network calls; credentials must come from its existing secure configuration or ignored credential file.

## HR dropouts and frozen workout zones

`hr-accounting.js` implements STRENGTHSIDE-DESIGNED, versioned timing rules.
A normal HR sample supports up to three seconds of recorded time. When the next
valid sample brackets a gap greater than three and at most ten seconds, and the
endpoint difference is at most 20 bpm, the whole interval is reclassified as
estimated using a linear HR path through the workout's frozen boundaries.
Measured time is removed before estimates are added, preventing double counting.
A returning sample is required; long/unbracketed/suspect gaps stay unknown.
Pause/resume, explicit disconnection, invalid/contact-error readings, and mixed
strength segments break the interpolation anchor. This cannot detect all wrist
sensor artifacts or establish the true HR during a dropout. The limits are
provisional design constants, not vendor formulas or validated physiological limits.

`zoneSeconds` retains measured counters; `estimatedZoneSeconds` is separate.
`gapEstimates` records endpoints, zone/model versions and design provenance.
Live, Home and history totals include estimates and label their contribution.
Legacy workouts without estimate fields retain their old totals. No weekly target
ranges or automatic progression rules are introduced by this change.

Zones are locked on first start, including an unavailable snapshot when no valid
zones exist. Settings changes apply to future workouts. In-workout editing is
read-only after start, and pausing/resuming never replaces the snapshot. Workouts
can still run without zones, but cannot fabricate measured zone minutes. The
separate manual Easy/Medium/Hard fallback workflow remains to be defined/built.

Run `pnpm run check:engine-hr` for the math and deterministic browser checks.
`check:engine-zones` also runs the pure accounting tests. Native BLE smoke uses
mocked devices; physical wrist sensor interpolation accuracy is not verified.
