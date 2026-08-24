/**
 * Bundled AU food catalog — offline search + barcode lookup for the APK.
 * Loaded once from food-catalog-au.json (Open Food Facts AU subset).
 */
(function (global) {
  const CATALOG_URL = './food-catalog-au.json';
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

  function buildIndexes(list) {
    byBarcode = new Map();
    byId = new Map();
    for (const f of list) {
      byId.set(f.id, f);
      const bc = normalizeBarcode(f.barcode);
      if (bc) byBarcode.set(bc, f);
    }
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
    return byId ? byId.get(id) || null : null;
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
  };
})(typeof window !== 'undefined' ? window : globalThis);
