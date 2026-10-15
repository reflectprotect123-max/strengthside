# Calibration follow-up protocol

Registered before evaluating the changed runtime: fresh seeds 8201473, 9302581,
10403689; 6 athletes per seed; 32 sessions; 8 scenario pairs per athlete.
The previous evaluated seeds 4912731, 5912731, 6912731 are retired for this change.
Their original results and source hashes are retained in baseline-2026-10-16/.

The first six scenarios retain the original cold-start protocol. Two additional
scenarios model an athlete explicitly entering a useful load in their second
warm-up of session one through the existing weight entry. That external input is
72% of the synthetic athlete's baseline capacity, floored to the equipment grid.
The engine is not given baseline capacity, an exact RIR for Easy, or extra sets.
These two arms use a varied first-set prescription (5, 8, 10 reps) to assess
whether repeated eligible evidence can eventually fit a personal curve. The
second includes noisy/bias feedback. Neither arm proves cold-load discovery.

Compare paired default versus online within each scenario. Keep the original
noninferiority margins and 10,000-resample athlete-cluster bootstrap. Report
cold versus calibrated outcomes separately. Do not tune parameters against these
outcomes. Equal poor outcomes cannot justify activation. This experiment does
not close physical device, hosted sync, or prospective athlete validation gates.
