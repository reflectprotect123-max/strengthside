# Stage 3 — Connector degrade matrix

| Client | Concept2 Logbook | Echo FTMS watts |
| --- | --- | --- |
| Chrome Android | OAuth + sync via hybrid proxy (same Hybrid account as WHOOP) | Connect Echo on Bike modality live log |
| Desktop Chrome | Same | Same (lab / trainer) |
| iOS Safari | OAuth/sync OK if signed in; Web Bluetooth Echo **unavailable** — message explains Chrome Android | Hidden/disabled with reason |
| No Hybrid sign-in | Clear “Sign in (WHOOP card)” copy — never bricks Strength | N/A |

**Policy:** HR strap + Echo may coexist (separate status lines). Echo calories are device-tagged only (`deviceCalories`) — never written into Nutrition totals. Concept2 imports become conditioning history only — never overwrite strength tasks.
