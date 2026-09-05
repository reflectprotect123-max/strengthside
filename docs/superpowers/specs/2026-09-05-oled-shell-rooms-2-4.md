# OLED athlete shell — Rooms 2–4 design

**Status:** Binding follow-on to Room 1 (brand B OLED Whoop-adjacent).  
**Date:** 5 September 2026  
**Product surface:** Hybrid HTML athlete app (`apps/mobile/prototype/hybrid-app/index.html`)

Room 1 shipped Home only. This spec finishes the athlete chrome: Logger, Library, Calendar, Settings, and global shell (body / nav / primary buttons).

---

## Brand lock (unchanged from Room 1)

| Role | Value |
| --- | --- |
| Page / OLED black | `#000000` (`--oled-bg`) |
| Surface | `#121212` (`--oled-surface`) |
| Raised | `#1C1C1E` (`--oled-raised`) |
| Text | `#FFFFFF` (`--oled-text`) |
| Muted | `#8E8E93` (`--oled-muted`) |
| Sleep / Recovery / Strain arcs | `#9db4c8` / `#16f26b` / `#1ba3ff` |

**Fonts:** Barlow Condensed + Space Grotesk only.

**Banned:** Purple gradients, cream+terracotta, broadsheet columns, neon glow stacks, emoji icons, pill clusters, multi-layer shadows, Inter.

---

## Product rules (binding)

1. **Finish the athlete shell.** Every primary tab (Home, Library, Calendar, Settings) and the in-session Logger must read OLED black, not Track Dawn copper wash.
2. **Global chrome first.** `body` / page background becomes true black; kill copper radial washes on `body`. Bottom nav uses OLED surfaces; active tab is white/muted, not gold.
3. **Primary CTAs go quiet.** Global `.btn.primary` gold copper brick is replaced with OLED raised/outline style (same grammar as Home `oled-cta`). Exception: twin-instrument logger may keep **thin** dial accents (Strength copper border OR Engine teal border / text) — not full gold gradient bricks.
4. **Logger (Room 2):** Strength + conditioning logger screens use OLED surfaces (`logger-screen` / train / simple cond log). Keep dial-strength / dial-engine as thin instrument identity only. Sticky log actions use quiet OLED CTAs (Engine sticky may use teal text/border, not teal fill brick).
5. **Library + Calendar (Room 3):** Wrap in `shell-screen shell-screen--oled` (or shared `.shell-screen--oled` rules). Cards/tabs/day cells lose copper wash fills; active states use white/raised borders. Strength/Engine library heroes may keep a **3px left accent** (copper or teal) only.
6. **Settings + Progress stub (Room 4):** OLED stack; settings cards on `--oled-surface`; no copper notice bricks.
7. **Do not invent product logic.** No new readiness math, no Capgo publish in this work (OTA is a separate owner call after merge).
8. **Canonical path:** Edit prototype `index.html` (+ SW) → `bash apps/mobile/sync-hybrid-html.sh`. Bump to `the-hybrid-athlete-blank-v181` when Rooms 2–4 land.
9. **Smoke before claim:** Extend `oled-home.smoke.mjs` into `oled-shell.smoke.mjs` (or extend existing) asserting: body/nav OLED, logger quiet primary, library/calendar/settings use OLED scope, no `Training load below`, dial colors preserved, LOCAL_BUILD v181.
10. **Home Room 1 stays green.** Do not regress Home dials or `shell-screen--oled` Home rules.

---

## Room map

| Room | Surfaces |
| --- | --- |
| 1 (done) | Home modules + home brief |
| 2 | `train()` / strength logger, `renderSimpleCondLog` / Engine logger, sticky CTAs, rest chrome quiet |
| 3 | `library`/`programs`, builders entry heroes, `calendar` week strip + day cards |
| 4 | `settings`, progress stub, global `body` washes, `.nav`, default `.btn.primary` |

---

## Acceptance (Rooms 2–4 done when)

- [ ] `body` has no copper radial wash; page atmosphere is `#000000`.
- [ ] Bottom nav is OLED (no gold active state).
- [ ] `.btn.primary` is not a copper-gold gradient brick.
- [ ] Logger screens sit on OLED black/surfaces; no gold log brick.
- [ ] Library + Calendar stacks use OLED scope; copper day/card washes gone.
- [ ] Settings uses OLED surfaces.
- [ ] Dial arc colors unchanged; Home Room 1 smokes still pass.
- [ ] `LOCAL_BUILD` / SW `CACHE` = `the-hybrid-athlete-blank-v181`; twins synced.
- [ ] Screenshot artifacts for Logger, Library, Calendar, Settings.

## Out of scope

- Capgo OTA upload (ask before publish)
- Coach portal / parked coach.html redesign
- Rebuilding deleted engines / Progress model
