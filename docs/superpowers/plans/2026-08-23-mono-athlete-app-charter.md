# Mono-app charter — THE Hybrid athlete app only

> **Owner lock (23 Aug 2026):** This Hybrid HTML app is the real athlete surface.
> Make it the whole product. Stop feeding side quests (Coach bench, ARC, Expo,
> dual-repo athlete UX). Delete product sprawl; keep the engine that makes
> Hybrid Strength real.

**Product:** THE Hybrid System athlete app  
**Edit:** `apps/mobile/prototype/hybrid-app/index.html` (+ `whoop.js`, `service-worker.js`)  
**Ship:** `bash apps/mobile/sync-hybrid-html.sh` → `preview-site/` → Netlify  
**Live:** https://papaya-cheesecake-059e06.netlify.app/  
**Dials:** The Engine (zone teal / conditioning) · Hybrid Strength (copper / lifts)  
**Visual:** Track Dawn — graphite + copper + zone teal; Space Grotesk + Barlow Condensed

Related polish plan: `docs/superpowers/plans/2026-08-23-athlete-ui-ux-full-polish.md`

---

## 0. The bet (one paragraph)

Athletes train in **one** shell with **two** instruments. Everything else in this
repo either (a) serves that shell (pure `@hybrid/strength-engine`, owned migrations,
CI), or (b) is a parallel product we stop building and then delete. When the giant
`index.html` hurts, we split *this* app into modules — we do not resurrect Expo or
a second athlete stack.

---

## 1. Keep

### Product (lived in / shipped)

| Path | Role |
| --- | --- |
| `apps/mobile/prototype/hybrid-app/index.html` | Athlete app |
| `apps/mobile/prototype/hybrid-app/whoop.js` | WHOOP inputs |
| `apps/mobile/prototype/hybrid-app/service-worker.js` | Cache / Update |
| `apps/mobile/prototype/hybrid-app/engine-cond-builder-mini.html` | Engine mini (same family) |
| `apps/mobile/sync-hybrid-html.sh` | Sync → play + preview |
| `apps/mobile/preview-site/` | Netlify deploy root |
| `apps/mobile/THE-Hybrid-App.html` | Synced play copy |
| `handoff.md` | Operational athlete checkpoint |

### Brains / contract (not a second product)

| Path | Role | Rule |
| --- | --- | --- |
| `packages/strength-engine/` | Pure lift logic (resolve, e1RM, WM, PR, exposure) | **Never delete.** Wire into the HTML app later. Keep tests green. |
| `supabase/migrations/` + owned 12 tables + RLS | Shared Postgres with hybrid repo | Freeze until cloud sync needs them; never migrate foreign tables |
| `supabase/functions/embed-coaching-note` | Owned edge fn | Same contract |
| `checks/`, `.github/workflows/ci.yml`, `pnpm run verify` | typecheck + test + migrations + build | Must keep failing when broken |
| `CLAUDE.md` shared-Supabase rules | Cross-repo contract | Binding |

### Docs that serve *this* app

| Path | Role |
| --- | --- |
| This charter | Keep / kill / build order |
| `docs/superpowers/plans/2026-08-23-athlete-ui-ux-full-polish.md` | Twin-instrument polish |
| `docs/data/training-load-model.md` | When Engine honesty lands in-app |

---

## 2. Cut / stop touching

### Tier A — kill soon (clear parallel products)

| Path | What it is | Action |
| --- | --- | --- |
| `ARC.dc.html` | ARC coach workspace prototype | Delete |
| `Coach App.dc.html` | Coach Session Builder prototype | Delete |
| Root `README.md` (“Handoff: ARC Coach Bench”) | Points builders at the wrong product | Replace with athlete mono-app README |
| `apps/mobile/prototype/shots/` | Old Expo/home screenshot pack | Delete if unused by hybrid-app |
| Docs that invite Expo / `home.html` / PWA revival | False starts | Scrub invitations; leave history banners |

### Tier B — decide once, then act

| Path | What it is | Decision needed |
| --- | --- | --- |
| `apps/web/` (`@hybrid/strength-web`) | Tiny engine bench; **also** what `pnpm run build` / CI builds today | **Keep as harness** *or* **delete** and point `build` at package-only (tsc/tests). Prefer delete if Bench has nothing unique beyond METRICS smoke — package tests already cover the engine. |
| `support.js` (root, ~69KB) | ARC/coach support script | Confirm unused by hybrid-app → delete |
| `design-system/the-hybrid-system/` | Skill MASTER (may disagree with Track Dawn) | Ignore or delete; **not** athlete source of truth |

### Tier C — process kill (even if files remain as archaeology)

| Item | Status |
| --- | --- |
| Phase B coach authoring UI | **Cancelled** as a product track in this repo |
| ARC → React coach port | Out of scope here |
| Expo / `strength-mobile` revival | Banned |
| Second PWA / parallel athlete shell | Banned |
| Everyday Readiness / SZN / Nutrition stub returns | Banned unless explicit ask |
| Dual-repo theater for athlete UX | Athlete lives **here** |

