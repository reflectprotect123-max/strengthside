# Implementation backlog and work tree

This is the ordered delivery tree. Do not start a later phase because it looks smaller; dependencies are safety boundaries.

| ID | Phase | Status | Dependency | Exit artifact |
|---|---|---|---|---|
| F0 | baseline audit | ready | none | measured source audit |
| F1 | contracts and sync | blocked by F0 approval | F0 | schemas, ownership, shadow sync |
| F2 | Whole-Athlete State | blocked by F1 inputs | F1 | state snapshot + adapter |
| F3 | package split | blocked by F1 | F1 | `@hybrid/*` packages |
| F4 | Conditioning canary | blocked by F3 | F3 | private app and native matrix |
| F5 | Strength migration | blocked by F3/F4 learnings | F3, F4 | continuity migration |
| F6 | Coordinator simulation | can prototype after contracts | F1/F2/F3 | golden plan decisions |
| F7 | production hardening | blocked by all above | F4/F5/F6 | release decision |

## F0 — baseline audit

- locate real source repo;
- measure package graph and duplication;
- trace all current storage and auth paths;
- reproduce known version-skew behavior;
- inventory WHOOP persistence and direct call sites;
- inventory native integrations and store identifiers;
- produce current test/device/deploy matrix;
- do not edit product behavior.

## F1 — contracts and sync

- approve ownership matrix;
- implement event envelope and idempotency;
- choose transitional or relational server boundary;
- add versioned writes and stale conflict response;
- add local outbox adapter;
- shadow new projection beside old blob;
- add RLS/pgTAP and old/new fixtures;
- rehearse rollback and deletion.

## F2 — Whole-Athlete State

- persist complete authorized wearable observations;
- add manual sleep/stress/life-load/pain/illness records;
- implement deterministic state snapshot;
- separate hard safety routes from soft context;
- select observational versus adapter mode;
- add state golden fixtures and data-quality tests.

## F3 — package split

- extract `@hybrid/core`;
- extract Strength and Conditioning packages;
- move conditioning results with a compatibility projection;
- remove unowned cross-domain writes;
- preserve web/mobile render paths;
- update import graph and tests.

## F4 — Conditioning canary

- new app identity/deep links/auth;
- shared-core read and conditioning-owned write;
- BLE/FTMS/Concept2/GPS permission/failure matrix;
- offline and sensor dropout;
- private distribution and rollback;
- no public data migration yet.

## F5 — Strength migration

- retain existing install/identity where safe;
- read old and new projections;
- migrate historical snapshots;
- communicate second-app relationship;
- test upgrade/reinstall/account switching;
- keep old-reader grace period.

## F6 — Coordinator simulation

- freeze proposal version;
- run historical/synthetic scenarios;
- apply hard-first decision order;
- test interference tags and minimum viable sessions;
- reason-code every result;
- shadow publish and compare user overrides.

## F7 — production hardening

- RLS, threat model, secrets, redaction;
- privacy/access/deletion/export;
- regulatory and clinical claim review;
- accessibility and device coverage;
- observability/runbooks/support;
- migration rollback;
- public release decision.
