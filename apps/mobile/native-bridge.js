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
   * Extract product barcode digits (EAN/UPC) from ML Kit barcode objects.
   * @param {unknown} barcodes
   * @returns {string|null}
   */
  function pickProductBarcode(barcodes) {
    const list = Array.isArray(barcodes) ? barcodes : [];
    for (const bc of list) {
      if (!bc || typeof bc !== 'object') continue;
      const raw = bc.rawValue || bc.displayValue || bc.content || '';
      const digits = String(raw).replace(/\D/g, '');
      if (digits.length >= 8 && digits.length <= 14) return digits;
    }
    return null;
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
    const productFormats = ['EAN_13', 'EAN_8', 'UPC_A', 'UPC_E', 'CODE_128'];
    if (typeof BS.scan === 'function') {
      try {
        const result = await BS.scan({ formats: productFormats, autoZoom: true });
        return pickProductBarcode(result && result.barcodes);
      } catch (e) {
        const msg = String((e && e.message) || e || '').toLowerCase();
        if (msg.includes('cancel')) {
          const err = new Error('Scan cancelled.');
          err.code = 'barcode_cancelled';
          throw err;
        }
        throw e;
      }
    }
    if (typeof BS.requestPermissions === 'function') {
      const perm = await BS.requestPermissions();
      if (!perm || perm.camera !== 'granted') {
        const err = new Error('Camera permission denied.');
        err.code = 'barcode_permission_denied';
        throw err;
      }
    }
    if (typeof BS.startScan === 'function' && typeof BS.stopScan === 'function') {
      return new Promise((resolve, reject) => {
        let handle = null;
        let settled = false;
        const done = (value) => {
          if (settled) return;
          settled = true;
          try {
            if (handle && handle.remove) handle.remove();
          } catch (_) {}
          BS.stopScan().catch(() => {});
          resolve(value);
        };
        BS.addListener('barcodesScanned', (event) => {
          const code = pickProductBarcode((event && event.barcodes) || []);
          if (code) done(code);
        })
          .then((h) => {
            handle = h;
            return BS.startScan({ formats: productFormats, lensFacing: 'BACK' });
          })
          .catch(reject);
        setTimeout(() => done(null), 60000);
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

  /**
   * Capgo live-update handshake. Fail-soft: browser, missing plugin, or
   * autoUpdate:false still leave the bundled WebView assets in charge.
   * Required only when Capgo autoUpdate is later enabled (rollback safety).
   */
  function notifyLiveUpdateReady() {
    if (!isNative()) return Promise.resolve('skipped');
    const Updater = plugin('CapacitorUpdater');
    if (!Updater || typeof Updater.notifyAppReady !== 'function') {
      return Promise.resolve('unavailable');
    }
    return Updater.notifyAppReady()
      .then(() => 'ready')
      .catch(() => 'error');
  }

  // Fire once on load — never blocks UI; never throws into the app.
  try {
    notifyLiveUpdateReady();
  } catch (_) {}

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
    notifyLiveUpdateReady,
  };
})(typeof window !== 'undefined' ? window : globalThis);
