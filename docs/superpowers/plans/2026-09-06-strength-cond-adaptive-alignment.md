# Strength ↔ Cond Adaptive Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make conditioning adaptive match strength (Next baselines on logged actual + RPE), add Settings 2k/bike anchors with WHOOP day Open, lock builder modality XOR (including fan-bike RPM), and ship a thin Cond Analytics tab (work + WHOOP trends).

**Architecture:** Keep `@hybrid/adaptive` pure. Extend `decideNextCond` / `openCond` / types for `actual*` baselines and `rpm` modality. HTML opens doors only: Settings anchors, Open map × WHOOP, logger override fields, Analytics read-only charts. Smokes enforce the guard rail.

**Tech Stack:** TypeScript (`packages/adaptive` + Vitest), Hybrid HTML (`apps/mobile/prototype/hybrid-app/index.html` + `bash apps/mobile/sync-hybrid-html.sh`), Node smokes, `pnpm run verify`.

**Spec:** `docs/superpowers/specs/2026-09-06-strength-cond-adaptive-alignment-design.md`

## Global Constraints

- Edit athlete UI via `apps/mobile/prototype/hybrid-app/index.html` then `bash apps/mobile/sync-hybrid-html.sh`.
- Bump `LOCAL_BUILD` and SW `CACHE` together on every HTML ship (current pin on branch: `the-hybrid-athlete-blank-v184` → next `v185+` as needed).
- Capgo only when the human explicitly asks.
- No LLM writes targets. No fake RPM↔watts conversion. Settings anchors never auto-update from interval logs or Analytics.
- Adaptive stays zero I/O. HTML only opens doors.
- Prefer athlete copy “workshop / Library / Engine”; avoid “dogfood” — say “test the app”.
- Work on `cursor/audit-critical-fixes-0ae6` (or fast-forward of it).

---

## File map

| File | Responsibility |
| --- | --- |
| `packages/adaptive/src/types.ts` | Cond Next/Open types: `actual*`, `rpm` modality |
| `packages/adaptive/src/decide-next-cond.ts` | Baseline on actual + RPE; rpm branch |
| `packages/adaptive/src/decide-next-cond.test.ts` | TDD for actual-baseline + rpm |
| `packages/adaptive/src/open-cond.ts` | Optional WHOOP soften helper inputs (or keep soften in HTML; prefer pure helper here if numeric) |
| `packages/adaptive/src/map-from-2k.ts` (new) | Pure 2k → band target (splitSec / watts) |
| `packages/adaptive/src/map-from-2k.test.ts` (new) | Band map tests |
| `apps/mobile/prototype/hybrid-app/index.html` | Settings anchors, builder XOR, logger actual fields, Open door, Analytics UI |
| `apps/mobile/prototype/hybrid-app/adaptive-bundle.js` | Regenerated from package |
| `apps/mobile/prototype/hybrid-app/*alignment*.smoke.mjs` (new) | Guard-rail smokes |
| `package.json` | Wire new smokes into `verify` |
| Twins via sync script | `THE-Hybrid-App.html`, `preview-site/**`, SW |

---

### Task 1: Cond Next baselines on logged actual (+ rpm modality)

**Files:**
- Modify: `packages/adaptive/src/types.ts`
- Modify: `packages/adaptive/src/decide-next-cond.ts`
- Modify: `packages/adaptive/src/decide-next-cond.test.ts`
- Regenerate: adaptive bundle used by HTML

**Interfaces:**
- Consumes: existing `decideNextCond(input: CondNextInput): CondNextResult`
- Produces: `CondNextInput` gains optional `actualWatts?: number`, `actualSplitSec?: number`, `actualRpm?: number`; `modality: 'watts' | 'split' | 'rpm'`; Next uses `actualX ?? currentX` as baseline before RPE band nudge

- [ ] **Step 1: Write failing tests for actual-baseline**

In `decide-next-cond.test.ts` add:

