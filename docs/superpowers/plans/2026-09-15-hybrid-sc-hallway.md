# HYBRID S&C Hallway Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One Capacitor athlete install named HYBRID S&C that always boots Strength HTML, walks to Engine HTML from Me, shares one Supabase login, keeps notebooks in `strength_side` / `engine_side`, and paints both-way week marks without merging workouts.

**Architecture:** Pure `hybrid-sc.js` owns locker chrome helpers, occupancy date keys, and origin URLs. Strength stays `apps/athlete/`. Engine static snapshot lives at `apps/athlete/engine/` so Capgo/webDir already points at athlete. Cold open is Strength `index.html`. Toggle assigns `location` to `./` or `./engine/`. Occupancy dots read local library/session dates plus the other domain snapshot’s date keys only.

**Tech Stack:** Existing Hybrid HTML (no framework), node:test, Capacitor `com.hybrid.athlete`, shared Supabase.

## Global Constraints

- Product name is exactly `HYBRID S&C` (wordmark, title, appName, Me eyebrow).
- Cold open always Strength. Home subtitle is status only (not tappable). Switch is Me only.
- Do not merge loggers, libraries, or Brain `decideNext` across kinds.
- Strength PlanSync domain stays `strength_side`. Engine PlanSync domain stays `engine_side`.
- Week marks: copper `.cal-dot.strength` = lift occupancy; teal `.cal-dot.engine` = Engine occupancy; same day may show both; opening a day still only shows that house’s sessions.
- Package id stays `com.hybrid.athlete`.
- Coach, Nutrition, one WHOOP token are out of scope.
- Me must not mention PlanSync / Copy training (existing smoke).
- Follow TDD for `hybrid-sc.js`. Frequent commits. Do not rewrite Training/logger CSS.

## File map

- Create: `apps/athlete/hybrid-sc.js`
- Create: `apps/athlete/hybrid-sc.test.js`
- Create: `apps/athlete/engine/` (static copy of Engine HTML house)
- Modify: `apps/athlete/app.js` (brand, Me card, calendar dots, boot)
- Modify: `apps/athlete/home.css` (lockers + locker-switch)
- Modify: `apps/athlete/index.html` (title + script)
- Modify: `apps/athlete/strength-config.js` (engineOrigin)
- Modify: `apps/athlete/service-worker.js` (cache bump + hybrid-sc.js)
- Modify: `apps/athlete/checks/athlete-app.smoke.mjs`
- Modify: `apps/mobile/capacitor/capacitor.config.json`, `android/.../strings.xml`
- Modify: `package.json` check:athlete-app to include hybrid-sc.test.js

---

### Task 1: hybrid-sc.js occupancy + chrome helpers

**Files:**
- Create: `apps/athlete/hybrid-sc.js`
- Create: `apps/athlete/hybrid-sc.test.js`
- Modify: `package.json` (add `apps/athlete/hybrid-sc.test.js` to `check:athlete-app`)

**Interfaces:**
- Produces: `global.HybridSc` with `PRODUCT` `'HYBRID S&C'`, `datesFromState(state)`, `datesFromSnapshot(snapshot)`, `occupancy(strengthDates, engineDates)`, `dotsHtml(iso, occ)`, `lockerCardHtml(active)`, `origins(locationHref)`, `brandHtml(active)`, `applyOccupancyToState(S, strengthDates, engineDates)`

- [x] **Step 1: Write failing tests** in `apps/athlete/hybrid-sc.test.js` using `node:test` + `createRequire` like `library.test.js`. Cover: dates from assignments + session keys; snapshot session dates; occupancy merge; dotsHtml includes both classes on same iso; origins for athlete root vs `/engine/`; lockerCardHtml marks Strength primary when active strength.

- [x] **Step 2:** `node --test apps/athlete/hybrid-sc.test.js` — FAIL (no module)

- [x] **Step 3:** Implement `hybrid-sc.js` as IIFE on `globalThis`/`window`. `datesFromState` uses `library.assignments` keys and `sessions` object keys (ISO dates). `datesFromSnapshot` walks `snapshot.sessions[].date`. `dotsHtml` emits zero, one, or two spans `.cal-dot.strength` / `.cal-dot.engine`. `origins`: if href path contains `/engine`, strength is `../`, engine is `./`; else strength `./`, engine `./engine/`.

