# Recovery engine (full) — design spec

**Date:** 2026-08-24  
**Status:** Approved in chat (build after minimal gates + Coordinator inputs)  
**Scope:** Expand recovery beyond `recovery-signals.js` bump gates into a **pure recovery policy module** that other domains can read. Still **no third Home dial**; still **never block training** in solo dogfood unless explicit future safety decision.

## Problem

Silent wire shipped **minimal gates** (`ok | caution | hold`) for progression bumps only. Deferred items from the silent wire spec include:

- Delivery load / heat ledger
- Capacity numbers
- Full safety state machine (from MacroFactor/RP research checklist Phase 6)

Today, check-in sliders, WHOOP, and session pain exist, but nothing computes a unified **recovery posture** for future Coordinator or load headline consumers.

## Goal

Introduce `@hybrid/strength-engine` **or** hybrid-app pure module `recovery-engine.js` that outputs:

```ts
interface RecoveryPosture {
  band: 'build' | 'control' | 'minimum' | 'insufficient_data';
  gate: 'ok' | 'caution' | 'hold';           // same as recovery-signals for bumps
  capacityHint: number | null;               // 0–100 relative, optional v1
  reasonCodes: string[];
  domains: {
    subjective: SubjectiveSnapshot;
    wearable: WearableSnapshot | null;
    sessionPainToday: 'none' | 'mild' | 'yes' | null;
    heatLoad: number | null;
  };
}
```

**Consumers (read-only):**

- `recovery-signals.js` — thin wrapper calling recovery-engine for gate (replace duplicated mapping)
- Future Coordinator — weekly receipt input
- Training load headline — optional dampener display copy only (not a blocker)

## Locked product decisions

| Topic | Decision |
| --- | --- |
| HRV / WHOOP alone | **Cannot unlock progression bumps** without check-in (unchanged) |
| Worst-of rule | Subjective band vs WHOOP band for **bump gate** (unchanged) |
| Training blocked? | **No** in athlete HTML app — posture is informational + bump gate |
| Pain | Session-end Yes → `hold` bumps + flag in posture; Mild → advisory code only |
| Illness flags | Record-only until Coordinator; **no auto-stop** (auto-coach deleted) |
| Heat / steps | Contribute to `backgroundLoad` copy and capacity hint — not independent blockers |
| Package boundary | Pure functions; adapter reads `dailyCheckin` + session |

## Architecture

```text
dailyCheckin + WHOOP + today's sessionPain
        ↓
recovery-engine (pure)
        ↓
RecoveryPosture
        ├── recovery-signals.recoverySignal() → delegates here
        ├── StrengthAdapter (bump gate unchanged)
        └── Sleep/Home copy (optional one-liner: “Control day — autopilot loads held”)
```

### Mapping (extends silent wire)

| Input | Effect on posture |
| --- | --- |
| No check-in | `insufficient_data`, gate `hold` |
| Green subjective + green WHOOP | `build`, gate `ok` |
| Yellow subjective or moderate WHOOP | `control`, gate `caution` |
| Red subjective or low WHOOP | `minimum`, gate `hold` |
| Session pain yes (today) | gate `hold` for bumps; add `session_pain_active` |
| High heat + poor sleep | lower `capacityHint`; reason codes only |

## Non-goals (this phase)

- Delivery load ledger with weekly budgets
- Clinician review / emergency stop UX
- HRV as pain/injury gate (forbidden by CLAUDE.md)
- Replacing WHOOP recovery ring
- Cross-domain nutrition targets from recovery

## Relationship to research checklist

MacroFactor/RP Phase 6 lists priority-ordered safety states. **This spec implements only the solo-athlete subset:**

- `hold progression` ↔ gate hold/caution
- `caution` ↔ control band
- `normal` ↔ build band
- `insufficient data` ↔ no check-in

Emergency stop, training pause, clinician review → **Coordinator spec**, not here.

## Testing

- Colocated pure tests or smoke mirroring `recovery-signals.smoke.mjs` cases
- Table-driven worst-of matrix (≥12 cases)
- Regression: all silent wire smoke tests still pass when signals delegate to engine

## Exit criteria

- [ ] Pure recovery-engine module with typed output
- [ ] `recovery-signals.js` delegates to engine (no duplicate mapping)
- [ ] Posture available for Progress audit plain-English strings
- [ ] No training-start blocking added
- [ ] `pnpm run verify` green

## References

- `2026-08-24-strength-recovery-silent-wire-design.md`
- `apps/mobile/prototype/hybrid-app/recovery-signals.js`
- `docs/research/strength-macrofactor-rp-2026-08-25/THE_Hybrid_Strength_Implementation_Checklist.md` — Phase 6
