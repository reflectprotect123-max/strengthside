# Automatic cardio zone settings

Status: implemented and tested in the new HTML; **not published to Capgo**.

**STRENGTHSIDE-DESIGNED:** estimate three baseline cardio zones with Karvonen:

`boundary_bpm = resting_hr + fraction × (maximum_hr − resting_hr)`

| Boundary | Fraction of heart-rate reserve |
| --- | --- |
| Blue starts | 50% |
| Green starts | 70% |
| Red starts | 85% |

Karvonen supplies the HR-reserve equation. The three chosen fractions are original
StrengthSide defaults, not confirmed Morpheus boundaries or measured thresholds.
The versioned configuration lives in `scripts/conditioning/zones.js`.

Maximum HR is entered explicitly. Resting HR normally comes from the mean of
available WHOOP observations in the preceding 28 calendar days including today,
counting each date once. Inputs, source, coverage window, unrounded mean and model
version accompany the derived baseline. Future and out-of-window observations do
not enter it. An optional explicit resting-HR override remains available.
Missing resting HR produces no automatic zones; the app requests a WHOOP sync or
manual resting HR. It does not substitute a population default. These estimated
zones have low confidence even when the resting-HR history is complete.

**STRENGTHSIDE-DESIGNED:** today's recovery continues to adjust the estimated
Green/Red boundaries through the existing bounded daily model. Blue's lower
boundary remains fixed; its ceiling changes with Green's start. A missing current
recovery leaves the baseline unchanged. This is not a recovered Morpheus formula.

Existing custom boundaries remain active until the athlete selects Calculate
zones. Settings saves apply to subsequent workouts. An explicit save from the
in-workout Zones sheet updates active boundaries and records a zone-history entry.
Strength-only workouts continue to generate zero cardio-zone minutes.

Settings normally shows maximum HR and the observed resting-HR average. Resting
HR override, custom boundaries, manual history entry and backup tools are folded
away. Signed-in WHOOP controls show one main connect/refresh action.

Validation covers reserve arithmetic, missing inputs, rounded boundary ordering,
dated WHOOP averaging, overrides, custom-zone preservation, persisted settings,
frozen workout boundaries and daily recovery adjustment. `check:engine-zones` is
included in `verify`, which is also the CI verification entry point. Browser and
mocked native BLE checks pass; physical hardware verification remains pending.
