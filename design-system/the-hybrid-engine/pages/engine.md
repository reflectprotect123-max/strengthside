# Engine logger — page overrides

Locked 19 Sep 2026. This file **wins** over MASTER on paints for the live Engine instrument.

**Behaviour source of truth:** `docs/superpowers/specs/2026-09-19-engine-live-logger-design.md` (scope A). Do not restate the zone story here in a second conflicting version.

Primary job: glanceable HR zone gauge plus an unchanged Work/Rest clock on the rail.

**Lifting has no heart rate.** See the spec.

## Horseshoe (chrome)

- Hole = BPM. Caption = BLUE / GREEN / RED.
- Grey 270° track. Current zone = one lit section. Grey = rest of the ruler.
- Work / Rest time does not drive the fill — clock stays on the rail.

## OLED zone tokens (do not drift)

| Zone | Token | Value | Use |
|------|--------|--------|-----|
| Blue | `--zone-blue` | `#00c2ff` | HR below today's first line |
| Green | `--zone-green` | `#3dff7a` | HR from first line to second |
| Red | `--zone-red` | `#ff2b2b` | HR at/above second line — never `#e0a090` |

## Do not

- Drive horseshoe fill from the interval timer
- Recolor OLED tokens
- Put target watts in the dial hole
- Brand as Morpheus
