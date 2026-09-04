# Engine redesign — three modules (living spec)

**Date:** talk through 4 September 2026  
**Status:** recipe locked — not implemented  
**Product:** Hybrid HTML athlete app only.

This is **the** engine spec. Older Next formulas in git (e1RM-%, 3–30
cage, calf 20–30, cond +3/−5/−8 vs easy/medium/hard) are **wrong** if
they disagree with this file.

Blank slate: `2026-09-03-blank-slate-zero-engines.md`.  
Handoff: `handoff.md`.  
Plan: `docs/superpowers/plans/2026-09-04-adaptive-open-next-close.md`.

**Must not revive:** `@hybrid/strength-engine`, `@hybrid/engine`,
adapters, Big Mac, one-set logger, old `decideProgression` APIs.

---

## Locked recipe (4 Sep 2026)

You paint. Day (Strength / Conditioning / Recovery). Lifts, order,
sets. Reps as a number or a range. **One range only.** `3` and `5` is
3×5. Blank reps is **8–12**. No hidden 3–30. No secret calf band.
The engine fills kg first. You may change the box, then Log. Logged
kg is the next proxy and updates Est. 1RM.

**Lifts — RIR, not RPE.** Log weight × reps × RIR. Blank RIR = grind.
RIR 4 = easy (several left). RIR 2 = medium. RIR 0 = grind. First log
makes Est. 1RM. Every log updates it. Scoreboard only — not the
next-kilo boss.

After each set, next set:

**Range** (you typed `8-12`):

Hit the top (12)

- Easy (RIR 3–4) → +2.5 kg, back to the min
- Medium (RIR 2) → +2.5 kg, a bit above the min
- Hard (RIR 0–1) → same bar, try the top again

In the middle

- Easy or medium → same bar, same reps
- Hard → same bar, back to the min

Under the min → −2.5 kg, back to the min

**Single number** (you typed `5`, or 3×5): same kg rules. **Reps stay
5.** We do not push reps up. Easy 5 → +2.5 kg and still 5. Not 6.

Set count does not change. Last set is the one that counts. Next
session starts from that. Time off does not reset you.

**Holds.** Countdown only. Engine not called.

**Conditioning — RPE slider (talk test 1–10 below).** No double
progression. Slider only moves **work** (watts or split). Rest is rest.
You own the rounds. Rower/ski = split. Bike/Echo = watts.

You finish a work bout. A slider comes up: how hard was that? That is
RPE. You slide it. The next **work** target moves.

- Easy — more in you → a bit more watts, or a faster split
- About right → same target
- Hard → a bit less / slower
- Miss / had to stop → bigger cut

Intervals — slide after each work bout, during rest. Round count does
not change. Tempo — slide after a whole block. Steady — once mid-session
or at the end, not every minute.

You still pick the first watts or split. No history → you type it.
After that the slider steers.

**15 s hard (RPE 7–8) / 45 s easy (RPE 3–4):** that is still your
structure. The slider does not steal the clock. Slide after the 15 s
hard. The 45 s stays 45 s and stays easy. No second brain on rest. If
you never get back to easy, the next **hard** comes down so you can
recover. 45 s stays 45 s.

Not built yet. This is the recipe. Nutrition, coach, pain stops, old
engines: out.

---

## Who owns what

| | You | Engine |
| --- | --- | --- |
| Week | Paint Strength / Conditioning / Recovery. **Lift and cond are never the same day.** | Never changes `dayKind`. No `decideDayKind`. |
| Cards | Which lifts, order, **set count**. **One** reps range. Timed-hold **seconds**. Cond **target RPE** on work. | **kg** on lifts. After Log, **next kg and next reps**. Cond **watts or split** after work. Hold seconds stay on the card. |
| Logger | Lifts: **weight × reps × RIR**, Log. Blank RIR = grind (0 extra). Cond: RPE **1–10 after work only**. Rest is rest. | Engine fills kg first. Believe the **log**. |

**One range only.** No hidden 3–30 band. No secret calf 20–30. If calves
should be high, type `20-30`.

**How the range is read**

- Blank reps → **8–12**
- `8` → 8–8 (always “at the top” when you hit 8)
- `5-7` → 5–7
- `3` sets and `5` reps → 3×5

