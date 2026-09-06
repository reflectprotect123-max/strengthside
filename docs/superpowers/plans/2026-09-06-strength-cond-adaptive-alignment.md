# Strength ↔ Cond Adaptive Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make conditioning adaptive match strength (Next baselines on logged actual + RPE), add Settings 2k/bike anchors with WHOOP day Open, lock builder modality XOR (including fan-bike RPM), and ship a thin Engine Analytics tab (work + WHOOP trends).

**Architecture:** Keep `@hybrid/adaptive` pure. Extend `decideNextCond` / types for `actual*` baselines and `rpm` modality; add pure `map-from-2k` + `softenOpen`. HTML opens doors only: Settings anchors, Open map × WHOOP, logger override fields, Analytics read-only SVG trends. Smokes enforce the guard rail. Rebuild `adaptive-bundle.js` via `pnpm run build` / `check:adaptive-bundle`.

**Tech Stack:** TypeScript (`packages/adaptive` + Vitest), Hybrid HTML (`apps/mobile/prototype/hybrid-app/index.html` + `bash apps/mobile/sync-hybrid-html.sh`), Node smokes, `pnpm run verify`.

**Spec:** `docs/superpowers/specs/2026-09-06-strength-cond-adaptive-alignment-design.md`

## Skills used before this rewrite

| Skill | Why |
| --- | --- |
| `using-superpowers` | Skill gate before planning or coding |
| `brainstorming` | Already locked design in the approved spec — do not re-open product choices |
| `ui-ux-pro-max` | Settings anchors + Analytics charts against existing OLED Hybrid UI |
| `writing-plans` | This document — bite-sized TDD tasks, real code, no placeholders |
| `test-driven-development` | Every adaptive/behavior change: failing test → implement → pass |
| `subagent-driven-development` / `executing-plans` | Required at execution time (human picks which) |
| `verification-before-completion` | Before any “done” claim: adaptive tests + relevant smokes + `pnpm run verify` |

**ui-ux-pro-max findings applied (fit existing product — do not invent a new theme):**

- Charts: **line / smooth area** for time trends; use SVG (≪1000 pts). Prefer **direct series labels + stroke style**, not hue alone. A11y: short trend summary text under each chart; empty state with a clear next action.
- Forms: real `<label>`s (not placeholder-only); `inputmode="numeric"` / `inputmode="decimal"` for pace/watts/RPM; confirm save via existing save path (no silent dead clicks).
- Touch: controls ≥ `--tap-min` (44px); ≥8px gap between adjacent targets.
- **Reject** the skill’s generic “fitness orange / vibrant block” design-system suggestion. Stay on Hybrid OLED tokens already in `index.html`: `--bg` / `--bg-deep`, `--panel*`, `--copper` / `--copper2`, `--zone`, `--ok`, `--blue`, `--font-display` (Barlow Condensed) + `--font-body` (Space Grotesk). Engine Analytics uses `dial-engine` / `--zone` accents, not new purple/orange skins.
- Capgo / store ship only on explicit human ask. Prefer athlete copy “workshop / Library / Engine”; say “test the app,” never “dogfood.”

## Global Constraints

- Edit athlete UI via `apps/mobile/prototype/hybrid-app/index.html` then `bash apps/mobile/sync-hybrid-html.sh`.
- Bump `LOCAL_BUILD` and SW `CACHE` together on every HTML ship (current pin: `the-hybrid-athlete-blank-v184` → next `v185+` as needed). SW constant lives in `apps/mobile/prototype/hybrid-app/service-worker.js` (`const CACHE = 'the-hybrid-athlete-blank-v184'`).
- Capgo only when the human explicitly asks.
- No LLM writes targets. No fake RPM↔watts conversion. Settings anchors never auto-update from interval logs or Analytics.
- Adaptive stays zero I/O. HTML only opens doors. Global name: `HybridAdaptive` (from `scripts/bundle-adaptive.mjs`).
- Live Cond Next door today (gap to fix): `runDecideNextCond` passes **plan** `currentWatts` / `currentSplitSec` only — no `actual*` fields yet.
- Work on `cursor/audit-critical-fixes-0ae6` (or a fast-forward of it).

