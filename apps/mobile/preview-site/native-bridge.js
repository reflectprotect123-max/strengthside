/**
 * Thin Capacitor bridge for the Hybrid HTML athlete app.
 * Cap Android: KeepAwake + Camera + ML Kit Text Recognition.
 * Browser: file picker only (no OCR — paste label text).
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

  function fileUrl(path) {
    if (!path) return '';
    const p = String(path);
    if (p.startsWith('file:') || p.startsWith('content:')) return p;
    return 'file://' + p;
  }

  /**
   * @returns {Promise<{ path?: string, dataUrl?: string, format: string }|null>}
   */
  async function takePhoto() {
    const Cam = plugin('Camera');
    if (Cam && typeof Cam.getPhoto === 'function') {
      const photo = await Cam.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: 'uri',
        source: 'CAMERA',
        correctOrientation: true,
        saveToGallery: false,
      });
      if (photo && (photo.path || photo.webPath)) {
        return {
          path: fileUrl(photo.path || photo.webPath),
          format: photo.format || 'jpeg',
        };
      }
    }
    return pickImageFile();
  }

  function pickImageFile() {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.setAttribute('capture', 'environment');
      input.style.position = 'fixed';
      input.style.left = '-9999px';
      document.body.appendChild(input);
      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        window.removeEventListener('focus', onFocus);
        try {
          input.remove();
        } catch (_) {}
        resolve(value);
      };
      const onFocus = () => {
        setTimeout(() => {
          if (!settled && (!input.files || !input.files.length)) finish(null);
        }, 400);
      };
      input.addEventListener('change', () => {
        const file = input.files && input.files[0];
        if (!file) return finish(null);
        // Web has no ML Kit — dataUrl alone is not enough for OCR here.
        const reader = new FileReader();
        reader.onload = () => finish({ dataUrl: String(reader.result || ''), format: 'jpeg' });
        reader.onerror = () => finish(null);
        reader.readAsDataURL(file);
      });
      input.addEventListener('cancel', () => finish(null));
      window.addEventListener('focus', onFocus);
      input.click();
    });
  }

  /**
   * On-device ML Kit Text Recognition (Latin). Cap Android only.
   * @param {string} path file:// or content:// image path
   * @returns {Promise<{ text: string, lines: Array<{text:string,left:number,top:number,right:number,bottom:number}> }>}
   */
  async function recognizeText(path) {
    const TR = plugin('TextRecognition');
    if (!TR || typeof TR.processImage !== 'function') {
      const err = new Error('ML Kit text recognition unavailable. Paste the label text instead.');
      err.code = 'ocr_unavailable';
      throw err;
    }
    const result = await TR.processImage({ path: fileUrl(path), script: 'LATIN' });
    const lines = [];
    (result.blocks || []).forEach((block) => {
      (block.lines || []).forEach((line) => {
        const b = line.boundingBox || {};
        lines.push({
          text: String(line.text || '').trim(),
          left: Number(b.left) || 0,
          top: Number(b.top) || 0,
          right: Number(b.right) || 0,
          bottom: Number(b.bottom) || 0,
        });
      });
    });
    return { text: String(result.text || ''), lines: lines.filter((l) => l.text) };
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
    recognizeText,
    onAppState,
  };
})(typeof window !== 'undefined' ? window : globalThis);
