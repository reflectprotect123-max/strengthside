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
row:

1. **Open** — start from last time’s number (or you type one).
2. **Next** — you log a set → the **next** set’s numbers change.
3. **Close** — remember what you finished on. No secret end-of-week bump.

It never flips a day you meant to train. It never rewrites A/B’s lift
list.

---

## Who owns what

| | You | Engine |
| --- | --- | --- |
| Week | Paint Strength / Conditioning / Recovery. Move a stamp when work wrecks a day. | Never changes `dayKind`. No `decideDayKind`. |
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
| **Close** | Session done — remember the last make | `closeAnchor` | Returns the anchor; **adapter** saves it |

Same three functions for Strength and Conditioning. Recovery: if the
day is an empty rest stamp, these are not called. If the recovery card
has logged bouts, same clock.

### Shared rules

- Open never waits for a working max, level, or “3 exposures.”
- Next never saves the week. It only returns set N+1.
- Close never adds +2.5% “because the session went well.” It stores the
  last **made** load (or last used target). Next Monday’s Open reads that.
- WHOOP / HRV / sleep do not change Open or Next numbers. They do not
  flip the day.
- Pain is not a branch in these three modules.

---

## Next (the live clock)

Wakes on every completed set, not on Finish.

**Strength — owner golden path (template A, Bench 3×5 @ 80 kg)**

1. Open 80. Log 80 × 5, easy (RIR 2 or “too easy”).  
   → Next: **82.5 × 5** (one plate / 2.5% rounded to increment).
2. Log 82.5 × 4, miss.  
   → Next: **80 × 5** (last make this session). Not 82.5 × 0.95.
3. Log 80 × 5. Done. Bench is still Bench.  
   → Close stores **80**. Next Strength day Open is 80.

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
- Close stores **40**. Next Strength day Open is 40.

Same if you log *under* the ask and still make the reps (asked 40, you
did 35 × 6): last make is 35; Next holds 35 unless you miss.

+2.5% / plate rounding is the 16 Aug research **default**, not a proven
optimum. Applying it **set-by-set** is last night’s Next module + this
week’s owner lock. The old session-end `decideProgression` (wait 3
sessions, then bump) is dead.

**Conditioning** (once you have a card): same Next. Interval 1 easy at
220 W → interval 2 may be 230 W. Blow up → come back down. Never a squat
on a Conditioning day.

---

## Open and Close

**Open** prefers: you typed a number → else last Close anchor → else
blank logger.

**Close** returns `{ loadKg, reps }` or `{ lastTargetWatts, … }` from
what you actually finished. Adapter writes local hints. Close does
**not** run progress math.

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
   Close opener is 40.
3. Three easy sessions in a row: Close still does **not** invent an extra
   +2.5 on top of what Next already did in-session.
4. `dayKind` never appears in output; Strength vs Conditioning cannot
   rename the day.
5. Miss at 82.5 never yields 5% off 82.5.

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
