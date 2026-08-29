# Build roadmap and test plan

## 1. Delivery principle

Build the shortest vertical slice that is trustworthy from input to history:

```text
food source -> exact lookup -> local log -> historical snapshot -> daily total
-> weight/trend -> coverage state -> explainable check-in proposal
```

Do not start with AI features or decorative dashboards while the underlying
food basis, day-state semantics, snapshots, and RLS are untested.

## 2. Staged roadmap

### Phase 0 — repository and contracts

Deliver:

* read all files listed in `docs/RESEARCH_BUNDLE_INDEX.md`;
* validate the Supabase migration on a disposable Postgres/Supabase project;
* add CI for Python tests, SQL lint/parse, and Android checks;
* create a source/import manifest format;
* agree on the first release’s OFF/FSANZ licensing path.

Exit criteria: clean migration, RLS matrix passes, no secret in repository,
baseline tests run in CI.

### Phase 1 — food repository and logger

Deliver:

* local Room food/search cache;
* exact barcode lookup and paginated name search;
* source/provenance detail;
* servings and quantity scaling;
* recent/favorite food shortcuts;
* daily log with explicit status and snapshot writes.

Exit criteria: a user can log a cached food offline, close/reopen the app, and
see the same historical nutrients.

### Phase 2 — account sync and recovery

Deliver:

* Auth/session state;
* outbox and sync worker;
* stable client operation IDs;
* retry/backoff and conflict UI;
* server aggregates and pagination;
* export/delete baseline.

Exit criteria: airplane-mode logging reconciles once after reconnect without
duplicates or cross-user writes.

### Phase 3 — barcode capture

Deliver:

* CameraX preview/image analysis;
* ML Kit supported retail formats;
* permission/failure/manual entry flow;
* debounce and exact lookup;
* unknown-barcode contribution/report path.

Exit criteria: tested on multiple Android devices and in low light/poor focus,
with manual fallback always available.

### Phase 4 — custom foods, recipes, and micronutrients

Deliver:

* custom food form;
* recipe editor and per-serving math;
* recipe logging snapshots;
* flexible nutrient display and target records;
* label/OCR draft adapter only after manual flow is stable.

Exit criteria: editing current food/recipe data cannot mutate a historical log.

### Phase 5 — weight and adaptive engine

Deliver:

* weight input and raw/trend graph;
* Kotlin port of `adaptive_engine.py`;
* fixture parity tests;
* estimate persistence with config/source inputs;
* held/updating state and visible coverage.

Exit criteria: all Python fixtures have Kotlin equivalents and sign/coverage/
missing-data tests pass.

### Phase 6 — coaching and weekly check-in

Deliver:

* coached/collaborative/manual modes;
* target proposals and accept/edit/decline;
* weekly macro-program days;
* check-in modules and notification preferences;
* safety/manual mode.

Exit criteria: a user can decline every recommendation and keep logging with no
punitive side effect.

### Phase 7 — optional convenience adapters

Deliver only after reviewable manual foundations:

* URL recipe extraction;
* speech-to-search/quick-add;
* photo/AI estimation;
* health integrations;
* widgets/notifications.

Exit criteria: adapter outputs are drafts with confidence/provenance and have a
manual fallback.

### Phase 8 — release hardening

Deliver:

* privacy policy and data-processing inventory;
* crash/performance monitoring with redaction;
* migration rollback/backup procedure;
* accessibility audit;
* security/RLS review;
* source refresh/reconciliation job;
* store listing, support, and deletion operations.

Exit criteria: all release gates below pass and unresolved claims are written
down rather than implied by UI copy.

## 3. Test matrix

