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
2. **Next** — you log a set → the **next** set’s kg **and** reps change.
3. **Close** — remember last make **and** the new Est. 1RM.

It never flips a day you meant to train. It never rewrites A/B’s lift
list.

---

## Who owns what

| | You | Engine |
| --- | --- | --- |
| Week | Paint Strength / Conditioning / Recovery. Move a stamp when work wrecks a day. **Lift and cond are never the same day.** | Never changes `dayKind`. No `decideDayKind`. Never puts a row on a Strength day or a squat on a Conditioning day. |
| Cards | Template A and B (lifts, order, set count). Cond card when you make one. | Numbers only on lifts/cond (kg, reps, watts). Hold seconds stay on the card. |
| Logger | You log **weight × reps × RIR** on a lift. Timed holds use the card’s seconds and a **countdown**, not Next. | After each **lift** log, **Next** fills set N+1 **kg and reps**. Holds do not go through Next. Set count stays on the card. |

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
`estimateOneRm({ loadKg, reps, rir })` → kilograms. Same math as
today’s `e1rmValue` in the HTML logger. Not a gym max.

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
- **From the log (exact current logger):** weight, reps, RIR on the set
  row. No new Peak slider. Formula v1 is what `e1rmValue` already does:
  Epley with effective reps = logged reps + RIR  
  (`load × (1 + (reps + rir) / 30)`). If RIR is blank, treat as 0 extra
  reps (same as today’s hint when RIR is empty). Helms/Zourdos table is
  a later swap if we want it — not v1.
- **Not a tested max.** UI label is Est. 1RM. A later true 1RM test
  can override; until then this is the number.
- **Updates when you log.** 25 → you lift 40 × 6 at 2 RIR → Est. 1RM
  uses that row’s `e1rmValue` (about **51 kg**). Next is **40 × 6**, not
  27.5 × 5. If RIR is high (very easy), Est. 1RM is higher and Next may
  add a plate at the same reps.
- **Close** writes the session’s best working-set Est. 1RM (and last
  make). Progress chart = that series over weeks.
- Conditioning has no 1RM. Watts stay watts.
- **Timed holds have no 1RM and no Next.** Seconds rows already skip
  `e1rmValue`. Do not feed hold time into the % chart — 30 s is not 30
  reps. The card’s seconds stay the card’s seconds. The logger runs a
  countdown (`WorkOverlay`). Engine Open / Next / Close are not called.

---

## Next (the live clock)

Wakes on every completed set, not on Finish.

**Mechanism:** after you tap Log, update Est. 1RM from that row, then
fill **both** next boxes: reps you just did, and kg as a **% of that
Est. 1RM** for those reps at the template’s target RIR (`targetRir`,
default 2). Same `e1rmValue` formula run backwards. Set count does not
change.

```text
e1rm     = e1rmValue(loggedWeight, loggedReps, loggedRir)
nextReps = loggedReps                         // believe the log
pct      = 1 / (1 + (nextReps + targetRir) / 30)
nextW    = e1rm × pct
           then round to plates (2.5 kg)
```

`e1rm / (1 + (nextReps + targetRir) / 30)` is the same line. Same three
boxes you already type. No extra slider.

**v1 % chart** — every cell is that formula. Not a Helms/Zourdos lookup.
Effective reps (`reps + RIR`) clamp 1–20, same as `e1rmValue`. A true
1-rep max at RIR 0 is **96.8%**, not 100% — that is Epley, not a bug.
Next uses the **target RIR column** (default **RIR 2**), not RIR 0.

| Reps | RIR 0 | RIR 1 | RIR 2 | RIR 3 | RIR 4 | RIR 5 |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 96.8% | 93.8% | 90.9% | 88.2% | 85.7% | 83.3% |
| 2 | 93.8% | 90.9% | 88.2% | 85.7% | 83.3% | 81.1% |
| 3 | 90.9% | 88.2% | 85.7% | 83.3% | 81.1% | 78.9% |
| 4 | 88.2% | 85.7% | 83.3% | 81.1% | 78.9% | 76.9% |
| 5 | 85.7% | 83.3% | **81.1%** | 78.9% | 76.9% | 75.0% |
| 6 | 83.3% | 81.1% | 78.9% | 76.9% | 75.0% | 73.2% |
| 7 | 81.1% | 78.9% | 76.9% | 75.0% | 73.2% | 71.4% |
| 8 | 78.9% | 76.9% | 75.0% | 73.2% | 71.4% | 69.8% |
| 9 | 76.9% | 75.0% | 73.2% | 71.4% | 69.8% | 68.2% |
| 10 | 75.0% | 73.2% | 71.4% | 69.8% | 68.2% | 66.7% |
| 12 | 71.4% | 69.8% | 68.2% | 66.7% | 65.2% | 63.8% |
| 15 | 66.7% | 65.2% | 63.8% | 62.5% | 61.2% | 60.0% |