---

## File map

| File | Responsibility |
| --- | --- |
| `packages/adaptive/src/types.ts` | Cond Next/Open types: `actual*`, `rpm` modality, Close rpm |
| `packages/adaptive/src/decide-next-cond.ts` | Baseline on actual + RPE; rpm branch |
| `packages/adaptive/src/decide-next-cond.test.ts` | TDD for actual-baseline + rpm |
| `packages/adaptive/src/map-from-2k.ts` (new) | Pure 2k → band target + `softenOpen` |
| `packages/adaptive/src/map-from-2k.test.ts` (new) | Band map + soften tests |
| `packages/adaptive/src/open-cond.ts` / `close-cond.ts` | Extend for `rpm` if Close/Open memory needs it |
| `packages/adaptive/src/index.ts` | Export new helpers |
| `apps/mobile/prototype/hybrid-app/adaptive-bundle.js` | Regenerated (`pnpm run build`) |
| `apps/mobile/prototype/hybrid-app/index.html` | Settings anchors, builder XOR, logger actuals, Open door, Analytics UI |
| `apps/mobile/prototype/hybrid-app/*alignment*.smoke.mjs` / per-task smokes (new) | Guard-rail smokes |
| `package.json` | Wire new smokes into `verify` (same commit as the smoke) |
| Twins via sync script | `THE-Hybrid-App.html`, `preview-site/**`, SW |

### Live API names (do not invent aliases)

From `packages/adaptive` + HTML door (verified on tree):

```ts
// CondNextInput (extend)
{
  dayKind: 'conditioning',
  modality: 'watts' | 'split' | 'rpm', // add rpm
  targetRpe: { min: number; max: number },
  actualRpe: number,
  stopped?: boolean,
  cooked?: boolean,
  currentWatts?: number,
  currentSplitSec?: number,
  currentRpm?: number,       // add
  actualWatts?: number,      // add
  actualSplitSec?: number,   // add
  actualRpm?: number,        // add
}

decideNextCond(input) → { ok: true, watts } | { ok: true, splitSec } | { ok: true, rpm } | { ok: true, skipped: true } | { ok: false, reason: 'wrong_day' }

// HTML door today
runDecideNextCond(t, actualRpe, stopped, cooked)
→ HybridAdaptive.decideNextCond({ dayKind, modality, targetRpe, actualRpe, currentWatts, currentSplitSec, stopped, cooked })
```

Existing band math (keep): watts up `*1.03`, down `*0.95`, cut `*0.92`; split up `-1s`, down `+1s`, cut `+3s`. RPM: mirror watts % then `Math.round`.

---

### Task 1: Cond Next baselines on logged actual (+ rpm modality)

**Files:**
- Modify: `packages/adaptive/src/types.ts`
- Modify: `packages/adaptive/src/decide-next-cond.ts`
- Modify: `packages/adaptive/src/decide-next-cond.test.ts`
- Modify: `packages/adaptive/src/index.ts` (if result union exported only via types — still rebuild bundle)
- Regenerate: `apps/mobile/prototype/hybrid-app/adaptive-bundle.js` via `pnpm run build`

**Interfaces:**
- Consumes: existing `decideNextCond(input: CondNextInput): CondNextResult`
- Produces: `CondNextInput` gains optional `actualWatts?`, `actualSplitSec?`, `actualRpm?`, `currentRpm?`; `modality` adds `'rpm'`; `CondNextResult` gains `{ ok: true, rpm: number }`; Next uses `actualX ?? currentX` as baseline before RPE band nudge. Split still never falls back to watts. RPM never falls back to watts/split.

- [ ] **Step 1: Write failing tests for actual-baseline + rpm**

Append to `decide-next-cond.test.ts`:

