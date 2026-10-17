# Cursor builder and strength calibration review

Reviewed against main `d4130f517e2cff0eddac35941ff38059c0ec655b`.
Runtime fixes finish at `648543ae`; the resumable evaluation harness is
`ffa9cac8`. No prototype or native product version was changed.

## Shipped baseline

Cursor's README records the new session builder as Capgo bundle 1.3.11 on
`strength-live`, following 1.3.10. This is repository evidence of a manual ship,
not an independent query of the Capgo service or confirmation from a phone.
The GitHub Capgo workflow has no recent successful run; a local CLI upload need
not appear there. These later fixes are a separate candidate and have not been
published through Capgo.

## Repaired behavior

| Finding | Repair and regression coverage |
| --- | --- |
| Main lifts silently regained Weight (kg) after the athlete deselected it | Compilation preserves selected metrics; unit and browser regressions verify a reps-only logger. |
| A lift added after a cool-down could play after the cool-down | Stable role ordering makes warm-up, training and cool-down compile in that order, preserving order within each role. |
| Prep pages with load/reps could enter the working-load estimator | Explicit prep sections and roles are excluded from the load model. |
| Automatic prep countdown did not immediately persist its start | Timer and page marker are saved together; reload retains elapsed time, hidden loggers do not arm clocks, and storage rejection restores the prior state. |
| Next could bypass an active prep countdown | Both the button and navigation handler wait until it finishes. |
| Tempo accepted X in a lowering or pause box | Only the concentric Lift box accepts X; invalid saved menu entries are filtered. |
| An Easy first set could raise the next session despite later ordinary Hard, failure or missed reps | Later ordinary struggles veto that Easy-only increase. Final AMRAP effort does not veto ordinary progression. |
| Hitting upper reps after reducing a comparable load could earn progression | Equal/fewer-rep targets must retain at least the first ordinary load. Higher-rep sets can legitimately use a lighter load. |
| Large histories normalized unrelated lifts and sorted unrelated sessions | Replay rejects unrelated identity tuples early and scopes session work, retaining completion/reopen/tombstone facts across exercises within relevant sessions. |
| Missing exercise identity could pool unrelated unknown lifts | Missing canonical context cannot replay or seed history; unknowns stay isolated. |

## Remaining limitations

The five seeded warm-up movements total 39 minutes across three rounds:
Bike, Row, Run and Ski are 180 seconds each; Jump Rope is 60 seconds.
The live prep builder has Add controls but lacks duration, round-count and
remove controls. This is a material usability limitation. The locked defaults
and reference prototypes were preserved; this change does not silently choose
a different routine. A completion-only circuit also cannot leave cool-down for
the calendar through that screen, and the disabled Next gives no explanation.

No physical Android device is attached. Real two-account GoTrue/PostgREST sync,
installed-app background/resume and rollback remain unrun. Disposable PostgreSQL
RLS and compatibility checks do not replace those transport/device checks.

The experimental personalized curve stays disabled. An Easy-only empty-bar
history does not identify capacity. An informed athlete-entered second ramp
load is explicitly external input, not automatic discovery. The registered
paired evaluation reports those scenarios separately and does not certify
prospective athlete outcomes or authorize a release.

## Verification

The recovered checkout passed 43 Playwright tests, 109 shared contract tests,
64 focused brain/memory/offline/rollout/prep/simulator tests, the athlete suite,
real PostgreSQL memory/learning checks and all eight migrations in PostgreSQL 16
with pgvector. Final simulation and artifact evidence are recorded in the
calibration follow-up release note once completed.
