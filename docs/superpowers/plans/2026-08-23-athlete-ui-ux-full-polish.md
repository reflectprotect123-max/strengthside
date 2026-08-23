# Athlete UI/UX Full Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development` or `executing-plans` to implement task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Hard gate:** Zero AI slop. If a change would pass the ban list below, do not ship it. Prefer deleting chrome over decorating.

**Goal:** One coherent Track Dawn athlete shell (Home, The Engine, Library / Hybrid Strength, Calendar, Settings) — polish in place, no architecture rewrite, no revived retired surfaces.

**Architecture:** Edit `apps/mobile/prototype/hybrid-app/index.html` (+ SW). Local-first SPA. Tokens first, then twin-instrument parity (Engine teal / Strength copper). Sync + cache bump per ship.

**Tech Stack:** Vanilla HTML/CSS/JS; `bash apps/mobile/sync-hybrid-html.sh`; Netlify preview-site.

**Skills / locks:** `frontend-design` (anti-default), `ui-ux-pro-max` (a11y/touch only — **palette suggestions discarded**), `handoff.md` Track Dawn + naming.

---

## Zero AI slop (non-negotiable)

### Banned looks (never introduce)

| Ban | Why |
| --- | --- |
| Cream `#F4F1EA` + terracotta + display serif | AI cluster #1 |
| Near-black + acid green / vermilion glow | AI cluster #2 |
| Broadsheet / hairline newspaper columns | AI cluster #3 |
| Purple / indigo gradients | User + product ban |
| Orange “fitness energy” (`#F97316` etc.) from ui-ux-pro-max | Fights Track Dawn |
| Inter / Roboto / Arial / system as the designed face | Generic default — kill Inter global |
| Emoji as icons | Amateur / inconsistent |
| `rounded-full` pill clusters, badge soup, stat strips | Dashboard slop |
| Multi-layer glow shadows, neon borders | Decor, not instrument |
| Cards wrapping non-interactive content “for polish” | If border/shadow/radius can go, remove it |
| Hero overlays: floating chips, promo stickers, callout badges | Noise |
| Numbered step grids (01 Name / 02 Blocks…) on athlete build | Fake tutorial chrome |
| “Idiot-proof”, “delightful”, “seamless”, coach costume on athlete path | Copy slop |
| GSAP / bounce / `back.out` staggers on dense training UI | Motion theater |
| Light mode, glassmorphism showcase, bento marketing grids | Wrong product |

### Required materials (only these)

| Token | Value | Use |
| --- | --- | --- |
| Deep graphite | `#07090b` | Page atmosphere |
| Panel steel | `#12161a` | Surfaces |
| Bone | `#eef2f4` | Text |
| Copper | `#d4a574` / `#e8c49a` | Hybrid Strength + primary CTA |
| Zone teal | `#5ec4b4` | The Engine zones only |
| Display | Barlow Condensed | Titles, sticky CTA, HR/zone numerals |
| Body | Space Grotesk | UI copy, forms |

### Signature (one risk — spend boldness here only)

**Twin instruments:** Engine slate (teal) and Strength slate (copper) share the same chrome grammar — condensed eyebrow, 44px chips, sticky primary — so it reads as one system with two dials. Everything else quieter than that.

### Pre-ship slop audit (every commit)

- [ ] Screenshot: could this first screen belong to another fitness SaaS after removing the wordmark? If yes, failed.
- [ ] Grep diff for: `Inter`, `purple`, `gradient(`, `glow`, `rounded-full`, `🎉`, `Idiot`, `Morpheus`, `delight`
- [ ] Remove one accessory (Chanel): if a border/shadow/card/badge isn’t needed for interaction, delete it
- [ ] Motion: only opacity/transform ≤250ms; `prefers-reduced-motion: reduce` = instant
- [ ] Copy: active verb CTAs only (“Add lift”, “Save workout”, “Start session”)

---

## Global product constraints

- Names: **The Engine** + **Hybrid Strength** = THE Hybrid System. Never Morpheus in athlete UI.
- Retired: Everyday Readiness, SZN seed lifts, Guide/block-help, Home strength score strips, Nutrition stub, calendar tonnage, athlete-facing Coach Tools.
- Touch: ≥44px; sticky CTAs above safe-area; no hover-only affordances.
- A11y: brass `focus-visible`, labels, `aria-pressed` on chips, no unlabeled icon buttons.
- File: `apps/mobile/prototype/hybrid-app/index.html` → sync → bump `LOCAL_BUILD` / CACHE.

---

## File map

| File | Role |
| --- | --- |
| `apps/mobile/prototype/hybrid-app/index.html` | Tokens + all screens |
| `apps/mobile/prototype/hybrid-app/service-worker.js` | CACHE |
| `apps/mobile/sync-hybrid-html.sh` | Sync |
| `handoff.md` | Build stamp |

