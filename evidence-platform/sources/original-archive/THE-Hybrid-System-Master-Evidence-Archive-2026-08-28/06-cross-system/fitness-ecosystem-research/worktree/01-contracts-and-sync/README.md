# Phase 01 — contracts and sync boundary

Branch: `phase/01-contracts-and-sync`

## Goal

Make cross-app ownership and compatibility explicit while preserving local-first UX.

## Tasks

- reconcile the draft schemas with the baseline;
- choose relational/domain rows or transitional per-domain envelopes;
- add event IDs, idempotency, versions, ownership, and stale-write responses;
- implement local outbox/retry without broad blob replacement;
- dual-write and compare projections in shadow mode;
- add RLS/pgTAP and old/new client fixtures;
- rehearse rollback, deletion, reinstall, and account switch.

## Exit criteria

No cross-app public write depends on an unversioned broad blob. A disposable/staging migration passes conflict, replay, RLS, unknown-field, and rollback tests.
