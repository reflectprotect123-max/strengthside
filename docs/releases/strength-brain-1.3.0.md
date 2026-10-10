# Hybrid Strength 1.3.0

The strength APK now uses the conditioning app's recovery-home layout and the same authenticated Supabase WHOOP owner lane (`product=strength`, owner `s:<signed-in user id>`). The shared owner is intentional: connecting WHOOP once makes the existing physiology history available to both apps. Training logs remain in the strength domain.

Home includes recovery, HRV, resting heart rate, actual sleep hours, steps, sleep performance and strain. Morning sleep quality/soreness/wellbeing and optional bedtime fatigue/nutrition/alcohol answers save individually by date through the existing conflict-aware strength snapshot. Missing wearable values stay missing; zero steps is valid. Older readings carry their original dates. Sleep performance and strain are dated independently of recovery.

WHOOP refreshes share one in-flight request. Automatic refresh has a five-minute cooldown, so rendering the home does not repeatedly rotate WHOOP tokens. Failed requests retain saved readings. Account changes reject delayed responses and separate device caches.

Strength uses `com.hybrid.strength://whoop`, matching the new APK package and Android intent. The old strength return listener and polling loop have been removed. Foreground return and cold-launch URL handling check the exact scheme/host and distinguish completed, denied and failed authorisations. Supabase stores an allowlisted application target with the single-use OAuth state. Existing conditioning installs explicitly identifying their own application continue returning to that app; they do not use the new strength callback.

This release also contains the agreed deterministic strength brain: up to two ramp sets for main lifts, effort-slider feedback, equipment-aware next-set recommendations, full-rep-range progression, eligible working-set e1RM estimates, and individual offline-first set memory synced to Supabase. Wearable readings and daily answers are observations; this release does not use them to change strength loads.

## Validation

- Phone browser: home measurements, dated missing data, both questionnaires, daily halo, persistence, history dates, narrow layouts and training navigation.
- Strength browser: two ramps, slider logging, automatic rest reuse, 3×8 progression, local individual-set records, reload and next-session starting load.
- Regression tests: concurrent sync, delayed response after account switch, physiological dates, zero steps, retained history, question snapshot round trip, native OAuth state and return routing.
- Supabase: live isolated-user authentication and unsigned-request rejection; memory table and sync RPC deployed; a real browser saved a set and morning answers, and a separate browser restored both from Supabase. Test users are removed after checks.
- Actual WHOOP consent and Android browser-to-app return still need a physical phone and the athlete's own WHOOP login. Mocked browser/API tests do not establish that physical-device result.

Source changes are reviewable on GitHub. No credential values are included in the app or source archive; the public Supabase anon key remains public by design.
