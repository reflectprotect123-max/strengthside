# Engine logger — page overrides

Locked 19 Sep 2026. This file **wins** over MASTER on the live Engine instrument.

Primary job: **glanceable HR zone gauge** (Morph Train / Quick Start) plus an unchanged Work/Rest clock on the rail.

**Lifting has no heart rate.** No BPM, no Blue/Green/Red zone section, no time-in-zone, no chest-strap prompt. Strength pages are kg / reps / sets (and Easy/Medium/Hard is not a zone). WHOOP on Me is recovery, not a lift instrument. Engine compile skips `kind: 'lift'` blocks; if a lift page is ever shown, it uses the table logger — never this dial.

## How the horseshoe works (Morph Quick Start)

Official guide: HR in the center; the **current zone appears as a section** inside the gauge.

- **Blue section** = Recovery (low end of the scale)
- **Green section** = Conditioning (middle)
- **Red section** = Overload (high end)
- **Grey** = the rest of the scale
- **Color of that section** = locked OLED tokens (do not drift)
- **Work / Rest time does not drive the fill** — clock stays on the rail

BPM number + zone word match the section color.

## OLED zone tokens (do not drift)

| Zone | Token | Value | Use |
|------|--------|--------|-----|
| Blue | `--zone-blue` | `#00c2ff` | HR below today's BG bound |
| Green | `--zone-green` | `#3dff7a` | HR from BG to GR |
| Red | `--zone-red` | `#ff2b2b` | HR at/above GR — never `#e0a090` |

## Do not

- Drive horseshoe fill from the interval timer
- Recolor OLED tokens
- Put target watts in the dial hole
- Brand as Morpheus
