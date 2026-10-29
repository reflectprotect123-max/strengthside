# Warm-up play lock

`prototypes/strength-builder-play.html` is the frozen warm-up circuit.

Reopen this only when the user explicitly says to change the warm-up. A change updates this note and `checks/warmup-play-lock.mjs` in the same commit. The check is `pnpm run check:warmup-play-lock`, and it runs inside `pnpm run verify`.

## Circuit

The warm-up is one circuit played in rounds. The seed is three rounds of Bike, Row, Run, Ski, and Jump Rope. Adding a movement gives it the same number of rounds as the rest. Playing walks every movement in round 1, then round 2, then round 3. The set number on the card is the round number. After the last step, the screen returns to the warm-up list.

## What each movement tracks

| Movement | Tracks | Starts at |
|---|---|---|
| Bike, Row, Run, Ski | time | 3, 2, 1, then 3:00 |
| Jump Rope | time | 3, 2, 1, then 1:00 |
| Push Downs | reps | 10 |
| 90/90 Hip Switch | reps | 8 |
| Isometric Hold | time | 3, 2, 1, then 0:30 |
| Farmers Carry | metres | 20 |
| Band Pull-Apart | reps | 15 |
| Arm Circle, Bodyweight Squat, Glute Bridge | reps | 10 |
| World's Greatest Stretch | reps | 5 |
| Dead Bug | reps | 8 |
| Inchworm | reps | 6 |

Timed cardio and the isometric hold count in from 3, then run. At 0:00 the circuit advances itself to the next movement. Reps open a REPS keypad. Metres open an M keypad. A step can be skipped, and each finished or skipped step is recorded. After the last step, the screen returns to the warm-up list.
