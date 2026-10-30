# Strength brain v2 simulation

Legacy diagnostic with teacher-informed starts and summary learning; not an online-learning acceptance test. Physical bar mass is now included. This is synthetic product testing, not clinical safety or proof of real-athlete accuracy. Candidate selection used tuning seeds only. Holdout failure falls back to the conservative policy without retuning.

- Selected on tuning: strength-v2-conservative
- Holdout gate: PASS
- Frozen policy: strength-v2-conservative
- Frozen parameter SHA-256: 75bf80f104870dc977514c8a49f951ca73d30770f58166a936f7b04cb4005449
- Holdout sets: 79488
- Baseline miss rate: 3.39%
- Candidate miss rate: 3.39%
- Baseline underloading: 43.16%
- Candidate underloading: 43.16%
- Software invariant violations: 0

The selected policy passed this legacy diagnostic. The app therefore keeps the conservative policy. Assumptions and per-stratum denominators are recorded in the adjacent JSON. Real athlete observations are still required.
