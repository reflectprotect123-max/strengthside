/**
 * Thin Capacitor bridge for the Hybrid HTML athlete app.
 * Browser: no-ops / Web APIs. Cap Android: KeepAwake + Camera plugins.
 */
(function (global) {
  function isNative() {
    try {
      return !!(global.Capacitor && global.Capacitor.isNativePlatform && global.Capacitor.isNativePlatform());
    } catch {
      return false;
    }
  }

  function plugin(name) {
    try {
      return global.Capacitor && global.Capacitor.Plugins && global.Capacitor.Plugins[name];
    } catch {
      return null;
    }
  }

  async function keepAwake() {
    const ka = plugin('KeepAwake');
    if (ka && typeof ka.keepAwake === 'function') {
      await ka.keepAwake();
      return 'native';
    }
    return null;
  }

  async function allowSleep() {
    const ka = plugin('KeepAwake');
    if (ka && typeof ka.allowSleep === 'function') {
      await ka.allowSleep();
      return 'native';
    }
    return null;
  }

  /**
   * @returns {Promise<{ dataUrl: string, format: string }|null>}
   */
  async function takePhoto() {
    const Cam = plugin('Camera');
    if (Cam && typeof Cam.getPhoto === 'function') {
      const photo = await Cam.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: 'dataUrl',
        source: 'CAMERA',
        correctOrientation: true,
      });
      if (photo && photo.dataUrl) return { dataUrl: photo.dataUrl, format: photo.format || 'jpeg' };
    }
    return pickImageFile();
  }

  function pickImageFile() {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';
      input.style.display = 'none';
      document.body.appendChild(input);
      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        try {
          input.remove();
        } catch (_) {}
        resolve(value);
      };
      input.addEventListener('change', () => {
        const file = input.files && input.files[0];
        if (!file) return finish(null);
        const reader = new FileReader();
        reader.onload = () => finish({ dataUrl: String(reader.result || ''), format: 'jpeg' });
        reader.onerror = () => finish(null);
        reader.readAsDataURL(file);
      });
      input.addEventListener('cancel', () => finish(null));
      setTimeout(() => {
        if (!settled && (!input.files || !input.files.length)) {
          /* user may still be in picker */
        }
      }, 0);
      input.click();
    });
  }

  function onAppState(cb) {
    const App = plugin('App');
    if (!App || typeof App.addListener !== 'function') return () => {};
    let handle = null;
    App.addListener('appStateChange', (state) => {
      try {
        cb(!!(state && state.isActive));
      } catch (_) {}
    }).then((h) => {
      handle = h;
    });
    return () => {
      try {
        if (handle && handle.remove) handle.remove();
      } catch (_) {}
    };
  }

  global.NativeBridge = {
    isNative,
    keepAwake,
    allowSleep,
    takePhoto,
    pickImageFile,
    onAppState,
  };
})(typeof window !== 'undefined' ? window : globalThis);
