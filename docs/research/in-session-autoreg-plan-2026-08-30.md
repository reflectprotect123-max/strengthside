# In-session autoreg — implementation plan

**Date:** 30 August 2026  
**Status:** active  
**Depends on:** `docs/research/one-set-logger-autoreg-2026-08-30.md` (UX/competitive), `docs/research/in-session-autoreg-decision-tables-2026-08-30.md` (coefficients)

---

## Five-line scope

1. **Decision tables** — document intrasession rules with evidence classes; coefficients marked PROVISIONAL until dogfood.  
2. **Pure engines** — `decideNextSet` (strength-engine) and `decideNextPhase` (engine/conditioning); post-session `decideProgression` / `conAdapt` unchanged.  
3. **Athlete logger** — one-set / one-phase state machine + rest overlay; adapters call engines on each Next.  
4. **Strength coach builder** — target RIR per exercise + logger preview aligned with one-set autoreg. Conditioning/recovery builder **no change**.  
5. **Verify** — colocated tests lock behaviour; `pnpm run verify` in CI.

---

## Phase 0 — Data fallback (this PR)

| Deliverable | Owner | Done when |
|-------------|-------|-----------|
| Decision tables doc | docs | Every row has evidence class + PROVISIONAL flag |
| `decideNextSet` + tests | strength-engine | Hit/miss/difficulty matrix green in vitest |
| `decideNextPhase` + tests | engine | Interval felt→target adjust; steady no-op |
| Export from package indexes | both | typecheck clean |

**Not in Phase 0:** HTML UI, coach builder, Supabase migrations, bundle regen for mobile.

---

## Phase 1 — Strength logger

| Step | File(s) | Notes |
|------|---------|-------|
| Session cursor state | `index.html` | `{ setOrdinal, restPhase, suggestion }` |
| Replace `strengthTask` | `index.html` | One-set screen + slider + Next |
| Rest overlay | `index.html` | Reuse `currentRestSec`; superset graph later |
| Adapter glue | `strength-adapter.js` | `suggestNextSet(state, task, performed)` |
| Stop pre-fill all rows | `strength-adapter.js` | Set 1 only at session open |

---

## Phase 2 — Conditioning logger

| Step | File(s) | Notes |
|------|---------|-------|
| Phase machine | `index.html` | work → rest (+ RPE) → work |
| Wire `decideNextPhase` | `engine-adapter.js` | On rest boundary after interval |
| Keep `bleHr` | existing | Zone seconds still feed `conAdapt` at end |

Conditioning/recovery **coach builder unchanged** — effort chips + format already publish what `conPrescription` needs.

---

## Phase 3 — Coach strength builder (aligned)

- Default **target RIR** per exercise on publish — single field, blank = engine default 2.
- Builder logger twin preview matches one-set in-session flow (difficulty slider, not last-set RIR for intersession).
- Superset **rest edges** (`restPartnerSec` / `restRoundSec`) when superset graph lands in logger.
- Keep sets × reps × kg grid; engine autoreg fills gap until coach pins absolute load on set 1.

**Verdict:** conditioning/recovery builder unchanged. Strength builder aligned for target RIR + preview copy.

---

## Research data we are *not* re-fetching

Peak/Volt/Juggernaut intrasession coefficients (private). We anchor to:

- APRE set-3→set-4 bands (protocol fact)
- Alpha double-progression order (product fact)
- Existing Hybrid `progression.ts` / `conAdapt` (intersession, frozen)
- Helms/Zourdos RIR-as-autoreg (scientific — cited in decision tables, not copied numerically)

---

## Success gates

- [ ] `decideNextSet`: did_not_complete never raises load; very_easy never below performed; anchor untouched in return value  
- [ ] `decideNextPhase`: steady returns no-op; hard interval eases next watts/HR  
- [ ] `pnpm run verify` green  
- [ ] Manual: mockup flows match implemented decision codes in dev console

---

## Build order (execute)

```
Phase 0 (this branch) → Phase 1 strength UI → Phase 2 cond UI → Phase 3 coach RIR optional
```
