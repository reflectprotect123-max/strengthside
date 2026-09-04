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
| Logger | You log **weight × reps × RIR**, or **weight × seconds × RIR** on a timed hold (the set row already on the phone). | After each log, **Next** fills set N+1 from those fields. |

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
  uses that row’s `e1rmValue` (about **51 kg**). Next set still **~40**,
  not 27.5. If RIR is high (very easy), Est. 1RM is higher and Next may
  add a plate.
- **Close** writes the session’s best working-set Est. 1RM (and last
  make). Progress chart = that series over weeks.
- Conditioning has no 1RM. Watts stay watts.
- **Timed holds have no 1RM.** Seconds rows already skip `e1rmValue` in
  the logger (`targetKind === 'seconds'`). Do not feed hold time into
  the % chart — 30 s is not 30 reps.

---

## Next (the live clock)

Wakes on every completed set, not on Finish.

**Mechanism:** after you tap Log, update Est. 1RM from that row, then
the next weight is a **% of that Est. 1RM**. The % is not a separate
chart — it is the same `e1rmValue` formula run backwards for the next
set’s reps and the template’s target RIR (`targetRir`, default 2).

```text
e1rm  = e1rmValue(loggedWeight, loggedReps, loggedRir)
pct   = 1 / (1 + (nextReps + targetRir) / 30)   // e.g. 5 @ RIR 2 ≈ 81%
nextW = e1rm × pct
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

Read it: log a set → new Est. 1RM → next kg = Est. 1RM × the cell for
**next reps × target RIR**. Template 5s at RIR 2 → always the **81.1%**
cell. Reps on the card change → different row, same column.

**Strength — owner golden path (template A, Bench 3×5 @ 80 kg, target RIR 2)**

1. Open 80. Log 80 × 5, RIR 2 (on plan).  
   Est. 1RM ~98.7 → 81% of that is **~80**. Next holds. On-plan RIR
   does **not** add a plate.
2. Log 80 × 5, RIR 3 (easier than target).  
   Est. 1RM ~101.3 → Next **82.5**.
3. Log 82.5 × 4, RIR 0 (miss / grind).  
   Est. 1RM comes from **what you did** (~93.5), not from 82.5 as a max.  
   Next 5 @ RIR 2 is **~75**. No `82.5 × 0.95` rule.
4. You change the bar yourself: asked 25 × 6, log **40 × 6**, RIR 2.  
   Est. 1RM ~50.7. Next 6 @ RIR 2 is **~40**, not 27.5, not 42.5.

| How the set went vs target RIR | What the % does |
| --- | --- |
| Logged RIR **higher** than target (easier) | Est. 1RM up → next weight **up** |
| Logged RIR **on** target | Est. 1RM fits → next weight **holds** |
| Logged RIR **lower** / missed reps | Est. 1RM down → next weight **down** |
| You typed a different kg | Est. 1RM from **that** kg → next weight matches it at target RIR |

The +2.5%-per-easy-set shortcut is **out**. A planned RIR 2 set that
lands at RIR 2 must not add a plate.

**Timed holds** (`targetKind: seconds` — plank, hang, wall sit, weighted
hold). Same Open / Next / Close. Same RIR box. The number that moves is
**seconds**, not % of Est. 1RM.

```text
Open  = last made seconds (and last kg if the hold was loaded)
Next  = if RIR on target → same seconds
        if RIR easier    → +5 s
        if you quit early → what you actually held
        if you typed a longer time → believe that time
        then round to 5 s
Close = last made seconds (and last kg)
```

No Est. 1RM. No % chart. Weight on a loaded hold **copies forward**; it
does not go through Epley. You can type a heavier kg — Next believes it,
same as 25 → 40 on a lift.

**Hold golden path (plank 3 × 30 s, target RIR 2)**

1. Open 30. Log 30 s, RIR 2 → Next **30 s**.
2. Log 30 s, RIR 4 → Next **35 s**.
3. Log 18 s, RIR 0 (failed) → Next **20 s** (18 rounded to 5 s), not 30.
4. Asked 20 s, you hold **45 s**, RIR 2 → Next **45 s**, not 25.

**Conditioning** (once you have a card): same Next, **on a Conditioning
day only**. Interval 1 easy at 220 W → interval 2 may be 230 W. Blow up
→ come back down. Never a squat on that day. Never a row on a Strength
day. A plank on a Strength card is a timed hold, not conditioning.

---

## Open and Close

**Open** prefers: you typed a number → else (lift) `e1rm × pct(targetReps, targetRir)` rounded to plates → else (hold) last Close seconds → else last Close load → else blank.

**Close** returns `{ loadKg, reps, e1rmKg }` for a lift, `{ seconds, loadKg }`
for a hold, or watts for cond, from what you actually finished. Adapter
saves hints + Est. 1RM when there is one. Close does **not** invent an
extra bump on top of Next.

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

1. Bench 80 × 5 @ RIR 2 → Next holds ~80 (on-plan RIR does not add a plate).
2. Bench 80 × 5 @ RIR 3 → Next ~82.5 (Est. 1RM up, then % of that).
3. Asked 25×6, logged 40×6 @ RIR 2 → Est. 1RM ~50.7, Next ~40, not 27.5 and not 42.5.
4. 40×6 at 2 RIR → `e1rmValue` matches today’s logger hint; 40×6 at 0 RIR
   → lower Est. 1RM (harder set, smaller implied max).
5. Three easy sessions in a row: Close still does **not** invent an extra
   +2.5 on top of what Next already did in-session.
6. `dayKind` never appears in output; Strength vs Conditioning cannot
   rename the day.
7. Miss at 82.5 × 4 @ RIR 0 → Est. 1RM from that set (~93.5), Next ~75.
   Never treats 82.5 as the new max (no 82.5 × 0.95 rule).
8. % chart matches inverse `e1rmValue`: 5 @ RIR 2 = 81.1%, 6 @ RIR 2 =
   78.9%, 1 @ RIR 0 = 96.8% (not 100).
9. Plank 30 s @ RIR 2 → Next 30 s; 30 s @ RIR 4 → Next 35 s.
10. Asked 20 s, logged 45 s @ RIR 2 → Next 45 s, not 25.
11. Seconds rows never call `e1rmValue` and never use the % chart
    (30 s is not 30 reps). Weighted hold copies kg; Next still moves time.

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
