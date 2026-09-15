# Sync on open + one WHOOP

**Date:** 2026-09-15  
**Status:** Approved (owner chose option A — full pull every open)  
**Product:** HYBRID S&C

## ELI5

One login. Every time you open the app — even five times today — it pulls fresh WHOOP strain/recovery and syncs your cloud notebooks. Strength and Engine share the same WHOOP connection and the same recovery numbers on Home.

## Locked behaviour

| Rule | Detail |
| --- | --- |
| One login | Supabase email/password for HYBRID S&C |
| One WHOOP | Connect once; token keyed on signed-in user; both houses read/write shared integration storage |
| Sync every open | Cold boot + return from background: `hydrateAuth` → `PlanSync.syncNow` → `Whoop.syncAll` (no 5-minute throttle) |
| Option A | Full WHOOP pull every time (not smart/debounced) |
| Houses | Training data still `strength_side` / `engine_side`; only integrations are shared |
| Coach | Parked |
| Netlify | Not used |

## Done when

1. Open app while signed in → WHOOP + plan sync run without tapping Sync.
2. Open again 1 minute later → WHOOP pulls again (strain can update).
3. Connect WHOOP in Strength → Engine Home shows same recovery/strain after toggle.
4. `pnpm run check:athlete-app` passes.
