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
    const candidates = [];
    if (ocr.lines && ocr.lines.length && C.parseLabelLines) {
      candidates.push(C.parseLabelLines(ocr.lines));
    }
    const plain = normalizeLabelPaste(ocr.text || '');
    if (plain) candidates.push(C.parseLabelText(plain));
    if (ocr.lines && ocr.lines.length) {
      const joined = normalizeLabelPaste(
        [...ocr.lines]
          .sort((a, b) => (a.top === b.top ? a.left - b.left : a.top - b.top))
          .map((l) => l.text)
          .join('\n'),
      );
      if (joined && joined !== plain) candidates.push(C.parseLabelText(joined));
    }
    if (!candidates.length) return C.parseLabelText('');
    return candidates.reduce((best, next) => (scoreParsed(next) > scoreParsed(best) ? next : best));
  }

  function scoreParsed(parsed) {
    if (!parsed) return 0;
    let n = 0;
    if (parsed.calories != null) n += 2;
    if (parsed.proteinG != null) n += 1;
    if (parsed.carbsG != null) n += 1;
    if (parsed.fatG != null) n += 1;
    return n;
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
    const rawText = formatRawOcr(ocr);
    if (C.isEmptyLabel && C.isEmptyLabel(parsed)) {
      const err = new Error("Couldn't read label — fix the text below or enter manually.");
      err.code = 'empty_label';
      err.rawText = rawText;
      throw err;
    }
    return { parsed, rawText };
  }

  function formatRawOcr(ocr) {
    if (ocr.lines && ocr.lines.length) {
      return [...ocr.lines]
        .sort((a, b) => (a.top === b.top ? a.left - b.left : a.top - b.top))
        .map((l) => l.text)
        .join('\n');
    }
    return String(ocr.text || '').trim();
  }

  function mergeParsed(best, next) {
    if (!best) return { ...(next || {}) };
    const out = { ...best };
    for (const k of ['calories', 'proteinG', 'carbsG', 'fatG', 'servingQty', 'servingUnit', 'basis']) {
      if (out[k] == null && next && next[k] != null) out[k] = next[k];
    }
    out.roundedDown = !!(best.roundedDown || (next && next.roundedDown));
    return out;
  }

  /** Insert newlines before macro keywords so one-line pastes still parse. */
  function normalizeLabelPaste(text) {
    return String(text || '')
      .replace(/\r\n/g, '\n')
      .replace(/\s+(?=(?:Energy|Calories|Calorie|Protein|Fat|Carbohydrate|Carbs|Sugars|Sodium|Serving)\b)/gi, '\n')
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
    scoreParsed,
    formatRawOcr,
    mergeParsed,
  };
})(typeof window !== 'undefined' ? window : globalThis);
