# Hybrid Strength APK delivery

This isolated delivery branch stores the exact signed APK built and browser-tested in the cloud workspace. GitHub Actions verifies its checksum and Android signature, then uploads it to the strength-slider-v1.2.3 release. No signing key or password is included. Main and the application checkouts remain unchanged.

The complete updated packaged web source accompanies the APK. The native shell is retained from Hybrid Strength 1.2.2. The new signing key cannot update the old installation in place; export local logs before removing any installation. Physical-phone installation and background timer behavior remain untested.
