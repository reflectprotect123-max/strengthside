/**
 * AU food catalog — offline JSON + live Open Food Facts JSON API.
 * Local catalog is always searched first; live OFF fills gaps when online.
 * Never ships the multi-GB OFF dump.
 *
 * OFF .org search has been returning HTML 503 intermittently; we fall back to
 * .net (OFF staging) and optionally the same-origin Netlify proxy.
 */
(function (global) {
  const CATALOG_URL = './food-catalog-au.json';
  const OFF_ORIGINS = [
    'https://world.openfoodfacts.org',
    'https://world.openfoodfacts.net',
  ];
  const USER_AGENT = 'TheStrengthEngine/1.0 (athlete nutrition; contact=dogfood)';
  let catalog = null;
  let loadPromise = null;
  let byBarcode = null;
  let byId = null;
  let lastLiveError = '';

  function normalizeBarcode(code) {
    return String(code || '')
      .replace(/\D/g, '')
      .trim();
  }

  function matches(hay, needle) {
    return String(hay || '')
      .toLowerCase()
      .includes(needle);
  }

  function num(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  function buildIndexes(list) {
    byBarcode = new Map();
    byId = new Map();
    for (const f of list) {
      byId.set(f.id, f);
      const bc = normalizeBarcode(f.barcode);
      if (bc) byBarcode.set(bc, f);
    }
  }

  function productToFood(p) {
    if (!p || typeof p !== 'object') return null;
    const n = p.nutriments || {};
    const kcal =
      num(n['energy-kcal_100g']) ??
      (num(n.energy_100g) != null ? num(n.energy_100g) / 4.184 : null);
    const proteinG = num(n.proteins_100g);
    const carbsG = num(n.carbohydrates_100g);
    const fatG = num(n.fat_100g);
    if (kcal == null && proteinG == null && carbsG == null && fatG == null) return null;
    const name = String(p.product_name || p.product_name_en || '').trim();
    if (!name) return null;
    const code = String(p.code || p._id || '').trim();
    if (!code) return null;
    const brand = String(p.brands || p.brand_owner || '')
      .split(',')[0]
      .trim() || null;
    const serving = String(p.serving_size || '').trim() || null;
    const servingQtyField = p.serving_quantity != null ? p.serving_quantity : n.serving_quantity;
    const servingUnitField =
      p.serving_quantity_unit != null ? p.serving_quantity_unit : n.serving_quantity_unit;
    const id = 'off-' + code;
    let food = {
      id,
      name,
      brand,
      barcode: code,
      servingQty: 100,
      servingUnit: 'g',
      calories: kcal ?? 0,
      proteinG: proteinG ?? 0,
      carbsG: carbsG ?? 0,
      fatG: fatG ?? 0,
      nutritionBasisQty: 100,
      nutritionBasisUnit: 'g',
      servingSizeText: serving,
      source: 'openfoodfacts',
      externalId: code,
      nutrients: {},
      servings: [],
      cachedAt: new Date().toISOString(),
    };
    const fields = {
      servingSizeText: serving,
      servingQuantity: servingQtyField,
      servingQuantityUnit: servingUnitField,
    };
    if (global.HybridNutrition && HybridNutrition.Core && HybridNutrition.Core.enrichFoodServings) {
      food = HybridNutrition.Core.enrichFoodServings(food, fields);
    } else {
      const parsed = parseServingSizeLocal(serving, servingQtyField, servingUnitField);
      if (parsed && parsed.unit === 'g') {
        food.servings = [
          {
            id: id + '-serving',
            foodId: id,
            label: serving || parsed.amount + ' g',
            quantity: 1,
            unit: 'serving',
            grams: parsed.amount,
            millilitres: null,
            isDefault: true,
            sortOrder: 0,
          },
        ];
      }
    }
    return food;
  }

  function parseServingSizeLocal(text, qty, unit) {
    if (qty != null && unit) {
      let amount = Number(qty);
      let u = String(unit).toLowerCase().trim();
      if (Number.isFinite(amount) && amount > 0) {
        if (u === 'g') return { amount, unit: 'g' };
        if (u === 'mg') return { amount: amount / 1000, unit: 'g' };
        if (u === 'kg') return { amount: amount * 1000, unit: 'g' };
        if (u === 'ml') return { amount, unit: 'ml' };
        if (u === 'l') return { amount: amount * 1000, unit: 'ml' };
        if (u === 'cl') return { amount: amount * 10, unit: 'ml' };
      }
    }
    if (!text) return null;
    const raw = String(text).trim();
    const paren = /\(([^)]*)\)/.exec(raw);
    const outside = raw.replace(/\([^)]*\)/g, ' ');
    const re = /(\d+(?:[.,]\d+)?|\d*[.,]\d+)\s*(fl\.?\s*oz|floz|oz|kg|mg|ml|cl|g|l)\b/i;
    const m = (paren ? re.exec(paren[1]) : null) || re.exec(outside) || re.exec(raw);
    if (!m) return null;
    let amount = Number(String(m[1]).replace(',', '.'));
    if (!Number.isFinite(amount) || amount <= 0) return null;
    let u = m[2].toLowerCase().replace(/\./g, '').replace(/\s+/g, '');
    if (u === 'kg') {
      amount *= 1000;
      u = 'g';
    } else if (u === 'mg') {
      amount /= 1000;
      u = 'g';
    } else if (u === 'l') {
      amount *= 1000;
      u = 'ml';
    } else if (u === 'cl') {
      amount *= 10;
      u = 'ml';
    } else if (u === 'oz') {
      amount *= 28.349523125;
      u = 'g';
    } else if (u === 'floz') {
      amount *= 29.5735295625;
      u = 'ml';
    }
    if (u !== 'g' && u !== 'ml') return null;
    return { amount, unit: u };
  }

  function resolveProxyBase() {
    try {
      const host = String((global.location && global.location.hostname) || '');
      if (host === 'thehybridsystem.netlify.app') return '';
      if (host === 'localhost' || host === '127.0.0.1') return 'https://thehybridsystem.netlify.app';
      // Capacitor / native WebView
      if (String((global.location && global.location.protocol) || '').startsWith('http') === false) {
        return 'https://thehybridsystem.netlify.app';
      }
      if (host && host !== 'thehybridsystem.netlify.app') return 'https://thehybridsystem.netlify.app';
    } catch (_) {}
    return 'https://thehybridsystem.netlify.app';
  }

  async function fetchJson(url) {
    const res = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': USER_AGENT },
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('OFF HTTP ' + res.status);
    const ct = String((res.headers && res.headers.get && res.headers.get('content-type')) || '');
    if (ct.includes('text/html')) throw new Error('OFF unavailable');
    return res.json();
  }

  /** path starts with /cgi/ or /api/ */
  async function offFetch(pathAndQuery) {
    const path = String(pathAndQuery || '');
    if (!path.startsWith('/')) throw new Error('bad OFF path');
    let lastErr = null;
    for (const origin of OFF_ORIGINS) {
      try {
        return await fetchJson(origin + path);
      } catch (e) {
        lastErr = e;
      }
    }
    // Same-origin / athlete Netlify proxy (survives .org outages + Capacitor CORS).
    try {
      const base = resolveProxyBase();
      const proxyUrl = base + '/.netlify/functions/off-proxy?path=' + encodeURIComponent(path);
      return await fetchJson(proxyUrl);
    } catch (e) {
      lastErr = e;
    }
    lastLiveError = String((lastErr && lastErr.message) || lastErr || 'OFF failed');
    throw lastErr || new Error('OFF failed');
  }

  async function loadCatalog(force) {
    if (catalog && !force) return catalog;
    if (loadPromise && !force) return loadPromise;
    loadPromise = (async () => {
      const res = await fetch(CATALOG_URL, { cache: 'force-cache' });
      if (!res.ok) throw new Error('Food catalog failed to load.');
      const data = await res.json();
      catalog = {
        version: data.version || 1,
        source: data.source || 'unknown',
        builtAt: data.builtAt || null,
        count: data.count || (data.foods || []).length,
        foods: Array.isArray(data.foods) ? data.foods : [],
      };
      buildIndexes(catalog.foods);
      return catalog;
    })();
    return loadPromise;
  }

  function searchCatalog(query, limit) {
    limit = limit || 40;
    if (!catalog) return [];
    const q = String(query || '')
      .trim()
      .toLowerCase();
    if (!q) return catalog.foods.slice(0, limit);
    const out = [];
    for (const f of catalog.foods) {
      if (matches(f.name, q) || matches(f.brand, q) || matches(f.barcode, q)) {
        out.push(f);
        if (out.length >= limit) break;
      }
    }
    return out;
  }

  function lookupBarcode(code) {
    if (!byBarcode) return null;
    const bc = normalizeBarcode(code);
    if (!bc) return null;
    return byBarcode.get(bc) || null;
  }

  function getFood(id) {
    if (!id) return null;
    if (byId && byId.has(id)) return byId.get(id);
    return null;
  }

  function rememberLive(food) {
    if (!food || !food.id) return food;
    if (!byId) byId = new Map();
    if (!byBarcode) byBarcode = new Map();
    byId.set(food.id, food);
    const bc = normalizeBarcode(food.barcode);
    if (bc) byBarcode.set(bc, food);
    return food;
  }

  async function searchLive(query, limit) {
    limit = limit || 20;
    const q = String(query || '').trim();
    if (q.length < 2) return [];
    lastLiveError = '';
    const path =
      '/cgi/search.pl?action=process' +
      '&tagtype_0=countries&tag_contains_0=contains&tag_0=australia' +
      '&search_terms=' +
      encodeURIComponent(q) +
      '&json=1&page_size=' +
      Math.min(50, limit) +
      '&page=1' +
      '&fields=code,product_name,product_name_en,brands,brand_owner,serving_size,serving_quantity,serving_quantity_unit,nutriments';
    const data = await offFetch(path);
    const products = Array.isArray(data.products) ? data.products : [];
    const out = [];
    const seen = new Set();
    for (const p of products) {
      const food = productToFood(p);
      if (!food || seen.has(food.id)) continue;
      seen.add(food.id);
      rememberLive(food);
      out.push(food);
      if (out.length >= limit) break;
    }
    return out;
  }

  async function lookupBarcodeLive(code) {
    const bc = normalizeBarcode(code);
    if (!bc || bc.length < 8) return null;
    lastLiveError = '';
    const path =
      '/api/v2/product/' +
      encodeURIComponent(bc) +
      '.json?fields=code,product_name,product_name_en,brands,brand_owner,serving_size,serving_quantity,serving_quantity_unit,nutriments';
    const data = await offFetch(path);
    if (!data || data.status !== 1) return null;
    const food = productToFood(data.product || data);
    if (!food) return null;
    return rememberLive(food);
  }

  async function searchMerged(query, limit) {
    limit = limit || 40;
    const local = searchCatalog(query, limit);
    const q = String(query || '').trim();
    if (q.length < 2) return local;
    let live = [];
    try {
      live = await searchLive(q, limit);
    } catch (_) {
      live = [];
    }
    const out = [];
    const seen = new Set();
    for (const f of local) {
      out.push(f);
      seen.add(f.id);
      const bc = normalizeBarcode(f.barcode);
      if (bc) seen.add('off-' + bc);
    }
    for (const f of live) {
      if (seen.has(f.id)) continue;
      const bc = normalizeBarcode(f.barcode);
      if (bc && seen.has('off-' + bc)) continue;
      out.push(f);
      seen.add(f.id);
      if (out.length >= limit) break;
    }
    return out;
  }

  async function lookupBarcodeMerged(code) {
    const local = lookupBarcode(code);
    if (local) return local;
    try {
      if (global.NutritionSync && typeof global.NutritionSync.lookupBarcodeCloud === 'function') {
        const cloud = await global.NutritionSync.lookupBarcodeCloud(code);
        if (cloud) return cloud;
      }
    } catch (_) {}
    try {
      return await lookupBarcodeLive(code);
    } catch (_) {
      return null;
    }
  }

  function catalogMeta() {
    if (!catalog) return null;
    return { count: catalog.count, source: catalog.source, builtAt: catalog.builtAt, lastLiveError };
  }

  global.FoodCatalogAU = {
    loadCatalog,
    searchCatalog,
    lookupBarcode,
    getFood,
    catalogMeta,
    normalizeBarcode,
    productToFood,
    rememberLive,
    searchLive,
    lookupBarcodeLive,
    searchMerged,
    lookupBarcodeMerged,
  };
})(typeof window !== 'undefined' ? window : globalThis);
