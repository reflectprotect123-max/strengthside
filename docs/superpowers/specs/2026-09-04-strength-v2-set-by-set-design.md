# Strength V2 — set-by-set adaptive engine (2026-09-04)

**Status:** Design locked in owner brainstorm (4 Sep 2026). Not implemented.
**Product:** Hybrid HTML athlete app only.
**Supersedes (grain only):** 17 Aug 2026 Adaptive engine V2 Phase E
(`decideProgression` after the session, last working set, wait for 3
exposures). That session-grain clock is **wrong** for this product.
**Does not supersede:** the twelve-table metric/ledger shape in
`2026-08-17-strength-rebuild-design.md` (storage only).
**Must not revive:** `@hybrid/strength-engine`, adapters, Big Mac, old
`decideProgression` / `StrengthAdapter` APIs. New package, new names.

Blank slate: `2026-09-03-blank-slate-zero-engines.md`. Handoff: `handoff.md`.

---

## 1. Product

One engine. Three day kinds. You own the week. It owns the **next set’s
numbers**.

### You

- Paint this week on the calendar: **Strength**, **Conditioning**, or
  **Recovery**. Week-by-week. Month view is a map, not the paint surface.
- Move a stamp when work wrecks a day. The engine never flips a train day.
- Own the cards. Strength = **template A** and **template B**. You add,
  remove, and reorder lifts. Conditioning = a card when you make one (none
  yet). You change structure yourself.

### The engine

- Wakes **when a set (or interval) is logged**, not when you tap finish.
- Writes **numbers only** — load, reps, time, watts. Never the exercise
  list. Never the day type.
- On a Strength day, fills A or B as you already scheduled. On a
  Conditioning day, same rule on that card. On a Recovery day, stays inside
  that stamp.
- Applies silently. Never blocks training. Never turns Monday Strength into
  Recovery because WHOOP looked tired.

Nutrition is out. Pain/illness product work is out (owner lock). Coach is
parked. AI retrieval stays parked (“just build the engine”).

---

## 2. What changed from 17 Aug V2

| | 17 Aug V2 (deleted) | This V2 |
| --- | --- | --- |
| When it runs | After the session (last working set) | **Every logged set** |
| What it writes | Next session’s opening load | **The next set in this session** |
| Day type | Strength package only | One engine; you already stamped the day |
| Workout shape | Coach/template authored | **You** edit A/B; engine does not invent lifts |
| Progress math | +2.5% / hold / −5% after 3 clean sessions | Same *intent* (small up, hold, back to last make) on the **next set** |
| Calibration gate | No autonomous bump until 3 exposures | First set of day 1 can already move the next set from *this session’s* log |
| Pain | `pain_blocked` excluded from evidence | No pain UI or gates in this spec |

Keep from the research bundle (ideas, not files):

- Bump is small and plate-aware (2.5% of the last **made** load, rounded
  to the equipment increment — 80 → 82.5 on a 2.5 kg jump).
- A miss does not compound off the missed weight. Next set returns to the
  last load you **made** this session.
- One bad night / low HRV does not move a number by itself.
- Reason codes, not athlete-facing essays.
- Pure functions. Zero I/O in the package.

---

## 3. The loop

```text
You paint the week
    → You open today’s stamped card (A/B, or cond when you have one)
    → You log set N
    → decideNextSet(...)
    → Set N+1 target numbers change
    → Repeat until the card is done
```

After the last set of an exercise, the **next time** that exercise opens
on this card, the first-set target is the last **stable make** (see §5),
not a weight you missed.

### Owner-approved golden path (Strength, template A)

Bench prescribed **3 × 5 @ 80 kg**.

1. **Set 1 target** 80 × 5. Log: 80 × 5, RIR 2, clean.
   → **Set 2** becomes **82.5 × 5**.
2. **Set 2 target** 82.5 × 5. Log: 82.5 × 4, RIR 0, grind.
   → **Set 3** becomes **80 × 5** (last make this session). It does not
   jump again.
3. **Set 3 target** 80 × 5. Log: 80 × 5.
   → Exercise done. Bench on A is still Bench. Next Monday’s opener is
   **80**, not 82.5.

Conditioning (once a card exists), same clock: 8 × 30s row. Log interval 1
at 220 W easy → interval 2 might be 230 W. Blow up at 200 W → interval 3
comes back down. Never a squat on that day.

---

## 4. Package and API (new names)

**Package:** `@hybrid/adaptive`  
**Home:** `packages/adaptive/` (new). `packages/` is empty on `main` today.

Pure TypeScript. Colocated tests (`src/foo.ts` + `src/foo.test.ts`). No
database client, no `fetch`, no DOM. The Hybrid HTML app is the only
caller until an explicit rewrite.

Day type is **input**, never output.

