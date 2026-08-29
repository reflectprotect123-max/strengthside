# App split and migration strategy

## Principle

Separate codebases after the contracts are safe, not before. The app split is a migration of identities, storage ownership, installed binaries, deep links, analytics, permissions, and user expectations—not just a folder move.

## Proposed phases

### Phase A — baseline and inventory

Produce a measured map of:

- web/mobile entry points and build identifiers;
- shared versus domain-specific imports;
- storage reads/writes and merge rules;
- Supabase schema/RLS/functions;
- WHOOP, Concept2, BLE/FTMS, GPS, Health permissions;
- analytics/error reporting;
- deep links and auth callbacks;
- current user migration paths and rollback options.

No behavior change.

### Phase B — contract and storage shadow mode

- define schemas and event envelope;
- add server-side domain ownership;
- dual-write new domain resources while the old reader remains canonical;
- compare projections and report mismatches;
- add old/new client mutation fixtures;
- rehearse deletion and reinstallation.

### Phase C — Whole-Athlete State

- persist complete authorized wearable observations;
- build deterministic state snapshot;
- route a single surface through an explicit adapter;
- keep old prescriptions observational or migrate every call site deliberately.

### Phase D — engine package split

Extract in dependency order:

```text
@hybrid/core
  ├── @hybrid/strength
  ├── @hybrid/conditioning
  └── @hybrid/state
```

Move conditioning results out of generic session records only with a migration and regression fixture set. Preserve the existing render paths until both projections agree.

### Phase E — Conditioning private canary

Stand up the Conditioning app as a private/internal build first. Validate:

- auth and deep links;
- shared-core read path;
- conditioning-owned write path;
- BLE/FTMS/Concept2/GPS behavior;
- offline queue and sensor dropout;
- permissions and background limitations;
- release/rollback process.

The canary proves architecture; it does not automatically migrate public users.

### Phase F — Strength app migration

The existing app’s identity and install path may be valuable, but do not assume it can simply be “stripped.” Create a compatibility reader, keep user history, preserve app links, and communicate any second-app relationship in product UX.

### Phase G — Coordinator and ecosystem surface

After both apps emit stable proposal contracts, run the Coordinator in simulation/shadow mode. Publish plans only after historical fixtures, user override semantics, and canonical writer permissions pass.

## Compatibility matrix

Test at least these pairs:

| Scenario | Expected result |
|---|---|
| old Strength opens after new Conditioning write | old Strength reads its supported fields and does not erase new fields |
| old Conditioning opens after new Strength write | same in reverse |
| both apps offline, then reconnect | stable event IDs; no duplicate completion; conflicts visible |
| app deleted/reinstalled | server data survives; local cache rebuilds safely |
| user changes account | local cache is isolated and cannot bleed across users |
| expired/revoked WHOOP token | app keeps prior observations with stale status; no crash or false zero |
| BLE/GPS permission denied | manual logging fallback works; no hidden success claim |
| Coordinator receives unknown proposal version | proposal is rejected/deferred with a reason, not guessed |
| user changes a scheduled session | override is explicit and traceable |
| account deletion requested offline | deletion intent is durable and cannot be silently undone |

## Rollout controls

- feature flags by account cohort;
- shadow projections and mismatch telemetry without health-data logging;
- kill switch for new writes, not for local history;
- migration checkpoints with counts and checksums;
- export before destructive migration;
- old-reader grace period;
- explicit rollback procedure and owner;
- support playbook for duplicate/unsynced records.

## Do not do

- do not let both apps continue broad-writing one blob after public split;
- do not change a field’s meaning while keeping its old name;
- do not delete legacy records because the new projection “looks right”;
- do not make a store migration the first test of a new native integration;
- do not claim the new app is safe because web tests passed while mobile/BLE/GPS were untested.
