/**
 * Athlete Nutrition UI for Hybrid HTML app — Track Dawn shell.
 * Depends on window.HybridNutrition (nutrition-bundle.js) and app helpers:
 * $, esc, today, id, sheet, closeSheet, go, shell, nav, clock.
 *
 * Storage is local-first (`hybrid-nutrition-v1`). When signed in to Supabase
 * (same session as WHOOP), NutritionSync pushes/pulls the nutrition domain
 * snapshot to athlete_domain_snapshots on the shared project.
 */
(function () {
  const KEY = 'hybrid-nutrition-v1';
  const MEALS = ['breakfast', 'lunch', 'dinner', 'snack'];

  function Core() {
    return window.HybridNutrition && window.HybridNutrition.Core;
  }

  function loadN() {
    const C = Core();
    if (!C) return null;
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return C.emptyNutritionDB();
      return C.sanitizeNutritionDB(JSON.parse(raw));
    } catch {
      return C.emptyNutritionDB();
    }
  }

  function saveN(db) {
    try {
      localStorage.setItem(KEY, JSON.stringify(db));
      if (window.NutritionSync && NutritionSync.schedulePush) NutritionSync.schedulePush(db);
      return true;
    } catch {
      return false;
    }
  }

  function isoNow() {
    return new Date().toISOString();
  }

  function uid() {
    return typeof id === 'function' ? id() : 'n' + Math.random().toString(36).slice(2, 10);
  }

  function dayLabel(d) {
    try {
      return new Date(d + 'T12:00:00').toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return d;
    }
  }

  function shiftDay(date, days) {
    const [y, m, d] = date.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + days);
    const pad = (n) => String(n).padStart(2, '0');
    return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
  }

  function ensureTodayTargets(db, date) {
    if (!db.program) {
      const at = isoNow();
      db.program = {
        id: uid(),
        userId: '',
        name: 'Athlete targets',
        mode: 'manual',
        goal: 'maintain',
        targetRateKgPerWeek: 0,
        startDate: date,
        endDate: null,
        weeklyCalorieBudget: null,
        proteinPreference: null,
        fatPreference: null,
        status: 'active',
        days: [],
        createdAt: at,
        updatedAt: at,
      };
    }
    let day = db.program.days.find((x) => x.targetDate === date);
    if (!day) {
      const at = isoNow();
      day = {
        programId: db.program.id,
        targetDate: date,
        calories: 2500,
        proteinG: 160,
        carbsG: 250,
        fatG: 70,
        source: 'manual',
        createdAt: at,
      };
      db.program.days.push(day);
      db.program.updatedAt = at;
    }
    return day;
  }

  let nutDate = null;

  function todayStr() {
    return typeof today === 'function' ? today() : new Date().toISOString().slice(0, 10);
  }

  function openNutrition(date) {
    nutDate = date || todayStr();
    ensureCatalog()
      .then(async () => {
        if (window.NutritionSync && NutritionSync.reconcile) {
          const local = loadN();
          const merged = await NutritionSync.reconcile(local);
          if (merged && merged !== local) saveN(merged);
        }
      })
      .finally(() => renderNutrition());
  }

  function ensureCatalog() {
    if (!window.FoodCatalogAU) return Promise.resolve();
    return FoodCatalogAU.loadCatalog().catch(() => null);
  }

  function upsertCatalogFood(db, food) {
    const C = Core();
    if (!C || !food) return;
    C.upsertCachedFood(db, food);
  }

  function catalogCountLabel() {
    const meta = window.FoodCatalogAU && FoodCatalogAU.catalogMeta && FoodCatalogAU.catalogMeta();
    if (!meta) return '';
    return `${meta.count.toLocaleString()} AU staples offline · live Open Food Facts when online`;
  }

  function renderNutrition() {
    const C = Core();
    if (!C) {
      alert('Nutrition bundle failed to load.');
      return;
    }
    const db = loadN();
    const date = nutDate || todayStr();
    nutDate = date;
    const todayS = todayStr();
    const entries = C.entriesForDay(db, date);
    const totals = C.macroTotals(entries);
    ensureTodayTargets(db, date);
    saveN(db);
    const target = C.targetForDay(db.program, date) || {
      calories: 2500,
      proteinG: 160,
      carbsG: 250,
      fatG: 70,
    };
    const grouped = C.groupByMeal(entries, MEALS);
    const byMeal = Object.fromEntries(grouped.map((g) => [g.meal, g.entries]));
    const mealOrder = [...MEALS, ...grouped.map((g) => g.meal).filter((m) => !MEALS.includes(m))];
    const mealBlocks = mealOrder.map((meal) => {
      const list = byMeal[meal] || [];
      const rows = list.length
        ? list
            .map(
              (e) =>
                `<div class="nut-entry"><div><b>${esc(e.displayName)}</b><div class=meta>${Math.round(e.calories)} kcal · P ${Math.round(e.proteinG)} · C ${Math.round(e.carbsG)} · F ${Math.round(e.fatG)}</div></div><div class=btns style="margin:0"><button class="btn small" onclick="NutritionUI.editEntry('${e.id}')">Edit</button><button class="btn small danger" onclick="NutritionUI.deleteEntry('${e.id}')">×</button></div></div>`,
            )
            .join('')
        : `<div class=meta>Nothing logged.</div>`;
      return `<div class=card style="margin-top:10px"><div class=row><div><div class=eyebrow>${esc(meal)}</div></div><button class="btn small primary" onclick="NutritionUI.addFood('${meal}')">Add</button></div>${rows}</div>`;
    }).join('');

    const pct = (n, t) => (t > 0 ? Math.min(100, Math.round((n / t) * 100)) : 0);
    const meters = `
      <div class=nut-meters>
        <div class=nut-meter><div class=row><span>Calories</span><b>${Math.round(totals.calories)} / ${Math.round(target.calories)}</b></div><div class=nut-bar><i style="width:${pct(totals.calories, target.calories)}%"></i></div></div>
        <div class=nut-meter><div class=row><span>Protein</span><b>${Math.round(totals.proteinG)} / ${Math.round(target.proteinG)} g</b></div><div class=nut-bar><i style="width:${pct(totals.proteinG, target.proteinG)}%"></i></div></div>
        <div class=nut-meter><div class=row><span>Carbs</span><b>${Math.round(totals.carbsG)} / ${Math.round(target.carbsG)} g</b></div><div class=nut-bar><i style="width:${pct(totals.carbsG, target.carbsG)}%"></i></div></div>
        <div class=nut-meter><div class=row><span>Fat</span><b>${Math.round(totals.fatG)} / ${Math.round(target.fatG)} g</b></div><div class=nut-bar><i style="width:${pct(totals.fatG, target.fatG)}%"></i></div></div>
      </div>`;

    nav(true);
    clock(false);
    shell(
      'Nutrition',
      'Daily log',
      `<div class=stack>
        <div class=row>
          <button class="btn small" onclick="NutritionUI.shift(-1)">‹</button>
          <div class=title style="flex:1;text-align:center">${esc(dayLabel(date))}</div>
          <button class="btn small" ${date >= todayS ? 'disabled' : ''} onclick="NutritionUI.shift(1)">›</button>
        </div>
        ${meters}
        <div class=btns>
          <button type="button" class="btn small primary" onclick="NutritionUI.addFood()">Add food</button>
          <button type="button" class="btn small" onclick="NutritionUI.scanLabel()">Scan label</button>
          <button type="button" class="btn small" onclick="NutritionUI.targets()">Targets</button>
          <button type="button" class="btn small" onclick="NutritionUI.weight()">Weight</button>
        </div>
        <p class=meta>${esc(catalogCountLabel())}</p>
        ${mealBlocks}
        <button class="btn block" style="margin-top:12px" onclick="go('home')">Done</button>
      </div>`,
    );
  }

  function shift(delta) {
    const todayS = todayStr();
    let next = shiftDay(nutDate || todayS, delta);
    if (next > todayS) next = todayS;
    nutDate = next;
    renderNutrition();
  }

  function quickAdd(meal) {
    sheet(`<h2>Add food</h2>
      <p class=lead>Quick add — name + macros. Snapshot locked at log time.</p>
      <div class=field><label>Name</label><input id=nutName placeholder="Chicken breast"></div>
      <div class=field><label>Meal</label><select id=nutMeal>${MEALS.map((m) => `<option value="${m}" ${m === meal ? 'selected' : ''}>${m}</option>`).join('')}</select></div>
      <div class=two>
        <div class=field><label>Calories</label><input id=nutKcal type=number min=0 value="0"></div>
        <div class=field><label>Protein g</label><input id=nutP type=number min=0 step=0.1 value="0"></div>
      </div>
      <div class=two>
        <div class=field><label>Carbs g</label><input id=nutC type=number min=0 step=0.1 value="0"></div>
        <div class=field><label>Fat g</label><input id=nutF type=number min=0 step=0.1 value="0"></div>
      </div>
      <button class="btn primary block" style="margin-top:12px" onclick="NutritionUI.saveQuickAdd()">Log food</button>
      <button class="btn block" style="margin-top:8px" onclick="NutritionUI.scanLabel('${meal || 'snack'}')">Scan label instead</button>`);
  }

  function valOrEmpty(n) {
    return n == null || Number.isNaN(n) ? '' : String(n);
  }

  function showLabelConfirm(parsed, meal, note, rawText) {
    const basis =
      parsed.basis === 'per_serving'
        ? 'Per serving'
        : parsed.basis === 'per_100'
          ? 'Per 100 g/ml — check serving before you log'
          : 'Basis unclear — confirm macros';
    const rounded = parsed.roundedDown
      ? '<p class=meta style="margin-top:8px">At least one macro was “less than 1 g” and was read as 0.</p>'
      : '';
    const rawBlock = rawText
      ? `<details style="margin-top:10px"><summary class=meta>Edit scanned text</summary><textarea id=nutLabelRaw class="openbox tall">${esc(rawText)}</textarea><button type="button" class="btn block" style="margin-top:8px" onclick="NutritionUI.reparseFromRaw('${meal || 'snack'}')">Re-parse</button></details>`
      : '';
    sheet(`<h2>Confirm label</h2>
      <p class=lead>${esc(note || 'Check macros, then log. Nothing is saved until you confirm.')}</p>
      <p class=meta>${esc(basis)}</p>
      ${rounded}
      ${rawBlock}
      <div class=field><label>Name</label><input id=nutName placeholder="Food from label" value=""></div>
      <div class=field><label>Meal</label><select id=nutMeal>${MEALS.map((m) => `<option value="${m}" ${m === (meal || 'snack') ? 'selected' : ''}>${m}</option>`).join('')}</select></div>
      <div class=two>
        <div class=field><label>Calories</label><input id=nutKcal type=number min=0 step=0.1 value="${esc(valOrEmpty(parsed.calories))}"></div>
        <div class=field><label>Protein g</label><input id=nutP type=number min=0 step=0.1 value="${esc(valOrEmpty(parsed.proteinG))}"></div>
      </div>
      <div class=two>
        <div class=field><label>Carbs g</label><input id=nutC type=number min=0 step=0.1 value="${esc(valOrEmpty(parsed.carbsG))}"></div>
        <div class=field><label>Fat g</label><input id=nutF type=number min=0 step=0.1 value="${esc(valOrEmpty(parsed.fatG))}"></div>
      </div>
      <button type="button" class="btn primary block" style="margin-top:12px" onclick="NutritionUI.saveQuickAdd()">Log food</button>
      <button type="button" class="btn block" style="margin-top:8px" onclick="closeSheet()">Cancel</button>`);
  }

  function reparseFromRaw(meal) {
    try {
      const { parsed, rawText } = LabelScan.parsePastedText($('nutLabelRaw')?.value || '');
      showLabelConfirm(parsed, meal || 'snack', 'Updated from edited text.', rawText);
    } catch (e) {
      alert((e && e.message) || "Couldn't read label — fix the text or enter manually.");
    }
  }

  function foodResultRows(results, meal) {
    if (!results.length) return '<div class=meta>No matches. Try scan label or quick add.</div>';
    return results
      .map((r) => {
        const sub = [r.brand, `${Math.round(r.calories)} kcal · P ${Math.round(r.proteinG)} · C ${Math.round(r.carbsG)} · F ${Math.round(r.fatG)}`]
          .filter(Boolean)
          .join(' · ');
        return `<div class="nut-entry"><div><b>${esc(r.name)}</b><div class=meta>${esc(sub)}</div></div><button type="button" class="btn small primary" onclick="NutritionUI.logCatalogFood('${esc(r.id)}','${meal || 'snack'}')">Log</button></div>`;
      })
      .join('');
  }

  let foodQueryTimer = null;
  let foodQuerySeq = 0;

  function isNativeApp() {
    return !!(window.NativeBridge && NativeBridge.isNative && NativeBridge.isNative());
  }

  /** Barcode is the fast path — camera on APK, digits on web. Search is secondary. */
  function addFood(meal) {
    meal = meal || 'snack';
    ensureCatalog().then(() => {
      if (isNativeApp()) {
        scanBarcode(meal);
        return;
      }
      showBarcodeSheet(meal);
    });
  }

  function showBarcodeSheet(meal) {
    meal = meal || 'snack';
    sheet(`<h2>Scan barcode</h2>
      <p class=lead>Point at the barcode — fastest way to log a pack. Falls back to Open Food Facts, then label scan.</p>
      <button type="button" class="btn primary block" onclick="NutritionUI.scanBarcode('${meal}')">Scan barcode</button>
      <div class=field style="margin-top:14px"><label>Or type barcode digits</label><input id=nutBarcodeDigits type="tel" inputmode="numeric" autocomplete="off" placeholder="e.g. 9300657012345"></div>
      <button type="button" class="btn block" style="margin-top:8px" onclick="NutritionUI.lookupTypedBarcode('${meal}')">Look up barcode</button>
      <p class=meta style="margin-top:14px">Or search food by name</p>
      <div class=btns>
        <button type="button" class="btn small" onclick="NutritionUI.showSearchSheet('${meal}')">Search</button>
        <button type="button" class="btn small" onclick="NutritionUI.scanLabel('${meal}')">Label</button>
        <button type="button" class="btn small" onclick="NutritionUI.showPasteLabel('${meal}')">Paste</button>
        <button type="button" class="btn small" onclick="NutritionUI.quickAdd('${meal}')">Quick add</button>
      </div>`);
    setTimeout(() => {
      const el = $('nutBarcodeDigits');
      if (el) el.focus();
    }, 50);
  }

  function showSearchSheet(meal) {
    meal = meal || 'snack';
    ensureCatalog().then(() => {
      sheet(`<h2>Search food</h2>
        <p class=lead>AU staples offline + live Open Food Facts when online.</p>
        <button type="button" class="btn primary block" onclick="NutritionUI.scanBarcode('${meal}')">Scan barcode</button>
        <div class=field style="margin-top:12px"><label>Search</label><input id=nutFoodQuery placeholder="Oats, Chobani, chicken…" oninput="NutritionUI.onFoodQuery('${meal}')"></div>
        <div class=btns>
          <button type="button" class="btn small" onclick="NutritionUI.scanLabel('${meal}')">Label</button>
          <button type="button" class="btn small" onclick="NutritionUI.showPasteLabel('${meal}')">Paste</button>
          <button type="button" class="btn small" onclick="NutritionUI.quickAdd('${meal}')">Quick add</button>
        </div>
        <div id=nutFoodResults class=stack style="margin-top:12px;max-height:45vh;overflow:auto"></div>
        <p class=meta>${esc(catalogCountLabel())}</p>`);
      onFoodQuery(meal);
    });
  }

  async function resolveBarcodeCode(code, meal) {
    meal = meal || 'snack';
    await ensureCatalog();
    const status = $('nutBarcodeStatus');
    if (status) status.textContent = 'Looking up ' + code + '…';
    const food =
      (FoodCatalogAU.lookupBarcode && FoodCatalogAU.lookupBarcode(code)) ||
      (FoodCatalogAU.lookupBarcodeMerged && (await FoodCatalogAU.lookupBarcodeMerged(code)));
    if (food) {
      closeSheet();
      logCatalogFood(food.id, meal);
      return true;
    }
    closeSheet();
    sheet(`<h2>Barcode not found</h2>
      <p class=lead>${esc(code)} — not in local staples or Open Food Facts. Scan the nutrition label instead.</p>
      <button type="button" class="btn primary block" onclick="NutritionUI.scanLabel('${meal}')">Scan label</button>
      <button type="button" class="btn block" style="margin-top:8px" onclick="NutritionUI.showPasteLabel('${meal}')">Paste label text</button>
      <button type="button" class="btn block" style="margin-top:8px" onclick="NutritionUI.scanBarcode('${meal}')">Try another barcode</button>
      <button type="button" class="btn block" style="margin-top:8px" onclick="NutritionUI.quickAdd('${meal}')">Enter manually</button>`);
    return false;
  }

  async function lookupTypedBarcode(meal) {
    meal = meal || 'snack';
    const raw = String($('nutBarcodeDigits')?.value || '').trim();
    const code = window.FoodCatalogAU && FoodCatalogAU.normalizeBarcode
      ? FoodCatalogAU.normalizeBarcode(raw)
      : raw.replace(/\D/g, '');
    if (!code || code.length < 8) {
      alert('Enter the barcode digits (usually 8–13 numbers under the lines).');
      return;
    }
    sheet(`<h2>Scan barcode</h2><p class=lead>Looking up ${esc(code)}…</p><p class=meta id=nutBarcodeStatus>Open Food Facts</p>`);
    try {
      await resolveBarcodeCode(code, meal);
    } catch (e) {
      sheet(`<h2>Barcode lookup failed</h2><p class=lead>${esc((e && e.message) || 'Lookup failed')}</p>
        <button type="button" class="btn primary block" onclick="NutritionUI.showBarcodeSheet('${meal}')">Try again</button>
        <button type="button" class="btn block" style="margin-top:8px" onclick="NutritionUI.scanLabel('${meal}')">Scan label instead</button>`);
    }
  }

  function onFoodQuery(meal) {
    const q = String($('nutFoodQuery')?.value || '').trim();
    const box = $('nutFoodResults');
    if (!box) return;
    if (!window.FoodCatalogAU) {
      box.innerHTML = '<div class=meta>Catalog loading…</div>';
      return;
    }
    const seq = ++foodQuerySeq;
    const paint = (rows, note) => {
      if (seq !== foodQuerySeq || !$('nutFoodResults')) return;
      const noteHtml = note ? `<div class=meta style="margin-bottom:8px">${esc(note)}</div>` : '';
      $('nutFoodResults').innerHTML = noteHtml + foodResultRows(rows, meal);
    };
    // Instant local results, then debounce live OFF merge.
    const C = Core();
    const db = loadN();
    const local = FoodCatalogAU.searchCatalog(q, 30);
    const coreHits = q && C ? C.searchLocal(db, q).slice(0, 10) : [];
    const early = [];
    const seen = new Set();
    for (const f of local) {
      early.push(f);
      seen.add(f.id);
    }
    for (const hit of coreHits) {
      if (hit.kind === 'custom_food') {
        const cf = db.customFoods.find((x) => x.id === hit.id);
        if (cf && !seen.has(cf.id)) {
          early.push({ ...cf, id: cf.id, name: cf.name, brand: cf.brand, offline: true });
          seen.add(cf.id);
        }
      }
    }
    paint(early, q.length >= 2 ? 'Searching Open Food Facts…' : '');
    if (foodQueryTimer) clearTimeout(foodQueryTimer);
    if (q.length < 2) return;
    foodQueryTimer = setTimeout(async () => {
      try {
        const liveMerged = await FoodCatalogAU.searchMerged(q, 30);
        const rows = [];
        const ids = new Set();
        for (const f of liveMerged) {
          rows.push(f);
          ids.add(f.id);
        }
        for (const f of early) {
          if (!ids.has(f.id)) rows.push(f);
        }
        const liveCount = liveMerged.filter((f) => String(f.source) === 'openfoodfacts').length;
        paint(rows, liveCount ? `${liveCount} from Open Food Facts` : 'Offline / Open Food Facts unavailable — local only');
      } catch (_) {
        paint(early, 'Open Food Facts unavailable — local only');
      }
    }, 280);
  }

  function logCatalogFood(foodId, meal) {
    const C = Core();
    const db = loadN();
    const date = nutDate || todayStr();
    const catalogFood = window.FoodCatalogAU && FoodCatalogAU.getFood(foodId);
    const custom = db.customFoods.find((f) => f.id === foodId);
    const food = catalogFood || custom;
    if (!food || !C) return alert('Food not found.');
    let entry;
    if (catalogFood) {
      upsertCatalogFood(db, catalogFood);
      entry = C.logEntryFromFood({ id: uid(), logDate: date, meal: meal || 'snack', at: isoNow() }, catalogFood, 1, 'serving');
    } else {
      entry = C.logEntryFromCustomFood({ id: uid(), logDate: date, meal: meal || 'snack', at: isoNow() }, custom, 1, custom.servingUnit || 'serving');
    }
    db.logEntries.push(entry);
    markDayComplete(db, date);
    if (!saveN(db)) return alert('Could not save.');
    closeSheet();
    renderNutrition();
  }

  async function scanBarcode(meal) {
    meal = meal || 'snack';
    await ensureCatalog();
    if (!isNativeApp()) {
      showBarcodeSheet(meal);
      return;
    }
    closeSheet();
    sheet(`<h2>Scan barcode</h2><p class=lead>Point at the barcode…</p><p class=meta id=nutBarcodeStatus>Opening scanner</p>`);
    try {
      const code = await NativeBridge.scanBarcodeOnce();
      if (!code) throw new Error('No barcode detected.');
      await resolveBarcodeCode(code, meal);
    } catch (e) {
      if (e && e.code === 'barcode_unavailable') {
        alert('Barcode scanner unavailable on this build — type the digits instead.');
        showBarcodeSheet(meal);
        return;
      }
      sheet(`<h2>Scan barcode</h2><p class=lead>${esc((e && e.message) || 'Scan failed')}</p>
        <button type="button" class="btn primary block" onclick="NutritionUI.scanBarcode('${meal}')">Try again</button>
        <button type="button" class="btn block" style="margin-top:8px" onclick="NutritionUI.showBarcodeSheet('${meal}')">Type barcode</button>
        <button type="button" class="btn block" style="margin-top:8px" onclick="NutritionUI.scanLabel('${meal}')">Scan label instead</button>`);
    }
  }

  function showPasteLabel(meal, prefill) {
    sheet(`<h2>Paste label text</h2>
      <p class=lead>Paste the nutrition panel if the camera could not read it.</p>
      <div class=field><label>Label text</label><textarea id=nutLabelPaste class="openbox tall" placeholder="Energy 520kJ&#10;Protein 3.2g&#10;…">${esc(prefill || '')}</textarea></div>
      <button type="button" class="btn primary block" style="margin-top:12px" onclick="NutritionUI.parsePaste('${meal || 'snack'}')">Parse</button>
      <button type="button" class="btn block" style="margin-top:8px" onclick="closeSheet()">Cancel</button>`);
  }

  function parsePaste(meal) {
    try {
      if (!window.LabelScan) throw new Error('Label scan unavailable.');
      const { parsed, rawText } = LabelScan.parsePastedText($('nutLabelPaste')?.value || '');
      showLabelConfirm(parsed, meal || 'snack', null, rawText);
    } catch (e) {
      alert((e && e.message) || "Couldn't read label — enter manually.");
      quickAdd(meal || 'snack');
    }
  }

  async function scanLabel(meal) {
    meal = meal || 'snack';
    const native = !!(window.NativeBridge && NativeBridge.isNative && NativeBridge.isNative());
    if (!native) {
      showPasteLabel(meal);
      return;
    }
    closeSheet();
    try {
      if (!window.LabelScanLive) throw new Error('Live scan unavailable.');
      const { parsed, rawText } = await LabelScanLive.openLiveScan();
      showLabelConfirm(parsed, meal, null, rawText);
    } catch (e) {
      if (e && e.code === 'empty_label' && e.rawText) {
        showPasteLabel(meal, e.rawText);
        return;
      }
      if (e && e.message === 'Scan cancelled') return;
      sheet(`<h2>Scan label</h2>
        <p class=lead>${esc((e && e.message) || 'Scan failed')}</p>
        <button type="button" class="btn primary block" onclick="NutritionUI.scanLabel('${meal}')">Try again</button>
        <button type="button" class="btn block" style="margin-top:8px" onclick="NutritionUI.showPasteLabel('${meal}')">Paste label text</button>
        <button type="button" class="btn block" style="margin-top:8px" onclick="NutritionUI.quickAdd('${meal}')">Enter manually</button>`);
    }
  }

  async function scanFromCamera(meal) {
    return scanLabel(meal || 'snack');
  }

  function saveQuickAdd() {
    const C = Core();
    const db = loadN();
    const date = nutDate || todayStr();
    const name = String($('nutName')?.value || '').trim() || 'Food';
    const meal = String($('nutMeal')?.value || 'snack');
    const entry = C.quickAddEntry(
      { id: uid(), logDate: date, meal, at: isoNow() },
      {
        displayName: name,
        calories: Number($('nutKcal')?.value) || 0,
        proteinG: Number($('nutP')?.value) || 0,
        carbsG: Number($('nutC')?.value) || 0,
        fatG: Number($('nutF')?.value) || 0,
      },
    );
    db.logEntries.push(entry);
    markDayComplete(db, date);
    if (!saveN(db)) {
      alert('Could not save — storage may be full. Try Export backup in Settings, then retry.');
      return;
    }
    closeSheet();
    renderNutrition();
  }

  function markDayComplete(db, date) {
    const i = db.dayStatus.findIndex((d) => d.logDate === date);
    const row = { userId: '', logDate: date, status: 'complete', note: null, updatedAt: isoNow() };
    if (i >= 0) db.dayStatus[i] = row;
    else db.dayStatus.push(row);
  }

  function editEntry(entryId) {
    const C = Core();
    const db = loadN();
    const e = db.logEntries.find((x) => x.id === entryId);
    if (!e) return;
    sheet(`<h2>Edit entry</h2>
      <div class=field><label>Name</label><input id=nutName value="${esc(e.displayName)}"></div>
      <div class=field><label>Meal</label><select id=nutMeal>${MEALS.map((m) => `<option value="${m}" ${m === e.meal ? 'selected' : ''}>${m}</option>`).join('')}</select></div>
      <div class=two>
        <div class=field><label>Calories</label><input id=nutKcal type=number value="${e.calories}"></div>
        <div class=field><label>Protein g</label><input id=nutP type=number value="${e.proteinG}"></div>
      </div>
      <div class=two>
        <div class=field><label>Carbs g</label><input id=nutC type=number value="${e.carbsG}"></div>
        <div class=field><label>Fat g</label><input id=nutF type=number value="${e.fatG}"></div>
      </div>
      <button class="btn primary block" style="margin-top:12px" onclick="NutritionUI.saveEdit('${entryId}')">Save</button>`);
  }

  function saveEdit(entryId) {
    const C = Core();
    const db = loadN();
    const i = db.logEntries.findIndex((x) => x.id === entryId);
    if (i < 0) return;
    C.applyManualMacroEdit(
      db.logEntries[i],
      {
        displayName: String($('nutName')?.value || '').trim() || db.logEntries[i].displayName,
        meal: String($('nutMeal')?.value || db.logEntries[i].meal),
        calories: Number($('nutKcal')?.value) || 0,
        proteinG: Number($('nutP')?.value) || 0,
        carbsG: Number($('nutC')?.value) || 0,
        fatG: Number($('nutF')?.value) || 0,
      },
      isoNow(),
    );
    saveN(db);
    closeSheet();
    renderNutrition();
  }

  function deleteEntry(entryId) {
    if (!confirm('Remove this entry?')) return;
    const db = loadN();
    const e = db.logEntries.find((x) => x.id === entryId);
    if (!e) return;
    e.deletedAt = isoNow();
    e.updatedAt = isoNow();
    saveN(db);
    renderNutrition();
  }

  function targets() {
    const db = loadN();
    const date = nutDate || todayStr();
    const day = ensureTodayTargets(db, date);
    saveN(db);
    sheet(`<h2>Daily targets</h2>
      <p class=lead>For ${esc(dayLabel(date))}. Adaptive engine updates come later from weekly check-ins.</p>
      <div class=two>
        <div class=field><label>Calories</label><input id=tKcal type=number value="${day.calories}"></div>
        <div class=field><label>Protein g</label><input id=tP type=number value="${day.proteinG}"></div>
      </div>
      <div class=two>
        <div class=field><label>Carbs g</label><input id=tC type=number value="${day.carbsG}"></div>
        <div class=field><label>Fat g</label><input id=tF type=number value="${day.fatG}"></div>
      </div>
      <button class="btn primary block" style="margin-top:12px" onclick="NutritionUI.saveTargets()">Save targets</button>`);
  }

  function saveTargets() {
    const db = loadN();
    const date = nutDate || todayStr();
    const day = ensureTodayTargets(db, date);
    day.calories = Number($('tKcal')?.value) || 0;
    day.proteinG = Number($('tP')?.value) || 0;
    day.carbsG = Number($('tC')?.value) || 0;
    day.fatG = Number($('tF')?.value) || 0;
    day.source = 'manual';
    db.program.updatedAt = isoNow();
    saveN(db);
    closeSheet();
    renderNutrition();
  }

  function weightDay(iso) {
    try {
      return iso.slice(0, 10);
    } catch {
      return '';
    }
  }

  function weight() {
    const db = loadN();
    const live = db.weightEntries
      .filter((w) => !w.deletedAt)
      .sort((a, b) => (a.measuredAt < b.measuredAt ? 1 : -1));
    const rows =
      live
        .slice(0, 14)
        .map((w) => `<div class=meta>${esc(weightDay(w.measuredAt))} · <b>${w.weightKg} kg</b></div>`)
        .join('') || '<div class=meta>No weigh-ins yet.</div>';
    sheet(`<h2>Weight</h2>
      <div class=field><label>Today (kg)</label><input id=nutKg type=number step=0.1 placeholder="82.4"></div>
      <button class="btn primary block" style="margin-top:12px" onclick="NutritionUI.saveWeight()">Log weight</button>
      <div class=stack style="margin-top:14px">${rows}</div>`);
  }

  function saveWeight() {
    const kg = Number($('nutKg')?.value);
    if (!(kg >= 20 && kg <= 500)) return alert('Enter a weight between 20 and 500 kg.');
    const db = loadN();
    const at = isoNow();
    const day = todayStr();
    const existing = db.weightEntries.find((w) => !w.deletedAt && weightDay(w.measuredAt) === day);
    if (existing) {
      existing.weightKg = kg;
      existing.measuredAt = at;
      existing.updatedAt = at;
    } else {
      db.weightEntries.push({
        id: uid(),
        userId: '',
        measuredAt: at,
        weightKg: kg,
        source: 'manual',
        note: null,
        createdAt: at,
        updatedAt: at,
        deletedAt: null,
      });
    }
    saveN(db);
    closeSheet();
    renderNutrition();
  }

  function foods() {
    const db = loadN();
    const C = Core();
    const customs = (db.customFoods || []).filter((f) => C.isLive(f));
    const rows = customs.length
      ? customs
          .map(
            (f) =>
              `<div class="nut-entry"><div><b>${esc(f.name)}</b><div class=meta>${Math.round(f.calories)} kcal · P ${Math.round(f.proteinG)}</div></div><button class="btn small" onclick="NutritionUI.logCustom('${f.id}')">Log</button></div>`,
          )
          .join('')
      : '<div class=meta>No custom foods yet.</div>';
    sheet(`<h2>My foods</h2>
      <p class=lead>Local custom foods. Shared catalogue stays on the hybrid server.</p>
      ${rows}
      <button class="btn primary block" style="margin-top:12px" onclick="NutritionUI.newCustom()">New custom food</button>`);
  }

  function newCustom() {
    sheet(`<h2>Custom food</h2>
      <div class=field><label>Name</label><input id=cfName></div>
      <div class=two>
        <div class=field><label>Calories / serving</label><input id=cfKcal type=number value="0"></div>
        <div class=field><label>Protein g</label><input id=cfP type=number value="0"></div>
      </div>
      <div class=two>
        <div class=field><label>Carbs g</label><input id=cfC type=number value="0"></div>
        <div class=field><label>Fat g</label><input id=cfF type=number value="0"></div>
      </div>
      <button class="btn primary block" style="margin-top:12px" onclick="NutritionUI.saveCustom()">Save food</button>`);
  }

  function saveCustom() {
    const db = loadN();
    const at = isoNow();
    const name = String($('cfName')?.value || '').trim();
    if (!name) return alert('Name the food.');
    db.customFoods.push({
      id: uid(),
      userId: '',
      name,
      brand: null,
      barcode: null,
      servingQty: 1,
      servingUnit: 'serving',
      calories: Number($('cfKcal')?.value) || 0,
      proteinG: Number($('cfP')?.value) || 0,
      carbsG: Number($('cfC')?.value) || 0,
      fatG: Number($('cfF')?.value) || 0,
      nutrients: {},
      source: 'user_custom',
      createdAt: at,
      updatedAt: at,
      deletedAt: null,
    });
    saveN(db);
    closeSheet();
    foods();
  }

  function logCustom(customId) {
    const C = Core();
    const db = loadN();
    const food = db.customFoods.find((f) => f.id === customId);
    if (!food) return;
    const date = nutDate || todayStr();
    const entry = C.logEntryFromCustomFood(
      { id: uid(), logDate: date, meal: 'snack', at: isoNow() },
      food,
      1,
      food.servingUnit || 'serving',
    );
    db.logEntries.push(entry);
    markDayComplete(db, date);
    saveN(db);
    closeSheet();
    renderNutrition();
  }

  /** Home module card HTML (injected by host). */
  function homeModuleHtml() {
    const C = Core();
    if (!C) {
      return `<button type=button class=ath-module onclick="NutritionUI.open()" aria-label="Nutrition"><span class=ath-label>NUTRITION</span><div class=ath-cond><p class=ath-hint>Bundle loading…</p></div><span class=ath-chev aria-hidden=true>›</span></button>`;
    }
    const db = loadN();
    const date = todayStr();
    const totals = C.macroTotals(C.entriesForDay(db, date));
    const target = C.targetForDay(db.program, date);
    const left = target ? Math.max(0, Math.round(target.calories - totals.calories)) : null;
    const hint = target
      ? `${Math.round(totals.calories)} / ${Math.round(target.calories)} kcal · ${left} left`
      : `${Math.round(totals.calories)} kcal logged · set targets inside`;
    return `<button type=button class=ath-module onclick="NutritionUI.open()" aria-label="Nutrition — daily food log"><span class=ath-label>NUTRITION</span><div class=ath-cond><p class=ath-hint>${esc(hint)}</p><div class=ath-legend>
      <div class=ath-row><span class=ath-ll>Protein</span><span class=ath-lv>${Math.round(totals.proteinG)}g</span></div>
      <div class=ath-row><span class=ath-ll>Carbs</span><span class=ath-lv>${Math.round(totals.carbsG)}g</span></div>
      <div class=ath-row><span class=ath-ll>Fat</span><span class=ath-lv>${Math.round(totals.fatG)}g</span></div>
    </div></div><span class=ath-chev aria-hidden=true>›</span></button>`;
  }

  window.NutritionUI = {
    open: openNutrition,
    addFood,
    showBarcodeSheet,
    showSearchSheet,
    lookupTypedBarcode,
    resolveBarcodeCode,
    onFoodQuery,
    logCatalogFood,
    scanBarcode,
    scanLabel,
    scanFromCamera,
    showPasteLabel,
    parsePaste,
    reparseFromRaw,
    shift,
    quickAdd,
    saveQuickAdd,
    editEntry,
    saveEdit,
    deleteEntry,
    targets,
    saveTargets,
    weight,
    saveWeight,
    foods,
    newCustom,
    saveCustom,
    logCustom,
    homeModuleHtml,
    load: loadN,
  };
})();
