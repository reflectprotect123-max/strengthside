# Actual conditioning APK structure

Read-only inspection of bundled assets/public/index.html in The-Hybrid-Engine-1.1.1.apk from strengthside release engine-html-v1.1.1. This is the packaged release, not a verified phone's latest Capgo bundle. No changes or live account tests.

## Active layers

1. Fitness setup: age, self-reported cardio fitness, maintain/improve goal, entered or age-estimated maximum HR (208 − 0.7 × age), WHOOP 28-day resting-HR average or manual resting HR. Fitness/goal are stored; they do not automatically create weekly progression. EngineZones uses estimated Karvonen boundaries at 50/70/85% HR reserve or preserves custom boundaries.
2. Daily zone adjustment: LiveWorkout.calculatedZones reads today's recovery and calls HybridBrainKernel.dailyZones. Missing current recovery leaves baseline boundaries unchanged. Lower recovery shifts Green/Red thresholds down by a provisional piecewise HR-reserve adjustment. Blue remains baseline. Today's zone settings freeze when the workout starts. These are product rules, not measured physiological thresholds. The kernel also returns moduleCeiling, but the active calculatedZones return does not propagate it or enforce method choice; do not claim low recovery blocks Red methods.
3. Method library: 12 named methods in Blue/Green/Red groups. Blue: steady state zones 1/2, tempo intervals, zone repeats. Green: power, endurance, zone repeats, threshold. Red: power, endurance, threshold, max intervals. Configuration includes machine, work/rest duration, rounds, optional warm-up/cool-down and method target cues. Saved templates can form a queue.
4. Live execution: category Cardio/Mixed/Strength, workout ready/running/paused/finished, interval ready/warmup/work/rest/cooldown/done. Clock and Bluetooth HR drive time, charts and target alerts. Mixed permits segment changes; only cardio segments accumulate zone time. Strength category here is a timed recording category, not the strength kg/reps logger. Raw sample-supported, interpolated and unknown time are stored separately.
5. Completion: planned interval completion or manual finish leads to session RPE, performance rating and notes, then submit puts the record in liveWorkoutHistory. RPE/performance initially default to 5; the shared brain should track whether the athlete actually answered rather than treating defaults as reported evidence. Store proper start/end timestamps: date:today() at submit and elapsed duration alone are inadequate for precise recency across midnight or delayed submission.
6. Progress/recovery: physiology history, daily/weekly zone minutes, workout detail, weekly target history. Morning check-in: sleep quality, soreness, wellbeing (1–5). Optional bedtime: fatigue/nutrition (1–5), alcohol count. These answers are stored without adjusting scores/zones. Target history explicitly states no automatic progression. Collection/display are implemented; adaptive weekly programming is not established.
7. Persistence: localStorage, private native-file backup, account-specific state handling, authenticated domain snapshots in Supabase. Pack includes conditioning workouts, measurements, settings and weekly targets. Snapshot sync is not itself shared-brain decision making.

## Legacy distinction

The APK bundles an older HybridEngine logger plus adaptive/kernel functions for watts, split and RPM, intended versus reported effort and anchors. Active navigation routes through LiveWorkout. The current timed-method flow logs a session RPE; that does not establish that legacy next-output functions are adapting the active interval methods. Avoid connecting strength to the wrong internal state.

## Shared brain connection

Read completed liveWorkoutHistory and dated check-in/WHOOP records through a stable athlete-owned contract. Keep raw HR data separate; provide activity/machine/method, start/end/duration, completion, explicitly reported effort, sample-supported zone time, estimated zone time, unknown coverage and zone/model versions. Method metadata must preserve activity context: Red minutes alone cannot tell local muscle fatigue.

Centralise the shared daily recovery interpretation and record which inputs have already influenced each recommendation. Conditioning can retain its zone-adjustment model while strength retains its performance/load model. Prevent duplicated or repeated recovery penalties. Strength ramps and completed sets remain primary evidence for today's lifting capability; conditioning cannot directly rewrite e1RM.

A future conditioning planner must be deliberately designed to choose methods, weekly ranges and progression. Those decisions are not currently provided just by sharing Supabase.

Evidence: EngineZones/Onboarding models around 2830–2944; dailyZones around 3437; Standalone methods around 7850; LiveWorkout around 8038–8277; Progress around 8292–8391; snapshot pack around 8981; native adapters around 9383.