```ts
describe('decideNextCond — actual baseline', () => {
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

  it('watts too easy nudges from actualWatts', () => {
    expect(
      decideNextCond({
        dayKind: 'conditioning',
        modality: 'watts',
        targetRpe: { min: 7, max: 8 },
        actualRpe: 5,
        currentWatts: 220,
        actualWatts: 200,
      }),
    ).toEqual({ ok: true, watts: 206 }); // round(200 * 1.03)
  });

  it('rpm modality nudges from actualRpm (mirror watts %)', () => {
    expect(
      decideNextCond({
        dayKind: 'conditioning',
        modality: 'rpm',
        targetRpe: { min: 7, max: 8 },
        actualRpe: 5,
        currentRpm: 60,
        actualRpm: 58,
      }),
    ).toEqual({ ok: true, rpm: 60 }); // round(58 * 1.03) = 60
  });

  it('rpm never falls back to watts', () => {
    expect(
      decideNextCond({
        dayKind: 'conditioning',
        modality: 'rpm',
        targetRpe: { min: 7, max: 8 },
        actualRpe: 7,
        currentWatts: 220,
      }),
    ).toEqual({ ok: true, skipped: true });
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
pnpm --filter @hybrid/adaptive test -- decide-next-cond
```

Expected: new cases fail (actual ignored and/or rpm unknown).

- [ ] **Step 3: Implement types + decideNextCond**

In `types.ts`, extend modality and fields as in the Live API block; add `{ ok: true, rpm: number }` to `CondNextResult`; extend `CloseCondAnchor` with `rpm?: number | null` for later Close memory.

In `decide-next-cond.ts`:

```ts
function baseline(actual: number | undefined, current: number | undefined): number | undefined {
  if (actual != null && Number.isFinite(actual)) return actual;
  if (current != null && Number.isFinite(current)) return current;
  return undefined;
}

function nextRpm(r: number, band: 'hold' | 'up' | 'down' | 'cut'): CondNextResult {
  if (band === 'hold') return { ok: true, rpm: r };
  if (band === 'up') return { ok: true, rpm: Math.round(r * 1.03) };
  if (band === 'down') return { ok: true, rpm: Math.round(r * 0.95) };
  return { ok: true, rpm: Math.round(r * 0.92) };
}
```

Gate presence off the **baseline** value for the active modality (not only `current*`). Split branch: `baseline(actualSplitSec, currentSplitSec)`. Watts: same. Rpm: `baseline(actualRpm, currentRpm)` + `nextRpm`; no watts/split fallback.

- [ ] **Step 4: Tests PASS; rebuild bundle**

