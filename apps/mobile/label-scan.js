/**
 * Nutrition label scan — camera → on-device OCR → nutrition-core parse → confirm.
 * Prefer NativeBridge camera; OCR via Tesseract.js (on-device in WebView). No cloud vision.
 */
(function (global) {
  let tesseractLoading = null;

  function Core() {
    return global.HybridNutrition && global.HybridNutrition.Core;
  }

  function loadTesseract() {
    if (global.Tesseract) return Promise.resolve(global.Tesseract);
    if (tesseractLoading) return tesseractLoading;
    tesseractLoading = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
      s.async = true;
      s.onload = () => (global.Tesseract ? resolve(global.Tesseract) : reject(new Error('Tesseract missing')));
      s.onerror = () => reject(new Error('Could not load OCR engine'));
      document.head.appendChild(s);
    });
    return tesseractLoading;
  }

  async function ocrDataUrl(dataUrl) {
    const T = await loadTesseract();
    const result = await T.recognize(dataUrl, 'eng', { logger: () => {} });
    const text = (result && result.data && result.data.text) || '';
    const lines = [];
    const words = (result && result.data && result.data.words) || [];
    if (words.length) {
      const byLine = new Map();
      words.forEach((w) => {
        const box = w.bbox || {};
        const top = Math.round((box.y0 || 0) / 8) * 8;
        const key = String(top);
        if (!byLine.has(key)) byLine.set(key, { texts: [], left: box.x0 || 0, top: box.y0 || 0, right: box.x1 || 0, bottom: box.y1 || 0 });
        const row = byLine.get(key);
        row.texts.push(w.text || '');
        row.left = Math.min(row.left, box.x0 || row.left);
        row.top = Math.min(row.top, box.y0 || row.top);
        row.right = Math.max(row.right, box.x1 || row.right);
        row.bottom = Math.max(row.bottom, box.y1 || row.bottom);
      });
      byLine.forEach((row) => {
        lines.push({
          text: row.texts.join(' ').trim(),
          left: row.left,
          top: row.top,
          right: row.right,
          bottom: row.bottom,
        });
      });
    }
    return { text, lines };
  }

  function parseOcr(ocr) {
    const C = Core();
    if (!C) throw new Error('Nutrition bundle failed to load.');
    let parsed = null;
    if (ocr.lines && ocr.lines.length && C.parseLabelLines) {
      parsed = C.parseLabelLines(ocr.lines);
      if (C.isEmptyLabel && C.isEmptyLabel(parsed) && ocr.text) parsed = C.parseLabelText(ocr.text);
    } else {
      parsed = C.parseLabelText(ocr.text || '');
    }
    return parsed;
  }

  /**
   * Full capture path. Returns parsed label or throws with a user-facing message.
   */
  async function scanFromCamera() {
    const bridge = global.NativeBridge;
    if (!bridge || typeof bridge.takePhoto !== 'function') throw new Error('Camera bridge unavailable.');
    const photo = await bridge.takePhoto();
    if (!photo || !photo.dataUrl) throw new Error('No photo captured.');
    const ocr = await ocrDataUrl(photo.dataUrl);
    const parsed = parseOcr(ocr);
    const C = Core();
    if (C.isEmptyLabel && C.isEmptyLabel(parsed)) {
      const err = new Error("Couldn't read label — enter manually.");
      err.code = 'empty_label';
      err.rawText = ocr.text || '';
      throw err;
    }
    return { parsed, rawText: ocr.text || '' };
  }

  /** Manual / paste path for web dogfood and failed OCR recovery. */
  function parsePastedText(text) {
    const C = Core();
    if (!C) throw new Error('Nutrition bundle failed to load.');
    const parsed = C.parseLabelText(String(text || ''));
    if (C.isEmptyLabel && C.isEmptyLabel(parsed)) {
      const err = new Error("Couldn't read label — enter manually.");
      err.code = 'empty_label';
      throw err;
    }
    return { parsed, rawText: String(text || '') };
  }

  global.LabelScan = {
    scanFromCamera,
    parsePastedText,
    ocrDataUrl,
    parseOcr,
  };
})(typeof window !== 'undefined' ? window : globalThis);
