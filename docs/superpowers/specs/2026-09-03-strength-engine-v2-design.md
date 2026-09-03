# Strength Engine V2 — athlete adaptive logger

**Date:** 2026-09-03  
**Status:** Approved for planning (brainstorming)  
**Scope:** Fresh strength decision system for the Hybrid HTML athlete app. **Strength only.** **Athlete autopilot only.** Replaces V1 inter-session silent progression as the primary product path.

## Problem

V1 wired `@hybrid/strength-engine` for end-of-session silent bumps, optional WM gates, and calibration gates (multiple rated sessions before trust). Dogfood feedback:

- Prescription bugs (WM stamped as session load) broke trust.
- Slider difficulty did not reliably feed progression.
- Progression felt invisible and slow (three-session calibration).
- In-session adaptation exists (`decideNextSet`) but was not the product center.
- Superset rest and logger flow issues masked whether the engine was working.

The logger UI and flow are good. The **decision layer** needs a ground-up contract aligned with how athletes actually train: **adapt every set**, learn effort over time, no mandatory WM.

## Goal

After V2, an athlete can:

1. Start a lift with **no history** — enter Set 1 weight manually.
2. Finish each set with **slider + reps** — next set load/reps update **silently** in the hero.
3. Return next session — Set 1 is **suggested** from last session’s final set load (editable).
4. Override any suggested weight — engine **recalibrates** from the edit.
5. Feel the system **adapt from session one** via weight suggestions only — no WM gates, no weekly bump math, no slider tutorial.

## Non-goals (V2 phase)

| Out of scope | Notes |
| --- | --- |
| Conditioning progression | Same engine shell later; not V2.1 |
| Recovery gates (check-in, WHOOP) | No blocking/damping load changes |
| Coordinator / BIG MAC weekly brain | Parked |
| Coach publish / prescribe path | Athlete-only first |
| Mandatory working max gate | WM optional metadata only |
| Visible “why load changed” copy | Silent hero updates (numbers only) |
| End-of-session progression banners | Silent |
| Pain/illness stops | Repo lock — classification may remain; no new consumption work |
| Testing weeks / explicit 1RM screens | V2.2+ (Peak-style optional later) |
| Postgres schema changes | Local-first; adapter owns state |

## Locked product decisions

| Topic | Decision |
| --- | --- |
| Primary loop | **In-session:** every finished set → engine plans next set |
| Set 1 (first ever on lift) | Athlete enters weight manually |
| Set 1 (return visit) | Suggested = **last session final set load**, always editable |
| Set 2+ signals | **Slider + reps vs target** — missed reps dominate over slider |
| Week-to-week | **No extra bump** — next suggestion = where you left off (final set load) |
| Working max | **Never required** — optional athlete metadata only |
| Slider calibration | **No tutorial hint.** Same 6 labels; **silent background learning** per exercise from rated sets. **Manual weight edit → slight recalibration** only (capped nudge, never a full reset) |
| Load change UX | **Silent** — hero numbers update only; athlete sees **weight suggestions**, not explanations |
| Reference model | Peak Strength–style autoreg: difficulty + performance → next weight; Est-ability from logs not gates |

### What the athlete sees

- **Weight suggestion** = the number in the hero (load × reps). That is the only “engine output” in V2.1 UI.
- **No** one-time slider tooltip, coaching toast, or “why we changed” line.
- Slider remains unlabeled beyond the existing six difficulty words.

## Architecture

**Approach:** Rewrite decision surface inside existing `@hybrid/strength-engine` (pure functions). New thin adapter paths; **dumb logger** calls adapter after each set. Do **not** embed rules in `strength-one-set-logger.js`.

```text
┌─────────────────────────────────────┐
│  One-set logger (UI only)           │
│  · hero load/reps (weight suggestion)│
│  · 6-step difficulty slider         │
│  · finish set → adapter.planNext    │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  strength-adapter (browser)         │
│  · ExerciseAnchor read/write        │
│  · EffortProfile read/write         │
│  · htmlRow → PerformedSet           │
│  · detect manual load edit          │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  @hybrid/strength-engine (pure)     │
│  planNextSet()                      │
│  updateEffortProfile()              │
│  closeStrengthSession()             │
│  + rounding, e1rm helpers (keep)    │
└─────────────────────────────────────┘
```

### Package boundaries

- **`@hybrid/strength-engine`:** zero I/O; all set-to-set and profile-update math; colocated tests.
- **`strength-adapter.js`:** localStorage / state mutation; calls engine; no business rules inline.
- **`strength-one-set-logger.js`:** render + capture; calls adapter on set complete.

### V1 modules — disposition

| Module | V2.1 |
| --- | --- |
| `decideNextSet` | **Promote** — core of `planNextSet` |
| `decideInitialPrescription` | **Narrow** — cold-start defaults only when no anchor |
| `decideProgression` / calibration gates | **Bypass** for athlete autopilot path |
| `WorkingMax` | **Optional** — never gate session start |
| Recovery signals on bumps | **Disconnect** from strength V2 path |
| Exposure / PR / e1RM | **Keep** for analytics and future coach |

## Data model (local-first)

### ExerciseAnchor

One row per `exerciseId` — sticky note for between-session Set 1 suggestion.

```ts
interface ExerciseAnchor {
  exerciseId: string;
  lastSetLoadKg: number;
  lastSetReps: number;
  lastTargetReps: number;
  lastDifficulty: DifficultyKey;
  lastSessionId: string;
  updatedAt: string; // ISO
  workingMaxKg?: number; // optional, athlete-entered
}
```

### EffortProfile

Per-exercise learned mapping from slider labels to load deltas (Peak-like silent calibration).

