# Release notes

One-line notes when shipping Capgo bundles or coach desktop shells.

## Capgo (dogfood + live channels)

| Version | Date | Note |
| --- | --- | --- |
| 1.0.60 | 2026-09-05 | Whoop-style home dials (Sleep/Recovery/Strain); fix sleep stuck at 100%; number over %; cache blank-v179 |
| 1.0.57 | 2026-09-05 | Close retired Workout builder; Engine form rebuilt; scrub old builder doors; cache blank-v176 |
| 1.0.56 | 2026-09-05 | Full Body B + C starters on open-logger athlete pattern (null sets/reps + metric logColumns); cache blank-v175 |
| 1.0.55 | 2026-09-05 | Calendar one-week strip + horizontal scroll-snap; Today kept, month Prev/Next removed; cache blank-v174 |
| 1.0.54 | 2026-09-05 | Seal Adaptive from timed holds + distance carries (weight×metres); holds WorkOverlay-only; cache blank-v173 |
| 1.0.52 | 2026-09-04 | Blank slate — all product engines deleted; name scrub; openVolume; cache v168 |
| 1.0.49 | 2026-09-03 | Library-wide builder columns — load profiles default kg×reps; repair stale reps-only templates (cache v162) |
| 1.0.48 | 2026-09-03 | Fix athlete builder exercise suggest taps blocked by hero panel (cache v160) |
| 1.0.47 | 2026-09-03 | Full Body A foundational starter always-sync + metric logger (cache v159) |
| 1.0.45 | 2026-09-03 | (version reserved; not deployed) |

## Capgo (dogfood channel)

| Version | Date | Note |
| --- | --- | --- |
| 1.0.44 | 2026-09-02 | Builder rest/recap previews (Strength + Engine) + merged superset builder cards (cache v147) |
| 1.0.43 | 2026-09-01 | Polished one-set logger — ghost set stack, difficulty slider, in-row Next, hero inputs (cache v138) |
| 1.0.42 | 2026-09-01 | One-set logger grid — 3-column `.one-set-row` CSS (cache v137) |
| 1.0.41 | 2026-09-01 | Fix strength set logger — `escHtml` fallback when `window.esc` missing (cache v136) |
| 1.0.40 | 2026-09-01 | Fix Start workout preview crash — restore `blockHelpDropdown` stub (cache v135) |
| 1.0.39 | 2026-09-01 | Fix Start session button — restore `startSessionNow()` call; remove debug instrumentation (cache v134) |
| 1.0.38 | 2026-09-01 | Restore warm-up / cool-down text blocks on library starters (cache v133) |
| 1.0.37 | 2026-09-01 | Fix blank boot after library starters; drop Restore hidden UX (cache v132) |
| 1.0.36 | 2026-09-01 | Library starters — Full Body A, Aerobic Conditioning, Recovery (cache v131) |
| 1.0.35 | 2026-09-01 | Restore Full Body A starter in Library after blank slate (cache v130) |
| 1.0.34 | 2026-09-01 | Rep-only LLM volume + OHP WM + weighted pull-up added-load mode (cache v129) |
| 1.0.32 | 2026-08-31 | Remove redundant athlete UI — auto coach sync, no minimal toggle, slimmer Home/Settings (cache v126) |
| 1.0.31 | 2026-08-31 | Athlete dead-code purge — legacy check-in, ER programs, coach gate branches (cache v125) |
| 1.0.30 | 2026-08-31 | Remove athlete coach file import — cloud sync only (cache v124) |
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