```bash
pnpm --filter @hybrid/adaptive test
pnpm run build
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
- Modify: `apps/mobile/prototype/hybrid-app/index.html` (`runDecideNextCond`, interval logger fields, `applyCondNextResult` / `condAdaptiveModality`)
- Create: `apps/mobile/prototype/hybrid-app/cond-next-actual.smoke.mjs`
- Modify: `package.json` (`check:cond-next-actual` + add to `verify`)
- Sync twins + bump cache `v184` → `v185`

**Interfaces:**
- Consumes: `HybridAdaptive.decideNextCond` with `actualSplitSec` / `actualWatts` / `actualRpm`
- Produces: logger stores per-task `loggedSplitSec` / `loggedWatts` / `loggedRpm` (overrideable; prefilled from target); door passes those through

**UX (logger):** One editable “Actual” field for the locked unit, labeled (e.g. `Actual split /500m`), `inputmode="numeric"` or `decimal`, min-height `--tap-min`. Prefill from painted target; athlete can override before RPE prompt. Do not add a second competing unit field.

- [ ] **Step 1: Failing smoke**

```js
// apps/mobile/prototype/hybrid-app/cond-next-actual.smoke.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const html = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'index.html'), 'utf8');
function must(c, m) { if (!c) throw new Error(m); }
must(html.includes('loggedSplitSec'), 'logger actual split field missing');
must(html.includes('loggedWatts'), 'logger actual watts field missing');
must(html.includes('loggedRpm'), 'logger actual rpm field missing');
must(/actualSplitSec\s*:/.test(html), 'Next door must pass actualSplitSec');
must(/actualWatts\s*:/.test(html), 'Next door must pass actualWatts');
must(/actualRpm\s*:/.test(html), 'Next door must pass actualRpm');
console.log('cond-next-actual.smoke: ok');
```

Wire:

```json
"check:cond-next-actual": "node apps/mobile/prototype/hybrid-app/cond-next-actual.smoke.mjs"
```

Append `&& pnpm run check:cond-next-actual` to the `verify` script.

- [ ] **Step 2: Run smoke — FAIL**

```bash
node apps/mobile/prototype/hybrid-app/cond-next-actual.smoke.mjs
```

- [ ] **Step 3: Implement logger override + door**

Update `runDecideNextCond` (keep recovery skip):

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

Add `condCurrentRpm`, extend `condAdaptiveModality` for fan-bike RPM lock, and `applyCondNextResult` so `next.rpm` writes `t.targetRpm`. On each work round UI, show the single actual override for the locked unit; persist on change + save.

Exact helper names in HTML may be `isRecoveryCondTask` / `condPaintedRpe` / `applyCondNextResult` — match the live file; do not invent a parallel door.

- [ ] **Step 4: Sync + verify subset**

```bash
# bump LOCAL_BUILD + CACHE together to the-hybrid-athlete-blank-v185
bash apps/mobile/sync-hybrid-html.sh
node apps/mobile/prototype/hybrid-app/cond-next-actual.smoke.mjs
pnpm run check:adaptive-logger
pnpm run check:adaptive-routes
pnpm run check:adaptive-bundle
pnpm run verify 2>&1 | tee /opt/cursor/artifacts/cond-next-actual-verify.log | tail -40
```

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/prototype/hybrid-app package.json apps/mobile/THE-Hybrid-App.html apps/mobile/preview-site apps/mobile/service-worker.js
git commit -m "feat(instrument): Cond logger passes actuals into Next"
```

---

### Task 3: Pure 2k → band map (+ WHOOP soften helper)

**Files:**
- Create: `packages/adaptive/src/map-from-2k.ts`
- Create: `packages/adaptive/src/map-from-2k.test.ts`
- Modify: `packages/adaptive/src/index.ts` (export)
- Rebuild adaptive bundle

**Interfaces:**

```ts
export type CondBand = 'easy' | 'steady' | 'tempo' | 'threshold' | 'intervals';

export function splitSecFrom2k(totalSec: number): number; // total / 4 → /500m
export function wattsFromSplitSec(splitSec: number): number; // Concept2-style for rower/ski display only
export function mapBandFrom2k(totalSec: number, band: CondBand): { splitSec: number; watts: number };

/** Soften today's Open only. recovery null/0 → no change. */
export function softenOpen(
  value: number,
  modality: 'split' | 'watts' | 'rpm',
  recovery: number | null, // WHOOP 0–100
): number;
```

Band midpoints from spec (document as named constants at top of file):

| Band | splitSec vs race `/500m` | watts vs 2k watts |
| --- | --- | --- |
| steady | +22.5s | ~72.5% |
| tempo | +13.5s | ~82.5% |
| threshold | +8.5s | ~90% |
| intervals | +2.5s | ~100% |
| easy | use bike anchor path in HTML; map returns race-based fallback only if called | ~60% |

`softenOpen` bands (Open only): recovery ≥67 → identity (optional −1s split / +0 later); 34–66 → softer (~+2% split time or −3% watts/rpm); <34 → softer still (~+4% split / −6% watts/rpm). Round to whole seconds / watts / rpm.

- [ ] **Step 1: Failing tests**

```ts
it('7:20 2k → race split 110s', () => {
  expect(splitSecFrom2k(7 * 60 + 20)).toBe(110);
});

it('threshold from 7:20 maps near race+8.5s', () => {
  const m = mapBandFrom2k(7 * 60 + 20, 'threshold');
  expect(m.splitSec).toBe(119); // 110 + 8.5 → round 119
  expect(m.watts).toBe(wattsFromSplitSec(119));
});

it('softenOpen mid recovery slows split', () => {
  expect(softenOpen(110, 'split', 50)).toBeGreaterThan(110);
});

it('softenOpen mid recovery lowers watts', () => {
  expect(softenOpen(200, 'watts', 50)).toBeLessThan(200);
});
```