```ts
export type DayKind = 'strength' | 'conditioning' | 'recovery';

export type NextSetAction = 'progress' | 'hold' | 'revert_to_last_make';

export interface LoggedSet {
  exerciseId: string;
  setIndex: number;          // 0-based in this exercise, this session
  targetLoadKg: number | null;
  targetReps: number | null;
  loggedLoadKg: number | null;
  loggedReps: number | null;
  loggedRir: number | null;  // null if not entered
}

export interface NextSetDecision {
  exerciseId: string;
  nextSetIndex: number;
  action: NextSetAction;
  loadKg: number | null;
  reps: number | null;
  reasonCodes: string[];     // machine-readable only
}

export interface DecideNextSetInput {
  dayKind: DayKind;
  incrementKg: number;       // equipment jump, e.g. 2.5
  logged: LoggedSet;
  lastMakeLoadKg: number | null;  // last made load this session, this exercise
}

export function decideNextSet(input: DecideNextSetInput): NextSetDecision;
```

Conditioning uses the same function. `loadKg` / `reps` map onto the
card’s dose (watts, seconds, pace) via the existing metric keys on the
ledger (`watts`, `duration`, …). Do not add a second entrypoint.

There is **no** `decideDayKind`. There is **no** session-end
`decideProgression` as the primary clock. A tiny helper may derive the
**next-session opener** from the last stable make after the last set;
it does not classify a week of exposures before it is allowed to run.

---

## 5. Strength rules (deterministic)

Inputs: stamped `dayKind === 'strength'`, the set just logged, last make
this session, plate increment.

| Log vs target | Next set |
| --- | --- |
| Made target reps, and RIR ≥ 2 (or RIR null and reps > target) | **progress** — next load = last make + max(increment, round(2.5% of last make) to increment). Reps stay the prescribed target. |
| Made target reps, RIR 0–1 or not clearly easy | **hold** — same load × same target reps |
| Missed target reps | **revert_to_last_make** — next load = `lastMakeLoadKg` (the last set this session that made the target). If none yet, hold the original prescribed load. Never take 5% off the missed weight. |

- If this was the last set, `decideNextSet` still returns the decision;
  the adapter writes it as the **opener** for next time this exercise
  appears on A/B, not as a phantom extra set.
- Engine does not add or drop sets. `openVolume` stays a template flag
  you own.
- No WHOOP/HRV branch in `decideNextSet`. Sensors do not change numbers.
- No pain branch in this spec.

Reason codes (closed set): `made_easy`, `made_grind`, `missed_reps`,
`no_prior_make`, `last_set_opener`.

---

## 6. Conditioning and Recovery

**Conditioning.** Same function, same clock, once you attach a card.
Until you have a cond card: you log the bout; the engine can still
return a next-interval dose from that log. It does not invent a lift
day.

**Recovery.** A day you painted. The engine does not rebrand it as
Strength or Conditioning. First ship: if the recovery card has logged
bouts, numbers may move set-by-set the same way; if it is an empty rest
day, `decideNextSet` is not called.

---

## 7. Wiring (later; not this spec’s code)

When implementation starts (separate plan, after this spec is approved):

1. New package only. Do not copy deleted `packages/strength-engine` files.
2. Athlete HTML logger calls `decideNextSet` after each completed set
   and applies the returned target to the **next** set row in the live
   session.
3. Persist the last stable make on the template exercise so the next
   scheduled A/B day opens correctly.
4. Calendar stamps stay in app state. The package never reads the
   calendar.

---

## 8. Tests (required before any HTML wire)

Colocated. No `--passWithNoTests`. Golden vector = §3 Bench 3×5 @ 80:

1. After set 1 (80×5, RIR 2) → set 2 is 82.5×5, `progress`, `made_easy`.
2. After set 2 (82.5×4, RIR 0) → set 3 is 80×5, `revert_to_last_make`,
   `missed_reps`.
3. After set 3 (80×5) → opener for next session is 80, `last_set_opener`.
4. `dayKind` is not in the output; a test passes Strength and
   Conditioning inputs and asserts no field can rename the day.
5. Missed set at 82.5 must not yield 82.5 × 0.95 (no compound-off-miss).

---

## 9. Out of scope

- Restoring deleted engines, adapters, one-set logger, Big Mac, nutrition
- Coach publish/pull or flipping athlete days from a coach portal
- Pain/illness UI, stops, or gates
- LLM / OpenRouter decide path
- Inventing conditioning programming you did not put on a card
- Week-shape algorithms (3 lift / 2 cond / 2 recovery auto-layout)

---

## 10. Approval

Owner confirmed 4 Sep 2026: calendar is yours; session numbers move
**set by set** after each log; the Bench 80 → 82.5 → back to 80 example
is the product.

Implementation plan is a later step (`writing-plans`). Do not write
package code from this file until that plan exists and is approved.