```ts
it('split Next baselines on actualSplitSec when provided (not plan current)', () => {
  expect(
    decideNextCond({
      dayKind: 'conditioning',
      modality: 'split',
      targetRpe: { min: 7, max: 8 },
      actualRpe: 7, // hold
      currentSplitSec: 120, // plan 2:00
      actualSplitSec: 125, // logged 2:05
    }),
  ).toEqual({ ok: true, splitSec: 125 });
});

it('split too hard nudges from actual, not plan', () => {
  expect(
    decideNextCond({
      dayKind: 'conditioning',
      modality: 'split',
      targetRpe: { min: 7, max: 8 },
      actualRpe: 9,
      currentSplitSec: 120,
      actualSplitSec: 125,
    }),
  ).toEqual({ ok: true, splitSec: 126 }); // +1s from actual
});

it('rpm modality nudges from actualRpm', () => {
  expect(
    decideNextCond({
      dayKind: 'conditioning',
      modality: 'rpm',
      targetRpe: { min: 7, max: 8 },
      actualRpe: 5,
      currentRpm: 60,
      actualRpm: 58,
    }),
  ).toEqual({ ok: true, rpm: 60 }); // define: up band = +~3% round → document exact in impl
});
```

Adjust the rpm expectation to whatever small deterministic rule you implement (mirror watts % or ±1–2 rpm); lock it in the test first.

- [ ] **Step 2: Run tests — expect FAIL**

```bash
pnpm --filter @hybrid/adaptive test -- decide-next-cond
```

- [ ] **Step 3: Implement types + decideNextCond**

Baseline helper:

```ts
function baseline(actual: number | undefined, current: number | undefined): number | undefined {
  if (actual != null && Number.isFinite(actual)) return actual;
  if (current != null && Number.isFinite(current)) return current;
  return undefined;
}
```

For `modality === 'split'`: `nextSplit(baseline(actualSplitSec, currentSplitSec), band)`.  
Same for watts / rpm. Split still never falls back to watts.

- [ ] **Step 4: Tests PASS; rebuild bundle**

```bash
pnpm --filter @hybrid/adaptive test
# use repo’s existing adaptive bundle script (same as verify’s check:adaptive-bundle)
pnpm run check:adaptive-bundle
```

- [ ] **Step 5: Commit**

```bash
git add packages/adaptive apps/mobile/prototype/hybrid-app/adaptive-bundle.js
git commit -m "feat(adaptive): Cond Next baselines on logged actual + rpm modality"
```

---

### Task 2: HTML door — pass actuals into Cond Next

**Files:**
- Modify: `apps/mobile/prototype/hybrid-app/index.html` (`runDecideNextCond`, interval logger fields)
- Create: `apps/mobile/prototype/hybrid-app/cond-next-actual.smoke.mjs`
- Modify: `package.json`
- Sync twins + bump cache `v184` → `v185`

**Interfaces:**
- Consumes: `HybridAdaptive.decideNextCond` with `actualSplitSec` / `actualWatts` / `actualRpm`
- Produces: logger stores per-round `loggedSplitSec` / `loggedWatts` / `loggedRpm` (overrideable); `runDecideNextCond` passes those

- [ ] **Step 1: Failing smoke**

```js
// cond-next-actual.smoke.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const html = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'index.html'), 'utf8');
function must(c, m) { if (!c) throw new Error(m); }
must(html.includes('actualSplitSec') || html.includes('loggedSplitSec'), 'logger actual split missing');
must(html.includes('actualWatts') || html.includes('loggedWatts'), 'logger actual watts missing');
must(/decideNextCond\([\s\S]*actualSplitSec|loggedSplitSec/.test(html) || html.includes('actualSplitSec:'), 'Next door must pass actual split');
console.log('cond-next-actual.smoke: ok');
```

Wire `check:cond-next-actual` into `verify`.