- [ ] **Step 2: Run — FAIL**
- [ ] **Step 3: Implement map + soften** (Concept2 watts: use the same formula already used elsewhere in the repo if one exists; else implement classic `watts = 2.80 / (splitSec/500)^3` with `splitSec` as seconds per 500m — lock exact constant in the test).
- [ ] **Step 4: PASS + export + bundle**

```bash
pnpm --filter @hybrid/adaptive test
pnpm run build
pnpm run check:adaptive-bundle
```

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(adaptive): 2k band map and WHOOP Open soften"
```

---

### Task 4: Settings anchors + Open paints from map × WHOOP

**Files:**
- Modify: `index.html` — `settings()` card + Open path (`applyOpenCondToTask` / session start)
- Create: `apps/mobile/prototype/hybrid-app/cond-anchors.smoke.mjs`
- Sync + bump `v185` → `v186` if HTML ship again

**Interfaces:**
- Profile fields: `S.profile.race2kSec`, `S.profile.bikeWattsAnchor`, `S.profile.bikeRpmAnchor` (numbers; empty allowed)
- Open: if typed target empty, paint from `mapBandFrom2k` / bike anchor × `softenOpen(whoopRecovery)`
- Never write anchors from `completeConditioning`, interval complete, or Analytics helpers

**UX (Settings):** New card **after** Zone profile, same card chrome:

- Eyebrow: `Conditioning` · Title: `Pace anchors` · Meta: one short line — “Race / test marks. Logging hard intervals does not change these.”
- Fields (labeled, `inputmode`):
  - `2k race time` — text `m:ss` (parse to seconds into `race2kSec`)
  - `Bike watts anchor` — number
  - `Bike RPM anchor` — number
- Tap targets ≥44px; two-column where it matches Zone profile (`div.two`).
- No floating badges; no purple accents.

- [ ] **Step 1: Smoke** asserts Settings strings (`Pace anchors`, `race2kSec` / `bikeWattsAnchor` / `bikeRpmAnchor`), Open calls `mapBandFrom2k` or `softenOpen`, and `completeConditioning` / Analytics helpers do **not** assign `race2kSec`.
- [ ] **Step 2: FAIL → implement → PASS**
- [ ] **Step 3: Sync/bump/verify subset + commit**

```bash
git commit -am "feat(instrument): Settings 2k/bike anchors drive Cond Open"
```

---

### Task 5: Builder modality XOR (fan bike watts | RPM)

**Files:**
- Modify: `index.html` cond builder (`renderCondBuilder`, save/normalize paths, `condAdaptiveModality`)
- Create: `apps/mobile/prototype/hybrid-app/cond-modality-xor.smoke.mjs`

**Interfaces:**
- Per block: `unitLock: 'split' | 'watts' | 'rpm'` (or reuse existing target fields with exclusive clear)
- Rower/ski: show split XOR watts controls — selecting one clears the other on save
- Fan bike / Echo: show watts XOR RPM — same
- Machine free: rower or bike still allowed for easy **or** hard formats
- `condAdaptiveModality` returns `'rpm'` when unit locked to RPM

**UX:** Segmented unit control (existing chip/btn patterns), not a tiny text toggle. Active unit visibly selected (`aria-pressed`). Helper meta: “One unit for this block — not switchable mid-block.”

- [ ] **Step 1: Smoke** — builder has unit lock markers; fan bike RPM path present; save path cannot persist both `targetWatts` and `targetRpm` (or equivalent) together; no silent cross-fill helper that invents RPM from watts.
- [ ] **Step 2: FAIL → implement → PASS**
- [ ] **Step 3: Sync/bump/verify/commit**

```bash
git commit -am "feat(atelier): Cond builder locks watts XOR rpm (and split XOR watts)"
```

---

### Task 6: Thin Engine Analytics (work + WHOOP trends)

**Files:**
- Modify: `index.html` — Engine library surface (`libraryConditioningTab` / sibling sub-view)
- Create: `apps/mobile/prototype/hybrid-app/cond-analytics.smoke.mjs`
- Inline SVG polyline helper (no new chart library)

**Interfaces:**
- Sub-nav under The Engine: **Templates | Analytics** (reuse `.ath-tabs` / `.library-tabs` patterns — not a Library-wide Progress rebuild)
- Read-only series:
  1. Work output — last N completed cond sessions’ logged unit value (split **or** watts **or** rpm as locked; separate series if mixed — never convert)
  2. WHOOP recovery / HRV from `dailyCheckins` history
- Must not call `decideNextCond` / must not write `race2kSec` / bike anchors

**UX (from ui-ux-pro-max + OLED fit):**

- One job: glance trends. Two stacked sections, each: short title + one sentence + chart + 1-line summary (`Last 14 days · split trending slower` / `No WHOOP yet`).
- Line chart SVG, stroke `--zone` (work) and `#16f26b` / `--ok` (recovery) or `--blue` (HRV) — **label the series in text**, don’t rely on color alone.
- Empty: dashed panel + “Complete an Engine session to see work trends” / “Sync WHOOP or log recovery on check-in” + optional CTA button to builder or check-in — never blank white/black void, never invented points.
- No coach narrative, no LLM copy, no WM/PR Progress resurrection, no cards-for-decoration beyond existing `.card` section shells.
- Prefer `prefers-reduced-motion`: static SVG only (no animated draw required).

