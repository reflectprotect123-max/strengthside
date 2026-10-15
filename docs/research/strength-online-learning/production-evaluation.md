# Production-path synthetic evaluation

cold acquisition through actual session/seed/capture/next/replay; paired athlete-cluster 10000-resample bootstrap. Evaluation seeds were registered before implementation and were not tuned.

Independent paired athletes: 18; repeated scenario pairs: 108; ordinary sets per policy: 10368. Software invariant violations: 0.

|Metric|Default|Online|Paired difference (95% CI)|
|---|---|---|---|
|Target hit|0.03993055555555555|0.03993055555555555|{"mean":0,"low":0,"high":0}|
|Miss|0.0008680555555555555|0.0008680555555555555|{"mean":0,"low":0,"high":0}|

Numerical noninferiority margins: **PASS**, because both policies produced equal scored outcomes. **Personalization benefit is unresolved.** Only one of 108 scenario pairs fitted a curve, first updating at session 31; the other 107 never fitted. Across this zero-history protocol, target hit was only **3.99%** for both policies and miss rate was **0.087%**. Low misses here largely reflect underloading, not accurate prescription.

This exposes an initial-load acquisition limitation when simulated athletes accept every suggestion without adjusting weight. Meaningful athlete-entered starting/ramp loads need a separate evaluation; no hidden teacher load was supplied here. The old established-history 66.62% score is not a comparable protocol. Shipping policy stays default. No release is authorized by these simulations.

- Synthetic truth only; no native R/Dart execution.
- The 66.62% established-history prototype uses a different protocol and is not numerically comparable.
- No real prospective effort outcomes supplied; no clinical or real-athlete superiority claim.
- Rest effects are hidden simulator fatigue only; no rest weight correction is enabled.

See adjacent JSON for subgroup denominators, seed/athlete pairs, acquisition delays, load errors and all invariants.
