# Engine redesign — three modules (living spec)

**Date:** 2026-09-03 (talk) · **Aligned:** 2026-09-04 (blank slate + owner locks)  
**Status:** living design — not implemented  
**Product:** Hybrid HTML athlete app only.

This is **the** engine spec. Do not also follow the 4 Sep “Strength V2”
file or the 3 Sep Autopilot V3 / clean-rebuild notes — those are
superseded pointers.

Blank slate: `2026-09-03-blank-slate-zero-engines.md`.  
Handoff: `handoff.md`.  
**Must not revive:** `@hybrid/strength-engine`, `@hybrid/engine`,
adapters, Big Mac, one-set logger, old `decideProgression` APIs.

---

## ELI5

You paint the week: Strength, Conditioning, or Recovery. You own
templates A and B. You change the lifts.

The engine does three jobs, every workout, same verbs for a lift or a
row — plus a **guessed 1RM** per lift so you can see strength go up
and so Open/Next are not just “whatever you did last time in kilos.”

1. **Open** — start from last time’s number (or you type one), using
   Est. 1RM when we have one.
2. **Next** — you log a set → the **next** set’s numbers change.
3. **Close** — remember last make **and** the new Est. 1RM.

It never flips a day you meant to train. It never rewrites A/B’s lift
list.

---

## Who owns what

| | You | Engine |
| --- | --- | --- |
| Week | Paint Strength / Conditioning / Recovery. Move a stamp when work wrecks a day. **Lift and cond are never the same day.** | Never changes `dayKind`. No `decideDayKind`. Never puts a row on a Strength day or a squat on a Conditioning day. |
| Cards | Template A and B (lifts, order, set count). Cond card when you make one. | Numbers only (kg, reps, watts, time). |
| Logger | You log the set. | After each log, **Next** fills set N+1. |

Nutrition, coach publish, pain/illness UI, and LLM decide are out.

---

## The three modules (one package)

**Package:** `@hybrid/adaptive` under `packages/adaptive/` (new).  
`packages/` is empty on `main`. New APIs. Do not copy deleted files.

Pure TypeScript. Zero I/O. HTML logger is the only caller. `dayKind` is
**input**, never output.

| Module | Job | API | Writes long-term state? |
| --- | --- | --- | --- |
| **Open** | First target of this exercise / bout | `openTarget` | No |
| **Next** | After a logged set / interval | `decideNextSet` | No |
| **Close** | Session done — remember last make + Est. 1RM | `closeAnchor` | Returns the anchor; **adapter** saves it |

**Est. 1RM (pure helper, used by Open / Next / Close):**
`estimateOneRm({ loadKg, reps, rir })` → kilograms. Not a gym max.

Same three functions for Strength and Conditioning. Recovery: if the
day is an empty rest stamp, these are not called. If the recovery card
has logged bouts, same clock.

### Shared rules

- Open never waits for a working max, level, or “3 exposures.”
- Next never saves the week. It only returns set N+1.
- Close never adds +2.5% “because the session went well.” It stores the
  last **made** load and the session Est. 1RM. Next Monday’s Open reads
  those.
- WHOOP / HRV / sleep do not change Open or Next numbers. They do not
  flip the day.
- Pain is not a branch in these three modules.

---

## Est. 1RM

Owner lock (4 Sep 2026): **compute a 1RM estimate** so strength is
visible over time and so guesses are better than raw last-kilos.

- **Per exercise.** Bench Est. 1RM is not squat Est. 1RM.
- **From the log:** load, reps, and RIR (or Peak-style difficulty).
  Formula v1: Helms / Zourdos 2016 Table 2 (citable).  
  `e1rm = loadKg / percent(reps, rpe)` where `rpe ≈ 10 − rir`.  
  If RIR is missing, treat as RPE 8 (2 RIR) so a typed 40 × 6 still
  computes. Version the table; do not paste a keto-blog grid.
- **Not a tested max.** UI label is Est. 1RM. A later true 1RM test
  can override; until then this is the number.
- **Updates when you log.** 25 → you lift 40 × 6 at 2 RIR →  
  40 / 0.79 ≈ **51 kg** Est. 1RM. Next set at 6 @ ~RPE 8 is still
  **~40**, not 27.5. If that set was *very* easy, Est. 1RM is higher
  and Next may add a plate.
- **Close** writes the session’s best working-set Est. 1RM (and last
  make). Progress chart = that series over weeks.
