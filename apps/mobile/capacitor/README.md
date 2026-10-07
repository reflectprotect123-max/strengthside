# The Strength — dogfood Android shell

Wraps only `apps/athlete/`, the strength product on the original split branch.
Conditioning/Engine is absent. WHOOP, strength calendar, Library, supersets and
rest timers remain. The package id stays `com.hybrid.athlete` for the existing
WHOOP OAuth callback and training ledger. Version 1.2.0 / Android code 120.

The old Capgo plugin is removed so a saved/downloaded combined app cannot
replace the embedded strength app. Updates currently require a new APK.

Build: `bash apps/mobile/capacitor/scripts/build-dogfood-apk.sh` with Java 21,
Android SDK 36 and pnpm 10.33.0. Output: `The-Strength-1.2.0.apk`.

CI publishes tag `strength-dogfood-v1.2.0` from the strength dogfood branch.
Device and cloud imports filter legacy conditioning entities while preserving
strength templates, logged sets, warmups and recovery blocks.
