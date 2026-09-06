# Instrument · Atelier · Chassis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the approved three-room athlete UX (OLED Instrument Home, Atelier with Recovery + Publish day picker, builder=logger 1:1, Chassis honesty + sync contract) on top of audit #177.

**Architecture:** Soft room boundaries inside the existing Hybrid HTML app. OLED visual system retained. `@hybrid/adaptive` stays pure; HTML opens doors. Chassis Phase H ships; Phase M is a written contract; Phase S is out of this plan’s build tasks.

**Tech Stack:** Hybrid HTML (`index.html` + twins), `whoop.js`, Vitest/`packages/adaptive`, Node smokes in `apps/mobile/prototype/hybrid-app/`, `pnpm run verify`.

**Spec:** `docs/superpowers/specs/2026-09-05-instrument-atelier-chassis-design.md`

## Global Constraints

- Base: `main` after audit PR #177; work on `cursor/audit-critical-fixes-0ae6` (or a fast-forward of it).
- Edit athlete UI only via `apps/mobile/prototype/hybrid-app/index.html` then `bash apps/mobile/sync-hybrid-html.sh`.
- `LOCAL_BUILD` and SW `CACHE` always bump together.
- Capgo only when the human explicitly asks.
- Builder is source of truth for logger layout (1:1).
- Every task ends with listed verify commands actually run; paste/log evidence under `/opt/cursor/artifacts/` when UI changes.

---

## File map

| File | Responsibility |
| --- | --- |
| `apps/mobile/prototype/hybrid-app/index.html` | Home, Library tabs, builders, logger parity, Publish sheet |
| `apps/mobile/prototype/hybrid-app/whoop.js` | Honest sync card (already mostly done; guard regressions) |
| `apps/mobile/prototype/hybrid-app/service-worker.js` | Cache pin |
| Twins via sync script | `THE-Hybrid-App.html`, `preview-site/**` |
| `apps/mobile/prototype/hybrid-app/*instrument*.smoke.mjs` (new) | Home / Library / Publish / parity gates |
| `package.json` | Wire new smokes into `verify` |
| `docs/superpowers/specs/2026-09-05-session-template-sync-contract.md` | Chassis Phase M |
| `handoff.md` | Cache / branch truth after ships |

---

### Task 1: Branch hygiene + baseline verify

**Files:** none (git only)

- [ ] **Step 1: Sync branch to post-audit main**

```bash
git fetch origin main
git checkout cursor/audit-critical-fixes-0ae6
git merge origin/main
```

Expected: fast-forward or already includes `Merge pull request #177`.

- [ ] **Step 2: Baseline verify**

