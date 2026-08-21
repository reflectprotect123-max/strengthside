# Claude Code operating contract — TheStrengthEngine

This repository is the strength half of THE Hybrid System, split out of
`reflectprotect123-max/THE-HYBRID-ENGINE1` on 19 August 2026 and pointing at the
**same Supabase project**. It owns strength prescription, logging, working-max and
PR tracking, and progression. Nothing else.

Read `handoff.md` before making changes — it records where this tree came from, what
is built, and what is not.

## Where this came from, and why the history looks short

`packages/strength-engine`, the five strength migrations and the
`embed-coaching-note` edge function were copied out of the hybrid repo at `34dfab4`.
Their git history stayed there, the same way every other deletion in that repository
kept its history rather than carrying it. If you need to know why a line in
`resolve.ts` reads the way it does, the answer is in THE-HYBRID-ENGINE1's log, not
this one.

**Four things could not be copied verbatim.** Each is a real dependency the split
plan's file list missed, and each was found by running the tree rather than reading
it:

1. `scripts/gen-metric-registry.mjs` came too. `metric.test.ts` shells out to it at
   repo root to prove `metric.ts` has not drifted from the migration seed. Without
   it that test fails `MODULE_NOT_FOUND`, which reads like a broken test rather than
   a missing file.
2. The `@hybrid/shared-core` dependency was **dropped**. `strength-engine` declared
   it and imported nothing from it — zero references in any source file. A
   `workspace:*` dependency on a package that does not exist here fails install. The
   package was already standalone; nobody had noticed.
3. `supabase/functions/tsconfig.json` gained `lib: ["ES2022", "DOM"]`. `tsconfig.base`
   is ES2022 only, so `fetch` and `Response` were unresolved.
4. `packages/strength-engine` gained `@types/node`, for `import.meta.url`.

## The shared-Supabase contract — binds this repo and the hybrid one

Both repositories write migrations against **one** Postgres. This is the rule that
keeps that from becoming a disaster:

- **This repo owns exactly twelve tables**: `metric`, `equipment`, `exercise`,
  `strength_block_item`, `prescribed_set`, `prescribed_target`, `assigned_session`,
  `performed_set`, `performed_measurement`, `working_max_event`, `pr_event`,
  `coaching_note` — plus their RLS and the `embed-coaching-note` function.
- **The hybrid repo owns everything else**, including `auth`, the coach/athlete
  relationship model, and `coaches_athlete_anywhere`.
- **Neither repo writes a migration against the other's tables.** Not "prefers not
  to" — a migration touching a table this list does not name is a contract
  violation, and both CLAUDE.md files say so.
- A change to `coaches_athlete_anywhere`'s **signature** is a breaking change for
  this repo's RLS and has to be coordinated by hand. There is no automated guard for
  this; the shared database will not warn you.
- **Migration filename timestamps are the shared ordering.** Do not prefix, do not
  renumber, and never rename a migration that has been pushed — the ledger is shared
  and renaming an applied migration breaks it for both repos.

## Product ownership

- `@hybrid/strength-engine` owns strength prescription resolution, load rounding,
  e1RM, working-max tracking, PR detection, exposure classification, calibration and
  progression. It is **pure functions and types — zero I/O, zero React.** Callers
  inject data via `ResolveCtx`-shaped parameters. Keep it that way: the moment it
  reaches for a database client, every consumer inherits that dependency.
- The package name is still `@hybrid/strength-engine`. It was not renamed on the
  split, because renaming it would have touched every import in a tree that had just
  been proven green — a rename is a change to make deliberately, not as a side effect
  of moving house.

## Athlete app — one surface

**The product athletes use is the Hybrid HTML app we are building now.** Nothing
else is the app.

- Edit **`apps/mobile/prototype/hybrid-app/index.html`**, then
  `bash apps/mobile/sync-hybrid-html.sh`. Play
  `apps/mobile/THE-Hybrid-App.html` (or the githack / Update button).
- Expo Home, `prototype/home.html`, and `prototype/pwa/` were **deleted**.
  Do not recreate them. Do not run Expo to see the app.
- `apps/web` is an engine bench, not the athlete product.
- `@hybrid/strength-engine` stays the pure decision layer. The HTML app is the
  only place athlete screens get built until a later, explicit rewrite.

## Pain and illness are safety flags, not readiness penalties

Carried from the hybrid repo, and it binds here because this repo now holds the
`pain` metric and the `pain_blocked` exposure class.

- Do **not** move recovery, pain or illness logic into a specialist engine.
- Do **not** use HRV as a pain, injury or illness gate.
- A pain-blocked exposure does **not** count toward calibration. That is deliberate:
  three sessions an athlete pushed through in pain are not three sessions of evidence
  about what they can lift.

**Know what this repo does NOT do.** The hybrid repo deleted its safety layer on
14 August 2026 — `@hybrid/auto-coach` held sessions on a pain or illness flag, the
owner was told deleting the package deletes the stop, was offered the ~10-line
alternative, and chose to delete all of it. The flags are still raised. **Nothing
consumes them.** This repository inherits that state: it classifies a pain-blocked
exposure for progression purposes, and it stops nothing. If a stop is ever wanted
back, it is a new decision, not a restoration.

## Where a test goes

Tests are **colocated**: `src/foo.ts` is tested by `src/foo.test.ts`, in the same
directory. No exceptions. A test that covers a contract across several modules sits
with the module it mostly exercises, named for the contract.

`test/` is for things that are **not** tests — fixtures and golden vectors. If you
find a `*.test.ts` under `test/`, it is in the wrong place.

Do not "tidy" a directory out of the vitest `include` globs: a test that stops being
collected does not fail, it silently disappears, and the suite still reports green.

## Checks have to be able to fail

This repository inherits a set of hard-won rules about verification, every one of
which was learned by shipping something broken:

- **A check that exists and does not run is worth very little.** If you add one, add
  it to `.github/workflows/ci.yml` in the same commit.
- **A check that runs in CI and not in `verify` is the same trap from the other
  side.** The two lists should agree; where they cannot, write the reason next to the
  difference.
- **A check that cannot fail is worse than no check.** When a guard's target is
  deleted, delete the guard — do not leave it asserting nothing. That is the
  decorative-guard shape the hybrid repo paid for repeatedly.
- **An excluded check is a claim that ages.** Say why in the workflow, and expect to
  be wrong.
- **A missing scan directory is a FAILURE, not a crash.** The hybrid repo hit
  crash-instead-of-fail three separate times, where `readdirSync` threw ENOENT and
  killed the process before it could report anything.
- **`--passWithNoTests` is banned.** It makes "a test that stops being collected does
  not fail, it silently disappears" permanently true.
- Re-recording a baseline to turn a red run green is never the move. It is a decision
  to take out loud.

## Known environment gap

`checks/migrations-apply.mjs` fails at `create extension vector` in
`20260819_phase_f_knowledge_base.sql` on any cluster without pgvector installed at
the OS level. Supabase's hosted Postgres has it preinstalled. This is a known gap,
not a defect — do not "fix" it by removing the extension.

## Safe workflow

1. Start with a read-only audit and preserve unrelated worktree changes.
2. Keep decision logic pure and add a test before changing a rule.
3. Run `pnpm run verify` before handoff.
4. Never run production migrations or destructive data operations without explicit
   approval and a rollback plan. **The database is shared with another repository** —
   a destructive operation here is destructive there.

## Useful commands

```bash
pnpm install
pnpm run typecheck
pnpm run test
pnpm run verify              # typecheck + test + migrations check
```
