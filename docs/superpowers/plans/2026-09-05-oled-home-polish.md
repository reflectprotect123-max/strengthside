# OLED Home polish (Room 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the athlete Home first viewport to OLED Whoop-adjacent black + quiet chrome while keeping shipped dial arcs and sleep math.

**Architecture:** Scope OLED tokens and CSS to Home (`ath-session`, WHOOP module, `home-brief`). Edit canonical `apps/mobile/prototype/hybrid-app/index.html`, bump cache, sync twins. Colocated Node smoke asserts tokens + anti-slop. No Logger/Library/Calendar restyle.

**Tech Stack:** Vanilla HTML/CSS/JS; Node smoke (`node …smoke.mjs`); `bash apps/mobile/sync-hybrid-html.sh`.

**Spec:** `docs/superpowers/specs/2026-09-05-oled-home-polish.md`

## Global Constraints

- Brand B OLED palette only on Home: bg `#000000`, surface `#121212`, raised `#1C1C1E`, text `#FFFFFF`, muted `#8E8E93`.
- Dial arcs stay `#9db4c8` / `#16f26b` / `#1ba3ff`; track `#2c2c2e`.
- No copper washes, copper borders, or gold primary CTA brick on Home.
- Do not restyle Logger, Library, Calendar, or Settings in this plan.
- Canonical edit: `apps/mobile/prototype/hybrid-app/index.html` → sync script; `LOCAL_BUILD` and SW `CACHE` must match when bumped.
- Fonts stay Barlow Condensed + Space Grotesk; no Inter; no purple/cream/glow slop.
- Fix debt hint copy if it still mentions “Training load below” with no such module.
- Cache bump target for this room: `the-hybrid-athlete-blank-v180`.

---

## File map

| File | Role |
| --- | --- |
| `apps/mobile/prototype/hybrid-app/index.html` | Tokens, Home CSS, `athModulesHtml`, `homeBriefingHtml`, `LOCAL_BUILD` |
| `apps/mobile/prototype/hybrid-app/service-worker.js` | `CACHE` string |
| `apps/mobile/prototype/hybrid-app/oled-home.smoke.mjs` | New Room 1 smoke (create) |
| `apps/mobile/prototype/hybrid-app/whoop-home-dials.smoke.mjs` | Update `LOCAL_BUILD` expectation to v180 |
| Twins via `apps/mobile/sync-hybrid-html.sh` | `THE-Hybrid-App.html`, preview-site, etc. |

---

### Task 1: OLED tokens + failing smoke

**Files:**
- Create: `apps/mobile/prototype/hybrid-app/oled-home.smoke.mjs`
- Modify: `apps/mobile/prototype/hybrid-app/index.html` (`:root` token block only in this task — add OLED vars; do not restyle Home modules yet beyond what smoke needs to fail/pass on tokens)
- Test: `apps/mobile/prototype/hybrid-app/oled-home.smoke.mjs`

