# Adaptive logger — one door (drawing board)

**Date:** 2026-09-08  
**Status:** Draft — diagnosis + recommended rebuild. Do not implement until the owner says yes.  
**Product:** Hybrid HTML athlete app. One-set strength logger is the only lift UI.  
**Engines:** `@hybrid/adaptive` stays. Do not revive StrengthAdapter, Big Mac, or `@hybrid/strength-engine`.  
**Related:** `docs/superpowers/specs/2026-09-03-engine-three-module-redesign.md` (recipe). This file replaces that spec’s **HTML door** (`toggleSet`) with the door athletes actually tap.

---

## 0. Why this exists

The Adaptive **recipe** is right: Open paints the first box, Next re-aims from what you just did + how it felt, Close remembers last made.

The **wiring** is wrong. We have been shipping logger patches (old table → one-set → Adaptive Next bolted onto one-set) while the living spec still names `toggleSet` as the lift door. That function is dead UI. The live button is `StrengthOneSetLogger.nextStrengthSet`. For a stretch it still called deleted `StrengthAdapter.suggestNextSet`, so every set stayed empty.

That is not “Adaptive is dumb.” That is two loggers and two Next functions, only one of which the athlete hits.

---

## 1. What the athlete actually felt

| Symptom | Real cause |
| --- | --- |
| Type kg × reps on **every** set | One-set Next was not the Adaptive door. Old `fillNextLiftFromLog` only ran from `toggleSet` (table Log). |
| First set of a lift also blank | `openLift` only copies `S.adaptiveClose[exerciseId\|\|name]`. First session, or a name/id mismatch vs last Close, → `loadKg: null` → empty box. Spec allows typing the first set of a new lift; it does **not** allow blank remaining sets after a log. |
| Logger flipped (table vs one-set) | Blank-slate deleted `strength-one-set-logger.js`; `train()` later pointed at whichever file existed. Two UIs, one product. |
| “Engine doesn’t adapt” after a full session | Close runs only in `finishSession` via `persistCloseForEx`. Next **within** the session never used Close. If Next was dead, Close never got a chance to feel useful either. |
| Holds / carries “adapted” or confused | Seal is correct (no Adaptive). Copy-forward of kg is allowed on carries; Adaptive kg math is not. |

Capgo / cache / HPP Engine-on-lift-day bugs are **ship hygiene**, not Adaptive math. Keep them out of this rebuild except: one logger file, one cache pin, smokes that run the live button.

---

## 2. Locked product contract (this rebuild)

After you log a working set with a load, **the next working set of that lift is never empty.**

1. **Set 1, no Close for this lift:** athlete types kg (and reps if not already seeded from the card). This is the only intentional blank.
2. **Set 2+ same session:** Adaptive Next fills kg × reps. If Adaptive refuses (sanity, missing bundle, 0 load), **copy last logged kg × reps**. Never leave `''`.
3. **Next session, same lift:** Open fills set 1 from last Close. Athlete may edit, then Next.
4. **Feel:** slider → RIR vs target (default target 2). Medium on a single-number card (`5`) at 100 kg → **102.5 × 5**. Recipe in the 3 Sep spec is unchanged.
5. **Set count** does not change. Holds: WorkOverlay only. Carries: copy load/distance, no `decideNextLift`.
6. **One UI:** one-set logger. Table Log/Edit/`toggleSet` is not a product surface. Dead Next on that path must not be a second brain.

---

## 3. Approaches

### A — Keep patching both doors
Leave `fillNextLiftFromLog` on `toggleSet` and `fillNextFromAdaptive` on one-set Next. Grep smokes for `HybridAdaptive.decideNextLift` in `index.html`.

Reject. That is how we got here. The smoke can pass while the athlete button does nothing.

### B — Dumb autofill only (drop Adaptive in the logger)
Next always copies last kg × reps. Slider is cosmetic.

Reject. Owner: the **concept** works. We are not throwing out plate-round + RIR.

### C — One door module, one logger, copy-forward floor (recommend)
Extract a single HTML helper used by the one-set logger (and only by it):

