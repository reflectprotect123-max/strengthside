import type { CachedFood, FoodServing } from './types';
import { loggableUnits } from './recipe';

/*
 * Parse every serving-size shape we can turn into an EXPLICIT mass/volume
 * conversion — never invent density.
 *
 * Sources, in order:
 *   1. Structured fields (Open Food Facts serving_quantity + unit)
 *   2. Parenthesised mass/volume in serving-size text ("3 slices (18 g)")
 *   3. Bare mass/volume on the text ("25 g", "250 ml", "37.5g")
 *
 * Household words (slice, tbsp, can…) become loggable units ONLY when the
 * source also states grams/ml for that count.
 */

export interface ParsedServingAmount {
  /** Amount in the normalised unit (`g` or `ml`). */
  amount: number;
  unit: 'g' | 'ml';
}

export interface HouseholdServing {
  /** Singular household unit name, e.g. slice, tbsp, can. */
  unit: string;
  /** How many of that unit the pack serving describes. */
  count: number;
  /** Total mass/volume for `count` units. */
  total: ParsedServingAmount;
}

export interface ServingSizeFields {
  servingSizeText?: string | null;
  servingQuantity?: number | string | null;
  servingQuantityUnit?: string | null;
}

export interface DefaultLogQuantity {
  /** Food with any synthesised serving rows attached. */
  food: CachedFood;
  quantity: number;
  unit: string;
}

const DECIMAL = String.raw`(?:\d+(?:[.,]\d+)?|\d*[.,]\d+)`;
/** Mass/volume tokens — oz/fl oz are fixed conversions, not density guesses. */
const UNIT_TOKEN = String.raw`fl\.?\s*oz|floz|fluid\s*ounces?|ounces?|oz|kg|mg|ml|cl|g|l`;
const AMOUNT_UNIT = new RegExp(`(${DECIMAL})\\s*(${UNIT_TOKEN})\\b`, 'i');
const HOUSEHOLD_HEAD = new RegExp(
  `^\\s*(${DECIMAL})\\s+([a-zA-Z][a-zA-Z./\\-]{0,24})\\b`,
  'i',
);

function toNumber(raw: string | number | null | undefined): number | null {
  if (raw == null || raw === '') return null;
  const n = typeof raw === 'number' ? raw : Number(String(raw).replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Normalise a stated mass or volume into g or ml.
 * Refuses household/volume-for-solids units (cup, tbsp alone) — those need a
 * gram figure from the source.
 */
export function normaliseAmount(qty: number, unit: string): ParsedServingAmount | null {
  if (!(qty > 0) || !Number.isFinite(qty)) return null;
  const u = String(unit || '')
    .trim()
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/\s+/g, ' ');
  if (u === 'g' || u === 'gram' || u === 'grams') return { amount: qty, unit: 'g' };
  if (u === 'mg' || u === 'milligram' || u === 'milligrams') return { amount: qty / 1000, unit: 'g' };
  if (u === 'kg' || u === 'kilogram' || u === 'kilograms') return { amount: qty * 1000, unit: 'g' };
  if (u === 'oz' || u === 'ounce' || u === 'ounces') return { amount: qty * 28.349523125, unit: 'g' };
  if (u === 'lb' || u === 'lbs' || u === 'pound' || u === 'pounds') return { amount: qty * 453.59237, unit: 'g' };
  if (u === 'ml' || u === 'millilitre' || u === 'millilitres' || u === 'milliliter' || u === 'milliliters') {
    return { amount: qty, unit: 'ml' };
  }
  if (u === 'cl' || u === 'centilitre' || u === 'centilitres') return { amount: qty * 10, unit: 'ml' };
  if (u === 'l' || u === 'liter' || u === 'litre' || u === 'liters' || u === 'litres') {
    return { amount: qty * 1000, unit: 'ml' };
  }
  if (u === 'fl oz' || u === 'floz' || u === 'fluid ounce' || u === 'fluid ounces') {
    return { amount: qty * 29.5735295625, unit: 'ml' };
  }
  return null;
}

function singularHousehold(raw: string): string | null {
  let w = String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/\./g, '');
  if (!w || w.length > 24) return null;
  // Synonyms → stable unit chips
  const aliases: Record<string, string> = {
    tablespoon: 'tbsp',
    tablespoons: 'tbsp',
    tbsp: 'tbsp',
    tblsp: 'tbsp',
    tbs: 'tbsp',
    teaspoon: 'tsp',
    teaspoons: 'tsp',
    tsp: 'tsp',
    serving: 'serving',
    servings: 'serving',
    portion: 'portion',
    portions: 'portion',
    slice: 'slice',
    slices: 'slice',
    biscuit: 'biscuit',
    biscuits: 'biscuit',
    cookie: 'cookie',
    cookies: 'cookie',
    piece: 'piece',
    pieces: 'piece',
    bar: 'bar',
    bars: 'bar',
    can: 'can',
    cans: 'can',
    bottle: 'bottle',
    bottles: 'bottle',
    cup: 'cup',
    cups: 'cup',
    row: 'row',
    rows: 'row',
    pack: 'pack',
    packs: 'pack',
    pouch: 'pouch',
    pouches: 'pouch',
  };
  if (aliases[w]) return aliases[w];
  if (/^[a-z][a-z/-]*$/.test(w)) {
    if (w.endsWith('ies') && w.length > 4) return `${w.slice(0, -3)}y`;
    if (w.endsWith('sses')) return w.slice(0, -2);
    if (w.endsWith('s') && !w.endsWith('ss') && w.length > 3) return w.slice(0, -1);
    return w;
  }
  return null;
}

