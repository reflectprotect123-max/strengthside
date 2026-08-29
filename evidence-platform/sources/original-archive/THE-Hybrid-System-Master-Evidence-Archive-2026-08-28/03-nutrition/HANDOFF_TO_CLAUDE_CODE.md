# Claude Code handoff

This file is the short launch prompt. The detailed product/research bundle is
in `docs/RESEARCH_BUNDLE_INDEX.md` and its linked documents.

Paste this as the opening instruction after opening the repository:

> Work inside this new MacroTrack repository. Read `CLAUDE.md`, `README.md`,
> `docs/RESEARCH_BUNDLE_INDEX.md`, and then every document in its read order.
> Run the Python tests first. Audit the Supabase migration and Android starter
> for compile/runtime issues before adding features. Build in vertical slices:
> exact food search and barcode/manual logging, snapshot-based daily logging,
> local-first sync, recipes/custom foods/micronutrients, weight trend and
> expenditure state, then weekly adaptive check-ins. Keep the adaptive logic
> deterministic, versioned, and explainable. Treat public MacroFactor material
> as product precedent only; do not claim private algorithm parity. Do not
> invent food data, do not put a service-role key in Android, and do not treat
> missing nutrition data as zero. Keep source licensing/provenance visible.
> After each slice, add tests and report what actually passed, what was blocked,
> and which product/evidence gaps remain.

## First implementation brief

The first production slice is not AI. It is a trustworthy offline-capable food
logger:

1. Validate migration and RLS with two authenticated test users.
2. Add Room entities/DAOs for cached foods, servings, logs, day status, and an
   outbox.
3. Implement exact barcode lookup, paginated name search, source detail, and
   manual fallback.
4. Write logs locally in a transaction with a nutrition/source snapshot.
5. Sync idempotently to Supabase and test offline/reconnect behaviour.
6. Port the adaptive engine only after the logging and snapshot invariants are
   green.
