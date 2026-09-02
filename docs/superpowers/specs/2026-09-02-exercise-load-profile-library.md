# Exercise metric & load profile library

**Date:** 2 September 2026  
**Scope:** Reference data only (not wired into `strength-adapter.js`).  
**Fixture:** `test/fixtures/exercise-load-profiles.json` (generated)  
**Generator:** `node scripts/gen-exercise-load-profiles.mjs`

## Problem

The athlete app must know **which metrics to log** per exercise: kg, %WM, reps, time, distance, RIR. Today that behavior is scattered across regex in `strength-adapter.js`, builder column pickers in `log-columns.js`, and a separate 120-exercise library with `tracking_mode` that is **not connected**.

Agents keep re-deriving rules (e.g. treating barbell curl as bodyweight). This fixture is the single reference for **exercise → profile → metrics**.

## Three layers

| Layer | Source | What it defines |
| --- | --- | --- |
| **Engine metrics** | `packages/strength-engine/src/metric.ts` | 12 canonical metrics (`load`, `reps`, `rpe`, `rir`, `duration`, `distance`, …) |
| **Logger columns** | `log-columns.js` `KINDS` | Builder/logger UI: `weight_kg`, `weight_pct_wm`, `reps`, `time_sec`, `distance_m` |
| **Exercise profile** | This fixture | Which columns + metrics apply to each of the 120 exercises |

### Logger → engine mapping (strength)

- `weight` / `weight_kg` / resolved %WM → **`load`** (kg)
- `reps` → **`reps`**
- Last-set **`rir`** slider → stored as **`rpe`** (`10 − RIR`) on the representative set
- Pain flag → **`pain`** (safety; blocks calibration when `pain_blocked`)

## Tracking modes (120-library)

| `tracking_mode` | Count | Default profile | Metrics per set |
| --- | ---: | --- | --- |
| `reps_load` | 100 | resolved by rules | `load` + `reps` (or reps only) |
| `duration_distance` | 7 | `cardio_duration_distance` | `duration`, `distance` |
| `distance_time_load` | 7 | `carry_distance_time_load` | `load`, `distance`, `duration` |
| `time_or_reps` | 4 | `isometric_time_or_reps` | `duration` |
| `reps_or_time` | 2 | `isometric_time_or_reps` | `reps` or `duration` |

## Load profiles (8)

| Profile | Example exercises | Log columns | Progression metrics |
| --- | --- | --- | --- |
| `main_pct_wm` | Back squat, bench, deadlift, press | %WM, reps | load, rpe |
| `accessory_kg_reps` | Curl, row, leg press, machines | kg, reps | load |
| `bodyweight_reps` | Pull-up, dip, push-up, Nordic | reps | reps |
| `added_load_bw` | Weighted pull-up (when belt enabled) | kg, reps | load, reps |
| `self_scaled_reps` | TRX curl (not in 120 seed) | reps | reps |
| `isometric_time_or_reps` | Plank, dead bug | time | duration |
| `cardio_duration_distance` | Assault bike, rower | time, distance | duration, distance |
| `carry_distance_time_load` | Farmer walk, sled push | kg, distance, time | load, distance |

### `reps_load` resolution rules

1. TRX / suspension → `self_scaled_reps`
2. Bodyweight calisthenics without external equipment → `bodyweight_reps`
3. Main barbell compounds → `main_pct_wm`
4. Everything else (curls, rows, isolation, unilateral) → `accessory_kg_reps`

Profile distribution in generated fixture: **29** main, **61** accessory, **10** bodyweight, **7** cardio, **7** carry, **6** isometric.

## Curl family (example, not special-cased)

| Exercise | Profile | Metrics |
| --- | --- | --- |
| Barbell / DB / cable curl | `accessory_kg_reps` | load, reps, rir→rpe |
| TRX curl | `self_scaled_reps` | reps only (angle scales difficulty) |
| Nordic curl | `bodyweight_reps` | reps (library says `reps_load` but profile overrides) |

## Adapter divergences (documented, not fixed here)

- `curl` in `REP_PROGRESSION_NAME` misclassifies weighted curls on `main` (fixed on `cursor/engine-session-start-rx-84a0`).
- `row`, `carry`, `leg press` in rep-progression regex — many should use `accessory_kg_reps` or `carry_distance_time_load` with load metrics.

## Regenerate after library edits

```bash
node scripts/gen-exercise-load-profiles.mjs
pnpm run check:exercise-load-profiles
```

## Follow-up (option B)

Wire `strength-adapter.js` to look up `exercise_id` in this fixture instead of name regex; default builder columns from `log_columns`.
