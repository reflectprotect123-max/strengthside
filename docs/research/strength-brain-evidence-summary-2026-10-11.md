# What we should build next

Research completed 11 October 2026. The app has not changed. No Capgo publication.

**Recommendation:** keep RTS as the initial weight calculator, then learn from the athlete's actual comparable performance. Keep one engine with two stages: finding an appropriate load, then refining/progressing it. No LLM, no average of three formulas and no automatic max attempts.

## Improve now

1. **Understand every set independently.** Any authored reps/ranges, including 5/3/1; fewer reps are not automatically a max test.
2. **Separate a starter from a calibrated load.** Same-exercise history first; provisional exercise-specific default otherwise. Remember underloading across sessions.
3. **Use real equipment steps.** Your dumbbell ladder, custom overrides, correct per-hand/total units and known minimum loads.
4. **Interpret effort honestly.** Labels cover ranges; Easy gives a direction, not a precise 1RM. Calculate rep changes and feedback together.
5. **Separate today's fatigue from lasting strength.** Later sets, short rest and AMRAP do not automatically lower the fresh-strength baseline.
6. **Handle all outcomes.** Zero-rep misses, skipped/deleted sets, out-of-chart targets and an unmanageable equipment minimum.
7. **Support actual first-working-weight AMRAP.** Do not rewrite completed actual weights when references are later edited.
8. **Keep one source of truth.** Builder, logger, local records and Supabase agree; duplicate writes cannot duplicate learning.

## Simulate before choosing final limits

- Arbitrary prescriptions and ranges, rather than only 10/8/6.
- Two warmups with different reps/rest and their fatigue cost.
- First-session beginners through strong athletes, including equipment minima.
- Biased/noisy effort reporting and conflicting observations.
- Faster calibration versus equipment jumps: measure both underloading and missed reps.
- Different athlete/exercise capacity curves, holdout seeds and individual subgroups.
- Rest, supersets, exercise order and actual final-AMRAP performance.
- Long-term progression, absence and plateaus across up to 50 exercise exposures.
- Offline/retry/edit/delete/recreate and account-isolation replay tests.

## Further investigation

Exact starter kg values, calibration caps, slider weighting and smoothing are not scientifically settled. Do not use a universal related-exercise multiplier. Personal transfer, high-rep prediction and AMRAP-to-next-session progression need additional evidence. Observed rest is often incomplete. WHOOP/conditioning load adjustment and holds/carries progression remain later work.

The equipment exception already tested reduced modeled underloading from 75.4% to 0.2%, but raised modeled misses from 4.0% to 5.4%. That trade-off needs refinement, not automatic acceptance. Synthetic percentages are not expected real-athlete rates.

## Implementation gate

First settle the set/evidence contract, equipment policy and simulation assumptions. Then implement the engine and memory wiring; verify complete workouts with Playwright, backend/offline checks and an Android smoke test. Follow with practical athlete observations. Publish only when the agreed work is finished and tested.

Read [the full research packet](strength-brain-evidence-2026-10-11.md) for the eight modules, formulas, detailed simulation matrix, source links and evidence limitations. It references 14 sources, including primary reviews, RTS attribution and official Peak/Fitbod explanations. Scientific sources were examined through full text where available or explicitly labelled abstract-only access. This is a targeted review, not a formal systematic review.
