> **SUPERSEDED.** Engines were deleted, not rewritten in place. Living
> spec: `2026-09-03-engine-three-module-redesign.md`. Blank slate:
> `2026-09-03-blank-slate-zero-engines.md`.

# Autopilot clean rebuild plan

**Date:** 2026-09-03  
**Status:** engines ripped from athlete surfaces · packages kept · rebuild from zero wiring  
**Companion:** `2026-09-03-engine-three-module-redesign.md`

---

## What just happened (rip)

**Kept**
- `packages/strength-engine` and `packages/engine` (the libraries)
- Library UI shell (Strength / Engine / Progress tabs + templates browse/edit/schedule)
- Nutrition, WHOOP, Concept2 import scripts, Echo FTMS file, session chrome, exercise search, coach cloud scripts

**Ripped (no athlete call path left)**
- Script tags for strength/engine bundles, adapters, Big Mac bridge, cond loggers/autoreg, recovery engine trio, strength sync/AI, load headline, coordinator adapter
- Adapter JS files stubbed to `ripped: true` proxies (not real engines)
- WM gate on session start → empty
- Silent progression / `conAdapt` / cond anchors on session end → no-ops
- Library Progress tab → placeholder (no WM/progression engine UI)
- `package.json` engine smokes **quarantined** (echo only) so shell/html checks can still run

**Trace policy:** athlete HTML must not load or decide from old progression/level brains. Package source stays for rewrite material.

---

## Product rule (unchanged)

One rulebook, two domains, **three modules**:

| Module | Job | Strength | Conditioning |
|---|---|---|---|
| **Open** | First target | last load / typed | last watts or % of max W |
| **Next** | Mid-session | slider → `decideNextSet` | slider → `decideNextPhase` (≤2 × +3%) |
| **Close** | Session end | save load hint only | save `condAnchors` only |

No WM gate. No calibration gate. No weekly bump. No cond level ladder on athlete path.

---

## Skills used to shape the rebuild

| Skill | What it forces on V3 |
|---|---|
| **frontend-design** | Athlete UI stays Track Dawn / existing Hybrid language — not purple claymorphism, not Inter-on-gradient SaaS. One job per screen; logger is one composition; brand “THE Hybrid” stays hero-level in chrome. Motion: 2–3 intentional only (rest overlay, phase chip, watts delta). |
| **ui-ux-pro-max** | Mobile-first logger: 44px targets, visible focus, `prefers-reduced-motion`, no emoji-as-icons. Rejected its default indigo/clay suggestion — wrong product. Kept checklist: contrast, hover/focus, 375px. |
| **brand** | Voice: plain athlete verbs (“Start set”, “Too easy”, “Save”). No engine jargon in UI (“Open/Next/Close” are code names; UI says start load / next suggestion / done). |
| **design-system** | Reuse existing CSS variables in `index.html`; add only `--target-watts`, `--live-delta` if needed. No new card chrome in hero logger. |
| **three-module redesign** | Pure Open/Next/Close in packages; adapters are I/O only; loggers are dumb. |

---

## Rebuild phases (implementation order)

### Phase 0 — Freeze (done)
- Surfaces cannot call old brains.
- Quarantined smokes documented here.
- Library templates still editable/schedulable.

### Phase 1 — Strength V3 package API (Day 1 morning)
1. Add pure `openStrengthTarget` + `closeStrengthAnchor` in `packages/strength-engine` (+ colocated tests).
2. Keep `decideNextSet` as Next; document WM/calibration as non-gates.
3. Mark `decideProgression` athlete-path-forbidden in file header (do not delete until coach path decided).

### Phase 2 — Strength adapter + logger wire (Day 1 afternoon)
1. Rewrite `strength-adapter.js` from stub → thin I/O around Open/Next/Close only.
2. Reload `strength-bundle.js` in HTML (bundle only + new adapter + one-set logger).
3. Session start: Open fills set 1 from `loadHints` (no ready gate).
4. Session end: Close writes `loadHints` / `volumeHints`; PRs optional; no progression apply.
5. Progress tab: show last-session anchors (hints), optional manual max editor — no audit of silent bumps.
6. Un-quarantine strength smokes that assert Open/Close; delete/rewrite ones that assert bumps/WM gate.

