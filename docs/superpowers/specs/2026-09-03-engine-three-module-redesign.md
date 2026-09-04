# Engine redesign — three autopilot modules

**Date:** 2026-09-03  
**Status:** design (maps talk → package shape)  
**Scope:** Athlete autopilot only. Coach, PM5 CSAFE, EffortProfile learning, supersets V2.2 — later.

---

## ELI5

Today the engines are a junk drawer: working-max math, weekly bumps, calibration gates, level ladders, and the useful in-session slider brain all live in one pile.

We rebuild around **three jobs every workout does**, for both strength and Echo:

1. **Open** — “What do I start with?” → last time’s number (or you type one).
2. **Next** — “That set/interval felt ___ → what’s next?” → slider math.
3. **Close** — “Workout done → remember what I finished on.” → save only. No secret bump.

Same three verbs. Two domains (lift / watts). Everything else is support or legacy.

---

## The three modules (shared contract)

Pure TypeScript. Zero I/O. Callers inject data. Adapters own persistence.

| Module | Job | Strength name | Cond name | Input (shape) | Output |
|---|---|---|---|---|---|
| **1. Open** | First target of the session | `openStrengthTarget` | `openCondTarget` | anchor + optional effort/benchmark + equipment | starting load/reps **or** watts (+ HR zone label) |
| **2. Next** | Intrasession autoreg | `decideNextSet` *(exists)* | `decideNextPhase` *(exists)* | what just happened + slider + equipment/caps | next load/reps **or** next watts (capped) |
| **3. Close** | Persist memory only | `closeStrengthAnchor` | `closeCondAnchor` | completed work this session | new anchor record (no progression decision) |

### Shared rules (both domains)

- Open never requires a working max / level / calibration count.
- Next never writes long-term state.
- Close never bumps. It mirrors what was done (or last target used).
- Red/WHOOP day: may shift **HR zone edges** and optionally **volume**; does **not** ease starting watts/load in Open (product default A).
- Pain flag: may classify exposure; does not invent a stop in these three modules.

---

## Domain A — Strength (`@hybrid/strength-engine`)

### Keep (first-class)

| File / API | Role in V3 |
|---|---|
| `decideNextSet.ts` | **Module 2** |
| `rounding.ts` / equipment | Open + Next load rounding |
| `e1rm.ts`, `pr.ts`, `performed.ts`, `metric.ts` | Logging / PRs — not progression |
| `exposure.ts` | History for Open fallback when no hint; pain class |
| `resolve.ts` | Optional %WM when athlete set a manual max |

### New (thin, pure)

| API | Behavior |
|---|---|
| `openStrengthTarget({ lastLoadKg, lastReps, equipment, manualLoadKg?, pctOfMax?, workingMaxKg? })` | Prefer `manualLoadKg` → else `lastLoadKg` → else `%WM` if both present → else unresolved (logger shows blank) |
| `closeStrengthAnchor({ sets: { loadKg, reps, completed }[] })` | Last completed working set load (and reps for rep-mode lifts). Returns `{ loadKg, reps }` — **adapter** writes `loadHints` / `volumeHints` |

### Demote (keep code, stop calling on athlete path)

| API | Why |
|---|---|
| `decideProgression` / `DeterministicDecider` | Session-end bumps — dead for athlete autopilot |
| `calibration.ts` as a **gate** | Labels in Progress UI only; never block Open |
| `decideInitialPrescription` volume autopilot | Optional later; not required for Open load |
| `workingMax` as required Open input | Optional for % prescriptions / Progress edit |

### Adapter contract (`strength-adapter.js`)

```
session start  → openStrengthTarget → fill row 1
each set end   → decideNextSet     → fill next row
session end    → closeStrengthAnchor → write loadHints[exerciseId]
                 (+ recordPrEvents; no applySilentProgression bumps)
```

`saveSessionAnchors` in the adapter **is** Close + I/O. Pure Close stays in the package so tests don’t need the HTML app.

---

## Domain B — Conditioning (`@hybrid/engine` conditioning surface)

### Keep (first-class)

| File / API | Role in V3 |
|---|---|
| `decideNextPhase.ts` | **Module 2** (+ watts push cap already added) |
| `hr.ts` / `conZones` | Daily zone edges from WHOOP — Open labels HR, not watts |
| `CON_EFFORTS` / format builders | Structure (rounds/work/rest), not progression level |
| Echo FTMS / logger UI | Telemetry + dumb display (outside pure engine) |

### New (thin, pure)

| API | Behavior |
|---|---|
| `openCondTarget({ lastTargetWatts, maxWatts, effort, formatKey })` | If `lastTargetWatts` → use it (optionally clamp to effort band). Else `maxWatts * effortPct` (easy 0.60 / med 0.80 / hard 0.92). Else unresolved |
| `closeCondAnchor({ targetWatts, avgWatts?, maxWattsPrev? })` | Returns `{ lastTargetWatts, maxWatts: max(prev, target, avg) }` — adapter writes `settings.condAnchors[key]` |
| `condAnchorKey({ format, modality, device })` | e.g. `intervals:bike:echo` |

