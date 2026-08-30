# Release notes

One-line notes when shipping Capgo bundles or coach desktop shells.

## Capgo (dogfood channel)

| Version | Date | Note |
| --- | --- | --- |
| 1.0.18 | 2026-08-30 | v99 cache + coach builder fixes (delete blocks, superset, drag-drop, reps forward-fill) |
| 1.0.17 | 2026-08-30 | v99 cache bump (superseded by 1.0.18) |
| 1.0.16 | 2026-08-29 | Calendar Mon–Sun grid, publish revert, athlete strength builder toggle |

**Upload:** `CAPGO_BUNDLE_VERSION=x.y.z bash apps/mobile/capacitor/scripts/upload-capgo-bundle.sh`

## Coach desktop (Windows shell)

| Version | Date | Note |
| --- | --- | --- |
| 1.0.1 | 2026-08-30 | Initial Electron shell + GitHub-release shell OTA |

**Release tag:** `coach-desktop-latest` on GitHub Releases.

## Athlete APK (dogfood-latest)

Built with Capgo bundle; see Capgo table for UI contents. Shell version tracks Capgo channel.