- [ ] **Step 1: Smoke** asserts Analytics tab label, both chart container ids (`#condAnalyticsWork`, `#condAnalyticsWhoop`), empty-state copy markers, and absence of Next/anchor writes in analytics helpers (`function condAnalytics` / `renderCondAnalytics` must not contain `race2kSec=` or `decideNextCond`).
- [ ] **Step 2: FAIL → implement empty states + two SVG lines → PASS**
- [ ] **Step 3: Manual screenshot → `/opt/cursor/artifacts/cond-analytics.webp` (and empty-state shot if feasible)**
- [ ] **Step 4: Commit**

```bash
git commit -am "feat(instrument): Engine Analytics trends (work + WHOOP)"
```

---

### Task 7: Guard-rail smokes + final verify

**Files:**
- Create: `apps/mobile/prototype/hybrid-app/strength-cond-alignment.smoke.mjs` (umbrella assertions from spec §7)
- Wire into `verify`
- Optionally flip design spec status line to note implementation in progress / done when tasks land

- [ ] **Step 1: Umbrella smoke** covering:
  - Cond Next markers for `actualSplitSec` / `actualWatts` / `actualRpm` + RPE door
  - Anchors immutable (no `race2kSec` write on complete / analytics)
  - Modality XOR markers (rpm + exclusive unit)
  - Analytics read-only surface under Engine
  - No RPM↔watts conversion helper sold as adaptive truth

- [ ] **Step 2: Full gate**

```bash
pnpm --filter @hybrid/adaptive test 2>&1 | tee /opt/cursor/artifacts/adaptive-alignment-final.log
pnpm run check:adaptive-bundle
pnpm run check:adaptive-logger
pnpm run check:adaptive-routes
pnpm run check:cond-next-actual
pnpm run check:cond-anchors   # name as wired in Tasks 4–6
pnpm run check:cond-modality-xor
pnpm run check:cond-analytics
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
| OLED / mobile UX for Settings + Analytics | 4, 6 (ui-ux-pro-max constraints) |

## Placeholder scan

None intentional. Rpm up-nudge magnitude is locked by Task 1’s failing test (`Math.round(actual * 1.03)`). Concept2 watts constant is locked by Task 3 tests before implementation. Exact HTML helper spellings (`isRecoveryCondTask` vs neighbors) must be read from the live file at execution — do not create a second parallel Cond Next door.

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-09-06-strength-cond-adaptive-alignment.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks (`subagent-driven-development`)
2. **Inline Execution** — this session with `executing-plans`, batch with checkpoints

Which approach?
