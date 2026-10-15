# Strength builder: fewer steps, same app

Status: design for implementation; this packet changes documentation only.
Audited main: `1c5789a339918bf10a131d4112316b444146f7d1`, 15 October 2026.

## Goal

Keep the current colors, typography, exercise cards, keypad, exercise search, metric selection, supersets and calendar behavior. Make a session editable in one place instead of walking every field through a wizard. The athlete authors the workout; the brain owns weight suggestions, equipment increments and intended difficulty.

This complements the [strength learning plan](https://github.com/reflectprotect123-max/strengthside/pull/258). Builder work does not require waiting for the new learner. Its acceptance contract is the same canonical template → compile → session → logger path. Reconcile newer main/brain changes before implementing; do not overwrite Cursor's updates.

## Global constraints

- Reuse the existing app styling, exercise cards and numeric keypad; introduce no frontend framework.
- Preserve all current metric choices, arbitrary per-set reps/ranges, final first-set-last AMRAP and invisible exercise metadata.
- Keep engine-owned weights, target difficulty and equipment jumps out of the builder.
- Conditioning, cloud schema changes and brain mathematics are outside this builder change.
- No runtime implementation, main merge or Capgo deployment is included in this planning task.

## What the code does today

`LibraryView.create()` enters `instructions`; `wizardNext()` visits warm-up, exercise picker, every lift group's reps page, every group's tempo page, cool-down and overview. With G lift groups, reaching the overview requires 2G+4 Next presses, excluding picker selection and data entry. Six independent exercises require 16 Next presses; this is a code-derived count, not an observed timing benchmark.

Editing an existing template already calls `editorHtml()`, which renders exercise cards together. Reuse that capability. Do not build a separate new composer or add a frontend framework.

Current strengths to preserve:

- `HybridLibrary` owns template transformations and compiles to the logger contract.
- Search patches `#libResults` instead of replacing the entire screen and losing focus.
- Reps/ranges, per-set targets, first-set-last AMRAP, selected metrics and invisible exercise metadata already exist.
- Calendar posting protects days with a workout in progress/completed and asks before replacing another planned session.
- Existing targeted library/UI tests: 26 passed, 0 failed, 0 skipped in the planning audit. This establishes a narrow baseline, not full app readiness.

## Proposed interaction

1. **Create or open session:** immediately show the existing session editor, with title, exercise cards, Add Exercise and Post to calendar.
2. **Add exercises:** reuse search and multi-select; adding returns to that editor with the new cards visible. Cancel returns without changing picks or authored data. Superset creation remains explicit.
3. **Edit a card:** see sets/reps directly; tempo, notes and metric options are expandable within that same card. Filled optional fields have a concise visible summary when collapsed. Keep metric selectors discoverable as a clearly labeled “Metrics” action, never remove them or silently select alternatives.
4. **Post:** use the existing date picker and one explicit confirmation. Posting is optional; a locally saved template is usable later without choosing a date.

No separate required title/instructions, warm-up, tempo, cool-down or review screens. No automatic posting. No additional preview-only page: the editor is the overview. Keep Add Circuit available for existing completion blocks; designing adaptive conditioning is parked.

For an empty new template, expand the exercise picker prompt inside the familiar editor; do not force a separate creation wizard. Title has its existing fallback and remains editable. Session instructions and warm-up/cool-down text live behind labeled optional sections; existing populated text remains visible as a summary. Warm-up text is not the brain's generated ramp sets. Do not insert or delete ramp prescriptions while editing those notes.

“Same app” means reuse the existing component styling and data behavior while removing mandatory navigation. It does not mean preserving 16 redundant Next presses. Record before/after screenshots to verify that changes stay within this agreed layout.

## Editing rules

- Set count, individual reps/ranges, AMRAP and tempo remain independently editable; never assume every set has the same target.
- Preserve arbitrary positive integer reps and increasing ranges, including 5/3/1 and 10/8/6. A range requires the Rep Range metric. A fixed-rep keypad has no range dash; enforce it in the handler too.
- Do not add starting weight, target difficulty, smallest weight jump, precise RPE or AI configuration fields.
- Keep every `HybridLibrary.TRACK` option and both current metric slots. Do not add prescription-value fields for metrics that currently only select logging columns in this change.
- Switching range → reps retains the existing explicit conversion to the lower bound, with a short inline explanation. Do not change metrics merely to accept a pasted range. Switching away from reps preserves the set count and follows existing compile semantics; no hidden e1RM for time/distance.
- Preserve stable exercise ID, equipment metadata, target IDs, group IDs, set purpose, load rule, `toFailure`, notes and tempo across collapse/reorder/save/reopen. Changes to reps do not replace the selected exercise or its history identity.
- The four tempo phase inputs move into the card and use the existing contract. Empty means unspecified. A partially entered tempo cannot silently disappear on posting: explain the incomplete field and focus it. Do not invent missing digits or convert X into seconds. Do not truncate imported values; unsupported formats stay preserved and need an explicit correction. If the learning project's canonical parser is present, reuse its validation; do not implement new tempo load maths in the builder.
- Final AMRAP continues to reference actual first working weight in the logger. Do not expose weight-picking or AMRAP-first-set options.

## State and persistence

Retain one authoritative template in `S.library`; UI state contains only active card, picker selection, expanded sections, keypad binding and errors. No second “quick builder” template format or draft-to-live copy. New templates are saved with the existing behavior and remain in Library if the user leaves; do not silently delete an empty template.

Keep the existing screen name `edit` for the consolidated editor. Route both `create()` and `open(tid)` there. Normalize restored legacy wizard screens to `edit` when their template exists, preserving content; missing templates return to list. Picker/calendar are temporary screens with an explicit `returnScreen: 'edit'`; Back returns to the same template, card and scroll anchor. Do not repurpose old `flow` flags as a new business state.

Bind the keypad to `{templateId, blockId, targetId}`. A delete, reorder, another selected card or restored stale state cannot redirect a keypress to a different set. Errors belong to a specific card/field, not a global warning painted on every card. Escape/back closes the topmost keypad/picker first; editing state stays intact.

Persist text without rebuilding the shell on each character. Commit the active input synchronously before opening the picker/calendar, switching template, navigating back or posting. Preserve IME composition and focus/caret; arbitrary debounce timing must not lose the last character. Existing save failures must not lead to a false “saved”/posted outcome. Template changes must not mutate an already started session's frozen prescription or logged actuals.

## Explicit non-goals

No bulk-edit toolbar, duplicate-workout feature, AI session generator, new exercise taxonomy, drag-only controls, cloud schema migration, brain redesign, timer redesign or conditioning builder in this pass. Add such features only after the simpler path is measured; reducing required navigation provides the main gain without adding more choices.

## Acceptance

Use the [test and speed gates](../../research/strength-builder/test-and-speed-gates.md). A new six-exercise session must require zero generic Next presses, allow direct editing and keep scheduling to one date-selection step plus one confirmation. The number of mandatory navigation transitions must decrease by at least 50% against the recorded baseline; content-entry taps are measured separately. Search and typing keep focus, save on leaving, and no valid data disappears.

All functional, logger-compatibility, Playwright and native interaction gates must pass before claiming ready. Faster completion time is a measured objective, not guaranteed by fewer screens. No merge or Capgo deployment is included in this planning task.