- Conditioning has no 1RM. Watts stay watts.

---

## Next (the live clock)

Wakes on every completed set, not on Finish.

**Strength — owner golden path (template A, Bench 3×5 @ 80 kg)**

1. Open 80. Log 80 × 5, easy (RIR 2 or “too easy”).  
   → Next: **82.5 × 5** (one plate / 2.5% rounded to increment).
2. Log 82.5 × 4, miss.  
   → Next: **80 × 5** (last make this session). Not 82.5 × 0.95.
3. Log 80 × 5. Done. Bench is still Bench.  
   → Close stores **80** and the session Est. 1RM.

| How the set went | Next set |
| --- | --- |
| Made target, easy (RIR ≥ 2, or slider too-easy, or extra reps) | **progress** — last make + plate (2.5% rounded to increment) |
| Made target, grind (RIR 0–1 / slider hold) | **hold** |
| Missed target reps | **revert_to_last_make** — last made load this session; if none, original Open |

**You typed a different weight than it asked.** Believe the log, not the
prescription. Asked **25 × 6**, you log **40 × 6** because 25 was a joke.

- Last make = **40**, not 25.
- Next set is **40 × 6** (re-anchor). It does **not** crawl 25 → 27.5. It
  does **not** also slap on a plate the same set you just jumped 15 kg
  (not 42.5 yet).
- If the next set at 40 is easy too, *then* Next may add a plate.
- Close stores **40** and Est. 1RM ≈ **51 kg**. Next Strength day Open
  can be 40, or 51 × the next session’s target %.

Same if you log *under* the ask and still make the reps (asked 40, you
did 35 × 6): last make is 35; Next holds 35 unless you miss.

+2.5% / plate rounding is the 16 Aug research **default**, not a proven
optimum. Applying it **set-by-set** is last night’s Next module + this
week’s owner lock. The old session-end `decideProgression` (wait 3
sessions, then bump) is dead.

**Conditioning** (once you have a card): same Next, **on a Conditioning
day only**. Interval 1 easy at 220 W → interval 2 may be 230 W. Blow up
→ come back down. Never a squat on that day. Never a row on a Strength
day.

---

## Open and Close

**Open** prefers: you typed a number → else `e1rm × percent(targetReps, targetRpe)` rounded to plates → else last Close load → else blank.

**Close** returns `{ loadKg, reps, e1rmKg }` (or watts for cond) from
what you actually finished. Adapter saves hints + Est. 1RM. Close does
**not** invent an extra bump on top of Next.

---

## Wiring (later; not this file’s code)

1. New package only.
2. Calendar stamps stay in the HTML app. The package never reads the
   calendar.
3. After each logged set → `decideNextSet` → next row.
4. Session end → `closeAnchor` → hint for next Open.
5. You edit A/B in Library. Engine does not invent exercises.

Implementation plan is a later step. Do not write package code until
that plan exists and is approved.

---

## Tests (before any HTML wire)

Colocated. No `--passWithNoTests`.

1. Bench golden path above (82.5 then back to 80; opener 80).
2. Asked 25×6, logged 40×6 easy → Next is 40×6, not 27.5 and not 42.5.
   Est. 1RM ≈ 51 kg. Close opener can use that, not 25.
3. 40×6 at 2 RIR → `estimateOneRm` ≈ 51; 40×6 at 0 RIR → lower Est. 1RM
   (harder set, smaller implied max).
4. Three easy sessions in a row: Close still does **not** invent an extra
   +2.5 on top of what Next already did in-session.
5. `dayKind` never appears in output; Strength vs Conditioning cannot
   rename the day.
6. Miss at 82.5 never yields 5% off 82.5.

---

## Out of scope

- Restoring deleted engines / adapters / Big Mac / nutrition
- Coach publish/pull
- Pain/illness UI or stops
- LLM decide
- Inventing a conditioning card you did not write
- Auto-painting the week (3 lift / 2 cond / 2 recovery)

---

## Supersedes

| File | Why |
| --- | --- |
| `2026-09-04-strength-v2-set-by-set-design.md` | Parallel write; folded here |
| `2026-09-03-autopilot-v3-unified-design.md` | Same three jobs; named deleted adapters |
| `2026-09-03-autopilot-clean-rebuild-plan.md` | Rebuild-in-place; engines were deleted |
| 17 Aug Adaptive V2 Phase E `decideProgression` | Session-grain clock is wrong |
