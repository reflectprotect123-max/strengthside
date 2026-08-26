# TrainHeroic → THE Hybrid (history import)

One-way import of **performed training history** from a TrainHeroic account
export. Produces a backup file the athlete app already knows how to read.

**This does not touch the builder.** No templates, no programme structure, no
saved workouts are emitted. Only what was actually lifted.

## Use

```bash
unzip trainheroic-userData-export-*.zip -d /tmp/th-export

# See what is recoverable without writing anything:
node tools/trainheroic-import/import-trainheroic.mjs /tmp/th-export --audit-only

# Write the importable backup (default = anchors only):
node tools/trainheroic-import/import-trainheroic.mjs /tmp/th-export --out ~/THE-trainheroic-import.json

# Optional: include calendar workout history too
node tools/trainheroic-import/import-trainheroic.mjs /tmp/th-export --with-sessions --out ~/THE-trainheroic-import.json
```

**Default is anchors only** — working maxes, PR events, and exercise names.
No completed sessions are written into Calendar. Dogfood starts fresh;
percentages resolve against the seeded working maxes. Pass `--with-sessions`
only if you want the full history visible on Calendar.

Then in the app: **Settings → import backup** (or Capgo OTA auto-seed). The app writes a
recovery snapshot of your current state before merging, so the import is
reversible by re-importing that snapshot.

### OTA auto-import (Capgo dogfood)

The same JSON can ship inside the Capgo bundle so history lands without a
manual file pick:

1. Generate the import file (above).
2. Upload with the seed bundled:

```bash
export TRAINHEROIC_SEED_FILE=~/THE-trainheroic-import.json
export CAPGO_BUNDLE_VERSION=1.0.3
bash apps/mobile/capacitor/scripts/upload-capgo-bundle.sh
```

On next OTA update, the app fetches `./seeds/trainheroic-import.json` once,
merges silently, and records `meta.trainheroicSeedId`. A pre-merge recovery
snapshot is kept in `localStorage` under `the-pre-trainheroic-ota`. Re-import
that snapshot from Settings if you need to undo.

To refresh history after a new export, bump `seedId` in
`import-trainheroic.mjs` and upload a new bundle.

`strength-bundle.js` must exist. If the run complains it is missing:

```bash
bash apps/mobile/prototype/hybrid-app/build-strength.sh
```

## What it emits

| Emitted | Notes |
| --- | --- |
| Completed sessions | Grouped per performed day, strength tasks only |
| Exercise catalog | Deduped names, one id per lift |
| Working max events | Seeded per lift, `auto_estimate` / Epley |
| PR events | Per rep-count, replayed through the engine's own detector |

Deliberately **not** emitted: templates, conditioning blocks, coach notes,
messages, team data, readiness surveys.

## Why the numbers need cleaning first

The export is a prescription log that sometimes contains performance. In a real
2024–2026 export, roughly **96% of rows had nothing logged in them** — they are
assigned sets the athlete never typed into. Three defects affect the rest, and
each is handled explicitly in `parse.mjs`:

1. **Every load is pound-encoded regardless of its unit label.** Rows labelled
   `kilogram` divide by 2.20462 into whole kilos exactly as `pound` rows do.
   Some are labelled `percent` while holding a pound-encoded load — `8 rep x
   220.46 percent` is 100 kg, not 220% of anything. A `percent` value at or
   below 100 is genuinely ambiguous and is skipped rather than guessed at.
2. **A few rows have reps and load transposed.** `90, 90, 90 rep x 13.23,
   17.64, 17.64 pound` is 90 kg for 6/8/8, not 90 reps at 6 kg. Left alone
   these wreck e1RM, so they are detected, corrected, and **counted in the
   audit** — a silent correction gives no way to check the guess.
3. **Exercise names collide** on case, punctuation, spacing and plural.
4. **Naming rules** (`aliases.mjs`) fold coach typing noise:
   - No prefix = barbell. `DB`/`KB`/`Cable`/`Trap Bar` = different implement.
   - `Barbell Bench Press` → `Bench Press` (redundant prefix stripped).
   - `Deadlift Sumo` → `Sumo Deadlift` (word-order flip).
   - Variants stay separate: `Pause Back Squat`, `Deficit Deadlift`, `Strict Press` ≠ `Shoulder Press`.

## Working max seeding

A working max is seeded only for lifts with **at least 3 separate logged days**,
taken as the best Epley e1RM across the **6 most recent logged days** for that
lift, rounded **down** to a 2.5 kg step. Down, because the working max is what
future percentages resolve against — rounding up prescribes a load that was
never hit.

Anchors last logged more than 180 days ago are still imported but reported as
`[stale]`. They are history, not a number to programme against without a
re-test.

## Verify

```bash
pnpm run check:trainheroic-parse
```

Runs in `verify` and in CI.
