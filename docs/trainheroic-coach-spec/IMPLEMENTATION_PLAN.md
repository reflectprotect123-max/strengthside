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

### 5.0 Architecture — HTML now, modules when heavy (includes Nutrition)

**Stay HTML for the coach shell** (`coach.html` screens). That matches the athlete mono-app and keeps review-as-we-go fast.

**Do not put all domain logic in one giant HTML file.** Split like the athlete app already does:

```
coach.html              ← chrome + view render only
coach-loop.js           ← training domain (sessions, programs, assign)
coach-nutrition.js      ← nutrition domain (targets, meals, athlete payload) — LAST UI
nutrition-engine        ← existing package (adaptive macros) — never rewrite in HTML
nutrition-core          ← existing package (food search / day log)
```

| When | Move |
| --- | --- |
| Now → training loop done | HTML + `coach-loop.js` |
| Nutrition N* (last) | UI still HTML; logic in `coach-nutrition.js` + call packages |
| Coach HTML > ~2–3k lines of view code **or** multi-coach cloud | Consider Vite/multi-page split — **not required for N1–N5** |
| Shared coach↔athlete live | Bridge / Supabase — bigger than HTML, not a React rewrite |

**Answer to “will it need to be bigger than HTML?”**  
- **UI:** No for v1 — HTML + JS modules is enough for training + nutrition meals/check.  
- **Product:** Yes for **sync/bridge** (shared state, later cloud) — that is backend/storage work, not “leave HTML for React.”  
- **Packages:** Nutrition adaptive engine already is “bigger than HTML” and stays a package.

### 5.1 File layout (stay mono-html shell)

```
apps/mobile/prototype/hybrid-app/
  coach.html
  coach-loop.js
  coach-nutrition.js      ← domain ready; nav greyed until N*
  coach-loop.smoke.mjs
  coach-nutrition.smoke.mjs
  coach-session-builder.smoke.mjs
```

Do **not** split into React/Expo. Match athlete app shipping model.

### 5.2 Slice workflow (repeat per S0–S10, then N1–N5)

1. **Audit** — Open screenshot range; annotate regions (nav / toolbar / table / drawer)  
2. **Token pass** — Add component tokens only when a slice needs them  
3. **Static HTML/CSS** — Pixel-match at 1440×900 with seed data  
4. **Wire** — Connect to `coach-loop.js` / `coach-nutrition.js` handlers  
5. **Capture** — Puppeteer screenshot at same viewport  
6. **Compare** — Overlay or blink-diff; fix until structure matches  
7. **Smoke** — Extend smoke scripts for the slice’s critical path  

### 5.3 Bridge to athlete app (post UI)

After S6–S7 + S10 (training), then again for Nutrition N4:

| Coach action | Athlete effect |
| --- | --- |
| Publish calendar chip | Session appears on athlete Calendar for that date |
| Assign program | Stamps `assigned_session` rows athlete can open |
| Athlete logs set | Coach Home card shows actuals |
| **Publish meal day + targets (N4)** | **Athlete Nutrition shows prescribed meals** |
| **Athlete green-check / skip / add** | **Adherence + logs feed weeklyCheckIn** |

v1 local demo: share `localStorage` or explicit import/export — cloud sync later per strength-cloud-sync design.

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

**Training coach loop first.** Nutrition is **last** — only after training UI + training bridge ship.

```
S0 chrome (done / in review)
    → S9 Session builder + Engine conditioning (in progress)
    → S3/S4 Program grid
    → S6 Team calendar → S7 Athlete calendar + publish
    → Training bridge (coach publish → athlete calendar)
    → S1/S10 Home feed polish + session comments
    → S2/S4/S5/S8 roster tables as needed
    → ★ Nutrition N1–N5 LAST (see §11)
```

Rationale: templates + grid + calendars + training bridge prove coach↔athlete. Nutrition reuses that bridge pattern; do not start N* until training publish works.

---

## 8. Risk register

| Risk | Mitigation |
| --- | --- |
| TH light main vs Hybrid dark | **Resolved:** full Track Dawn dark on coach (matches athlete) |
| 222 screenshots drift from spec prose | Screenshots win on layout; brand stays Hybrid |
| Metric dropdown options incomplete in prose | Session builder blocks until dropdown shot transcribed |
| Program grid edit vs published calendar | Publish/unpublish on calendars only |
| Scope creep (Analytics, messaging) | Disabled chrome until chartered |
| Nutrition before training bridge | **Forbidden** — Nutrition is last (§7 / §11) |

---

## 9. Immediate next PRs

1. Finish **R3** — session builder + Engine conditioning on coach blocks  
2. **R4** — program grid  
3. **R5–R6** — calendars + publish  
4. **R10** — training bridge  
5. Home / roster polish  
6. **Nutrition N1–N5 last** (§11)

---

## 10. Reference index

| Asset | Path |
| --- | --- |
| Field/button spec | `docs/trainheroic-coach-spec/COACH_SPEC.md` |
| Screenshots | `docs/trainheroic-coach-spec/screenshots/` |
| Coach demo code | `apps/mobile/prototype/hybrid-app/coach.html` |
| Flow brain dump | `docs/research/coach-workspace-grok/HOW_IT_FLOWS.md` |
| Athlete tokens | `apps/mobile/prototype/hybrid-app/index.html` `:root` |
| Nutrition packages | `packages/nutrition-engine`, `packages/nutrition-core` |
| Athlete Nutrition UI | `apps/mobile/prototype/hybrid-app/nutrition-ui.js` |
| Mono-app charter | `docs/superpowers/plans/2026-08-23-mono-athlete-app-charter.md` |

---

## 11. Nutrition — LAST (after training coach loop)

Do **not** start these slices until training assign/publish + athlete calendar bridge works.

### Product contract

| Rule | Detail |
| --- | --- |
| **Coach authors** | Macros (kcal / P/C/F) + meal days from food DB |
| **Adaptive engine** | Existing `nutrition-engine` `weeklyCheckIn` — no rewrite |
| **Coach override** | Anytime; overrides win until coach clears or accepts next proposal |
| **Athlete surface** | Meals land in existing **Nutrition** module — not a second app |
| **Athlete meal UX** | Prescribed meals → **green check** if eaten → **delete/skip** if not → **add** if ate something else |
| **Not primary path** | Full per-bite MacroFactor logging; weigh-in + check/skip/add drives adherence |
| **Food DB** | Coach search/author with existing catalog; athlete add-path reuses same search when they deviate |

### Flow

```
Coach: set targets + build meal day (food DB)
    → Bridge: day appears in athlete Nutrition
        → Athlete: green-check / skip / add + bodyweight
            → weeklyCheckIn proposes new macros
                → Coach sees proposal; accept or override
```

### Slices (N1 → N5, last)

| Slice | What | Effort |
| --- | --- | --- |
| **N1** | Coach targets board — current / proposed macros, override form | Small–medium |
| **N2** | Coach check-in feed — weekly HOLDING / READY, weight trend summary | Small |
| **N3** | Coach meal author — food search, meal slots, publish day | Small–medium |
| **N4** | Bridge — coach targets + meals → athlete Nutrition store | Medium |
| **N5** | Athlete Nutrition — prescribed meal rows with green-check / skip / add | Small |

### Ownership rule

When coach override and adaptive proposal both exist: **coach override wins** until coach explicitly accepts engine proposal or clears override.
