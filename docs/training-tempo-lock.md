# Training tempo lock

The tempo control on `prototypes/strength-training-play.html` is frozen.

Reopen it only when the user explicitly says to change tempo. A change updates this note and `checks/training-play.mjs` in the same commit. The check is `pnpm run check:training-play`, and it runs inside `pnpm run verify`.

## What is frozen

Each lift has its own tempo. Back Squat stays 20X1. Bench Press stays 33X1. Lat Pull Downs and Reverse Hypers stay on No tempo.

The dropdown order is No tempo, then tempos saved on this device, then Add tempo. The saved list starts empty. Add opens four boxes: Lower (way down), Pause (bottom), Lift (X means fast), Pause (top). Save puts that tempo on the current lift and keeps it in the list. Restart restores the seeded lift tempos and leaves the saved list in place. Choosing No tempo clears that lift only.
