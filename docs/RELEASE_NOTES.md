# Release notes

One-line notes when shipping Capgo bundles or coach desktop shells.

## Capgo (dogfood channel)

| Version | Date | Note |
| --- | --- | --- |
| 1.0.29 | 2026-08-31 | Remove coach toggles — builder + AI always on (cache v123) |
| 1.0.28 | pending | Settings: plain-language coach toggles + helper text (cache v122) |
| 1.0.27 | 2026-08-31 | Full Body A starter → athlete builder v7 (single block, Link supersets, cache v121) |
| 1.0.26 | 2026-08-31 | Athlete builder Link lock between lifts → session superset (cache v120) |
| 1.0.19 | pending | Logger friction: MAX targets, zero rest, rest menu, coach persist debounce, program grid swap |
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