- `openWorkingRow(ex)`
- `fillNextWorkingRow(ex, loggedRow)`
- `closeExercise(ex)` already exists as `persistCloseForEx`; call it from the same module.

`train()` / `strengthTask` stay one-set. `toggleSet` / `fillNextLiftFromLog` become no-ops or thin wrappers that call the same helper so leftover onclick cannot invent a second policy.

`@hybrid/adaptive` APIs do not change.

---

## 4. Design (approach C)

### 4.1 Files

| File | Job |
| --- | --- |
| `packages/adaptive` | Unchanged recipe. `openLift` / `decideNextLift` / `closeLift`. |
| **New** `apps/mobile/prototype/hybrid-app/adaptive-lift-door.js` | Only lift HTML door. Open / Next / Close + copy-forward floor + hold/carry seal. |
| `strength-one-set-logger.js` | UI only. Next set / extra set / superset Next call the door. No `StrengthAdapter`. |
| `index.html` | `strengthTask` → one-set. `applyOpenLifts` / `persistAdaptiveCloses` call the door. Delete or stub table Next so it cannot diverge. |
| Smokes | Drive `StrengthOneSetLogger.nextStrengthSet`, not string-search on `toggleSet`. |

### 4.2 Next (the live clock)

Input: logged `loadKg`, `reps`, `rir` (from slider), card range (`ex.reps` or row `target`).

```
if hold → do not call Adaptive, do not fill kg
if carry → copy last load + distance, stop
if no live kg metric → copy reps only
if loadKg <= 0 → copy reps if present, do not invent 2.5 kg
call decideNextLift
if ok and loadKg != null → write next row
else → copy last kg × reps
mark adaptiveFilled
```

Never return with next working row still `weight: ''` after a positive logged load.

### 4.3 Open

`liftCloseKey(ex) = exerciseId || name` today. Keep that, but **read** Close by id **or** name so HPP library titles vs ids still find last made.

If Close has `loadKg`, paint set 1. If not, leave kg blank (athlete types once). Seed reps from range min when empty.

### 4.4 Close

Unchanged math. Persist on `finishSession` (already). Optional later: persist when a lift’s last planned set is done so a crash before Finish does not lose the day. Not required for v1 of this rebuild.

### 4.5 Kill list

- All `StrengthAdapter.*` in the athlete HTML/JS (target RIR default `2` in the door).
- Product use of `toggleSet` as the Adaptive door. Spec 2026-09-03 § “HTML door = toggleSet” is superseded by this file.
- Grep-only Adaptive smokes that pass because `index.html` contains the string `decideNextLift` on a dead path.

### 4.6 Tests that can fail

Minimum, in `strength-one-set-logger.smoke.mjs` (or a dedicated `adaptive-lift-door.smoke.mjs` that loads the one-set logger):

1. 100 × 5, medium, Next → set 2 is `102.5` × `'5'`, hero HTML contains `102.5`.
2. Same with Adaptive bundle **removed** → set 2 is `100` × `'5'` (copy-forward floor), not `''`.
3. Hold / time_primary Next does not write Adaptive kg.
4. Carry copies weight + distance, does not call `decideNextLift` (spy).
5. Open with Close `{ loadKg: 80, reps: 5 }` paints set 1; Open with no Close leaves kg empty and seeds reps.

`pnpm run check:strength-one-set-logger` and `check:adaptive-logger` must exercise **those** calls.

### 4.7 Out of scope

- New Adaptive formulas, WHOOP on lifts, pain gates, LLM.
- Conditioning Next (already a separate door).
- Rebuilding the table logger.
- Capgo trial / billing.
- Inventing first-session kg from bodyweight or a working max.

---

## 5. Success

An HPP squat 5×5: type 100 on set 1, slide medium, Next → rest → set 2 already shows 102.5 × 5. Finish the lift, finish the session, start the next day with that lift → set 1 already shows last Close. You do not type five loads for one exercise.

Ship only after those smokes are green **and** a one-set Next path was run, not after a string grep on `index.html`.
