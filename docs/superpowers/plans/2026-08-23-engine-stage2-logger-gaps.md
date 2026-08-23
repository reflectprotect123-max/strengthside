# Stage 2 — Logger gap inventory (Slice 2.1)

Date: 23 Aug 2026. Product surface: Hybrid HTML Engine dial (`renderSimpleCondLog`).

## Already present (classic `train()` path)

- Full interval runtime: `intervalBase` / `toggleIntervals` / `advanceInterval` /
  `syncIntervalClock` / `tickIntervals` / `intervalTask`.
- Gated on `conditioningType === 'intervals'` only (tempo is typed `intervals` via
  adapter `FORMAT_TYPE`; **custom** with work/rest is not gated in).

## What The Engine simple log ignores today

| Gap | Detail |
| --- | --- |
| Interval work/rest clock | `renderSimpleCondLog` only shows elapsed `blockTimer` + minutes/avg HR — no countdown, rounds, or phase |
| Round advancement | `tickIntervals` never runs usefully on simple log (no `#intervalClock`; on finish it calls `train()`) |
| Format on ad-hoc | Stage 1 `applyCondBuilderToSession` stamps `condFmt` / rounds / work / rest; simple log does not consume them for UI |
| Felt-zone credit | Not invented — engine `withFeltZones` exists but Stage 2 deliberately skips felt unless measured/typed provenance is clear |
| Weekly dose | Home CONDITIONING shows **today** zone seconds only — no 7-day aggregate |
| Finish zone split | Cond-primary finish shows minutes / avg / max / load — not Rec/Aer/An/Peak minutes |
| Zone provenance | `result.zoneSeconds` merged from BLE with no `zsrc` (`measured` / `typed` / `none`) |

## Stage 2 approach

1. Persist + consume format fields on the simple-log task (already mostly done).
2. Embed existing interval controls into the **existing** live log card (no redesign).
3. Broaden interval gate to intervals / tempo / custom with workSec.
4. Tag zone-second provenance; weekly aggregate + quiet Home line; finish zone split.
5. Leave/finish 120s prompt and BLE path stay as-is unless broken.

Strength / Library / `@hybrid/strength-engine` remain frozen.
