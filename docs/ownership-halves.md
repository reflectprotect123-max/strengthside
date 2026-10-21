# Ownership

The live product in this checkout is the Engine app at `apps/athlete/engine`. The strength app, the strength brain, and the unwired evidence-platform brain were removed from the repository and stored in an archive outside git.

Work on `cursor/engine-<short-task>`. Run `pnpm run verify:engine` before handoff.

## Engine

Boot an engine chat with:

> Read `.cursor/rules/engine-half.mdc` and `docs/ownership-halves.md`. Work only on the engine task I give you. Branch from the current line as `cursor/engine-<short-task>`. Run `pnpm run verify:engine` before handoff. Do not merge or publish Capgo unless I explicitly ask.

Confirm the checkout contains `apps/athlete/engine/index.html` before editing.

Lane check: `pnpm run verify:engine`.

Release surface: Capgo `strength-live`, package `com.hybrid.strength`, version file `apps/athlete/release.json`. The phone still uses that channel. The bundle is the Engine.

## Shared files

Stop and report overlap before editing:

- `supabase/`
- `apps/athlete/whoop-common.js`

`pnpm run verify` remains the full repository gate used by CI. A host that requires a branch suffix can append it, for example `cursor/engine-<short-task>-c537`. The lane prefix is `cursor/engine-`.
