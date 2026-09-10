# In-session timer subsystem (2026-09-10)

## Product

Timers live only inside the Hybrid logger overlay. They do not auto-start from logging a set. The athlete picks a mode, starts it, then can collapse it and keep logging. Hybrid marks, not TrainHeroic.

Home and the Training list are not touched.

## Sources (watched)

TrainHeroic support: [For Athletes: Using in-app Timers](https://support.trainheroic.com/hc/en-us/articles/18156558387469-For-Athletes-Using-in-app-Timers)

- Logging view only.
- Bottom control opens the seven-mode picker (article says “Select Time”; the recordings label it **Select Timer**).
- Configure, green **Start**.
- Audible cues on work/rest / time ending.
- Fullscreen or collapse to log during rest.

Recordings:

- `Screen_Recording_20260910_182102_TrainHeroic` — picker, Rest setup/run, Stopwatch, AMRAP, For Time GET READY, Tabata, Custom Interval, EMOM run, then idle **play** on the lift.
- `Screen_Recording_20260910_184610_TrainHeroic` — play replays last rest: bar **GET READY!** → 5…1 → **GO!** → docked green ring `1:59`; tap ring → sheet **Stop Timer** / **Cancel**. Prescription `Rest 60s` is **not** the duration (last rest was 2:00).
- `Screen_Recording_20260910_191216_TrainHeroic` — timers unused; idle control is the blue play disc between Back and Next.

## Idle chrome

- First open this session, no last timer: center is stopwatch + blue **Select Timer** (clip 1 warmup / B).
- After a timer has been configured: center is the solid blue play disc (clip 1 end, clip 2, clip 3).
- Play does **not** start from checking a set.

## Picker

Fullscreen grid, lime/white icons, dots still visible:

1. Rest Timer  
2. Stopwatch  
3. AMRAP  
4. For Time  
5. Tabata  
6. Custom Interval  
7. EMOM (centered last row)

**Switch** (blue stopwatch, setup/run) returns here. **X** closes the picker.

## Rest Timer

- Title **Rest Timer**, **Switch**.
- **Quick Start:** `0:30` `0:45` `1:00` `1:30` `2:00` (blue).
- **Customize:** `−` `[m] [s]` `+`, default `1 m 00 s`. `±` steps 5 seconds.
- Green circular **Start**. No Count In on this screen.
- Start → fullscreen immediately. Large green ring, `M:SS.d`, ring empties clockwise from 12 o’clock. Title stays Rest Timer + Switch. No Reset on rest.
- Chevron collapses to the lift; timer keeps running.
- Docked: green ring in the bar with `M:SS` (no tenths). Tap → white sheet **Stop Timer** (red) / **Cancel**. Stop returns idle play (last duration kept). Cancel dismisses the sheet.

Play after a rest: docked count-in then docked rest using **last duration**, not the exercise note.

## Count-in (modes that have Count In)

Default **5 s**. Sequence (clip 2 bar + clip 1 For Time / EMOM fullscreen):

1. `GET READY!` (~1 s)
2. `5` … `1` (1 s each)
3. `GO!` (~0.7 s)
4. running

Fullscreen count-in keeps the mode title + Switch. Docked count-in replaces the play control; Back/Next stay.

`prefers-reduced-motion: reduce` skips GET READY/GO copy and runs the numeric seconds only.

## Other modes (clip 1)

| Mode | Setup | Run |
| --- | --- | --- |
| Stopwatch | Giant green play in a ring, Count In 5 s, Reset, Pause | Count up `M:SS.d`, Pause (red), Reset |
| AMRAP | Total Time `10:00`, Count In 5 s, Start | Countdown from total (same ring family) |
| For Time | Count In, giant play | Count up after GET READY / GO |
| Tabata | Title **Tabata Timer**. Copy `8 rounds of 20 seconds work, 10 seconds rest`. Fields Rounds 8, Work 20 s, Rest 10 s, Count In 5 s, Start | Work then rest per round |
| Custom Interval | Copy `N rounds of: 1:00 work / 0:30 rest`. Rounds, Work mm:ss, Rest mm:ss, Count In, Start | Same as Tabata with those lengths |
| EMOM | Title **EMOM Timer**. Every mm:ss, For N Rounds, Count In, Start | Ring, `1/N`, `M:SS.d`, `Round 1`, Reset. Each round is `Every`. |

Number fields use the phone keypad (clip 1 EMOM). Hybrid uses the existing logger pad where a field is focused; steppers `±` on rest customize stay as recorded.

## Audio

Short beep on: each count-in number, GO, rest/work boundary, timer complete. No settings toggle in the recordings.

## Architecture

| File | Role |
| --- | --- |
| `apps/athlete/timer.js` | Pure timer. Injected `now`. Zero DOM. |
| `apps/athlete/timer.test.js` | node:test, wired into `check:athlete-app`. |
| `apps/athlete/logger.js` / `logger.css` | Paint picker, setup, ring, dock, stop sheet, beeps. |
| `S.timer` | Persist with the brain key. Survives Next/Back. |

Session logging stays in `session.js`. Timer does not write sets.

## Later: Engine (not this build)

The same athlete family will also serve **Engine**. Engine logging is a **separate contract** — do not implement it in this Strength overlay.

Noted for when that spec opens:

- Engine logs **splits** and **watts / RPM** (erg / bike / row / ski style), not Strength’s kg/reps tables.
- This rest-timer chrome becomes the **work-duration** clock for that piece: depending on the format (AMRAP, For Time, EMOM, interval, etc.), the timer *is* the piece, not only the gap between sets.

This Strength build still treats the seven modes as TrainHeroic-shaped rest / interval tools beside the set log.

## Non-goals

- Auto-rest from `Rest 60s` notes.
- TrainHeroic trademarks / lime brand as a theme (Hybrid OLED + existing green checks / blue play).
- Changing Home.
- Capgo OTA unless the owner marks the ship IMPORTANT.
