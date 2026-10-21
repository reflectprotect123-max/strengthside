# Keeping the adaptive brain for the Engine

Date: 21 October 2026.

The strength app and the strength brain left this repository. The Engine's adaptive behavior did not. It already lives inside the page athletes open.

## What stays in the app

`apps/athlete/engine/index.html` is the running app. These pieces are what the app does today, and they stay in that file:

- **Live workout.** `LiveWorkout` is the player. It runs the 12 methods, the work/rest clock, Bluetooth and native heart rate, pause and finish, and the Cardio / Mixed / Strength categories. The Strength category here is a timed recording mode. It is not the removed lifting logger.
- **Zones.** `EngineZones` builds Karvonen boundaries from max heart rate and resting heart rate, including a WHOOP resting-heart-rate baseline. Zones freeze when the workout starts.
- **Daily zone adjustment.** `LiveWorkout.calculatedZones` calls `HybridBrainKernel.dailyZones`. Lower recovery shifts the Green and Red boundaries. Missing recovery leaves the baseline alone. This is the adaptive step the live workout actually uses.
- **Readiness and coach.** `HybridBrain` scores readiness and builds the coach packet. The coach sheet posts that packet to the `brain-coach` Supabase function. That function stayed in the repo because the app calls it.
- **History and sync.** Workouts, zone minutes, weekly targets, WHOOP, and account snapshots stay on the Engine's own storage. `PlanSync` still copies the Engine snapshot when the athlete is signed in. There is no extra sync screen.
- **Updates.** Capgo still confirms the running bundle with `notifyAppReady` and does not restart an open workout.

`docs/brain/conditioning-parked.md` and `docs/audits/engine-builder-adaptation-2026-10-14.md` describe this same split from inspection of the packaged app.

## What left

These were a different brain. They decided lifting loads, e1RM, and strength-session evidence. The Engine page does not import them.

- `park/strength-app`, including `strength-brain.js` and `strength-memory.js`
- `apps/shared/strength-*.js` and `training-core.js`
- `evidence-platform/`, the unwired governance brain

They are in the archive outside the repository, with the strength docs, checks, and release scripts.

## What not to turn on

The same page also contains an older conditioning package: `openCond`, `decideNextCond`, `closeCond`, and `HybridBrainKernel.decideNextEngine`. Those adjust watts, RPM, or split from effort. The 12 methods set `manualNoProgression: true`, and the live recorder does not call them between intervals.

Leaving that code in the file keeps the app as it is. Turning it on would change the workout athletes already have. The October 2026 audit says the old path also stores the planned target as if it were measured output, so it is not ready to learn from what the athlete actually did.

Weekly targets are displayed. The page says automatic target progression is not enabled. Fitness level and goal are stored and do not build the next week by themselves.

## How to keep going

Edit the Engine page, or re-import it through `scripts/import-engine-house.mjs` from the conditioning source when that source is the one you mean to ship. Keep one formula in that page. Do not copy the strength brain back in to make conditioning decisions.

The next adaptive step, when it is wanted, is inside `LiveWorkout`: record the actual bout, then let a versioned rule adjust the next comparable bout. That is new work. It is not a reason to restore the strength app.

WHOOP sync, coach chat, zone accounting, the 12 methods, and the live player stay available without that new step.

## What the old code is for

`HybridBrainKernel` v1.0.0, around the `decideNextEngine` block in `apps/athlete/engine/index.html`, is a finished conditioning rule. It is the part worth keeping.

- Open a bike or rower piece from the last confirmed number.
- After the piece, compare the effort you asked for with the effort the athlete reported.
- Echo bike: easier than intended adds 1 or 2 RPM. Harder subtracts 1 or 2. The same effort holds.
- Concept2 watts: easier adds 3% or 5%. Harder subtracts 3% or 5%. The same effort holds.
- An unfinished piece does not get a raise.
- Close keeps an anchor only when two results agree, within 1 RPM or 3% watts.

`HybridEngine.recordEffort` already calls that rule. The 12 methods never reach it because they are saved with `manualNoProgression: true`.

`HybridAdaptive.decideNextCond` is the older, coarser cousin: RPE under the target band raises watts or RPM by 3% or takes 1 second off a split. Over the band cuts 5%. Stopping or an RPE of 10 cuts 8% or adds 3 seconds. `softenOpen` eases the first target when recovery is under 67%. `mapBandFrom2k` turns a 2k time into steady, tempo, threshold, and interval targets.

Using this code means the Engine does not need a new progression idea. The loop is already: start from the last made number, log what it felt like, move the next number a small versioned step, and remember the close. That is the same shape the strength brain used, aimed at RPM, watts, and split.

It does not help if it is switched on as it sits. The bout stores the target it was given, not a measured rower split or bike power. Heart rate, which is what the live workout actually records, is not an input. `decideNextStrength` and the e1RM helpers in the same kernel are lifting rules. They do not change an Engine session.

The useful path is to keep the kernel, feed it a real output when a bike or rower piece has one, and leave the heart-rate methods on their current fixed plans until a bout record exists for them.
