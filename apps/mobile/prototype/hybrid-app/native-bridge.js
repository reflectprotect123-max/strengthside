/**
 * Thin Capacitor bridge for the Hybrid HTML athlete app.
 * Cap Android: KeepAwake + Camera + ML Kit Text Recognition + Barcode.
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
    if (p.startsWith('http:') || p.startsWith('https:') || p.startsWith('capacitor:')) return '';
    return 'file://' + p;
  }

  /**
   * @returns {Promise<{ path?: string, dataUrl?: string, format: string }|null>}
   */
  async function takePhoto(opts) {
    opts = opts || {};
    const Cam = plugin('Camera');
    if (Cam && typeof Cam.getPhoto === 'function') {
      const photo = await Cam.getPhoto({
        quality: opts.quality ?? 100,
        width: opts.width ?? 2400,
        allowEditing: opts.allowEditing ?? true,
        resultType: 'uri',
        source: opts.source || 'CAMERA',
        correctOrientation: true,
        saveToGallery: false,
      });
      const raw = (photo && (photo.path || photo.uri)) || '';
      const path = fileUrl(raw);
      if (path) return { path, format: (photo && photo.format) || 'jpeg' };
    }
    return pickImageFile();
  }

  async function pickPhotoFromGallery() {
    return takePhoto({ source: 'PHOTOS', allowEditing: true });
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

  /**
   * Write a data URL JPEG to cache and OCR it. Cap Android only.
   */
  async function recognizeDataUrl(dataUrl) {
    const FS = plugin('Filesystem');
    if (!FS || typeof FS.writeFile !== 'function') {
      const err = new Error('Filesystem unavailable for live scan.');
      err.code = 'ocr_unavailable';
      throw err;
    }
    const base64 = String(dataUrl || '').replace(/^data:image\/\w+;base64,/, '');
    const name = `label-scan-${Date.now()}.jpg`;
    const written = await FS.writeFile({
      path: name,
      data: base64,
      directory: 'CACHE',
    });
    const path = (written && written.uri) || fileUrl(name);
    return recognizeText(path);
  }

  /**
   * Scan one barcode via ML Kit. Cap Android only.
   * @returns {Promise<string|null>} barcode digits
   */
  async function scanBarcodeOnce() {
    const BS = plugin('BarcodeScanner');
    if (!BS) {
      const err = new Error('Barcode scanner unavailable.');
      err.code = 'barcode_unavailable';
      throw err;
    }
    if (typeof BS.scan === 'function') {
      const result = await BS.scan();
      const code = result && (result.rawValue || result.displayValue || result.content);
      return code ? String(code).trim() : null;
    }
    if (typeof BS.startScan === 'function' && typeof BS.stopScan === 'function') {
      return new Promise((resolve, reject) => {
        let handle = null;
        const done = (value) => {
          try {
            if (handle && handle.remove) handle.remove();
          } catch (_) {}
          BS.stopScan().catch(() => {});
          resolve(value);
        };
        BS.addListener('barcodesScanned', (event) => {
          const barcodes = (event && event.barcodes) || [];
          const first = barcodes[0];
          const code = first && (first.rawValue || first.displayValue);
          if (code) done(String(code).trim());
        })
          .then((h) => {
            handle = h;
            return BS.startScan();
          })
          .catch(reject);
        setTimeout(() => done(null), 45000);
      });
    }
    const err = new Error('Barcode scanner unavailable.');
    err.code = 'barcode_unavailable';
    throw err;
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
    pickPhotoFromGallery,
    pickImageFile,
    recognizeText,
    recognizeDataUrl,
    scanBarcodeOnce,
    onAppState,
  };
})(typeof window !== 'undefined' ? window : globalThis);