---

## Task 1 — Token truth (kill dual `:root`)

**Deliverable:** One Track Dawn variable set. No warm-gold stack fighting copper.

- [ ] Collapse legacy gold `:root` into copper/graphite ath tokens (aliases only if needed).
- [ ] Global `font-family: var(--font-body)` — **no Inter**.
- [ ] `--tap-min: 44px`, `--focus` brass ring, `--space-*` 4/8 rhythm.
- [ ] New CSS uses tokens only — no raw hex in component rules added this pass.
- [ ] Slop audit + Home still boots.
- [ ] Commit: `Polish: single Track Dawn token layer.`

---

## Task 2 — Interaction floor (invisible quality)

**Deliverable:** Feels solid; looks unchanged to a casual glance.

- [ ] Primary controls `min-height: var(--tap-min)`; 8px+ gaps.
- [ ] `focus-visible` everywhere interactive; never `outline: none` bare.
- [ ] Sticky bars + nav respect `env(safe-area-inset-*)`; scroll padding so content isn’t buried.
- [ ] Reduced-motion: strip non-essential transitions app-wide.
- [ ] Slop audit (no new glow/pill chrome).
- [ ] Commit: `Polish: tap, focus, safe-area floor.`

---

## Task 3 — Home: one briefing

**Deliverable:** First viewport = athlete + next action. Not a dashboard.

- [ ] Sleep + Conditioning modules stay; no new stat strips / badge rows.
- [ ] One primary CTA (resume / Build Hybrid Strength / Start Conditioning by state); Library tertiary.
- [ ] Empty copy is directional (“Build a Hybrid Strength workout”) — not cute.
- [ ] No enter-stagger theater; optional single 180ms fade if it doesn’t feel like a landing page.
- [ ] Slop audit + 375px screenshot.
- [ ] Commit: `Polish: Home briefing hierarchy.`

---

## Task 4 — Engine: reference instrument (teal)

**Deliverable:** Keep v28 contract; strip leftover coach/Morpheus diction only.

- [ ] Naming = The Engine only.
- [ ] Shared sticky class with Strength (e.g. `.ath-sticky`) — same geometry, teal accent where zone UI needs it.
- [ ] No new decorative zone chrome.
- [ ] Manual: Format → Start → log.
- [ ] Commit: `Polish: Engine instrument parity.`

---

## Task 5 — Library + Strength: copper twin (main win)

**Deliverable:** Feels like Engine’s sibling — not coach tools, not a template admin.

- [ ] Library: one job — build or schedule a lift day. A/B/C as equal ≥44px controls (not a pill cloud).
- [ ] Kill any remaining step-grid / “proof card” on athlete strength build.
- [ ] Builder: `Hybrid Strength · build`; Warm-up/Cool-down collapsed until opened.
- [ ] Sticky **Add lift** / **Save workout** (same words in review confirmation).
- [ ] Add-lift sheet: search + big rows; defaults 3×8 / 120s; no guideline essay up front.
- [ ] Empty Library: one button — Build strength.
- [ ] Cards only where tap expands/schedules; otherwise flatten.
- [ ] Slop audit + full build→save path.
- [ ] Commit: `Polish: Hybrid Strength copper instrument (v33).`

---

## Task 6 — Calendar + Settings: quiet match

- [ ] Same type/spacing; day cells ≥44px; markers via copper/zone tokens only.
- [ ] Settings groups: Update / WHOOP / HR / Export; Coach access stays buried.
- [ ] No new sections, no import/danger theater.
- [ ] Commit: `Polish: Calendar and Settings quiet match.`

---

## Task 7 — Copy + a11y sweep

- [ ] Grep: Morpheus, Idiot-proof, Template builder, Programs (athlete), delight, seamless.
- [ ] One `h1` per screen; icon buttons labeled; decorative SVG `aria-hidden`.
- [ ] Commit: `Polish: athlete voice and a11y.`

---

## Task 8 — Ship

- [ ] `LOCAL_BUILD` + CACHE → `engine-v33` (or next free).
- [ ] Sync, deploy, handoff stamp.
- [ ] Manual matrix + **Zero AI slop audit**.
- [ ] Push / PR.

---

## Out of scope

- `@hybrid/strength-engine` WM% / e1RM / PR wiring
- Everyday Readiness / coach-first Programs
- React rewrite, light mode, skill orange/red palettes, GSAP

---

## Ship order

**Vertical slice first:** Tasks **1 + 2 + 5 + 8** (tokens, floor, copper twin, ship).  
Then 3 → 4 → 6 → 7.