/**
 * Extract an explicit mass or volume from serving-size text.
 *
 * Prefer a parenthesised amount when present ("2 biscuits (25 g)"), otherwise
 * the first measurable amount on the string ("25 g", "Per 100 g", "37.5g").
 */
export function parseServingSizeText(text: string | null | undefined): ParsedServingAmount | null {
  if (text == null) return null;
  const raw = String(text).trim();
  if (!raw) return null;
  const paren = /\(([^)]*)\)/.exec(raw);
  const outside = raw.replace(/\([^)]*\)/g, ' ');
  const match =
    (paren ? AMOUNT_UNIT.exec(paren[1]) : null) ?? AMOUNT_UNIT.exec(outside) ?? AMOUNT_UNIT.exec(raw);
  if (!match) return null;
  const qty = toNumber(match[1]);
  if (qty == null) return null;
  return normaliseAmount(qty, match[2]);
}

/**
 * "3 slices (18 g)" / "1 can (250 ml)" / "1 tblsp (25 g)" → household + total mass.
 * Returns null when the household count is present but no measurable mass/volume.
 */
export function parseHouseholdServing(text: string | null | undefined): HouseholdServing | null {
  if (text == null) return null;
  const raw = String(text).trim();
  if (!raw) return null;
  const head = HOUSEHOLD_HEAD.exec(raw.replace(/\([^)]*\)/g, ' ').trim()) ?? HOUSEHOLD_HEAD.exec(raw);
  if (!head) return null;
  const count = toNumber(head[1]);
  const unit = singularHousehold(head[2]);
  if (count == null || !unit) return null;
  // Skip if the "household" word was actually a mass unit ("50 g")
  if (normaliseAmount(1, unit)) return null;
  const total = parseServingSizeText(raw);
  if (!total) return null;
  return { unit, count, total };
}

/**
 * Resolve a pack serving amount from OFF structured fields and/or text.
 * Structured quantity wins when it normalises; text fills the gap.
 */
export function resolveServingAmount(fields: ServingSizeFields): ParsedServingAmount | null {
  const qty = toNumber(fields.servingQuantity ?? null);
  const unit = fields.servingQuantityUnit != null ? String(fields.servingQuantityUnit) : '';
  if (qty != null && unit) {
    const fromFields = normaliseAmount(qty, unit);
    if (fromFields) return fromFields;
  }
  return parseServingSizeText(fields.servingSizeText);
}

