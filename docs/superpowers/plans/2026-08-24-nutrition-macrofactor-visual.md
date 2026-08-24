# Nutrition Visual Pass 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the Nutrition module (Home card, day screen, add/confirm sheets) to MacroFactor-like density while keeping Track Dawn colours — no behaviour changes.

**Architecture:** CSS tokens + markup-string tweaks in the existing Hybrid HTML app. Edit `apps/mobile/prototype/hybrid-app/` only, then `bash apps/mobile/sync-hybrid-html.sh`. Bump service-worker / `LOCAL_BUILD` cache so clients load the new CSS. Do not change `nutrition-core` maths, sync, or barcode handlers beyond class names in HTML strings.

**Tech Stack:** Vanilla HTML/CSS/JS in `nutrition-ui.js` + `index.html` Track Dawn tokens; Vitest/smoke via `pnpm run verify`; dogfood APK via existing CI on `apps/mobile/**` paths.

**Spec:** `docs/superpowers/specs/2026-08-24-nutrition-macrofactor-visual-design.md`

## Global Constraints

- Track Dawn palette only (`--copper`, `--copper2`, `--zone`, graphite) — no purple/glow/AI-slop
- No intentional behaviour diffs: same `NutritionUI.*` handlers, same log/scan/sync
- Pass 2 interaction redesign is out of scope
- After every markup/CSS change: `bash apps/mobile/sync-hybrid-html.sh`
- Cache bump to `the-hybrid-athlete-engine-v50` in the final ship task

## File map

| File | Responsibility |
| --- | --- |
| `apps/mobile/prototype/hybrid-app/index.html` | Nutrition CSS (`.nut-*`, Home card nutrition tweaks); `LOCAL_BUILD` |
| `apps/mobile/prototype/hybrid-app/nutrition-ui.js` | Day screen markup (`renderNutrition`), Home card (`homeModuleHtml`), sheet string classes |
| `apps/mobile/prototype/hybrid-app/nutrition-ui.smoke.mjs` | Smoke: assert new class hooks / summary structure exist |
| `apps/mobile/prototype/hybrid-app/service-worker.js` | `CACHE` string bump |
| Synced copies via `sync-hybrid-html.sh` | `preview-site/`, `nutrition-ui.js` root copies, `THE-Hybrid-App.html` |

---

### Task 1: Day screen summary + meal density (CSS + markup)

**Files:**
- Modify: `apps/mobile/prototype/hybrid-app/index.html` (Nutrition CSS block ~637–656)
- Modify: `apps/mobile/prototype/hybrid-app/nutrition-ui.js` (`renderNutrition` ~144–211)
- Modify: `apps/mobile/prototype/hybrid-app/nutrition-ui.smoke.mjs`

**Interfaces:**
- Consumes: existing `totals`, `target`, `mealBlocks` from `renderNutrition`
- Produces: markup using classes `nut-day-summary`, `nut-kcal-hero`, `nut-meal`, `nut-entry` (entry already exists)

- [ ] **Step 1: Extend smoke to require new day summary hooks**

In `nutrition-ui.smoke.mjs`, after existing checks, add:

```js
const ui = readFileSync(join(dir, 'nutrition-ui.js'), 'utf8');
if (!ui.includes('nut-day-summary')) throw new Error('day summary class missing');
if (!ui.includes('nut-kcal-hero')) throw new Error('kcal hero class missing');
```

- [ ] **Step 2: Run smoke — expect FAIL**

Run: `node apps/mobile/prototype/hybrid-app/nutrition-ui.smoke.mjs`  
Expected: FAIL with `day summary class missing`

- [ ] **Step 3: Update `renderNutrition` markup**

Replace the meters + meal structure so the shell body uses:

1. Date row (keep shift buttons)
2. A `nut-day-summary` block:
   - `nut-kcal-hero`: show **kcal left** when target exists (`max(0, target.calories - totals.calories)`), else eaten kcal
   - Subline: `eaten / target` when target exists
   - Keep four meters (Calories + P/C/F) inside `nut-meters` under the hero (reuse existing `.nut-meter` / `.nut-bar`)
3. Action row unchanged (`Add food`, `Scan label`, `Targets`, `Weight`)
4. Meal cards: add class `nut-meal` on each meal card; keep `nut-entry` rows; tighten via CSS not JS logic