| Layer | Required tests |
| --- | --- |
| Import parsing | Fixtures for OFF JSONL/API shape, country filtering, missing macros, serving parsing, kJ conversion, malformed rows, duplicates, CSV/TSV/XLSX wide/long sources. |
| SQL generation | Escaping quotes/newlines, null versus zero, JSONB, arrays, batch size ≤500, column order, transaction wrapping, legacy/enhanced schema. |
| Data quality | No negative/NaN/non-finite nutrition, no invented density, source/external ID present, provenance fields retained. |
| Python engine | All cases in `docs/ALGORITHM_AND_EVIDENCE.md`; golden JSON fixtures; deterministic repeatability. |
| Kotlin parity | Same input fixtures and serialized result comparison with tolerances only where numeric representation requires it. |
| Room | DAO queries, migrations, transaction snapshots, indices, local restart persistence. |
| Sync | Offline queue, retry, duplicate operation, conflict, auth expiry, partial failure, tombstone, timezone. |
| Supabase/RLS | Anonymous, user A, user B, service role; nested recipe/custom-food ownership; storage policies. |
| UI | Logger, barcode fallback, custom food, recipe, day status, check-in accept/edit/decline, accessibility semantics. |
| Device | Camera permissions, focus/rotation, low light, supported barcode formats, low-end performance. |
| Security/privacy | Secret scanning, token storage, redacted logs, export/delete verification, AI consent. |
| Data refresh | Source manifest digest, rerun behaviour, conflicts, deprecated rows, historical snapshots. |
| Performance | Time-to-first-local-result, search latency, long-history scroll, dashboard aggregate query, queue drain. |

## 4. Property and invariant tests

* Scaling a food by zero is rejected; scaling by one preserves values.
* Scaling by quantity is monotonic for non-negative nutrients.
* No missing source value becomes numeric zero.
* A food source edit cannot change an existing log snapshot.
* An unlogged day cannot increase countable nutrition coverage.
* A declared fast is distinguishable from an unlogged day.
* Replaying the same sync operation is equivalent to replaying it once.
* A user cannot read or write another user’s row through any route.
* Expenditure updates are bounded by the damping cap.
* A target-rate sign is preserved: negative loss lowers calories relative to
  expenditure, positive gain raises them.
* Reordering daily input does not change a deterministic result.
* The same config/version/input produces the same engine output.

## 5. CI commands

Minimum repository checks:

```bash
python3 -m unittest discover -s tests -v
python3 -m py_compile *.py
python3 adaptive_engine.py --input examples/checkin.json
git diff --check
```

Android machine checks:

```bash
./gradlew test
./gradlew :app:testDebugUnitTest
./gradlew lint
```

Add SQL/migration and RLS integration checks when a disposable database is
available. A missing Android SDK in the current workspace is a blocked check,
not a passing check.

## 6. Claude Code operating protocol

At the start of each implementation task:

1. read `CLAUDE.md` and the relevant research document;
2. inspect existing code/tests/schema before editing;
3. state the smallest change and affected invariants;
4. implement behind tests where practical;
5. run every available check;
6. record blocked checks honestly;
7. keep commits small and explainable;
8. update the relevant doc if a decision changes.

Claude Code should not introduce a new dependency, external service, AI
provider, health integration, or licensing assumption without recording it in
the open decisions section and checking its official documentation.

## 7. Open decisions that require product owner input

1. Commercial distribution and the final legal interpretation of OFF ODbL and
   FSANZ terms.
2. Which exact FSANZ release is the canonical production seed.
3. Whether the product supports adults only at launch and what safety/manual
   modes are required.
4. Whether cloud sync is mandatory or optional for first release.
5. Room schema/version and conflict policy for multi-device edits.
6. Account deletion/retention period and photo-storage region.
7. Subscription/billing model, if any.
8. Health-platform integrations and which data are imported.
9. AI providers, processing location, consent, and cost limits.
10. Brand, visual language, and accessibility baseline.
11. Whether adaptive targets are enabled by default or opt-in.
12. The retrospective validation protocol and success criteria for the engine.

## 8. Release gates

Do not call the app release-ready until:

* no known critical RLS escape exists;
* offline logging and sync are tested;
* source attribution/license decision is documented;
* nutrition data and missing-value semantics are audited;
* Python/Kotlin engine parity is green;
* historical snapshot behaviour is proven;
* export/delete works;
* safety/manual mode works;
* accessibility and low-end device checks are complete;
* unresolved product/science gaps are visible in documentation and not hidden
  by confident copy.
