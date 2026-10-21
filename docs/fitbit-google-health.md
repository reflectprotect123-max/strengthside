# Fitbit through the Google Health API

WHOOP stays connected. Fitbit is a second source for the same daily check-in: recovery, HRV, resting heart rate, sleep performance, and strain.

Google shuts the Fitbit Web API on 30 October 2026. This app reads Fitbit through the [Google Health API](https://developers.google.com/health). The Cloud project is `hybrid-engine-511921`. The OAuth client ID and secret are Supabase secrets, not files in this repo.

## What the functions call

| Data | Method | Data type |
| --- | --- | --- |
| Daily HRV (RMSSD ms) | `GET .../dataPoints` | `daily-heart-rate-variability` field `averageHeartRateVariabilityMilliseconds` |
| Daily resting HR | `GET .../dataPoints` | `daily-resting-heart-rate` field `beatsPerMinute` |
| SpO2 | `GET .../dataPoints` | `daily-oxygen-saturation` field `averagePercentage` |
| Sleep temperature | `GET .../dataPoints` | `daily-sleep-temperature-derivations` fields `nightlyTemperatureCelsius` and `baselineTemperatureCelsius` |
| Sleep stages | `GET .../dataPoints` | `sleep` summary `minutesAsleep`, `minutesInSleepPeriod`, stage minutes `DEEP` `REM` `LIGHT` `AWAKE` |
| Active zone minutes | `POST .../dataPoints:dailyRollUp` | `active-zone-minutes` |
| Exercise sessions | `GET .../dataPoints` | `exercise` |
| Heart rate | `POST .../dataPoints:dailyRollUp` | `heart-rate` |

The parent path is `https://health.googleapis.com/v4/users/me/dataTypes/{dataType}`. Daily types are listed. Interval types use `dailyRollUp` with `windowSizeDays: 1`. Field names are from the [DataPoint resource](https://developers.google.com/health/reference/rest/v4/users.dataTypes.dataPoints), checked 21 October 2026.

OAuth uses `https://accounts.google.com/o/oauth2/v2/auth` and `https://oauth2.googleapis.com/token`, with `access_type=offline`, `prompt=consent`, and PKCE S256. The refresh token is stored with the same AES-GCM encryption as WHOOP. Access tokens last about an hour and are refreshed on sync. Google Testing mode expires a refresh token after 7 days. `invalid_grant` clears the token and the app shows Reconnect Fitbit.

## Scores

The API has no recovery score and no sleep score. `fitbit-scores-v1` fills those check-in fields.

Recovery, 0–100. For HRV and resting HR separately, compare today with the median of the previous days. At least 7 earlier days are required for a metric, otherwise that metric is skipped. The spread is the median absolute deviation, or 1 when the baseline is flat. HRV above the baseline raises the score. Resting HR above the baseline lowers it. The score is `50 + 15 × mean of those signed z values`, clamped to 0–100. With no usable baseline the recovery field is left empty and HRV and resting HR are still saved.

Sleep performance, 0–100. Half the weight is time asleep against 8 hours. Thirty percent is asleep divided by time in the sleep period. Twenty percent is deep plus REM minutes against 40 percent of time asleep. A missing piece is dropped and the remaining weights are renormalized.

Strain, 0–21, so it fits the existing field. Active zone minutes divided by 15, capped at 21. This is a display mapping, not WHOOP strain.

## Deploy

From the repo, with the Supabase CLI logged into project `orysjncrksmdfabpuftd`:

```bash
supabase secrets set \
  GOOGLE_HEALTH_CLIENT_ID="<oauth-web-client-id>" \
  GOOGLE_HEALTH_CLIENT_SECRET="<oauth-client-secret>" \
  FITBIT_CALLBACK_URL="https://orysjncrksmdfabpuftd.supabase.co/functions/v1/fitbit-callback"

supabase functions deploy fitbit-connect
supabase functions deploy fitbit-callback
supabase functions deploy fitbit-sync
supabase functions deploy fitbit-status
supabase functions deploy fitbit-disconnect
```

The redirect URI registered on the Google OAuth client is `https://orysjncrksmdfabpuftd.supabase.co/functions/v1/fitbit-callback`. `INTEGRATION_ENCRYPT_KEY` is already used for WHOOP and encrypts the Fitbit refresh token too. Do not put the client secret in git.

While the Google app stays in Testing, each athlete reconnects at least every 7 days. Publishing the OAuth app removes that expiry.