Do not rename `NutritionUI.addFood` / `shift` / etc.

- [ ] **Step 4: Add CSS for summary density**

In `index.html` Nutrition CSS section, add (Track Dawn tokens only):

```css
.nut-day-summary{
  margin:8px 0 14px;
  padding:14px 14px 12px;
  border:1px solid var(--line);
  border-radius:16px;
  background:rgba(255,255,255,.03);
}
.nut-kcal-hero{
  font-family:var(--display,inherit);
  font-size:clamp(28px,7vw,36px);
  font-weight:700;
  letter-spacing:-.02em;
  color:var(--copper2);
  font-variant-numeric:tabular-nums;
  line-height:1.05;
}
.nut-kcal-hero small{
  display:block;
  margin-top:4px;
  font-size:12px;
  font-weight:600;
  letter-spacing:.04em;
  color:var(--muted);
}
.nut-meal{
  margin-top:8px !important;
  padding:10px 12px !important;
}
.nut-entry{padding:8px 0}
.nut-meters{gap:8px;margin:10px 0 0}
```

Keep existing `.nut-bar` copper→zone gradient.

- [ ] **Step 5: Sync + smoke PASS**

```bash
bash apps/mobile/sync-hybrid-html.sh
node apps/mobile/prototype/hybrid-app/nutrition-ui.smoke.mjs
```

Expected: PASS (`nutrition-ui.smoke: ok`)

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/prototype/hybrid-app/index.html \
  apps/mobile/prototype/hybrid-app/nutrition-ui.js \
  apps/mobile/prototype/hybrid-app/nutrition-ui.smoke.mjs \
  apps/mobile/nutrition-ui.js apps/mobile/preview-site/
git commit -m "style(nutrition): MacroFactor-like day summary and denser meals"
```

---

### Task 2: Home Nutrition card density

**Files:**
- Modify: `apps/mobile/prototype/hybrid-app/nutrition-ui.js` (`homeModuleHtml` ~999–1016)
- Modify: `apps/mobile/prototype/hybrid-app/index.html` (Home card CSS near `.ath-module` / nutrition label)
- Modify: `apps/mobile/prototype/hybrid-app/nutrition-ui.smoke.mjs`

**Interfaces:**
- Consumes: `macroTotals`, `targetForDay`, `entriesForDay` (unchanged)
- Produces: Home card markup with `nut-home-summary` / `nut-home-macros` classes; still `onclick="NutritionUI.open()"`

- [ ] **Step 1: Smoke for Home card hooks**

```js
if (!ui.includes('nut-home-summary')) throw new Error('home summary class missing');
```

Run smoke — expect FAIL.

- [ ] **Step 2: Restyle `homeModuleHtml`**

Keep the outer `<button class=ath-module …>`. Inside `.ath-cond`:

- Primary: `nut-home-summary` with kcal line (same numbers as today’s hint: eaten/target + left when target exists)
- Secondary: `nut-home-macros` three rows P/C/F — when `target` exists show `eaten / target g`, else eaten only
- Do not remove `.ath-legend` pattern entirely if CSS depends on it — either keep rows as `.ath-row` inside `nut-home-macros` or dual-class

Example shape:

```js
const kcalLine = target
  ? `${Math.round(totals.calories)} / ${Math.round(target.calories)} kcal · ${left} left`
  : `${Math.round(totals.calories)} kcal logged`;
const pLine = target
  ? `${Math.round(totals.proteinG)} / ${Math.round(target.proteinG)}g`
  : `${Math.round(totals.proteinG)}g`;
// same for carbs/fat
```

- [ ] **Step 3: CSS for Home nutrition card**

```css
.ath-module[aria-label*="Nutrition" i] .nut-home-summary{
  font-size:13px;
  font-weight:650;
  color:var(--text);
  font-variant-numeric:tabular-nums;
}
.ath-module[aria-label*="Nutrition" i] .nut-home-macros{
  margin-top:8px;
  display:flex;
  flex-direction:column;
  gap:4px;
}
```

- [ ] **Step 4: Sync + smoke PASS + commit**

```bash
bash apps/mobile/sync-hybrid-html.sh
node apps/mobile/prototype/hybrid-app/nutrition-ui.smoke.mjs
git add apps/mobile/prototype/hybrid-app/nutrition-ui.js \
  apps/mobile/prototype/hybrid-app/index.html \
  apps/mobile/prototype/hybrid-app/nutrition-ui.smoke.mjs \
  apps/mobile/nutrition-ui.js apps/mobile/preview-site/