### Phase 3 — Cond V3 package API (Day 2 morning)
1. Add `openCondTarget`, `closeCondAnchor`, `condAnchorKey` in `packages/engine`.
2. Keep `decideNextPhase` + watts push cap; keep `conZones` for HR edges only.
3. `conAdapt` stays in package, never called from athlete adapter.

### Phase 4 — Cond adapter + Echo logger (Day 2 afternoon)
1. Rewrite `engine-adapter.js` + `cond-interval-autoreg.js` + `cond-session-logger.js`.
2. Reload engine bundle + those three scripts.
3. Logger hero: target W / live W / Δ; rest slider → Next; session end → Close.
4. Effort % of max W: easy 60 / med 80 / hard 92.
5. Un-quarantine cond smokes for anchors + push cap.

### Phase 5 — Cleanup
1. Delete stub leftovers; remove Big Mac athlete progression bridge or leave permanent no-op.
2. Restore full `pnpm verify` (no quarantines).
3. Capgo dogfood build when green.

**Out of 2-day scope:** PM5 CSAFE, EffortProfile learning, supersets V2.2, coach pins, deleting `progression.ts`/`conAdapt` files, package rename.

---

## UI surfaces after rebuild (Library stays)

| Surface | Behavior |
|---|---|
| Library → Strength | Templates only (unchanged shell) |
| Library → Engine | Cond templates only |
| Library → Progress | Anchors list (last load / last watts) + optional manual max / benchmark max W |
| Train logger (strength) | One-set row + slider Next |
| Train logger (intervals Echo) | Watts hero + slider on rest |
| Session start | Never blocked on WM |

---

## Success bar

1. Fresh install: schedule Full Body A → start → type loads → finish → next session opens same loads.
2. Three identical sessions → Close does not invent +2.5 kg.
3. Echo 8×30/90 with max W set → Open ~effort%; two easy pushes then hold; Close under `intervals:bike:echo`.
4. Library still lists/edits/schedules templates with Progress placeholder replaced by anchors.
5. `pnpm verify` green with no quarantined engine checks.

---

## File ownership (write targets)

```
packages/strength-engine/src/openTarget.ts      NEW
packages/strength-engine/src/closeAnchor.ts     NEW
packages/engine/src/openCondTarget.ts           NEW
packages/engine/src/closeCondAnchor.ts          NEW
apps/mobile/prototype/hybrid-app/strength-adapter.js   REWRITE
apps/mobile/prototype/hybrid-app/engine-adapter.js     REWRITE
apps/mobile/prototype/hybrid-app/cond-*.js             REWRITE
apps/mobile/prototype/hybrid-app/index.html            RE-WIRE scripts + Progress
package.json                                           un-quarantine as smokes land
```

Do not resurrect: WM gate, `applySilentProgression` bumps, `applyConAdapt` levels, calibration-gated hints.

---

## Coach side — parked (2026-09-03 follow-up)

**Answer:** The first rip did **not** touch coach. That is fixed now.

| Surface | Action |
|---|---|
| `coach.html` | Replaced with parked page (no builder, no publish UI) |
| `coach-bridge.js` / `coach-cloud.js` / `coach-sync.js` / `coach-ai.js` | Parked stubs — no S&C publish/pull/intent |
| Athlete `index.html` | Script tags for coach-sync/cloud/ai removed; `isCoachPrescription` always false; Coach* globals stubbed |
| `whoop.js` `syncAll` | CoachSync.schedulePull removed — Account sync no longer pulls coach S&C |
| Coach + coach-coupled smokes | Quarantined in `package.json` (incl. account-sync, track-dawn coach asserts, log-columns/exercise-load-expr coach builder) |

**No S&C wiring either direction:** coach cannot publish strength/conditioning sessions; athlete cannot pull or treat sessions as coach prescriptions; CoachAI cannot trigger strength/cond autopilot; Whoop Account sync does not schedule coach pull.

Nutrition coach files remain on disk but are unreachable while `coach.html` is parked. Re-enable coach only after Autopilot V3 athlete Open/Next/Close is green — as an explicit later decision.
