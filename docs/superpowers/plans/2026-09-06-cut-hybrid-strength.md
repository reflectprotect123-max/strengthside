# Cut Hybrid Strength Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Delete Hybrid Strength (UI, data, lift adaptive) so the athlete app is Engine + Recovery only, with a one-shot nuclear local wipe and starter re-seed.

**Architecture:** Subtractive cut in canonical Hybrid HTML + `@hybrid/adaptive`. One migrate on load wipes sessions/strength state and re-seeds Engine + Recovery starters. No redesign of remaining surfaces; no TrainHeroic copy. Sync HTML twins after HTML edits; rebuild adaptive bundle after package edits.

**Tech Stack:** Hybrid HTML (`apps/mobile/prototype/hybrid-app/`), `@hybrid/adaptive` (`packages/adaptive`), Node smokes, `bash apps/mobile/sync-hybrid-html.sh`, `pnpm` adaptive bundle.

**Spec:** `docs/superpowers/specs/2026-09-06-cut-hybrid-strength-design.md`

## Global Constraints

- Subtract only — do not redesign Engine/Recovery/Home/Calendar/Settings UX.
- Silent cut — no TrainHeroic mention, links, or CTAs.
- Nuclear wipe of **all** sessions on upgrade (not strength-only strip).
- Re-seed **Engine + Recovery** starters only after wipe.
- Delete lift adaptive APIs; keep cond Open/Next/Close.
- Capgo OTA is **out of scope** unless a later explicit ask.
- Canonical edit: `apps/mobile/prototype/hybrid-app/index.html` then sync; never edit only a twin.
- Prefer TDD: failing smoke/test first where the plan says so.

## File map

| Path | Responsibility after cut |
| --- | --- |
| `apps/mobile/prototype/hybrid-app/index.html` | Remove strength UI/logic; add `strengthCutV1` migrate; default Library → conditioning |
| `apps/mobile/prototype/hybrid-app/service-worker.js` | Drop strength-only precache entries if assets deleted; bump CACHE with LOCAL_BUILD when shipping bump tasked |
| `packages/adaptive/src/*lift*` + `range.ts` `plates.ts` `estimate-one-rm.ts` | Delete |
| `packages/adaptive/src/index.ts` `types.ts` | Cond-only exports |
| `apps/mobile/prototype/hybrid-app/adaptive-bundle.js` | Rebuild via package script |
| `exercise-search*.js` `log-columns.js` `exercise-load-profiles.js` | Delete if unused after strength cut (verify first) |
| Smokes listed per task | Rewrite/delete strength assertions |
| `docs/handoff.md` (or repo `handoff.md`) | Note product = Engine + Recovery only after cut |

---

### Task 1: Failing gate — Strength tab must disappear

**Files:**
- Create: `apps/mobile/prototype/hybrid-app/cut-strength-library.smoke.mjs`
- Modify: `package.json` (wire into `verify` or existing check script if there is a hybrid smoke list)
- Test: same smoke

**Interfaces:**
- Consumes: none
- Produces: smoke that fails until Strength tab/doors are gone and Engine + Recovery remain

- [ ] **Step 1: Write the failing smoke**

Assert canonical `index.html` (and after sync, twins match script policy):

1. No Library tab label `Hybrid Strength` / `libraryStrengthTab` / `setLibraryTab('strength')` active door
2. No `openAthleteStrengthBuilder` / `openAthleteStrengthLibrary`
3. Still has The Engine + Recovery library surfaces (`libraryConditioningTab` or current Engine naming, `libraryRecoveryTab`)
4. Default `libraryActiveTab` is not `'strength'` (expect `'conditioning'`)

- [ ] **Step 2: Run smoke — expect FAIL**

```bash
node apps/mobile/prototype/hybrid-app/cut-strength-library.smoke.mjs
```

- [ ] **Step 3: Commit the failing smoke only**

```bash
git add apps/mobile/prototype/hybrid-app/cut-strength-library.smoke.mjs package.json
git commit -m "test: failing smoke for Hybrid Strength library cut"
```

---

### Task 2: Nuclear migrate + starter re-seed

**Files:**
- Modify: `apps/mobile/prototype/hybrid-app/index.html` (migrate + `ensureStarterTemplates`)
- Test: `apps/mobile/prototype/hybrid-app/cut-strength-migrate.smoke.mjs` (create)