git commit -m "style(nutrition): denser Home Nutrition card summary"
```

---

### Task 3: Sheet visual polish (classes only)

**Files:**
- Modify: `apps/mobile/prototype/hybrid-app/index.html` (sheet CSS)
- Modify: `apps/mobile/prototype/hybrid-app/nutrition-ui.js` (sheet template strings: `showBarcodeSheet`, `showSearchSheet`, `showCatalogConfirm`, `quickAdd`, `showLabelConfirm` — add wrapper class only)

**Interfaces:**
- Consumes: existing `sheet()` helper
- Produces: sheet roots tagged `class="nut-sheet"` on the first wrapper or h2 parent; handlers unchanged

- [ ] **Step 1: Add CSS**

```css
.nut-sheet h2{letter-spacing:.04em}
.nut-sheet .lead{margin-top:4px;margin-bottom:10px}
.nut-sheet .btn.primary.block{margin-top:14px}
.nut-sheet #nutCatalogPreview,
.nut-sheet .nut-preview{
  font-variant-numeric:tabular-nums;
  color:var(--copper2);
}
```

(If `sheet()` does not support a root class, wrap confirm body: `<div class="nut-sheet">…</div>` inside the sheet HTML string.)

- [ ] **Step 2: Wrap key sheets**

At minimum wrap `showCatalogConfirm` content in `<div class=nut-sheet>…</div>`. Optionally same for `showBarcodeSheet` / `showSearchSheet` / `quickAdd` / `showLabelConfirm`.

Do not change `onclick` targets or field ids (`nutQty`, `nutUnit`, etc.).

- [ ] **Step 3: Sync + `pnpm run check:nutrition-ui` + commit**

```bash
bash apps/mobile/sync-hybrid-html.sh
pnpm run check:nutrition-ui
git add apps/mobile/prototype/hybrid-app/index.html \
  apps/mobile/prototype/hybrid-app/nutrition-ui.js \
  apps/mobile/nutrition-ui.js apps/mobile/preview-site/
git commit -m "style(nutrition): tighter add/confirm sheet chrome"
```

---

### Task 4: Cache bump, verify, ship

**Files:**
- Modify: `apps/mobile/prototype/hybrid-app/index.html` (`LOCAL_BUILD`)
- Modify: `apps/mobile/prototype/hybrid-app/service-worker.js` (`CACHE`)
- Sync copies

- [ ] **Step 1: Bump cache to v50**

Set both:

```js
const LOCAL_BUILD='the-hybrid-athlete-engine-v50';
```

```js
const CACHE = 'the-hybrid-athlete-engine-v50';
```

- [ ] **Step 2: Sync + full verify**

```bash
bash apps/mobile/sync-hybrid-html.sh
pnpm run verify
```

Expected: all checks green.

- [ ] **Step 3: Commit, push, open/update PR, merge when CI green**

```bash
git add apps/mobile/prototype/hybrid-app/index.html \
  apps/mobile/prototype/hybrid-app/service-worker.js \
  apps/mobile/
git commit -m "chore(nutrition): cache bump v50 for visual pass 1"
git push -u origin HEAD
```

Dogfood APK builds automatically on `apps/mobile/**` push to `main` after merge.

- [ ] **Step 4: Manual evidence**

Capture screenshots or a short recording:

1. Home Nutrition card  
2. Nutrition day with summary hero + one meal  
3. Confirm food sheet  

Save under `/opt/cursor/artifacts/` with descriptive names.

---

## Spec coverage check

| Spec requirement | Task |
| --- | --- |
| Home card kcal + P/C/F denser | Task 2 |
| Day sticky/summary + dense meals | Task 1 |
| Sheets cleaner hierarchy | Task 3 |
| Track Dawn tokens only | Tasks 1–3 CSS |
| No behaviour change | All tasks (handlers/ids preserved) |
| Cache bump + ship | Task 4 |
| Pass 2 out of scope | Explicitly omitted |

## Placeholder scan

None intentional. Steps include concrete class names, commands, and commit messages.
