/**
 * AU food catalog — offline JSON + live Open Food Facts JSON API.
 * Local catalog is always searched first; live OFF fills gaps when online.
 * Never ships the multi-GB OFF dump.
 */
(function (global) {
  const CATALOG_URL = './food-catalog-au.json';
  const OFF_ORIGIN = 'https://world.openfoodfacts.org';
  const USER_AGENT = 'TheStrengthEngine/1.0 (athlete nutrition; contact=dogfood)';
  let catalog = null;
  let loadPromise = null;
  let byBarcode = null;
  let byId = null;

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
    const id = 'off-' + code;
    const servings = [];
    // Attach an explicit serving→g/ml row when OFF states a mass/volume that
    // matches the per-100g (or ml) basis. Never invent density.
    const parsed =
      window.HybridNutrition &&
      HybridNutrition.Core &&
      HybridNutrition.Core.parseServingSizeText
        ? HybridNutrition.Core.parseServingSizeText(serving)
        : parseServingSizeLocal(serving);
    if (parsed && parsed.unit === 'g') {
      servings.push({
        id: id + '-serving',
        foodId: id,
        label: serving || 'serving',
        quantity: 1,
        unit: 'serving',
        grams: parsed.amount,
        millilitres: null,
        isDefault: true,
        sortOrder: 0,
      });
    }
    return {
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
      servings,
      cachedAt: new Date().toISOString(),
    };
  }

  /** Local fallback when nutrition-core is not loaded yet. */
  function parseServingSizeLocal(text) {
    if (!text) return null;
    const raw = String(text).trim();
    const paren = /\(([^)]*)\)/.exec(raw);
    const outside = raw.replace(/\([^)]*\)/g, ' ');
    const re = /(\d+(?:[.,]\d+)?|\d*[.,]\d+)\s*(kg|mg|ml|g|l)\b/i;
    const m = (paren ? re.exec(paren[1]) : null) || re.exec(outside);
    if (!m) return null;
    let amount = Number(String(m[1]).replace(',', '.'));
    if (!Number.isFinite(amount) || amount <= 0) return null;
    let unit = m[2].toLowerCase();
    if (unit === 'kg') {
      amount *= 1000;
      unit = 'g';
    } else if (unit === 'mg') {
      amount /= 1000;
      unit = 'g';
    } else if (unit === 'l') {
      amount *= 1000;
      unit = 'ml';
    }
    if (unit !== 'g' && unit !== 'ml') return null;
    return { amount, unit };
  }

  async function offFetch(url) {
    const res = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': USER_AGENT },
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('OFF HTTP ' + res.status);
    const ct = String((res.headers && res.headers.get && res.headers.get('content-type')) || '');
    // OFF sometimes returns an HTML "temporarily unavailable" page with 200.
    if (ct.includes('text/html')) throw new Error('OFF unavailable');
    return res.json();
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
    const url =
      OFF_ORIGIN +
      '/cgi/search.pl?action=process' +
      '&tagtype_0=countries&tag_contains_0=contains&tag_0=australia' +
      '&search_terms=' +
      encodeURIComponent(q) +
      '&json=1&page_size=' +
      Math.min(50, limit) +
      '&page=1' +
      '&fields=code,product_name,product_name_en,brands,brand_owner,serving_size,nutriments';
    const data = await offFetch(url);
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
    const url =
      OFF_ORIGIN +
      '/api/v2/product/' +
      encodeURIComponent(bc) +
      '.json?fields=code,product_name,product_name_en,brands,brand_owner,serving_size,nutriments';
    const data = await offFetch(url);
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
    return { count: catalog.count, source: catalog.source, builtAt: catalog.builtAt };
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