- [ ] **Step 2: Run smoke — FAIL**

```bash
node apps/mobile/prototype/hybrid-app/cond-next-actual.smoke.mjs
```

- [ ] **Step 3: Implement logger override + door**

- On each work round, show editable actual field prefilled from target.
- Persist `loggedSplitSec` / `loggedWatts` / `loggedRpm` on the task/round.
- Change `runDecideNextCond` roughly to:

```js
function runDecideNextCond(t, actualRpe, stopped, cooked) {
  let HA = window.HybridAdaptive;
  if (!HA || !HA.decideNextCond || isRecoveryCondTask(t)) return;
  let modality = condAdaptiveModality(t);
  let next = HA.decideNextCond({
    dayKind: 'conditioning',
    modality,
    targetRpe: condPaintedRpe(t),
    actualRpe: num(actualRpe),
    currentWatts: condCurrentWatts(t),
    currentSplitSec: condCurrentSplit(t),
    currentRpm: condCurrentRpm(t),
    actualWatts: num(t.loggedWatts) || undefined,
    actualSplitSec: num(t.loggedSplitSec) || undefined,
    actualRpm: num(t.loggedRpm) || undefined,
    stopped: !!stopped,
    cooked: !!cooked,
  });
  applyCondNextResult(t, next);
}
```

Ensure `applyCondNextResult` writes `targetRpm` when modality is rpm.

- [ ] **Step 4: Sync + verify**

