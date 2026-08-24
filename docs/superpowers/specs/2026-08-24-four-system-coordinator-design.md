# Four-system Coordinator — design spec

**Date:** 2026-08-24  
**Status:** Implemented (PR #36)  
**Scope:** Weekly **engine brain** that reads domain receipts and produces **silent recommendations** for solo dogfood. **Not** accept/decline UX in v1.

## Problem

GPT’s four-system integration package described a **Coordinator** that merges strength, conditioning, recovery, and nutrition signals into session intent and weekly review. Silent wire intentionally deferred this. Domains now produce local receipts (`progressionAudit`, check-in, cond finish, nutrition log) but nothing unifies them.

## Goal

Pure **Coordinator** module (no I/O) that:

1. Ingests **domain receipts** for a rolling week
2. Emits **CoordinatorReceipt** — recommendations, reason codes, confidence, **no side effects**
3. HTML adapter applies **silent** subset (same philosophy as strength progression)

Optional **weekly review sheet** (read-only) — one scrollable summary, not four separate nag screens.

## Locked product decisions

| Topic | Decision |
| --- | --- |
| Build order | **After** silent strength wire + minimal recovery gates |
| UX | **Silent apply** for solo dogfood; weekly sheet is **read-only** in v1 |
| Domains | Strength, Conditioning (Engine), Recovery, Nutrition |
| Strength ownership | `@hybrid/strength-engine` owns progression math; Coordinator **never** re-implements `decideProgression` |
| Recovery ownership | Recovery engine owns gates; Coordinator reads posture |
| Nutrition ownership | `@hybrid/nutrition-engine` owns targets; Coordinator reads adherence flags only |
| Conditioning ownership | `@hybrid/engine` owns load/zones; Coordinator reads weekly zone minutes vs target |
| Cross-domain writes | **Forbidden** — Coordinator outputs intents; adapters apply within each domain |
| Pain / illness stop | **Not restored** — flags surface in weekly sheet; no session cancel |

## Domain receipts (inputs)

```ts
interface DomainReceipts {
  strength: {
    progressionAudit: ProgressionAuditEntry[];
    workingMaxDeltas: { exerciseId: string; deltaKg: number; at: string }[];
    sessionPainFlags: { sessionId: string; level: string; at: string }[];
  };
  conditioning: {
    weeklyZoneSeconds: Record<string, number>;
    weeklyTargetMinutes?: number;
    sessionsCompleted: number;
  };
  recovery: RecoveryPosture[];  // one per day in window
  nutrition: {
    daysLogged: number;
    avgCalorieAdherence?: number;  // optional v1
    lowEnergyFlag?: boolean;
  };
}
```

## Coordinator output

```ts
interface CoordinatorReceipt {
  weekStart: string;
  generatedAt: string;
  headline: string;           // one line, plain English
  items: CoordinatorItem[];
  reasonCodes: string[];
}

interface CoordinatorItem {
  domain: 'strength' | 'conditioning' | 'recovery' | 'nutrition';
  kind: 'hold' | 'ease' | 'maintain' | 'push' | 'review';
  message: string;
  silentApply: boolean;       // true → adapter may act without UI
}
```

### Example items (illustrative)

- Strength: “Autopilot held bench — no check-in Tuesday” (`silentApply: true`, already applied)
- Conditioning: “Aerobic minutes 40% under 4-week median — optional easy session” (`silentApply: false`, copy only)
- Recovery: “Three control days — expect held load bumps” (informational)
- Nutrition: “Two days unlogged — adherence unknown” (informational)

## Architecture

```text
localStorage S
  → receipt collectors (per domain adapters)
  → Coordinator.plan(receipts)   [pure TS, new package or strength-engine subfolder]
  → CoordinatorReceipt
  → coordinator-adapter.js
        ├── silent apply hooks (strength already done)
        └── weekly sheet HTML (read-only)
```

**Package placement options:**

1. `packages/strength-engine/src/coordinator.ts` — if strength repo owns cross-domain **read** planning only
2. `packages/engine/src/coordinator.ts` — if hybrid repo owns it (requires coordination)

**Default for this repo:** `packages/strength-engine/src/coordinator.ts` with **read-only projections** from HTML state — no hybrid table I/O.

## Weekly review sheet (v1)

- Trigger: Home subtle link “This week” or Sleep footer — **not** a modal on every Sunday
- Content: Coordinator headline + 4–8 items grouped by domain
- Actions: **None** in v1 — dismiss only
- No accept/decline per item

## Non-goals

- AI / LLM planner in v1
- Coach multi-athlete dashboard
- Nutrition target auto-change from training load
- Replacing silent strength progression with Coordinator-owned math
- Postgres tables for coordinator state (local receipts sufficient)

## Relationship to GPT package

Ingest GPT `four-system-integration-package` as **reference** for:

- Receipt shapes
- Session intent vocabulary
- Domain boundary rules

Implement **silent apply** instead of Coordinator receipt UX with accept buttons (solo dogfood choice).

## Testing

- Golden vectors: fixture receipts → expected `CoordinatorReceipt` JSON (`test/fixtures/coordinator-week-*.json`)
- Property: Coordinator has **zero** imports from Supabase / fetch
- Smoke: `check:coordinator` in verify after bundle export
- Manual: dogfood week → sheet matches audit + check-in history

## Exit criteria

- [x] Pure `Coordinator.plan()` with tests
- [x] Receipt collectors from existing HTML state
- [x] Weekly read-only sheet reachable from app
- [x] Strength silent apply unchanged and still authoritative for load bumps
- [x] No cross-domain migration
- [x] `pnpm run verify` green

## References

- `2026-08-24-strength-recovery-silent-wire-design.md` — deferral note
- `2026-08-24-recovery-engine-design.md` — recovery posture input
- `2026-08-24-training-load-headline-design.md` — load split input
- `docs/data/training-load-model.md`
- GPT four-system integration package (external reference)
