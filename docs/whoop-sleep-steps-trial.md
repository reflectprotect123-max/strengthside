# Official WHOOP sleep and steps integration

Updated 3 October 2026. StrengthSide uses WHOOP's official OAuth API for recovery,
HRV, resting heart rate, main-sleep hours and steps. The unused private steps
adapter, its login/export helper and the separate Totem installation were removed
at the owner's request. No private WHOOP session or Totem server is required.

## Steps

**CONFIRMED:** WHOOP's [API changelog](https://developer.whoop.com/docs/api-changelog)
records `Cycle.step_count` added on 23 September 2026 under existing `read:cycles`,
with no new scope or re-consent. The [OpenAPI schema](https://api.prod.whoop.com/developer/doc/openapi.json)
defines a nullable integer counting steps during the physiological cycle.

**STRENGTHSIDE-DESIGNED:** sync assigns observations to the cycle's local start
date, preserves cycle ID, boundaries and update time, and selects the newest
observation without summing overlapping cycles. Zero is valid; missing data is
not converted to zero. These are WHOOP cycle totals, which may differ from
midnight-to-midnight totals. Backfill follows existing bounded cycle pagination.

## Sleep and display

Main-sleep hours sum light, deep and REM milliseconds, excluding awake time and
naps. Recovery-linked sleep uses its recovery date; otherwise it uses the local
wake date. Incomplete or unscored sleep is excluded. Home retains each metric's
source date; history and trends use observed values. Existing account-scoped
storage requires no new database migration. No proprietary Morpheus formulas
were recovered.

App 1.1.6 already displays official steps and sleep after **Refresh WHOOP**.
The official backend correction was deployed and merged in PR #230. Removing
unused tooling needs no new APK or Capgo bundle. Bluetooth remains the source
of live workout heart rate.

## Validation

The history handler tests cover pagination, missing/invalid login, precise HRV,
zero recovery, sleep duration and official steps. Observation tests cover sleep
stage/date/nap handling and official cycle steps: zero, missing/invalid values,
local dates and newest-record selection. Repository `verify` is the broad check;
local PostgreSQL migration application may be skipped when PostgreSQL is absent.
Real account readings can be checked by refreshing WHOOP in the app.
