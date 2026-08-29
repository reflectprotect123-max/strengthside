# Phase 03 — package split

Branch: `phase/03-package-split`

## Goal

Extract domain logic without breaking the existing fused app or rewriting history.

## Tasks

- create `@hybrid/core`, `@hybrid/strength`, `@hybrid/conditioning`, and state packages;
- move conditioning results behind a compatibility projection;
- remove ambiguous cross-domain ownership;
- preserve platform-specific rendering and native adapters;
- update imports, build graph, and golden tests;
- verify no app can write another domain’s rows.

## Exit criteria

Package tests pass, import graph is documented, history projections agree, and the fused app behavior is unchanged except for approved contract plumbing.