**Interfaces:**
- Consumes: existing `STORAGE` / `S` / `ensureStarterTemplates` / aerobic+recovery starter builders
- Produces: `strengthCutV1` migrate marker behavior; Full Body starters no longer seeded

- [ ] **Step 1: Write failing migrate smoke**

Smoke may string-scan for:

- migrate marker name `strengthCutV1` (or exact name chosen — use `strengthCutV1`)
- wipe of sessions / `strengthState` / Full Body starter ensures removed from `ensureStarterTemplates`
- `ensureStarterTemplates` still seeds Aerobic + Recovery

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement migrate in `ensureLocalReady` (or equivalent boot)**

On load if `S.meta.strengthCutV1` absent:

1. `S.sessions = []`; clear `S.active` / in-progress pointers
2. Clear `S.draft` / in-memory draft
3. Remove strength templates from `S.templates` (or clear templates then re-seed)
4. Clear `S.strengthState`, lift `S.adaptiveClose` if lift-only, strength schedule settings
5. Clear `S.meta.starterFullBodyA/B/CVersion` (and related)
6. Preserve WHOOP tokens, HR zones, pace anchors, `adaptiveCondClose`, Engine settings
7. Call starter ensure for **Aerobic + Recovery only** (stop calling Full Body A/B/C ensures)
8. Set `S.meta.strengthCutV1 = true` (or ISO timestamp); `save`