```ts
type DifficultyKey =
  | 'very_easy' | 'easy' | 'medium' | 'hard' | 'max' | 'did_not_complete';

interface EffortProfile {
  exerciseId: string;
  sampleCount: number;
  /** Load delta (kg) applied when athlete selects label AND hits target reps */
  bumpKg: Record<DifficultyKey, number>;
  lastUpdated: string;
}
```

**Day-1 defaults** (barbell, 2.5 kg rounding) — illustrative:

| Label | Default Δkg |
| --- | --- |
| very_easy | +5 |
| easy | +2.5 |
| medium | 0 |
| hard | 0 |
| max | −2.5 |
| did_not_complete | −5 |

After each rated set, engine compares predicted vs actual outcome and nudges the label’s `bumpKg` (small step, clamped). If athlete repeatedly marks Easy but misses reps, Easy bump shrinks automatically.

### Manual weight edit (slight recalibration)

When athlete changes load in hero vs engine suggestion before logging:

1. Adapter sets `manualLoadOverride: true` on the performed set payload.
2. Engine treats logged load as ground truth for **this set**.
3. `updateEffortProfile` applies a **small** nudge toward the override (e.g. ≤ one equipment increment toward the back-solved label delta) — **not** a full rewrite of the profile.
4. Subsequent suggestions move gradually; one angry edit does not yank the whole model.

Same behavior if athlete edits Set 1 suggestion before starting.

## Session flows

### First session on a lift (no anchor)

```
Set 1: athlete enters load + reps → rates difficulty
  → planNextSet → Set 2 suggestion (silent)
Set 2..N: repeat
Close: anchor ← final set; update effort profile
```

### Return session

```
Set 1: pre-fill anchor.lastSetLoadKg (editable)
  → athlete may edit → recalibration flag if changed
Set 2..N: as above
Close: update anchor + profile
```

### Bad day (suggested load feels heavy)

No special “deload next week” rule. Within session, missed reps + Hard/Max → next sets drop. Anchor at close reflects **final** set load, so next week’s suggestion is naturally lower.

## planNextSet — decision rules (V2.1)

**Inputs:** performed set, prescribed target reps, equipment, effort profile, optional anchor.

**Priority:**

1. **Reps short of target** → decrease load (dominates slider).
2. **`did_not_complete`** → decrease more; optionally reduce target reps for next set.
3. **`hard` / `max`** with target met → hold or small decrease.
4. **`medium`** with target met → hold.
5. **`easy` / `very_easy`** with target met → increase by `profile.bumpKg[label]` (rounded).

Always round to equipment increment. Never increase load if current set missed rep target.

**Output:**

```ts
interface NextSetPlan {
  loadKg: number;
  targetReps: number;
  reasonCodes: string[]; // audit/debug only; not shown in UI V2.1
}
```

## closeStrengthSession

Updates `ExerciseAnchor` from final working set of each exercise in session. Appends optional audit entry (`meta.progressionAudit`) with `engineVersion: 'strength-v2'` for debugging — not shown to athlete.

No weekly `decideProgression` call on athlete path.

## Logger UX

| Element | Behavior |
| --- | --- |
| Hero load/reps | Shows **weight suggestion**; editable (edit → slight recalibration on log) |
| Slider | Existing 6 labels unchanged; no tutorial overlay |
| Effort hint | **None** — no one-time sheet/toast |
| Set complete | No explanation line when load changes |
| Superset | Same planNextSet per exercise; partner rest unchanged from logger fixes |

## Testing & success criteria

**Unit tests (engine):**

- Cold start Set 1 manual → Set 2 plan from medium + on-target reps.
- Missed reps → down regardless of Easy slider.
- Easy + on-target → up by profile bump.
- Profile learns: repeated “easy + miss” shrinks easy bump.
- Manual load override → profile recalibrates.
- closeSession → anchor = last set load.

**Smoke tests (adapter + logger):**

- First session exercise → anchor written after complete.
- Second session → Set 1 pre-filled from anchor.
- Finish set → hero updates without page reload.

**Dogfood success (human):**

- New athlete, no WM: three lifts × three sets feels adaptive within first workout.
- Return week: suggested Set 1 matches last week’s final set; editable.
- Override weight: subsequent sets track the override, not old suggestion.

## Migration from V1

1. Ship V2 engine functions beside V1; feature flag `settings.strengthEngineV2` default **on** for blank-slate athletes.
2. On read: if `ExerciseAnchor` missing, seed from last completed session final set per exercise (one-time migration).
3. Stop calling `applySilentProgression` on athlete path when V2 flag on.
4. WM gate UI: hide when V2 on (optional WM in exercise detail only).
5. Remove dead calibration copy from progress UI when V2 stable.

## Build order (implementation phases)

| Phase | Deliverable |
| --- | --- |
| **V2.1** | `planNextSet` + `EffortProfile` + adapter + logger wiring; tests; ship athlete path |
| **V2.2** | Superset parity, rep-only lifts, timed holds using same profile model |
| **V2.3** | Optional testing week / manual max fix screen (Peak parity) |
| **V3** | Conditioning planner in same shell; recovery gates only if product re-opens |

## Related docs

- Superseded for athlete autopilot path: `2026-08-24-strength-recovery-silent-wire-design.md` (silent weekly bumps + recovery gates).
- Engine package rules: root `CLAUDE.md`.
- Recent hotfix context: PR #160 (WM hint, slider→RPE, superset rest) — partial V1 repair; V2 replaces the decision contract.

## Open questions (deferred)

- Global vs per-exercise effort profile defaults for dumbbells vs barbell.
- Whether to surface Est. 1RM on Progress tab from V2 implied max (display only).
- Coach path: same engine, different Set 1 source (prescribed vs anchor) — post V2.1.
