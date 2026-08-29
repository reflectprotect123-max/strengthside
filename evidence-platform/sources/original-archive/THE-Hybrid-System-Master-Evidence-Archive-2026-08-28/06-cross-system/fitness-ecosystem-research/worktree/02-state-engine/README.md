# Phase 02 — Whole-Athlete State

Branch: `phase/02-whole-athlete-state`

## Goal

Create one transparent context interpreter without inventing a medical readiness score.

## Tasks

- persist complete authorized wearable observations with provenance;
- add manual sleep/stress/life-load/pain/illness inputs;
- implement deterministic state snapshot and constraints;
- label missing/stale/conflicting data;
- keep HRV advisory only;
- keep pain/illness hard routes separate;
- explicitly choose observational or adapter authority mode;
- add golden fixtures and property tests.

## Exit criteria

State outputs are reproducible, reason-coded, quality-labeled, and cannot clear pain/illness holds. UI authority matches code authority.
