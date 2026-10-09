Hybrid Strength 1.2.4 adds the native Capgo updater to the existing strength slider and rest timer APK.

- App ID: com.hybrid.strength. Native version: 1.2.4 (124).
- Capgo channel: strength-live, linked to web bundle 1.2.4+capgo.1.
- Updates download automatically and queue with a kill delay. Fully close and reopen the app to apply an update; backgrounding an open workout does not apply it.
- Bundle health is confirmed after the strength UI renders. Capgo rollback remains enabled if startup fails. Native service-worker caching is disabled.
- Same signing certificate as the released 1.2.3 APK, so this APK can update that build in place. It cannot update the original 1.2.2 APK signed with another key. Export logs before uninstalling an incompatible older version.

Validation: GitHub Actions native build succeeded; full workout browser checks and mocked updater lifecycle checks passed; APK signature, alignment, package/version and plugin/config checks passed; the Capgo endpoint returned the linked bundle for a simulated Android request. No physical phone installation or OTA activation was tested.

The tag contains the full shell and tested web source. Native artifact from Actions run 37904358688 was repackaged with the final tested web assets and signed using the retained 1.2.3 key. Native plugin changes still require a new APK; compatible HTML/CSS/JavaScript changes can ship through Capgo.