The engine fills kg first (Open / Next). You may change the box, then
Log. **Logged kg** is the proxy for Est. 1RM and the next Next. Sanity:
**refuse 0 reps or 80 reps** (not a second band — just reject that log
for Next).

Nutrition, coach publish, pain/illness product, LLM decide: **out**.

---

## Three sealed routes (one package)

**Package:** `@hybrid/adaptive` under `packages/adaptive/` (new).  
`packages/` is empty of product engines. New APIs. Do not copy deleted
files.

Pure TypeScript. Zero I/O. HTML logger is the only caller. `dayKind` is
**input**, never output.

**Nothing shares a door.** Lift, hold, and cond are three routes. They
do not share a `kind:` switch, a Next function, or an HTML helper that
can see both RIR and RPE.

| Route | HTML door (only this) | Package files | Never |
| --- | --- | --- | --- |
| **Lift** | `toggleSet` (Next), task finish (Close), first empty row (Open) | `open-lift.ts`, `decide-next-lift.ts`, `close-lift.ts`, `estimate-one-rm.ts` | RPE, watts, split, `WorkOverlay`, rest seconds |
| **Hold** | `startHoldCountdown` → `WorkOverlay.startWork` | **none** | `HybridAdaptive` at all |
| **Cond** | `advanceInterval` after work; `completeConditioning` for tempo/steady | `open-cond.ts`, `decide-next-cond.ts`, `close-cond.ts` | RIR, kg, reps double-progression, hold clock |

| Job | Lift API | Cond API |
| --- | --- | --- |
| Open | `openLift` | `openCond` |
| Next | `decideNextLift` | `decideNextCond` |
| Close | `closeLift` | `closeCond` |

There is **no** `decideNextSet` / `openTarget` / `closeAnchor` union.
There is **no** `{ kind: 'hold' }` on the package. Holds are not a
skipped adaptive call — they are a different door.

Shared utilities only: `parseRepRange` (lift cards), `roundToPlate`
(lift kg). Cond rounds watts in `decide-next-cond.ts`. Lift files must
not import cond files. Cond files must not import lift Next/Open/Close
or `estimateOneRm`.

**Est. 1RM (lifts only):**
`estimateOneRm({ loadKg, reps, rir })` → kilograms. Same math as
today’s `e1rmValue` in the HTML logger. Scoreboard + Close. **Not** the
Next kg formula. Cond has no 1RM.

Recovery empty rest stamp: **do not call** any adaptive function.
`recoverySession` / Recovery day: `completeConditioning` does **not**
open the cond slider. No watts. No split. Stamp done only.

### Shared rules

- Open never waits for a working max, level, or “3 exposures.”
- Next never saves the week. It only returns set N+1 (or next work
  output). It never changes set count or round count.
- Close never adds a weekly bump. Next Open is last Close even after
  time off. No layoff rule.
- WHOOP / HRV / sleep / HR do not change Open or Next numbers.
- Pain is not a branch in these three modules.

---

## Est. 1RM (scoreboard)

- **Per exercise.** Bench is not squat.
- From the log: weight, reps, RIR. No Peak slider.
- v1 = existing `e1rmValue`:  
  `load × (1 + (reps + rir) / 30)`  
  effective reps clamp **1–20**. Blank RIR = **0**.
- First log with no history **creates** the estimate.
- Updates every log. UI label: **Est. 1RM**.
- Close stores last-set kg, last-set reps, and that row’s Est. 1RM.
- Conditioning has no 1RM. Timed holds have no 1RM.

---

## Next — lifts (the live clock)

Wakes on every completed **working** set, not on Finish.

**Not** cond RPE. **Not** the talk-test 1–10. Lifts are **RIR**
(reps in reserve) on **weight × reps × RIR**. No Peak slider.

### Lift RIR scale (locked)

This is what the RIR box **means**. Blank = grind.

| RIR | How it felt | Talk to yourself |
| ---: | --- | --- |
| **4** (and 5+) | Easy. Several more in the tank. | Could have done 4+ extra reps |
| **3** | Easy. Clearly more in you. | 3 extra |
| **2** | Medium. Honest work. | About 2 extra |
| **1** | Hard. Maybe one more. | Almost done |
| **0** or blank | Grind. Nothing left. | No extra |

