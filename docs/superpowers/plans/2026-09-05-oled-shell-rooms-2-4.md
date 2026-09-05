# OLED Shell Rooms 2–4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish athlete OLED polish — global chrome, Logger, Library, Calendar, Settings — matching brand B and Rooms 2–4 spec.

**Architecture:** Extend existing `--oled-*` tokens and `.shell-screen--oled` grammar. Prefer shared OLED shell CSS; scope Logger with `.logger-screen` / app logger class overrides. Canonical file `apps/mobile/prototype/hybrid-app/index.html` → sync script. Cache bump once at end (`blank-v181`).

**Tech Stack:** Vanilla HTML/CSS/JS; Node smokes; `bash apps/mobile/sync-hybrid-html.sh`.

**Spec:** `docs/superpowers/specs/2026-09-05-oled-shell-rooms-2-4.md`

## Global Constraints

- OLED palette only for shell chrome: `#000000` / `#121212` / `#1C1C1E` / `#FFFFFF` / `#8E8E93`.
- Dial arcs stay `#9db4c8` / `#16f26b` / `#1ba3ff`.
- No copper body washes; no gold `.btn.primary` gradient brick.
- Twin-instrument accents allowed as **thin** dial-strength copper or dial-engine teal borders/text only — never full gold bricks.
- Do not invent product logic; no Capgo publish in these tasks.
- Canonical edit + sync; Home Room 1 must stay green.
- Cache target at end: `the-hybrid-athlete-blank-v181`.
- Banned: purple, cream+terracotta, broadsheet, glow stacks, Inter, emoji chrome.

---

## File map

| File | Role |
| --- | --- |
| `apps/mobile/prototype/hybrid-app/index.html` | CSS + shell wrappers + CTA classes |
| `apps/mobile/prototype/hybrid-app/service-worker.js` | CACHE bump (Task 4) |
| `apps/mobile/prototype/hybrid-app/oled-home.smoke.mjs` | Extend → shell assertions (or rename content) |
| `apps/mobile/prototype/hybrid-app/whoop-home-dials.smoke.mjs` | Expect v181 at end |
| Other colocated `*.smoke.mjs` pinning LOCAL_BUILD | Bump to v181 in Task 4 |
| Twins via sync script | Task 4 |

---

### Task 1: Global body, nav, primary CTA → OLED

**Files:**
- Modify: `apps/mobile/prototype/hybrid-app/index.html` (CSS: `body` washes, `.nav`, `.btn.primary`)
- Modify: `apps/mobile/prototype/hybrid-app/oled-home.smoke.mjs` (add global asserts; keep Home asserts)

**Steps:**

- [ ] **Step 1: Extend smoke (failing)**

Add to `oled-home.smoke.mjs` (keep existing asserts):

```js
must(!/radial-gradient\([^\)]*rgba\(212,\s*165,\s*116/.test(html.match(/body\{[\s\S]*?\n\}/)?.[0] || ''), 'body has no copper radial wash');
must(html.includes('.nav') && html.includes('var(--oled-bg)'), 'nav uses OLED tokens OR body background uses --oled-bg');
must(html.includes('background:var(--oled-bg)') || html.includes('background: var(--oled-bg)'), 'page uses --oled-bg');
// Primary CTA not gold gradient brick in global .btn.primary rule:
must(!/\.btn\.primary[^{]*\{[^}]*linear-gradient\(180deg,\s*#e8c49a/i.test(html), 'global .btn.primary is not gold gradient brick');
```

Also assert:

```js
must(html.includes('--oled-bg:#000000'), 'OLED tokens still present');
```

- [ ] **Step 2: Run smoke — expect FAIL** on copper body wash or gold primary.

- [ ] **Step 3: Implement**

1. Set page atmosphere:
   - In `:root` or body Track Dawn block, change effective page bg to `var(--oled-bg)` (`#000000`).
   - Remove copper/teal radial gradients from `body{ background: … }` — solid `var(--oled-bg)` (or deep black only).
2. `.nav` / `#bottomNav`: background `var(--oled-bg)` or `#000000e8`; border `rgba(255,255,255,.08)`; `.nav button.active` color `var(--oled-text)` (not gold).
3. Global `.btn.primary` (the Track Dawn gradient brick around the copper gold fill): replace with OLED quiet style matching `.btn.oled-cta`:

