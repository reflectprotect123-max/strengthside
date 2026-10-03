# WHOOP sleep and steps integration

**Current correction — 3 October 2026:** WHOOP's [official changelog](https://developer.whoop.com/docs/api-changelog)
records `Cycle.step_count` added on **23 September 2026**, covered by existing
`read:cycles` with no re-consent. The [OpenAPI schema](https://api.prod.whoop.com/developer/doc/openapi.json)
confirms a nullable integer counting steps during the physiological cycle.
The sync handler now reads this official field using existing OAuth, alongside
sleep/HRV/RHR. Zero is valid; missing values are not zero. Values are assigned to
the cycle's local start date and retain cycle ID, boundaries and update time;
they are WHOOP cycle totals, not reconstructed midnight-to-midnight totals.
Steps backfill follows existing cycle pagination where WHOOP provides the field.
No private token, Totem login or new APK/Capgo bundle is needed on app 1.1.6.
The private adapter and setup instructions below are retained as historical trial
material; **the production WHOOP sync no longer invokes the private adapter**.

3 October 2026. **STRENGTHSIDE-DESIGNED** connector and presentation; these are
WHOOP observations, not Morpheus calculations. No proprietary Morpheus formula
was recovered. Existing research retains **CONFIRMED**, **HISTORICAL**, **INFERRED**
and **STRENGTHSIDE-DESIGNED** evidence labels.

## Built

- Official OAuth sync imports dated main-sleep hours from the sum of light, deep
  and REM milliseconds. Awake time and naps are excluded. Recovery-linked sleep
  uses that recovery's date; standalone main sleep uses the local wake date.
  Incomplete, unscored and implausible duration records are excluded.
- Sleep backfill uses the same bounded pagination as HRV/RHR, instead of only
  fetching seven sleeps. The response reports truncation.
- Home, dated history, averages and charts receive sleep and steps. Each Home
  metric keeps its own source and date. Missing data stays missing; zero steps
  is valid. Existing account-scoped plan storage needs no schema migration.
- Optional private steps adapter reads the fixed WHOOP daily STEPS trend endpoint,
  following the schema researched in [Totem](https://github.com/thebriangao/totem)
  commit `f9ac7f18198ccc1ea3a21e4d6bdc83733b4ef702`. This is original adapter code;
  Totem code is installed separately for its login CLI, not bundled in the APK.
- Only one configured StrengthSide account can use the private session. The
  adapter compares the public OAuth WHOOP user ID with the private session ID
  before reading steps. Account mismatches, expired login and upstream failures
  cannot erase stored readings or stop official recovery/sleep sync.

## Current limits

Tested with synthetic API pages and browser sessions, **not the user's live
private account**. Release update: PR #228 merged on 3 October 2026; whoop-sync backend deployed
and Capgo 1.1.6 published to engine-html. Fresh update delivery, ZIP checksum
and app bytes were verified. Private steps remain unconfigured pending login.
The trial reads only the week plot, because longer plots may be aggregates.
Repeated syncs retain dated steps, but this is not a full historical step backfill.
Only dates with an explicit year and daily integer values are accepted. Ambiguous
labels return `no_dated_readings`, never guessed dates. Live validation may require
extending the parser using captured, sanitized evidence.

This proof of concept uses a short-lived private access token. It deliberately
has **no unattended refresh**. Totem's running server supports session renewal,
but that server is not deployed here. Re-run private login and replace the secret
when expired, or build durable account-isolated refresh before continuous use.
Private WHOOP endpoints are unsupported and can change or carry account/terms
restrictions; the existing official OAuth connection is separate and remains intact.
Bluetooth continues to drive live workout HR. No WHOOP writes, Coach, community,
max-HR changes or training progression are added.

## Private login and deployment

Totem source and dependencies are prepared outside StrengthSide at
`/workspace/totem-trial/source` at the reviewed commit. npm did not offer version
1.5.1, so this checkout was built from GitHub with lifecycle scripts disabled.
Node 24 is required. In a **private terminal**, run:

```sh
cd /workspace/totem-trial/source
WHOOP_AUTH_TOKENS_ONLY=1 NODE_USE_ENV_PROXY=1 node dist/cli/index.js auth
```

Enter WHOOP credentials and MFA only into its terminal prompts, not chat or app
HTML. The upstream CLI writes a protected `.env`; on successful login it removes
the one-time password. If login fails, remove `WHOOP_PASSWORD` from that `.env`.
Do not start Totem's HTTP/MCP server or use its broader write tools for this trial.

Using the signed-in StrengthSide user's Supabase UUID (not their WHOOP ID):

```sh
cd /workspace/strengthside
node scripts/conditioning/prepare-whoop-steps.mjs \
  /workspace/totem-trial/source/.env s:<Supabase-user-UUID> \
  /tmp/strengthside-whoop-steps.env Australia/Sydney
supabase secrets set --project-ref orysjncrksmdfabpuftd \
  --env-file /tmp/strengthside-whoop-steps.env
rm /tmp/strengthside-whoop-steps.env
bash scripts/deploy-whoop-sync.sh
```

The helper exports only access token, bound owner and timezone, creates mode 0600,
refuses repository destinations/existing files, and never prints tokens. Supabase
CLI deployment requires its existing securely configured management credentials.
Then test the new HTML against the account before a separately authorized Capgo
release. Removing `WHOOP_PRIVATE_ACCESS_TOKEN` disables private reads; official
sleep sync continues. No migration or OAuth callback changes are needed.

## Checks

`check:whoop-history` includes sleep/date/nap exclusion, paginated backfill, owner
and WHOOP-account isolation, expiry, zero steps and ambiguous/aggregate rejection.
`check:engine-home` checks per-metric dates. The browser WHOOP Home smoke exercises
sync, main-page cards, dated trends and state storage. Repository `verify` remains
the broad check; local migration execution requires PostgreSQL and may be skipped.