```bash
bash apps/mobile/sync-hybrid-html.sh
# bump LOCAL_BUILD + CACHE to v185 together; update smokes that pin v184
node apps/mobile/prototype/hybrid-app/cond-next-actual.smoke.mjs
pnpm run check:adaptive-logger
pnpm run check:adaptive-routes
pnpm run verify 2>&1 | tee /opt/cursor/artifacts/cond-next-actual-verify.log | tail -40
```

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(instrument): Cond logger passes actuals into Next"
```

---

### Task 3: Pure 2k → band map (+ WHOOP soften helper)

**Files:**
- Create: `packages/adaptive/src/map-from-2k.ts`
- Create: `packages/adaptive/src/map-from-2k.test.ts`
- Modify: `packages/adaptive/src/index.ts` (export)
- Rebuild adaptive bundle

**Interfaces:**
- Produces:

```ts
export type CondBand = 'easy' | 'steady' | 'tempo' | 'threshold' | 'intervals';
export function splitSecFrom2k(totalSec: number): number; // total/4
export function wattsFromSplitSec(splitSec: number): number; // Concept2-style
export function mapBandFrom2k(totalSec: number, band: CondBand): { splitSec: number; watts: number };
export function softenOpen(
  value: number,
  modality: 'split' | 'watts' | 'rpm',
  recovery: number | null, // WHOOP 0–100
): number;
```

Use spec table midpoints (e.g. threshold = raceSplit + 8.5s). Document constants at top of file.

- [ ] **Step 1: Failing tests** — 2k `7:20` → race split `110s`; threshold split ≈ `118–119`; soften mid recovery slows split / lowers watts
- [ ] **Step 2: Run — FAIL**
- [ ] **Step 3: Implement map + soften**
- [ ] **Step 4: PASS + export + bundle**
- [ ] **Step 5: Commit**

```bash
git commit -am "feat(adaptive): 2k band map and WHOOP Open soften"
```

---

### Task 4: Settings anchors + Open paints from map × WHOOP

**Files:**
- Modify: `index.html` Settings + `applyOpenCondToTask` / session start
- Create: `apps/mobile/prototype/hybrid-app/cond-anchors.smoke.mjs`
- Sync + bump `v185` → `v186` if HTML changed again

**Interfaces:**
- Settings fields on `S.profile` (or equivalent): `race2kSec`, `bikeWattsAnchor`, `bikeRpmAnchor`
- Open: if typed target empty, paint from `mapBandFrom2k` / bike anchor × `softenOpen(recovery)`

- [ ] **Step 1: Smoke asserts Settings strings + `race2kSec` / anchor keys + Open calls `mapBandFrom2k` or `softenOpen`**
- [ ] **Step 2: FAIL**
- [ ] **Step 3: Implement Settings UI + Open wiring; never write anchors from `completeConditioning` / Analytics**
- [ ] **Step 4: verify subset + commit**

```bash
git commit -am "feat(instrument): Settings 2k/bike anchors drive Cond Open"
```

---

### Task 5: Builder modality XOR (fan bike watts | RPM)

**Files:**
- Modify: `index.html` cond builder modality unit picker
- Create: `apps/mobile/prototype/hybrid-app/cond-modality-xor.smoke.mjs`
- Update `condAdaptiveModality` to return `rpm` when unit locked to RPM

- [ ] **Step 1: Smoke** — builder has unit lock; fan bike shows watts XOR rpm controls; no dual-target write path
- [ ] **Step 2: FAIL → implement → PASS
- [ ] **Step 3: Sync/bump/verify/commit**

```bash
git commit -am "feat(atelier): Cond builder locks watts XOR rpm (and split XOR watts)"
```

---

### Task 6: Thin Cond Analytics (work + WHOOP trends)

**Files:**
- Modify: `index.html` Engine/conditioning surface — add **Analytics** sub-tab
- Create: `apps/mobile/prototype/hybrid-app/cond-analytics.smoke.mjs`
- Optional tiny SVG polyline helper inline (no new chart library)

**Interfaces:**
- Read-only: series from completed cond sessions’ logged unit values; WHOOP from daily check-in history (`whoopRecovery` / `hrv`)
- Must not call `decideNextCond` / must not write `race2kSec`

- [ ] **Step 1: Smoke** asserts Analytics tab label, both chart containers/ids, and absence of Next/anchor writes in analytics helpers
- [ ] **Step 2: FAIL → implement empty states + two simple lines → PASS**
- [ ] **Step 3: Manual screenshot → `/opt/cursor/artifacts/cond-analytics.webp`**
- [ ] **Step 4: Commit**

```bash
git commit -am "feat(instrument): Cond Analytics trends (work + WHOOP)"
```

---

### Task 7: Guard-rail smokes + final verify

**Files:**
- Create: `apps/mobile/prototype/hybrid-app/strength-cond-alignment.smoke.mjs` (umbrella assertions from spec §7)
- Wire into `verify`
- Update design spec status line to Approved + implemented-in-progress notes if needed

- [ ] **Step 1: Umbrella smoke** covering actual+RPE Next markers, anchors immutable (no write on complete), modality XOR markers, Analytics read-only
- [ ] **Step 2: Full gate**

```bash
pnpm --filter @hybrid/adaptive test 2>&1 | tee /opt/cursor/artifacts/adaptive-alignment-final.log
pnpm run check:adaptive-bundle
pnpm run check:adaptive-logger
pnpm run check:adaptive-routes
pnpm run verify 2>&1 | tee /opt/cursor/artifacts/alignment-final-verify.log
```

- [ ] **Step 3: Commit + push + update PR**

```bash
git commit -am "test: strength/cond alignment guard-rail smokes"
git push -u origin cursor/audit-critical-fixes-0ae6
```

---

## Spec coverage check

| Spec requirement | Task |
| --- | --- |
| Cond Next from actual + RPE | 1–2 |
| rpm modality | 1, 5 |
| 2k map + WHOOP Open soften | 3–4 |
| Settings anchors immutable | 4, 7 |
| Builder XOR units; machine free | 5 |
| Analytics both charts; read-only | 6–7 |
| No LLM / no fake RPM↔watts | 5–7 smokes |
| Heavy verify | 2, 7 |

## Placeholder scan

None intentional. Rpm “up” nudge magnitude is locked by Task 1’s failing test before implementation.
