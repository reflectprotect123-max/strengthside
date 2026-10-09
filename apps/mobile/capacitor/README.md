# Hybrid Strength Capgo shell

App ID: `com.hybrid.strength`. Native version: 1.2.4 (124).
Updater: `@capgo/capacitor-updater` 8.52.1. Channel: `strength-live`.

The APK contains the existing strength slider and rest timer screens. Updates download automatically. The JavaScript bridge schedules them with a `kill` delay, so backgrounding an open workout does not apply an update. Close the app fully and reopen to apply a queued bundle. A healthy bundle calls `notifyAppReady` after the UI renders; failed startup leaves Capgo rollback enabled. Native service-worker caching is disabled.

Build: `npm ci`, `npx cap sync android`, then `cd android && ./gradlew assembleRelease`. Use Java 21 and Android SDK 36. The GitHub workflow builds an unsigned APK. Final signing uses the retained 1.2.3 key outside the repository. Never commit signing files or API keys.

Ship a compatible web update: set CAPGO_TOKEN securely and CAPGO_BUNDLE_VERSION to a new version, then run `bash scripts/ship-capgo.sh`. Native plugin changes need another APK. Browser checks are at repository root. No physical phone installation or OTA activation has been tested here.

Native artifact built in Actions run 37904358688. The final signed APK replaces its web assets with the tested source in this branch before zip alignment and signing. Capgo bundle `1.2.4+capgo.1` is linked to `strength-live`; the update endpoint returned it for a simulated Android 1.2.4 request. This verifies server routing, not installation on a phone.
