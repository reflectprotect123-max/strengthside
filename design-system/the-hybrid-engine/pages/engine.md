# Engine logger — page overrides

Locked 19 Sep 2026. This file **wins** over MASTER on the live Engine instrument.

Primary job: **glanceable HR + interval clock**, Morph-style.

## How the horseshoe works (Morph)

- **Color** = where your heart is **right now** (Blue / Green / Red)
- **Fill length** = time **left** in this Work or Rest
- **Grey leftover** = time already used
- Not a map of “stay in this zone, then drop to that zone”
- Not a fill that grows with BPM

BPM number + zone word match the arc color (OLED). Target watts stay on the rail. Work/Rest digits still show the clock.

## OLED zone tokens (do not drift)

| Zone | Token | Value | Use |
|------|--------|--------|-----|
| Blue | `--zone-blue` | `#00c2ff` | HR below today's BG bound |
| Green | `--zone-green` | `#3dff7a` | HR from BG to GR |
| Red | `--zone-red` | `#ff2b2b` | HR at/above GR — never `#e0a090` |

## Do not

- Always-full lamp (that left Morph)
- Encode stay/drop coaching as ring notches
- Tool-default orange `#F97316` or dusty salmon fills
- Put target watts in the dial hole
- Brand as Morpheus
