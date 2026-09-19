# Engine logger — page overrides

Locked 19 Sep 2026. This file **wins** over MASTER on the live Engine instrument.

Primary job: **glanceable HR on the machine.** Watts/RPM stay on the rail. Do not put target watts back in the dial hole.

## OLED zone tokens (do not drift)

True black field. One emissive color at a time (Morph pattern): grey unused track, current zone paints **arc + BPM number + zone word**.

| Zone | Token | Value | Use |
|------|--------|--------|-----|
| Blue | `--zone-blue` | `#00c2ff` | HR below today's BG bound |
| Green | `--zone-green` | `#3dff7a` | HR from BG to GR |
| Red | `--zone-red` | `#ff2b2b` | HR at/above GR — **OLED red**, never dusty salmon `#e0a090` |

Live stroke / number color = `--eng-ring` from `data-tone`. Unused ring = grey, not a tricolor map.

## Morph rules we keep

- Work in a zone → that color on the number **and** the arc
- Rest when HR is blue → whole instrument goes blue
- Do not brand as Morpheus
- Cond Next stays watts/RPM, not HR-driven

## Do not

- Tool-default orange `#F97316` or pastel “fitness teal/peach”
- White BPM with a colored ring only (Morph tints the number)
- Paint Blue+Green+Red segments on the same horseshoe as the live fill
- Shrink BPM or zone word for density
