# Workout builder source export and athlete removal

The full pre-removal builder is preserved from strengthside commit
`5551ef5a4394f16582c3a9687c38bb1e02859508` in the `workout-builder-export` GitHub
release. The ZIP includes a runnable web preview, the original builder source and
styles, shared contracts, tests and visual references. `SOURCE.json` records file
hashes; the export verifies the ZIP after writing it. Its 43 original builder unit
tests also pass after extraction.

The athlete app no longer creates or edits workouts, exercises, circuits, sets,
tempo, supersets or calendar assignments. Creation buttons, wizard screens,
authoring model APIs and authoring styles are removed. Saved editor routes reopen
the workout reader instead. Existing templates, assignments, completed sessions,
metrics and learning evidence are retained.

The library reads saved workouts and opens their already-assigned calendar days.
The existing logger, calendar and PlanSync import contract remain. Building a new
Coach dashboard or changing its publishing backend is a separate task.

Logger browser tests now receive authored workout fixtures through
`PlanSync.applyPlan` rather than navigating the removed builder. Tests still cover
metric entry, rest, progression, AMRAP, offline logging, reload, history and update
recovery. The original builder-only tests remain in the ZIP; new tests cover the
read-only library and removal of authoring entry points.

Recreate the export with `python3 scripts/export-workout-builder.py`. GitHub
Actions → **Export full workout builder ZIP** publishes the verified ZIP to the
`workout-builder-export` release without publishing a Capgo update.
