# Fitbit Air live heart-rate connection

Reported on Android: device appears in Engine's picker, connects, then reports
“Characteristic not found.” Heart-rate sharing / Always visible is already on.

## What the code establishes

The existing Android Bluetooth plugin discovers services during connect. Its
notification method emits this exact error when service 180D or characteristic
2A37 is absent from Android's discovered GATT tree. That does not establish why
the band omitted it. Engine previously fabricated Web Bluetooth service objects
without checking native discovery, and did not close a failed notification link.

The fix enumerates services, checks for a notifiable/indicatable 2A37 under 180D,
refreshes discovery once if missing, then fails with the available service UUIDs.
Failed connection or notification startup closes the link. Late packets are
ignored after disconnect; duplicate connection attempts are guarded. Workout
accounting, packet parsing and WHOOP cloud sync are unchanged.

## Bonding lead

A pasted proposal claims Fitbit Air always hides HR until OS bonding. No verified
Android-specific source has established this requirement. The existing plugin
supports isBonded/createBond, and handles CCCD writes and bond-state events.
A bounded Android Fitbit pairing recovery is now included when HR remains absent
after fresh discovery. It checks isBonded, requests pairing once if needed, waits
up to 30 seconds for the native result, confirms isBonded, and discovers again.
Other brands/platforms and working monitors do not enter this pairing path.
Refused/timed-out pairing disconnects and offers a retry. Existing bonds are not
removed. If discovery still fails, record the service map and reported bond state.
Pairing acceptance must be awaited before rediscovery; createBond is asynchronous.
The pasted parser incorrectly uses characteristic.properties for the HR format
flag; the real format flag is byte zero of the received HR measurement packet.

FITIV's working Air guide covers iPhone, enables Always visible and connects in
app. It is evidence for broadcast support, not proof of Android bond requirements:
https://support.fitiv.com/hc/en-us/articles/50189547760148-Guide-Connecting-Your-Fitbit-Air-Band-to-FITIV-Pulse

## Source and import

Source fix: codex/engine-fitbit-hr-discovery, 98a9c75e. It changes the actual
conditioning/source.html and native runtime, then rebuilds Engine index.html.
The Strength integration imports that commit. Explicit checked overrides preserve
Sydney date, WHOOP history and chart changes already shipped in Strength main;
the original import script would have overwritten these existing changes.
Overrides fail rather than silently applying when their upstream context changes.
To reproduce, fetch the source branch then run:

    node scripts/import-engine-house.mjs origin/codex/engine-fitbit-hr-discovery

The native plugin bundle is unchanged. No Android rebuild or new native API is
needed for this change. The prepared OTA version is 1.3.16; an upload is a separate release operation.

## Validation and remaining acceptance

Source: thirteen transport unit cases plus native browser smoke, HR-gap accounting,
workout countdown, method flow and onboarding smoke passed with mocked Bluetooth.
Integration: transport tests exercise the helper extracted from the actual
imported page; browser tests cover stale discovery recovery, 8/16-bit packets,
missing service, notification failure, pairing success/refusal, late callback suppression and hallway
navigation. Import hashes and athlete boot checks pass.

Actual Fitbit Air / Android acceptance is still required: connect while worn,
verify live readings, disconnect/reconnect, disable sharing and check bounded
failure, then restore sharing. Disconnect other active tracking apps first.
If discovery still fails, the UUID report is the next evidence to investigate.
Neither a browser mock nor a passing test proves the physical band is fixed.
