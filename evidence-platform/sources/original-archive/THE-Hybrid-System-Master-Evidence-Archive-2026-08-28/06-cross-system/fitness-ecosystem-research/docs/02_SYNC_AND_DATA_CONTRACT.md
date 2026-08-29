# Sync and cross-app data contract

## Objective

Two independent apps must be able to operate offline, reconnect, retry, upgrade at different times, and share one athlete identity without silently deleting or overwriting each other’s data.

The local UI should remain fast and usable without a network. The server should be the authority for cross-device convergence, ownership, and historical audit.

## Proposed mutation lifecycle

```text
user action
  ↓
local transaction: domain row + outbox mutation
  ↓
UI reads local database immediately
  ↓
sync worker sends idempotency key + expected server version
  ↓
server checks auth, RLS, ownership, schema, version, and duplicate key
  ├── accepted → server row/event + new version → local ack
  ├── duplicate → return original result → local ack
  ├── stale → return conflict payload → deterministic merge/ask user
  └── invalid → preserve local record, mark failed, explain/retry safely
```

## Required mutation fields

Every mutation should carry:

| Field | Purpose |
|---|---|
| `mutation_id` | idempotency key generated once at the client action |
| `actor_user_id` | authenticated subject; never trust a client-supplied owner alone |
| `domain` | `core`, `strength`, `conditioning`, `state`, `plan`, or future `nutrition` |
| `entity_type`, `entity_id` | precise ownership and merge scope |
| `operation` | create/update/delete/append/acknowledge |
| `schema_version` | decoder/migrator compatibility |
| `expected_version` | optimistic concurrency check |
| `client_observed_at` | time from the device for user context |
| `server_received_at` | authoritative ordering/audit time |
| `payload` | validated, domain-specific mutation |
| `source_app`, `source_build` | rollout and debugging |
| `causation_id`, `correlation_id` | trace a replan or sync chain |

## Merge categories

Do not apply one generic merge rule to every field.

| Data | Suggested behavior |
|---|---|
| append-only completed session/event | idempotent append by stable ID; never last-write-wins over a different event |
| current preference | field-level versioned update or explicit conflict |
| safety flag | server-owned state machine; newest client cannot clear a protected hold without required acknowledgement |
| plan proposal | append proposal; Coordinator decides |
| published weekly plan | canonical writer, versioned replacement, user override as a separate record |
| device cache | disposable; never authoritative |
| historical snapshot | immutable; correction is a new version with reason |
| deletion request | tombstone/erasure workflow with audit record; do not resurrect from another offline client |

## Snapshot rules

Derived state and plans should be snapshots containing:

- `snapshot_id`, `subject_id`, `as_of`, `generated_at`, `algorithm_version`;
- input IDs/hashes and data coverage;
- observed input summary and missingness;
- output state, action, constraints, reason codes, confidence/data-quality;
- source app/build or server job;
- supersedes pointer when a new snapshot replaces a prior current view.

A future recalculation may produce a new snapshot. It must not mutate a historical decision silently.

## Backward compatibility

Each app must support a documented read/write matrix:

| Client | Reads | Writes | Unknown fields |
|---|---|---|---|
| old Strength | old core + its domain | only owned legacy fields | must be preserved server-side or rejected safely |
| new Strength | current + migratable old | strength/core mutations | never broad-replace another domain |
| old Conditioning | old core + its domain | only owned legacy fields | must not erase new state |
| new Conditioning | current + migratable old | conditioning/core mutations | never broad-replace another domain |
| Coordinator | current contracts | weekly plan only | fail closed if proposal version is unsupported |

Run this matrix in a migration harness before production rollout. “The package compiles” is not a compatibility test.

## Why not keep one blob forever?

The blob has benefits: simple local synchronization, low initial schema cost, and existing merge semantics. The risks become material at independent-app scale:

- broad conflict scope;
- old clients can write stale shapes;
- one malformed update can affect unrelated domains;
- server cannot enforce field ownership precisely;
- large payloads increase sync cost and debugging opacity;
- Coordinator output can be overwritten by either app;
- deletion and audit semantics become ambiguous.

If the baseline audit proves a full relational rewrite is too large for phase 1, use a transitional per-domain envelope with server-side versions and explicit ownership. Do not extend the broad single blob to a third or fourth app.

## Security requirements

- Enable and test RLS for every exposed table/schema.
- Use publishable/anonymous client keys only where policy permits; never ship service-role credentials.
- Validate ownership on the server, not only in TypeScript.
- Treat client timestamps as observations, not authority for ordering/security.
- Rate-limit mutation and export endpoints.
- Redact health data from logs and error traces.
- Keep deletion/export behavior documented and testable.

## Implementation sequence

1. Freeze the event envelope and version policy.
2. Add server-owned per-domain write path behind a feature flag.
3. Dual-write from the existing local outbox without changing UI behavior.
4. Compare old blob projection and new domain projection in shadow mode.
5. Replay historical fixtures and synthetic old/new client mutations.
6. Add rollback: stop new writes, preserve old data, and replay the outbox.
7. Cut over one domain at a time; keep the old reader until the compatibility window expires.
