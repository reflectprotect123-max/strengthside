# Capacitor dogfood shell — The Brain

Wraps `apps/brain-app/` in an Android WebView for device dogfood. Not a Play Store release track.

## Prerequisites

- Node 20+ / pnpm
- Android Studio or command-line SDK (API 34+), `ANDROID_HOME` set
- JDK 17+ (Capacitor 8)

## Sync web → native

From repo root:

```bash
bash scripts/sync-brain-app.sh
cd apps/mobile/capacitor && npm install && pnpm run sync
```

## Build dogfood APK

```bash
bash apps/mobile/capacitor/scripts/build-dogfood-apk.sh
```

APK lands under `apps/mobile/capacitor/android/app/build/outputs/apk/debug/` (and is copied to `/opt/cursor/artifacts/` when that path exists).

## Install on your phone (stable link)

Bookmark this — the URL never changes; CI replaces the APK when we push mobile fixes:

**https://github.com/reflectprotect123-max/strengthside/releases/tag/dogfood-latest**

## Capgo OTA

Web bundle ships via Capgo (`com.hybrid.athlete`). From repo root:

```bash
CAPGO_BUNDLE_VERSION=1.0.x bash apps/mobile/capacitor/scripts/ship-capgo.sh
```

Upload path is `apps/brain-app/`.
