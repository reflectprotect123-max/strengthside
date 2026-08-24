/**
 * Live label scan — MacroFactor-style multi-frame OCR with mock-label fill-in.
 * Native: getUserMedia preview → periodic ML Kit passes → merge best fields.
 * Fallback: burst still photos (3) when live camera unavailable.
 */
(function (global) {
  function Core() {
    return global.HybridNutrition && global.HybridNutrition.Core;
  }

  function emptyParsed() {
    return {
      calories: null,
      proteinG: null,
      carbsG: null,
      fatG: null,
      servingQty: null,
      servingUnit: null,
      basis: 'unknown',
      roundedDown: false,
    };
  }

  function mergeParsed(best, next) {
    if (!best) return { ...next };
    const out = { ...best };
    for (const k of ['calories', 'proteinG', 'carbsG', 'fatG', 'servingQty', 'servingUnit', 'basis']) {
      if (out[k] == null && next[k] != null) out[k] = next[k];
    }
    out.roundedDown = !!(best.roundedDown || next.roundedDown);
    return out;
  }

  function fieldScore(parsed) {
    if (!parsed) return 0;
    let n = 0;
    if (parsed.calories != null) n += 2;
    if (parsed.proteinG != null) n += 1;
    if (parsed.carbsG != null) n += 1;
    if (parsed.fatG != null) n += 1;
    if (parsed.servingQty != null) n += 1;
    return n;
  }

  function parseFrame(ocr) {
    if (!global.LabelScan || typeof LabelScan.parseOcr !== 'function') return emptyParsed();
    try {
      return LabelScan.parseOcr(ocr);
    } catch {
      return emptyParsed();
    }
  }

  function formatField(name, val, unit) {
    if (val == null || Number.isNaN(val)) return '—';
    if (name === 'calories') return `${Math.round(val)} kcal`;
    return `${Number(val).toFixed(1).replace(/\.0$/, '')} ${unit || 'g'}`;
  }

  function mockLabelHtml(parsed, rawText) {
    const basis =
      parsed.basis === 'per_serving'
        ? 'Per serving'
        : parsed.basis === 'per_100'
          ? 'Per 100 g/ml'
          : 'Reading label…';
    const rows = [
      ['Energy', parsed.calories, 'kcal'],
      ['Protein', parsed.proteinG, 'g'],
      ['Fat, total', parsed.fatG, 'g'],
      ['Carbohydrate', parsed.carbsG, 'g'],
    ]
      .map(
        ([label, val, unit]) =>
          `<div class="nut-mock-row${val != null ? ' filled' : ''}"><span>${label}</span><b>${formatField(label, val, unit)}</b></div>`,
      )
      .join('');
    const score = fieldScore(parsed);
    return `<div class="nut-mock-label">
      <div class="nut-mock-head"><span>Nutrition Information</span><span class=meta>${basis}</span></div>
      ${rows}
      <p class="meta" style="margin-top:8px">${score >= 3 ? 'Looking good — tap Done or keep scanning.' : 'Move closer, reduce glare, wiggle slightly.'}</p>
      ${rawText ? `<details style="margin-top:10px"><summary class=meta>Raw OCR</summary><pre class="nut-raw-ocr">${escHtml(rawText.slice(0, 1200))}</pre></details>` : ''}
    </div>`;
  }

  function escHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * Open live scan overlay. Calls onUpdate({parsed, rawText, passes}) each pass.
   * Resolves when user taps Done or Cancel.
   */
  function openLiveScan(onUpdate) {
    return new Promise((resolve, reject) => {
      const bridge = global.NativeBridge;
      const native = bridge && bridge.isNative && bridge.isNative();
      let parsed = emptyParsed();
      let rawText = '';
      let passes = 0;
      let stopped = false;
      let stream = null;
      let timer = null;
      let video = null;

      function finish(kind, payload) {
        if (stopped) return;
        stopped = true;
        if (timer) clearInterval(timer);
        if (stream) {
          try {
            stream.getTracks().forEach((t) => t.stop());
          } catch (_) {}
        }
        const root = document.getElementById('labelScanRoot');
        if (root) root.remove();
        if (kind === 'done') resolve(payload);
        else reject(payload || new Error('Scan cancelled'));
      }

      function emit() {
        if (onUpdate) onUpdate({ parsed, rawText, passes });
        const mock = document.getElementById('nutMockLabel');
        if (mock) mock.innerHTML = mockLabelHtml(parsed, rawText);
      }

      async function runPassFromVideo() {
        if (stopped || !video || !bridge.recognizeDataUrl) return;
        try {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth || 1280;
          canvas.height = video.videoHeight || 720;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
          const ocr = await bridge.recognizeDataUrl(dataUrl);
          passes += 1;
          rawText = (global.LabelScan && LabelScan.formatRawOcr && LabelScan.formatRawOcr(ocr)) || ocr.text || rawText;
          const next = parseFrame(ocr);
          parsed = mergeParsed(parsed, next);
          emit();
        } catch (_) {}
      }

      async function runBurstPhotos() {
        const status = document.getElementById('nutScanLiveStatus');
        for (let i = 0; i < 3 && !stopped; i += 1) {
          if (status) status.textContent = `Photo ${i + 1} of 3 — crop to nutrition panel`;
          try {
            const photo = await bridge.takePhoto({ allowEditing: true });
            if (!photo || !photo.path) continue;
            const ocr = await bridge.recognizeText(photo.path);
            passes += 1;
            rawText =
              (global.LabelScan && LabelScan.formatRawOcr && LabelScan.formatRawOcr(ocr)) || ocr.text || rawText;
            parsed = mergeParsed(parsed, parseFrame(ocr));
            emit();
          } catch (_) {}
        }
      }

      const root = document.createElement('div');
      root.id = 'labelScanRoot';
      root.className = 'nut-scan-live';
      root.innerHTML = `<div class="nut-scan-panel">
        <div class="nut-scan-top"><button type="button" class="btn small ghost" id="nutScanCancel">Cancel</button><b>Scan label</b><button type="button" class="btn small primary" id="nutScanDone">Done</button></div>
        <div class="nut-scan-stage"><video id="nutScanVideo" playsinline muted autoplay></video><div class="nut-scan-tip">Fill frame with the nutrition panel. Wiggle slightly for sharper reads.</div></div>
        <div id="nutMockLabel">${mockLabelHtml(parsed, rawText)}</div>
        <p class="meta" id="nutScanLiveStatus">Starting camera…</p>
      </div>`;
      document.body.appendChild(root);
      root.querySelector('#nutScanCancel').onclick = () => finish('cancel');
      root.querySelector('#nutScanDone').onclick = () => {
        const C = Core();
        if (C && C.isEmptyLabel && C.isEmptyLabel(parsed)) {
          finish('cancel', Object.assign(new Error("Couldn't read label — try paste or manual."), { code: 'empty_label', rawText }));
          return;
        }
        finish('done', { parsed, rawText, passes });
      };

      emit();

      (async () => {
        const status = document.getElementById('nutScanLiveStatus');
        if (native && navigator.mediaDevices && navigator.mediaDevices.getUserMedia && bridge.recognizeDataUrl) {
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
              audio: false,
            });
            video = document.getElementById('nutScanVideo');
            video.srcObject = stream;
            await video.play();
            if (status) status.textContent = 'Live scan — move slightly left/right';
            timer = setInterval(runPassFromVideo, 900);
            await runPassFromVideo();
            return;
          } catch (_) {
            if (status) status.textContent = 'Live camera blocked — using photo burst';
          }
        }
        const stage = root.querySelector('.nut-scan-stage');
        if (stage) stage.innerHTML = '<div class=meta style="padding:20px">Take 3 quick photos. Crop each to the nutrition panel.</div>';
        if (status) status.textContent = 'Photo burst mode';
        if (native && bridge.takePhoto) await runBurstPhotos();
        else if (status) status.textContent = 'Camera unavailable — use paste instead';
      })();
    });
  }

  global.LabelScanLive = {
    openLiveScan,
    mergeParsed,
    fieldScore,
    mockLabelHtml,
  };
})(typeof window !== 'undefined' ? window : globalThis);