Logger: engine fills kg first. You may change the box, then Log
**kg × reps × RIR**. Logged kg is the proxy (Est. 1RM + next Next).
Next kg/reps come from the table below, **not** from Est. 1RM %.

**Un-log (locked).** Tap Log again to undo that set. The following
not-yet-logged row that Next filled goes back (clear the engine fill).
Do **not** invert the formula. Fix the row if it was wrong, Log again —
`decideNextLift` **reruns** from that log. Same for `logSupersetSet`.
If the next row is already logged, leave it.

---

**Mechanism:** double progression via **RIR**, inside **the range you
typed**. Easy in the **middle** of the range does **not** add weight.
A **single number** (`5`, 3×5, a true single `1`) uses the **same kg
rules** and **never moves reps**. Est. 1RM-% Next is **out**. Classic
“climb then live on 7s” is **out**. The 25 kg × 8 easy → jump toward
40 kg is **out**.

Plate step: **+2.5 / −2.5 kg** (round to 2.5).

RIR buckets for Next:

| How it felt | RIR |
| --- | ---: |
| Easy | **3–4** (5+ counts as easy) |
| Medium | **2** |
| Hard / grind | **0–1** (blank RIR = 0) |

Range = `{min, max}` from the card. Hit the top means `loggedReps >= max`.
Middle means `min <= loggedReps < max`. Under means `loggedReps < min`.

**Hit the top** (12 on 8–12, or 5 on a typed 5):

| RIR | Next kg | Next reps |
| --- | --- | --- |
| Easy 3–4 | **+2.5** | **min** |
| Medium 2 | **+2.5** | a bit above min: `min+2` if `(max-min) >= 4`, else `min+1` (still capped at max). If min=max, stay at min. |
| Hard 0–1 | same kg | **max** again |

Worked 8–12 examples: easy 12 → +2.5 and **8**. Medium 12 → +2.5 and
**10**. Grind 12 → same kg and **12**.

**In the middle** (8–11 on 8–12):

| RIR | Next kg | Next reps |
| --- | --- | --- |
| Easy or medium 2–4 | same | **same reps** |
| Hard / grind 0–1 | same | **min** |

**Under the min** → **−2.5 kg**, next reps = **min**.

**Single number (`min === max`)** — you typed `5`, not `5-7`. Same kg
as the table. Next reps are **always that number**. No “a bit above
min.” Logged 6 on a painted 5 still Next **5**. Easy 5 → **+2.5 × 5**.
Grind 5 → **same kg × 5**. Under (4) → **−2.5 × 5**.

Set count does not change. Warm-ups earlier so they never Close.

**Supersets (locked 4 Sep).** One lift at a time, in turn. Same lift
brain (`decideNextLift`). Not the hold clock. Not the cond slider.
HTML doors: `toggleSet` (single lift) **and** `logSupersetSet`
(superset). After you log squat, Next fills the **next squat** row for
that exercise, not the lunge in between. Close is per exercise.

---

## Open and Close — lifts

**Open** (first set of this lift today):

```text
range = parse(card)           # blank → 8–12
reps  = last Close reps
        → else range.min      # first-ever 8–12 starts at 8
kg    = last Close kg
        → else blank          # first-ever: you type it
```

Engine writes that into the first row even if a leftover number is
there. You may change it, then Log. Logged kg updates Est. 1RM. Est.
1RM does **not** pick Open kg.

**Close** = **last logged set only** `{ loadKg, reps, e1rmKg }`. Warm-ups
earlier so they never Close. A backoff as the last set is believed.

---

## Timed holds

No Open, no Next, no Close, no Est. 1RM. Card seconds + `WorkOverlay`
countdown. Weight on a loaded hold is whatever you typed.

---

## Next — conditioning

**Not** lift RIR. **Not** double progression. **Not** HR / WHOOP / FTP /
Morpheus / HRV.

The machine does not change. **If there is a work number, the slider
moves that number. If there is not, we do not invent one.**