**Interfaces:**
- Consumes: existing `:root` in `index.html`
- Produces: CSS custom properties `--oled-bg`, `--oled-surface`, `--oled-raised`, `--oled-text`, `--oled-muted` with exact hex values from Global Constraints; smoke file that asserts them

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
must(html.includes('--oled-text:#FFFFFF') || html.includes('--oled-text:#fff'), 'OLED text token');
must(html.includes('--oled-muted:#8E8E93'), 'OLED muted token');
must(/#9[Dd][Bb]4[Cc]8/.test(html), 'sleep dial color preserved');
must(/#16[Ff]26[Bb]/.test(html), 'recovery dial color preserved');
must(/#1[Bb][Aa]3[Ff][Ff]/.test(html), 'strain dial color preserved');
must(html.includes("LOCAL_BUILD='the-hybrid-athlete-blank-v180'"), 'LOCAL_BUILD v180');
must(html.includes('ath-home-oled') || html.includes('shell-screen--oled'), 'Home OLED scope class');
must(!/Training load below/.test(html), 'no stale Training load below copy');
must(!/ath-module-whoop[^"]*"[^>]*>[\s\S]*rgba\(212,165,116/.test(html), 'WHOOP module CSS not copper-washed — checked in Task 2 via class hooks');

console.log('oled-home.smoke: ok');
```

Note: The copper-wash regex above is weak for Task 1 — **replace the last `must` in the committed smoke with assertions Task 1 can satisfy**, and add the Home-scope + CTA assertions in Task 2. For Task 1 committed smoke, use exactly:

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
Expected: FAIL on missing `--oled-bg:#000000` (or first missing token).

- [ ] **Step 3: Add OLED tokens to `:root`**

In `apps/mobile/prototype/hybrid-app/index.html`, inside the existing `:root{…}` block (near `--bg` / `--panel`), add exactly:

```css
--oled-bg:#000000;--oled-surface:#121212;--oled-raised:#1C1C1E;--oled-text:#FFFFFF;--oled-muted:#8E8E93;
```

Do not change `--bg` / `--copper` globally in this task. Do not restyle `.ath-module` yet.

- [ ] **Step 4: Run smoke — expect PASS**

Run: `node apps/mobile/prototype/hybrid-app/oled-home.smoke.mjs`  
Expected: `oled-home.smoke: tokens ok`

Also run: `node apps/mobile/prototype/hybrid-app/whoop-home-dials.smoke.mjs`  
Expected: still PASS (still on v179 until Task 3).

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/prototype/hybrid-app/oled-home.smoke.mjs apps/mobile/prototype/hybrid-app/index.html
git commit -m "feat(home): add OLED surface tokens and smoke"
```

---

### Task 2: Home shell OLED layout (dials first, quiet brief)

**Files:**
- Modify: `apps/mobile/prototype/hybrid-app/index.html` (Home CSS for `.ath-session` / `.ath-module-whoop` / `.home-brief`; `athModulesHtml`; `homeBriefingHtml`; `home()` wrapper class)
- Modify: `apps/mobile/prototype/hybrid-app/oled-home.smoke.mjs` (extend assertions)
- Test: `apps/mobile/prototype/hybrid-app/oled-home.smoke.mjs`

**Interfaces:**
- Consumes: `--oled-*` tokens from Task 1
- Produces: Home markup with scope class `shell-screen--oled` on the Home stack; WHOOP module without copper chrome; `home-brief` CTA using quiet class `btn oled-cta` (or `btn ghost block` + Home CSS) — not copper `.btn.primary` gold brick; debt hint copy without “Training load below”

- [ ] **Step 1: Extend smoke (failing)**

Append to `oled-home.smoke.mjs` (keep token asserts):

```js
must(html.includes('shell-screen--oled'), 'Home OLED scope class on stack');
must(html.includes('btn oled-cta') || html.includes('class="btn oled-cta'), 'quiet Home CTA class');
must(!/Training load below/.test(html), 'no stale Training load below copy');
// Home WHOOP module must not use copper border token in its dedicated rule block
must(html.includes('.shell-screen--oled') && html.includes('var(--oled-bg)'), 'OLED scope uses oled-bg');
must(html.includes('.ath-module-whoop') && /shell-screen--oled[\s\S]*ath-module-whoop|ath-module-whoop[\s\S]*oled/.test(html.replace(/\n/g,' ')), 'WHOOP restyled under OLED scope');
```

Prefer these concrete asserts (use these verbatim if the regex above is fragile):

```js
must(html.includes('shell-screen--oled'), 'Home OLED scope class');
must(html.includes('oled-cta'), 'quiet Home CTA class');
must(!/Training load below/.test(html), 'no stale Training load below copy');
must(html.includes('.shell-screen--oled{') || html.includes('.shell-screen--oled {') || html.includes('.shell-screen--oled,'), 'OLED Home CSS block');
must(html.includes('var(--oled-bg)'), 'Home uses --oled-bg');
must(html.includes('var(--oled-surface)'), 'Home uses --oled-surface');
must(!html.includes('Delivery ledger — not the same as Training load below'), 'debt hint rewritten');
```

- [ ] **Step 2: Run extended smoke — expect FAIL**

Run: `node apps/mobile/prototype/hybrid-app/oled-home.smoke.mjs`  
Expected: FAIL on missing `shell-screen--oled` (or first new assert).

- [ ] **Step 3: Implement Home OLED shell**

1. In `home()`, change the stack class to include OLED scope:

```js
`<div class="stack shell-screen shell-screen--oled">${athModulesHtml()}${homeBriefingHtml(active,todaySessions,future)}</div>`
```

2. Add CSS after the existing `.ath-whoop-*` rules (still in `index.html`):

```css
/* Room 1 — OLED Home */
.shell-screen--oled{
  background:var(--oled-bg);
  color:var(--oled-text);
  margin-left:-16px;margin-right:-16px;padding:0 16px 8px;
  border-radius:0;
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
  border-radius:16px;
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

Adjust negative margin only if it fights existing `main` padding — goal is full-bleed black in the Home content column, not a broken layout. If negative margins cause horizontal scroll, drop them and set `background:var(--oled-bg)` on `#appScreen` only when Home is active (prefer the stack class approach first).

3. In `homeBriefingHtml`, replace every `btn primary block` with `btn oled-cta block` (three branches: live, today, next/empty).

4. In `athModulesHtml`, rewrite the debt hint from:

`Delivery ledger — not the same as Training load below`

to:

`Recovery debt from delivery ledger`

(or shorter: `From delivery ledger`). Keep recovery-debt row if present.

5. Quiet `.ath-label` WHOOP column if it still forces copper via global rule — OLED overrides above must win (higher specificity `.shell-screen--oled .ath-label`).

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
- Run: `bash apps/mobile/sync-hybrid-html.sh` (updates twins)

**Interfaces:**
- Consumes: Home OLED from Task 2
- Produces: matched `LOCAL_BUILD` / `CACHE` = `the-hybrid-athlete-blank-v180`; synced twins; smokes green

- [ ] **Step 1: Extend oled smoke for v180 + update dials smoke expectation**

In `oled-home.smoke.mjs` add:

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

Set in `index.html`:

```js
const LOCAL_BUILD='the-hybrid-athlete-blank-v180';
```

Set in `service-worker.js`:

```js
const CACHE = 'the-hybrid-athlete-blank-v180';
```

Run:

```bash
bash apps/mobile/sync-hybrid-html.sh
```

Verify twins contain `blank-v180` and OLED tokens (spot-check `apps/mobile/THE-Hybrid-App.html` or preview-site copy).

- [ ] **Step 4: Run smokes — expect PASS**

```bash
node apps/mobile/prototype/hybrid-app/oled-home.smoke.mjs
node apps/mobile/prototype/hybrid-app/whoop-home-dials.smoke.mjs
```

Optional: `pnpm run verify` if environment is ready — not required to block Room 1 if only HTML changed, but preferred.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/prototype/hybrid-app/index.html apps/mobile/prototype/hybrid-app/service-worker.js apps/mobile/prototype/hybrid-app/oled-home.smoke.mjs apps/mobile/prototype/hybrid-app/whoop-home-dials.smoke.mjs apps/mobile/THE-Hybrid-App.html apps/mobile/preview-site apps/mobile/capacitor 2>/dev/null; git status
# stage all files the sync script touched
git add -u apps/mobile
git commit -m "chore(home): bump blank-v180 and sync OLED Home twins"
```

---

## Spec coverage (self-review)

| Spec requirement | Task |
| --- | --- |
| OLED palette tokens | 1 |
| True black Home / no copper wash on WHOOP | 2 |
| Dial arcs unchanged | 1–2 (smoke + no dial edits) |
| Quiet CTA (no gold brick) | 2 |
| Debt hint without Training load below | 2 |
| Smoke + cache bump + sync | 3 |
| Logger/Library/Calendar untouched | Global Constraints + file map |

## Out of scope

- Capgo OTA upload (owner ship ritual after merge)
- handoff / RELEASE_NOTES (docs room after OTA)
- Room 2 Logger / Room 3 Library·Calendar
