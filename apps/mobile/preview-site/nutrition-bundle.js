var HybridNutrition = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // nutrition-entry.ts
  var nutrition_entry_exports = {};
  __export(nutrition_entry_exports, {
    Core: () => src_exports,
    Engine: () => src_exports2
  });

  // ../../../../packages/nutrition-core/src/index.ts
  var src_exports = {};
  __export(src_exports, {
    CHECK_IN_STATUSES: () => CHECK_IN_STATUSES,
    DAY_STATUS_VALUES: () => DAY_STATUS_VALUES,
    ENTRY_KINDS: () => ENTRY_KINDS,
    IncompatibleUnitError: () => IncompatibleUnitError,
    MEALS: () => MEALS,
    NUTRITION_SCHEMA_VERSION: () => NUTRITION_SCHEMA_VERSION,
    PROGRAM_GOALS: () => PROGRAM_GOALS,
    PROGRAM_MODES: () => PROGRAM_MODES,
    PROGRAM_STATUSES: () => PROGRAM_STATUSES,
    ZERO_MACROS: () => ZERO_MACROS,
    ZERO_TOTALS: () => ZERO_TOTALS,
    applyManualMacroEdit: () => applyManualMacroEdit,
    catalogueResult: () => catalogueResult,
    emptyNutritionDB: () => emptyNutritionDB,
    enrichFoodServings: () => enrichFoodServings,
    entriesForDay: () => entriesForDay,
    favoriteKey: () => favoriteKey,
    favoriteKeys: () => favoriteKeys,
    favoriteResults: () => favoriteResults,
    foodSearch: () => foodSearch,
    forLoggedServings: () => forLoggedServings,
    groupByMeal: () => groupByMeal,
    isEmptyLabel: () => isEmptyLabel,
    isLive: () => isLive,
    liveCustomFoods: () => liveCustomFoods,
    liveRecipes: () => liveRecipes,
    logEntryFromCustomFood: () => logEntryFromCustomFood,
    logEntryFromFood: () => logEntryFromFood,
    logEntryFromRecipe: () => logEntryFromRecipe,
    loggableUnits: () => loggableUnits,
    macroTotals: () => macroTotals,
    mergeNutrition: () => mergeNutrition,
    normaliseAmount: () => normaliseAmount,
    parseHouseholdServing: () => parseHouseholdServing,
    parseLabelLines: () => parseLabelLines,
    parseLabelText: () => parseLabelText,
    parseServingSizeText: () => parseServingSizeText,
    perServing: () => perServing,
    pickDefaultLogQuantity: () => pickDefaultLogQuantity,
    quickAddEntry: () => quickAddEntry,
    recentResults: () => recentResults,
    resolveFoodMacros: () => resolveFoodMacros,
    resolveRecipeItem: () => resolveRecipeItem,
    resolveRecipePerServing: () => resolveRecipePerServing,
    resolveServingAmount: () => resolveServingAmount,
    sanitizeNutritionDB: () => sanitizeNutritionDB,
    scaleByServing: () => scaleByServing,
    scaleTo: () => scaleTo,
    searchLocal: () => searchLocal,
    sumMacros: () => sumMacros,
    targetForDay: () => targetForDay,
    upsertCachedFood: () => upsertCachedFood
  });

  // ../../../../packages/nutrition-core/src/types.ts
  var ENTRY_KINDS = ["food", "custom_food", "recipe", "quick_add"];
  var MEALS = ["breakfast", "lunch", "dinner", "snack", "other"];
  var DAY_STATUS_VALUES = ["complete", "partial", "fasted", "unlogged"];
  var PROGRAM_MODES = ["coached", "collaborative", "manual"];
  var PROGRAM_GOALS = ["lose", "gain", "maintain"];
  var PROGRAM_STATUSES = ["draft", "active", "paused", "completed"];
  var CHECK_IN_STATUSES = ["pending", "held", "accepted", "declined"];

  // ../../../../packages/nutrition-core/src/db.ts
  var NUTRITION_SCHEMA_VERSION = 1;
  function emptyNutritionDB() {
    return {
      schemaVersion: NUTRITION_SCHEMA_VERSION,
      logEntries: [],
      weightEntries: [],
      program: null,
      checkIns: [],
      dayStatus: [],
      customFoods: [],
      recipes: [],
      favorites: [],
      foodCache: [],
      settings: {}
    };
  }
  function upsertCachedFood(draft, food) {
    const i = draft.foodCache.findIndex((f) => f.id === food.id);
    if (i >= 0) draft.foodCache[i] = food;
    else draft.foodCache.push(food);
  }
  var EPOCH = "1970-01-01T00:00:00.000Z";
  var isRecord = (v) => v != null && typeof v === "object" && !Array.isArray(v);
  var arr = (v) => Array.isArray(v) ? v : [];
  var str = (v, fallback = "") => typeof v === "string" ? v : fallback;
  var idOrNull = (v) => typeof v === "string" && v !== "" ? v : null;
  var optStr = (v) => typeof v === "string" ? v : null;
  var tsOrNull = (v) => typeof v === "string" && Number.isFinite(Date.parse(v)) ? v : null;
  var stamp = (v) => typeof v === "string" && v !== "" ? v : EPOCH;
  var finiteOr = (v, fallback) => typeof v === "number" && Number.isFinite(v) ? v : fallback;
  var num = (v, fallback, min, max) => Math.min(max, Math.max(min, finiteOr(v, fallback)));
  var optNum = (v) => typeof v === "number" && Number.isFinite(v) ? v : null;
  var oneOf = (v, allowed) => typeof v === "string" && allowed.includes(v) ? v : null;
  var scrubProto = (v) => {
    if (Array.isArray(v)) return v.map(scrubProto);
    if (!isRecord(v)) return v;
    const out = {};
    for (const k of Object.keys(v)) {
      if (k === "__proto__") continue;
      out[k] = scrubProto(v[k]);
    }
    return out;
  };
  var plainObject = (v) => isRecord(v) ? scrubProto(v) : {};
  var nutrientMap = (v) => {
    const src = plainObject(v);
    const out = {};
    for (const k of Object.keys(src)) {
      const n = src[k];
      if (typeof n === "number" && Number.isFinite(n)) out[k] = n;
    }
    return out;
  };
  var sourceSnapshot = (v) => plainObject(v);
  var checkInModules = (v) => arr(v).filter(isRecord).filter((m) => typeof m.key === "string" && typeof m.action === "string").map((m) => ({ key: m.key, action: m.action }));
  function cleanLogEntry(raw) {
    if (!isRecord(raw)) return null;
    const id = idOrNull(raw.id);
    if (!id) return null;
    const entryKind = oneOf(raw.entryKind, ENTRY_KINDS);
    if (!entryKind) return null;
    const logDate = idOrNull(raw.logDate);
    if (!logDate) return null;
    return {
      id,
      userId: str(raw.userId),
      logDate,
      meal: str(raw.meal, "other"),
      entryKind,
      // Provenance links are a uuid or absent; `''` is neither, and would be read
      // as "there is a source" by every truthiness check that guards a lookup.
      foodId: idOrNull(raw.foodId),
      customFoodId: idOrNull(raw.customFoodId),
      recipeId: idOrNull(raw.recipeId),
      // `quantity > 0` in the schema; fall back to the column default rather than
      // to 0, which would read as "ate none of it" next to real macro numbers.
      quantity: (() => {
        const q = num(raw.quantity, 1, 0, Number.MAX_SAFE_INTEGER);
        return q > 0 ? q : 1;
      })(),
      unit: str(raw.unit, "serving"),
      // Snapshot fields: clamped to a sane range but never recomputed from the
      // source food — see the FoodLogEntry doc comment.
      calories: num(raw.calories, 0, 0, Number.MAX_SAFE_INTEGER),
      proteinG: num(raw.proteinG, 0, 0, Number.MAX_SAFE_INTEGER),
      carbsG: num(raw.carbsG, 0, 0, Number.MAX_SAFE_INTEGER),
      fatG: num(raw.fatG, 0, 0, Number.MAX_SAFE_INTEGER),
      displayName: str(raw.displayName),
      nutrients: nutrientMap(raw.nutrients),
      notes: optStr(raw.notes),
      sourceSnapshot: sourceSnapshot(raw.sourceSnapshot),
      createdAt: stamp(raw.createdAt),
      updatedAt: stamp(raw.updatedAt),
      deletedAt: tsOrNull(raw.deletedAt)
    };
  }
  var servingQty = (v) => {
    const q = finiteOr(v, 0);
    return q > 0 ? q : 100;
  };
  var macroFields = (raw) => ({
    calories: num(raw.calories, 0, 0, Number.MAX_SAFE_INTEGER),
    proteinG: num(raw.proteinG, 0, 0, Number.MAX_SAFE_INTEGER),
    carbsG: num(raw.carbsG, 0, 0, Number.MAX_SAFE_INTEGER),
    fatG: num(raw.fatG, 0, 0, Number.MAX_SAFE_INTEGER)
  });
  function cleanFoodServing(raw, foodId) {
    if (!isRecord(raw)) return null;
    const id = idOrNull(raw.id);
    if (!id) return null;
    const quantity = finiteOr(raw.quantity, 0);
    if (quantity <= 0) return null;
    const unit = str(raw.unit);
    if (!unit) return null;
    return {
      id,
      // Re-homed onto the food that carries it, exactly as a program day is
      // re-homed onto its program: a serving whose `foodId` disagrees with its
      // parent is refused by `scaleByServing`, so a bad copy would silently make
      // the food un-loggable in that unit.
      foodId,
      label: str(raw.label),
      quantity,
      unit,
      // null rather than 0: 0 g is a conversion that would scale every macro to
      // nothing, where "no gram conversion recorded" makes the scaler say so.
      grams: optNum(raw.grams),
      millilitres: optNum(raw.millilitres),
      isDefault: raw.isDefault === true,
      sortOrder: Math.trunc(finiteOr(raw.sortOrder, 0))
    };
  }
  function cleanCachedFood(raw) {
    if (!isRecord(raw)) return null;
    const id = idOrNull(raw.id);
    if (!id) return null;
    return {
      id,
      name: str(raw.name),
      brand: optStr(raw.brand),
      barcode: optStr(raw.barcode),
      servingQty: servingQty(raw.servingQty),
      servingUnit: str(raw.servingUnit, "g"),
      ...macroFields(raw),
      nutritionBasisQty: servingQty(raw.nutritionBasisQty),
      nutritionBasisUnit: str(raw.nutritionBasisUnit, "g"),
      servingSizeText: optStr(raw.servingSizeText),
      source: str(raw.source, "custom"),
      externalId: optStr(raw.externalId),
      nutrients: nutrientMap(raw.nutrients),
      servings: arr(raw.servings).map((s) => cleanFoodServing(s, id)).filter((s) => s !== null),
      cachedAt: stamp(raw.cachedAt)
    };
  }
  function cleanCustomFood(raw) {
    if (!isRecord(raw)) return null;
    const id = idOrNull(raw.id);
    if (!id) return null;
    return {
      id,
      userId: str(raw.userId),
      name: str(raw.name),
      brand: optStr(raw.brand),
      barcode: optStr(raw.barcode),
      servingQty: servingQty(raw.servingQty),
      servingUnit: str(raw.servingUnit, "g"),
      ...macroFields(raw),
      nutrients: nutrientMap(raw.nutrients),
      source: str(raw.source, "user_custom"),
      createdAt: stamp(raw.createdAt),
      updatedAt: stamp(raw.updatedAt),
      deletedAt: tsOrNull(raw.deletedAt)
    };
  }
  function cleanRecipeItem(raw, recipeId) {
    if (!isRecord(raw)) return null;
    const id = idOrNull(raw.id);
    if (!id) return null;
    const foodId = idOrNull(raw.foodId);
    const customFoodId = idOrNull(raw.customFoodId);
    if (!foodId === !customFoodId) return null;
    const quantity = finiteOr(raw.quantity, 0);
    if (quantity <= 0) return null;
    return {
      id,
      recipeId,
      foodId,
      customFoodId,
      quantity,
      unit: str(raw.unit, "g"),
      sortOrder: Math.trunc(finiteOr(raw.sortOrder, 0))
    };
  }
  function cleanRecipe(raw) {
    if (!isRecord(raw)) return null;
    const id = idOrNull(raw.id);
    if (!id) return null;
    return {
      id,
      userId: str(raw.userId),
      name: str(raw.name),
      description: optStr(raw.description),
      instructions: optStr(raw.instructions),
      // `servings > 0` is a check constraint AND the divisor in `perServing`,
      // which throws on anything else. The column default is the repair.
      servings: (() => {
        const s = finiteOr(raw.servings, 0);
        return s > 0 ? s : 1;
      })(),
      items: arr(raw.items).map((i) => cleanRecipeItem(i, id)).filter((i) => i !== null),
      createdAt: stamp(raw.createdAt),
      updatedAt: stamp(raw.updatedAt),
      deletedAt: tsOrNull(raw.deletedAt)
    };
  }
  function cleanFavorite(raw) {
    if (!isRecord(raw)) return null;
    const foodId = idOrNull(raw.foodId);
    const customFoodId = idOrNull(raw.customFoodId);
    const recipeId = idOrNull(raw.recipeId);
    if ([foodId, customFoodId, recipeId].filter((x) => x !== null).length !== 1) return null;
    return {
      userId: str(raw.userId),
      foodId,
      customFoodId,
      recipeId,
      sortOrder: Math.trunc(finiteOr(raw.sortOrder, 0)),
      createdAt: stamp(raw.createdAt),
      updatedAt: stamp(raw.updatedAt),
      deletedAt: tsOrNull(raw.deletedAt)
    };
  }
  function cleanWeightEntry(raw) {
    if (!isRecord(raw)) return null;
    const id = idOrNull(raw.id);
    if (!id) return null;
    if (typeof raw.weightKg !== "number" || !Number.isFinite(raw.weightKg)) return null;
    if (raw.weightKg < 20 || raw.weightKg > 500) return null;
    const measuredAt = tsOrNull(raw.measuredAt);
    if (!measuredAt) return null;
    return {
      id,
      userId: str(raw.userId),
      measuredAt,
      weightKg: raw.weightKg,
      source: str(raw.source, "manual"),
      note: optStr(raw.note),
      createdAt: stamp(raw.createdAt),
      updatedAt: stamp(raw.updatedAt),
      // `tsOrNull`, so `''` cannot mean "deleted" to one read and "live" to
      // another — see the helper's own comment.
      deletedAt: tsOrNull(raw.deletedAt)
    };
  }
  function cleanProgramDay(raw, programId) {
    if (!isRecord(raw)) return null;
    const targetDate = idOrNull(raw.targetDate);
    if (!targetDate) return null;
    return {
      programId,
      targetDate,
      calories: num(raw.calories, 0, 0, Number.MAX_SAFE_INTEGER),
      proteinG: num(raw.proteinG, 0, 0, Number.MAX_SAFE_INTEGER),
      carbsG: num(raw.carbsG, 0, 0, Number.MAX_SAFE_INTEGER),
      fatG: num(raw.fatG, 0, 0, Number.MAX_SAFE_INTEGER),
      source: str(raw.source, "engine"),
      createdAt: stamp(raw.createdAt)
    };
  }
  function cleanProgram(raw) {
    if (!isRecord(raw)) return null;
    const id = idOrNull(raw.id);
    if (!id) return null;
    const mode = oneOf(raw.mode, PROGRAM_MODES);
    const goal = oneOf(raw.goal, PROGRAM_GOALS);
    const status = oneOf(raw.status, PROGRAM_STATUSES);
    if (!mode || !goal || !status) return null;
    return {
      id,
      userId: str(raw.userId),
      name: str(raw.name, "Macro program"),
      mode,
      goal,
      // No bound: the table constrains this field's SIGN against `goal`, never
      // its magnitude, and inventing a ±5 kg/week range here would silently
      // rewrite a rate the database would have accepted.
      targetRateKgPerWeek: finiteOr(raw.targetRateKgPerWeek, 0),
      startDate: str(raw.startDate),
      endDate: idOrNull(raw.endDate),
      weeklyCalorieBudget: optNum(raw.weeklyCalorieBudget),
      proteinPreference: optStr(raw.proteinPreference),
      fatPreference: optStr(raw.fatPreference),
      status,
      days: arr(raw.days).map((d) => cleanProgramDay(d, id)).filter((d) => d !== null),
      createdAt: stamp(raw.createdAt),
      updatedAt: stamp(raw.updatedAt)
    };
  }
  function cleanCheckIn(raw) {
    if (!isRecord(raw)) return null;
    const id = idOrNull(raw.id);
    if (!id) return null;
    const status = oneOf(raw.status, CHECK_IN_STATUSES);
    if (!status) return null;
    return {
      id,
      userId: str(raw.userId),
      // Part of the server's natural key, so `''` would key this check-in to a
      // program that cannot exist — see `checkInKey`.
      programId: idOrNull(raw.programId),
      weekStart: str(raw.weekStart),
      weekEnd: str(raw.weekEnd),
      status,
      // `optNum` maps garbage to `null`, never to 0: a proposal of zero calories
      // and "no proposal for this week" are different statements, and the held
      // state must be able to clear a previous week's numbers.
      previousExpenditureKcal: optNum(raw.previousExpenditureKcal),
      observedExpenditureKcal: optNum(raw.observedExpenditureKcal),
      proposedExpenditureKcal: optNum(raw.proposedExpenditureKcal),
      proposedCalories: optNum(raw.proposedCalories),
      proposedProteinG: optNum(raw.proposedProteinG),
      proposedCarbsG: optNum(raw.proposedCarbsG),
      proposedFatG: optNum(raw.proposedFatG),
      modules: checkInModules(raw.modules),
      explanation: str(raw.explanation),
      createdAt: stamp(raw.createdAt),
      resolvedAt: tsOrNull(raw.resolvedAt),
      updatedAt: stamp(raw.updatedAt)
    };
  }
  function cleanDayStatus(raw) {
    if (!isRecord(raw)) return null;
    const logDate = idOrNull(raw.logDate);
    if (!logDate) return null;
    const status = oneOf(raw.status, DAY_STATUS_VALUES);
    if (!status) return null;
    return {
      userId: str(raw.userId),
      logDate,
      status,
      note: optStr(raw.note),
      updatedAt: stamp(raw.updatedAt)
    };
  }
  function sanitizeNutritionDB(raw) {
    const src = isRecord(raw) ? raw : {};
    return {
      schemaVersion: num(src.schemaVersion, NUTRITION_SCHEMA_VERSION, 0, Number.MAX_SAFE_INTEGER),
      logEntries: arr(src.logEntries).map(cleanLogEntry).filter((e) => e !== null),
      weightEntries: arr(src.weightEntries).map(cleanWeightEntry).filter((e) => e !== null),
      program: cleanProgram(src.program),
      checkIns: arr(src.checkIns).map(cleanCheckIn).filter((c) => c !== null),
      dayStatus: arr(src.dayStatus).map(cleanDayStatus).filter((d) => d !== null),
      customFoods: arr(src.customFoods).map(cleanCustomFood).filter((f) => f !== null),
      recipes: arr(src.recipes).map(cleanRecipe).filter((r) => r !== null),
      favorites: arr(src.favorites).map(cleanFavorite).filter((f) => f !== null),
      foodCache: arr(src.foodCache).map(cleanCachedFood).filter((f) => f !== null),
      settings: plainObject(src.settings)
    };
  }
  var at = (v) => {
    const t = Date.parse(v ?? "");
    return Number.isFinite(t) ? t : 0;
  };
  var canonical = (v) => {
    if (Array.isArray(v)) return `[${v.map(canonical).join(",")}]`;
    if (isRecord(v))
      return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canonical(v[k])}`).join(",")}}`;
    return JSON.stringify(v) ?? "null";
  };
  var recordId = (v) => isRecord(v) && typeof v.id === "string" ? v.id : "";
  var breaksTie = (y, x) => {
    const yi = recordId(y);
    const xi = recordId(x);
    return yi === xi ? canonical(y) > canonical(x) : yi > xi;
  };
  function mergeByKey(a, b, key, newer) {
    const map = /* @__PURE__ */ new Map();
    for (const x of a) map.set(key(x), x);
    for (const y of b) {
      const k = key(y);
      const x = map.get(k);
      map.set(k, x === void 0 ? y : newer(y, x) ? y : x);
    }
    return Array.from(map.keys()).sort().map((k) => map.get(k));
  }
  var byUpdatedAt = (y, x) => {
    const ty = at(y.updatedAt);
    const tx = at(x.updatedAt);
    return ty === tx ? breaksTie(y, x) : ty > tx;
  };
  var compositeKey = (...parts) => parts.map((p) => `${p.length}:${p}`).join("");
  var checkInKey = (c) => compositeKey(c.userId, c.programId ?? "", c.weekStart);
  var favoriteRowKey = (f) => compositeKey(f.userId, f.foodId ?? "", f.customFoodId ?? "", f.recipeId ?? "");
  function mergeSettings(a, b) {
    const out = {};
    for (const k of Array.from(/* @__PURE__ */ new Set([...Object.keys(a), ...Object.keys(b)])).sort()) {
      if (k === "__proto__") continue;
      const inA = Object.prototype.hasOwnProperty.call(a, k);
      const inB = Object.prototype.hasOwnProperty.call(b, k);
      if (!inB) out[k] = a[k];
      else if (!inA) out[k] = b[k];
      else out[k] = canonical(b[k]) > canonical(a[k]) ? b[k] : a[k];
    }
    return out;
  }
  function mergeProgram(a, b) {
    if (!a) return b;
    if (!b) return a;
    if (a.id !== b.id) return byUpdatedAt(b, a) ? b : a;
    const base2 = byUpdatedAt(b, a) ? b : a;
    return {
      ...base2,
      days: mergeByKey(
        a.days,
        b.days,
        (d) => d.targetDate,
        // A program day has no `updatedAt` in the schema (the row is written once
        // per date); `createdAt` is its only stamp, so a recomputed target wins by
        // being written later. Same-`createdAt` targets for one date fall back to
        // content order rather than to which side was passed first.
        (y, x) => {
          const ty = at(y.createdAt);
          const tx = at(x.createdAt);
          return ty === tx ? breaksTie(y, x) : ty > tx;
        }
      )
    };
  }
  function mergeNutrition(a, b) {
    if (a.schemaVersion !== b.schemaVersion) {
      throw new Error(
        `mergeNutrition: refusing to merge schemaVersion ${a.schemaVersion} with ${b.schemaVersion}; migrate both sides first`
      );
    }
    return {
      schemaVersion: a.schemaVersion,
      logEntries: mergeByKey(a.logEntries, b.logEntries, (e) => e.id, byUpdatedAt),
      weightEntries: mergeByKey(a.weightEntries, b.weightEntries, (e) => e.id, byUpdatedAt),
      program: mergeProgram(a.program, b.program),
      checkIns: mergeByKey(a.checkIns, b.checkIns, checkInKey, byUpdatedAt),
      dayStatus: mergeByKey(
        a.dayStatus,
        b.dayStatus,
        (d) => compositeKey(d.userId, d.logDate),
        byUpdatedAt
      ),
      customFoods: mergeByKey(a.customFoods, b.customFoods, (f) => f.id, byUpdatedAt),
      // Whole-record, not item-by-item. A recipe's ingredient list is a
      // STATEMENT the athlete made — "these four things" — so unioning two edits
      // would resurrect an ingredient one device deliberately removed and put a
      // macro back into every serving logged after it. Program days union
      // because each day is an independent fact; recipe items are not.
      recipes: mergeByKey(a.recipes, b.recipes, (r) => r.id, byUpdatedAt),
      favorites: mergeByKey(a.favorites, b.favorites, favoriteRowKey, byUpdatedAt),
      // Keyed on the CATALOGUE id, so two devices that each cached the same food
      // hold one row afterwards rather than a duplicate per device. The newer
      // fetch wins: between two copies of a server row, the later one is closer
      // to what the server now holds.
      foodCache: mergeByKey(a.foodCache, b.foodCache, (f) => f.id, (y, x) => {
        const ty = at(y.cachedAt);
        const tx = at(x.cachedAt);
        return ty === tx ? breaksTie(y, x) : ty > tx;
      }),
      settings: mergeSettings(a.settings, b.settings)
    };
  }

  // ../../../../packages/nutrition-core/src/day.ts
  var ZERO_TOTALS = { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 };
  var isLive = (e) => e.deletedAt == null;
  function entriesForDay(db, date) {
    return db.logEntries.filter((e) => e.logDate === date && isLive(e)).sort((a, b) => a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : a.id < b.id ? -1 : 1);
  }
  function macroTotals(entries) {
    return entries.reduce(
      (acc, e) => ({
        calories: acc.calories + e.calories,
        proteinG: acc.proteinG + e.proteinG,
        carbsG: acc.carbsG + e.carbsG,
        fatG: acc.fatG + e.fatG
      }),
      { ...ZERO_TOTALS }
    );
  }
  function targetForDay(program, date) {
    const day = program?.days.find((d) => d.targetDate === date);
    if (!day) return null;
    return { calories: day.calories, proteinG: day.proteinG, carbsG: day.carbsG, fatG: day.fatG };
  }
  function groupByMeal(entries, order) {
    const seen = /* @__PURE__ */ new Map();
    for (const e of entries) {
      const bucket = seen.get(e.meal);
      if (bucket) bucket.push(e);
      else seen.set(e.meal, [e]);
    }
    const known = order.filter((m) => seen.has(m));
    const rest = Array.from(seen.keys()).filter((m) => !order.includes(m));
    return [...known, ...rest].map((meal) => ({ meal, entries: seen.get(meal) }));
  }

  // ../../../../packages/nutrition-core/src/recipe.ts
  var ZERO_MACROS = { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 };
  var IncompatibleUnitError = class extends Error {
    constructor(message) {
      super(message);
      this.name = "IncompatibleUnitError";
    }
  };
  var positive = (n) => Number.isFinite(n) && n > 0;
  var byMultiplier = (food, multiplier) => ({
    calories: food.calories * multiplier,
    proteinG: food.proteinG * multiplier,
    carbsG: food.carbsG * multiplier,
    fatG: food.fatG * multiplier
  });
  function scaleTo(food, quantity, unit) {
    if (!positive(quantity)) throw new Error(`quantity must be finite and > 0, got ${quantity}`);
    if (!positive(food.servingQty)) throw new Error(`${food.name} has an invalid serving quantity ${food.servingQty}`);
    if (unit.toLowerCase() !== food.servingUnit.toLowerCase()) {
      throw new IncompatibleUnitError(
        `Cannot scale ${food.name}: requested unit '${unit}' does not match this food's serving unit '${food.servingUnit}'. Use a serving with an explicit gram/millilitre conversion instead of guessing a density.`
      );
    }
    return byMultiplier(food, quantity / food.servingQty);
  }
  function scaleByServing(food, serving, servingCount = 1) {
    if (!positive(servingCount)) throw new Error(`servingCount must be finite and > 0, got ${servingCount}`);
    if (serving.foodId !== food.id) {
      throw new Error(`Serving ${serving.id} belongs to food ${serving.foodId}, not ${food.id}`);
    }
    const basisUnit = food.servingUnit.toLowerCase();
    const perServingAmount = basisUnit === "g" ? serving.grams : basisUnit === "ml" ? serving.millilitres : null;
    if (perServingAmount == null) {
      throw new IncompatibleUnitError(
        `Serving '${serving.label}' for ${food.name} has no ${basisUnit} conversion recorded.`
      );
    }
    if (!positive(perServingAmount)) {
      throw new Error(`Serving '${serving.label}' has an invalid amount ${perServingAmount}`);
    }
    if (!positive(food.servingQty)) throw new Error(`${food.name} has an invalid serving quantity ${food.servingQty}`);
    return byMultiplier(food, perServingAmount * servingCount / food.servingQty);
  }
  function resolveFoodMacros(food, servings, quantity, unit) {
    try {
      return scaleTo(food, quantity, unit);
    } catch (direct) {
      if (!(direct instanceof IncompatibleUnitError)) throw direct;
      const matching = servings.find((s) => s.unit.toLowerCase() === unit.toLowerCase());
      if (!matching) throw direct;
      return scaleByServing(food, matching, quantity / matching.quantity);
    }
  }
  function loggableUnits(food, servings = []) {
    const basis = food.servingUnit.toLowerCase();
    const out = { [food.servingUnit]: positive(food.servingQty) ? food.servingQty : 1 };
    servings.forEach((s) => {
      if (out[s.unit] != null) return;
      const amount = basis === "g" ? s.grams : basis === "ml" ? s.millilitres : null;
      if (amount == null || !positive(amount)) return;
      out[s.unit] = positive(s.quantity) ? s.quantity : 1;
    });
    return out;
  }
  function sumMacros(items) {
    return items.reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories,
        proteinG: acc.proteinG + item.proteinG,
        carbsG: acc.carbsG + item.carbsG,
        fatG: acc.fatG + item.fatG
      }),
      { ...ZERO_MACROS }
    );
  }
  function perServing(total, recipeServings) {
    if (!positive(recipeServings)) {
      throw new Error(`recipeServings must be finite and > 0, got ${recipeServings}`);
    }
    return {
      calories: total.calories / recipeServings,
      proteinG: total.proteinG / recipeServings,
      carbsG: total.carbsG / recipeServings,
      fatG: total.fatG / recipeServings
    };
  }
  function forLoggedServings(perServingMacros, loggedServings) {
    if (!positive(loggedServings)) {
      throw new Error(`loggedServings must be finite and > 0, got ${loggedServings}`);
    }
    return {
      calories: perServingMacros.calories * loggedServings,
      proteinG: perServingMacros.proteinG * loggedServings,
      carbsG: perServingMacros.carbsG * loggedServings,
      fatG: perServingMacros.fatG * loggedServings
    };
  }
  function resolveRecipePerServing(recipe, lookup) {
    const items = [...recipe.items].sort((a, b) => a.sortOrder - b.sortOrder);
    const itemMacros = items.map((item) => resolveRecipeItem(item, lookup));
    return perServing(sumMacros(itemMacros), recipe.servings);
  }
  function resolveRecipeItem(item, lookup) {
    if (item.foodId) {
      const food = lookup.food(item.foodId);
      if (!food) throw new Error(`Recipe item ${item.id} references missing food ${item.foodId}`);
      return resolveFoodMacros(food, food.servings, item.quantity, item.unit);
    }
    if (item.customFoodId) {
      const customFood = lookup.customFood(item.customFoodId);
      if (!customFood) {
        throw new Error(`Recipe item ${item.id} references missing custom food ${item.customFoodId}`);
      }
      return scaleTo(customFood, item.quantity, item.unit);
    }
    throw new Error(
      `Recipe item ${item.id} has neither foodId nor customFoodId (violates the DB check constraint)`
    );
  }

  // ../../../../packages/nutrition-core/src/serving-parse.ts
  var DECIMAL = String.raw`(?:\d+(?:[.,]\d+)?|\d*[.,]\d+)`;
  var UNIT_TOKEN = String.raw`fl\.?\s*oz|floz|fluid\s*ounces?|ounces?|oz|kg|mg|ml|cl|g|l`;
  var AMOUNT_UNIT = new RegExp(`(${DECIMAL})\\s*(${UNIT_TOKEN})\\b`, "i");
  var HOUSEHOLD_HEAD = new RegExp(
    `^\\s*(${DECIMAL})\\s+([a-zA-Z][a-zA-Z./\\-]{0,24})\\b`,
    "i"
  );
  function toNumber(raw) {
    if (raw == null || raw === "") return null;
    const n = typeof raw === "number" ? raw : Number(String(raw).replace(",", "."));
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  function normaliseAmount(qty, unit) {
    if (!(qty > 0) || !Number.isFinite(qty)) return null;
    const u = String(unit || "").trim().toLowerCase().replace(/\./g, "").replace(/\s+/g, " ");
    if (u === "g" || u === "gram" || u === "grams") return { amount: qty, unit: "g" };
    if (u === "mg" || u === "milligram" || u === "milligrams") return { amount: qty / 1e3, unit: "g" };
    if (u === "kg" || u === "kilogram" || u === "kilograms") return { amount: qty * 1e3, unit: "g" };
    if (u === "oz" || u === "ounce" || u === "ounces") return { amount: qty * 28.349523125, unit: "g" };
    if (u === "lb" || u === "lbs" || u === "pound" || u === "pounds") return { amount: qty * 453.59237, unit: "g" };
    if (u === "ml" || u === "millilitre" || u === "millilitres" || u === "milliliter" || u === "milliliters") {
      return { amount: qty, unit: "ml" };
    }
    if (u === "cl" || u === "centilitre" || u === "centilitres") return { amount: qty * 10, unit: "ml" };
    if (u === "l" || u === "liter" || u === "litre" || u === "liters" || u === "litres") {
      return { amount: qty * 1e3, unit: "ml" };
    }
    if (u === "fl oz" || u === "floz" || u === "fluid ounce" || u === "fluid ounces") {
      return { amount: qty * 29.5735295625, unit: "ml" };
    }
    return null;
  }
  function singularHousehold(raw) {
    let w = String(raw || "").trim().toLowerCase().replace(/\./g, "");
    if (!w || w.length > 24) return null;
    const aliases = {
      tablespoon: "tbsp",
      tablespoons: "tbsp",
      tbsp: "tbsp",
      tblsp: "tbsp",
      tbs: "tbsp",
      teaspoon: "tsp",
      teaspoons: "tsp",
      tsp: "tsp",
      serving: "serving",
      servings: "serving",
      portion: "portion",
      portions: "portion",
      slice: "slice",
      slices: "slice",
      biscuit: "biscuit",
      biscuits: "biscuit",
      cookie: "cookie",
      cookies: "cookie",
      piece: "piece",
      pieces: "piece",
      bar: "bar",
      bars: "bar",
      can: "can",
      cans: "can",
      bottle: "bottle",
      bottles: "bottle",
      cup: "cup",
      cups: "cup",
      row: "row",
      rows: "row",
      pack: "pack",
      packs: "pack",
      pouch: "pouch",
      pouches: "pouch"
    };
    if (aliases[w]) return aliases[w];
    if (/^[a-z][a-z/-]*$/.test(w)) {
      if (w.endsWith("ies") && w.length > 4) return `${w.slice(0, -3)}y`;
      if (w.endsWith("sses")) return w.slice(0, -2);
      if (w.endsWith("s") && !w.endsWith("ss") && w.length > 3) return w.slice(0, -1);
      return w;
    }
    return null;
  }
  function parseServingSizeText(text) {
    if (text == null) return null;
    const raw = String(text).trim();
    if (!raw) return null;
    const paren = /\(([^)]*)\)/.exec(raw);
    const outside = raw.replace(/\([^)]*\)/g, " ");
    const match = (paren ? AMOUNT_UNIT.exec(paren[1]) : null) ?? AMOUNT_UNIT.exec(outside) ?? AMOUNT_UNIT.exec(raw);
    if (!match) return null;
    const qty = toNumber(match[1]);
    if (qty == null) return null;
    return normaliseAmount(qty, match[2]);
  }
  function parseHouseholdServing(text) {
    if (text == null) return null;
    const raw = String(text).trim();
    if (!raw) return null;
    const head = HOUSEHOLD_HEAD.exec(raw.replace(/\([^)]*\)/g, " ").trim()) ?? HOUSEHOLD_HEAD.exec(raw);
    if (!head) return null;
    const count = toNumber(head[1]);
    const unit = singularHousehold(head[2]);
    if (count == null || !unit) return null;
    if (normaliseAmount(1, unit)) return null;
    const total = parseServingSizeText(raw);
    if (!total) return null;
    return { unit, count, total };
  }
  function resolveServingAmount(fields) {
    const qty = toNumber(fields.servingQuantity ?? null);
    const unit = fields.servingQuantityUnit != null ? String(fields.servingQuantityUnit) : "";
    if (qty != null && unit) {
      const fromFields = normaliseAmount(qty, unit);
      if (fromFields) return fromFields;
    }
    return parseServingSizeText(fields.servingSizeText);
  }
  function hasExplicitServingConversion(food) {
    const basis = food.servingUnit.toLowerCase();
    return (food.servings || []).some((s) => {
      if (s.unit.toLowerCase() !== "serving") return false;
      if (basis === "g") return s.grams != null && Number.isFinite(s.grams) && s.grams > 0;
      if (basis === "ml") return s.millilitres != null && Number.isFinite(s.millilitres) && s.millilitres > 0;
      return false;
    });
  }
  function hasUnit(food, unit) {
    return (food.servings || []).some((s) => s.unit.toLowerCase() === unit.toLowerCase());
  }
  function enrichFoodServings(food, fields) {
    const basis = food.servingUnit.toLowerCase();
    const text = fields?.servingSizeText ?? food.servingSizeText;
    const resolved = resolveServingAmount({
      servingSizeText: text,
      servingQuantity: fields?.servingQuantity,
      servingQuantityUnit: fields?.servingQuantityUnit
    }) ?? parseServingSizeText(text);
    const rows = [...food.servings || []];
    let changed = false;
    if (resolved && resolved.unit === basis && !hasExplicitServingConversion(food)) {
      rows.push({
        id: `${food.id}-parsed-serving`,
        foodId: food.id,
        label: String(text || `${resolved.amount} ${resolved.unit}`).trim() || "serving",
        quantity: 1,
        unit: "serving",
        grams: resolved.unit === "g" ? resolved.amount : null,
        millilitres: resolved.unit === "ml" ? resolved.amount : null,
        isDefault: true,
        sortOrder: 0
      });
      changed = true;
    }
    const household = parseHouseholdServing(text);
    if (household && household.total.unit === basis && household.unit !== "serving" && !hasUnit({ ...food, servings: rows }, household.unit)) {
      const perOne = household.total.amount / household.count;
      if (perOne > 0 && Number.isFinite(perOne)) {
        rows.push({
          id: `${food.id}-parsed-${household.unit}`,
          foodId: food.id,
          label: `1 ${household.unit}`,
          quantity: 1,
          unit: household.unit,
          grams: household.total.unit === "g" ? perOne : null,
          millilitres: household.total.unit === "ml" ? perOne : null,
          isDefault: false,
          sortOrder: 1
        });
        changed = true;
      }
    }
    return changed ? { ...food, servings: rows, servingSizeText: text ?? food.servingSizeText } : food;
  }
  function pickDefaultLogQuantity(food, fields) {
    const enriched = enrichFoodServings(food, fields);
    const basis = food.servingUnit;
    const basisKey = basis.toLowerCase();
    const units = loggableUnits(enriched, enriched.servings || []);
    const parsed = resolveServingAmount({
      servingSizeText: fields?.servingSizeText ?? food.servingSizeText,
      servingQuantity: fields?.servingQuantity,
      servingQuantityUnit: fields?.servingQuantityUnit
    }) ?? parseServingSizeText(food.servingSizeText);
    if (parsed && parsed.unit === basisKey) {
      return { food: enriched, quantity: parsed.amount, unit: basis };
    }
    const servingRow = (enriched.servings || []).find((s) => s.unit.toLowerCase() === "serving");
    if (servingRow) {
      const amount = basisKey === "g" ? servingRow.grams : basisKey === "ml" ? servingRow.millilitres : null;
      if (amount != null && Number.isFinite(amount) && amount > 0) {
        return { food: enriched, quantity: amount, unit: basis };
      }
    }
    const qty = units[basis] ?? (Number.isFinite(food.servingQty) && food.servingQty > 0 ? food.servingQty : 100);
    return { food: enriched, quantity: qty, unit: basis };
  }

  // ../../../../packages/nutrition-core/src/log.ts
  var base = (ctx) => ({
    id: ctx.id,
    userId: ctx.userId ?? "",
    logDate: ctx.logDate,
    meal: ctx.meal,
    notes: ctx.notes ?? null,
    createdAt: ctx.at,
    updatedAt: ctx.at,
    deletedAt: null
  });
  var macroFields2 = (m) => ({
    calories: m.calories,
    proteinG: m.proteinG,
    carbsG: m.carbsG,
    fatG: m.fatG
  });
  var loggedMacros = (m) => ({
    logged_calories: m.calories,
    logged_protein_g: m.proteinG,
    logged_carbs_g: m.carbsG,
    logged_fat_g: m.fatG
  });
  function logEntryFromFood(ctx, food, quantity, unit) {
    const macros = resolveFoodMacros(food, food.servings, quantity, unit);
    return {
      ...base(ctx),
      entryKind: "food",
      foodId: food.id,
      customFoodId: null,
      recipeId: null,
      quantity,
      unit,
      ...macroFields2(macros),
      displayName: food.name,
      // Copied at the SOURCE's basis and NOT scaled — see the file header.
      nutrients: { ...food.nutrients },
      sourceSnapshot: {
        kind: "food",
        food_id: food.id,
        name: food.name,
        ...food.brand ? { brand: food.brand } : {},
        ...food.barcode ? { barcode: food.barcode } : {},
        source: food.source,
        ...food.externalId ? { external_id: food.externalId } : {},
        serving_qty: food.servingQty,
        serving_unit: food.servingUnit,
        nutrition_basis_qty: food.nutritionBasisQty,
        nutrition_basis_unit: food.nutritionBasisUnit,
        ...food.servingSizeText ? { serving_size_text: food.servingSizeText } : {},
        logged_quantity: quantity,
        logged_unit: unit,
        ...loggedMacros(macros)
      }
    };
  }
  function logEntryFromCustomFood(ctx, food, quantity, unit) {
    const macros = scaleTo(food, quantity, unit);
    return {
      ...base(ctx),
      entryKind: "custom_food",
      foodId: null,
      customFoodId: food.id,
      recipeId: null,
      quantity,
      unit,
      ...macroFields2(macros),
      displayName: food.name,
      nutrients: { ...food.nutrients },
      sourceSnapshot: {
        kind: "custom_food",
        custom_food_id: food.id,
        name: food.name,
        ...food.brand ? { brand: food.brand } : {},
        ...food.barcode ? { barcode: food.barcode } : {},
        source: "user_custom",
        serving_qty: food.servingQty,
        serving_unit: food.servingUnit,
        logged_quantity: quantity,
        logged_unit: unit,
        ...loggedMacros(macros)
      }
    };
  }
  function logEntryFromRecipe(ctx, recipe, perServingMacros, loggedServings) {
    const macros = forLoggedServings(perServingMacros, loggedServings);
    return {
      ...base(ctx),
      entryKind: "recipe",
      foodId: null,
      customFoodId: null,
      recipeId: recipe.id,
      quantity: loggedServings,
      unit: "serving",
      ...macroFields2(macros),
      displayName: recipe.name,
      nutrients: {},
      sourceSnapshot: {
        kind: "recipe",
        recipe_id: recipe.id,
        name: recipe.name,
        recipe_servings: recipe.servings,
        logged_servings: loggedServings,
        per_logged_calories: macros.calories,
        per_logged_protein_g: macros.proteinG,
        per_logged_carbs_g: macros.carbsG,
        per_logged_fat_g: macros.fatG
      }
    };
  }
  function quickAddEntry(ctx, fields) {
    return {
      ...base(ctx),
      entryKind: "quick_add",
      foodId: null,
      customFoodId: null,
      recipeId: null,
      quantity: 1,
      unit: "serving",
      ...macroFields2(fields),
      displayName: fields.displayName,
      // Empty, not fabricated: a quick add HAS no micronutrient profile.
      nutrients: {},
      sourceSnapshot: {
        kind: "quick_add",
        display_name: fields.displayName,
        calories: fields.calories,
        protein_g: fields.proteinG,
        carbs_g: fields.carbsG,
        fat_g: fields.fatG
      }
    };
  }
  function applyManualMacroEdit(entry, fields, at2) {
    entry.displayName = fields.displayName;
    entry.meal = fields.meal;
    entry.calories = fields.calories;
    entry.proteinG = fields.proteinG;
    entry.carbsG = fields.carbsG;
    entry.fatG = fields.fatG;
    entry.updatedAt = at2;
    entry.sourceSnapshot = {
      ...entry.sourceSnapshot,
      ...loggedMacros(fields),
      // A quick add states its macros under bare keys as well as `logged_*`.
      ...entry.entryKind === "quick_add" ? {
        display_name: fields.displayName,
        calories: fields.calories,
        protein_g: fields.proteinG,
        carbs_g: fields.carbsG,
        fat_g: fields.fatG
      } : { manual_macro_edit: at2 }
    };
  }

  // ../../../../packages/nutrition-core/src/label.ts
  var EMPTY = {
    calories: null,
    proteinG: null,
    carbsG: null,
    fatG: null,
    servingQty: null,
    servingUnit: null,
    basis: "unknown",
    roundedDown: false
  };
  function isEmptyLabel(p) {
    return p.calories == null && p.proteinG == null && p.carbsG == null && p.fatG == null && p.servingQty == null && p.servingUnit == null;
  }
  var KJ_PER_KCAL = 4.184;
  var LABEL_VALUE_SPLIT = /^([^\d<]*?)\s*((?:<|less\s+than\b).*|\d.*)$/i;
  function splitLabelCell(cell) {
    const m = LABEL_VALUE_SPLIT.exec(cell.trim());
    if (!m) return null;
    const label = m[1].trim();
    if (!label) return null;
    return { label, value: m[2].trim() };
  }
  function valueColumnCount(texts) {
    const joined = texts.map(norm).join(" | ");
    let columns = 0;
    if (/per\s*serv/.test(joined)) columns += 1;
    if (/per\s*100\s*(?:g|ml)/.test(joined)) columns += 1;
    return Math.max(1, columns);
  }
  function readRows(rows, texts) {
    let calories = null;
    let proteinG = null;
    let fatG = null;
    let carbsG = null;
    let roundedDown = false;
    const columns = valueColumnCount(texts);
    for (const row of rows) {
      const cell = row[0];
      if (cell == null) continue;
      const merged = splitLabelCell(cell);
      const label = merged ? merged.label : cell;
      const value = merged ? merged.value : row.length - 1 >= columns ? row[1] : void 0;
      if (value == null) continue;
      if (calories == null && isEnergyLabel(label)) {
        calories = parseEnergyKcal(value);
      } else if (proteinG == null && isProteinLabel(label)) {
        const n = parseMacroCell(value);
        proteinG = n.value;
        roundedDown = roundedDown || n.roundedDown;
      } else if (fatG == null && isFatTotalLabel(label)) {
        const n = parseMacroCell(value);
        fatG = n.value;
        roundedDown = roundedDown || n.roundedDown;
      } else if (carbsG == null && isCarbTotalLabel(label)) {
        const n = parseMacroCell(value);
        carbsG = n.value;
        roundedDown = roundedDown || n.roundedDown;
      }
    }
    return {
      calories,
      proteinG,
      carbsG,
      fatG,
      servingQty: null,
      servingUnit: null,
      basis: "unknown",
      roundedDown
    };
  }
  var norm = (s) => s.trim().toLowerCase();
  var isEnergyLabel = (t) => {
    const n = norm(t);
    return n.startsWith("energy") || n.startsWith("calories") || n.startsWith("calorie");
  };
  var isProteinLabel = (t) => norm(t).startsWith("protein");
  function isFatTotalLabel(t) {
    const n = norm(t);
    return n.startsWith("fat") && !n.includes("saturat");
  }
  function isCarbTotalLabel(t) {
    const n = norm(t);
    if (n.includes("sugar")) return false;
    return n.startsWith("carbohydrate") || n === "carbs" || n.startsWith("carbs ") || n.startsWith("total carbohydrate") || n.startsWith("total carbs");
  }
  var DECIMAL2 = String.raw`\d+(?:[.,]\d+)?`;
  var NUMBER = new RegExp(`(${DECIMAL2})(?![\\d])`);
  var toNumber2 = (raw) => {
    const text = raw.replace(",", ".");
    const fraction = text.split(".")[1];
    if (fraction != null && fraction.length > 2) return null;
    const n = Number(text);
    return Number.isFinite(n) ? n : null;
  };
  var stripThousands = (text) => text.replace(/(\d)[,    ](?=\d{3}(?!\d))/g, "$1");
  var firstNumber = (text) => {
    const m = NUMBER.exec(stripThousands(text));
    return m ? toNumber2(m[1]) : null;
  };
  var LESS_THAN = /^\s*(?:<|less\s+than\b)/i;
  function parseMacroCell(cell) {
    if (LESS_THAN.test(cell)) return { value: 0, roundedDown: true };
    return { value: firstNumber(cell), roundedDown: false };
  }
  function parseEnergyKcal(cell) {
    const lower = stripThousands(cell.toLowerCase());
    const cal = new RegExp(`(${DECIMAL2})\\s*(?:kcal|cal)\\b`).exec(lower);
    if (cal) return toNumber2(cal[1]);
    const kj = new RegExp(`(${DECIMAL2})\\s*kj\\b`).exec(lower);
    if (!kj) return null;
    const v = toNumber2(kj[1]);
    return v == null ? null : v / KJ_PER_KCAL;
  }
  var SERVING_SIZE = new RegExp(
    `(${DECIMAL2})\\s*(fl\\.?\\s*oz|floz|fluid\\s*ounces?|ounces?|oz|lbs?|pounds?|kg|mg|ml|cl|g|l)\\b`,
    "i"
  );
  function parseServingSize(texts) {
    const line = texts.find((t) => norm(t).includes("serving size"));
    if (!line) return null;
    const paren = /\(([^)]*)\)/.exec(line);
    const outside = line.replace(/\([^)]*\)/g, " ");
    const m = (paren ? SERVING_SIZE.exec(stripThousands(paren[1])) : null) ?? SERVING_SIZE.exec(stripThousands(outside));
    if (!m) return null;
    const qty = toNumber2(m[1]);
    if (qty == null) return null;
    const normalised = normaliseAmount(qty, m[2]);
    if (!normalised) return null;
    return { qty: normalised.amount, unit: normalised.unit };
  }
  function detectBasis(texts) {
    const joined = texts.map(norm).join(" | ");
    if (/per\s*serv/.test(joined)) return "per_serving";
    if (/per\s*100\s*(?:g|ml)/.test(joined)) return "per_100";
    if (/servings?\s*per\s*pack/.test(joined)) return "per_serving";
    return "unknown";
  }
  var MIN_ROW_TOLERANCE_PX = 12;
  function rowTolerance(lines) {
    if (!lines.length) return MIN_ROW_TOLERANCE_PX;
    const minHeight = Math.min(...lines.map((l) => l.bottom - l.top));
    return Math.max(MIN_ROW_TOLERANCE_PX, minHeight * 0.5);
  }
  var centre = (l) => (l.top + l.bottom) / 2;
  function parseLabelLines(lines) {
    if (!lines.length) return EMPTY;
    const tolerance = rowTolerance(lines);
    const sorted = [...lines].sort((a, b) => centre(a) - centre(b));
    const grouped = [];
    for (const line of sorted) {
      const current = grouped[grouped.length - 1];
      const rowCentre = current ? current.reduce((s, l) => s + centre(l), 0) / current.length : null;
      if (current && rowCentre != null && Math.abs(centre(line) - rowCentre) <= tolerance) current.push(line);
      else grouped.push([line]);
    }
    const rows = grouped.map((row) => [...row].sort((a, b) => a.left - b.left).map((l) => l.text));
    const texts = lines.map((l) => l.text);
    return finish(readRows(rows, texts), texts);
  }
  function parseLabelText(text) {
    const texts = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (!texts.length) return EMPTY;
    const rows = texts.map((line) => line.split(/\t+| {2,}/).map((c) => c.trim()).filter(Boolean));
    return finish(readRows(rows, texts), texts);
  }
  function finish(read, texts) {
    const serving = parseServingSize(texts);
    return {
      ...read,
      servingQty: serving?.qty ?? null,
      servingUnit: serving?.unit ?? null,
      basis: detectBasis(texts)
    };
  }

  // ../../../../packages/nutrition-core/src/search.ts
  var favoriteKey = (kind, id) => `${kind}:${id}`;
  var resultKey = (r) => favoriteKey(r.kind, r.id);
  var catalogueResult = (food, offline) => ({
    kind: "food",
    id: food.id,
    title: food.name,
    subtitle: food.brand ?? null,
    offline
  });
  var customResult = (food) => ({
    kind: "custom_food",
    id: food.id,
    title: food.name,
    subtitle: food.brand ?? null,
    offline: true
  });
  var recipeResult = (recipe) => ({
    kind: "recipe",
    id: recipe.id,
    title: recipe.name,
    subtitle: `${recipe.servings} serving${recipe.servings === 1 ? "" : "s"}`,
    offline: true
  });
  var matches = (haystack, needle) => (haystack ?? "").toLowerCase().includes(needle);
  function searchLocal(db, query) {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return [
      ...db.foodCache.filter((f) => matches(f.name, q) || matches(f.brand, q)).map((f) => catalogueResult(f, true)),
      ...liveCustomFoods(db).filter((f) => matches(f.name, q) || matches(f.brand, q)).map(customResult),
      ...liveRecipes(db).filter((r) => matches(r.name, q)).map(recipeResult)
    ];
  }
  function foodSearch(db, query, remote) {
    const out = [];
    const seen = /* @__PURE__ */ new Set();
    const cached = cachedIds(db);
    for (const r of [...remote.map((f) => catalogueResult(f, cached.has(f.id))), ...searchLocal(db, query)]) {
      const key = resultKey(r);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(r);
    }
    return out;
  }
  var cachedIds = (db) => new Set(db.foodCache.map((f) => f.id));
  var liveCustomFoods = (db) => db.customFoods.filter((f) => f.deletedAt == null);
  var liveRecipes = (db) => db.recipes.filter((r) => r.deletedAt == null);
  function favoriteResults(db) {
    const foods = new Map(db.foodCache.map((f) => [f.id, f]));
    const customs = new Map(liveCustomFoods(db).map((f) => [f.id, f]));
    const recipes = new Map(liveRecipes(db).map((r) => [r.id, r]));
    return db.favorites.filter((f) => f.deletedAt == null).slice().sort((a, b) => a.sortOrder - b.sortOrder || (a.createdAt < b.createdAt ? -1 : 1)).map((fav) => {
      if (fav.foodId) {
        const food = foods.get(fav.foodId);
        return food ? catalogueResult(food, true) : null;
      }
      if (fav.customFoodId) {
        const food = customs.get(fav.customFoodId);
        return food ? customResult(food) : null;
      }
      if (fav.recipeId) {
        const recipe = recipes.get(fav.recipeId);
        return recipe ? recipeResult(recipe) : null;
      }
      return null;
    }).filter((r) => r !== null);
  }
  var favoriteKeys = (db) => new Set(
    db.favorites.filter((f) => f.deletedAt == null).map(
      (f) => f.foodId ? favoriteKey("food", f.foodId) : f.customFoodId ? favoriteKey("custom_food", f.customFoodId) : f.recipeId ? favoriteKey("recipe", f.recipeId) : ""
    ).filter((k) => k !== "")
  );
  function recentResults(db, limit = 10) {
    const foods = new Map(db.foodCache.map((f) => [f.id, f]));
    const customs = new Map(liveCustomFoods(db).map((f) => [f.id, f]));
    const recipes = new Map(liveRecipes(db).map((r) => [r.id, r]));
    const newestFirst = db.logEntries.filter((e) => isLive(e) && e.entryKind !== "quick_add").slice().sort((a, b) => a.createdAt > b.createdAt ? -1 : a.createdAt < b.createdAt ? 1 : a.id < b.id ? -1 : 1);
    const out = [];
    const seen = /* @__PURE__ */ new Set();
    for (const entry of newestFirst) {
      if (out.length >= limit) break;
      const result = entry.foodId ? foods.get(entry.foodId) && catalogueResult(foods.get(entry.foodId), true) || null : entry.customFoodId ? customs.get(entry.customFoodId) && customResult(customs.get(entry.customFoodId)) || null : entry.recipeId ? recipes.get(entry.recipeId) && recipeResult(recipes.get(entry.recipeId)) || null : null;
      if (!result) continue;
      const key = resultKey(result);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(result);
    }
    return out;
  }

  // ../../../../packages/nutrition-engine/src/index.ts
  var src_exports2 = {};
  __export(src_exports2, {
    DEFAULT_ENGINE_CONFIG: () => DEFAULT_ENGINE_CONFIG,
    ENGINE_DEFECTS: () => ENGINE_DEFECTS,
    NUTRITION_STATUSES: () => NUTRITION_STATUSES,
    addDays: () => addDays,
    calorieTarget: () => calorieTarget,
    clamp: () => clamp,
    coverageExplanation: () => coverageExplanation,
    diffDays: () => diffDays,
    engineConfig: () => engineConfig,
    estimateExpenditure: () => estimateExpenditure,
    fmean: () => fmean,
    fromEpochDay: () => fromEpochDay,
    fsum: () => fsum,
    initialExpenditureKcal: () => initialExpenditureKcal,
    linearSlope: () => linearSlope,
    macroTargets: () => macroTargets,
    maxDay: () => maxDay,
    naiveSum: () => naiveSum,
    nutritionIsCountable: () => nutritionIsCountable,
    periodCoverage: () => periodCoverage,
    pyRound: () => pyRound,
    toEpochDay: () => toEpochDay,
    weeklyCheckIn: () => weeklyCheckIn,
    weightTrend: () => weightTrend
  });

  // ../../../../packages/nutrition-engine/src/types.ts
  var DEFAULT_ENGINE_CONFIG = Object.freeze({
    kcalPerKg: 7700,
    trendAlpha: 0.2,
    minimumHistoryDays: 14,
    coverageWindowDays: 7,
    minimumNutritionDaysPerWeek: 6,
    minimumWeightDaysPerWeek: 1,
    maximumExpenditureStepKcal: 100,
    minimumExpenditureKcal: 1e3,
    maximumExpenditureKcal: 6e3,
    defaultProteinGPerKg: 1.8,
    defaultFatGPerKg: 0.8
  });
  function engineConfig(overrides = {}) {
    return { ...DEFAULT_ENGINE_CONFIG, ...overrides };
  }
  var NUTRITION_STATUSES = [
    "complete",
    "partial",
    "fasted",
    "unlogged"
  ];

  // ../../../../packages/nutrition-engine/src/dates.ts
  var ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
  var MS_PER_DAY = 864e5;
  function toEpochDay(day) {
    const match = ISO_DATE.exec(day);
    if (!match) {
      throw new Error(`Expected an ISO YYYY-MM-DD date, received ${JSON.stringify(day)}`);
    }
    const year = Number(match[1]);
    const month = Number(match[2]);
    const date = Number(match[3]);
    const utc = Date.UTC(year, month - 1, date);
    const roundTrip = new Date(utc);
    if (roundTrip.getUTCFullYear() !== year || roundTrip.getUTCMonth() !== month - 1 || roundTrip.getUTCDate() !== date) {
      throw new Error(`Not a real calendar date: ${day}`);
    }
    return utc / MS_PER_DAY;
  }
  function fromEpochDay(epochDay) {
    return new Date(epochDay * MS_PER_DAY).toISOString().slice(0, 10);
  }
  function addDays(day, days) {
    return fromEpochDay(toEpochDay(day) + days);
  }
  function diffDays(later, earlier) {
    return toEpochDay(later) - toEpochDay(earlier);
  }
  function maxDay(a, b) {
    return toEpochDay(a) >= toEpochDay(b) ? a : b;
  }

  // ../../../../packages/nutrition-engine/src/numeric.ts
  function fsum(values) {
    const partials = [];
    let count = 0;
    for (const value of values) {
      let x = value;
      let index = 0;
      for (let j = 0; j < count; j += 1) {
        let y = partials[j];
        if (Math.abs(x) < Math.abs(y)) {
          const swap = x;
          x = y;
          y = swap;
        }
        const hi2 = x + y;
        const lo2 = y - (hi2 - x);
        if (lo2 !== 0) {
          partials[index] = lo2;
          index += 1;
        }
        x = hi2;
      }
      partials[index] = x;
      count = index + 1;
    }
    if (count === 0) {
      return 0;
    }
    let n = count - 1;
    let hi = partials[n];
    let lo = 0;
    while (n > 0) {
      n -= 1;
      const x = hi;
      const y = partials[n];
      hi = x + y;
      lo = y - (hi - x);
      if (lo !== 0) {
        break;
      }
    }
    if (n > 0 && (lo < 0 && partials[n - 1] < 0 || lo > 0 && partials[n - 1] > 0)) {
      const y = lo * 2;
      const x = hi + y;
      if (y === x - hi) {
        hi = x;
      }
    }
    return hi;
  }
  function fmean(values) {
    if (values.length === 0) {
      throw new Error("fmean requires at least one data point");
    }
    return fsum(values) / values.length;
  }
  function naiveSum(values) {
    let total = 0;
    for (const value of values) {
      total += value;
    }
    return total;
  }
  var bits = new DataView(new ArrayBuffer(8));
  function pyRound(value, digits) {
    if (!Number.isFinite(value) || value === 0) {
      return value;
    }
    const negative = value < 0;
    bits.setFloat64(0, Math.abs(value));
    const high = bits.getUint32(0);
    const low = bits.getUint32(4);
    const rawExponent = high >>> 20 & 2047;
    const fraction = BigInt(high & 1048575) << 32n | BigInt(low);
    const mantissa = rawExponent === 0 ? fraction : fraction | 1n << 52n;
    const exponent = rawExponent === 0 ? -1074 : rawExponent - 1075;
    let numerator;
    let fractionDigits;
    if (exponent >= 0) {
      numerator = mantissa << BigInt(exponent);
      fractionDigits = 0;
    } else {
      numerator = mantissa * 5n ** BigInt(-exponent);
      fractionDigits = -exponent;
    }
    let scaled;
    if (fractionDigits <= digits) {
      scaled = numerator * 10n ** BigInt(digits - fractionDigits);
    } else {
      const divisor = 10n ** BigInt(fractionDigits - digits);
      const quotient = numerator / divisor;
      const remainder = numerator % divisor * 2n;
      const roundUp = remainder > divisor || remainder === divisor && (quotient & 1n) === 1n;
      scaled = roundUp ? quotient + 1n : quotient;
    }
    return Number((negative ? "-" : "") + decimalString(scaled, digits));
  }
  function decimalString(scaled, digits) {
    if (digits <= 0) {
      return scaled.toString();
    }
    const padded = scaled.toString().padStart(digits + 1, "0");
    return `${padded.slice(0, padded.length - digits)}.${padded.slice(padded.length - digits)}`;
  }
  function clamp(value, low, high) {
    return Math.max(low, Math.min(high, value));
  }

  // ../../../../packages/nutrition-engine/src/engine.ts
  function sortedRecords(records) {
    return [...records].sort((a, b) => diffDays(a.day, b.day));
  }
  function nutritionIsCountable(record) {
    const calories = record.calories ?? null;
    const status = record.nutritionStatus ?? "complete";
    if (status === "fasted") {
      return calories === 0;
    }
    return status === "complete" && calories !== null && calories >= 0;
  }
  function weightTrend(values, alpha = DEFAULT_ENGINE_CONFIG.trendAlpha) {
    if (!(alpha > 0 && alpha <= 1)) {
      throw new Error("alpha must be greater than 0 and no greater than 1");
    }
    const result = [];
    let previous = null;
    for (const value of values) {
      if (value !== null && value !== void 0) {
        previous = previous === null ? value : alpha * value + (1 - alpha) * previous;
      }
      result.push(previous);
    }
    return result;
  }
  function linearSlope(points) {
    if (points.length < 2) {
      return null;
    }
    const origin = points[0][0];
    const xs = points.map(([day]) => diffDays(day, origin));
    const ys = points.map(([, value]) => value);
    const xMean = fmean(xs);
    const yMean = fmean(ys);
    const denominator = naiveSum(xs.map((x) => (x - xMean) ** 2));
    if (denominator === 0) {
      return null;
    }
    const numerator = naiveSum(xs.map((x, index) => (x - xMean) * (ys[index] - yMean)));
    return numerator / denominator;
  }
  function periodCoverage(records, start, end) {
    const period = records.filter((record) => diffDays(record.day, start) >= 0 && diffDays(end, record.day) >= 0);
    return {
      nutritionDays: period.filter((record) => nutritionIsCountable(record)).length,
      weightDays: period.filter((record) => (record.weightKg ?? null) !== null).length
    };
  }
  function coverageExplanation(records, config = DEFAULT_ENGINE_CONFIG) {
    if (records.length === 0) {
      return { enough: false, reasons: ["No daily records are available."], nutritionDays: 0, weightDays: 0 };
    }
    const first = records[0].day;
    const last = records[records.length - 1].day;
    if (diffDays(last, first) + 1 < config.minimumHistoryDays) {
      return {
        enough: false,
        reasons: ["More history is required before updating expenditure."],
        nutritionDays: 0,
        weightDays: 0
      };
    }
    const lastWeekStart = addDays(last, -(config.coverageWindowDays - 1));
    const previousWeekEnd = addDays(lastWeekStart, -1);
    const previousWeekStart = addDays(previousWeekEnd, -(config.coverageWindowDays - 1));
    const current = periodCoverage(records, lastWeekStart, last);
    const previous = periodCoverage(records, previousWeekStart, previousWeekEnd);
    const reasons = [];
    if (current.nutritionDays < config.minimumNutritionDaysPerWeek || previous.nutritionDays < config.minimumNutritionDaysPerWeek) {
      reasons.push("Nutrition logging is below the 6-of-7-day update gate.");
    }
    if (current.weightDays < config.minimumWeightDaysPerWeek || previous.weightDays < config.minimumWeightDaysPerWeek) {
      reasons.push("At least one weigh-in is required in each seven-day period.");
    }
    return {
      enough: reasons.length === 0,
      reasons,
      nutritionDays: current.nutritionDays + previous.nutritionDays,
      weightDays: current.weightDays + previous.weightDays
    };
  }
  function estimateExpenditure(records, previousEstimateKcal = null, config = DEFAULT_ENGINE_CONFIG) {
    const ordered = sortedRecords(records);
    if (ordered.length === 0) {
      return {
        state: "holding",
        confidence: "holding",
        estimateKcal: previousEstimateKcal,
        rawEstimateKcal: null,
        previousEstimateKcal,
        trendSlopeKgPerWeek: null,
        nutritionDays: 0,
        weightDays: 0,
        windowStart: null,
        windowEnd: null,
        explanation: "No records are available."
      };
    }
    const { enough, reasons } = coverageExplanation(ordered, config);
    const end = ordered[ordered.length - 1].day;
    const start = maxDay(ordered[0].day, addDays(end, -(config.coverageWindowDays * 2 - 1)));
    const inWindow = (day) => diffDays(day, start) >= 0 && diffDays(end, day) >= 0;
    const window = ordered.filter((record) => inWindow(record.day));
    const countable = window.filter((record) => nutritionIsCountable(record));
    const nutritionDays = countable.length;
    const weightDays = window.filter((record) => (record.weightKg ?? null) !== null).length;
    const trendValues = weightTrend(
      ordered.map((record) => record.weightKg ?? null),
      config.trendAlpha
    );
    const trendPoints = [];
    ordered.forEach((record, index) => {
      const trend = trendValues[index] ?? null;
      if (inWindow(record.day) && trend !== null) {
        trendPoints.push([record.day, trend]);
      }
    });
    const slopePerDay = linearSlope(trendPoints);
    const slopePerWeek = slopePerDay === null ? null : slopePerDay * 7;
    let raw = null;
    if (enough && countable.length > 0 && slopePerDay !== null) {
      const calories = countable.map((record) => record.calories).filter((value) => value !== null && value !== void 0);
      raw = clamp(
        fmean(calories) - slopePerDay * config.kcalPerKg,
        config.minimumExpenditureKcal,
        config.maximumExpenditureKcal
      );
    }
    if (raw === null) {
      return {
        state: "holding",
        // "holding" only when there is nothing to carry forward; otherwise the
        // carried-forward number is real, just no longer freshly evidenced.
        confidence: previousEstimateKcal === null ? "holding" : "low",
        estimateKcal: previousEstimateKcal,
        rawEstimateKcal: null,
        previousEstimateKcal,
        trendSlopeKgPerWeek: slopePerWeek,
        nutritionDays,
        weightDays,
        windowStart: start,
        windowEnd: end,
        explanation: reasons.length > 0 ? reasons.join(" ") : "A trend slope and complete intake coverage are required."
      };
    }
    const estimate = previousEstimateKcal === null ? raw : previousEstimateKcal + clamp(
      raw - previousEstimateKcal,
      -config.maximumExpenditureStepKcal,
      config.maximumExpenditureStepKcal
    );
    const spanDays = diffDays(end, ordered[0].day) + 1;
    let confidence;
    if (spanDays >= 28 && nutritionDays >= 12 && weightDays >= 4) {
      confidence = "high";
    } else if (spanDays >= 14) {
      confidence = "medium";
    } else {
      confidence = "low";
    }
    return {
      state: "updating",
      confidence,
      estimateKcal: pyRound(estimate, 1),
      rawEstimateKcal: pyRound(raw, 1),
      previousEstimateKcal,
      trendSlopeKgPerWeek: slopePerWeek === null ? null : pyRound(slopePerWeek, 4),
      nutritionDays,
      weightDays,
      windowStart: start,
      windowEnd: end,
      explanation: "Expenditure updated from logged intake and smoothed weight trend."
    };
  }
  var ACTIVITY_FACTORS = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    high: 1.725,
    very_high: 1.9
  };
  function initialExpenditureKcal({
    weightKg,
    heightCm,
    ageYears,
    sex = "unspecified",
    activityLevel = "moderate",
    bodyFatPct = null
  }) {
    let bmr;
    if (bodyFatPct !== null && bodyFatPct !== void 0 && bodyFatPct >= 2 && bodyFatPct <= 70) {
      const leanMass = weightKg * (1 - bodyFatPct / 100);
      bmr = 370 + 21.6 * leanMass;
    } else if (sex === "male") {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * ageYears + 5;
    } else if (sex === "female") {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * ageYears - 161;
    } else {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * ageYears - 78;
    }
    const factor = ACTIVITY_FACTORS[activityLevel] ?? ACTIVITY_FACTORS["moderate"];
    return pyRound(Math.max(1e3, bmr * factor), 1);
  }
  function calorieTarget(expenditureKcal, targetRateKgPerWeek, config = DEFAULT_ENGINE_CONFIG) {
    return pyRound(expenditureKcal + targetRateKgPerWeek * config.kcalPerKg / 7, 1);
  }
  function macroTargets(calories, bodyWeightKg, proteinGPerKg = DEFAULT_ENGINE_CONFIG.defaultProteinGPerKg, fatGPerKg = DEFAULT_ENGINE_CONFIG.defaultFatGPerKg) {
    const protein = Math.max(0, bodyWeightKg * proteinGPerKg);
    const fat = Math.max(0, bodyWeightKg * fatGPerKg);
    const remaining = calories - protein * 4 - fat * 9;
    const carbs = Math.max(0, remaining / 4);
    return {
      calories: pyRound(calories, 1),
      proteinG: pyRound(protein, 1),
      carbsG: pyRound(carbs, 1),
      fatG: pyRound(fat, 1),
      macroCalories: pyRound(protein * 4 + carbs * 4 + fat * 9, 1)
    };
  }
  function weeklyCheckIn(records, {
    previousExpenditureKcal,
    bodyWeightKg,
    targetRateKgPerWeek,
    proteinGPerKg = DEFAULT_ENGINE_CONFIG.defaultProteinGPerKg,
    fatGPerKg = DEFAULT_ENGINE_CONFIG.defaultFatGPerKg,
    config = DEFAULT_ENGINE_CONFIG
  }) {
    const estimate = estimateExpenditure(records, previousExpenditureKcal, config);
    const modules = [];
    if (estimate.state === "holding") {
      if (estimate.nutritionDays < config.minimumNutritionDaysPerWeek * 2) {
        modules.push({ key: "partial_logging", action: "review incomplete nutrition days" });
      }
      if (estimate.weightDays < config.minimumWeightDaysPerWeek * 2) {
        modules.push({ key: "weigh_in", action: "add a weigh-in for each seven-day period" });
      }
      modules.push({ key: "logging_break", action: "carry forward the last high-confidence estimate" });
      return {
        status: "held",
        estimate,
        modules,
        targets: null,
        explanation: estimate.explanation
      };
    }
    if (estimate.estimateKcal === null) {
      throw new Error("An updating expenditure estimate must carry a value");
    }
    const calories = calorieTarget(estimate.estimateKcal, targetRateKgPerWeek, config);
    const targets = macroTargets(calories, bodyWeightKg, proteinGPerKg, fatGPerKg);
    modules.push({
      key: "program_update",
      action: "review and accept the proposed calorie and macro targets"
    });
    return {
      status: "ready",
      estimate,
      modules,
      targets,
      explanation: "The next target uses observed expenditure and the signed goal rate; it does not punish or average in unlogged days."
    };
  }

  // ../../../../packages/nutrition-engine/src/defects.ts
  var ENGINE_DEFECTS = [
    {
      id: "ewma-gap-carry-flattens-slope",
      problem: "weightTrend repeats the last weight across days with no weigh-in, and the least-squares fit reads those flat runs as real measurements.",
      consequence: "The reported drift understates the real one \u2014 roughly fourfold in the sparse_weight_updates fixture (-0.072 kg/wk reported against -0.28 actual). Expenditure is mean intake minus slope times 7700, so a flattened slope understates expenditure and hands the athlete a LOWER calorie target than the maths intends. The error is worst exactly when weigh-ins are sparsest.",
      surfacesAt: "Coach screen \u2014 coverage ring plus a sentence naming the direction of the harm.",
      shownToAthlete: true
    },
    {
      id: "macro-targets-can-overshoot-calories",
      problem: "macroTargets floors carbohydrate at zero when protein and fat already exceed the calorie target, and returns the overshoot with no flag.",
      consequence: "The athlete can be shown a target whose macros add up to more energy than its own calorie figure \u2014 the two numbers cannot both be met, and nothing in the return value says so.",
      surfacesAt: "Check-in screen \u2014 the contradiction is printed with its cause and the two real remedies; accept stays enabled.",
      shownToAthlete: true
    },
    {
      id: "holding-claims-high-confidence-it-never-tracked",
      problem: "The holding path carries forward `previousEstimateKcal` whatever its confidence was, while the contract text promises the last HIGH-CONFIDENCE estimate. No confidence is recorded alongside the carried value.",
      consequence: "A low-confidence estimate can be carried indefinitely while the explanation implies it was a good one.",
      surfacesAt: "engine.ts estimateExpenditure, holding branch.",
      shownToAthlete: false
    },
    {
      id: "coverage-counts-computed-then-discarded",
      problem: "estimateExpenditure binds the coverage gates from coverageExplanation and never reads them; the reported day counts come from the wider window instead. Worse, coverageExplanation returns 0/0 counts on its two early-return paths even when records exist.",
      consequence: 'Dead values today, and a trap tomorrow: the first caller to actually use that return value gets a false "no coverage" for an athlete who has been logging.',
      surfacesAt: "engine.ts estimateExpenditure and coverageExplanation.",
      shownToAthlete: false
    },
    {
      id: "check-in-thresholds-assume-a-seven-day-window",
      problem: "weeklyCheckIn compares window-derived counts against the minimum-per-week values doubled, which only lines up because the analysis window happens to be twice coverageWindowDays.",
      consequence: "Change coverageWindowDays and the partial-logging and weigh-in modules fire incorrectly \u2014 visible in the short_window_gate config fixture.",
      surfacesAt: "engine.ts weeklyCheckIn.",
      shownToAthlete: false
    },
    {
      id: "carried-estimate-is-unrounded",
      problem: "The holding branch returns estimateKcal unrounded while the updating branch rounds to one decimal place.",
      consequence: "A carried-forward number can display more precision than a freshly computed one, implying more certainty rather than less.",
      surfacesAt: "engine.ts estimateExpenditure.",
      shownToAthlete: false
    }
  ];
  return __toCommonJS(nutrition_entry_exports);
})();