| Modality | Work number | Notes |
| --- | --- | --- |
| Bike, Echo | **watts** | Slider Next |
| Rower, Ski erg | **split** s/500 m | Slider Next |
| Walk | **none** | Generally **easy** work. Minutes stay yours. No invented pace. |
| Run, Circuit, Other | **none** unless you typed watts or split | Chip still paints Easy/Medium/Hard. No invented FTP. |

Walk defaults the chip to **Easy** if you did not paint one.

You paint **Easy / Medium / Hard** on the card (not a typed `7–8`).

| Chip | Painted work band |
| --- | --- |
| Easy | **3–4** |
| Medium | **5–7** |
| Hard | **8–9.5** |

After work you slide **1–10**. We compare that slide to the chip’s
band. Easy/rest is meant to feel about **3–4**. Rest duration does
**not** get a slider and does **not** change.

You still pick the watts or split to **begin**. No history → you type
the first one. After that the slider steers.

### Cond RPE scale (locked) — talk test

This is what the slider **means**. `% Max Capacity` is how the bout
should **feel**, not a watts formula. We do **not** set watts to 70% of
a max. We do **not** use HR.

| RPE | Feel | Talk test | Typical use |
| ---: | --- | --- | --- |
| **1** | Effortless. Takes focus to go this easy. | Normal conversation | Warm-up, cool-down, active recovery |
| **2** | Relaxed “all-day” aerobic | Conversational | Easy aerobic, low fatigue |
| **3** | Very comfortable. Light sweat. | Conversational | Easy aerobic / recovery spin |
| **4** | Comfortable, slight rise in breathing | Slight interference | Easy/mod aerobic |
| **5** | Tempo, steady, sustainable | 2–3 sentences max | Steady / long tempo hold |
| **6** | On the aerobic/anaerobic edge | Broken sentences | Harder tempo / threshold-ish hold |
| **7** | Deep, rapid breathing. Hard to focus. | Short phrases / words | Hard intervals |
| **8** | Intense rhythm. Discomfort mounting. | Single words only | Very hard intervals |
| **9** | Near max. Laboured. | Gasping / grunts | Sprint / almost all-out |
| **10** | Redline. A few seconds. | Cannot speak | Max / had to stop |

Painted **Hard (8–9.5)** means the hard bout should land in that band
on this scale. Easy *should* feel **3–4** — we still **do not** slide
the easy/rest.

### After work — Next

Slide **after the work bout**. Compare actual RPE vs painted work
target:

| How the work felt vs target | Next **work** number |
| --- | --- |
| Easy — more in you (actual **below** the painted band) | a bit more: **+3% watts**, or **−1 s** /500 m split |
| About right (inside the painted band, e.g. 7–8) | **hold** |
| Hard (above the band, not a stop) | a bit less: **−5% watts**, or **+1 s** /500 m |
| Miss / had to stop, or actual **10** | bigger cut: **−8% watts**, or **+3 s** /500 m |

Watts round to a whole watt.

If the easy/rest never gets you back to easy (you are still cooked
when the next hard starts), treat that as **too hard** on the next
**work** number — cut the hard. Do not lengthen rest. Do not invent a
second slider.

### When you slide

| Structure | When | What moves | What does not |
| --- | --- | --- | --- |
| **Intervals** (e.g. 15 s hard / 45 s easy) | After each **hard** bout, during rest | Next hard watts/split | Clock. 15 s stays 15 s. 45 s stays 45 s. Round count. |
| **Tempo block** (e.g. 8 min) | After the whole **block** | Next block’s work number | Not every 30 s. Rest stays rest. |
| **Steady** | Once **mid-session** or at the **end** | Mid: rest of *this* session. End: next session’s Open. | Not every minute. |

You own how many rounds / blocks.

**Open / Close (cond):** typed watts or split win. Else last Close
(including a steady session that only slid at the end). Else blank
(no invented FTP). Close stores last made **work** output.

---

## Wiring (later; not this file’s code)

