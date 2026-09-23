# The Engine — TrainHeroic logger concept

Date: 2026-09-23  
Status: concept only. Do not paint `apps/athlete/*.css` until this spec is approved.

## What this is

A visual and interaction concept for The Engine athlete logger. Structure comes from TrainHeroic (true black, huge condensed type, letter tiles, sticky Start, rest ring). Identity stays Engine: one letter, a race clock, Hybrid words. Morph branding never appears. Coach Strength is out of scope.

Live app CSS is unchanged in this pass. The clickable mock is `docs/superpowers/specs/2026-09-23-trainheroic-engine-concept.html`.

## Approaches

1. **Recommended — concept first, then a paint pass.** Tokens and three screens in a mock. Approve, then restyle `home.css` / `logger.css` only.
2. Paint live CSS now. Faster, but we lock type scale and CTA without a look at rest vs work.
3. Clone TrainHeroic orange + white. Wrong product: Engine teal is quiet physiology chrome, not the CTA, and we do not mix Morph / WHOOP / OLED palettes.

## Tokens (approved for the mock, not yet in the app)

| Role | Token | Hex | Rule |
| --- | --- | --- | --- |
| Void | `--void` | `#000000` | True black, OLED |
| Surface | `--raised` | `#111111` | Letter tiles, sheets |
| Text | `--ink` | `#FFFFFF` | Titles and CTA fill |
| Mute | `--mute` | `#8E8E93` | Kickers, rest copy |
| Engine | `--engine` | `#5EC4B7` | 2px letter underline and rest-complete hairline only |
| CTA | `--cta` | `#FFFFFF` | Sticky Start / Log. Ink on the button is black |
| Line | `--line` | `rgba(255,255,255,0.10)` | Hairlines |

WHOOP recovery / strain / sleep colors stay on Home dials. They never enter the logger. Blue on Home is WHOOP strain, not Easy, and not Engine blue-as-easy.

Type: **Barlow Condensed** 700 for letters, piece titles, and the clock. **Barlow** 400/500 for body and kickers. Clock is the signature: ~96–120px condensed, tabular, tracking tight.

## Screens

**Training list.** One session title in condensed 40px. Letter tiles `A` `B` `C` on raised squares. Piece title + rx on the right. Sticky bottom **Start**. No copper Strength, no kg, no working max.

**Work.** Giant remaining work time. Kicker `B · ECHO · WORK`. Target line is watts or rpm from Close, not a guessed PR. White **Log bout** is the only loud control.

**Rest.** Same clock, thinner. Ring around the digits. Engine teal hairline only when rest completes (Track Dawn cue). Skip rest is a text control, not a second CTA.

## What we are not doing until you say go

- Restyling `home.css` / `logger.css`
- Morph Monday minute targets or after-session auto-progress
- Reintroducing lift / kg / e1rm in the athlete shell
