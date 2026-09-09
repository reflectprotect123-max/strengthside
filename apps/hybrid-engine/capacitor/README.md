# Hybrid Engine Capacitor shell

- applicationId / Capgo app: `com.hybrid.engine`
- OAuth return scheme: `com.hybrid.engine://`
- webDir: parent HTML tree (`..`)
- WHOOP/Concept2 stay proxy-only to thehybridengine1

Build APK: `PRODUCT=engine bash scripts/build-product-apk.sh`
Ship Capgo: `PRODUCT=engine CAPGO_BUNDLE_VERSION=1.0.0 bash scripts/ship-product-capgo.sh`
