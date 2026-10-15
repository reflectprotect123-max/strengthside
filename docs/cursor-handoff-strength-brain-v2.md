# Handoff for ChatGPT — strength load card

Date: 15 October 2026. Repo: `reflectprotect123-max/strengthside`.

This note is for a design chat. The load behavior below is on `main`. The sticker idea at the end is not built. Talk about it. Do not implement it unless the user asks.

## Where the code is

`main` has the athlete app, including this load work. The commits are:

- `c4792bd4` — empty bar is 0 kg
- `04d85123` — a heavier warm-up raises the work sets
- `ab29a3df` — each working set takes its kilograms from the chart and its own reps
- `5d335d43` — release name `1.3.11` matches the cache key

Release `1.3.11` is named only. Nothing was published. Android version code is still 140. Capgo was not run.

Older notes that say to start from `feat/strength-brain-v2` are historical. New chats start from `main`.

Design background, if needed:

- `docs/superpowers/specs/2026-10-11-strength-brain-v2-design.md`
- `docs/superpowers/plans/2026-10-11-strength-brain-v2.md`
- `docs/training-contracts.md`

## What the card does now

A workout is a card of lines. Each line has reps. The app writes a weight on each line before the athlete starts.

The chart is the RTS table in `apps/shared/strength-rts.js`. Average means the RPE 7 column. The bar is floored to the plate step, usually 2.5 kg.

Examples, all at Average:

- A 10/8/6 that last used 90 kg for 10 opens at 90 kg, 95 kg, and 105 kg.
- Ten reps at 100 kg puts 107.5 kg on the following 8-rep sets, and 115 kg on a 6.
- Three sets of the same reps share one bar.
- A range such as 6–8 is one bar, loaded for the 6.

The empty bar is 0 kg. The logger shows the words "empty bar". A 20 kg men's bar or a 15 kg women's bar names which bar is in use. Those kilograms are not added into the logged weight.

A warm-up that is heavier than the plan raises the later work lines through the same chart. A lighter warm-up leaves the plan alone. A missed warm-up still reduces the next set. Warm-ups, ramps, easy sets, holds, carries, and missed sets do not become a stored one-rep estimate.

## When the strength estimate rises

The reps on the card stay the same. The kilograms move.

While the athlete repeats the same workout, the first line steps up one plate only if every working set was finished at the top of the reps and felt Average or easier. The other lines follow that one plate. A 10/8/6 at 90 kg becomes 92.5 kg, 100 kg, and 107.5 kg.

The full new estimate rewrites the card when the workout shape changes. An estimate of 140 kg opens a fresh 10/8/6 at 90 kg, 95 kg, and 105 kg. An estimate of 150 kg opens it at 97.5 kg, 105 kg, and 112.5 kg.

During the session, a later line follows the bar just lifted. One hundred kilograms for 10, felt Average, makes the 8 into 107.5 kg and the 6 into 115 kg.

## Idea to discuss, not built

Two lines with the same reps are the same bar today. A double wave, 10/8/6 and then 10/8/6 again, writes 90 kg on both sets of 10.

The idea is one extra choice on a line: normal, or easier. The second 10 can then be a lighter bar. The 8 and the 6 still come from the same chart. When the estimate rises, the first line still moves one plate, and the easier 10 follows that plate while staying lighter. A miss still drops the next bar. A heavy warm-up still raises the work sets. One good day does not rewrite the whole card.

We looked at [mladenjovanovic/STMr](https://github.com/mladenjovanovic/STMr/). It is the recipe that gives each line its own percent. We are not importing it. It is an R package, it uses a different chart, and a higher estimate rewrites every line on the same day. The useful piece is the sticker. Our chart, plate step, warm-up raise, and miss rule stay.

## What a chat should leave alone

- Do not add a Copy training control. WHOOP is the only sync button.
- Do not add a target-effort field or a plate-increment field to the builder. The builder does not ask for those.
- Do not publish, deploy, or change production secrets.
