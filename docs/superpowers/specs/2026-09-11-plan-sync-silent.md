# Plan sync is silent (owner lock)

**Date:** 2026-09-11  
**Status:** LOCKED — owner freeze. Do not add Me/Settings chrome for training copy.

**Product:** Strength Side athlete HTML app (`apps/athlete/`). Not The Brain.

## Rule

Training copy (`PlanSync`, cloud domain `strength_side`) **just runs when the athlete is signed in**. It is not a feature they tap.

| Surface | Allowed |
| --- | --- |
| `save()` → `PlanSync.schedulePush` | Yes, if signed in (no-op if not) |
| Sign-in / boot → `PlanSync.syncNow` | Yes |
| Me | Email, WHOOP connect/sync, Sign out, existing OTA/app block. **Nothing about training copy.** |
| Extra button / status / explainer | **No** |

## Why

The athlete already has Sync WHOOP. A second “copy” control and status essay is noise. Signed-in phones share Library + sessions without a new room on Me.

## Out

- Copy training button
- “Last copied …” lines
- “WHOOP is recovery, Copy is Library” stubs
- Conflict sheets on Me (this phone keeps local; retry in background)

## Guard

`apps/athlete/checks/athlete-app.smoke.mjs` fails if Me HTML mentions plan sync or if `PlanSync.schedulePush` / `syncNow` disappear.
