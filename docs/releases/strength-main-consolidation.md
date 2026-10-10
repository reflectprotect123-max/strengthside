# Strength app consolidation

Main contains the approved strength-only cleanup, Progress hub with daily check-in halo, training history and UI fixes, five-level inline effort slider, manual rest-duration selection with automatic rest start on set logging, and Capgo configuration for com.hybrid.strength / strength-live.

The slider retains the simple demonstration load rule from APK 1.2.4. No new adaptive intelligence, readiness-driven programming or automatic warm-up sets are included. Existing coach-prescribed warm-up blocks remain supported.

The existing signed 1.2.4 release remains available at https://github.com/reflectprotect123-max/strengthside/releases/tag/strength-capgo-v1.2.4. This consolidation also brings in the previously completed Progress and history UI, so main contains additional UI changes beyond that release. This merge does not publish a new OTA bundle. Use the manual Capgo ship workflow for an explicitly versioned web release.

The main APK workflow builds an unsigned release artifact. Sign it with the retained 1.2.3/1.2.4 key before distributing an update; the key is not committed. Existing published APK assets are preserved.

Skill folders and inventories are retained under .agents. Source repositories and records of prior versions remain separate from application engines.
