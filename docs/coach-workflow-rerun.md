# Coach → Athlete fixes and rerun — 18 October 2026

All seven faults from the first audit have fixes and regression coverage in both working branches. No Capgo update, merge, APK or desktop release was performed.

## Real CLI journey

Used Playwright CLI 0.1.22 with named Coach and Athlete Chromium sessions. Created the workout through visible controls: Bike 20 sec; Back Squat 10 / 8 / 6 / AMRAP with explicit 20X1 tempo and block notes; Dumbbell Curl 2 × 6–8; Couch Stretch 30 sec per side. Linked the isolated athlete, assigned 18 October and published.

The athlete received all four activities, the authored targets, kg inputs, tempo and notes. Logged two squat ramps, then 30/32.5/35 kg at 10/8/6 and an AMRAP at the first working set's 30 kg. Selected two minutes of rest; logging reused it. Reloaded at Curl and retained squat results. Logged curls and both timed activities, saw the per-side instruction, and finished with 4/4 blocks and eight prescribed sets plus the two ramps. All ten set records and both engine estimates reached PostgreSQL.

Reopened Coach: it received Completed and the results. Repeated Publish passed the real freeze trigger. Unpublish after reload updated the canonical server row; Athlete refreshed to zero assignments while retaining completed history. Republished and completed another entire workout through the logger, with a 13-rep AMRAP. The latest receipt belongs to the new session and contains ten sets and two canonical estimates. Both sessions' twenty set records remain stored.

## Issues caught and fixed during the rerun

- Finishing while an earlier set upload was active initially attempted the receipt too early. The server rejected incomplete evidence; retry succeeded. The client now waits for final revisions. A subsequent full session produced successful receipt responses without that error. A deterministic regression test covers this race.
- Coach refreshing results could close their details panel. The open state now survives redraw; a browser regression verifies metrics, plates-only labeling, canonical e1RM and panel visibility.

Traces retain the initial failed receipt and test-automation timing retries for transparency. Auth navigation required waiting for sign-in's asynchronous state reset. A second-start attempt first needed the ordinary summary Close button. These locator retries are not hidden passes. Google Fonts were deliberately blocked; favicon 404s are test-server noise.

## Fixes

1. Blank engine-selected loads retain kg; deliberate reps-only workouts remain reps-only.
2. Publish/unpublish recover and persist canonical assignment identity; no affected row is an error.
3. Unchanged publish preserves the frozen snapshot/timestamp; changed content reports a clear duplicate-workout requirement.
4. Editor guards reentrant redraw, retains focus/caret and keeps per-set fields stable.
5. Block notes, explicit tempo and per-side instructions survive publication/import.
6. Account-scoped durable receipts return completion, actuals and canonical athlete estimates to Coach.
7. Preview matches five effort stops, ordinary Average/~3 RIR, and rest beginning on Log set.

## Limits

Authentication and the HTTP adapter were test services. PostgreSQL migrations, RLS, freeze trigger and imported catalogues were real in a disposable database. The platform snapshot endpoint was simulated. This does not test live Supabase authentication/roster, Electron distribution or a physical Android APK. The new Supabase migration must be deployed before the updated clients are released. The previously identified independent Coach working-max calculator discrepancy was outside these seven workflow fixes.
