# Strength + recovery silent wire — design spec

**Date:** 2026-08-24  
**Status:** Approved in chat  
**Scope:** Wire `@hybrid/strength-engine` into the Hybrid HTML athlete app with silent progression and minimal recovery gates. **Defer** the four-system Coordinator / engine brain until this phase exits.

## Problem

- `@hybrid/strength-engine` has progression, exposure, pain_blocked, e1RM, and volume guides — but the app barely calls it.
- Recovery data exists (daily check-in, WHOOP, readiness score in `index.html`) but does **not** gate strength progression.
- Pain is modeled in the engine; the app does not ask about pain after sessions.
- GPT’s four-system integration package defines a Coordinator we are **not** building yet.

## Goal

After a strength session, the athlete logs sets, answers one end-of-session pain question, and leaves. The app **silently** updates (or holds) next-session loads. Recovery can **silently block** bumps. No progression banners, sheets, or accept/decline flows.

## Non-goals (this phase)

- Four-system weekly Coordinator
- Progression or deload banners / accept-decline UX
- Per-set or per-exercise pain toggles
- Hard session time limits or volume blocks
- HRV or WHOOP as independent blockers
- Postgres / sync for progression state (local-first remains)
- Full recovery engine (delivery load, heat ledger, capacity numbers)

## Locked product decisions

| Topic | Decision |
| --- | --- |
| Build order | Strength + recovery before engine brain |
| Pain capture | **End of session only:** No / Mild / Yes (+ optional note) |
| Progression UX | **Silent apply** — no visible prompt |
| Deload | **Silent apply** (same as progress/hold) |
| Session time (e.g. 60 min) | **Planning input only** — not a timer or hard stop |
| Volume guides | **Soft** — visible in builder/settings only; never block save |
| HRV / WHOOP alone | **Cannot unlock bumps** — no check-in today means no silent bumps, even with green WHOOP |
| Check-in red/yellow | **Silent hold** on progression bumps (worst-of with WHOOP) |
| No check-in today | **No silent bumps** — WHOOP alone does not unlock |
| WHOOP vs subjective | **Worst-of** for bumps; subjective can override WHOOP green (e.g. feel awful + green WHOOP → hold) |
| Training blocked? | **Never** — gates only autopilot load increases |
| PR / beat targets | **Performance override** — post-session silent update still applies (`performance_overrides_subjective_gate` in audit) |
| Session pain Yes | **Silent hold** on bumps for lifts trained that session — **overrides PR override** |

## Architecture

```text
Hybrid HTML app (index.html)
  · log sets (existing)
  · session-end pain prompt (new)
  · daily check-in + WHOOP (existing)
        │
        ▼
strength-adapter (new thin layer in hybrid-app)
  · read completed sessions from localStorage
  · build PerformedSet / exposure inputs
  · call HybridStrength (bundled strength-engine)
  · apply progression to template / next session targets
  · append silent audit entry
        │
        ├── HybridStrength bundle: progression, exposure, e1rm, volumeBudget
        └── recovery-signals (new pure module): check-in → ok | caution | hold
```

### Package boundaries

- **`@hybrid/strength-engine`:** pure functions only; no I/O, no React.
- **`strength-adapter.js` + `recovery-signals`:** browser adapter; owns localStorage read/write.
- **`index.html`:** UI only — pain prompt, no progression chrome.

### Recovery signals (minimal)

Input: `dailyCheckin` row + optional WHOOP fields (existing).

Output:

```ts
type RecoveryGate = 'ok' | 'caution' | 'hold';
interface RecoverySignal {
  gate: RecoveryGate;
  reasonCodes: string[];
}
```

Mapping (locked policy):

- **No check-in today** (`checkinComplete` false) → `hold` (`no_checkin_today`) — WHOOP cannot unlock
- Subjective **Minimum** (red) → `hold`
- Subjective **Control** (yellow) → `caution` (hold progression bumps)
- Subjective **Build** (green) → base `ok`
- WHOOP recovery: ≥67 → `ok`, 34–66 → `caution`, &lt;34 → `hold`
- **Worst-of** subjective band and WHOOP band sets final gate for bumps
- Deload decisions are **not** gated by recovery (poor performance still deloads silently)

