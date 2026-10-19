# Strength 1.3.17: update without finishing Engine workouts

Engine Settings previously disabled Restart now whenever a live workout was
running or paused. That prevented installing the Fitbit HR fix. Strength's
updater already allowed manual restart after saving; Engine now follows the same
rule. A manual Engine update pauses a running workout, flushes localStorage and
the native file backup, then switches bundles. Paused/ready workouts are kept.
Save/apply failure leaves the existing app available and allows retry. Concurrent
restart taps are coalesced. No workout is marked finished to install an update.

The Engine source is on codex/engine-fitbit-hr-discovery (a0eb5a8d); Strength imports
that source while preserving its existing integration overrides. The Fitbit
pairing/discovery fix from 1.3.16 remains included. No native plugin change is
needed, so this is an OTA release.

Validation: Engine update unit cases cover running/paused/ready states, failed
persistence, duplicate taps, old bundles and server errors. Playwright runs the
real Engine pause/save/reload/restore path for running and paused workouts and
checks unfinished Strength workout update preservation. Native transport/update
smoke also passed with mocked plugins.

Bootstrap for an installation still running the old blocked Engine page: fully
close the Android app and reopen it to reach the root Strength page, then use
Me → Update app. The old Engine JS cannot remove its own restart restriction
until an update loads. Do not clear app storage or finish/discard training merely
to bypass this restriction. Physical Android installation remains user-verified.
