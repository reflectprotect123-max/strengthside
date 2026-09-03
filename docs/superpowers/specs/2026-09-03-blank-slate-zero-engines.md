# Blank slate — zero core-model engines (2026-09-03)

## Decision

Pull **all** strength/conditioning core-model engines and wiring. Start fresh with **zero** of the old Open/Next/Close / WM / calibration / progression / cond-adapt / Big Mac / recovery-prescribe path.

This supersedes “freeze packages for V3 rewrite.” Packages are **gone**, not parked.

## Deleted

| Layer | Gone |
|---|---|
| Packages | `packages/strength-engine`, `packages/engine`, `packages/shared-core` |
| Athlete adapters / bundles | strength/engine adapters, one-set logger, cond autoreg/session logger, Big Mac stack, recovery trio, coordinator, load-headline, strength-sync/AI, `*-bundle.js` |
| Netlify decide | `big-mac-decide`, `ai-strength-progression`, `ai-coach-intent` |
| Coach S&C source | `coach-loop` / views / catalog / nutrition JS; `coach.html` stays a parked page |
| Evidence runtime models | strength/conditioning/recovery/coordinator JSON |

## Kept (not core model)

- Hybrid HTML shell: Home · Library (dumb templates) · Calendar · Settings
- Manual strength set logger (classic kg × reps × RIR rows) + conditioning log chrome
- Session chrome / rest / work overlays
- Exercise search, load-profile columns (UI only), history seed
- Nutrition packages + WHOOP / Concept2 / Echo FTMS / Capgo
- Shared Supabase **data** tables (twelve-table contract) — ledger only; no decision brain

## Athlete path now

Log what you did. No prescription brain. No silent progression. No WM gate. No coach S&C pull.

Cache: `the-hybrid-athlete-blank-v164`.

## Next

Design a **new** core model from scratch in a new package. Do not revive deleted APIs by name. Do not un-quarantine old smokes — write new checks for the new model.
