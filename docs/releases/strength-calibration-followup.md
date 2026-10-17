# Strength calibration and Cursor builder follow-up

Candidate runtime ends at `648543ae`. The registered evaluation harness is
`ffa9cac8`. Cursor's builder and its README through main `d4130f51` are included.
The [review](../reviews/2026-10-17-cursor-strength-builder.md) details the repaired
defects and the remaining prep-builder limitations.

## Behavior

An Easy first work set cannot earn a next-session increase when later ordinary
work is Hard, missed or reduced to a lighter comparable load. Final AMRAP stays
at the actual first working-set weight and does not count as ordinary work.
Unknown exercises cannot borrow another unknown exercise's history.

History replay avoids normalizing unrelated lifts, without losing the session
completion and reopen facts needed for correct eligibility. The builder keeps
selected metrics and plays warm-up, lifts, then cool-down. Automatic prep timers
persist immediately, recover their elapsed time after reload and gate Next
until finished. X is accepted only in the concentric tempo box.

## Recovered-workspace verification

- Playwright CLI: **43 passed**, building and completing sessions through real
  controls, including per-set targets, metrics, slider, rest, offline logging and
  the new prep regressions.
- Shared contracts: **109 passed**.
- Focused brain/memory/offline/rollout/prep/simulator suite: **65 passed** across
  the recovered run and the new simulator counter regression.
- Athlete suite: **120 passed**, plus application/recovery/Capgo configuration
  smoke checks. Other verification components passed individually.
- Real local PostgreSQL memory/learning tests passed. All **8 migrations**
  applied in PostgreSQL 16 with pgvector, including owned-table and RLS checks.
- Quiet 10,000-record benchmark: cold replay **106.24 ms**, separate record
  snapshot **177.14 ms**, cached lookup p95 **0.00774 ms**, next-set p95
  **0.05618 ms**. The cloud reference and operation gates pass; this does not
  establish Android interaction latency. See the adjacent performance JSON.

## Registered simulation

The completed follow-up has **18 independent synthetic athletes**, 144 paired
scenario runs and 32 sessions per scenario: 13,824 ordinary sets per policy.
The invariant count is **zero**. A first jump audit counted zero-valued, unseeded
next-set placeholders as actual rack loads. This was an audit error, not an app
decision. After fixing the audit rule, the two affected athlete-calibrated
groups were rerun. Their hit, miss, error, model-update and session-feedback
metrics all match the original run; the six unaffected groups retain the
completed original run. The registered evaluation seeds and model settings
remain unchanged. See the adjacent results and source-hash validation.

The personalized curve **did not pass the statistical gate**. Across all groups,
the default hit rate was 13.60%; online was 13.59%. The paired difference was
−0.0145 percentage points (95% CI −0.0796 to +0.0289), with equal miss rates.
The small negative point estimate fails the strict no-regression rule even
though its confidence interval includes zero. The shipping policy stays default.

Cold-start scenarios had **zero fitted athletes in 108 scenario pairs**. With an
informed athlete-entered ramp load, the model eventually fitted 20 of 36 cases;
the first update averaged session 19 in the quieter arm and session 23 in the
noisy arm. Sixteen of these 36 cases still did not fit by session 32. An
athlete-entered useful weight helps the model learn, but this synthetic run
does not show immediate or automatic capacity discovery. Prospective athlete
results are still needed.

## Android artifact

The local debug APK built from `ffa9cac8` includes runtime `648543ae` and all
Cursor builder changes above. `apksigner verify` passed. All **56 staged files**
matched packaged bytes; **17 relevant runtime assets** also matched the reviewed
athlete source directly. [Build metadata](../research/strength-online-learning/calibration-apk-build.json)
records its size, hash, package and exact source commits.

- Artifact: `/workspace/artifacts/strength-calibration-fixes/strength-calibration-ffa9cac8-debug.apk`.
- SHA256: `371d5c6a3bc06e2c8e036710452efb93237e2beeaabc3915a67ec44b3a32ebb8`.
- Package `com.hybrid.strength`, version 1.3.11/code 140, min SDK 24.
- Verified Temurin JDK 21.0.12.1+1, Gradle 8.14.3, Android 36.

This is a local debug certificate, not the production signing identity. A matching
version number does not make this a production update or confirm installation
over an existing APK. Native updater behavior can load the existing live web
bundle; a physical test must confirm the actual running bundle as well as the
installed APK. No device installation or Capgo upload was performed.

## Release boundaries

Shipping mode stays **default**. The existing default still adjusts training
loads; the experimental personalized curve remains disabled. No hosted
migration deployment or Capgo publication is part of this follow-up. Cursor's
README records 1.3.11 as already shipped separately; it does not include these
later candidate fixes.

Physical Android interaction/background/resume, real two-account hosted
GoTrue/PostgREST sync and prospective athlete outcomes remain unrun. The seeded
warm-up still totals 39 minutes across three rounds, and the live prep builder
lacks duration/round/remove controls. Locked routine defaults and reference
prototypes were preserved. Code integration is separate from enabling the
experimental learner or publishing an athlete update.
The simulator's false positive jump guard is corrected in the harness; the
training runtime itself did not need a progression-policy change for this audit
fix.
