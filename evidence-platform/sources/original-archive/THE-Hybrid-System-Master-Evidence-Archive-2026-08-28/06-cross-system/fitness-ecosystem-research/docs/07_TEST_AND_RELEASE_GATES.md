# Test strategy and release gates

## Test layers

### Contract tests

- JSON Schema validation for every fixture;
- unknown-field and version behavior;
- encode/decode round trips;
- required ownership and timestamp fields;
- event idempotency and causal links;
- snapshot immutability and supersession.

### Pure engine tests

- Strength and Conditioning proposal golden fixtures;
- Whole-Athlete State missing/stale/conflicting data;
- pain/illness hard routes;
- conditioning cardio-pass/local-fail rule;
- Coordinator ordering, interference, priority, availability, and reason codes;
- deterministic output across repeated runs and platforms.

### Storage/sync tests

- offline create/update/complete;
- retry after timeout;
- duplicate mutation;
- stale expected version;
- concurrent Strength and Conditioning updates;
- deletion/tombstone and reinstall;
- old/new client compatibility;
- unknown field preservation;
- auth/account switching;
- RLS positive and negative identities.

### Integration tests

- WHOOP authorization, refresh, revocation, missing scopes, webhook retry, stale observations;
- Concept2/BLE/FTMS disconnect and permission denial;
- GPS background limitations and manual fallback;
- deep links across apps and auth callbacks;
- Supabase migration and rollback in disposable projects.

### Device/E2E tests

- low-storage, offline, timezone/DST, clock skew, background resume;
- Android/iOS permissions and native modules;
- screen readers, dynamic text, touch targets, contrast;
- app upgrade from supported previous versions;
- store install, update, uninstall/reinstall, and deep link.

## Release gates

### Gate 0 — baseline

Pass when the real repository, build matrix, data paths, and current behavior are measured. No implementation changes required.

### Gate 1 — contract

Pass when schemas, ownership, versions, idempotency, conflict states, and migration strategy have approval and tests.

### Gate 2 — shadow sync

Pass when old blob projection and new domain projection agree on historical/synthetic fixtures, with mismatch reporting and rollback.

### Gate 3 — state

Pass when full authorized observations persist, state output is deterministic, missingness is explicit, and no hidden second readiness authority exists.

### Gate 4 — package split

Pass when Strength/Conditioning package tests pass, domain ownership is enforced, and the existing fused app has no unaccounted cross-imports.

### Gate 5 — private canary

Pass when Conditioning canary handles auth, offline, native integrations, permissions, and rollback without public users.

### Gate 6 — migration rehearsal

Pass when old/new clients, offline races, reinstall, deletion, deep links, and upgrade paths pass in a disposable/staging environment.

### Gate 7 — security/regulatory review

Pass when RLS, secrets, logs, export/deletion, threat-model controls, intended purpose, claims, and privacy notices are reviewed.

### Gate 8 — public release

Pass only after support/runbook, monitoring, rollback, store assets, accessibility, device coverage, and incident ownership are in place.

## Quality bar for adaptive outputs

Every adaptive output must include:

```text
algorithm_version
observed_inputs[]
missing_inputs[]
data_quality
state
action
reason_codes[]
confidence_label
generated_at
```

If the product cannot explain why a session was changed, it is not ready for user-facing automation.

## Failure reporting

Never “fix” a failing test by weakening a fixture without a decision record. Record:

- command;
- environment/device;
- expected versus observed;
- reproducibility;
- suspected owner;
- user impact;
- mitigation and rollback.
