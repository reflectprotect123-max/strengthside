# Hybrid athlete app — post-silent-wire roadmap

**Date:** 2026-08-24  
**Status:** Arc complete (phases 1–11 shipped)  
**Scope:** Sequencing for everything after silent strength/recovery wire. One product, one HTML app, two dials.

## What is shipped (do not re-litigate)

| Phase | Spec / PR | Status |
| --- | --- | --- |
| Volume budget (soft guides) | `2026-08-24-strength-volume-budget-design.md` | Shipped |
| Silent strength + recovery wire | `2026-08-24-strength-recovery-silent-wire-design.md` | Shipped |
| Strength progress UI | `2026-08-24-strength-progress-ui-design.md` | Shipped (PR #36) |
| Training load headline | `2026-08-24-training-load-headline-design.md` | Shipped (PR #36) |
| Strength cloud sync | `2026-08-24-strength-cloud-sync-design.md` | Shipped (PR #36) |
| Full recovery engine | `2026-08-24-recovery-engine-design.md` | Shipped (PR #36) |
| Four-system Coordinator | `2026-08-24-four-system-coordinator-design.md` | Shipped (PR #36) |
| Engine weekly honesty | `2026-08-24-engine-weekly-honesty-design.md` | Shipped (PR #36) |
| Post-ship gaps + recovery v2 + arc completion | Phases 9–11 slice plan | Shipped (PR #36 + arc finish) |
| Engine Stage 1–3 (cond math, wake lock, native shell) | `2026-08-23-engine-import-design.md` | Shipped on `main` |
| Nutrition local-first + cloud sync | `2026-08-24-nutrition-macrofactor-visual-design.md` + `nutrition-sync.js` | Shipped |

## Build order (locked)

```text
1. Strength volume guides          ✅
2. Silent progression + recovery   ✅
3. Strength progress UI            ✅
4. Training load headline          ✅
5. Strength cloud sync             ✅
6. Engine weekly honesty gaps      ✅
7. Full recovery engine            ✅
8. Four-system Coordinator         ✅
9. Post-ship gap closure           ✅
10. Recovery v2 + progress depth   ✅
11. Arc completion (delivery ledger + coordinator silent apply) ✅
```

**Rule:** Strength + recovery before engine brain. Coordinator never blocks solo dogfood.

**Arc status:** Phases 1–11 complete for solo-athlete HTML app. Remaining items are explicitly cancelled (Phase B, Expo) or future research (AI progression decider v2).

## Five jobs → spec map

Mono-app charter (`2026-08-23-mono-athlete-app-charter.md`) defines five jobs. Each deferred slice maps to a spec:

| Job | Athlete meaning | Spec |
| --- | --- | --- |
| **Train** | Prescribe & start | Volume budget ✅; templates/Library existing |
| **Log** | Capture what happened | Strength log + Engine HR log (existing); no new spec unless gaps found |
| **Progress** | Proof over time | `2026-08-24-strength-progress-ui-design.md` |
| **Recover** | Inputs, not a product | Silent wire ✅ minimal gates; `2026-08-24-recovery-engine-design.md` for full engine |
| **Account** | Persistence | `2026-08-24-strength-cloud-sync-design.md` |

Cross-cutting:

| Concern | Spec |
| --- | --- |
| Combined cardio + strength load | `2026-08-24-training-load-headline-design.md` |
| Weekly four-system brain | `2026-08-24-four-system-coordinator-design.md` |

## Product invariants (carry forward)

- **Silent apply** for progression and deload — no accept/decline sheets for solo dogfood.
- **Soft volume guides** — never block save or clamp sets.
- **60 min** is planning input only — not a timer or hard stop.
- **Training never blocked** — recovery gates only autopilot load increases.
- **Pain at session end only** — No / Mild / Yes; Yes blocks progression for that session's lifts.
- **No Everyday Readiness revival** — check-in + WHOOP stay inputs, not a third dial.
- **`@hybrid/strength-engine` stays pure** — zero I/O, zero React; adapters own storage.

## Non-goals (this roadmap)

- Phase B coach authoring UI
- Expo / second athlete shell
- ARC / Coach HTML prototypes
- Postgres migrations against hybrid-owned tables
- AI progression decider (adaptive engine v2) before deterministic path is wired and dogfooded

## Exit criteria (roadmap complete)

- [x] All specs in this table exist and are internally consistent
- [x] Each spec has locked decisions, architecture, testing, and exit criteria
- [x] Slice plan exists: `docs/superpowers/plans/2026-08-24-hybrid-athlete-slices.md` (≤10 slices per phase)
- [x] Build order respects shared-Supabase contract (`CLAUDE.md`)
- [x] No spec introduces progression banners or hard volume blocks without explicit new decision

## References

- `handoff.md` — operational checkpoint
- `docs/superpowers/plans/2026-08-24-hybrid-athlete-slices.md` — ≤10 slices per phase (agent execution plan)
- `docs/superpowers/plans/2026-08-23-mono-athlete-app-charter.md`
- `docs/data/training-load-model.md` — load headline source math
- `docs/research/strength-macrofactor-rp-2026-08-25/` — MacroFactor/RP research (reference, not build order)