```css
.btn.primary, button.btn.primary, .btn.block.primary{
  border:1px solid rgba(255,255,255,.22);
  background:var(--oled-raised);
  color:var(--oled-text);
  box-shadow:none;
}
```

4. Keep dial-engine sticky overrides as **border/text teal**, not teal fill brick if easy; if existing `.ath-sticky.dial-engine .btn.primary` sets teal fill, change to outline teal on OLED raised.

5. Do **not** wrap Library/Logger yet (Task 2–3). Do not bump cache.

- [ ] **Step 4: Run** `node apps/mobile/prototype/hybrid-app/oled-home.smoke.mjs` and `whoop-home-dials.smoke.mjs` — expect PASS (dials still v180).

- [ ] **Step 5: Commit** `feat(shell): OLED global body, nav, quiet primary CTA`

---

### Task 2: Logger OLED (strength + conditioning)

**Files:**
- Modify: `apps/mobile/prototype/hybrid-app/index.html` (logger CSS; ensure logger roots get OLED classes if needed)
- Modify: `apps/mobile/prototype/hybrid-app/oled-home.smoke.mjs`

**Steps:**

- [ ] **Step 1: Extend smoke (failing)**

```js
must(html.includes('.logger-screen') || html.includes('logger-active'), 'logger surface hooks exist');
must(!/\.logger-screen\s+\.btn\.primary\{[^}]*linear-gradient\(180deg,\s*#e8c49a/i.test(html), 'logger strength primary not gold brick');
must(!/\.logger-screen\.dial-engine\s+\.btn\.primary\{[^}]*linear-gradient\(180deg,\s*#6ed4c4/i.test(html)
  || html.includes('.logger-screen.dial-engine .btn.primary') && html.includes('var(--oled-raised)'),
  'logger engine primary not teal fill brick');
```

Prefer concrete:

