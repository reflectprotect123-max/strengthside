# The Hybrid Engine — web

Cloudflare Pages web edition of the existing Hybrid Engine, saved under `apps/engine-web` in the existing StrengthSide repository. The web site itself is publicly reachable; athlete data requires the existing account login. Static app files contain only public client configuration, never Cloudflare, Capgo or Supabase administrative credentials.

This is a tested snapshot of Android/Capgo release 1.1.11, with browser metadata and app-shell caching added. See `UPSTREAM.json` for provenance. This folder is a web snapshot of the conditioning app. Changes do not automatically travel between the web and Android releases.

## Live site

https://hybrid-engine-web.pages.dev

This project was published by direct upload. Git integration is not enabled. The Git integration instructions below are for a separate future Git-integrated Pages project; direct-upload projects cannot be switched to that type.

## Cloudflare Pages Git integration

1. Workers & Pages → Create application → Pages → Connect to Git.
2. Authorize Cloudflare for `reflectprotect123-max/strengthside`.
3. Project name: `hybrid-engine-web`; production branch: `main`.
4. Framework preset: None; build command: `node scripts/build.mjs`; output directory: `public`; root directory: `apps/engine-web`.
5. Deploy. Cloudflare supplies an HTTPS `pages.dev` address. No paid plan or custom domain is required for this static setup.

Once connected, pushes to main deploy automatically. GitHub Actions validates the snapshot without handling deployment credentials.

## Direct upload alternative

Use an API token restricted to **Account → Cloudflare Pages → Edit** for your account. Supply it securely as `CLOUDFLARE_API_TOKEN`; supply `CLOUDFLARE_ACCOUNT_ID` separately. Never commit either credential file or paste tokens into issue/chat text.

The tested deployment helper uses pinned Wrangler 4.147.0. With the secure environment fields supplied, run:

```sh
bash scripts/deploy.sh
```

Create a project only once. Cloudflare direct-upload and Git-integrated project types differ: choose the integration before creating it. In this cloud environment, Node 24 network tools need `NODE_USE_ENV_PROXY=1` to use the configured proxy.

## Phone use and limits

On iPhone, open the deployed address **inside Bluefy** for Bluetooth heart-rate broadcast. Safari/Home Screen PWA mode does not support that connection. Native API fallback already uses the standard Web Bluetooth interface. Enable the wearable's HR broadcast, then use Connect HR Monitor.

An app-shell cache allows reopening the public screens offline. WHOOP/account sync requires Internet. The cache never stores account/API responses. A new app version waits for an explicit update; the update button is disabled during running/paused workouts, and local state is saved before reloading.

Existing account sign-in and connected-account WHOOP sync use the existing Supabase backend. Initial WHOOP authorization still uses the inherited native-return connector and needs web-return configuration/testing before calling the new-user linking flow ready. No account registration flow is included. Use a separate athlete account for each person.

Bluefy locked-screen recording is **unverified**. This hosting setup does not guarantee background HR delivery or recording. Native iOS background behavior and browser-specific buffering need physical-phone validation; missing samples must not be invented.

All browser hosting/update adaptations are **STRENGTHSIDE-DESIGNED**. Existing **CONFIRMED**, **HISTORICAL** and **INFERRED** evidence labels remain in the app. No proprietary Morpheus formulas were recovered.

## Local checks

Node 22+; no npm dependencies required:

```sh
node scripts/build.mjs
node scripts/check.mjs
python3 -m http.server 8080 --directory public
```

The initial browser verification exercised category filtering, live HR notifications through a mock Web Bluetooth device, service-worker registration, offline shell loading and workout-safe updates. Real iPhone Bluetooth and production WHOOP data are separate checks.
