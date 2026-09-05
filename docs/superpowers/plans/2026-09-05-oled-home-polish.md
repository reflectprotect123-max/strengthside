# OLED Home polish (Room 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the athlete Home first viewport to OLED Whoop-adjacent black + quiet chrome while keeping shipped dial arcs and sleep math.

**Architecture:** Scope OLED tokens and CSS to Home (`ath-session`, WHOOP module, `home-brief`). Edit canonical `apps/mobile/prototype/hybrid-app/index.html`, bump cache, sync twins. Colocated Node smoke asserts tokens + anti-slop. No Logger/Library/Calendar restyle.

**Tech Stack:** Vanilla HTML/CSS/JS; Node smoke (`node …smoke.mjs`); `bash apps/mobile/sync-hybrid-html.sh`.

**Spec:** `docs/superpowers/specs/2026-09-05-oled-home-polish.md`

## Global Constraints

- Brand B OLED palette only on Home: bg `#000000`, surface `#121212`, raised `#1C1C1E`, text `#FFFFFF`, muted `#8E8E93`.
- Dial arcs stay `#9db4c8` / `#16f26b` / `#1ba3ff` (do not edit `athWhoopDialSvg` colors).
- No copper washes, copper borders, or gold primary CTA brick on Home.
- Do not restyle Logger, Library, Calendar, or Settings in this plan.
- Canonical edit: `apps/mobile/prototype/hybrid-app/index.html` → `bash apps/mobile/sync-hybrid-html.sh`; `LOCAL_BUILD` and SW `CACHE` must match when bumped.
- Fonts stay Space Grotesk + Barlow Condensed; no Inter; no purple/cream/glow slop.
- Rewrite debt hint: replace `Delivery ledger — not the same as Training load below` (no Training load module on Home).
- Cache bump target: `the-hybrid-athlete-blank-v180`.

---

## File map

| File | Role |
| --- | --- |
| `apps/mobile/prototype/hybrid-app/index.html` | Tokens, Home CSS, `athModulesHtml`, `homeBriefingHtml`, `home()`, `LOCAL_BUILD` |
| `apps/mobile/prototype/hybrid-app/service-worker.js` | `CACHE` string |
| `apps/mobile/prototype/hybrid-app/oled-home.smoke.mjs` | New Room 1 smoke (create) |
| `apps/mobile/prototype/hybrid-app/whoop-home-dials.smoke.mjs` | Update `LOCAL_BUILD` expectation to v180 |
| Twins via `apps/mobile/sync-hybrid-html.sh` | `THE-Hybrid-App.html`, preview-site, capacitor www, etc. |

---

### Task 1: OLED tokens + failing smoke

**Files:**
- Create: `apps/mobile/prototype/hybrid-app/oled-home.smoke.mjs`
- Modify: `apps/mobile/prototype/hybrid-app/index.html` (`:root` only — add OLED vars)
- Test: `apps/mobile/prototype/hybrid-app/oled-home.smoke.mjs`

**Interfaces:**
- Consumes: existing `:root` in `index.html` (near `--bg` / `--copper`)
- Produces: `--oled-bg`, `--oled-surface`, `--oled-raised`, `--oled-text`, `--oled-muted` with exact hex values below

- [ ] **Step 1: Write the failing smoke**

Create `apps/mobile/prototype/hybrid-app/oled-home.smoke.mjs`:

```js
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

function must(cond, msg) {
  if (!cond) throw new Error(msg);
}

must(html.includes('--oled-bg:#000000'), 'OLED page black token');
must(html.includes('--oled-surface:#121212'), 'OLED surface token');
must(html.includes('--oled-raised:#1C1C1E'), 'OLED raised surface token');
must(html.includes('--oled-text:#FFFFFF'), 'OLED text token');
must(html.includes('--oled-muted:#8E8E93'), 'OLED muted token');
must(/#9[Dd][Bb]4[Cc]8/.test(html), 'sleep dial color preserved');
must(/#16[Ff]26[Bb]/.test(html), 'recovery dial color preserved');
must(/#1[Bb][Aa]3[Ff][Ff]/.test(html), 'strain dial color preserved');

console.log('oled-home.smoke: tokens ok');
```

- [ ] **Step 2: Run smoke — expect FAIL**

Run: `node apps/mobile/prototype/hybrid-app/oled-home.smoke.mjs`  
Expected: FAIL on missing `--oled-bg:#000000`.

- [ ] **Step 3: Add OLED tokens to `:root`**

In `apps/mobile/prototype/hybrid-app/index.html`, inside the existing `:root{…}` block (after the copper/zone lines is fine), add exactly:

```css
--oled-bg:#000000;--oled-surface:#121212;--oled-raised:#1C1C1E;--oled-text:#FFFFFF;--oled-muted:#8E8E93;
```

