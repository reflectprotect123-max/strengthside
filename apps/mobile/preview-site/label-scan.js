/**
 * Nutrition label scan — camera → ML Kit OCR (Cap) → nutrition-core parse → confirm.
 * Web: paste path only (ML Kit is native). No cloud vision. No Tesseract.
 */
(function (global) {
  function Core() {
    return global.HybridNutrition && global.HybridNutrition.Core;
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
   * Full capture path. Cap Android: Camera + ML Kit. Web: directs to paste.
   */
  async function scanFromCamera() {
    const bridge = global.NativeBridge;
    if (!bridge || typeof bridge.takePhoto !== 'function') throw new Error('Camera bridge unavailable.');
    if (!bridge.isNative || !bridge.isNative() || typeof bridge.recognizeText !== 'function') {
      const err = new Error('Photo scan needs the Android app. Paste the label text instead.');
      err.code = 'ocr_unavailable';
      throw err;
    }
    const photo = await bridge.takePhoto();
    if (!photo || !photo.path) throw new Error('No photo captured.');
    const ocr = await bridge.recognizeText(photo.path);
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

  /** Insert newlines before macro keywords so one-line pastes still parse. */
  function normalizeLabelPaste(text) {
    return String(text || '')
      .replace(/\r\n/g, '\n')
      .replace(/\s+(?=(?:Energy|Protein|Fat|Carbohydrate|Carbs|Sugars|Sodium|Serving)\b)/gi, '\n')
      .trim();
  }

  /** Manual / paste path for web and failed OCR recovery. */
  function parsePastedText(text) {
    const C = Core();
    if (!C) throw new Error('Nutrition bundle failed to load.');
    const normalized = normalizeLabelPaste(text);
    const parsed = C.parseLabelText(normalized);
    if (C.isEmptyLabel && C.isEmptyLabel(parsed)) {
      const err = new Error("Couldn't read label — enter manually.");
      err.code = 'empty_label';
      throw err;
    }
    return { parsed, rawText: normalized };
  }

  global.LabelScan = {
    scanFromCamera,
    parsePastedText,
    parseOcr,
    normalizeLabelPaste,
  };
})(typeof window !== 'undefined' ? window : globalThis);
