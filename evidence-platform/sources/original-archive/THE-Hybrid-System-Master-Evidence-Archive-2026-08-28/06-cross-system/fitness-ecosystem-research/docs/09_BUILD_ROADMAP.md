# Dependency-aware build roadmap

## Critical path

```text
baseline audit
      ↓
contracts + sync boundary ─────────────┐
      ↓                                │
whole-athlete state + adapter          │
      ↓                                │
engine package split                    │
      ↓                                │
conditioning private canary             │
      ↓                                │
strength migration                      │
      └───────────────┬────────────────┘
                      ↓
coordinator simulation → shadow plan → public release gate
```

The Coordinator can be prototyped in parallel after the proposal contracts are frozen, but it must not publish against unstable shapes.

## Phase estimates

These are planning ranges, not promises. They exclude unknown migration volume and should be recalibrated after the baseline.

| Phase | Raw engineering range | Key risk |
|---|---:|---|
| baseline audit | 3–7 days | actual source differs from supplied plan |
| contracts/sync shadow | 10–20 days | version skew and production data shape |
| Whole-Athlete State | 8–15 days | missing wearable history and authority split |
| package split | 15–30 days | hidden shared imports and history migration |
| Conditioning canary | 15–30 days | BLE/GPS/Concept2/native release |
| Strength migration | 10–20 days | installed-user continuity |
| Coordinator simulation | 10–20 days | proposal contract churn and rule calibration |
| production hardening | 20–40 days | device, security, privacy, store, rollback |

The original 66–87 raw dev-day estimate should be treated as a lower-bound implementation estimate before migration and release assurance. A production split should be planned closer to 100–150 total engineering/verification days until the audit proves otherwise.

## Phase sequence

### 00 — baseline audit

Output: measured inventory, dependency graph, current test matrix, data migration risk register.

### 01 — contracts and sync

Output: versioned schemas, event envelope, ownership matrix, outbox adapter, server shadow path, conflict fixtures, RLS tests.

### 02 — Whole-Athlete State

Output: normalized observation persistence, deterministic state snapshot, explicit adapter mode, state golden tests.

### 03 — package split

Output: `@hybrid/core`, `@hybrid/strength`, `@hybrid/conditioning`, `@hybrid/state`, and no unowned cross-domain writes.

### 04 — Conditioning canary

Output: private web/mobile app, shared auth/deep links, conditioning data path, native integration test matrix, rollback.

### 05 — Strength migration

Output: public-strength continuity, preserved history, old-reader grace period, support/migration UX.

### 06 — Coordinator simulation

Output: historical replay harness, proposal compatibility, reason-coded weekly plan, canonical writer, shadow results.

### 07 — hardening and release

Output: security evidence, privacy/regulatory review, accessibility, device/store tests, runbooks, monitoring, and public release decision.

## Parallel work policy

Safe parallel work:

- research and source register;
- contract schema drafting after ownership is agreed;
- UI inventory and visual audit;
- Coordinator simulation against frozen fixtures;
- security threat model.

Unsafe parallel work:

- two branches editing the same migration;
- two apps changing event schemas independently;
- Coordinator publishing while proposal versions churn;
- public app split while old-version compatibility is unknown;
- installing production integrations into an unreviewed agent environment.