Do not change `--bg` / `--copper` globally. Do not restyle Home modules yet.

- [ ] **Step 4: Run smoke — expect PASS**

```bash
node apps/mobile/prototype/hybrid-app/oled-home.smoke.mjs
node apps/mobile/prototype/hybrid-app/whoop-home-dials.smoke.mjs
```

Expected: both PASS (dials smoke still expects v179 until Task 3).

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/prototype/hybrid-app/oled-home.smoke.mjs apps/mobile/prototype/hybrid-app/index.html
git commit -m "feat(home): add OLED surface tokens and smoke"
```

---

### Task 2: Home shell OLED layout (dials first, quiet brief)

**Files:**
- Modify: `apps/mobile/prototype/hybrid-app/index.html` (Home CSS; `home()`; `homeBriefingHtml`; `athModulesHtml` debt copy)
- Modify: `apps/mobile/prototype/hybrid-app/oled-home.smoke.mjs` (extend assertions)
- Test: `apps/mobile/prototype/hybrid-app/oled-home.smoke.mjs`

**Interfaces:**
- Consumes: `--oled-*` from Task 1
- Produces: Home stack class `shell-screen shell-screen--oled`; quiet CTA class `oled-cta` on Home brief buttons; debt hint without Training load wording; CSS block using `var(--oled-bg)` / `var(--oled-surface)`

**Exact symbols in tree today:**
- `home()` renders: `` `<div class="stack shell-screen">${athModulesHtml()}${homeBriefingHtml(active,todaySessions,future)}</div>` ``
- `homeBriefingHtml` uses `class="btn primary block"` in three branches
- Debt hint string (exact): `Delivery ledger — not the same as Training load below`
- Copper Home brief CSS: `.home-brief{…rgba(212,165,116…`
- WHOOP module classes: `.ath-module` / `.ath-module-whoop` with copper border wash on `.ath-module`

- [ ] **Step 1: Extend smoke (failing)**

Replace `oled-home.smoke.mjs` with:

```js
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

function must(cond, msg) {
  if (!cond) throw new Error(msg);
}

must(html.includes('--oled-bg:#000000'), 'OLED page black token');
must(html.includes('--oled-surface:#121212'), 'OLED surface token');
must(html.includes('--oled-raised:#1C1C1E'), 'OLED raised surface token');
must(html.includes('--oled-text:#FFFFFF'), 'OLED text token');
must(html.includes('--oled-muted:#8E8E93'), 'OLED muted token');
must(/#9[Dd][Bb]4[Cc]8/.test(html), 'sleep dial color preserved');
must(/#16[Ff]26[Bb]/.test(html), 'recovery dial color preserved');
must(/#1[Bb][Aa]3[Ff][Ff]/.test(html), 'strain dial color preserved');
must(html.includes('shell-screen--oled'), 'Home OLED scope class');
must(html.includes('oled-cta'), 'quiet Home CTA class');
must(html.includes('var(--oled-bg)'), 'Home uses --oled-bg');
must(html.includes('var(--oled-surface)'), 'Home uses --oled-surface');
must(!/Training load below/.test(html), 'no stale Training load below copy');
must(!/btn primary block/.test(html.match(/function homeBriefingHtml[\s\S]*?\nfunction home\(/)[0]), 'homeBriefingHtml has no gold primary brick');

console.log('oled-home.smoke: ok');
```

- [ ] **Step 2: Run extended smoke — expect FAIL**

Run: `node apps/mobile/prototype/hybrid-app/oled-home.smoke.mjs`  
Expected: FAIL on missing `shell-screen--oled`.

- [ ] **Step 3: Implement Home OLED shell**

1. In `home()`, change stack class to:

```js
`<div class="stack shell-screen shell-screen--oled">${athModulesHtml()}${homeBriefingHtml(active,todaySessions,future)}</div>`
```

2. Add CSS after the existing `.ath-whoop-*` / Home athlete module rules (still in `index.html`):

```css
/* Room 1 — OLED Home */
.shell-screen--oled{
  background:var(--oled-bg);
  color:var(--oled-text);
}
.shell-screen--oled .ath-date{color:var(--oled-text)}
.shell-screen--oled .ath-name{color:var(--oled-muted)}
.shell-screen--oled .ath-workout{color:var(--oled-text)}
.shell-screen--oled .ath-avatar{
  border-color:rgba(255,255,255,.12);
  background:var(--oled-raised);
  color:var(--oled-muted);
}
.shell-screen--oled .ath-module,
.shell-screen--oled .ath-module-whoop{
  border:1px solid rgba(255,255,255,.08);
  background:var(--oled-surface);
  box-shadow:none;
}
.shell-screen--oled .ath-label{color:var(--oled-muted)}
.shell-screen--oled .ath-sleep-hint,
.shell-screen--oled .ath-ll{color:var(--oled-muted)}
.shell-screen--oled .ath-lv{color:var(--oled-text)}
.shell-screen--oled .home-brief{
  border:1px solid rgba(255,255,255,.08);
  background:var(--oled-surface);
  box-shadow:none;
}
.shell-screen--oled .home-brief .eyebrow{color:var(--oled-muted)}
.shell-screen--oled .home-brief .title{color:var(--oled-text)}
.shell-screen--oled .home-brief .meta{color:var(--oled-muted)}
.shell-screen--oled .btn.oled-cta,
.shell-screen--oled .btn.oled-cta.block{
  border:1px solid rgba(255,255,255,.22);
  background:var(--oled-raised);
  color:var(--oled-text);
  box-shadow:none;
}
@media(hover:hover){
  .shell-screen--oled .ath-module:not(.static):hover{
    border-color:rgba(255,255,255,.16);
    transform:none;
    background:var(--oled-raised);
  }
  .shell-screen--oled .btn.oled-cta:hover{
    border-color:rgba(255,255,255,.35);
    background:#2c2c2e;
    transform:none;
  }
}
```

3. In `homeBriefingHtml`, replace every `btn primary block` with `btn oled-cta block` (all three branches: live, today, next/empty).

4. In `athModulesHtml`, change debt hint from:

`Delivery ledger — not the same as Training load below`

to:

`From delivery ledger`

Do **not** change dial colors in `athWhoopDialSvg`.

- [ ] **Step 4: Run smokes — expect PASS**

```bash
node apps/mobile/prototype/hybrid-app/oled-home.smoke.mjs
node apps/mobile/prototype/hybrid-app/whoop-home-dials.smoke.mjs
```

Expected: both ok (dials smoke still on v179 until Task 3).

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/prototype/hybrid-app/index.html apps/mobile/prototype/hybrid-app/oled-home.smoke.mjs
git commit -m "feat(home): OLED Home shell — black stack, quiet CTA"
```

---

### Task 3: Cache bump, sync twins, dials smoke v180

**Files:**
- Modify: `apps/mobile/prototype/hybrid-app/index.html` (`LOCAL_BUILD`)
- Modify: `apps/mobile/prototype/hybrid-app/service-worker.js` (`CACHE`)
- Modify: `apps/mobile/prototype/hybrid-app/whoop-home-dials.smoke.mjs` (expect v180)
- Modify: `apps/mobile/prototype/hybrid-app/oled-home.smoke.mjs` (assert v180)
- Run: `bash apps/mobile/sync-hybrid-html.sh`

**Interfaces:**
- Consumes: Home OLED from Task 2
- Produces: matched `LOCAL_BUILD` / `CACHE` = `the-hybrid-athlete-blank-v180`; synced twins; smokes green

- [ ] **Step 1: Extend oled smoke for v180 + update dials smoke**

In `oled-home.smoke.mjs` add before the final log:

```js
must(html.includes("LOCAL_BUILD='the-hybrid-athlete-blank-v180'"), 'LOCAL_BUILD v180');
```

In `whoop-home-dials.smoke.mjs`, change the LOCAL_BUILD assert from `v179` to `v180`.

- [ ] **Step 2: Run — expect FAIL on v180**

```bash
node apps/mobile/prototype/hybrid-app/oled-home.smoke.mjs
```

Expected: FAIL missing v180.

- [ ] **Step 3: Bump cache + sync**

In `index.html`:

```js
const LOCAL_BUILD='the-hybrid-athlete-blank-v180';
```

In `service-worker.js`:

```js
const CACHE = 'the-hybrid-athlete-blank-v180';
```

Run:

```bash
bash apps/mobile/sync-hybrid-html.sh
```

Spot-check a twin contains `blank-v180` and `--oled-bg:#000000`.

- [ ] **Step 4: Run smokes — expect PASS**

```bash
node apps/mobile/prototype/hybrid-app/oled-home.smoke.mjs
node apps/mobile/prototype/hybrid-app/whoop-home-dials.smoke.mjs
```

- [ ] **Step 5: Commit**

```bash
git add -u apps/mobile
git add apps/mobile/prototype/hybrid-app/oled-home.smoke.mjs
git status
git commit -m "chore(home): bump blank-v180 and sync OLED Home twins"
```

---

## Spec coverage

| Spec requirement | Task |
| --- | --- |
| OLED palette tokens | 1 |
| True black Home / no copper WHOOP chrome | 2 |
| Dial arcs unchanged | 1–2 |
| Quiet CTA (no gold brick) | 2 |
| Debt hint without Training load below | 2 |
| Smoke + cache bump + sync | 3 |
| Logger/Library/Calendar untouched | Global Constraints |

## Out of scope

- Capgo OTA upload (owner ship ritual after merge)
- handoff / RELEASE_NOTES until after OTA
- Room 2 Logger / Room 3 Library·Calendar
