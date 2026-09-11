# Strength and Engine are two products

**Date:** 2026-09-11  
**Status:** LOCKED — owner freeze. Do not merge them into one HTML app.

## Rule

Strength and conditioning are **two different products**. Not two tabs. Not two
packages. Decision math for Engine stays in `@hybrid/adaptive`
(`packages/adaptive/`). Products are **apps**.

| Product | Path | Storage | Logger | Cloud |
| --- | --- | --- | --- | --- |
| Strength | `apps/athlete/` | `THE-brain-v1` | TRACK kg/reps | `PlanSync` / `strength_side` |
| The Engine | `apps/engine/` | `THE-hybrid-engine-v1` | splits / watts / RPM | none (no `PlanSync`) |

Stamp: `<meta name="hybrid-product">` + `PRODUCT.json`. Engine Android id
`com.hybrid.engine` is reserved; Strength stays `com.hybrid.athlete`.

Do **not** create `apps/hybrid-engine/` or `apps/hybrid-strength/` —
`apps/athlete/checks/no-recall.smoke.mjs` forbids those paths.

## In

- Engine Library: **Create Engine session** only
- Engine Next: `decideNextCond` only — never `decideNextLift`
- Strength Library: **Create Session Template** only
- Silent plan sync stays Strength-only; Me stays WHOOP (both products)

## Out

- Engine UI inside `apps/athlete/`
- Strength TRACK / HPP demo / `strength_side` inside `apps/engine/`
- Mixing splits/watts/RPM onto a lift page, or kg/reps onto an Engine interval

## Guard

- `apps/athlete/checks/athlete-app.smoke.mjs` — no `engine.js`, no Adaptive bundle, no Create Engine
- `apps/engine/checks/engine-app.smoke.mjs` — own storage, no PlanSync, Strength still separate
- `pnpm run check:engine-app` is on `verify`
