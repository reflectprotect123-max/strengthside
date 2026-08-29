# Phase 00 — baseline audit

Branch: `phase/00-baseline-audit`

## Goal

Measure the real `the-hybrid-engine1` repository before refactoring. This package contains no copy of that source.

## Inputs

- `PROJECT_CONTEXT.md`
- `docs/00_EXECUTIVE_REVIEW.md`
- the real application checkout

## Tasks

1. Inventory package graph, app entry points, build scripts, CI, deploys, EAS/store IDs, deep links, permissions, and tests.
2. Trace local storage, Supabase schema/functions/RLS, blob reads/writes, merge/sanitize rules, deletion, and auth.
3. Trace strength/conditioning/WHOOP/pain/illness/readiness/balance/history call sites.
4. Measure shared/domain-specific code and imports.
5. Reproduce version-skew and offline conflicts with fixtures.
6. Record all findings as verified/provided/inferred/unknown.

## Exit criteria

`BASELINE_AUDIT.md` exists with exact file paths, command results, dependency graph, current behavior, contradictions, blockers, and a proposed migration order. No product behavior was changed.
