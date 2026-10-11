# Handoff for ChatGPT — photo builder keypad

Date: 11 October 2026. Repo: `reflectprotect123-max/strengthside`.

## Where the change is

- Branch: `cursor/photo-builder-5b70`
- Commit: `130f20b5` — `Replace the exercise edit sheet with the photo keypad.`
- Base: `origin/feat/strength-brain-v2` at `280feed8` (strength brain 1.3.5, already on Capgo `strength-live`)
- Draft PR: https://github.com/reflectprotect123-max/strengthside/pull/245
- This build has **not** been uploaded to Capgo.

`cursor/install-listed-skills-5b70` is a separate branch that only installs agent skills. It is not this UI change.

## What the user asked for

The session-template builder was too many taps. Reference phone photos showed one session page, a set table, and a docked keypad. The user then said to build that, and that the keys must match those photos exactly. They do not want the blue Save / Clear pills.

## What the builder does now

A lift on a session template is edited in place. There is no Edit exercise sheet, no shared Reps box, no “Edit each set” switch, and no metric dropdown on that card.

Each lift card shows:

- Letter, title, Delete, Done
- The prescription line, for example `3 x 8` or `10 / 8 / 6 / AMRAP`
- Notes
- A grid: set number, Reps, Kg or Lb
- `− Set +` to add or remove a working set (minimum 1, maximum 12)
- Add final AMRAP / Remove AMRAP

Tap a rep cell. The photo keypad opens:

- Big value, grey cursor on the side being edited, label `REPS`
- Chevron closes it (`aria-label` `Close keypad`)
- Outline circle keys, not filled pills
- Right column is `>` and `<`
- Bottom row is `–`, `0`, and backspace
- No Save, no Clear, no decimal on this pad

Typing updates that set immediately. The first digit replaces the current number. `–` or `>` starts the high side of a range (`6` then `–` then `8` becomes `6-8`). `<` moves back to the low side. Backspace deletes from the active side.

Identical working sets display as `3 x 6-8`. Unequal sets display as `10 / 8 / 6`. A final AMRAP appends `/ AMRAP`.

AMRAP is still an explicit last target with load rule `first_working_set`. The reps cell reads `AMRAP`. The weight cell reads `Set 1 weight`. The weight cell is not an editor.

## What did not change

- The workout logger keypad is unchanged. While logging a set it still has Save, and Clear is not the photo keypad.
- Kg / Lb cells on the template do not store a prescribed weight. The strength brain still chooses the logged load.
- No video thumbnail, working-max editor, or chat tab was added.
- Canonical strength math is untouched: `apps/shared/strength-targets.js`, `strength-equipment.js`, `strength-rts.js`, `strength-policy.js`, `strength-brain-core.js`.
- Policy is still `strength-v2-conservative`.
- Capgo `strength-live` is still bundle `1.3.5` for `com.hybrid.strength`.

## Files

- `apps/athlete/library-ui.js` — inline lift card, photo keypad, `nudgeSets`, live rep editing
- `apps/athlete/library.css` — `.photo-pad`, `.photo-key`, set grid, outline stepper
- `apps/athlete/library.js` — `rxFor` collapses identical working sets to `N x reps` and appends `/ AMRAP`
- `apps/athlete/library-ui.test.js`
- `checks/browser/session.spec.mjs`
- `checks/browser/strength-brain-v2.spec.mjs`
- `checks/browser/metrics.spec.mjs`
- `checks/browser/update.spec.mjs` — mocked update version is `1.3.6` because the app release is already `1.3.5`

## How to author 10 / 8 / 6 / AMRAP

1. Add the exercise. The set rows are already on the page.
2. Tap set 1 reps, type `1` `0`, close.
3. Tap set 2 reps, type `8`, close.
4. Tap set 3 reps, type `6`, close.
5. Tap Add final AMRAP.

Do not look for Edit each set. That control is gone.

## Checks that passed on this commit

- `node --test apps/athlete/library-ui.test.js apps/athlete/library.test.js`
- Playwright: `session.spec.mjs`, `strength-brain-v2.spec.mjs`, `update.spec.mjs`
- The full `pnpm run check:browser` run before the last assertion tweak had two failures, both fixed: the AMRAP label, and the updater mock still offering `1.3.5`.

## Product rules that still bind

- Do not publish Capgo, deploy Supabase, or merge to `main` unless the user explicitly asks after seeing this UI.
- Logged weight still wins. Completed AMRAP weight is not rewritten when set 1 changes afterward.
- Ramps, Easy sets, misses, holds, and carries still do not become e1RM evidence.
