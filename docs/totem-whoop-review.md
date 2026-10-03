# Totem WHOOP integration review

**Correction, 3 October 2026:** official WHOOP cycles expose `step_count` since
23 September 2026 under existing `read:cycles`, with no re-consent. Totem is
not required for steps. Production sync uses the official field; the previous
private steps trial is superseded. See [WHOOP changelog](https://developer.whoop.com/docs/api-changelog).

Reviewed 3 October 2026. Repository: [thebriangao/totem](https://github.com/thebriangao/totem),
main commit `f9ac7f18198ccc1ea3a21e4d6bdc83733b4ef702` (16 September 2026).
Initial review only. A subsequent authorized sleep/steps trial is documented in
[WHOOP sleep and steps trial](whoop-sleep-steps-trial.md). It adds a narrow
read-only adapter and prepares Totem separately for private login; no live
private-account login or Capgo change has occurred.

Totem is a Node/MCP server wrapping WHOOP's private app API. Its README advertises
55 tools, including reads and writes. Source inspection confirms tools for
account HR settings, metric trends, detailed sleep and cloud-reported live HR.
These capabilities have not been exercised against the user's account.

| Possible benefit | Current StrengthSide comparison | Assessment |
| --- | --- | --- |
| Import WHOOP-configured max HR | Onboarding currently accepts an entered maximum or age estimate. | Useful optional input; mark WHOOP setting provenance, since the value may itself be estimated. |
| More trend metrics | Dated HRV/RHR/recovery history is already imported and graphed. | Additional WHOOP stress/VO2 estimate/workout metrics could enrich Progress where available; existing HRV/RHR trends do not require Totem. |
| Detailed sleep timeline | Public sync already obtains sleep records and sleep performance. | Totem adds stage-by-stage timeline and sleep HR; some other sleep metrics remain obtainable from the public API. |
| Journal/behavior impacts and stress | These are absent from our current engine. | Optional explanatory context; do not invent recovery penalties from correlations. |
| Validated projections and freshness | We already track source dates, raw physiology and stale Bluetooth packets. | Useful implementation patterns: typed parsing, recorded source timestamps, cache exclusions for live data. |

Important source findings:

- `src/tools/v2/live_hr.ts` polls `/health-tab-bff/v1/health-tab`. It can return
  last-known BPM with `is_recording:false`; `last_updated_at` must be checked.
  This is cloud data, not a Bluetooth stream or a remedy for a frozen strap.
- `src/tools/v2/hr_zones.ts` reads configured max HR and WHOOP's five zones.
  Those zones are not Morpheus's three dynamic zones.
- `src/tools/v2/weekly_plan.ts` explicitly marks its endpoint experimental and
  unverified on a live account. It is a WHOOP weekly-plan tile reader, not an
  implemented Morpheus progression controller.
- The inspected LICENSE grants MIT-style reuse with copyright preservation.
  It also explicitly warns that private-API use conflicts with WHOOP terms and
  may lead to account restrictions. The licence does not grant WHOOP API rights.
- `SECURITY.md` states one deployment equals one WHOOP account: no multi-tenancy.
  Product integration would require account-isolated sessions, cache and storage.
- Authentication is a separate private-app Cognito session, not the OAuth token
  already used by our Supabase connector. Token renewal/reauthentication and
  server-side handling would add operational work.

Recommendation: continue improving the official OAuth data feed for existing
recovery/history features. Use Totem as a research reference and, if explicitly
requested later, evaluate a separate read-only personal connector for genuinely
missing fields. A product-facing integration should expose a small authenticated
backend subset, never credentials or raw write tools inside the HTML/APK.
Community, WHOOP Coach and unrestricted account writes do not match the engine.

The repository's source code and fixtures demonstrate intended behavior, not
successful access for this user's account. No proprietary Morpheus math was
recovered, and no progression rule should be labeled confirmed from this repo.
