# Strength brain v2 simulation

Legacy diagnostic with teacher-informed starts and summary learning; not an online-learning acceptance test. Physical bar mass is now included. This is synthetic product testing, not clinical safety or proof of real-athlete accuracy. Candidate selection used tuning seeds only. Holdout failure falls back to the conservative policy without retuning.

- Selected on tuning: strength-v2-u10-b15
- Holdout gate: FAIL (aggregate:underloading)
- Frozen policy: strength-v2-conservative
- Frozen parameter SHA-256: 75bf80f104870dc977514c8a49f951ca73d30770f58166a936f7b04cb4005449
- Holdout sets: 79488
- Baseline miss rate: 8.03%
- Candidate miss rate: 8.07%
- Baseline underloading: 45.87%
- Candidate underloading: 46.96%
- Software invariant violations: 0

The selected policy failed this legacy diagnostic and conservative fallback was retained. The app therefore keeps the conservative policy. Assumptions and per-stratum denominators are recorded in the adjacent JSON. Real athlete observations are still required.
