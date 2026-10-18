# Production-path synthetic evaluation

fresh independent evaluation through actual session/seed/capture/next/replay; cold and explicitly athlete-calibrated arms; paired athlete-cluster 10000-resample bootstrap. Evaluation seeds were registered before implementation and were not tuned.

Independent paired athletes: 18; repeated scenario pairs: 144; ordinary sets per policy: 13824. Software invariant violations: 0.

|Metric|Default|Online|Paired difference (95% CI)|
|---|---|---|---|
|Target hit|0.13599537037037035|0.13585069444444448|{"mean":-0.0001446759259259262,"low":-0.0007957175925925921,"high":0.0002893518518518508}|
|Miss|0.0005063657407407407|0.0005063657407407407|{"mean":0,"low":0,"high":0}|

Statistical gate: **FAIL**. Shipping policy stays default. No release is authorized by these simulations.

- Scores all ordinary working sets including the first; the old prototype excluded the first.
- Athlete-calibrated arms provide an informed second warm-up weight once; they do not demonstrate automatic capacity discovery. Report these arms separately from cold starts.
- Synthetic truth only; no native R/Dart execution.
- The 66.62% established-history prototype uses a different protocol and is not numerically comparable.
- No real prospective effort outcomes supplied; no clinical or real-athlete superiority claim.
- Rest effects are hidden simulator fatigue only; no rest weight correction is enabled.

See adjacent JSON for subgroup denominators, seed/athlete pairs, acquisition delays, load errors and all invariants.