### Demote / stop athlete calls

| API | Why |
|---|---|
| `conAdapt` level/miss | Not athlete Close |
| `decideInitialCondPrescription` level ladders | Structure from template/builder; watts from Open |
| `conProgress` as Open input | Ignore for athlete watts |

### Adapter contract (`engine-adapter.js`)

```
session start  → openCondTarget → task.targetWatts
rest boundary  → decideNextPhase (pushCount ≤ 2) → update targetWatts
session end    → closeCondAnchor → settings.condAnchors[key]
                 applyConAdapt = no-op (or coach-only later)
```

---

## Module map (where code lives)

```
packages/strength-engine/src/
  openTarget.ts      ← NEW  Module 1
  decideNextSet.ts   ← KEEP Module 2
  closeAnchor.ts     ← NEW  Module 3
  progression.ts     ← LEGACY (tests only / coach later)
  calibration.ts     ← LEGACY gate removed; label helper ok
  workingMax.ts      ← OPTIONAL support for resolve %

packages/engine/src/
  openCondTarget.ts  ← NEW  Module 1
  decideNextPhase.ts ← KEEP Module 2
  closeCondAnchor.ts ← NEW  Module 3
  conditioning.ts    ← KEEP formats/efforts; conAdapt marked legacy
  hr.ts              ← KEEP zone edges (Open support, not Open watts)
```

Adapters stay dumb I/O:

```
apps/mobile/.../strength-adapter.js  → calls Open/Next/Close, writes local state
apps/mobile/.../engine-adapter.js    → same for cond
apps/mobile/.../*-logger.js          → UI only; never invents progression
```

---

## What we are deleting from the *athlete path* (not necessarily files day 1)

| Remove from call graph | Replacement |
|---|---|
| WM gate before `startSession` | Open with blank or last anchor |
| `autopilotReadyForExercise(…, 2)` gate on hints | Open uses hint immediately |
| `applySilentProgression` → `decideProgression` | Close → `saveSessionAnchors` |
| `applyConAdapt` → level++ | Close → `saveCondAnchors` |
| Recovery gate that blocks silent bumps | Gone with silent bumps |
| Cond “level” as watts source | Open from anchor / % max |

Package files can stay until smokes/coach stop importing them — **stop calling first**, delete files when nothing references them.

---

## Data shapes (anchors)

**Strength** (existing keys, new meaning):

```ts
strengthState.loadHints[exerciseId] = {
  loadKg: number;
  updatedAt: string;
  source: 'session_anchor' | 'manual' | 'history_seed';
}
// rep-mode:
strengthState.volumeHints[exerciseId] = { sets, reps, updatedAt, source: 'session_anchor' }
```

**Conditioning** (new):

```ts
settings.condBenchmarkMaxW?: number; // manual max W
settings.condAnchors: Record<string, {
  lastTargetWatts: number;
  maxWatts: number;
  updatedAt: string;
}>
// key = `${fmt}:${modality}:${device}` e.g. intervals:bike:echo
```

No new Supabase tables required for the 2-day athlete path (local + existing sync blobs).

---

## 2-day build order (engines then wire)

**Day 1 — Strength three modules**
1. Add `openStrengthTarget` + `closeStrengthAnchor` + tests.
2. Adapter: Open on apply load hints; Close on session end; Next already wired.
3. Kill WM gate + calibration gate + progression apply on athlete finalize.
4. Smokes: anchor write/read, no bump, gate empty.

**Day 2 — Cond three modules**
1. Add `openCondTarget` + `closeCondAnchor` + `condAnchorKey` + tests.
2. Adapter + logger: Open watts, Next with push cap, Close anchors; `applyConAdapt` no-op.
3. Watts hero (target / live / Δ) in interval logger.
4. Smokes: Echo intervals key, % effort from max, push cap.

**Explicitly later:** PM5 CSAFE, steady polish, EffortProfile, coach pins, deleting `progression.ts` / `conAdapt` files, package rename.

---

## Success test (skeptical engineer)

1. Fresh lift, no WM → start session → type load → finish → next session opens at that load.
2. Same load three sessions → Close does **not** invent +2.5 kg.
3. Slider “too easy” mid-session → Next bumps set N+1 only; Close still saves final performed.
4. Echo intervals, max W 300, medium → Open ~240 W; two “too easy” pushes then hold; Close stores last target under `intervals:bike:echo`.
5. `pnpm verify` green; old progression/conAdapt smokes assert legacy APIs exist but athlete wiring does not call them.