- [x] **Step 4:** Tests pass.

- [x] **Step 5:** Commit `feat: HybridSc occupancy and locker helpers`

---

### Task 2: Strength chrome + Me hallway + calendar dots

**Files:** Modify `apps/athlete/app.js`, `home.css`, `index.html`, `strength-config.js`, `service-worker.js`, `checks/athlete-app.smoke.mjs`

**Interfaces:** Consumes `HybridSc`. Home `topBarHtml` uses `HybridSc.brandHtml('strength')`. `calendarHtml` and training week use `HybridSc.dotsHtml(iso, S.hybridOccupancy)`. `meHtml` prepends `HybridSc.lockerCardHtml('strength')`. `switchHybridLocker('engine')` sets user_metadata `hybrid_sc` when Whoop.client exists, then `location.assign(HybridSc.origins(location.href).engine)`.

- [x] Wire `index.html` `<title>HYBRID S&C</title>` and `<script src="hybrid-sc.js">` before `app.js`.
- [x] `strength-config.js` add `engineOrigin: './engine/'`.
- [x] CSS: `.home-lockers` / `.locker-switch` matching throwaway preview (two-column Me buttons, 44px min-height).
- [x] After save/load, `S.hybridOccupancy = HybridSc.occupancy(HybridSc.datesFromState(S), (S.hybridOccupancy && S.hybridOccupancy.engine) || {})`.
- [x] Peek other domain: if `Whoop.client`, select `athlete_domain_snapshots` domain `engine_side` and merge `datesFromSnapshot`. Never apply Engine snapshot into `S.library`.
- [x] Sign-in lead: one email for HYBRID S&C; land Strength blank slate.
- [x] Smoke: must include `HYBRID S&C`, `hybrid-sc.js`, `lockerCardHtml` or `HYBRID S&amp;C`; keep PlanSync Me silence; bump SW `the-brain-v16` and list `./hybrid-sc.js`.
- [x] Commit `feat: HYBRID S&C Strength chrome and Me locker switch`

---

### Task 3: Engine house in the same bundle

**Files:** Create `apps/athlete/engine/` by copying Engine HTML assets from `/tmp/apps/Engine-side-` (or clone `Engine-side-`) — only web assets (`index.html`, `app.js`, css, js bundles, `connectors/`, `vendor/`, `assets/`, `engine-config.js`, `engine.js`, `adaptive-bundle.js`, `service-worker.js`). Do not copy `mobile/`, `supabase/`, `.git`, `sites/`.

**Interfaces:** Engine `index.html` loads `../hybrid-sc.js` or a copied `hybrid-sc.js` in `engine/`. Prefer copy `hybrid-sc.js` into `engine/` so Engine SW stays self-contained, keep in sync.

- [x] Copy files. Engine `app.js` brand `HybridSc.brandHtml('engine')`, Me `lockerCardHtml('engine')`, calendar dots from occupancy with local engine dates + peeked `strength_side` dates. Toggle Strength → `../` or `HybridSc.origins().strength`.
- [x] Engine `engine-config.js` add `strengthOrigin`.
- [x] Engine smoke: optional `apps/athlete/engine/checks` or extend athlete smoke to require `apps/athlete/engine/index.html` contains `hybrid-product` engine and HYBRID S&C after edit.
- [x] Commit `feat: bundle Engine HTML house under athlete/engine`

---

### Task 4: Native label + verify

**Files:** `apps/mobile/capacitor/capacitor.config.json` `appName`: `HYBRID S&C`; `strings.xml` `app_name` and `title_activity_main` `HYBRID S&amp;C`.

- [x] Run `pnpm run check:athlete-app`
- [x] Screenshot Strength Home, Strength Me, Engine Home, Engine Me (phone 390×844)
- [x] Commit `feat: native HYBRID S&C label`

---

### Task 5: Byte-by-byte UI/UX audit (no logger restyle)

Use `ui-ux-pro-max` (`--domain ux` touch targets, contrast) + `frontend-design` against locked OLED shell. Fix only hallway chrome issues (tap 44px, contrast on muted locker, focus/aria-pressed on Me switch). Do not restyle Training/logger.

- [x] Audit screenshots vs spec chrome
- [x] Fix gaps
- [x] Commit `fix: HYBRID S&C chrome a11y` if needed