function hasExplicitServingConversion(food: CachedFood): boolean {
  const basis = food.servingUnit.toLowerCase();
  return (food.servings || []).some((s) => {
    if (s.unit.toLowerCase() !== 'serving') return false;
    if (basis === 'g') return s.grams != null && Number.isFinite(s.grams) && s.grams > 0;
    if (basis === 'ml') return s.millilitres != null && Number.isFinite(s.millilitres) && s.millilitres > 0;
    return false;
  });
}

function hasUnit(food: CachedFood, unit: string): boolean {
  return (food.servings || []).some((s) => s.unit.toLowerCase() === unit.toLowerCase());
}

/**
 * Attach serving (+ optional household) rows when source data states grams/ml
 * that match the food's basis unit.
 */
export function enrichFoodServings(
  food: CachedFood,
  fields?: ServingSizeFields,
): CachedFood {
  const basis = food.servingUnit.toLowerCase();
  const text = fields?.servingSizeText ?? food.servingSizeText;
  const resolved =
    resolveServingAmount({
      servingSizeText: text,
      servingQuantity: fields?.servingQuantity,
      servingQuantityUnit: fields?.servingQuantityUnit,
    }) ?? parseServingSizeText(text);

  const rows: FoodServing[] = [...(food.servings || [])];
  let changed = false;

  if (resolved && resolved.unit === basis && !hasExplicitServingConversion(food)) {
    rows.push({
      id: `${food.id}-parsed-serving`,
      foodId: food.id,
      label: String(text || `${resolved.amount} ${resolved.unit}`).trim() || 'serving',
      quantity: 1,
      unit: 'serving',
      grams: resolved.unit === 'g' ? resolved.amount : null,
      millilitres: resolved.unit === 'ml' ? resolved.amount : null,
      isDefault: true,
      sortOrder: 0,
    });
    changed = true;
  }

  const household = parseHouseholdServing(text);
  if (
    household &&
    household.total.unit === basis &&
    household.unit !== 'serving' &&
    !hasUnit({ ...food, servings: rows }, household.unit)
  ) {
    const perOne = household.total.amount / household.count;
    if (perOne > 0 && Number.isFinite(perOne)) {
      rows.push({
        id: `${food.id}-parsed-${household.unit}`,
        foodId: food.id,
        label: `1 ${household.unit}`,
        quantity: 1,
        unit: household.unit,
        grams: household.total.unit === 'g' ? perOne : null,
        millilitres: household.total.unit === 'ml' ? perOne : null,
        isDefault: false,
        sortOrder: 1,
      });
      changed = true;
    }
  }

  return changed ? { ...food, servings: rows, servingSizeText: text ?? food.servingSizeText } : food;
}

/**
 * Choose quantity + unit for a barcode / search log.
 *
 * Prefers the food's basis unit (usually grams) with the pack serving amount.
 * Unit "serving" / "slice" / etc. stay available in loggableUnits when conversions exist.
 */
export function pickDefaultLogQuantity(
  food: CachedFood,
  fields?: ServingSizeFields,
): DefaultLogQuantity {
  const enriched = enrichFoodServings(food, fields);
  const basis = food.servingUnit;
  const basisKey = basis.toLowerCase();
  const units = loggableUnits(enriched, enriched.servings || []);

  const parsed =
    resolveServingAmount({
      servingSizeText: fields?.servingSizeText ?? food.servingSizeText,
      servingQuantity: fields?.servingQuantity,
      servingQuantityUnit: fields?.servingQuantityUnit,
    }) ?? parseServingSizeText(food.servingSizeText);

  if (parsed && parsed.unit === basisKey) {
    return { food: enriched, quantity: parsed.amount, unit: basis };
  }

  const servingRow = (enriched.servings || []).find((s) => s.unit.toLowerCase() === 'serving');
  if (servingRow) {
    const amount =
      basisKey === 'g' ? servingRow.grams : basisKey === 'ml' ? servingRow.millilitres : null;
    if (amount != null && Number.isFinite(amount) && amount > 0) {
      return { food: enriched, quantity: amount, unit: basis };
    }
  }

  const qty =
    units[basis] ?? (Number.isFinite(food.servingQty) && food.servingQty > 0 ? food.servingQty : 100);
  return { food: enriched, quantity: qty, unit: basis };
}
