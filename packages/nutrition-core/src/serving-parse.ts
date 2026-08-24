import type { CachedFood, FoodServing } from './types';
import { loggableUnits } from './recipe';

/*
 * Parse a product's serving-size text into an explicit mass/volume conversion,
 * then pick a safe default log quantity.
 *
 * THE RULE (same as recipe.ts): never guess density. "serving" is only offered
 * when the source text states grams or millilitres that match the food's own
 * basis unit. Otherwise the caller logs in that basis unit (typically g).
 */

export interface ParsedServingAmount {
  /** Amount in the normalised unit (`g` or `ml`). */
  amount: number;
  unit: 'g' | 'ml';
}

export interface DefaultLogQuantity {
  /** Food with any synthesised serving rows attached. */
  food: CachedFood;
  quantity: number;
  unit: string;
}

const DECIMAL = String.raw`(?:\d+(?:[.,]\d+)?|\d*[.,]\d+)`;
const AMOUNT_UNIT = new RegExp(`(${DECIMAL})\\s*(kg|mg|ml|g|l)\\b`, 'i');

function toNumber(raw: string): number | null {
  const n = Number(String(raw).replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function normaliseAmount(qty: number, unit: string): ParsedServingAmount | null {
  const u = unit.toLowerCase();
  if (u === 'g') return { amount: qty, unit: 'g' };
  if (u === 'mg') return { amount: qty / 1000, unit: 'g' };
  if (u === 'kg') return { amount: qty * 1000, unit: 'g' };
  if (u === 'ml') return { amount: qty, unit: 'ml' };
  if (u === 'l') return { amount: qty * 1000, unit: 'ml' };
  return null;
}

/**
 * Extract an explicit mass or volume from serving-size text.
 *
 * Prefer a parenthesised amount when present ("2 biscuits (25 g)"), otherwise
 * the first measurable amount on the string ("25 g", "Per 100 g"). Returns
 * null when nothing measurable is stated — never invents a density.
 */
export function parseServingSizeText(text: string | null | undefined): ParsedServingAmount | null {
  if (text == null) return null;
  const raw = String(text).trim();
  if (!raw) return null;
  const paren = /\(([^)]*)\)/.exec(raw);
  const outside = raw.replace(/\([^)]*\)/g, ' ');
  const match =
    (paren ? AMOUNT_UNIT.exec(paren[1]) : null) ?? AMOUNT_UNIT.exec(outside);
  if (!match) return null;
  const qty = toNumber(match[1]);
  if (qty == null) return null;
  return normaliseAmount(qty, match[2]);
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

/**
 * Attach a `serving` row when `servingSizeText` states grams/ml that match the
 * food's basis unit and no such row already exists.
 *
 * Macros stay on the food's stored basis (usually per 100 g). The new row only
 * records the conversion so `resolveFoodMacros(..., 1, 'serving')` can scale
 * without guessing.
 */
export function enrichFoodServings(food: CachedFood): CachedFood {
  if (hasExplicitServingConversion(food)) return food;
  const parsed = parseServingSizeText(food.servingSizeText);
  if (!parsed) return food;
  const basis = food.servingUnit.toLowerCase();
  if (parsed.unit !== basis) return food;

  const row: FoodServing = {
    id: `${food.id}-parsed-serving`,
    foodId: food.id,
    label: String(food.servingSizeText || 'serving').trim() || 'serving',
    quantity: 1,
    unit: 'serving',
    grams: parsed.unit === 'g' ? parsed.amount : null,
    millilitres: parsed.unit === 'ml' ? parsed.amount : null,
    isDefault: true,
    sortOrder: 0,
  };
  return { ...food, servings: [...(food.servings || []), row] };
}

/**
 * Choose quantity + unit for a one-tap log (barcode / search Log).
 *
 * Prefer one `serving` when an explicit g/ml conversion exists; otherwise fall
 * back to the food's own unit. Prefer the parsed serving amount as the gram
 * quantity when logging in grams so "25 g per serving" becomes 25 g, not 100 g.
 */
export function pickDefaultLogQuantity(food: CachedFood): DefaultLogQuantity {
  const enriched = enrichFoodServings(food);
  const units = loggableUnits(enriched, enriched.servings || []);
  const servingKey = Object.keys(units).find((k) => k.toLowerCase() === 'serving');
  if (servingKey != null) {
    return { food: enriched, quantity: units[servingKey], unit: servingKey };
  }

  const basis = food.servingUnit;
  const parsed = parseServingSizeText(food.servingSizeText);
  if (parsed && parsed.unit === basis.toLowerCase()) {
    return { food: enriched, quantity: parsed.amount, unit: basis };
  }

  const qty = units[basis] ?? (Number.isFinite(food.servingQty) && food.servingQty > 0 ? food.servingQty : 100);
  return { food: enriched, quantity: qty, unit: basis };
}
