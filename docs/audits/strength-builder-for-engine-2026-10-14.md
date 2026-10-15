# Reusing the Strength builder for Engine — audit, 14 October 2026

Reviewed main `5f9db1f5` / release 1.3.10. This supplements the Engine recording/learning audit; it assesses reuse of the current Strength builder, not a completed implementation.

## Verdict

Reuse the visual flow, exercise selection, common input controls and calendar presentation. Extract them into components that accept a product-specific store and typed block editors. Do not copy the current Strength library controller/compiler into Engine unchanged: it will discard unsupported blocks, misclassify circuits and route data into the wrong session/sync domain.

The user's goal is achievable without rebuilding the Strength app, but this is more than adding a couple of metric choices. The session contract and player support must be designed alongside the builder.

## Confirmed blockers

1. **Unsupported blocks are removed.** `HybridLibrary.ensure` only keeps `lift` and `circuit`; compile uses the same filter. A template with a cardio `engine` block and an `emom` block normalizes/compiles to no playable blocks. StrengthOnly cleanup independently excludes conditioning and unsupported kinds.
2. **Circuits are not timed circuits.** The compiler interprets generic circuits as warm-up or recovery instructions based on the title. A circuit named EMOM compiles to warm-up items, with no duration or exercise rotation. Renaming its kind to circuit therefore is not a compatibility solution.
3. **Wizard progression assumes lifts.** `liftGroups` selects only lift blocks. Next advances through reps then tempo for those groups; Engine blocks would be skipped. Editors must be chosen by block type instead.
4. **Number entry is reps-specific.** The builder keypad accepts set rep targets/ranges. Time/other metric cells are blank display cells in the lift card. Tracking a time metric is not the same as prescribing an interval's duration. Reuse styling and shared parsing helpers, then add duration and intensity controls.
5. **Superset is not EMOM rotation.** Linked lifts are grouped and lettered as supersets; no minute schedule, per-side work, switching allowance or minute-end completion exists. EMOM must be explicit.
6. **Calendar behavior differs by product.** Strength assigns one template ID to each date, rejects dates with an existing session, and navigates to Strength Training. Engine currently overrides its calendar action to load a live workout. Shared screens need separate callbacks and product-scoped assignments. A combined calendar with both sessions on one date requires an additional model, not overwriting a scalar assignment.
7. **Local and cloud stores are product-specific.** Strength S/save uses strength brain capture and Strength plan-sync domains. Engine has its own local state and engine-side snapshot sync. Reusing a component must not bind it accidentally to the other product's global S, save, HybridLibrary or LibraryView.
8. **Duplicate block is not implemented in the current Strength builder.** It has add/remove/reorder operations; reorder is a from-to prompt. Duplicate blocks/sessions and better reorder UX are new work. Copies need fresh block/step IDs while retaining exercise references and independent prescriptions.
9. **Search is currently title-only.** The cleaned export's alias/family files are not integrated. Exercise selection UI can be reused, but family/alias search remains an independent enhancement.

Relevant sources: `apps/athlete/library.js` ensure/compile/assignDate/linkSuperset; `apps/athlete/library-ui.js` liftGroups/wizardNext/exerciseCardHtml/openNumberPad/confirmDate/reorder; `apps/athlete/strength-only.js`; `apps/athlete/app.js` save; `apps/athlete/plan-sync.js`; Engine's embedded LiveWorkout overrides and saved-session loader.

## Reuse map

| Piece | Recommendation |
| --- | --- |
| Title and session instructions | Share UI; inject read/write callbacks |
| Wizard header/back/next and draft persistence | Share framework; sequence driven by block types, not fixed reps/tempo stages |
| Exercise picker | Share view/catalog interface; retain stable exercise IDs and product-scoped drafts |
| Card styling and keypad appearance | Share visual components; preserve unit-specific validation |
| Warm-up/cool-down notes | Share instruction editor; distinguish text-only prep from timed warm-up/cool-down |
| Overview | Share layout; dispatch cards and duration summaries by type |
| Date picker and replacement confirmation | Share presentation; use product-aware assignment policy |
| Lift target normalizer and strength compiler | Keep strength-specific; do not reinterpret as Engine timing |
| Superset grouping | Retain for Strength; EMOM rotation gets its own schema |
| Existing Engine methods | Expose as cardio block presets alongside custom blocks |
| Duplication and reordering | Implement as shared session operations with ID remapping |
| Adaptive numerical rules | Outside the builder; consume validated prescriptions and actual evidence |

## Minimum shared contract

