# TrainHeroic Live Paint Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (tasks share CSS/JS; do not split across isolated subagents). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the live athlete app look like TrainHeroic: black board, gray letter tiles, orange rx only, white Start Session, white rest ring.

**Architecture:** Keep overlay `apps/athlete/th.css` as the last stylesheet. Fix source tokens in `home.css` so mint/blue no longer leak. Replace hardcoded WHOOP lime/blue in logger chrome and rest SVG. Leave WHOOP dial colours in `app.js`.

**Tech Stack:** Capacitor athlete SPA, vanilla CSS/JS, `pnpm run check:athlete-app` smoke + node tests.

## Global Constraints

- Never Morph wordmark in athlete UI
- Track Dawn mint/red/blue identity is rejected
- BLUE≠Easy as physiology; WHOOP blue stays on Strain dial only
- Hybrid words; Engine-only athlete
- Coach Strength left as-is
- Do not merge PRs
- Touch targets ≥44px; `prefers-reduced-motion` already in `th.css`

---

### Task 1: Visual contract smokes (RED)

**Files:**
- Modify: `apps/athlete/checks/athlete-app.smoke.mjs`

**Interfaces:**
- Consumes: existing `must()` helper
- Produces: failing asserts until Task 2–4 land

- [ ] **Step 1: Write the failing test**

Add to `athlete-app.smoke.mjs` after the existing `--cta` asserts:

```js
must(!css.includes('--engine: #5ec4b7'), 'home.css engine token is not Track Dawn mint');
must(css.includes('--engine: #8e8e93'), 'home.css engine token is mute gray');
must(!css.includes('--trn-blue: #1ba3ff'), 'training chrome is not WHOOP strain blue');
must(readFileSync(join(root, 'logger.js'), 'utf8').includes('stroke="#ffffff"') && !readFileSync(join(root, 'logger.js'), 'utf8').includes('stroke="#16ec06"'), 'rest ring is white not WHOOP lime');
must(!readFileSync(join(root, 'logger.css'), 'utf8').includes('#1ba3ff'), 'logger.css has no WHOOP-blue chrome');
must(!readFileSync(join(root, 'logger.css'), 'utf8').includes('var(--engine, #5ec4b7)'), 'engine clock does not fall back to mint');
must(readFileSync(join(root, 'service-worker.js'), 'utf8').includes("CACHE = 'the-engine-v21'"), 'SW cache bump v21');
must(css.includes('.trn-icon-btn') && /min-width:\s*44px/.test(css) || readFileSync(join(root, 'th.css'), 'utf8').includes('.trn-icon-btn'), 'training icon buttons meet 44px');
```

Keep existing WHOOP dial asserts (`whoopRecoveryColor`, strain `#1ba3ff` in `app.js`).

- [ ] **Step 2: Run test to verify it fails**

Run: `node apps/athlete/checks/athlete-app.smoke.mjs`

Expected: FAIL with mint token / lime ring / v20 cache.

- [ ] **Step 3: Minimal implementation lives in Tasks 2–4**

- [ ] **Step 4: After Tasks 2–4, re-run smoke — PASS**

- [ ] **Step 5: Commit with those files**

```bash
git add apps/athlete/checks/athlete-app.smoke.mjs
git commit -m "test: lock TrainHeroic tokens against mint and WHOOP chrome"
```

Commit after tests exist even if still red only if the repo allows; otherwise keep tests in the same commit as the paint if the suite is a gate. Prefer one paint commit after green.

---

### Task 2: Source tokens in home.css

**Files:**
- Modify: `apps/athlete/home.css` `:root`, `.trn-letter--engine`, `.trn-block--engine`, `.trn-icon-btn`, `.trn-empty` (broken selector after `.trn-session-name`)

**Interfaces:**
- Consumes: MASTER.md tokens
- Produces: `--engine: #8e8e93`, `--trn-blue: #8e8e93`, `--font-body: Barlow`

Keep `--recovery-high`, `--strain`, `--sleep` for dials.

Letter tiles: 44×44, radius 8, background `#3a3a3c`, color `#fff`.

Fix the orphaned empty-state rules into `.trn-empty`.

---

### Task 3: Logger + rest ring

**Files:**
- Modify: `apps/athlete/logger.js` `ringSvg`, `pickerIcon`, `icoSwitch`
- Modify: `apps/athlete/logger.css` every `#1ba3ff` and mint fallbacks; rest start circles white not `#16ec06`; keep `.log-check.on` / `.log-complete.is-done` as `--done` / `#34c759`

Ring progress stroke `#ffffff`. Picker accent white. Switch icon white.

`.eng-clock` color `#ffffff`. `.eng-eyebrow` `--oled-muted`.

---

### Task 4: Overlay, library CTA, SW

**Files:**
- Modify: `apps/athlete/th.css` — cover `.lib-primary`, `.tm-*`, `.trn-add-icon`, `.fab-layer--training .fab`, focus, 44px icons
- Modify: `apps/athlete/library.css` `.lib-primary` to `--cta` / `--cta-ink`
- Modify: `apps/athlete/service-worker.js` CACHE `the-engine-v21`
- Modify: `apps/athlete/checks/athlete-app.smoke.mjs` v21 string
- Modify: `apps/athlete/index.html` already links `th.css`

---

### Task 5: Verify

Run: `pnpm run check:athlete-app`

Expected: 47 unit tests + smokes ok.

Screenshot training list + logger rest against 375px.
