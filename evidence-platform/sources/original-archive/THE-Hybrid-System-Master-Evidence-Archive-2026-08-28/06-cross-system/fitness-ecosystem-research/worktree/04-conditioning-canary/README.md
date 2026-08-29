# Phase 04 — Conditioning private canary

Branch: `phase/04-conditioning-canary`

## Goal

Prove the separate-app boundary using the integration-heavy product without immediately migrating public users.

## Tasks

- create app identity, auth callback, deep links, and private distribution;
- wire shared-core reads and Conditioning-owned writes;
- test BLE/FTMS/Concept2/GPS permissions, dropout, background limits, and fallback;
- test offline/retry/reinstall/account switch;
- monitor without leaking health data;
- document rollback.

## Exit criteria

Private device matrix passes or has explicit blocked coverage. No public migration occurs until old/new compatibility and security gates pass.
