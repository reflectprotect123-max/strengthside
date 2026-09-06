# OLED Home polish — Room 1 design

**Status:** Approved direction (brand B). Room 1 only — Home shell.  
**Date:** 5 September 2026  
**Product surface:** Hybrid HTML athlete app (`apps/mobile/prototype/hybrid-app/index.html`)

---

## Problem

Home still reads as Track Dawn copper/graphite: warm copper washes on `body`, copper-bordered WHOOP module, gold primary CTA brick on next-session. The owner chose **OLED Whoop-adjacent** (concept B) over Hybrid Athletic (concept A — rejected as “looks so AI”). Dials already shipped (blank-v179 / Capgo 1.0.60); the chrome around them did not catch up.

## Brand lock (Room 1)

| Role | Value | Notes |
| --- | --- | --- |
| Page / OLED black | `#000000` | Home first viewport atmosphere |
| Surface | `#121212` | Quiet cards / rows |
| Surface raised | `#1C1C1E` | Slight elevation only when needed |
| Text | `#FFFFFF` | Primary numerals / titles |
| Muted | `#8E8E93` | Labels, meta, hints |
| Sleep arc | `#9db4c8` | Keep — already shipped |
| Recovery arc | `#16f26b` | Keep |
| Strain arc | `#1ba3ff` | Keep |
| Dial track | `#2c2c2e` | Keep ring track |

**Fonts:** Keep Barlow Condensed (display) + Space Grotesk (body). Do not introduce Inter / system-as-design.

**Out of Room 1:** Logger, Library, Calendar, Settings chrome; Capgo ship is a follow-on after merge/owner call; do not invent new readiness math.

## Product rules (binding)

1. **One room:** Change Home (`athModulesHtml` / `homeBriefingHtml` / Home-scoped CSS) and any tokens those screens need. Do not restyle Logger / Library / Calendar in this room.
2. **Dials first:** Sleep / Recovery / Strain are the first-viewport hero. Date + athlete identity stay above or beside dials but must not overpower them.
3. **No gold CTA brick on Home:** Next-session / resume CTA is quiet (outline or raised surface), not copper gradient `.btn.primary`.
4. **Kill Home copper washes:** No warm copper radial gradients or copper-bordered WHOOP card on Home modules.
5. **Quiet insight:** Recovery-debt / check-in hint is one quiet block — no dashboard stat strips, no floating badges on dials.
6. **Smoke before claim:** Colocated smoke must assert OLED Home tokens + absence of Home copper wash / gold brick; existing dial color + sleep math assertions stay green.
7. **Canonical path:** Edit `index.html` (+ SW cache if bumped) → `bash apps/mobile/sync-hybrid-html.sh`. Twins must match.
8. **Banned looks:** Purple gradients, cream+terracotta, broadsheet columns, neon glow stacks, emoji icons, pill clusters, multi-layer shadows.

## Information architecture (Home)

1. Sticky top brand (existing shell — may quiet mark border; no redesign of global nav).
2. Date line (display, white).
3. Athlete + next workout name (muted / white — no teal flash avatar wash required; may quiet to OLED surface).
4. WHOOP dials row (three dials) — primary.
5. Optional one-line recovery-debt / check-in hint under dials.
6. Next-session / live / empty brief — quiet row + quiet CTA.

Remove leftover copy that implies a “Training load” strip still lives below dials if that strip is gone. Debt hint must not say “Training load below” if there is no such module.

## Acceptance (Room 1 done when)

- [ ] Home background is true black (`#000000`) in the Home stack, not graphite copper wash.
- [ ] WHOOP module has no copper border / copper gradient fill.
- [ ] Dial arcs unchanged (`#9db4c8` / `#16f26b` / `#1ba3ff`).
- [ ] `home-brief` CTA is not copper-gold primary brick.
- [ ] Colocated smoke passes; `whoop-home-dials.smoke.mjs` still passes (or is updated only for cache bump + OLED assertions).
- [ ] Sync twins run; `LOCAL_BUILD` / SW `CACHE` match if bumped.
- [ ] Screenshot artifact proves first viewport = black + dials + quiet brief.

## Later rooms (not this PR)

- Room 2: Logger (set-by-set / Engine) OLED surfaces without killing twin-instrument accents where they still earn their keep.
- Room 3: Library / Calendar quiet chrome.

## Reference

- Concept art: `/opt/cursor/artifacts/concept-1b-oled-whoop.png` (approved).
- Prior dials ship: Capgo 1.0.60 / blank-v179 / PR #174–#175.
- Older Track Dawn polish plan (`2026-08-23-athlete-ui-ux-full-polish.md`) is **superseded for Home** by this spec — do not reintroduce copper washes on Home.
