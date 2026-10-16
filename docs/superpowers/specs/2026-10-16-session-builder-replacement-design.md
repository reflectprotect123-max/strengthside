# Session builder replacement

Status: agreed in chat on 16 October 2026. This spec records that agreement.

## Goal

The three play experiences replace the athlete Library builder. A session is the warm-up circuit, then the lift cards, then the cool-down circuit. Start Session plays that session in the logger.

## What the athlete sees

1. **Warm-up.** The locked circuit in `prototypes/strength-builder-play.html`. Three rounds. Bike, row, run, and ski start at 3:00. Jump rope starts at 1:00. The isometric hold counts 3, then runs. Lifts and stretches take reps. The carry takes metres. Next appears at 0:00.
2. **Lifts.** The training cards in `prototypes/strength-training-play.html`. Every lift is on one screen. Sets, reps, ranges, a final AMRAP, and supersets stay. Tempo is the dropdown on the card: No tempo, saved tempos, then Add with the four boxes (Lower, bottom pause, Lift, top pause). The metric list is Reps, Rep Range, Weight (lb), Weight (kg), Weight (%), Time (mm:ss), Seconds, Miles, Yards, Meters, and Feet. The builder does not ask for a target weight.
3. **Cool-down.** The circuit in `prototypes/strength-cooldown-play.html`. Same rounds. Seconds and reps only.

The old warm-up note, the tempo wizard page, and the old cool-down note are gone.

## How it sits in the app

`LibraryView.create()` opens the warm-up circuit for a new template. Next opens the lift cards. Next opens the cool-down circuit. Post to calendar stays the existing calendar step.

A new template seeds Bike, Row, Run, Ski, and Jump Rope at three rounds. The cool-down starts empty. Saved lift cards stay. An old written warm-up or cool-down note is left in session instructions. It is not converted into movements and it is not deleted.

The play files stay the locked references. The behavior moves into `apps/athlete/library.js` and `apps/athlete/library-ui.js`. The prototypes are not copied into the APK as separate pages.

## Logger

Start Session uses the logger path already on this branch. Warm-up blocks use `role: 'warmup'`. Cool-down blocks use `role: 'cooldown'`. The logger plays warm-up rounds, then the lifts, then cool-down rounds. Timed prep starts its countdown. The hold counts 3. Prep does not ask for effort. A main lift opens on Ramp 1 of 2. There is no skip control. The working sets come after the two ramps.

## APK

The athlete app is what the Android shell loads. Package `com.hybrid.strength`. Channel Capgo `strength-live`. After the Library and logger work, stage `apps/athlete` and build a local debug APK with `bash apps/mobile/capacitor/scripts/build-dogfood-apk.sh` for review. Capgo publication of that build is the ship step and waits for an explicit publish yes. It is not part of the implementation tasks.

## Out of scope

Do not run Capgo or publish a release. Do not change the warm-up lock or the tempo lock. Do not add metres, watts, calories, linear weight progression, inches, velocity, or other to the cool-down.
