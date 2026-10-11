# Ownership halves

Strength and the conditioning engine stay in `reflectprotect123-max/strengthside`. They are two working halves of one repo. Folders stay where they are. A second GitHub repo is not required.

Pick one half per chat and per branch. Do not edit both halves in the same branch.

## Strength half

Boot a strength chat with:

> Read `.cursor/rules/strength-half.mdc`, `.cursor/rules/strength-brain-v2.mdc`, and `docs/ownership-halves.md`. Work only on the strength task I give you. Branch from `origin/main` as `cursor/strength-<short-task>`. Run `pnpm run verify:strength` before handoff. Do not edit the engine half. Do not merge or publish Capgo unless I explicitly ask.

```bash
git fetch origin
git switch main
git pull --ff-only
git switch -c cursor/strength-<short-task>
```

Lane check: `pnpm run verify:strength`.

Release surface: Capgo `strength-live`, package `com.hybrid.strength`, version file `apps/athlete/release.json`.

## Engine half

Boot an engine chat with:

> Read `.cursor/rules/engine-half.mdc` and `docs/ownership-halves.md`. Work only on the engine task I give you. Branch from the current engine line as `cursor/engine-<short-task>`. Run `pnpm run verify:engine` before handoff. Do not edit the strength half. Do not merge or publish Capgo unless I explicitly ask.

```bash
git fetch origin
git switch codex/engine-web-cloudflare
git pull --ff-only
git switch -c cursor/engine-<short-task>
```

Confirm the checkout contains one of these roots before editing:

- `packages/adaptive/package.json`
- `apps/athlete/conditioning/index.html`
- `apps/engine-web/package.json`
- `scripts/conditioning/build.mjs`

`origin/codex/engine-web-cloudflare` is the known engine line. If that branch no longer holds those roots, stop and name the branch that does.

Lane check: `pnpm run verify:engine`.

On a strength-only checkout, including current `main`, that command exits 1 and names the missing roots. Switch to the engine branch. Do not add engine files to `main` just to turn the command green.

Release surface: Capgo `engine-html`.

## Shared files

These files serve both halves. Only one half edits them at a time:

- `supabase/`
- `apps/athlete/hybrid-integrations.js`
- `apps/athlete/plan-sync.js`
- `apps/athlete/whoop-common.js`
- `apps/shared/whoop-common.js`

`pnpm run verify` remains the full repository gate used by CI, including coach checks. Each half's lane command is the check you run while staying inside that half. A host that requires a branch suffix can append it, for example `cursor/strength-<short-task>-5b70`. The lane prefix still has to be `cursor/strength-` or `cursor/engine-`.