Read it: log a set → new Est. 1RM → next **reps = what you just did** →
next kg = Est. 1RM × the cell for **those reps × target RIR**. You did
5s at RIR 2 → 81.1% cell, 5s again. You did 4s → 4s at the 4-rep cell.
Open (first set of the day) still uses the **card’s** reps.

**Strength — owner golden path (template A, Bench 3×5 @ 80 kg, target RIR 2)**

1. Open 80 × 5. Log 80 × 5, RIR 2 (on plan).  
   Est. 1RM ~98.7 → Next **80 × 5**. On-plan does **not** add a plate
   and does not change reps.
2. Log 80 × 5, RIR 3 (easier than target).  
   Est. 1RM ~101.3 → Next **82.5 × 5**.
3. Log 82.5 × 4, RIR 0 (miss / grind).  
   Est. 1RM from **what you did** (~93.5). Next **reps = 4**, kg = 4s @
   RIR 2 ≈ **77.5**. Not 75 × 5, not 82.5 as a max.
4. You change the bar yourself: asked 25 × 5, log **40 × 6**, RIR 2.  
   Est. 1RM ~50.7. Next **40 × 6**, not 27.5 × 5, not 42.5 × 6.

| How the set went vs target RIR | What Next writes |
| --- | --- |
| Logged RIR **higher** than target (easier) | Same reps, Est. 1RM up → kg **up** |
| Logged RIR **on** target | Same reps, kg **holds** |
| Logged RIR **lower** / missed reps | **Reps = what you did**, kg from that cell |
| You typed a different kg or reps | Est. 1RM from **that** row → next matches it at target RIR |

The +2.5%-per-easy-set shortcut is **out**. A planned RIR 2 set that
lands at RIR 2 must not add a plate.

**Timed holds** (`targetKind: seconds` — plank, hang, wall sit). **No
advancement.** Not Open, not Next, not Close, not % of Est. 1RM.

The card says 30 s → every set is 30 s. The logger **starts `WorkOverlay`**
for that many seconds when you tap **Hold**. Done / done-early logs the
hold. Next set is the same 30 s and another countdown.

Weight on a loaded hold is whatever you typed or copied. Engine does
not change it.

**Conditioning** (once you have a card): same Next, **on a Conditioning
day only**. Interval 1 easy at 220 W → interval 2 may be 230 W. Blow up
→ come back down. Never a squat on that day. Never a row on a Strength
day. A plank on a Strength card is a timed hold (countdown only), not
conditioning.

---

## Open and Close

**Open** prefers: you typed a number → else `e1rm × pct(cardReps, targetRir)` (card’s reps, same inverse as Next) rounded to plates → else last Close load → else blank. Timed holds skip Open.

**Close** returns `{ loadKg, reps, e1rmKg }` (or watts for cond) from
what you actually finished. HTML app saves hints + Est. 1RM. Close does
**not** invent an extra bump on top of Next. Timed holds skip Close.

---

## Wiring (later; not this file’s code)

1. New package only.
2. Calendar stamps stay in the HTML app. The package never reads the
   calendar.
3. After each logged **lift** set → `decideNextSet` → next row.
   Seconds rows start `WorkOverlay` instead — no `decideNextSet`.
4. Session end → `closeAnchor` → hint for next Open.
5. You edit A/B in Library. Engine does not invent exercises.

Implementation plan is a later step. Do not write package code until
that plan exists and is approved.

---

## Tests (before any HTML wire)

Colocated. No `--passWithNoTests`.

1. Bench 80 × 5 @ RIR 2 → Next **80 × 5** (on-plan does not add a plate or change reps).
2. Bench 80 × 5 @ RIR 3 → Next **82.5 × 5**.
3. Asked 25×5, logged 40×6 @ RIR 2 → Est. 1RM ~50.7, Next **40 × 6**, not 27.5×5 and not 42.5×6.
4. 40×6 at 2 RIR → `e1rmValue` matches today’s logger hint; 40×6 at 0 RIR
   → lower Est. 1RM (harder set, smaller implied max).
5. Three easy sessions in a row: Close still does **not** invent an extra
   +2.5 on top of what Next already did in-session.
6. `dayKind` never appears in output; Strength vs Conditioning cannot
   rename the day.
7. Miss 82.5 × 4 @ RIR 0 → Est. 1RM ~93.5, Next **77.5 × 4** (believes 4,
   not 75 × 5, not 82.5 as a max).
8. % chart matches inverse `e1rmValue`: 5 @ RIR 2 = 81.1%, 6 @ RIR 2 =
   78.9%, 1 @ RIR 0 = 96.8% (not 100).
9. Seconds rows skip Open / Next / Close and never call `e1rmValue`
   (30 s is not 30 reps). Card seconds stay card seconds.
10. Timed hold v1 is a logger countdown (`WorkOverlay`) for the
    prescribed seconds — no +5 s, no “believe a longer hold.”
11. Next never changes set count. Card 3× stays 3 sets.

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
