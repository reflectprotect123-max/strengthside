# Metric-aware logger — design spec (frozen builder)

**Date:** 2 September 2026  
**Status:** Draft — owner sign-off before Slice M1 code  
**Plan:** `docs/superpowers/plans/2026-09-02-metric-logger-slices.md`  
**Baseline build:** `the-hybrid-athlete-engine-v153` (post #148)

## Owner sign-off

- [x] Frozen builder contract accepted
- [x] Logger flows (load×reps, timed hold, carry) accepted
- [x] Left/right flow accepted
- [x] Time/distance manual-only (no auto progression) accepted
- [x] Slice M1 may start

## Problem

Athletes need to **manually program** any combination of load, reps, time, and distance per lift. The **logger** must mirror those columns — including a **work timer** for duration, then the existing **effort slider**, then **rest**. The **builder card chrome** shipped in v153 must stay visually the same; only metric data and dropdown behaviour may change.

## Frozen builder contract (MUST NOT change)

These elements stay as shipped in v153 — layout, copy, and presence:

| Element | Keep |
| --- | --- |
| Card shell | `ath-lift-card`, `logger-screen ath-builder-twin`, eyebrow `Hybrid Strength · builder` |
| Name input | `athLiftName_{bi}_{ei}` inline title |
| Exercise suggest list | `athSuggest_*` picker |
| Hero label | `Load & effort · session start fills numbers` |
| Rest row | `Rest (seconds)` number input |
| Calibration | `How should this feel?` slider → `ex.targetRir` |
| Superset card | `Superset · builder` + A/B panels with letter pills |
| **Absent** | Rest countdown preview, post-set slider, Next/Extra set, setchip |

**Allowed changes (data + metric row only):**

- Number of metric dropdowns (1–3) inside existing `hero-metrics` grid
- Dropdown kinds (`reps`, `time_sec`, `weight_kg`, `distance_m`, etc.)
- Optional **Side mode** control: one compact row under hero-metrics (`None` / `L+R per round`) — no new card sections
- Library pick → default `logColumns` (user can override via dropdowns immediately)

## Log column kinds (builder dropdowns)

From `log-columns.js` `KINDS`:

| Kind | Label | Maps to engine metric |
| --- | --- | --- |
| `reps` | Reps | `reps` |
| `reps_range` | Reps (min–max) | `reps` |
| `weight_kg` | Weight (kg) | `load` |
| `weight_pct_wm` | Weight % (of WM) | `load` (via WM resolve) |
| `weight_lwp` | Weight (LWP) | `load` |
| `time_sec` | Time (seconds) | `duration` |
| `distance_m` | Distance (metres) | `distance` |

**Max columns:** 3 (carries: load + distance + time). Default for blank lift: `weight_pct_wm` + `reps`.

## Progression rules (explicit)

| Metric | Auto session→session | In-session autoreg |
| --- | --- | --- |
| Load (kg / % / LWP) | Yes (WM, hints, calibration) | Yes (`suggestNextSet` adjusts kg) |
| Reps | Yes (volume hints, rep progression) | Yes |
| RIR | Target from builder | Slider → next set load |
| **Time (seconds)** | **No** — manual template | **No** — log actual; optional work timer fills value |
| **Distance (m)** | **No** — manual template | **No** |

**Timed holds** (`time_sec` primary effort): must **not** use `repProgressionLift` volume hints (plank bug fix).

## Logger state machine (per set)

### A — Load × reps (default)

```
ACTIVE (edit kg × reps) → slider → Next → REST → next set
```

### B — Time-primary (plank)

```
WORK TIMER (countdown to prescribed sec) → ACTIVE (confirm/log seconds) → slider → Next → REST
```

Skip / Done early on work timer writes actual seconds to row.

### C — Load + time (weighted plank)

```
ACTIVE (edit kg) → WORK TIMER → confirm seconds → slider → Next → REST
```

### D — Carry (load + distance + time)

```
ACTIVE (edit kg, m, sec OR work timer on time column) → slider optional if strength RIR applies → Next → REST
```

Carry may omit RIR slider when no load-bearing progression applies — TBD in Slice M8; default keep slider for consistency in v1.

## Left / right (`sideMode`)

| Value | Logger behaviour |
| --- | --- |
| `none` | Current behaviour |
| `both_per_round` | Round chip: `Left · Round 1/3` → log → `Right · Round 1/3` → log → REST → Round 2… |

Builder: compact select `sideMode` default `none`. Stored on exercise: `ex.sideMode`.

**Not in v1:** alternate-every-set without rest between sides; per-side different loads.

## Library defaults

Source: `test/fixtures/exercise-load-profiles.json` (read-only JSON at runtime — copy minimal lookup into `exercise-load-profiles.js` or load fixture in app).

On `pickAthleteLiftSuggest(bi, ei, exerciseId, …)`:

- Resolve profile by `exerciseId`
- Set `logColumns` kinds from profile `log_columns` (values empty)
- Do **not** rebuild builder card chrome — refresh metrics row only

Examples:

| Exercise | Default columns |
| --- | --- |
| Back Squat | `weight_pct_wm`, `reps` |
| Plank | `time_sec` |
| Farmer Walk | `weight_kg`, `distance_m`, `time_sec` |

## Acceptance artifacts

| Slice | Artifact |
| --- | --- |
| M3 | Playwright or smoke: hero HTML contains `Seconds` not `kg` for plank twin |
| M4 | Screen recording: plank work timer → slider → rest |
| M7 | Screen recording: split squat L → R → rest |

## Out of scope

- Auto progression of time or distance
- Coach builder changes
- New Supabase migrations
- Conditioning logger changes
- Renaming builder eyebrow/copy
- Capgo ship (separate slice per release)
