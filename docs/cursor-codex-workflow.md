# Cursor and Codex collaboration workflow

GitHub `main` is the shared source of truth for the strength app. Cursor does bounded implementation work on a `cursor/*` branch; Codex reviews the diff, runs the integration checks, fixes any cross-system issues, and merges accepted work when the user explicitly asks.

## Two halves, one repo

Strength and the conditioning engine stay in this repo and are worked separately. Read `docs/ownership-halves.md` before editing.

- Strength: branch `cursor/strength-<short-task>` from `origin/main`. Run `pnpm run verify:strength`.
- Engine: branch `cursor/engine-<short-task>` from the current engine line. Run `pnpm run verify:engine`.
- One branch edits one half. Shared Supabase and WHOOP files need a single owner for that change.

## Starting work in Cursor

Open `reflectprotect123-max/strengthside`, then run the checkout commands for the half you are changing (`docs/ownership-halves.md`).

Before editing, Cursor must read:

- `docs/ownership-halves.md`
- `.cursor/rules/strength-half.mdc` or `.cursor/rules/engine-half.mdc`
- `.cursor/rules/strength-brain-v2.mdc` for strength-half work
- `.cursor/rules/codex-collaboration.mdc`
- this document
- any task-specific handoff under `docs/`

Keep each branch limited to one clear task. Do not have Cursor and Codex edit the same files at the same time.

## Cursor's handoff

Cursor should commit and push its branch, then report:

- branch name
- commit hash
- behavior changed
- files changed
- tests actually run and their results
- known limitations or unfinished work

The user can then tell Codex: `Review and integrate cursor/<short-task-name>.`

Codex will fetch that branch, inspect the diff and current contracts, run the relevant unit and Playwright journeys, correct integration problems, and merge only after the result is ready and the user has authorized the merge.

## Ownership and collision rules

- Cursor is well suited to bounded UI, styling, accessibility, and isolated regression-test tasks.
- Codex owns cross-cutting review across builder, logger, adaptive brain, memory, Supabase, Android, and release behavior.
- Only one agent should change adaptive policy or memory contracts at a time.
- Canonical strength mathematics lives under `apps/shared`; never duplicate it in UI code.
- Generated athlete/coach copies must be refreshed through the repository sync script, not edited independently.
- Preserve unrelated work already present in a branch or working tree.

## Required verification

Run focused tests while working. Before integration, run the relevant browser journey and then the repository verification gate where the environment supports it:

```bash
pnpm run verify
```

For browser-only work:

```bash
PLAYWRIGHT_CHROMIUM_PATH=/usr/bin/chromium pnpm run check:browser
```

Do not weaken a regression test to make a change pass. Report setup failures separately from confirmed app failures.

## Release boundary

A pushed branch or merge is not permission to publish the app. Neither Cursor nor Codex may run Capgo, deploy Supabase, publish an APK/release, change production secrets, or overwrite production data unless the user explicitly authorizes that exact action after the finished change has been reviewed.

## Current builder contract

The inline builder retains the photo-style set editor and keypad. It also exposes both tracking-metric selectors and displays the selected metric columns. Rep exercises retain per-set reps, ranges, set controls, and optional final AMRAP. Non-rep exercises such as holds and carries retain their selected time/distance/load metrics without receiving fake rep or AMRAP controls. The saved metric keys and logger contract remain unchanged.
