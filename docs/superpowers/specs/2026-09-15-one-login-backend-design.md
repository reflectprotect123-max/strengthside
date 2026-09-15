# One login backend — Supabase hardening

**Date:** 2026-09-15  
**Status:** Shipped in THE-HYBRID-ENGINE1 migrations `20260915_*`

## Problem

HYBRID S&C app writes `strength_side` and `engine_side` via `upsert_athlete_domain_snapshot`, but Postgres only allowed legacy domain names (`strength`, `conditioning`, …). Cloud plan sync failed with `invalid domain`.

## Fix

1. **`20260915_hybrid_sc_domains.sql`** — admit `strength_side` + `engine_side` in table CHECK and both RPC guards.
2. **`20260915_ecosystem_grant_hardening.sql`** — `REVOKE ALL` on ecosystem tables from `anon`/`authenticated`; grant only `SELECT, DELETE` (writes stay RPC-only).

## Client fallback (no dashboard required)

Until this SQL is applied, athlete PlanSync still prefers `strength_side` /
`engine_side`, then retries the hosted-admitted names `strength` /
`conditioning`. Calendar occupancy peeks both. Apply the migration later to
use the locker names as the row keys.

## Apply on hosted project

From `THE-HYBRID-ENGINE1` repo after merge:

```bash
npx supabase link --project-ref orysjncrksmdfabpuftd
npx supabase db push
```

Or run the two SQL files in order via Supabase SQL editor.

## Verified

`node checks/migrations-apply.mjs` in THE-HYBRID-ENGINE1 — `strength_side` and `engine_side` RPC writes pass; unknown domains still refused; anon has no grants on ecosystem tables.