- [ ] **Step 4: Run migrate smoke — expect PASS**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: nuclear strengthCutV1 migrate; seed Engine+Recovery only"
```

---

### Task 3: Remove Strength library tab + strength doors (make Task 1 pass)

**Files:**
- Modify: `apps/mobile/prototype/hybrid-app/index.html`
- Test: `cut-strength-library.smoke.mjs`

**Interfaces:**
- Consumes: migrate from Task 2
- Produces: Library IA = Engine + Recovery only; default tab conditioning

- [ ] **Step 1: Confirm Task 1 smoke still fails (or fails on remaining doors)**

- [ ] **Step 2: Delete Strength tab UI and `libraryStrengthTab` body**

- [ ] **Step 3: Retarget defaults only** — `libraryActiveTab='conditioning'`; `setLibraryTab` no longer accepts strength

- [ ] **Step 4: Delete `openAthleteStrengthBuilder` / `openAthleteStrengthLibrary` and all onclick/home/calendar CTAs that call them** — do not replace with new marketing CTAs

- [ ] **Step 5: Run `cut-strength-library.smoke.mjs` — PASS**

- [ ] **Step 6: `bash apps/mobile/sync-hybrid-html.sh`**

- [ ] **Step 7: Commit**

```bash
git commit -m "feat: remove Hybrid Strength library tab and doors"
```

---

### Task 4: Delete strength builder + logger paths

**Files:**
- Modify: `apps/mobile/prototype/hybrid-app/index.html`
- Create/modify: `apps/mobile/prototype/hybrid-app/cut-strength-builder-logger.smoke.mjs`
- Possibly delete strength-only helper functions in-file

**Interfaces:**
- Consumes: Library cut from Task 3
- Produces: no `athleteStrengthBuilder` / `strengthTask` / lift HTML wrappers

- [ ] **Step 1: Failing smoke** — HTML must not contain `athleteStrengthBuilder`, `usesAthleteStrengthBuilder`, `strengthTask`, `completeStrength`, `applyOpenLiftToEx`, `fillNextLiftFromLog`, `openLift`, `decideNextLift`, `closeLift` call sites

- [ ] **Step 2: Run — FAIL**

- [ ] **Step 3: Remove strength builder/logger functions and branches in `builder()` / `train()` / `enterSessionScreen`**

Unknown/non-cond drafts: no-op or return to Library Engine tab only as required to avoid a dead screen (spec §4). Prefer delete over new UX.

- [ ] **Step 4: Smoke PASS → sync → commit**

```bash
git commit -m "feat: delete strength builder and logger paths"
```

---

### Task 5: Delete lift modules from `@hybrid/adaptive`

**Files:**
- Delete: `packages/adaptive/src/open-lift.ts`, `decide-next-lift.ts`, `close-lift.ts`, `range.ts`, `plates.ts`, `estimate-one-rm.ts` (+ `*.test.ts`)
- Modify: `packages/adaptive/src/index.ts`, `types.ts`, `index.test.ts`
- Rebuild: `apps/mobile/prototype/hybrid-app/adaptive-bundle.js`
- Modify: smokes `adaptive-bundle.smoke.mjs`, `adaptive-logger.smoke.mjs`, `adaptive-routes.smoke.mjs`, `strength-cond-alignment.smoke.mjs` (cond-only or delete)

**Interfaces:**
- Consumes: HTML no longer calling lift APIs (Task 4)
- Produces: `HybridAdaptive` cond-only exports

- [ ] **Step 1: Run adaptive lift unit tests once to see current baseline; then delete lift tests/modules so package tests fail compile/import if index still exports lift**

- [ ] **Step 2: Trim `index.ts` / types to cond-only; delete lift files**

- [ ] **Step 3: `pnpm --filter @hybrid/adaptive test` (or repo’s adaptive test script) — PASS**

- [ ] **Step 4: Rebuild bundle** (`pnpm run build` / `pnpm run check:adaptive-bundle` / `node scripts/bundle-adaptive.mjs` — use whatever `package.json` defines)

- [ ] **Step 5: Update bundle/logger/routes/alignment smokes — no `decideNextLift`; still assert cond doors**

- [ ] **Step 6: Sync HTML if bundle path synced; commit**

```bash
git commit -m "feat(adaptive): remove lift Open/Next/Close; cond-only bundle"
```

---

### Task 6: Remove strength-only assets if unused

**Files:**
- Candidate delete: `apps/mobile/prototype/hybrid-app/exercise-search.js`, `exercise-search-index.js`, `log-columns.js`, `exercise-load-profiles.js`
- Modify: `index.html` script tags, `service-worker.js` precache, `sync-hybrid-html.sh` copy list
- Delete/update smokes that only existed for those assets

**Interfaces:**
- Consumes: Task 4 removed strength consumers
- Produces: thinner static asset set

- [ ] **Step 1: Grep** — confirm no remaining references from Engine/Recovery paths

- [ ] **Step 2: If unused, delete assets + script tags + SW + sync list; fix smokes**

- [ ] **Step 3: If still referenced, leave them and note in commit message — do not break Engine**

- [ ] **Step 4: Sync + commit**

```bash
git commit -m "chore: drop strength-only exercise search/log-columns assets"
```

(or skip-commit note if kept)

---

### Task 7: Quarantine / rewrite remaining strength smokes + verify gate

**Files:**
- Modify/delete: `atelier-library.smoke.mjs`, `close-old-builder-doors.smoke.mjs`, `fullbody-*.smoke.mjs`, `blank-slate-wm.smoke.mjs`, `builder-logger-parity.smoke.mjs`, `athlete-exercise-pick.smoke.mjs`, `library-conditioning.smoke.mjs`, others from audit that still require Strength
- Modify: `package.json` verify scripts
- Modify: `handoff.md` — product = Engine + Recovery; strength cut

**Interfaces:**
- Consumes: Tasks 1–6
- Produces: green verify hotspots for hybrid HTML + adaptive

- [ ] **Step 1: Run full hybrid-related verify subset; collect failures**

- [ ] **Step 2: Fix each failure by deleting obsolete smoke or rewriting to Engine+Recovery**

- [ ] **Step 3: Bump `LOCAL_BUILD` + SW `CACHE` together (e.g. blank-v190 → blank-v191) and update pinning smokes — required so clients drop cached strength shell

- [ ] **Step 4: Sync twins**

- [ ] **Step 5: Commit**

```bash
git commit -m "test: align smokes with strength cut; bump blank cache"
```

---

### Task 8: Final verification + PR

**Files:** none new required

- [ ] **Step 1: Run** `pnpm run verify` (or documented hybrid verify) + adaptive tests + cut-strength smokes

- [ ] **Step 2: Grep gate**

```bash
rg -n "openAthleteStrengthBuilder|athleteStrengthBuilder|decideNextLift|Hybrid Strength|Full Body A" apps/mobile/prototype/hybrid-app/index.html packages/adaptive/src || true
```

Expect no product hits (smokes/docs may mention cut historically).

- [ ] **Step 3: Push branch + update PR body from spec**

- [ ] **Step 4: Capgo — do not ship unless human explicitly asks**

---

## Execution notes for SDD

- Work on branch `cursor/cut-hybrid-strength-0ae6` (create from latest `main` if current branch is spec-only).
- After each task: commit; task-reviewer subagent; continue without asking the human.
- Ruling authority: spec over plan if conflict; record rulings in the SDD ledger.
- Do not force-push; do not Capgo in this plan.
