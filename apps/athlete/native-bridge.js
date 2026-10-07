/** Native platform detection. This APK always loads its bundled strength app. */
(function (root) {
  function isNative() {
    try { return !!root.Capacitor?.isNativePlatform?.(); } catch { return false; }
  }
  root.NativeBridge = { isNative };
})(typeof window !== 'undefined' ? window : globalThis);