**Performance override (post-session):**

If recovery gate would block a `progress` bump but the athlete clearly beat targets or hit a PR on that exercise in this session, apply the silent update anyway and record `performance_overrides_subjective_gate` in audit. Session pain **Yes** for that exercise still forces `hold` — no override.

### Session-end pain

After `finishSession` for a session with strength work:

1. Prompt: **Any pain today?** → `none` | `mild` | `yes`
2. Optional note if `yes`
3. Record on session: `sessionPain`, `sessionPainNote`, `trainedExerciseIds[]`

Adapter: if `sessionPain === 'yes'`, mark that session’s exposures as `pain_blocked` before calling `decideProgression`.

### Silent progression apply

On strength session complete (after pain recorded):

1. For each exercise with enough exposure history, call `decideProgression`.
2. If recovery gate is `hold` or `caution`, force action to `hold` regardless of engine (caution = hold bumps only).
3. If session pain `yes` for exercise, force `hold` for that exercise.
4. Apply `progress` / `deload` to working max or next template targets **without UI**.
5. Append audit entry:

```ts
{
  at: ISO8601,
  sessionId,
  exerciseId,
  action: 'progress' | 'hold' | 'deload' | 'retest',
  deltaKg?: number,
  reasonCodes: string[],
  recoveryGate,
  sessionPain,
  engineVersion: string
}
```

Store in `S.meta.progressionAudit[]` (cap length, e.g. 200 entries).

### Volume guides

Keep existing `HybridStrength.Volume` soft guides (`volumeBudget.ts`). No change to silent progression policy.

## Data flow (happy path)

1. Athlete completes Full Body A, logs sets.
2. `finishSession` → pain prompt → `none`.
3. Check-in was green this morning → recovery gate `ok`.
4. Engine: three on-target sessions on bench → `progress` +2.5%.
5. Adapter writes new target load to template/session; audit log entry added.
6. Next scheduled Full Body A shows higher bench weight — no popup.

## Error handling

- Insufficient exposure → engine returns `hold` / `insufficient_exposure` — no UI, no template change.
- Missing strength bundle → skip silent apply; log once to console in dev.
- Adapter apply failure → do not corrupt template; leave audit entry with error reason.

## Testing

### Automated

- Pure: `recovery-signals` gate mapping tests
- Pure: adapter fixture — sessions → exposures → decision (vitest or smoke `.mjs`)
- Strength-engine existing tests remain green
- `check:strength-progression` smoke (new) in `pnpm run verify`
- CI workflow step matches verify

### Manual dogfood

1. Good week + pain no → silent bench bump next session
2. Pain yes → bench unchanged next session
3. Red check-in → no bumps anywhere
4. Two missed sessions pattern → silent deload if engine triggers

## Exit criteria

- [ ] Strength engine wired via bundle + adapter
- [ ] Session-end pain prompt on strength sessions
- [ ] Recovery gate blocks silent bumps (check-in band)
- [ ] Progress, hold, deload all silent
- [ ] Audit log written locally
- [ ] Volume guides remain soft
- [ ] `pnpm run verify` green
- [ ] No Coordinator / weekly four-system sheet in this phase

## Relationship to GPT four-system package

Ingest GPT package as **future reference** for Coordinator design. This spec implements only:

- Domain boundary respect (strength owns progression; recovery owns gates)
- Pain as hard constraint for progression (consumed, not just recorded)
- HRV advisory rule
- Silent apply instead of Coordinator receipt UX (solo dogfood choice)

Coordinator builds on `progressionAudit` + recovery signals in a later phase.

## References

- `packages/strength-engine/` — progression, exposure, volumeBudget
- `apps/mobile/prototype/hybrid-app/nutrition-ui.js` — check-in pattern (UX inverse: we silent-apply)
- GPT `four-system-integration-package/` — deferred Coordinator
- `docs/data/training-load-model.md` — deferred combined load headline
