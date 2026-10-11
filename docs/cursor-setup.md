# Cursor project setup

Cursor implements bounded changes; Codex owns review, integration, merging and Capgo releases. The user authorizes merges and releases separately. Skills cannot override that workflow.

## Skills

The saved collection contains 134 local folders: 131 active skills and three alternative versions, plus two cloud instruction snapshots. `.agents/skills` preserves the primary collection. `.agents/skill-alternatives` preserves alternatives; `.agents/cloud-skill-snapshots` contains reference instructions, not working cloud plugins. `.agents/inventory.json` records the saved source locations and versions.

Cursor has the 131 unique skills under `.cursor/skills`, including Replica, Taste, Image-to-Code, Playwright CLI, UI/UX Pro Max, Caveman, Supabase, Superpowers, design styles, Graphify and document skills. Cursor's existing UI/UX Pro Max variant is retained from `.agents/skill-alternatives/ui-ux-pro-max--variant-2`. Other alternatives remain available for deliberate comparison without duplicate skill names being loaded.

Check or restore the local installation from the repository root:

```sh
node scripts/setup-cursor-skills.mjs --check
node scripts/setup-cursor-skills.mjs
```

The installer adds missing files and fails on differing files without replacing them. Fresh clones already contain the Cursor skill files. Choose relevant skills rather than applying all of them to every task. Preserve the app's existing design. Instructions do not install their external dependencies: Graphify, Playwright CLI, image generation, document runtimes, browser control and cloud tools must be checked separately. Cloud snapshots cannot transfer Codex credentials or provisioning into Cursor. Never copy secrets into skills or handoffs.

## Start a task

Read `CLAUDE.md`, `docs/training-contracts.md`, `docs/ownership-halves.md` and `docs/cursor-codex-workflow.md`. Pick strength or engine before editing. Fetch the current owned branch; inspect status and current implementation before relying on dated handoffs. Use Node 22 (CI version) and pnpm 10.33.0. Install dependencies with `pnpm install --frozen-lockfile`.

Strength work starts from current `origin/main`. Engine work starts from the current engine line documented in `docs/ownership-halves.md`; it is a separate branch and must contain engine roots. This setup PR is on main: an engine task must bring over this bounded setup commit or have Codex integrate it into the engine line, rather than merging the strength runtime into the engine branch.

## Build and verify

Strength:

```sh
node scripts/sync-training-core.mjs
pnpm run build
pnpm exec playwright install --with-deps chromium
pnpm run verify:strength
```

Use the sync script after changing canonical shared modules. Use `node scripts/stage-athlete.mjs` when checking the native staging output. Run `pnpm run verify` for integration; it includes the SQL checks requiring Docker. CI additionally installs Postgres and pgvector for migration checks. Do not bypass failed checks or production migrations to make a build pass.

Engine (on the engine checkout):

```sh
node scripts/conditioning/build.mjs
pnpm run verify:engine
node scripts/conditioning/smoke.cjs
node scripts/conditioning/flow.smoke.cjs
node scripts/conditioning/workout-countdown.smoke.cjs
node scripts/conditioning/hr-gap.smoke.cjs
node scripts/conditioning/native-smoke.cjs
```

Inspect `apps/engine-web/package.json` for its current build and test commands when changing the hosted app. `verify:engine` alone does not discover the conditioning `.smoke.cjs` scripts, so run the relevant smoke scripts explicitly. Edit engine `source.html`, then regenerate delivery files with its build script. Strength uses its own athlete source and staging flow: do not substitute one runtime for the other.

## Hand back to Codex

Push the owned branch and open a draft PR. Include the branch and commit, the behavior changed, files changed, tests actually run, known limitations, and whether a change needs a web bundle, native APK, backend deployment or migration. Identify the correct release surface: strength `strength-live` / `com.hybrid.strength`; engine `engine-html`. Do not include credential values.

Codex reviews the actual diff, runs integration checks, fixes issues, and merges after user authorization. Codex publishes Capgo or other production changes only when separately authorized. Cursor does not merge or release. These rules guide the agents; they do not revoke any GitHub permissions.