Historical Phase B/C plans under `docs/` may stay with a **Superseded** banner — do not execute them as written.

---

## 3. What “built up” means — five jobs, one nav

Same shell. Grow depth, not surfaces.

| # | Job | Athlete meaning | Nav / home today | Grown-up target |
| --- | --- | --- | --- | --- |
| 1 | **Train** | Prescribe & start | Home modules, Library, Engine builder, Strength workouts | Twin dials stay primary; starters stay honest (Full Body A); custom templates |
| 2 | **Log** | Capture what happened | Strength log + Engine HR log (partial / demo-ish) | Real set logging, rest timers, finish summaries that aren’t fake |
| 3 | **Progress** | Proof over time | Thin / placeholder | Working max, PRs, week view — driven by `@hybrid/strength-engine` + logged sets |
| 4 | **Recover** | Inputs, not a product | Check-in + WHOOP on Home/Settings | Same inputs; never revive Everyday Readiness as a third dial |
| 5 | **Account** | Persistence | Export backup, Update banner, localStorage | Sync / auth when local-first isn’t enough |

**One app. One nav.** No coach costume unless the athlete actually coaches someone (not in queue).

### Explicit non-goals (this charter)

- Multi-athlete Command Center / ARC Analytics
- Coach Session Builder as a shipped product
- Rebuilding THE-HYBRID-ENGINE1 coach routes from `ARC.dc.html`
- Stress Engine / Nutrition as product modules

---

## 4. Build order (all in the athlete HTML app)

### Near-term (product UX)

1. **Polish lock-in** — Track Dawn twin instruments; zero AI slop (plan already open; v33+ landed slices)
2. **Real strength logging** — sets, rest, finish; local-first; no fake tonnage theater
3. **Wire `strength-engine`** — WM%, e1RM, PR detection on logged work (call pure functions from the app; still zero I/O in the package)
4. **Engine honesty** — zone minutes / weekly card; no opaque 0–100 clone
5. **Calendar ↔ Library loop** — schedule/train only; quiet chrome

### Later (still this app)

6. Local → cloud backup / auth when needed (then thaw migrations carefully)
7. WHOOP field depth only where Home / Sleep / Engine consume it
8. Optional: modularize giant `index.html` **without** changing the product

### Not in the queue

- Phase B/C as separate apps
- Coach bench revival
- Expo

---

## 5. Honest risk & mitigation

| Risk | Mitigation |
| --- | --- |
| One giant `index.html` won’t scale forever | Accept for now. When it hurts: extract CSS/JS modules for *this* app. Do not restart on Expo/React Native. |
| Deleting `apps/web` breaks `pnpm run build` / CI | Either keep a minimal harness **or** redefine `build` to package typecheck-only in the same PR that deletes web |
| Shared DB footgun | Keep CLAUDE.md contract; freeze migrations until Account needs cloud |
| Agent / human opens root README → builds ARC | C1: replace README immediately |

---

## 6. Cleanup PR series (execute when approved)

| PR | Action | Risk |
| --- | --- | --- |
| **C1** | Replace root `README.md` with athlete mono-app pointer; top-of-`handoff.md` “one product” banner linking this charter | None |
| **C2** | Delete `ARC.dc.html`, `Coach App.dc.html`; delete unused `support.js` / `shots/` after confirm | Low |
| **C3** | `apps/web` keep-or-kill; adjust `package.json` `build` + CI to match; `pnpm run verify` still green | Medium |
| **C4** | Banner Phase B/C plans “Superseded — athlete HTML is the product”; scrub Expo revival copy | None |
| **C5** | Optional: move deep `handoff.md` history → `docs/history/` so the top stays operational | None |

**Never in these PRs:** delete `packages/strength-engine`, owned migrations, or CI verify of engine tests.

---

## 7. Success criteria

- New contributor opens repo → README says: edit hybrid-app, sync, Netlify, two dials
- No root HTML file looks like “the product to implement next”
- `pnpm run verify` still typechecks/tests the engine (+ migrations)
- Every athlete feature ships through one Update banner on the live app
- Agents default to hybrid-app edits, not ARC/Coach/Expo

---

## 8. Decision log

| Date | Decision |
| --- | --- |
| 23 Aug 2026 | **Mono-app bet locked:** athlete Hybrid HTML only; stop Coach/ARC/Expo product tracks |
| 23 Aug 2026 | Five jobs in one nav: Train · Log · Progress · Recover · Account |
| 23 Aug 2026 | Twin instruments: The Engine + Hybrid Strength; Track Dawn |
| 23 Aug 2026 | Full Body A only starter; B/C archived |
| Prior | Everyday Readiness / SZN retired; Expo shells deleted |

---

## 9. Approval gates

| Ask | Default |
| --- | --- |
| Approve **C1–C2** (README + delete ARC/Coach HTML)? | Ready to run on say-so |
| Approve **C3** (`apps/web` delete vs keep harness)? | Needs one-line owner pick |
| Start **Log** (real set logging) after polish remainder? | Next product build after cleanup |

**Do not start deleting until C1–C2 approved.** This document is the scope; cleanup is a separate execute pass.
