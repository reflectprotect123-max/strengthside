# The app that opens is the Engine

Strength is parked in `park/strength-app/`. It is not deleted. The front door, `apps/athlete/index.html`, opens `apps/athlete/engine/index.html` and does not load the strength builder or logger.

# Session builder — parked with the strength app

The athlete Library builder is the warm-up circuit, the lift cards, then the cool-down circuit. Start Session plays that order in the logger. This is on `main` (pull request 262, merge `0c65cc7c`) and on the live app as Capgo bundle **1.3.11** for `com.hybrid.strength`, channel `strength-live`. The previous live bundle was 1.3.10.

Later calibration, metric-selection and prep-timer fixes are recorded in the
[calibration follow-up](docs/releases/strength-calibration-followup.md). Those
candidate changes have not been published through Capgo; the 1.3.11 ship record
above describes Cursor's earlier builder baseline.

Close the installed app and open it again to pick up 1.3.11. The update downloads in the background and waits for the next launch, so an open workout is left alone.

Contracts and the release path: [docs/training-contracts.md](docs/training-contracts.md). Design: [docs/superpowers/specs/2026-10-16-session-builder-replacement-design.md](docs/superpowers/specs/2026-10-16-session-builder-replacement-design.md).

## What we built

A new session opens on an empty warm-up. Bike, Row, Run, Ski, and Jump Rope are in the add list, and they are not placed on the session until you add them. A session saved with that old automatic set loses those five movements the next time it loads. Anything else you added in the warm-up stays. There are three rounds once movements are there. The isometric hold counts 3, then runs. Lifts and stretches take reps. The carry takes metres. Timed warm-up pages start their countdown. They do not ask for effort.

Next opens the lift cards. The coach can set shared or per-set reps, including 5/3/1 and 10/8/6, plus a rep range and an explicit final AMRAP. The AMRAP uses the actual first working-set load. Supersets stay. Every suggested load stays editable in the logger. The builder does not ask for a target weight.

Tempo sits on the lift card. The choices are `No tempo`, tempos saved on the device, and `Add tempo`. Add opens four boxes: Lower, bottom pause, Lift, top pause. Nothing is seeded. The card metrics are Reps, Rep Range, Weight (lb), Weight (kg), Weight (%), Time (mm:ss), Seconds, Miles, Yards, Meters, Feet, and None on the second column.

Next opens the cool-down. It is the same kind of circuit as the warm-up and tracks only seconds or reps. Easy Bike starts at 180 seconds. Breathing, Couch Stretch, and Child's Pose start at 60. Hamstring Stretch starts at 45. Cat-Cow and Figure Four start at 8 reps. Thread the Needle starts at 6. The cool-down starts empty until movements are added. Post to calendar is the step after cool-down.

Start Session plays warm-up rounds, then the lifts, then cool-down rounds, then Done Training. A main barbell lift opens on **Ramp 1 of 2**. Both ramps are logged. There is no skip control. Ramps, holds, carries, failed sets, and Easy sets do not become e1RM evidence.

The locked references stay in `prototypes/strength-builder-play.html`, `prototypes/strength-training-play.html`, and `prototypes/strength-cooldown-play.html`.

## Issues along the way

