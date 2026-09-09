# Hybrid Strength Capacitor shell

- applicationId / Capgo app: `com.hybrid.strength`
- OAuth return scheme: `com.hybrid.strength://`
- webDir: parent HTML tree (`..`)
- WHOOP/Concept2 stay proxy-only to thehybridengine1

Build APK: `PRODUCT=strength bash scripts/build-product-apk.sh`
Ship Capgo: `PRODUCT=strength CAPGO_BUNDLE_VERSION=1.0.0 bash scripts/ship-product-capgo.sh`
