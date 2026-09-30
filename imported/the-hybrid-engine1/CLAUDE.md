# Claude Code operating contract — THE-HYBRID-ENGINE1 (schema stub)

This repository is a **schema stub**, as of 26 August 2026. It has no
application, no packages and no product. The product is
`reflectprotect123-max/strengthside` — the Hybrid HTML athlete app and the pure
`@hybrid/strength-engine`.

What this repo owns is one thing: the half of a shared Supabase project's
migration ledger that the strength repo does not own. Read `handoff.md` for the
checkpoint before making changes.

## What this repo is, and is not

- **It IS** the `supabase/migrations/` this repo owns, and the single check
  that proves they still apply to a real Postgres
  (`checks/migrations-apply.mjs`, with `checks/sql/supabase-prelude.sql`).
- **It is NOT** a coaching product. The coach web workspace, the Android
  athlete app, every `packages/*` engine, the coach design kit, the Netlify
  site and functions, and the EAS/OTA pipelines were deleted on 26 August 2026.
  Git history holds them.
- **Do not rebuild coaching, an app, or a package here.** The coach/ARC tables
  the migrations still create (`coaches_athlete_anywhere`, the ARC workspace,
  roster, week-publish and receipt tables) are **frozen legacy** in the shared
  database — they keep the ledger applying in order. Frozen means: do not
  revive a UI, a store, or an engine on top of them in this repo. If a coaching
  product is ever wanted again, that is a new decision, not a restoration.

## The shared-Supabase contract — binds this repo and strengthside

Both repositories write migrations against **one** Postgres:

- **`strengthside` owns exactly twelve tables**: `metric`, `equipment`,
  `exercise`, `strength_block_item`, `prescribed_set`, `prescribed_target`,
  `assigned_session`, `performed_set`, `performed_measurement`,
  `working_max_event`, `pr_event`, `coaching_note` — plus their RLS and the
  `embed-coaching-note` function.
- **This stub owns everything else**, including `auth`, the coach/athlete
  relationship model and `coaches_athlete_anywhere`.
- **Neither repo writes a migration against the other's tables.** Not "prefers
  not to" — a migration here touching a table in that list is a contract
  violation, and both CLAUDE.md files say so.
- A change to `coaches_athlete_anywhere`'s **signature** is a breaking change
  for the strength repo's RLS and must be coordinated by hand. There is no
  automated guard; the shared database will not warn you.
- **Migration filename timestamps are the shared ordering.** Do not prefix, do
  not renumber, and never rename a migration that has been pushed — the ledger
  is shared and renaming an applied migration breaks it for both repos.

## Migrations

- Add a new migration only for a table this repo owns per the contract above.
- Never write a migration against a strength table.
- Every migration must apply cleanly through `node checks/migrations-apply.mjs`,
  which runs the prelude, applies each file in filename order, and then writes
  through the RPCs to prove the RLS and domain constraints behave — text checks
  cannot see a domain list that is out of sync across a constraint and two
  plpgsql bodies.

## Where a check goes

There is one check, and it is the whole test suite:
`checks/migrations-apply.mjs`. It must be able to FAIL — CI turns its
no-postgres SKIP into a hard error so it can never silently verify nothing. Do
not add `--passWithNoTests`-shaped escape hatches. If you add a check, add it to
`.github/workflows/ci.yml` in the same commit; the two must agree.

## Safe workflow

1. Start with a read-only audit and preserve unrelated worktree changes.
2. Run `node checks/migrations-apply.mjs` before handoff.
3. Never run production migrations or destructive data operations without
   explicit approval and a rollback plan. **The database is shared with
   `strengthside`** — a destructive operation here is destructive there.

## Useful commands

```bash
node checks/migrations-apply.mjs   # or: pnpm run verify / pnpm run check:migrations
```