- New templates seed five warm-up blocks. Tests that treated block 0 as the added lift were looking at Bike. Those tests now find the lift by title.
- The logger first called the barbell ramps "Warm-up 1 of 2" after the circuit warm-up had already finished. They are labeled Ramp. The skip button and `Logger.skipRamp` were removed.
- Warm-up seconds and metres were collapsing on the way into the logger. Compile and the session pages now keep `prescribed` and `countIn`, and expand warm-up and cool-down into rounds.
- Back from the exercise list jumped over the lift editor, and Back from the warm-up reopened the old instructions note. Warm-up Back returns to the library. Exercise-list Back returns to the lift editor.
- The lift editor's only exit was Post to calendar, so a new session never reached the cool-down. During create, that button is Next. Post to calendar stays after the cool-down.
- Seeded warm-up rows were drawn as full lift cards, tempo dropdown included. Blocks with a warm-up or cool-down role stay summary rows on the lift editor.
- Back from the calendar opened the old session overview. In the create flow it returns to the cool-down.
- Browser tests still clicked Next twice and waited for Back Squat. The second Next is the cool-down. Those tests add the lift from the editor and walk the timed warm-up before the working sets.
- Close during a running warm-up countdown only docks the timer. A second Close leaves the logger. The delete-template browser test clicks Close twice.
- A completion circuit is filed under Warm-Up, so a warm-up skip that stops on the first non-warm-up page walks into a disabled Next. That test stops when Mark As Completed is on screen.
- The lift editor's back control had no accessible name. It now matches the other builder screens: Back.
- The sealed learning report hashes `session.js` and `training-core.js`. Both changed for warm-up rounds and for skipping the effort check on prep pages. The report was regenerated. Hit rate, miss rate, and violations stayed the same.
- Local `pnpm run verify:strength` stopped where the SQL checks start Docker. Docker is not installed in the agent environment. GitHub CI `verify`, `browser`, and `evidence-platform` passed on the pull request before the merge.
- `npx` on this machine crashes inside npm (`Class extends value undefined`). The Capgo upload used the project's CLI binary directly. The script in the repo still calls `npx`.

## What's next

- Confirm 1.3.11 on a phone after a fresh launch. This ship is the web bundle. It does not replace the installed native APK in the store.
- A session that is only a completion circuit cannot leave the cool-down for the calendar, because Next there requires a training lift. The browser test posts that session from the library editor instead.
- Cool-down Next with no lift stays on the cool-down and does not say why.
- An older cool-down note can still appear in the circuit list.
- The tempo menu has the behavior of the lock and plain text styling. The closed control does not yet use the prototype's menu CSS.
- Warm-up add rows show the metric name (Seconds, Reps, Meters) and not the locked start value.
- `setTempoPart` can still store a space-padded tempo. The card save path requires a number or X in each box.
- Run `check:strength-memory-sql` and `check:strength-learning-db` on a machine with Docker before the next strength gate is treated as fully local.

The older map below is historical layout, not the current builder.

# THE Hybrid System — athlete app (strengthside)

**One product:** the Hybrid HTML athlete app — spine (`@hybrid/brain`) + branches (Strength / Engine / Nutrition screens).

| Role | Path |
| --- | --- |
| **Brain (logic only)** | `packages/brain/` → bundled to `apps/athlete/brain-bundle.js` |
| **Edit UI** | `apps/athlete/` (`index.html`, `app.js`, `home.css`) |
| **Sync / build** | `bash scripts/sync-athlete-app.sh` |
| **Play locally** | open `apps/athlete/index.html` or `python3 -m http.server --directory apps/athlete` |
| **APK build** | GitHub Actions builds the Android artifact on `main` pushes; Capgo is released only by an explicit ship workflow. |
| **Android** | `apps/mobile/capacitor/` wraps `apps/athlete/` |

## Coach workspace (separate surface)

The Hybrid athlete app (`index.html` / `THE-Hybrid-App.html`) is **not** this and is not edited. Athletes keep logging there. This page is coach-only: Home feed, roster, library, program/session builders, assign-to-team.

```bash
cd apps/coach
python3 -m http.server 4173
# http://localhost:4173/coach.html
```

Coach demo: `dan@thehybrid.local` / `demo`

Seeded roster (visible on Coach Home, not a login here): team **hybrid S&C**, athlete Dan Veldman, program **Hybrid Strength Base**, one completed session (Dan Veldman, Week 1 Day 1). This is the last good coach suite from `848074a` (parent of the park-coach commit).

## Brains (not a second app)

- **`packages/brain/`** — hub logic (readiness, today’s call, coach context). Zero I/O.
- **`packages/adaptive/`** — engine math (Open/Next/Close). Bundled to `apps/athlete/adaptive-bundle.js`.
- **`packages/strength-engine/`** — pure lift logic (resolve, e1RM, WM, PR). Wire into screens later.
- **`supabase/migrations/`** — owned Postgres tables (shared with the Brain repo). See `CLAUDE.md`.

Operational checkpoint: [`handoff.md`](handoff.md)

## Verify

```bash
pnpm install
pnpm run verify
```
