# Engine logger — page overrides

Locked 19 Sep 2026. This file **wins** over MASTER on the live Engine instrument.

Primary job: **glanceable HR on the machine.** Watts/RPM and the interval clock stay on the rail.

## Athlete model (keep this dumb)

- Big number = heart rate
- Word = **BLUE / GREEN / RED** (where you are right now)
- Horseshoe = lamp in that color. **Not a timer. Not “stay here then drop there.”**
- Work/Rest time and reps live under the dial

Coaching recipes (work in green, recover to blue) stay in Adaptive Brain / session copy. They do **not** get drawn as ring notches.

## OLED zone tokens (do not drift)

| Zone | Token | Value | Use |
|------|--------|--------|-----|
| Blue | `--zone-blue` | `#00c2ff` | HR below today's BG bound |
| Green | `--zone-green` | `#3dff7a` | HR from BG to GR |
| Red | `--zone-red` | `#ff2b2b` | HR at/above GR — **OLED red**, never `#e0a090` |

Arc + BPM + zone word share `--eng-ring`. Full horseshoe, no grey leftover clock.

## Do not

- Encode Morph stay/drop zones as breaks in the ring
- Shrink the fill to show time remaining (clock is the rail)
- Tool-default orange `#F97316` or dusty salmon fills
- Put target watts in the dial hole
- Brand as Morpheus