Run: `pnpm run verify`  
Expected: PASS (same green as CI on #177).

- [ ] **Step 3: Save baseline log**

```bash
pnpm run verify 2>&1 | tee /opt/cursor/artifacts/instrument-baseline-verify.log | tail -40
```

- [ ] **Step 4: Commit only if merge created a commit; else note clean**

```bash
git status -sb
# if merge commit pending: git push -u origin cursor/audit-critical-fixes-0ae6
```

---

### Task 2: Failing smokes for Home + Library Recovery + Publish

**Files:**
- Create: `apps/mobile/prototype/hybrid-app/instrument-home.smoke.mjs`
- Create: `apps/mobile/prototype/hybrid-app/atelier-library.smoke.mjs`
- Create: `apps/mobile/prototype/hybrid-app/atelier-publish.smoke.mjs`
- Modify: `package.json` (add `check:instrument-home`, `check:atelier-library`, `check:atelier-publish`; append to `verify`)

- [ ] **Step 1: Write Home smoke (will fail until Task 3)**

```js
// apps/mobile/prototype/hybrid-app/instrument-home.smoke.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const html = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'index.html'), 'utf8');
function must(c, m) { if (!c) throw new Error(m); }
must(!/readiness check-?in/i.test(html) || !html.includes('openAthleteSleepOverview') /* refine: assert check-in entry removed from Home render */ , 'Home still exposes readiness check-in — tighten assertion to athModulesHtml/home()');
must(html.includes('athWhoopDial') || html.includes('WHOOP'), 'WHOOP dials missing');
must(html.includes('confirmStartSession') || html.includes('openStartConfirm'), 'Start confirm missing');
must(html.includes('homeTodayPeekHtml') || html.includes('todayPeek'), 'Today peek helper missing');
must(html.includes('HR') || html.includes('zone'), 'Cond peek must be HR zones');
console.log('instrument-home.smoke: ok');
```

Tighten assertions in Step 1 to the **exact** helper names from Task 3 (`homeTodayPeekHtml`, `confirmStartSession`, zone helpers) — write those names into the smoke first (TDD).

- [ ] **Step 2: Write Library smoke**

Assert Library tabs include `Recovery` and do **not** use Progress as a primary tab label in `libraryTabsHtml` (or equivalent).

- [ ] **Step 3: Write Publish smoke**

Assert builder actions include Save, Save as template, Publish, and a day-picker function/sheet (`openPublishDaySheet` or equivalent name locked in the smoke).

- [ ] **Step 4: Wire into package.json verify list**

- [ ] **Step 5: Run smokes — expect FAIL**

```bash
node apps/mobile/prototype/hybrid-app/instrument-home.smoke.mjs
node apps/mobile/prototype/hybrid-app/atelier-library.smoke.mjs
node apps/mobile/prototype/hybrid-app/atelier-publish.smoke.mjs
```

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/prototype/hybrid-app/*.smoke.mjs package.json
git commit -m "test: add instrument/atelier smokes (red)"
```

---

### Task 3: Instrument Home — dials + today peek (Start + confirm)

**Files:**
- Modify: `apps/mobile/prototype/hybrid-app/index.html` (`home()`, `athModulesHtml` / related)
- Modify: SW + `LOCAL_BUILD` bump together

- [ ] **Step 1: Implement today peek + strip readiness check-in from Home**

Home shows WHOOP dials + today peek only:
- Strength today → label + **Start**
- Cond today → **that day’s HR zones only** + **Start**
- **Start** → yes/no confirm sheet before `startSession` (no accidental start)

- [ ] **Step 2: Sync twins + bump cache**

```bash
bash apps/mobile/sync-hybrid-html.sh
# bump LOCAL_BUILD + CACHE to next blank-vNNN together
```

- [ ] **Step 3: Verify**

```bash
node apps/mobile/prototype/hybrid-app/instrument-home.smoke.mjs
pnpm run check:hybrid-html-sync
pnpm run verify 2>&1 | tee /opt/cursor/artifacts/instrument-home-verify.log | tail -50
```

Expected: Home smoke PASS; full verify PASS.

- [ ] **Step 4: Manual artifact**

Screenshot Home → `/opt/cursor/artifacts/instrument-home-overview.webp`

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/prototype/hybrid-app/index.html apps/mobile/prototype/hybrid-app/service-worker.js apps/mobile/THE-Hybrid-App.html apps/mobile/preview-site apps/mobile/service-worker.js
git commit -m "feat(instrument): Home dials + today peek with Start confirm"
```

---

### Task 4: Atelier Library — Recovery tab (OLED)

**Files:**
- Modify: `index.html` Library tablist / panels
- Smokes from Task 2

- [ ] **Step 1: Replace Progress tab with Recovery**

Strength | Engine | Recovery. Recovery content = recovery templates / movement (existing recovery starter paths), OLED native rows.

- [ ] **Step 2: Sync + verify**

```bash
bash apps/mobile/sync-hybrid-html.sh
node apps/mobile/prototype/hybrid-app/atelier-library.smoke.mjs
pnpm run verify 2>&1 | tee /opt/cursor/artifacts/atelier-library-verify.log | tail -50
```

- [ ] **Step 3: Screenshot Library Recovery → `/opt/cursor/artifacts/atelier-library-recovery.webp`

- [ ] **Step 4: Commit**

```bash
git commit -am "feat(atelier): Library Recovery tab replaces Progress"
```

---

### Task 5: Builder ↔ logger 1:1 parity

**Files:**
- Modify: `index.html` logger render (`strengthTask` / column renderer) and builder column UI
- Create: `apps/mobile/prototype/hybrid-app/builder-logger-parity.smoke.mjs`
- Wire into `verify`

- [ ] **Step 1: Write parity smoke**

Smoke reads HTML and asserts shared markers: same column kind enum / shared renderer name / identical mini-labels list used by both builder and logger (lock concrete strings after reading current builder).

- [ ] **Step 2: Run smoke — FAIL if logger still diverges**

- [ ] **Step 3: Refactor so logger uses the same column/set row builder path (or shared HTML function)**

Builder wins. No parallel logger-only layout.

- [ ] **Step 4: Heavy verify**

```bash
node apps/mobile/prototype/hybrid-app/builder-logger-parity.smoke.mjs
pnpm run check:adaptive-logger
pnpm run check:adaptive-routes
pnpm run verify 2>&1 | tee /opt/cursor/artifacts/builder-logger-parity-verify.log | tail -60
```

- [ ] **Step 5: Manual** — build a 3-set lift, start session, confirm logger columns match; screenshot both → artifacts

- [ ] **Step 6: Commit**

```bash
git commit -am "feat(instrument): logger matches builder 1:1"
```

---

### Task 6: Publish → day picker sheet

**Files:**
- Modify: `index.html` builder sticky actions + new sheet helpers
- Smoke: `atelier-publish.smoke.mjs`

- [ ] **Step 1: Implement `openPublishDaySheet` + wire Publish button**

Actions: Save · Save as template · Publish. Publish opens day picker; confirming schedules/publishes to that date.

- [ ] **Step 2: Verify**

```bash
node apps/mobile/prototype/hybrid-app/atelier-publish.smoke.mjs
pnpm run verify 2>&1 | tee /opt/cursor/artifacts/atelier-publish-verify.log | tail -50
```

- [ ] **Step 3: Manual screenshot of day picker → `/opt/cursor/artifacts/atelier-publish-day-picker.webp`

- [ ] **Step 4: Commit**

```bash
git commit -am "feat(atelier): Publish opens day picker"
```

---

### Task 7: Chassis Phase M — sync contract doc

**Files:**
- Create: `docs/superpowers/specs/2026-09-05-session-template-sync-contract.md`

- [ ] **Step 1: Write contract**

Cover: entities (`sessions`, `templates`), offline-first, conflict rule (pick one: LWW with device clock vs explicit revision), WHOOP/Concept2 remain integration sync only, athlete Netlify proxy ownership, out of scope for Phase S handoff checklist.

- [ ] **Step 2: Link from design spec + handoff**

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-09-05-session-template-sync-contract.md docs/superpowers/specs/2026-09-05-instrument-atelier-chassis-design.md handoff.md
git commit -m "docs(chassis): session/template sync contract (Phase M)"
```

---

### Task 8: Chassis Phase H regression guards + final verify gate

**Files:**
- Possibly `whoop.js` / Settings copy (guard only)
- Create: `apps/mobile/prototype/hybrid-app/chassis-honest-sync.smoke.mjs`
- Wire into `verify`

- [ ] **Step 1: Smoke asserts honest strings**

Must include on-device sessions/templates language; must include Sync WHOOP & Concept2; must **not** claim calendar templates sync.

- [ ] **Step 2: Full verify + adaptive suite**

```bash
pnpm --filter @hybrid/adaptive test 2>&1 | tee /opt/cursor/artifacts/adaptive-final.log
pnpm run check:adaptive-bundle
pnpm run check:adaptive-logger
pnpm run check:adaptive-routes
pnpm run check:whoop-ownership
pnpm run verify 2>&1 | tee /opt/cursor/artifacts/instrument-final-verify.log
```

Expected: all PASS.

- [ ] **Step 3: Manual dogfood checklist from spec §5** — tick all 9; save notes to `/opt/cursor/artifacts/instrument-dogfood.md`

- [ ] **Step 4: Commit + push + update PR**

```bash
git commit -am "test(chassis): honest sync smoke + final gates"
git push -u origin cursor/audit-critical-fixes-0ae6
```

---

## Spec coverage check

| Spec requirement | Task |
| --- | --- |
| Home dials + today peek (cond = HR zones; Start confirm); drop check-in | 3 |
| OLED retained | 3–6 (no brass revive) |
| Library Recovery tab | 4 |
| Builder = logger 1:1 | 5 |
| Save / Save as template / Publish + day picker | 6 |
| Chassis H honesty | 8 (+ audit already) |
| Chassis M contract | 7 |
| Heavy verify | 1–2, 3–8 each end with verify |
| Base audit branch | 1 |

## Placeholder scan

None intentional. Smoke helper names in Task 2 must be finalized to match Task 3 implementations when coding (write smoke names first, then implement those symbols).
