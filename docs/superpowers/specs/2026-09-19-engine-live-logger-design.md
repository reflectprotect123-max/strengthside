# Engine live logger (2026-09-19)

Locked with the athlete. **This spec is source of truth** for the live Engine screen (scope A). Chrome tokens stay in `design-system/the-hybrid-engine/pages/engine.md`, which must point here. MASTER stays brand.

Bout-machine details (first number, how Easy/Medium/Hard changes watts/RPM, skip rest, piece done) and Home/Me/Library layouts are **out of this spec**. Do those only after this screen is treated as fixed.

## Product

Hybrid Engine **live** logger. One job: glance heart rate and **today’s** zone while a work or rest clock runs on the rail.

Hybrid chrome (Track Dawn, OLED blue / green / red). Not another app’s train screen with the name swapped. No third-party branding on this instrument.

WHOOP official UI stays on **Me**. WHOOP recovery **only** slides today’s two zone lines. It does not appear on this logger.

Lifting is not this screen.

## What is on the screen

| Part | Rule |
| --- | --- |
| Hole | Live BPM. Not watts, not RPM, not remaining time. Missing live BPM shows an em dash. |
| Caption under BPM | `BLUE` / `GREEN` / `RED` matching the lit section. |
| Horseshoe | Grey 270° track. **One** coloured section = the band you are in. Grey = the rest of today’s ruler. Fill is **not** the interval timer. |
| Rail | Target (watts **or** RPM; row/ski may show split) · Work or Rest remaining · reps (`n` / rounds). |
| Rest | After work, mid-screen **Rest** tap opens Rest. Easy / Medium / Hard rates **that interval**. |
| WHOOP | Not on this screen. |

A “blue session” (or green / red piece) is the **job**. The lamp does not freeze on the session name.

## Today's ruler

Three bands on one heart-rate scale. Two lines divide them.

- **Blue** — from the resting-ish **floor** up to, but not including, the first line (`bgToday`).
- **Green** — from `bgToday` up to, but not including, the second line (`grToday`).
- **Red** — from `grToday` through **max**.

Example from the locked walkthrough (WHOOP recovery 72, stock bases): first line **136**, second **168**.

- Blue: floor → 135
- Green: **136** → 167
- Red: **168** → max

Those two numbers are **that day**. Tomorrow they can slide. The story does not change: rest to first line, green takes over at the first line, red at the second.

### Where the lines come from

Implemented in `HybridBrainKernel.dailyZones` (`apps/athlete/engine/brain-kernel.js`).

Stock bases (settings, else defaults):

| Input | Default |
| --- | --- |
| `bgBase` | 138 |
| `grBase` | 170.5 |
| `hrMax` | 190 |
| floor / `rhr28` | 60 (or check-in resting HR) |

If WHOOP is missing or stale, the lines **are** the bases.

If WHOOP recovery `R` (0–100) is current:

1. Heart-rate reserve `hrr = hrMax − rhr28`.
2. Shift points `S` from `shiftHrrPoints(R)` (more recovered → `S` closer to 0; low recovery more negative).
3. `shiftBpm = (S / 100) × hrr`.
4. `bgToday = bgBase + shiftBpm`, `grToday = grBase + shiftBpm`.

Both lines move by the **same** BPM. Lower recovery pulls green and red **down** (they start at a lower heart rate).

`moduleCeiling` (blue/green/red cap from WHOOP 34/67) is **not** the lamp. Do not use it to freeze the horseshoe. Out of this spec if it later gates programming.

### Lamp

If live BPM is present and in 35–230:

- BPM `< bgToday` → blue
- BPM `< grToday` → green
- else → red

The lit section **jumps** to that band. It does not grow like a timer. Slice start/end on the 270° horseshoe **are** (floor → `bgToday` → `grToday` → max) as fractions of that ruler. The stroke may enforce a minimum visible length so a razor-thin band still reads. It must not clamp a large blue band down to “about half the arc.”

Until a strap feeds `S.liveHr`, there is no real BPM. Current code then tints from piece effort (easy blue / medium green / hard red) and rest as blue. That fallback is a stub, not the product rule. Product rule: **lamp follows heart**.

WHOOP on this logger: only the **selected day’s** check-in, and only if WHOOP is connected and that day’s recovery is a number. Otherwise the lines stay on the stock bases. Do not steal another day’s recovery.

Easy / Medium / Hard on Rest are **effort** chips (Track Dawn). They are not OLED zone paints. Never `#e0a090`.

## OLED tokens (do not drift)

Owned by `pages/engine.md`. Copied here so the spec cannot be read without them:

| Zone | Token | Value |
| --- | --- | --- |
| Blue | `--zone-blue` | `#00c2ff` |
| Green | `--zone-green` | `#3dff7a` |
| Red | `--zone-red` | `#ff2b2b` — never `#e0a090` |

BPM number, zone word, and section use the same token.

## Lifting

No heart rate on lifts. No BPM, no zone section, no time-in-zone, no strap prompt.

- Engine compile / session skip `kind: 'lift'`. Sequential Engine letters (E1/E2) stay Engine pages, not a lift superset.
- `isEngineHrPage` is true only for `kind === 'engine'` and `logMode === 'engine'`. Only then paint this dial.
- Strength logger is kg / reps / sets. Easy/Medium/Hard on Rest is not a heart-rate zone.
- Strength brain path: load / reps / miss / effort only.

## Files

| File | Role |
| --- | --- |
| `apps/athlete/engine/logger.js` | Dial, rail, Rest tap, overlay. `engineRingTone` / `engineZoneSlice`. |
| `apps/athlete/engine/logger.css` | OLED tokens on `.eng-morph`. |
| `apps/athlete/engine/brain-kernel.js` | `dailyZones` / `shiftHrrPoints`. |
| `apps/athlete/engine/session.js` | `isEngineHrPage`; skip lifts. |
| `apps/athlete/logger.js` | Strength table. No BPM. |
| `design-system/the-hybrid-engine/pages/engine.md` | Token + do-not list; points here. |

## Tests that lock this

- `apps/athlete/engine/session.test.js` — mixed plan drops lifts; no `liveHr` on logs; E1/E2 not a lift superset; `isEngineHrPage`.
- `apps/athlete/engine/engine-zones.test.js` — horseshoe fractions match the BPM ruler (locked 60 / 136 / 168 / 190 example).
- `apps/athlete/checks/athlete-app.smoke.mjs` — strength logger has no BPM / `liveHr` / `eng-morph`; Engine dial gated; `pages/engine.md` lifting line.

## Do not

- Drive horseshoe fill from Work/Rest remaining.
- Put target watts or RPM in the hole.
- Print “keep 142–168” as the primary target (the slice **is** the range; rail is output).
- Show WHOOP recovery % or WHOOP colours (33/67 green/yellow/red) on this logger.
- Treat Easy/Medium/Hard as blue/green/red.
- Brand as Morpheus / Morph.
- Recolor OLED tokens.
- Put this dial on a lift.
- Expand this spec into Library method lists or Me WHOOP chrome (scope C) or next-watt arithmetic (scope B).

## Success

A rower can see BPM, which band they are in, and time left on the rail without mixing those three jobs. A blue piece that drifts into green **looks** green. The same screen with RPM on the rail still shows BPM in the hole.
