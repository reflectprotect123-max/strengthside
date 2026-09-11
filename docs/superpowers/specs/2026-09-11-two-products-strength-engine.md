# Strength and Engine are two products

**Date:** 2026-09-11  
**Status:** LOCKED — owner freeze. Two products, **two GitHub repos**.

## Rule

Strength and conditioning are **two different products**. Not two tabs. Not a
folder pair inside `strengthside`. Same pattern as `nutrition`.

| Product | Repo | Storage | Logger |
| --- | --- | --- | --- |
| Strength | `reflectprotect123-max/strengthside` (`apps/athlete/`) | `THE-brain-v1` | TRACK kg/reps + silent `PlanSync` |
| The Engine | `reflectprotect123-max/engineside` | `THE-hybrid-engine-v1` | splits / watts / RPM |
| Nutrition | `reflectprotect123-max/nutrition` | (own) | food / expenditure |

`@hybrid/adaptive` lives in the Engine repo. Strength does not load it.

Do **not** create `apps/engine/`, `apps/hybrid-engine/`, `apps/hybrid-strength/`,
or `packages/adaptive/` in this tree.

## In

- Strength Library: **Create Session Template** only
- Silent plan sync stays Strength-only; Me stays WHOOP

## Out

- Engine UI inside `apps/athlete/`
- A 1:1 copy of the Strength HTML shell kept here “as Engine”
- Mixing splits/watts/RPM onto a lift page

## Guard

- `apps/athlete/checks/athlete-app.smoke.mjs` — no `engine.js`, no Adaptive bundle, no `apps/engine/`
- `apps/athlete/checks/no-recall.smoke.mjs` — `apps/engine` and `packages/adaptive` must not exist
