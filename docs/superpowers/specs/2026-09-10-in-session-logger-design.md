# In-session logger (2026-09-10)

## Product

Hybrid Athlete Training tab already shows the day’s roster (HPP Heavy Lower demo). This spec is the **in-session logger**: full-screen overlay that plays the session in the same order as the TrainHeroic recordings, with Hybrid/HPP marks instead of TrainHeroic’s.

**Home is not touched.** The Training **list** is not redesigned.

## Source of truth

- Training list screenshots (roster).
- Screen recordings:
  - `Screen_Recording_20260910_182102_TrainHeroic` — start, coach, A complete, B kg pad, Goal Pro / Working Max, timer zoo (**timer zoo is out of this spec**).
  - `Screen_Recording_20260910_184610_TrainHeroic` — F reps-only, F2 MAX, live rest (**out of this spec**), G complete, Done Training, feel, summary.

Match **look and motion**. Swap logos, Goal Pro art, and Done Training fist for Hybrid/HPP.

## Out of this spec (next subsystem)

Rest timer: Select Timer grid, docked play → GET READY → countdown ring, Stop Timer sheet, EMOM / Tabata / For Time / Stopwatch / AMRAP / Custom Interval.

In this build the logger bar still shows **Back / play / Next** so the chrome matches. Play is inert.

After this logger ships, a separate spec/plan builds the rest-timer subsystem.

## Architecture

Dedicated module, not more strings dumped only into `app.js`:

| File | Role |
| --- | --- |
| `apps/athlete/session.js` | Pure session model. Zero DOM. Phases, block index, set rows, totals, complete flags. |
| `apps/athlete/session.test.js` | TDD with node:test (wired into `check:athlete-app`). Log kg, MAX reps, complete warmup, next/back, pair pages, totals, persist round-trip. |
| `apps/athlete/logger.js` | Overlay HTML/handlers. Calls `session.js`. |
| `apps/athlete/logger.css` | Logger chrome, pad, table, dots. OLED tokens from `home.css`. |
| `apps/athlete/app.js` | Start Session on Training list; mount/unmount overlay; do not change Home. |
| `apps/athlete/index.html` | `#logger` host; hide `#bottomNav` / FAB while logger open. |

State lives on `S.session` in existing `THE-brain-v1` localStorage.

```
S.session = {
  date,            // ISO day of the roster
  phase,           // quote | coach | block | doneHub | feel | summary
  blockIndex,      // 0..n-1 while phase === 'block'
  startedAt,
  logs,            // { [blockId]: { completed, sets: [{ reps, kg, logged, miss }] } }
  workingMax,      // { [exerciseId]: number }
  feel,            // intensity / durationMin / note
}
```

Chevron on a log page exits to the Training list. Session stays. Opening Start Session (or an in-progress entry) resumes the same card.

## Day order (do not skip)

Walk **every roster block in list order**. Clip 2 skipped C–E; we do not.

**Demo day** (screenshots + recordings) is the HPP Heavy Lower list:

1. **A** — Deadlift Warm-Up (complete)
2. **B** — Snatch Grip Rack Deadlift (kg table)
3. **C** — Barbell Lateral Squat (kg table)
4. **D** — Goblet Box Squat (kg table)
5. **E** — Reverse Hypers (kg table)
6. **F1 + F2** — Double Leg Banded Leg Curls (reps-only) then Garhammer Raises (MAX). Two pages. Swap arrows on the title. Next/Back between them.
7. **G** — Recovery Breathing (complete)
8. Done Training hub → feel → summary

**Pairing rule:** whenever the roster writes a pair (`F1`+`F2`, or another day `D1`+`D2` then `E1`+`E2`, then a single `F`), those are **consecutive logger pages**, not one stacked screen. Same chrome as the F1/F2 clip. Unpaired letters are one page each.

Dots at the top: one dot per logger page (A, B, C, D, E, F1, F2, G, then the Done hub).

## Block types

**Complete** (A, G): numbered/bullet coach text, video thumb, **Mark As Completed** → green **Completed**, optional note field. No set table.

**Kg lift** (B–E on this demo): notes, Sets | Reps | Kg | circle. Custom pad: digits, `.`, backspace, Kg/Lb, Log, Autofill, Miss. Log or circle stamps a green check. Running **REPS / KG** header. Optional 3RM toast when that set is a new rep-max vs stored history (local only for now).

**Reps-only** (F1): Sets | Reps, no Kg column. Prefill 25; circle logs.

**MAX** (F2): Reps placeholder `MAX`; pad header `N REPS`; Log writes the number and checks the row.

**Working Max / Goal Pro:** keep the sheets from clip 1; Hybrid/HPP art and copy, not TrainHeroic dinosaur/fist.

## Session bookends (video order)

1. Training list — **Start Session** (blue, sticky).
2. Quote splash (placeholder quote from the recording until HPP copy exists).
3. Coach Instructions — scroll, **Got It**.
4. Blocks in day order (above). Goal Pro / Working Max available on kg lifts as in clip 1.
5. Done Training hub — HPP mark, **Done Training**, **Add Exercise** link.
6. How did this session feel — intensity control, duration minutes, note, finish.
7. Summary — date, session name, exercise/set/rep counts, blocks done, minutes. No rest-timer stats required.

## Visual

- Existing OLED tokens (`--oled-bg`, `--trn-blue` ~ `#1ba3ff`, green checks).
- Custom pad, not the Samsung keyboard, for set logging.
- Bottom logger bar: Back, inert play, Next. Safe area respected.
- Hide athlete bottom nav and FAB while overlay is open.
- `prefers-reduced-motion`: skip GET READY-style motion later; this spec has no timer animation.

## Slice order (how the videos play)

Build in this order. Each slice: failing tests on `session.js` first, then paint.

1. Start Session + quote + coach + pager chrome (A visible, read-only ok).
2. A Mark As Completed + Next/Back + persist.
3. B kg table + pad + totals + checks (+ 3RM toast if cheap).
4. C, D, E as kg lifts (same component as B).
5. F1 reps-only + F2 MAX (pair pages).
6. Working Max + Goal Pro sheets (Hybrid marks).
7. G complete.
8. Done hub + feel + summary.

Rest-timer subsystem is **not** a slice of this list.

## Testing

- Colocated unit tests for session transitions and log math. No `--passWithNoTests`.
- Athlete smoke: overlay markup hooks exist; Home HTML (`trainingHomeHtml` / `ath-whoop-dials`) unchanged.
- Manual: Start → walk A…G → Done; chevron resume; Home tab still OLED home.

## Non-goals

- Adaptive Next/Close / `@hybrid/strength-engine` revival.
- Cloud `performed_set` writes (local session first).
- Rest timer / Select Timer.
- Changing Home or the Training list layout.
- Cloning TrainHeroic trademarks.