A versioned session definition should have stable session/block/step IDs, product, title, instructions and ordered blocks. Give each block explicit discriminated type and a dedicated validator.

For an initial Engine version:

- `cardio_intervals`: available activity choices, selected activity at execution, ordered steps, duration in seconds and intensity `{kind, value, reference}`. A subjective percentage can remain a display cue with kind subjective; no invented watts/HR conversion.
- `emom`: minute duration, total minutes, ordered rotation slots, exercise references, side instruction and hold duration per side. Validate the allotted work fits a minute and leave switching/rest interpretation explicit.
- `exercise_circuit`: ordered exercises and authored rounds/completion criteria, if needed after the first two block types.
- `instructions`: untimed prep/recovery notes, distinguished from timed blocks.

The existing Strength lift blocks keep their validated per-set reps/load rules and prescription metadata. The shared framework should not require an Engine percentage target to live in a rep or weight column.

Keep three separate layers: editable template, calendar assignment, and frozen started-session prescription plus actual results. A later edit or block duplicate must not rewrite completed history.

## User flow for the provided session

1. Instructions and optional warm-up.
2. Add Cardio Intervals: Run/Bike/Row options, 3:00 at 65%, 2:00 at 70%, 1:00 at 75%.
3. Add EMOM: 6 minutes, two alternating exercises, 15 seconds per side.
4. Duplicate cardio block.
5. Duplicate EMOM, retaining its timing but selecting the two ring exercises.
6. Duplicate cardio block.
7. Optional cool-down, overview showing 30 programmed minutes plus separately declared transitions, date posting.

Each cardio block is six minutes. Each EMOM repeats a two-minute rotation three times. Each exercise turn contains 30 seconds of prescribed holds before switching allowance; side changes are not zero-time assumptions. Do not show one 15-second timer as if it covered both sides.

The activity choice can be made once for the session or per cardio block according to the prescription. Record the actual chosen modality so future learning matches it. Do not force all activities to share one output baseline.

## Data/implementation boundaries

Extract a shared builder shell and session operation library into maintainable source modules. Adapt each product through callbacks for storage, catalog lookup, preview, validation and calendar posting. Keep the existing Strength experience intact while adding type-specific Engine screens.

Update Engine's source/import pipeline, not just the pinned generated HTML. Its live player must accept the same contract and switch recording context automatically for cardio versus holds. Existing method presets need a migration/adapter into typed blocks, while old saved sessions remain readable.

Version the snapshot payload and migration so older StrengthOnly filters cannot erase Engine definitions. Unsupported kinds must be preserved/rejected explicitly rather than silently dropped. Existing product separation can remain initially; sharing a builder does not require merging all stored calendars or learned baselines.

## Verification

- 50 current Strength library/UI/session tests passed.
- Isolated production-code reproductions confirmed that Engine/EMOM blocks are dropped, an EMOM circuit becomes warm-up instructions and loses timing/rotation, and Strength cleanup independently excludes those blocks. Harness: `/tmp/strength-builder-engine-audit.mjs`.
- The prior Engine browser audit established ordered engine-only queues, rejection of circuit blocks and the existing calendar override. Those findings are referenced rather than repeating unchanged tests.
- No new Engine builder UI exists yet, so existing tests passing does not demonstrate this proposed feature. No physical APK, production writes or sensor tests were performed here.

## Acceptance checks for implementation

- Build the exact five-block session, duplicate/reorder it, post a date and reopen it with all durations, percentages, sides and exercise references unchanged.
- Zero rest stays zero; explicit and subjective intensity references remain distinct.
- Duplicate IDs are remapped; editing one copy does not alter its siblings.
- Deleting/reordering a block clears stale keypad/editor references.
- Existing Strength 10/8/6, rep ranges, tempo display and first-set-last AMRAP remain unchanged.
- Existing Engine method templates still work after migration.
- Product-scoped save/sync cannot cause another product's filters to erase blocks or merge their workout histories.
- Per-side EMOM schedule and transitions match the overview and saved prescription.
- Started sessions snapshot their prescription; future template changes do not modify completed actuals.
- Offline draft, account switch, cloud revision conflict and restart preserve valid sessions and expose unsupported schema versions clearly.

## Recommended order

First define the block contract and adapters. Next share the builder framework and add cardio/EMOM editors, duplication and posting. Then extend the player and stored step results. Adaptive learning follows only when the prescription-to-player-to-history path is congruent.

This reuses the familiar builder experience, but the type-specific editors, data preservation and player integration are the substantive work. An interface-only prototype is smaller than a reliable APK feature; do not call the former complete delivery of the latter.
