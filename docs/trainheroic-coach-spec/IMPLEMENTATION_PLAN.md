# THE Hybrid Coach — 1:1 Screenshot Implementation Plan

**Date:** 26 August 2026  
**Source pack:** `docs/trainheroic-coach-spec/` (222 PNGs + 2 WebP + `COACH_SPEC.md`)  
**Target surface:** `apps/mobile/prototype/hybrid-app/coach.html` + `coach-loop.js` (PR #62)  
**Athlete app:** untouched — `index.html` remains the only athlete product.

This plan maps every reference screenshot to a build slice, applies our design skills to THE Hybrid branding (not TrainHeroic copy), and defines how we prove 1:1 layout fidelity before wiring cloud sync.

---

## 1. Product contract

| Rule | Detail |
| --- | --- |
| **Coach-only** | No athlete logger, no phone shell, no second athlete product |
| **Desktop-first** | TH coach web has no mobile breakpoint ~1024px; our v1 matches that |
| **Layout fidelity** | Structure, hierarchy, controls, empty states, and field placement match screenshots |
| **Brand fidelity** | Track Dawn tokens from athlete app — copper accent, dark chrome — not TH blue/black |
| **Copy fidelity** | THE Hybrid labels; no TrainHeroic marks, program names, or marketplace strings |
| **Data model** | Reuse session/block/row shapes the athlete app already logs (`coach-loop.js`) |
| **Publish semantics** | Calendar chips: UNPUBLISHED → Publish / Publish All → live (per `COACH_SPEC.md` §E) |

**Out of scope (do not build from this pack):** athlete today/logger, rest timer, billing, marketplace, messaging, video upload, analytics reports, gym tools, compliance %, APIs, assistant-coach management.

---

## 2. Skill-driven design direction

### 2.1 Brand & tokens (`design-system` + athlete `index.html`)

Three-layer token stack for coach chrome — shared primitive names with athlete app, coach-specific semantic aliases:

```css
/* Primitive (shared with athlete Track Dawn) */
--color-copper: #d4a574;
--color-copper-bright: #e8c49a;
--color-bg-deep: #07090b;
--color-bg-panel: #12161a;
--color-line: rgba(255,255,255,.08);

/* Semantic (coach web) */
--coach-nav-bg: var(--color-bg-deep);
--coach-main-bg: #f4f6f8;          /* light content pane like TH, not dark */
--coach-card-bg: #ffffff;
--coach-accent: var(--color-copper); /* replaces TH primary blue for CTAs */
--coach-accent-on: #14110d;
--coach-link: #3d7ea6;             /* muted steel-blue for text links only */
--coach-status-ok: #7dba9a;
--coach-status-warn: #d4a35b;
--coach-unpublished: #c45c5c;

/* Component */
--coach-nav-item-active: rgba(212,165,116,.12);
--coach-table-header: #eef1f4;
--coach-chip-unpublished-bg: #fff5f5;
```

Typography (already in PR #62 — keep):

- **Display:** Barlow Condensed — section headers, date rails, metric numerals  
- **Body:** Space Grotesk — tables, forms, feed copy  

**frontend-design rule:** Spend boldness once — copper on primary actions and active nav only; keep tables and feed cards quiet. Do not paste TH’s saturated blue buttons; map them to `--coach-accent`.

### 2.2 UX floor (`ui-ux-pro-max`)

Pre-ship checklist per slice:

- [ ] Visible focus rings (3px, `--color-copper-bright`) on all interactive elements  
- [ ] `cursor: pointer` on click targets; 44px min touch height on primary controls  
- [ ] Table overflow: `overflow-x: auto` wrapper on roster views (screens ~080, ~050)  
- [ ] Bulk select + disabled bulk actions until selection (Athletes/Teams/Exercises)  
- [ ] `prefers-reduced-motion: reduce` — no animated feed carousels  
- [ ] Empty states match screenshot copy structure (Home §A, Programming rail)  
- [ ] No emoji as icons — inline SVG (Heroicons-style strokes)  
- [ ] Keyboard: Escape closes drawers; Enter submits forms; Tab order follows visual order  

### 2.3 Information architecture (from `COACH_SPEC.md`)

```
Library: session templates (Sessions tab)
    → Program grid (weeks × Day 1–7)
        → Assign → team calendar / athlete calendar
            → Publish / Unpublish on chips
                → Athlete logs in athlete app (out of scope)
                    → Coach Home feed (prescribed vs actual)
                        → Session Comment drawer
```

---

## 3. Screenshot inventory → build slices

Capture order is canonical (`001` → `222`). Ranges below are **starting guesses** — each slice begins with a 15-minute screenshot audit to pin exact frame numbers before coding.

| Slice | Screens (approx) | Spec § | Screen / state | PR #62 today | Priority |
| --- | --- | --- | --- | --- | --- |
| **S0** | `000_*`, chrome | — | Global shell: left nav, top bar, content grid | Partial (dark-only) | P0 |
| **S1** | 001–015 | A, C | Coach Home collapsed + filter dropdown + date mode | Home stub | P0 |
| **S2** | 016–029 | C, D | Library → Programs list + search/toolbar | Library programs stub | P0 |
| **S3** | 030–049 | D, E | Program grid + gear/folder/eye + cell kebab | Grid partial | P0 |
| **S4** | 050–079 | J | Teams list + Create Team dialog + row kebab | Missing | P1 |
| **S5** | 080–119 | I | Athletes roster + GROUP/STATUS filters + bulk bar | Missing | P1 |
| **S6** | 120–149 | J | Team calendar month + day expand + chip states | Missing | P0 |
| **S7** | 150–169 | I, E | Athlete calendar + Publish All + eye toggles | Missing | P0 |
| **S8** | 170–199 | G, F | Exercises table + Create Exercise drawer + pagination | Missing | P2 |
| **S9** | 200–215 | F | Session builder (blocks A–G, metric dropdown, superset) | Template editor partial | P0 |
| **S10** | 216–222 | B, A | Home expanded card + Session Comment drawer + empty feed | Expand partial | P0 |

**Extras:** `000_coach-home-collapsed.webp`, `000_program-grid.webp` — golden references for S1 and S3 sign-off.

**Deferred nav items (show disabled or omit until slice):** Analytics, Gym Tools, Support, Messages, Notifications — screenshots include them in chrome; v1 can render greyed with `title="Coming soon"` so layout matches without building product.

---

## 4. Slice specifications (1:1 acceptance)

Each slice ships only when a side-by-side capture matches the reference frame at **1440×900** (TH desktop capture size).

### S0 — Application chrome

**Reference:** 001, 050, 080 (shared header/sidebar)

**Build:**

- Fixed **220px** dark left rail: logo mark, nav items, Support pinned bottom  
- Top bar: page title left; right cluster (profile, optional disabled badges)  
- Main: **light** `#f4f6f8` background; white cards inside  
- Right rail **280px** on Home only; hidden on Library/Calendars  

**Accept:** Nav active state, icon+label spacing, and content column widths match reference overlays.

---

### S1 — Coach Home (collapsed)

**Reference:** `000_coach-home-collapsed.webp`, 001–015, `COACH_SPEC.md` §A

**Controls to implement:**

| Control | Behavior |
| --- | --- |
| Filter dropdown | All Athletes / 1:1 / New Members / Me / per-team |
| Latest + calendar icon | Toggle feed vs date-picker mode |
| Expand all cards | Hides per-card See More when on |
| Session card | Avatar, name, title, Blocks ring, Readiness/Minutes/Intensity/Volume |
| See More / See Less | Per-card expand |
| Session Comment | Opens drawer (S10) |
| Right rail | Needs Programming empty state |

**Accept:** Metric row layout (5 columns), donut blocks chart, dashed `–` for missing metrics, date headers with “Expand all cards” toggle.

---

### S2 — Library → Programs

**Reference:** 001, 016–029, §C

**Build:** Tab bar (Programs · Sessions · Exercises · Circuits · Prescriptions · More), My Programs dropdown, table columns, Assign link, Create Program, pagination footer.

**Accept:** Row actions (calendar, message, gear), checkbox column, 100 rows/page footer.

---

### S3 — Program grid

**Reference:** `000_program-grid.webp`, 030–049, §D

**Build:** WEEK × DAY 1–7 grid, session cards in cells, empty cells blank (no placeholder copy), header title edit, Eye / Folder+ / Gear, cell kebab menu.

**Accept:** Card shows block letter + exercise + set count; kebab opens copy/move/delete/save-as-template menu (labels from screenshots, not invented).

---

### S4 — Teams

**Reference:** 050–079, §J (list + Create Team)

**Build:** Teams table, Create Team modal (name 0/75, Create disabled until filled), row kebab Invite/View Athletes.

---

### S5 — Athletes roster

**Reference:** 080–119, §I (list half)

**Build:** Sortable name column, Actions (calendar/message/progress), Athlete Type, Teams count, Tags, Days Since Last Login, GROUP + STATUS filters, Invite Athletes.

---

### S6 — Team calendar

**Reference:** 120–149, §J (calendar)

**Build:** Month grid, unpublished vs published chips, Publish All enablement, day click → expand with EDIT + ADD FROM LIBRARY, chip kebab menus (§E).

**Accept:** UNPUBLISHED label on chips; Publish All grey until unpublished exists.

---

### S7 — Athlete calendar

**Reference:** 150–169, §I

**Build:** Same toolbar as team calendar minus team gear; empty day → Add From Library drawer only (no Create Session).

---

### S8 — Exercises library

**Reference:** 170–199, §G

**Build:** All Exercises / My Exercises scope, 7-column table, Create Exercises → drawer, Save disabled until Title, Parameter 1/2 selects, pagination.

---

### S9 — Session builder

**Reference:** 200–215, §F

**Build:**

- Session title + coach instructions (0/10000)  
- Blocks A–G: category select (7 values), For Weight / For Completion, notes, kebab Test/Delete  
- Exercise row: picker, sets×reps, load, metric dropdown (canonical list = open-dropdown screenshots, not prose)  
- D1/D2 superset pairing  
- Add Block / Add Exercise  

Wire to `coach-loop.js` templates — same block shape athlete logger consumes.

---

### S10 — Home expanded + comment

**Reference:** 216–222, §B

**Build:**

- Category headers (WARM UP, STRENGTH/POWER, …)  
- Letter badges: green complete, amber partial, grey hollow  
- Prescribed struck-through + bold actual underneath  
- For Completion link on scored blocks  
- Session Comment drawer: team badge, GIF button, composer, Send (local-only v1)  

**Accept:** Match 220/222 expanded card — block list, See Less, full-width comment CTA.

---

## 5. Engineering approach

### 5.1 File layout (stay mono-html)

```
apps/mobile/prototype/hybrid-app/
  coach.html          ← layout + render functions per slice
  coach-loop.js       ← state, seed, assign/publish/log read APIs
  coach-loop.smoke.mjs
  coach-screens/      ← NEW: optional reference viewer (dev-only HTML)
```

Do **not** split into React/Expo. Match athlete app shipping model.

### 5.2 Slice workflow (repeat per S0–S10)

1. **Audit** — Open screenshot range; annotate regions (nav / toolbar / table / drawer)  
2. **Token pass** — Add component tokens only when a slice needs them  
3. **Static HTML/CSS** — Pixel-match at 1440×900 with seed data  
4. **Wire** — Connect to `coach-loop.js` handlers  
5. **Capture** — Puppeteer screenshot at same viewport  
6. **Compare** — Overlay or blink-diff; fix until structure matches  
7. **Smoke** — Extend `coach-loop.smoke.mjs` for the slice’s critical path  

### 5.3 Bridge to athlete app (post UI)

After S6–S7 + S10:

| Coach action | Athlete effect |
| --- | --- |
| Publish calendar chip | Session appears on athlete Calendar for that date |
| Assign program | Stamps `assigned_session` rows athlete can open |
| Athlete logs set | Coach Home card shows actuals (read shared storage / later Supabase) |

v1 local demo: share `localStorage` key or explicit import/export — cloud sync is a later PR against `docs/superpowers/specs/2026-08-24-strength-cloud-sync-design.md`.

---

## 6. Verification matrix

| Check | Command / artifact |
| --- | --- |
| Coach smoke | `pnpm run check:coach-loop` |
| Full verify | `pnpm run verify` |
| Visual slice sign-off | `coach-screens/compare.mjs` (to add) — diff against `docs/trainheroic-coach-spec/screenshots/NNN_*.png` |
| No athlete regression | Confirm `index.html` byte-sync unchanged in coach PRs |
| A11y spot | axe or manual keyboard pass per slice |

---

## 7. Recommended delivery order

```
S0 chrome → S1 Home collapsed → S2 Programs → S3 Program grid
    → S9 Session builder (templates first — unblocks grid)
    → S6 Team calendar → S7 Athlete calendar → S4 Teams → S5 Athletes
    → S8 Exercises (read-only + create drawer)
    → S10 Home expanded + comment
    → Bridge PR (shared publish state with athlete app)
```

Rationale: templates + grid + calendars are the coach loop; roster tables can follow once assign/publish works end-to-end.

---

## 8. Risk register

| Risk | Mitigation |
| --- | --- |
| TH light main + Hybrid dark athlete feel disjointed | Coach is a **separate surface** (`coach.html`); intentional desktop light workspace |
| 222 screenshots drift from spec prose | Screenshots win on conflicts (`COACH_SPEC.md` header says so) |
| Metric dropdown options incomplete in prose | Slice S9 blocks until dropdown screenshot is transcribed to enum in `coach-loop.js` |
| Program grid edit vs published calendar | Do not assume grid edits rewrite live sessions; implement publish/unpublish on calendars only |
| Scope creep (Analytics, messaging) | Disabled chrome items only until explicitly chartered |

---

## 9. Immediate next PRs

1. **This PR** — Import spec pack + this plan (no UI change)  
2. **Merge PR #62** — Land coach shell + `coach-loop.js` demo  
3. **PR: S0+S1** — Chrome + Home collapsed 1:1 against `000_coach-home-collapsed.webp`  
4. **PR: S9+S3** — Session builder + program grid  

---

## 10. Reference index

| Asset | Path |
| --- | --- |
| Field/button spec | `docs/trainheroic-coach-spec/COACH_SPEC.md` |
| Screenshots | `docs/trainheroic-coach-spec/screenshots/` |
| Coach demo code | `apps/mobile/prototype/hybrid-app/coach.html` (PR #62) |
| Flow brain dump | `docs/research/coach-workspace-grok/HOW_IT_FLOWS.md` |
| Athlete tokens | `apps/mobile/prototype/hybrid-app/index.html` `:root` |
| Mono-app charter | `docs/superpowers/plans/2026-08-23-mono-athlete-app-charter.md` |