```js
must(!html.includes('.logger-screen .btn.primary{background:linear-gradient(180deg,#e8c49a,#c9955f)'), 'no gold logger CTA brick');
must(html.includes('.logger-screen') && (html.includes('var(--oled-bg)') || html.includes('var(--oled-surface)')), 'logger OLED surfaces');
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement**

1. Add CSS after OLED Home block:

```css
/* Room 2 — OLED Logger */
.app.logger-active, .logger-screen, .mph-shell{
  background:var(--oled-bg);
  color:var(--oled-text);
}
.logger-screen .card, .mph-shell .card, .logger-screen .slider-card{
  background:var(--oled-surface);
  border-color:rgba(255,255,255,.08);
  box-shadow:none;
}
.logger-screen .btn.primary,
.logger-screen .btn.primary.block{
  border:1px solid rgba(255,255,255,.22);
  background:var(--oled-raised);
  color:var(--oled-text);
  box-shadow:none;
}
.logger-screen.dial-strength .engine-badge,
.dial-strength .engine-badge{
  /* keep thin copper identity */
  border-color:rgba(212,165,116,.45);
  background:transparent;
}
.logger-screen.dial-engine .btn.primary,
.dial-engine.logger-screen .btn.primary,
.ath-sticky.dial-engine .btn.primary{
  border:1px solid rgba(94,196,180,.45);
  background:var(--oled-raised);
  color:var(--zone);
  box-shadow:none;
}
```

2. Override/remove existing gold/teal gradient logger primary rules (the ones at `.logger-screen .btn.primary{background:linear-gradient…}`).

3. Ensure `train()` / cond log roots include `logger-screen` class if not already (they likely do via mph-shell / dial-* wrappers). If logger root lacks a hook, add `logger-screen` to the outermost logger HTML string in `train()` and `renderSimpleCondLog()`.

4. Rest timer chrome: quiet border `rgba(255,255,255,.2)` unless dial-strength thin copper is already intentional — prefer quiet OLED.

- [ ] **Step 4: Smokes PASS** (Home + dials still v180)

- [ ] **Step 5: Commit** `feat(logger): OLED logger surfaces and quiet CTAs`

---

### Task 3: Library + Calendar + Settings OLED scopes

**Files:**
- Modify: `apps/mobile/prototype/hybrid-app/index.html` (`programs`/`library`, `calendar`, `settings`, progress stub wrappers + CSS)
- Modify: `apps/mobile/prototype/hybrid-app/oled-home.smoke.mjs`

**Exact symbols (verify in tree before edit):**
- `calendar()` → `shell('Calendar',…)` — wrap body in `stack shell-screen shell-screen--oled` if not already
- `programs()` / `library()` — same
- `settings()` — wrap settings-group in OLED shell class
- Progress stub already uses `stack shell-screen` — add `--oled`

**Steps:**

- [ ] **Step 1: Extend smoke**

```js
must((html.match(/shell-screen--oled/g) || []).length >= 2, 'OLED shell used beyond Home alone');
must(html.includes('function calendar(') && html.includes('shell-screen--oled'), 'calendar path can use OLED shell');
must(!/\.home-brief\{[^}]*rgba\(212,165,116/.test(html) || html.includes('.shell-screen--oled .home-brief'), 'home-brief copper overridden under OLED');
// Calendar copper day wash should be neutralized under OLED scope:
must(html.includes('.shell-screen--oled .ath-cal-day') || html.includes('.shell-screen--oled .day'), 'calendar days OLED-scoped');
must(html.includes('.shell-screen--oled .library-tab') || html.includes('.shell-screen--oled .ath-tab') || html.includes('settings-group') && html.includes('shell-screen--oled'), 'library/settings OLED hooks');
```

Use durable asserts after reading actual class names in file.

- [ ] **Step 2: FAIL then implement**

1. Wrap `calendar()`, `programs()`/`library()`, `settings()`, and progress stub content roots with `shell-screen shell-screen--oled` (same pattern as Home).
2. Add CSS:

```css
/* Room 3–4 — Library / Calendar / Settings under OLED shell */
.shell-screen--oled .streamhero,
.shell-screen--oled .card,
.shell-screen--oled .session-card,
.shell-screen--oled .ath-cal-day,
.shell-screen--oled .day{
  background:var(--oled-surface);
  border-color:rgba(255,255,255,.08);
  box-shadow:none;
}
.shell-screen--oled .ath-cal-day.active,
.shell-screen--oled .day.active{
  border-color:rgba(255,255,255,.35);
  background:var(--oled-raised);
  color:var(--oled-text);
  box-shadow:none;
}
.shell-screen--oled .library-tab.active,
.shell-screen--oled .ath-tab.active{
  background:var(--oled-raised);
  color:var(--oled-text);
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.2);
}
.shell-screen--oled .streamhero.dial-strength{border-left:3px solid var(--copper);background:var(--oled-surface)}
.shell-screen--oled .streamhero.dial-engine{border-left:3px solid var(--zone);background:var(--oled-surface)}
.shell-screen--oled .settings-group .card,
.shell-screen--oled .settings-group .card{
  background:var(--oled-surface);
  border-color:rgba(255,255,255,.08);
}
```

3. Neutralize calendar copper `has-sessions` / active gold washes under OLED scope (override rgba(212,165,116) rules).

- [ ] **Step 4: Smokes PASS**

- [ ] **Step 5: Commit** `feat(shell): OLED Library, Calendar, Settings`

---

### Task 4: Cache v181, sync twins, update all smoke pins, visual proof hooks

**Files:**
- `index.html` LOCAL_BUILD → `the-hybrid-athlete-blank-v181`
- `service-worker.js` CACHE → same
- All prototype `*.smoke.mjs` still pinning v180 → v181
- `oled-home.smoke.mjs` assert v181
- `whoop-home-dials.smoke.mjs` assert v181
- Run `bash apps/mobile/sync-hybrid-html.sh`

**Steps:**

- [ ] **Step 1:** Add v181 assert to oled smoke; update dials smoke; run FAIL
- [ ] **Step 2:** Bump LOCAL_BUILD + CACHE; update all smoke pins; sync
- [ ] **Step 3:** Run oled + dials smokes PASS; spot-check twin for v181 + `--oled-bg`
- [ ] **Step 4:** Commit `chore(shell): bump blank-v181 and sync OLED shell twins`

---

## Spec coverage

| Spec item | Task |
| --- | --- |
| Body black / no copper wash | 1 |
| Nav OLED | 1 |
| Quiet global primary | 1 |
| Logger OLED + quiet CTAs | 2 |
| Library / Calendar OLED | 3 |
| Settings OLED | 3 |
| Cache v181 + sync | 4 |
| Dial colors preserved | all (no dial edits) |

## Out of scope

- Capgo OTA
- handoff / RELEASE_NOTES until after OTA
- Coach portal
