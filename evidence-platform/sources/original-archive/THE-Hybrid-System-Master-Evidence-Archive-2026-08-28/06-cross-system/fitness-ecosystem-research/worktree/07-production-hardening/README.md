# Phase 07 — production hardening

Branch: `phase/07-production-hardening`

## Goal

Turn a technically working split into a supportable, secure, privacy-reviewed release.

## Tasks

- run OWASP MASVS/ASVS mapping;
- verify RLS, secrets, auth/deep links, logs, exports, deletion, backups;
- run mobile/native/accessibility/device/store tests;
- assign privacy, regulatory, clinical, support, and rollback owners;
- publish migration/support/runbooks;
- verify monitoring and incident response.

## Exit criteria

Gate 8 in `docs/07_TEST_AND_RELEASE_GATES.md` is explicitly pass/blocked, with evidence links and no unverified platform or regulatory claims.
