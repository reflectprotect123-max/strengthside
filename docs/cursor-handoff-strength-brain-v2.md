# Cursor handoff: strength brain v2

Use Cursor from the tested implementation branch rather than from `main`:

```bash
git clone https://github.com/reflectprotect123-max/strengthside.git
cd strengthside
git fetch origin
git switch feat/strength-brain-v2
pnpm install
pnpm run verify
```

If the repository is already open in Cursor:

```bash
git fetch origin
git switch feat/strength-brain-v2
git pull --ff-only
```

Create one Cursor branch for each piece of work:

```bash
git switch -c cursor/<short-task-name>
```

Cursor automatically receives the repository rule in `.cursor/rules/strength-brain-v2.mdc`. Start a new Agent chat with this prompt:

> Read `.cursor/rules/strength-brain-v2.mdc` and `docs/research/strength-brain-v2-validation.md`. Inspect the relevant current code and tests before editing. Work only on the task I give you, preserve existing product rules, add a meaningful regression for behavior changes, run the focused checks, then run `pnpm run verify`. Report changed files, observed behavior, test evidence, and remaining limitations. Do not use Capgo, deploy Supabase, merge to main, or publish anything.

## Best use of Cursor's allowance

Give each Cursor agent a bounded task with an observable result. Suitable independent tasks include:

1. Review one screen or workflow and return concrete findings with file and line references.
2. Add a regression that reproduces one confirmed bug, then fix it.
3. Inspect real athlete evidence exports and propose a versioned policy change without changing the frozen policy.
4. Improve accessibility or layout while keeping behavior unchanged.
5. Review Supabase migrations, RLS, and sync failure recovery without deploying them.
6. Exercise the Android app locally and collect device-specific failures without publishing an update.

Avoid asking several agents to edit `strength-brain-core.js`, `strength-policy.js`, or `strength-memory.js` simultaneously. Those modules share behavioral contracts, so parallel edits create conflicts and can invalidate simulation evidence. Use parallel agents for research, tests, UI, database review, and Android review, then integrate one core-policy change at a time.

## Safe integration

Have Cursor commit each task to its own `cursor/*` branch. Review its diff against `feat/strength-brain-v2`, run the full gate, and merge only the accepted branch. A passing unit test alone is insufficient for changes to builder, logger, memory, or load selection; require the relevant Playwright journey as well.

The current local review APK and validation evidence are documented in `docs/research/strength-brain-v2-validation.md`. They are reference artifacts, not permission to ship through Capgo.
