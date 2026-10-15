# Evidence available before implementation

This is a planning snapshot of experiments completed on 15 October 2026. It is not an app release certificate. The production integration described by the accompanying plan has not been built or tested by those experiments.

## What the comparison supports

Established-history experiment, three fixed seeds, 48,384 workouts per method in total:

| Method | Target hit | Missed reps | Load error MAPE |
|---|---:|---:|---:|
| Default curve wrapper | 63.86% | 1.75% | 4.88% |
| Fitted curve wrapper | 67.31% | 1.57% | 4.43% |
| Bounded online prototype | 66.62% | 1.60% | 4.54% |

The online prototype was 0.68 percentage points below fitted and 2.77 points above default. This supports testing gradual personalization, not guaranteeing better real-world performance. The broader tournament's old app core scored 46.60%; that comparison includes differences in current-set policy, so the whole gap cannot be credited to personal fitting.

Synthetic truth included four capacity families, several fatigue mechanisms, noisy feedback, coarse inventory, short rest and alternating tempo. Target hit meant completed prescribed reps with latent true RIR between 2 and 4. Ordinary targets were Average/approximately 3 RIR. First working sets were excluded from scored next-set decisions. Shared wrappers implemented equipment and first-set-last behavior; these were not native features proven in every external repository.

The revised acquisition experiment ran 241,920 workouts per method over three seeds and 40 exposures. Online reached 75.26% versus default 73.92% in exposures 25–40, with little early difference. Its common starting-load calibrator had separate history/teacher initialization; it is not a complete zero-knowledge first-session test. Its scores cannot be compared directly with the established-history table.

An earlier acquisition attempt failed to escape underestimated starting weights because Easy feedback was excluded from curve fitting and there was no adequate separate seed calibration. Keep that failure as a regression. The revised experiment establishes why fast starting-scale calibration and slow curve fitting must remain distinct.

## Limits and competing findings

- Short-rest subgroup favored the rest-aware GymCoach policy; noisy feedback favored default over fitted in the earlier tournament. Combining their features has not yet been validated.
- Prototype RIR values were slider-bin representatives; athletes do not supply exact RIR through these labels.
- The winning prototype did not execute the app's full seed/replay/Supabase/APK path. No native Android, hosted ownership or real-person accuracy claim follows.
- STMr equations were ported and bounded for JavaScript experiments; native R's fitting runtime was not executed.
- Changing tempo/context was caller-controlled in the simulator. Production must implement and test context identity.
- The prototype retains only 128 seen IDs and does not support edited/deleted/revised observations. Production must replay authoritative facts instead.
- The original failed-acquisition script was overwritten during experimentation; its exact run cannot be reproduced from this packet. Rebuild and retain a failing regression in implementation task 10 rather than claiming complete historical reproducibility.

## Source and licensing provenance

| Reference | Inspected source pin | Use |
|---|---|---|
| STMr 0.1.7 | `5fbdef5dae9738b728b8e2669f05f00227268c4c` | MIT reference equations; our runtime should be an original JS implementation with attribution |
| GymCoach | `348c9f64ec8b8988eaf56637c9a3c8c9cd62bbcd` | MIT next-set/rest-aware comparison; not automatically adopted |

Other app comparisons included copyleft code; do not copy their implementation into this runtime merely because their behavior informed research. These hashes identify the prior inspected sources, not a fresh upstream review or proof that all their app features were executed. The full local tournament report remains `/workspace/artifacts/policy-tournament-2026-10-15/report.md`; this plan does not depend on having that temporary directory available.

## Included reproducible subset

`prototype/learner.mjs` and `prototype/learner-checks.mjs` preserve the small experimental candidate byte-for-byte, with hashes in `prototype/SHA256SUMS`. Run:

```bash
node docs/research/strength-online-learning/prototype/learner-checks.mjs
```

These assertions check the prototype's default equivalence, eligibility, nonmutation, limited duplicate handling, diversity and update bounds. They do not reproduce the complete tournament or validate the production requirements. Do not import this module into the app. `experiment-summary.json` is the saved numerical summary; task 10 must generate a new production-path evaluation and preserve its full runnable harness and source/seed provenance in Git.