1. New package only. Tests green **before** HTML wire.
2. Calendar stamps stay in the HTML app.
3. After each logged **lift** set → `decideNextLift` → next row.
4. Seconds rows start `WorkOverlay` — **zero** `HybridAdaptive`.
5. After each cond **work** bout → `decideNextCond` → next work number only.
6. Session end lift → `closeLift`. Cond → `closeCond`. Next Open is that Close.
7. You pick lifts in Library. Engine does not invent exercises.
6. You pick lifts in Library. Engine does not invent exercises.

Do not write package code until the plan is executed on purpose.

---

## Tests (package, before any HTML wire)

Colocated. No `--passWithNoTests`.

**Range**

1. Blank → `{ min: 8, max: 12 }`. `5` → `{ 5, 5 }`. `5-7` → `{ 5, 7 }`.
2. `20-30` on a calf name is just that range — no extra calf rule.

**Est. 1RM**

3. `40×6` @ RIR 2 matches today’s `e1rmValue`. Same set @ RIR 0 is lower.
4. Blank RIR = 0 extra.

**Lift Next (8–12 unless noted)**

5. 80 × 12 @ RIR 4 → **82.5 × 8** (top + easy).
6. 80 × 12 @ RIR 2 → **82.5 × 10** (top + medium, min+2).
7. 80 × 12 @ RIR 0 → **80 × 12** (top + grind).
8. 80 × 10 @ RIR 3 → **80 × 10** (middle + easy: no jump).
9. 80 × 10 @ RIR 0 → **80 × 8** (middle + grind → min).
10. 80 × 6 @ RIR 2 → **77.5 × 8** (under min).
11. Single number `5`: 80 × 5 @ RIR 4 → **82.5 × 5**. 80 × 5 @ RIR 2 →
    **82.5 × 5** (not 6). 80 × 6 @ RIR 3 still Next **5** (do not push
    reps up). 80 × 4 @ RIR 2 → **77.5 × 5**.
12. Range `5-7`: 80 × 7 @ RIR 2 → **82.5 × 6** (min+1). Range still
    moves reps. Single number does not.
13. Logged 0 or 80 reps → Next **refuses** (no substitute band).
14. Next never returns a new set count.

**Open / Close**

15. First-ever, blank range, no Close: reps **8**, kg **blank**.
16. Open writes last Close kg even if a leftover number is in the box.
    Change the box, then Log — that logged kg is the next proxy.
17. Close is last logged set only. Next Open uses that kg and those reps
    even after time off. Close does not add +2.5 on top of Next.

**Holds / day**

18. Holds never call the package. `WorkOverlay` only.
19. `dayKind` never appears in output. `decideNextLift` on a Conditioning day
    refuses. `decideNextCond` on a Strength day refuses.

**Cond**

20. 220 W, target 7–8, actual 7 → **220**. Actual 5 (talk-test easy vs
    7–8) → **227**. Actual 9 → **209**. Actual 10 or stopped → **202**.
21. Split 120 s/500 m, too easy → **119**. Too hard → **121**. 10/stop
    → **123**.
22. Round count and rest seconds are not in the result. 15/45: Next
    never returns a new rest duration.
23. RPE meaning is the talk-test table (7 = short phrases, 10 = cannot
    speak). `% Max Capacity` on that table is copy, not a watts %.

---

## Out of scope

- Restoring deleted engines / adapters / Big Mac / nutrition
- Coach publish/pull
- Pain/illness UI or stops
- LLM decide
- Inventing a conditioning card you did not write
- Auto-painting the week
- Peak Strength 16-week parabolic / red-dot CNS protocol
- Helms/Zourdos table (later swap, not v1)

---

## Supersedes

| File / idea | Why |
| --- | --- |
| e1RM-% Next + % chart in older revisions of this file | Scoreboard only now |
| Hidden 3–30 working band | You type one range |
| Calf-named 20–30 override | Type `20-30` if you want it |
| Cond felt vs easy/medium/hard + two-push cap | Target RPE vs actual RPE |
| `2026-09-04-strength-v2-set-by-set-design.md` | Parallel write |
| `2026-09-03-autopilot-v3-unified-design.md` | Named deleted adapters |
| `2026-09-03-autopilot-clean-rebuild-plan.md` | Rebuild-in-place |
| 17 Aug Adaptive V2 `decideProgression` | Session-grain clock |
