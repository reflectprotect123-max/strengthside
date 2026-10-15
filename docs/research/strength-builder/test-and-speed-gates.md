# Builder compatibility, usability and speed gates

Planning audit: `node --test apps/athlete/library.test.js apps/athlete/library-ui.test.js` passed 26 tests, failed 0, skipped 0. No redesigned UI has been built or measured. The following gates apply during implementation.

## Fixed comparison scenarios

Use identical authored content, same device/browser, same catalogue and same initial storage for before/after runs. Preserve both fixture definitions and traces in the implementation results. Navigation counts exclude typing and exercise selections; total deliberate actions include them. Do not count automated field injection as real input.

- **S1 simple:** six independent exercises, three fixed-rep sets each, no tempo or optional text. Choose Back Squat, Bench Press, Lat Pull Downs and three actual catalogue exercises recorded by ID in the fixture. Complete a new template and post it to an unoccupied day.
- **S2 program:** Back Squat 10/8/6 at 20X1 plus final first-set-last AMRAP; Bench Press 3×6–8 at 33X1; explicitly group two accessories as a superset; include session/warm-up/cool-down notes. Post, start and finish the workout in the logger.
- **S3 mixed:** select fixed reps plus weight, range plus weight, seconds-only, meters plus weight and completion/circuit blocks. Preserve the currently supported columns and compile behavior; no e1RM assumptions for non-rep work.
- **S4 edit/resume:** open an existing populated template, change one set and tempo, reorder two exercises, leave/reopen offline, post to a selected date, then delete a template and check assignment cleanup. Verify a previously started session is unaffected.

## Required functional matrix

| Case | Assertions | Test layer / plan task |
|---|---|---|
| Entry and restored state | Create/open share edit; all legacy wizard screens resume data; absent template returns safely | Unit/browser / 1,8 |
| Familiar layout | Existing tokens, cards, keypad and add/post affordances; no extra engine controls | Screenshot/browser / 2,7 |
| Optional fields | Notes/tempo/metrics/role text accessible; summaries expose populated data; no mandatory empty screens | Unit/browser / 2,4 |
| Numeric entry | Any valid fixed/range/per-set targets; fixed keypad has no dash; handler cannot bypass metric permissions | Unit/browser / 3,6,7 |
| Stable keypad binding | Delete/reorder/switch cannot write to another target; invalid buffer cannot silently post old value | Unit/browser / 3,5 |
| Tempo | Empty/20X1/33X1 valid; partial/unsupported imported text preserved and explained; no guessing | Unit/browser / 4,7 |
| All metrics | Every TRACK option remains selectable and saved; both slots retained; explicit range-to-fixed conversion | Parameterized unit/browser / 2,3,6,7 |
| Per-set targets and AMRAP | 5/3/1, 10/8/6, arbitrary ranges; final AMRAP references actual first working set; target IDs retained | Unit/full workout / 6,7 |
| Search and picking | Focus/caret stable; add order and supersets correct; custom exercise/circuit forms still work; cancel restores editor | Unit/browser / 2,5,7 |
| Text saving | Last character then immediate Next destination/back/post survives; IME composition intact; save error cannot fake success | Real DOM/browser / 5,7 |
| Calendar | One date selection + confirmation; protect active/completed days; replacement explicit; duplicate taps idempotent | Unit/browser / 5,7 |
| Template/session boundary | Editing template cannot mutate started workout or logged actuals; no ghost day after deletion | Unit/browser / 5–7 |
| Offline and reopen | Locally saved edits persist across reload/kill; invalid draft retained; no hidden automatic posting | Browser/APK / 5,7,8 |
| Accessibility | Labeled expanders with aria-expanded/controls; keyboard/touch; errors local and focusable; no drag-only reorder | Browser/APK / 2,3,7,8 |
| Long sessions | 20-exercise template remains responsive, scroll stable; local errors do not appear on all cards | Browser/profile / 2,3,7 |
| Old paths | Obsolete mandatory wizard calls removed; only migration references remain; updated full tests retain semantic assertions | Search/unit/browser / 8 |

## Quantitative gates

1. Zero mandatory generic Next presses for S1. Current six-independent-exercise wizard has 16 by control-flow inspection. Verify the baseline through an actual browser run before using it as measured evidence.
2. At least 50% fewer mandatory navigation transitions for S1 and S2, measured from the same start/end states. No extra hidden confirmations, automatic posting or removed fields may manufacture the reduction.
3. Median S1 completion time should improve by at least 20% across five counterbalanced before/after runs on the same device with an operator already familiar with both. Report all individual times and action counts. Repeated runs by one operator are a usability signal, not a general user-study claim. If timing fails despite fewer steps, investigate layout/focus/scroll and remeasure; do not claim quicker until supported.
4. Search result update and card expansion p95 ≤100 ms on the recorded Android device, keystroke-to-visible response p95 ≤50 ms, with no unexpected focus/caret loss. Use a 20-exercise template and realistic catalogue. Avoid flaky latency assertions on shared CI; CI asserts no full-shell render per search/typing, device profiling measures time.
5. Zero lost valid edits, wrong-target writes, changed logged actuals, missing metrics, target-ID changes caused by collapse, or accidental calendar replacements across the scenarios. Performance cannot trade off data correctness.

## Verification and evidence

Run the focused library/UI/session/brain suites and full Playwright browser suite, then `pnpm run verify:strength` and repository `pnpm run verify`. Every required suite must run a nonzero number of tests and have zero mandatory failures; identify unrelated pre-existing failures without deleting assertions or weakening coverage. Narrow planning-audit results are not evidence that the proposed UI passed.

Playwright CLI exploration verifies touch/focus/scroll behavior; committed Playwright tests reproduce the full flow using the actual controls. Save traces/screenshots/results and test the 390×844 and 320×568 layouts plus keyboard navigation. Browser walkthrough must build, schedule, start, log and finish the workout; filling storage directly cannot substitute for this path.

Install a private staging APK from the exact reviewed commit and check keyboard/back, numeric pad bounds, scroll, background/lock, offline draft, kill/reopen and calendar post/reload. Record app version/bundle hash/device/Android. Browser tests cannot validate native WebView persistence by themselves.

Store exact commands, counts, measured actions/times, screenshots and limitations in `docs/research/strength-builder/implementation-results.md`; link final gates in `docs/releases/strength-builder-acceptance.md`. Unrun, failed or blocked mandatory gates remain unresolved. No production merge/Capgo occurs in the planning PR; eventual release follows user instruction after acceptance. Rollback reverts UI code while retaining the same templates and assignments; no database migration or raw-log rewrite is needed.
