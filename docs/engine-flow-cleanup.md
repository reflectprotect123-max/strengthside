# Conditioning app flow cleanup

The new HTML previously exposed both the older calendar/logger and the live workout logger. Current zones, weekly targets, catalogue choices and sound settings also appeared in several places. This change consolidates those paths without deleting saved templates, assignments, check-ins or workout history.

- Home owns the current Blue/Green/Red bpm ranges and weekly minute targets. Its label distinguishes current zone guidance from the selected historical week's minutes.
- Settings onboarding is the single fitness setup flow. Its review shows the inputs; the calculated zone summary appears on Home.
- Train and saved conditioning sessions use the live horseshoe logger. Workout zones remain frozen at the start; the redundant zone button, live zone breakdown and weekly-target chart pages are removed. The two HR chart views remain.
- Methods has one catalogue with Blue, Green and Red categories, plus saved sessions. Method instructions retain their intended work/recovery intensities.
- Progress has one range selector. The duplicate current weekly zone summary is removed; historical workout exposure and recorded target progression remain available.
- Sounds open and close inside Settings. The catalogue no longer hosts a second sound entry point.
- Home training/progress shortcuts are removed; the bottom navigation provides those destinations. WHOOP refresh remains in Home and Settings as a contextual shortcut to the same sync function.

## Saved sessions and compatibility

Saved catalogue methods load their recorded configuration, including warm-up, final recovery and cool-down. Older engine-only templates load their blocks into the same logger. Each subsequent block is offered ready for the athlete to start, with between-round recovery preserved. Loading a different session cannot replace an active interval or a finished unsaved workout.

Templates containing unsupported non-engine blocks remain stored and exportable. Loading one displays an explanation rather than silently translating lifting into cardio. Existing assignments are retained, but the calendar interface is retired. Restored old calendar/logger navigation is cleared before rendering the new flow.

All routing, timing compatibility and display changes are **STRENGTHSIDE-DESIGNED**. Recovery equations, HR-gap policy and automatic progression behavior are unchanged; no proprietary Morpheus formulas were recovered.

## Verification

Run `pnpm run check:engine-flow` to rebuild and exercise the consolidated browser flow. The runner checks all 12 method timers, saved-method timing, older engine blocks, data preservation, strength/unsupported-block guards, frozen zone snapshots, persistent sounds, catalogue filters, one range selector and old-navigation restoration.

Also run the existing conditioning onboarding, HR-gap, native-adapter and WHOOP Home browser checks and the conditioning model/storage/update tests. Browser tests use local Chromium and synthetic or mocked account/device data. They do not establish real-phone Bluetooth or production WHOOP behavior. This cleanup does not itself publish a Capgo update.
